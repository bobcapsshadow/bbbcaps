// =========================================
// Circuit Parser
// =========================================

const NUMERIC_FIELDS = [
    "ltp",
    "change",
    "pChange",
    "priceBand",
    "highPrice",
    "lowPrice",
    "yearHigh",
    "yearLow",
    "totalTradedVol",
    "turnover",
    "perChange365d",
    "perChange30d",
    "marketCap"
];

// NSE's price-band-hitter endpoint (and related endpoints) don't always use
// the same key for traded volume. Different views / API versions have used
// all of the following at one point or another. We check them in priority
// order and normalize whichever one is populated into a single `volume`
// field so the frontend never sees volume = 0 when the data actually exists.
const VOLUME_FIELD_CANDIDATES = [
    "totalTradedVol",
    "totalTradedVolume",
    "volume",
    "totTrdVol"
];

/**
 * Safe Number Converter
 */
export function toNumber(value) {

    if (value === null || value === undefined || value === "") {
        return 0;
    }

    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    const parsed = Number(
        String(value)
            .replace(/,/g, "")
            .trim()
    );

    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Safe String
 */
export function toString(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

/**
 * Resolve traded volume from whichever field NSE actually populated.
 * Always returns a safe, finite number (never undefined/null/NaN).
 */
export function resolveVolume(stock = {}) {

    for (const field of VOLUME_FIELD_CANDIDATES) {
        const raw = stock[field];

        if (raw === undefined || raw === null || raw === "") {
            continue;
        }

        const num = toNumber(raw);

        if (num > 0) {
            return num;
        }
    }

    return 0;
}

/**
 * Normalize One Stock
 */
export function normalizeStock(stock = {}) {

    const normalized = {
        ...stock
    };

    normalized.symbol = toString(stock.symbol).toUpperCase();

    normalized.series = toString(stock.series) || "EQ";

    for (const field of NUMERIC_FIELDS) {

        normalized[field] = toNumber(stock[field]);

    }

    // ---- Volume fix: map every known NSE volume field into `volume` ----
    // (totalTradedVol above is preserved as-is; this just adds the
    // normalized alias the frontend reads from.)
    normalized.volume = resolveVolume(stock);

    // ---- Friendly aliases (safe defaults, never undefined) ----
    // Existing fields are preserved untouched; these are additive.
    normalized.price = normalized.ltp;
    normalized.high = normalized.highPrice;
    normalized.low = normalized.lowPrice;
    normalized.week52High = normalized.yearHigh;
    normalized.week52Low = normalized.yearLow;
    normalized.exchange = toString(stock.exchange) || "NSE";

    return Object.freeze(normalized);
}

/**
 * Normalize Multiple Stocks
 */
export function normalizeStocks(stocks = []) {

    if (!Array.isArray(stocks)) {

        throw new Error(
            "Circuit Parser: Expected array."
        );

    }

    return stocks.map(normalizeStock);
}

/**
 * Build Fast Map
 */
export function buildStockMap(stocks = []) {

    const map = new Map();

    for (const stock of stocks) {

        map.set(stock.symbol, stock);

    }

    return map;

}

/**
 * Build Symbol Set
 */
export function buildSymbolSet(stocks = []) {

    const set = new Set();

    for (const stock of stocks) {

        set.add(stock.symbol);

    }

    return set;

}

/**
 * Find Stock
 */
export function findStock(map, symbol) {

    if (!map) return null;

    return map.get(
        toString(symbol).toUpperCase()
    ) || null;

}

/**
 * Exists
 */
export function hasStock(set, symbol) {

    if (!set) return false;

    return set.has(
        toString(symbol).toUpperCase()
    );

}

/**
 * Validate NSE Response
 */
export function validateResponse(response) {

    if (!response) {
        throw new Error("Invalid NSE Response");
    }

    if (!response.data) {
        throw new Error("Response data missing");
    }

    if (!Array.isArray(response.data.data)) {
        throw new Error("Expected response.data.data Array");
    }

    return true;
}