import express from "express";

import { protect } from "../middleware/auth.js";

import {
    getAll,
    buy,
    sellRequest,
} from "../controllers/blockTradeController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Block Trade Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Get User Block Trades
|--------------------------------------------------------------------------
|
| GET /api/blocktrade/:username
|
*/

router.get(
    "/:username",
    getAll
);

/*
|--------------------------------------------------------------------------
| BUY Block Trade
|--------------------------------------------------------------------------
|
| POST /api/blocktrade/:id/buy
|
| User confirmation ke baad Block Trade BUY execute hoga.
|
*/

router.post(
    "/:id/buy",
    protect,
    buy
);

/*
|--------------------------------------------------------------------------
| SELL Block Trade Request
|--------------------------------------------------------------------------
|
| POST /api/blocktrade/:id/sell-request
|
| User SELL confirm karega to direct balance add nahi hoga.
| Sirf PENDING sell request create hogi.
|
| Admin baad me ACCEPT / REJECT karega.
|
*/

router.post(
    "/:id/sell-request",
    protect,
    sellRequest
);

export default router;