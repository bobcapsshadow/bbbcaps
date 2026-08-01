import express from "express";

import {
    getAll,
} from "../controllers/blockTradeController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Block Trade Routes
|--------------------------------------------------------------------------
*/

// Get User Block Trades
router.get("/:username", getAll);

export default router;