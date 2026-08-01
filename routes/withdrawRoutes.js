import express from "express";

import { protect } from "../middleware/auth.js";

import {
    getWithdrawDetails,
    saveBankDetails,
    createWithdrawRequest,
    getWithdrawHistory,
} from "../controllers/withdrawController.js";

const router = express.Router();

router.get("/details", protect, getWithdrawDetails);

router.post("/bank", protect, saveBankDetails);

router.post("/request", protect, createWithdrawRequest);

router.get("/history", protect, getWithdrawHistory);

export default router;