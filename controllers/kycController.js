import fs from "fs";

import {
    submitKyc,
    getMyKyc,
    approveKyc,
    rejectKyc,
    getPendingKycs,
    getApprovedKycs,
    getRejectedKycs,
} from "../services/kycService.js";

// ======================================================
// Delete Uploaded Files (Rollback)
// ======================================================

const deleteUploadedFiles = (files) => {

    if (!files) return;

    Object.values(files).forEach((fileArray) => {

        fileArray.forEach((file) => {

            try {

                if (
                    file?.path &&
                    fs.existsSync(file.path)
                ) {

                    fs.unlinkSync(file.path);

                }

            } catch (error) {

                console.error(
                    "Failed to remove uploaded file:",
                    error.message
                );

            }

        });

    });

};

// ======================================================
// Submit KYC
// ======================================================

export const submitKycController = async (
    req,
    res
) => {

    try {

        const result =
            await submitKyc(
                req.user.id,
                req.body,
                req.files
            );

        return res.status(201).json(result);

    } catch (error) {

        // Rollback uploaded images
        deleteUploadedFiles(req.files);

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Failed to submit KYC.",

        });

    }

};
// ======================================================
// Get Logged-in User KYC
// ======================================================

export const getMyKycController = async (
    req,
    res
) => {

    try {

        const result =
            await getMyKyc(req.user.id);

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch KYC details.",

        });

    }

};

// ======================================================
// Approve KYC (Admin)
// ======================================================

export const approveKycController = async (
    req,
    res
) => {

    try {

        const { id } = req.params;

        const result =
            await approveKyc(id);

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Failed to approve KYC.",

        });

    }

};
// ======================================================
// Reject KYC (Admin)
// ======================================================

export const rejectKycController = async (
    req,
    res
) => {

    try {

        const { id } = req.params;

        const { rejectedReason } = req.body;

        const result =
            await rejectKyc(
                id,
                rejectedReason
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Failed to reject KYC.",

        });

    }

};

// ======================================================
// Get Pending KYC List (Admin)
// ======================================================

export const getPendingKycsController = async (
    req,
    res
) => {

    try {

        const result =
            await getPendingKycs();

        return res.status(200).json(result);

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch pending KYC list.",

        });

    }

};
// ======================================================
// Get Approved KYC List (Admin)
// ======================================================

export const getApprovedKycsController = async (
    req,
    res
) => {

    try {

        const result =
            await getApprovedKycs();

        return res.status(200).json(result);

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch approved KYC list.",

        });

    }

};

// ======================================================
// Get Rejected KYC List (Admin)
// ======================================================

export const getRejectedKycsController = async (
    req,
    res
) => {

    try {

        const result =
            await getRejectedKycs();

        return res.status(200).json(result);

    } catch (error) {

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to fetch rejected KYC list.",

        });

    }

};