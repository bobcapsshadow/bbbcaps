import {
    buyStock,
    sellStock,
    getPosition,
    getPositions,
} from "../services/tradeService.js";

/*
|--------------------------------------------------------------------------
| BUY STOCK
|--------------------------------------------------------------------------
|
| POST /api/trade/buy
|
*/

export async function buy(req, res) {

    try {

        const { username, symbol, quantity } = req.body;

        const result = await buyStock(
            username,
            symbol,
            quantity
        );

        return res.status(200).json(result);

    } catch (err) {

        console.error("❌ Buy Stock Error:", err);

        return res.status(400).json({

            success: false,

            message: err.message || "Failed to buy stock."

        });

    }

}

/*
|--------------------------------------------------------------------------
| SELL STOCK
|--------------------------------------------------------------------------
|
| POST /api/trade/sell
|
*/

export async function sell(req, res) {

    try {

        const { username, symbol, quantity } = req.body;

        const result = await sellStock(
            username,
            symbol,
            quantity
        );

        return res.status(200).json(result);

    } catch (err) {

        console.error("❌ Sell Stock Error:", err);

        return res.status(400).json({

            success: false,

            message: err.message || "Failed to sell stock."

        });

    }

}
export async function position(req, res) {

    try {

        const { username } = req.query;
        const { symbol } = req.params;

        const result = await getPosition(
            username,
            symbol
        );

        return res.json(result);

    } catch (err) {

        return res.status(400).json({
            success: false,
            message: err.message,
        });

    }

}
export async function positions(req, res) {

    try {

        const { username } = req.query;

        const result = await getPositions(username);

        return res.json(result);

    } catch (err) {

        return res.status(400).json({
            success: false,
            message: err.message,
        });

    }

}