class CircuitCache {
    constructor(defaultTTL = 60 * 1000, options = {}) {
        this.defaultTTL = defaultTTL;
        this.cache = new Map();
        this.cleanupIntervalId = null;

        // How long an expired entry is kept around after expiry so it can
        // still be served as "stale" data before it's hard-purged. This is
        // what powers the stale-while-revalidate flow in CircuitService and
        // stops the frontend from ever seeing a blank page.
        this.staleGracePeriod = options.staleGracePeriod ?? 30 * 60 * 1000; // 30 minutes

        if (options.cleanupInterval) {
            this.startCleanupInterval(options.cleanupInterval);
        }
    }

    /**
     * Save data.
     * Preserves the original createdAt on updates (so age reflects when the
     * data was first cached), and tracks updatedAt separately.
     */
    set(key, data, ttl = this.defaultTTL) {
        const existing = this.cache.get(key);
        const now = Date.now();

        this.cache.set(key, {
            data,
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now,
            expiresAt: now + ttl
        });

        return data;
    }

    /**
     * Get cached data — FRESH ONLY.
     * Returns null once the entry has expired, but (unlike before) does NOT
     * delete the entry. Expired data stays available via getStale().
     */
    get(key) {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() >= entry.expiresAt) {
            return null;
        }

        return entry.data;
    }

    /**
     * Get cached data regardless of freshness — used to serve stale data
     * while a background refresh is in flight, or as a fallback when a
     * fresh fetch fails.
     */
    getStale(key) {
        const entry = this.cache.get(key);
        return entry ? entry.data : null;
    }

    /**
     * Full metadata for an entry (createdAt/updatedAt/expiresAt/isExpired),
     * without exposing the raw internal map entry.
     */
    getEntryMeta(key) {
        const entry = this.cache.get(key);

        if (!entry) return null;

        return {
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            expiresAt: entry.expiresAt,
            isExpired: Date.now() >= entry.expiresAt
        };
    }

    /**
     * Cache exists AND is fresh?
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Cache exists at all (fresh or stale)?
     */
    hasStale(key) {
        return this.cache.has(key);
    }

    /**
     * Remove one cache entry
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }

    /**
     * Cache age
     */
    getAge(key) {
        const entry = this.cache.get(key);

        if (!entry) return null;

        return Date.now() - entry.createdAt;
    }

    /**
     * Remaining time
     */
    getRemainingTime(key) {
        const entry = this.cache.get(key);

        if (!entry) return 0;

        return Math.max(0, entry.expiresAt - Date.now());
    }

    /**
     * Cache expired?
     */
    isExpired(key) {
        const entry = this.cache.get(key);

        if (!entry) return true;

        return Date.now() >= entry.expiresAt;
    }

    /**
     * Refresh an entry's expiry window from now, without touching its data.
     * Returns true if the entry existed and was refreshed.
     */
    touch(key, ttl = this.defaultTTL) {
        const entry = this.cache.get(key);

        if (!entry) return false;

        entry.expiresAt = Date.now() + ttl;
        return true;
    }

    /**
     * Update the TTL of an existing entry (relative to now).
     * Returns true if the entry existed and was updated.
     */
    updateTTL(key, ttl) {
        const entry = this.cache.get(key);

        if (!entry) return false;

        entry.expiresAt = Date.now() + ttl;
        return true;
    }

    /**
     * All keys currently stored (fresh or stale, not yet hard-purged)
     */
    keys() {
        this.cleanupExpired();
        return Array.from(this.cache.keys());
    }

    /**
     * All values currently stored (raw data, not internal wrapper entries)
     */
    values() {
        this.cleanupExpired();
        return Array.from(this.cache.values()).map((entry) => entry.data);
    }

    /**
     * All [key, data] pairs currently stored
     */
    entries() {
        this.cleanupExpired();
        return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.data]);
    }

    /**
     * Number of entries currently stored
     */
    size() {
        this.cleanupExpired();
        return this.cache.size;
    }

    /**
     * Hard-purge entries that have been expired for longer than the stale
     * grace period. This intentionally does NOT remove an entry the moment
     * it expires — expired-but-recent entries are kept so they can still be
     * served as stale data. Returns the count removed.
     */
    cleanupExpired() {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.expiresAt >= this.staleGracePeriod) {
                this.cache.delete(key);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Start a periodic background sweep that hard-purges very old,
     * long-expired entries. Safe to call multiple times (restarts the
     * interval).
     */
    startCleanupInterval(intervalMs = 60 * 1000) {
        this.stopCleanupInterval();

        this.cleanupIntervalId = setInterval(() => {
            this.cleanupExpired();
        }, intervalMs);

        // Don't let the interval keep the process alive (Node only)
        if (this.cleanupIntervalId?.unref) {
            this.cleanupIntervalId.unref();
        }

        return this.cleanupIntervalId;
    }

    /**
     * Stop the periodic cleanup sweep, if running.
     */
    stopCleanupInterval() {
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
        }
    }

    /**
     * Cache statistics
     */
    getStats() {
        const stats = [];

        for (const [key, value] of this.cache.entries()) {
            stats.push({
                key,
                age: Date.now() - value.createdAt,
                remaining: Math.max(
                    0,
                    value.expiresAt - Date.now()
                ),
                expired: Date.now() >= value.expiresAt
            });
        }

        return {
            totalEntries: this.cache.size,
            entries: stats
        };
    }

    /**
     * Stop any running timers and clear all cached data.
     * Use when tearing down the cache instance.
     */
    destroy() {
        this.stopCleanupInterval();
        this.cache.clear();
    }
}

const circuitCache = new CircuitCache();

export default circuitCache;