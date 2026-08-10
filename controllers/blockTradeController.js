import {
    getUserBlockTrades,
    buyBlockTrade,
    createBlockSellRequest,
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

        return res.json({
            success: true,
            blockTrades,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

/*
|--------------------------------------------------------------------------
| BUY Block Trade
|--------------------------------------------------------------------------
|
| User confirms BUY from the Block Trade page.
|
| Params:
|   :id = Block Trade ID
|
| Username can come from:
|   req.body.username
|   OR
|   req.user.username
|
| Actual balance, position and order logic is handled
| inside blockTradeService.js.
|
*/

export async function buy(req, res) {
    try {
        const { id } = req.params;

        const username =
            req.body?.username ||
            req.user?.username;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required.",
            });
        }

        const result =
            await buyBlockTrade(
                id,
                username
            );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}

/*
|--------------------------------------------------------------------------
| CREATE BLOCK SELL REQUEST
|--------------------------------------------------------------------------
|
| User submits a SELL request for an executed Block Trade position.
|
| IMPORTANT:
|
| This does NOT:
|   - add balance
|   - remove shares
|   - create SELL order
|   - execute the sell
|
| It only creates a PENDING sell request.
|
| The request is stored inside the Block Trade document
| and is shown in the admin panel.
|
| The user does NOT receive the sell amount as wallet credit.
| The actual sell amount remains stored in the database
| so the admin panel can display it.
|
*/

export async function sellRequest(req, res) {
    try {
        const { id } = req.params;

        const username =
            req.body?.username ||
            req.user?.username;

        if (!username) {
            return res.status(400).json({
                success: false,
                message: "Username is required.",
            });
        }

        const result =
            await createBlockSellRequest(
                id,
                username
            );

        return res.status(200).json(result);
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
}