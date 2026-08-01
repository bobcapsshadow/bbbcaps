import express from "express";

import {
    buy,
    sell,
    position,
    positions,
} from "../controllers/tradeController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| BUY STOCK
|--------------------------------------------------------------------------
|
| POST /api/trade/buy
|
| Body:
| {
|   "username": "yusuf",
|   "symbol": "RELIANCE.NS",
|   "quantity": 5
| }
|
*/

router.post("/buy", buy);

/*
|--------------------------------------------------------------------------
| SELL STOCK
|--------------------------------------------------------------------------
|
| POST /api/trade/sell
|
| Body:
| {
|   "username": "yusuf",
|   "symbol": "RELIANCE.NS",
|   "quantity": 2
| }
|
*/

router.post("/sell", sell);
router.get("/position/:symbol", position);
router.get("/positions", positions);

export default router;