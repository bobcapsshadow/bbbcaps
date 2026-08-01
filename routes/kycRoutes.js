import express from "express";

import { protect } from "../middleware/auth.js";
import {
    uploadKyc,
    handleUploadError,
} from "../middleware/upload.js";

import {
    submitKycController,
    getMyKycController,
} from "../controllers/kycController.js";

const router = express.Router();

// ======================================================
// User KYC Routes
// ======================================================

// Get Logged-in User KYC
router.get(
    "/me",
    protect,
    getMyKycController
);

// Submit KYC
router.post(
    "/submit",
    protect,
    uploadKyc,
    handleUploadError,
    submitKycController
);

export default router;