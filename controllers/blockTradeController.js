import {
    getUserBlockTrades,
} from "../services/blockTradeService.js";

/*
|--------------------------------------------------------------------------
| Get User Block Trades
|--------------------------------------------------------------------------
*/

export async function getAll(req, res) {

    try {

        const { username } = req.params;

        const blockTrades =
            await getUserBlockTrades(username);

        res.json({
            success: true,
            blockTrades,
        });

        

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}