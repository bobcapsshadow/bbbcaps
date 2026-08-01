import axios from "axios";

const RANGE_CONFIG = {
  "1d": { range: "1d", interval: "5m" },
  "5d": { range: "5d", interval: "15m" },
  "1mo": { range: "1mo", interval: "1h" },
  "3mo": { range: "3mo", interval: "1d" },
  "6mo": { range: "6mo", interval: "1d" },
  "1y": { range: "1y", interval: "1d" },
  "2y": { range: "2y", interval: "1wk" },
  "5y": { range: "5y", interval: "1mo" },
  "max": { range: "max", interval: "1mo" },
};

export async function getChart(symbol, selectedRange = "1d") {
  const config = RANGE_CONFIG[selectedRange] || RANGE_CONFIG["1d"];

  const symbolsToTry = symbol.endsWith(".NS")
    ? [symbol]
    : [
        `${symbol}.NS`,
        symbol,
        `${symbol}.BO`,
    ];

  let data = null;
  let lastError = null;

  for (const yahooSymbol of symbolsToTry) {
    try {
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${config.range}&interval=${config.interval}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
          },
          timeout: 10000,
        }
      );

      if (!response.data.chart?.error) {
        data = response.data;
        break;
      }

    } catch (err) {
      lastError = err;
    }
  }

  if (!data) {
    throw lastError || new Error("Chart data not found.");
  }

  const result = data.chart?.result?.[0];

  if (!result) {
    throw new Error("Chart data not found.");
  }

  const meta = result.meta;
  const quote = result.indicators.quote?.[0];

  if (!quote || !result.timestamp) {
    throw new Error("Invalid chart data.");
  }

  const chartData = result.timestamp
    .map((time, index) => ({
      time,
      value: quote.close?.[index] ?? null, // TradingView LineSeries
      close: quote.close?.[index] ?? null,
      open: quote.open?.[index] ?? null,
      high: quote.high?.[index] ?? null,
      low: quote.low?.[index] ?? null,
      volume: quote.volume?.[index] ?? 0,
    }))
    .filter((item) => item.value !== null);

  return {
    success: true,

    symbol: meta.symbol,

    companyName:
      meta.longName ||
      meta.shortName ||
      meta.symbol,

    shortName:
      meta.shortName ||
      meta.symbol,

    range: selectedRange,

    exchange:
      meta.fullExchangeName ||
      meta.exchangeName ||
      "",

    currency:
      meta.currency ||
      "INR",

    regularMarketPrice:
      meta.regularMarketPrice ?? 0,

    previousClose:
      meta.previousClose ?? 0,

    chartPreviousClose:
      meta.chartPreviousClose ?? 0,

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

    marketState:
      meta.marketState ?? "UNKNOWN",

    lastUpdated:
      meta.regularMarketTime ?? null,

    timezone:
      meta.timezone ?? "",

    exchangeTimezone:
      meta.exchangeTimezoneName ?? "",

    data: chartData,
  };
}