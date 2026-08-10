import {
    createBlockTrade,
    updateBlockTrade,
    deleteBlockTrade,
    getBlockSellRequests,
    deleteBlockSellRequest,
} from "../services/blockTradeService.js";

import BlockTrade from "../models/BlockTrade.js";

/*
|--------------------------------------------------------------------------
| Create Block Trade
|--------------------------------------------------------------------------
*/

export async function create(req, res) {
    try {
        const blockTrade =
            await createBlockTrade(
                req.body,
                req.file
            );

        return res.json({
            success: true,
            message:
                "Block Trade Created Successfully.",
            blockTrade,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error.message,
        });
    }
}

/*
|--------------------------------------------------------------------------
| Update Block Trade
|--------------------------------------------------------------------------
*/

export async function update(req, res) {
    try {
        const blockTrade =
            await updateBlockTrade(
                req.params.id,
                req.body,
                req.file
            );

        return res.json({
            success: true,
            message:
                "Block Trade Updated Successfully.",
            blockTrade,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error.message,
        });
    }
}

/*
|--------------------------------------------------------------------------
| Delete Block Trade
|--------------------------------------------------------------------------
*/

export async function remove(req, res) {
    try {
        await deleteBlockTrade(
            req.params.id
        );

        return res.json({
            success: true,
            message:
                "Block Trade Deleted Successfully.",
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error.message,
        });
    }
}

/*
|--------------------------------------------------------------------------
| Get All Block Trades
|--------------------------------------------------------------------------
*/

export async function getAll(req, res) {
    try {
        const blockTrades =
            await BlockTrade.find()
                .sort({
                    createdAt: -1,
                });

        return res.json({
            success: true,
            blockTrades,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error.message,
        });
    }
}

/*
|--------------------------------------------------------------------------
| Get Block Sell Requests
|--------------------------------------------------------------------------
|
| Admin panel ke liye pending SELL requests.
|
*/

export async function getSellRequests(
    req,
    res
) {
    try {
        const requests =
            await getBlockSellRequests();

        return res.json({
            success: true,
            requests,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message:
                error.message,
        });
    }
}
/*
|--------------------------------------------------------------------------
| Delete Block Sell Request
|--------------------------------------------------------------------------
|
| Admin DELETE par:
|
| - Sell request delete
| - Related Position delete
| - Related Block Trade Order(s) delete
| - Related Block Trade delete
|
| User balance me koi amount add nahi hota.
|
*/

export async function deleteSellRequest(
    req,
    res
) {
    try {
        const { requestId } =
            req.params;

        if (!requestId) {
            return res.status(400).json({
                success: false,
                message:
                    "Sell request ID is required.",
            });
        }

        const result =
            await deleteBlockSellRequest(
                requestId
            );

        return res.json({
            success: true,
            message:
                "Sell request deleted successfully.",
            ...result,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message:
                error.message,
        });
    }
}