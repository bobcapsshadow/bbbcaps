import express from "express";

import { protect } from "../middleware/auth.js";
// Future:
// import { adminProtect } from "../middleware/adminMiddleware.js";

import {
    getPendingKycsController,
    getApprovedKycsController,
    getRejectedKycsController,
    approveKycController,
    rejectKycController,
} from "../controllers/kycController.js";

import {
    getAllWithdrawRequests,
    approveWithdraw,
    rejectWithdraw,
} from "../controllers/withdrawController.js";

import {
    getAllUsersController,
    addBalanceController,
    deductBalanceController,
    updateCreditScoreController,
} from "../controllers/adminController.js";

import {
    sendNotificationController,
} from "../controllers/notificationController.js";

const router = express.Router();

// ======================================================
// Pending KYC
// ======================================================

router.get(
    "/kyc/pending",
    protect,
    // adminProtect,
    getPendingKycsController
);

// ======================================================
// Approved KYC
// ======================================================

router.get(
    "/kyc/approved",
    protect,
    // adminProtect,
    getApprovedKycsController
);

// ======================================================
// Rejected KYC
// ======================================================

router.get(
    "/kyc/rejected",
    protect,
    // adminProtect,
    getRejectedKycsController
);

// ======================================================
// Approve KYC
// ======================================================

router.patch(
    "/kyc/approve/:id",
    protect,
    // adminProtect,
    approveKycController
);

// ======================================================
// Reject KYC
// ======================================================

router.patch(
    "/kyc/reject/:id",
    protect,
    // adminProtect,
    rejectKycController
);

// ======================================================
// Withdraw Requests
// ======================================================

// Get All Withdraw Requests
router.get(
    "/withdraw/all",
    protect,
    // adminProtect,
    getAllWithdrawRequests
);

// ======================================================
// Approve Withdraw
// ======================================================

router.patch(
    "/withdraw/approve/:id",
    protect,
    // adminProtect,
    approveWithdraw
);

// ======================================================
// Reject Withdraw
// ======================================================

router.patch(
    "/withdraw/reject/:id",
    protect,
    // adminProtect,
    rejectWithdraw
);

// ======================================================
// Users
// ======================================================

router.get(
    "/users",
    protect,
    // adminProtect,
    getAllUsersController
);

// ======================================================
// Add Balance
// ======================================================

router.patch(
    "/balance/add",
    protect,
    // adminProtect,
    addBalanceController
);

// ======================================================
// Deduct Balance
// ======================================================

router.patch(
    "/balance/deduct",
    protect,
    // adminProtect,
    deductBalanceController
);

// ======================================================
// Update Credit Score
// ======================================================

router.patch(
    "/credit-score",
    protect,
    // adminProtect,
    updateCreditScoreController
);

// ======================================================
// Send Notification
// ======================================================

router.post(

    "/notification/send",

    protect,

    // adminProtect,

    sendNotificationController

);
export default router;