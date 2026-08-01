import express from "express";
import { getHistory } from "../controllers/historyController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/history
 * Logged-in user's history
 */
router.get("/", protect, getHistory);

export default router;