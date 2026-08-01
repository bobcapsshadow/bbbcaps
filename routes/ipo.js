import express from "express";

import {
    getIPOList,
    subscribe,
    getSubscribed,
} from "../controllers/ipoController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| User IPO Routes
|--------------------------------------------------------------------------
*/

// Get Open IPOs
router.get("/", getIPOList);

// Subscribe IPO
router.post("/subscribe", subscribe);

// Get User Subscribed IPOs
router.get("/subscribed/:username", getSubscribed);

export default router;