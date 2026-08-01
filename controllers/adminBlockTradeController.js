import {
    createBlockTrade,
    updateBlockTrade,
    deleteBlockTrade,
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

        res.json({
            success: true,
            message:
                "Block Trade Created Successfully.",
            blockTrade,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
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

        res.json({
            success: true,
            message:
                "Block Trade Updated Successfully.",
            blockTrade,
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
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

        res.json({
            success: true,
            message:
                "Block Trade Deleted Successfully.",
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: error.message,
        });

    }

}
export async function getAll(req, res) {

    try {

        const blockTrades = await BlockTrade.find()
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            blockTrades,
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

}