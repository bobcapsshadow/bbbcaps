import axios from "axios";
import circuitCache from "../utils/circuitCache.js";
import {
    normalizeStocks,
    buildStockMap,
    buildSymbolSet,
    findStock,
    hasStock,
    validateResponse,
} from "../utils/circuitParser.js";

// =========================================
// Configuration constants
// =========================================
const CACHE_TTL = 60 * 1000; // 60 seconds
const REQUEST_TIMEOUT = 15000;
const MAX_RETRIES = 3;
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";
const BASE_URL = "https://www.nseindia.com";
const CIRCUIT_ENDPOINT = "/api/live-analysis-price-band-hitter";

const LOG_PREFIX = "[CircuitService]";

class CircuitService {
    constructor(options = {}) {
        this.baseURL = BASE_URL;

        // ---- Cache is now fully delegated to circuitCache (single source of truth) ----
        this.CACHE_TTL = options.cacheTTL || CACHE_TTL;

        // ---- Request timeout is configurable (defaults preserved) ----
        this.requestTimeout = options.requestTimeout || REQUEST_TIMEOUT;
        this.maxRetries = options.maxRetries || MAX_RETRIES;

        // ---- Fast lookup structures (built after every successful fetch) ----
        this.upperStocksMap = new Map();
        this.lowerStocksMap = new Map();
        this.upperSymbolsSet = new Set();
        this.lowerSymbolsSet = new Set();

        // ---- Request de-duplication (single in-flight request per type) ----
        // Shared by both blocking fetches and background refreshes, so we
        // never fire two simultaneous NSE requests for the same type.
        this.pendingRequests = {
            upper: null,
            lower: null,
            both: null,
        };

        // ---- Session state ----
        this.cookie = "";
        this.sessionActive = false;
        this.sessionInitializedAt = null;

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.requestTimeout,
            headers: {
                "User-Agent": USER_AGENT,
                Accept: "application/json, text/plain, */*",
                "Accept-Language": "en-US,en;q=0.9",
                Referer: "https://www.nseindia.com/",
                Origin: "https://www.nseindia.com",
                Connection: "keep-alive",
            },
        });
    }

    // =========================================
    // Logging helpers
    // =========================================

    _logInfo(message) {
        console.log(`${LOG_PREFIX} ${message}`);
    }

    _logError(message) {
        console.error(`${LOG_PREFIX} ${message}`);
    }

    // =========================================
    // Cache helpers (delegated to circuitCache)
    // =========================================

    /**
     * Check if cache is still fresh (not expired)
     */
    isCacheValid(type) {
        return circuitCache.has(type);
    }

    /**
     * Save cache
     */
    setCache(type, data) {
        circuitCache.set(type, data, this.CACHE_TTL);
    }

    /**
     * Read cache (returns just the data, preserving old external contract).
     * Fresh only — returns null if expired.
     */
    getCache(type) {
        return circuitCache.get(type);
    }

    /**
     * Read cache regardless of freshness. Used for the never-blank-page /
     * stale-while-revalidate fallback.
     */
    getStaleCache(type) {
        return circuitCache.getStale(type);
    }

    /**
     * Remove a single cache entry
     */
    _invalidateCache(type) {
        circuitCache.delete(type);
    }

    /**
     * Clear all caches, indexes and pending requests
     */
    clearCache() {
        circuitCache.clear();
        this.upperStocksMap = new Map();
        this.lowerStocksMap = new Map();
        this.upperSymbolsSet = new Set();
        this.lowerSymbolsSet = new Set();
        this.pendingRequests = { upper: null, lower: null, both: null };
        this._logInfo("Cache Cleared");
    }

    // =========================================
    // Session management
    // =========================================

    /**
     * Create NSE session & save cookies
     */
    async initializeSession() {
        try {
            const response = await this.client.get("/");

            const cookies = response.headers["set-cookie"];

            if (cookies?.length) {
                this.cookie = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
                this.client.defaults.headers.Cookie = this.cookie;
            }

            this.sessionActive = true;
            this.sessionInitializedAt = Date.now();

            this._logInfo("Session Initialized");

            return true;
        } catch (error) {
            this.sessionActive = false;
            this._logError(`Session Initialization Error: ${error.message}`);
            return false;
        }
    }

    /**
     * Ensure a session exists before making a request. Never creates
     * an unnecessary session if one is already active.
     */
    async _ensureSession() {
        if (!this.cookie || !this.sessionActive) {
            const ok = await this.initializeSession();
            if (!ok) {
                throw new Error("NSE Session Initialization Failed");
            }
        }
    }

    /**
     * Force a fresh session (used after 401/403 responses)
     */
    async _refreshSession() {
        this._logInfo("Refreshing Session");

        this.cookie = "";
        this.sessionActive = false;
        delete this.client.defaults.headers.Cookie;

        const ok = await this.initializeSession();

        if (!ok) {
            throw new Error("NSE Session Initialization Failed");
        }

        this._logInfo("Session Refreshed");
    }

    /**
     * Run a request, automatically refreshing the session and retrying
     * exactly once if the response is a 401/403.
     */
    async _requestWithSessionRetry(requestFn) {
        try {
            return await requestFn();
        } catch (error) {
            const status = error?.response?.status;

            if (status === 401 || status === 403) {
                await this._refreshSession();
                return await requestFn();
            }

            throw error;
        }
    }

    // =========================================
    // Retry helper (kept API-compatible)
    // =========================================

    /**
     * Is this a timeout-shaped error?
     */
    _isTimeoutError(error) {
        return error?.code === "ECONNABORTED" || /timeout/i.test(error?.message || "");
    }

    /**
     * Decide whether an error is worth retrying.
     * Retry: network errors (no response received), timeouts, 429, 5xx.
     * Do NOT retry: malformed/invalid NSE responses (parse errors) or any
     * other 4xx — retrying those just wastes time on a request that will
     * never succeed.
     */
    _isRetryableError(error) {
        if (!error) return false;

        if (error.isParseError) return false;

        if (this._isTimeoutError(error)) return true;

        // No response object at all => connection-level / network error
        if (!error.response) return true;

        const status = error.response.status;

        if (status === 429) return true;
        if (status >= 500 && status < 600) return true;

        return false;
    }

    /**
     * Retry helper with exponential backoff. Only retries errors classified
     * as retryable by _isRetryableError; anything else throws immediately
     * so we don't waste time retrying a request that can never succeed.
     */
    async retry(fn, retries = this.maxRetries) {
        let lastError;

        for (let i = 0; i < retries; i++) {
            try {
                const result = await fn();

                if (i > 0) {
                    this._logInfo("Retry Success");
                }

                return result;
            } catch (error) {
                lastError = error;

                if (this._isTimeoutError(error)) {
                    this._logInfo("NSE Timeout");
                }

                if (!this._isRetryableError(error)) {
                    this._logInfo(`Non-Retryable Error, Aborting Retries: ${error.message}`);
                    throw error;
                }

                if (i < retries - 1) {
                    const backoff = Math.min(1000 * 2 ** i, 8000);
                    this._logInfo(`Retry ${i + 1}/${retries} Failed: ${error.message} (backing off ${backoff}ms)`);
                    await new Promise((resolve) => setTimeout(resolve, backoff));
                } else {
                    this._logInfo(`Retry ${i + 1}/${retries} Failed: ${error.message}`);
                }
            }
        }

        throw lastError;
    }

    // =========================================
    // Fast-lookup index builders
    // =========================================

    /**
     * Build upperStocksMap/upperSymbolsSet or lowerStocksMap/lowerSymbolsSet
     * for O(1) lookups. Only applies to "upper" and "lower" types. Skips
     * rebuilding if the exact same data array reference was already indexed.
     */
    _buildIndexes(type, stocks) {
        if (type === "upper") {
            if (this._lastIndexedUpper === stocks) return;
            this.upperStocksMap = buildStockMap(stocks);
            this.upperSymbolsSet = buildSymbolSet(stocks);
            this._lastIndexedUpper = stocks;
        } else if (type === "lower") {
            if (this._lastIndexedLower === stocks) return;
            this.lowerStocksMap = buildStockMap(stocks);
            this.lowerSymbolsSet = buildSymbolSet(stocks);
            this._lastIndexedLower = stocks;
        }
    }

    // =========================================
    // Core network fetch (validated + normalized)
    // =========================================

    async _fetchFromNSE(type) {

        await this._ensureSession();

        const response = await this._requestWithSessionRetry(() =>
            this.client.get(CIRCUIT_ENDPOINT, {
                params: {
                    bandtype: type,
                    view: "AllSec",
                },
            })
        );

        const stocks = response.data?.[type]?.AllSec?.data;

        if (!Array.isArray(stocks)) {
            const invalidResponseError = new Error(`Invalid NSE response for ${type}`);
            // Flagged so the retry logic never wastes attempts retrying a
            // response shape that will never become valid.
            invalidResponseError.isParseError = true;
            throw invalidResponseError;
        }

        return normalizeStocks(stocks);
    }

    // =========================================
    // Stale-while-revalidate fetch + cache
    // =========================================

    /**
     * Fetch fresh data from NSE and update the cache. De-duplicated per
     * type: if a fetch (blocking or background) is already in flight for
     * this type, callers reuse the same in-flight Promise instead of firing
     * a second NSE request.
     *
     * On failure, falls back to whatever stale cache exists (never wipes
     * it), and only resolves to [] when there is truly nothing cached yet.
     */
    async _fetchAndCache(type, { background = false } = {}) {
        if (this.pendingRequests[type]) {
            return this.pendingRequests[type];
        }

        const requestPromise = (async () => {
            try {
                const data = await this.retry(() => this._fetchFromNSE(type));

                this.setCache(type, data);
                this._buildIndexes(type, data);

                this._logInfo(
                    `Cache Updated (${type.toUpperCase()}, ${Array.isArray(data) ? data.length : 0} stocks)`
                );

                if (background) {
                    this._logInfo(`Background Refresh Completed (${type})`);
                }

                return data;
            } catch (error) {
                this._logError(`Failed to Fetch ${type.toUpperCase()} Circuit Stocks: ${error.message}`);

                const stale = this.getStaleCache(type);

                if (stale !== null) {
                    this._logInfo(`Returning Stale Cache (${type})`);
                    return stale;
                }

                // Truly nothing cached yet — this is the only case where an
                // empty array is acceptable, since there's nothing else to
                // show the frontend.
                return [];
            } finally {
                this.pendingRequests[type] = null;
            }
        })();

        this.pendingRequests[type] = requestPromise;

        return requestPromise;
    }

    /**
     * Fire a background refresh for a type without blocking the caller.
     * No-op if a refresh/fetch is already in flight for that type.
     */
    _triggerBackgroundRefresh(type) {
        if (this.pendingRequests[type]) {
            return;
        }

        this._logInfo(`Background Refresh Started (${type})`);

        // Intentionally not awaited — this runs in the background while the
        // caller is served stale data immediately.
        this._fetchAndCache(type, { background: true }).catch((error) => {
            this._logError(`Background Refresh Error (${type}): ${error.message}`);
        });
    }

    /**
     * Fetch circuit stocks from NSE (cached, de-duplicated, validated).
     * Public signature/behavior preserved: resolves to an array.
     *
     * Cache states:
     *  - Fresh   -> return cached data immediately.
     *  - Stale   -> return cached data immediately, refresh in background.
     *  - Missing -> fetch synchronously (nothing else to show yet).
     *
     * Never returns [] when any cached data (fresh or stale) exists.
     */
    async fetchCircuitStocks(type = "upper") {
        if (this.isCacheValid(type)) {
            this._logInfo(`Cache Hit / Fresh Cache (${type})`);
            return this.getCache(type);
        }

        const staleData = this.getStaleCache(type);

        if (staleData !== null) {
            this._logInfo(`Stale Cache Used (${type})`);
            this._triggerBackgroundRefresh(type);
            return staleData;
        }

        this._logInfo(`Cache Miss (${type})`);

        return this._fetchAndCache(type, { background: false });
    }

    /**
     * Upper Circuit
     */
    async fetchUpperCircuit() {
        return await this.fetchCircuitStocks("upper");
    }

    /**
     * Lower Circuit
     */
    async fetchLowerCircuit() {
        return await this.fetchCircuitStocks("lower");
    }

    /**
     * Both
     */
    async fetchBothCircuit() {
        return await this.fetchCircuitStocks("both");
    }

    /**
     * Force-refresh helpers (bypass fresh-cache short-circuit, but still
     * fall back to stale cache on failure instead of ever destroying it).
     */
    async refreshUpperCircuit() {
        return await this._fetchAndCache("upper", { background: false });
    }

    async refreshLowerCircuit() {
        return await this._fetchAndCache("lower", { background: false });
    }

    // =========================================
    // Symbol getters (O(1) via Sets, built during fetch)
    // =========================================

    async getUpperCircuitSymbols() {
        await this.fetchUpperCircuit();
        return Array.from(this.upperSymbolsSet);
    }

    async getLowerCircuitSymbols() {
        await this.fetchLowerCircuit();
        return Array.from(this.lowerSymbolsSet);
    }

    // =========================================
    // Find helpers (O(1) via Maps)
    // =========================================

    async findUpperCircuitStock(symbol) {
        symbol = symbol.toUpperCase();

        await this.fetchUpperCircuit();

        return findStock(this.upperStocksMap, symbol);
    }

    async findLowerCircuitStock(symbol) {
        symbol = symbol.toUpperCase();

        await this.fetchLowerCircuit();

        return findStock(this.lowerStocksMap, symbol);
    }

    // =========================================
    // Boolean helpers (O(1) via Sets, no array scanning)
    // =========================================

    async isUpperCircuit(symbol) {
        symbol = symbol.toUpperCase();

        await this.fetchUpperCircuit();

        return hasStock(this.upperSymbolsSet, symbol);
    }

    async isLowerCircuit(symbol) {
        symbol = symbol.toUpperCase();

        await this.fetchLowerCircuit();

        return hasStock(this.lowerSymbolsSet, symbol);
    }

    // =========================================
    // Stats
    // =========================================

    getStats() {
        const ageOf = (type) => circuitCache.getAge(type);
        const remainingOf = (type) => circuitCache.getRemainingTime(type);
        const isStale = (type) => circuitCache.hasStale(type) && !circuitCache.has(type);

        return {
            upperCount: this.upperSymbolsSet.size,
            lowerCount: this.lowerSymbolsSet.size,
            cacheAge: {
                upper: ageOf("upper"),
                lower: ageOf("lower"),
                both: ageOf("both"),
            },
            cacheRemaining: {
                upper: remainingOf("upper"),
                lower: remainingOf("lower"),
                both: remainingOf("both"),
            },
            cacheStale: {
                upper: isStale("upper"),
                lower: isStale("lower"),
                both: isStale("both"),
            },
            sessionActive: this.sessionActive,
        };
    }
}

const circuitService = new CircuitService();

export default circuitService;