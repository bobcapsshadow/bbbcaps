import axios from "axios";

const axiosConfig = {
    headers: {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
        Accept: "application/json",
    },
    timeout: 15000,
};

/*
|--------------------------------------------------------------------------
| Fetch Single Stock
|--------------------------------------------------------------------------
*/

export async function fetchStock(symbol) {
    try {

        const response = await axios.get(
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
            axiosConfig
        );

        const result = response.data?.chart?.result?.[0];

        if (!result) {
            throw new Error("No market data received.");
        }

        const meta = result.meta;

        const currentPrice = meta.regularMarketPrice ?? 0;
        const previousClose = meta.previousClose ?? 0;

        const change = Number(
            (currentPrice - previousClose).toFixed(2)
        );

        const percentChange =
            previousClose === 0
                ? 0
                : Number(((change / previousClose) * 100).toFixed(2));


        return {

            symbol: meta.symbol,

            companyName:
                meta.longName ??
                meta.shortName ??
                meta.symbol,

            shortName:
                meta.shortName ??
                meta.symbol,

            exchange:
                meta.fullExchangeName ??
                "",

            currency:
                meta.currency ??
                "INR",

            price: currentPrice,

            previousClose,

            open:
                meta.regularMarketOpen ?? 0,

            change,

            percentChange,

            dayHigh:
                meta.regularMarketDayHigh ?? 0,

            dayLow:
                meta.regularMarketDayLow ?? 0,

            week52High:
                meta.fiftyTwoWeekHigh ?? 0,

            week52Low:
                meta.fiftyTwoWeekLow ?? 0,

            volume:
                meta.regularMarketVolume ?? 0,

            marketCap:
                meta.marketCap ?? 0,

            exchangeTimezone:
                meta.exchangeTimezoneName ?? "",

                marketState:
                meta.marketState ?? "UNKNOWN",

            lastUpdated:
                meta.regularMarketTime
                    ? new Date(meta.regularMarketTime * 1000).toLocaleString()
                    : null,

            lastUpdatedUnix:
                meta.regularMarketTime ?? null,

            serverTime:
                new Date().toLocaleString(),

        };

    } catch (err) {

        console.error(
            `❌ Failed : ${symbol}`,
            err.response?.status || "",
            err.message
        );

        return {

            symbol,

            companyName: symbol,

            shortName: symbol,

            exchange: "",

            currency: "INR",

            price: 0,

            previousClose: 0,

            open: 0,

            change: 0,

            percentChange: 0,

            dayHigh: 0,

            dayLow: 0,

            week52High: 0,

            week52Low: 0,

            volume: 0,

            marketCap: 0,

            exchangeTimezone: "",

            marketState: "UNKNOWN",

            lastUpdated: null,

            lastUpdatedUnix: null,

            serverTime: new Date().toLocaleString(),

        };

    }
}

/*
|--------------------------------------------------------------------------
| Fetch Multiple Stocks
|--------------------------------------------------------------------------
|
| Batch Processing
| Prevents sending all requests together.
|--------------------------------------------------------------------------
*/

export async function fetchMultipleStocks(symbols = []) {

    const results = [];

    const batchSize = 10;

    for (let i = 0; i < symbols.length; i += batchSize) {

        const batch = symbols.slice(i, i + batchSize);

        const response = await Promise.all(

            batch.map(symbol => fetchStock(symbol))

        );

        results.push(...response);

    }

    return results;

}