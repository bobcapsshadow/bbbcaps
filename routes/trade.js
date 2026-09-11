import express from "express";

import {
    buy,
    sell,
    position,
    positions,
    createMarketTradeRequest,
    sellMarket,
    marketRequests,
    marketPositions,
    marketRequest,
} from "../controllers/tradeController.js";

const router = express.Router();

router.post("/buy", buy);
router.post("/sell", sell);

router.get("/position/:symbol", position);
router.get("/positions", positions);

router.post("/market-request", createMarketTradeRequest);
router.post("/market-request/:requestId/sell", sellMarket);

router.get("/market-requests", marketRequests);
router.get("/market-positions", marketPositions);
router.get("/market-request/:requestId", marketRequest);

export default router;