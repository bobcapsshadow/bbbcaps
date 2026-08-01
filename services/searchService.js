import nseStocks from "../data/nseStocks.js";
import bseStocks from "../data/bseStocks.js";
import { fetchMultipleStocks } from "./yahooService.js";

/*
|--------------------------------------------------------------------------
| Merge NSE + BSE
|--------------------------------------------------------------------------
|
| NSE  -> String Array
| BSE  -> Object Array
|
| This service supports both formats.
|--------------------------------------------------------------------------
*/

const allStocks = [
    ...nseStocks.map(symbol => ({
        symbol,
        company: symbol.replace(".NS", ""),
        exchange: "NSE",
        search: symbol.replace(".NS", "")
    })),

    ...bseStocks
];

function normalize(text = "") {
    return String(text)
        .toUpperCase()
        .trim();
}

export async function searchStocks(query = "") {

    const keyword = normalize(query);

    if (!keyword) {
        return [];
    }

    const exactMatches = [];
    const startsWithMatches = [];
    const containsMatches = [];

    for (const stock of allStocks) {

        const symbol = stock.symbol;

        const company = stock.company || "";

        const searchText = normalize(
            stock.search ||
            `${company} ${symbol}`
        );

        const displaySymbol = symbol
            .replace(".NS", "")
            .replace(".BO", "");

        const exchange =
            stock.exchange ||
            (symbol.endsWith(".NS") ? "NSE" : "BSE");

        const stockData = {
            symbol,
            company,
            exchange,
            displaySymbol
        };

        // Exact Match
        if (
            normalize(symbol) === keyword ||
            normalize(displaySymbol) === keyword ||
            searchText === keyword
        ) {
            exactMatches.push(stockData);
            continue;
        }

        // Starts With
        if (
            normalize(symbol).startsWith(keyword) ||
            normalize(displaySymbol).startsWith(keyword) ||
            searchText.startsWith(keyword)
        ) {
            startsWithMatches.push(stockData);
            continue;
        }

        // Contains
        if (
            normalize(symbol).includes(keyword) ||
            normalize(displaySymbol).includes(keyword) ||
            searchText.includes(keyword)
        ) {
            containsMatches.push(stockData);
        }
    }

    const matches = [
        ...exactMatches.sort((a, b) =>
            a.displaySymbol.localeCompare(b.displaySymbol)
        ),

        ...startsWithMatches.sort((a, b) =>
            a.displaySymbol.localeCompare(b.displaySymbol)
        ),

        ...containsMatches.sort((a, b) =>
            a.displaySymbol.localeCompare(b.displaySymbol)
        )

    ].slice(0, 50);

    if (!matches.length) {
        return [];
    }

    const symbols = matches.map(stock => stock.symbol);

    const quotes = await fetchMultipleStocks(symbols);

    return quotes.map((quote, index) => ({
        ...quote,
        exchange: matches[index]?.exchange || quote.exchange,
        companyName:
            quote.companyName ||
            matches[index]?.company ||
            quote.symbol
    }));
}