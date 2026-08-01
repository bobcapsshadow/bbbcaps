import express from "express";
import {
    getStocks,
    searchStocks,
    getStockDetails,
    getUpperCircuitStocks,
} from "../services/stockService.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| GET TOP STOCKS
|--------------------------------------------------------------------------
|
| GET /api/stocks
| GET /api/stocks?market=NSE
|
*/

router.get("/", async (req, res) => {
    try {

        const market = req.query.market || "NSE";

        const data = await getStocks(market);

        res.status(200).json(data);

    } catch (err) {

        console.error("❌ Stock Route Error:", err);

        res.status(500).json({

            success: false,

            message: "Failed to fetch stock data.",

            error: err.message,

        });

    }
});

/*
|--------------------------------------------------------------------------
| SEARCH STOCKS
|--------------------------------------------------------------------------
|
| GET /api/stocks/search?q=rel
|
*/

router.get("/search", async (req, res) => {
    try {

        const query = req.query.q || "";

        const data = await searchStocks(query);

        res.status(200).json({

            success: true,

            total: data.length,

            stocks: data,

        });

    } catch (err) {

        console.error("❌ Search Route Error:", err);

        res.status(500).json({

            success: false,

            message: "Failed to search stocks.",

            error: err.message,

        });

    }
});

/*
|--------------------------------------------------------------------------
| UPPER CIRCUIT STOCKS
|--------------------------------------------------------------------------
|
| GET /api/stocks/upper-circuit
|
*/

router.get("/upper-circuit", async (req, res) => {
    try {

        const data = await getUpperCircuitStocks();

        res.status(200).json(data);

    } catch (err) {

        console.error("❌ Upper Circuit Error:", err);

        res.status(500).json({
            success: false,
            message: "Failed to fetch upper circuit stocks.",
            error: err.message,
        });

    }
});
/*
|--------------------------------------------------------------------------
| SINGLE STOCK DETAILS
|--------------------------------------------------------------------------
|
| GET /api/stocks/RELIANCE.NS
|
*/

router.get("/:symbol", async (req, res) => {
    try {

        const symbol = req.params.symbol;

        const data = await getStockDetails(symbol);

        res.status(200).json({

            success: true,

            stock: data,

        });

    } catch (err) {

        console.error("❌ Stock Details Error:", err);

        res.status(500).json({

            success: false,

            message: "Failed to fetch stock details.",

            error: err.message,

        });

    }
});

export default router;