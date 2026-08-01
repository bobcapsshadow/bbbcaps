import topStocks from "../data/topStocks.js";
import topBseStocks from "../data/topBseStocks.js";
import { fetchMultipleStocks, fetchStock } from "./yahooService.js";
import { searchStocks as searchLocalStocks } from "./searchService.js";
import circuitService from "./circuitService.js";

/*
|--------------------------------------------------------------------------
| Get Top Stocks
|--------------------------------------------------------------------------
*/

export async function getStocks(market = "NSE") {

    let symbols = [];

    switch (market.toUpperCase()) {

        case "NSE":
            symbols = topStocks;
            break;

            case "BSE":
                symbols = topBseStocks.map(stock => stock.symbol);
                break;

        default:
            symbols = topStocks;
            break;

    }

    const stocks = await fetchMultipleStocks(symbols);

    return {

        success: true,

        market: market.toUpperCase(),

        total: stocks.length,

        fetchedAt: new Date().toLocaleString(),

        stocks,

    };

}

/*
|--------------------------------------------------------------------------
| Search Stocks
|--------------------------------------------------------------------------
*/

export async function searchStocks(query = "") {

    return await searchLocalStocks(query);

}

/*
|--------------------------------------------------------------------------
| Get Single Stock
|--------------------------------------------------------------------------
*/

export async function getStockDetails(symbol) {

    return await fetchStock(symbol);

}
export async function getUpperCircuitStocks() {

    const stocks =
        await circuitService.fetchUpperCircuit();

    return {

        success: true,

        total: stocks.length,

        fetchedAt: new Date().toLocaleString(),

        stocks

    };

}