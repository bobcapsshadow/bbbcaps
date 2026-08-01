import withdrawService from "../services/withdrawService.js";

// ==========================
// Get Withdraw Page Details
// ==========================
export const getWithdrawDetails = async (req, res) => {
    try {

        const result = await withdrawService.getWithdrawDetails(
            req.user.id
        );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({
            message: error.message,
        });

    }
};

// ==========================
// Save Bank Details
// ==========================
export const saveBankDetails = async (req, res) => {
    try {

        const result = await withdrawService.saveBankDetails(
            req.user.id,
            req.body
        );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({
            message: error.message,
        });

    }
};

// ==========================
// Create Withdraw Request
// ==========================
export const createWithdrawRequest = async (req, res) => {
    try {

        const { amount } = req.body;

        const result =
            await withdrawService.createWithdrawRequest(
                req.user.id,
                amount
            );

        return res.status(201).json(result);

    } catch (error) {

        return res.status(400).json({
            message: error.message,
        });

    }
};

// ==========================
// User Withdraw History
// ==========================
export const getWithdrawHistory = async (req, res) => {
    try {

        const history =
            await withdrawService.getWithdrawHistory(
                req.user.id
            );

        return res.status(200).json(history);

    } catch (error) {

        return res.status(400).json({
            message: error.message,
        });

    }
};

// ==========================
// Admin - All Requests
// ==========================
export const getAllWithdrawRequests = async (req, res) => {
    try {

        const requests =
            await withdrawService.getAllWithdrawRequests();

        return res.status(200).json(requests);

    } catch (error) {

        return res.status(400).json({
            message: error.message,
        });

    }
};

// ==========================
// Admin - Approve
// ==========================
export const approveWithdraw = async (req, res) => {
    try {

        const { id } = req.params;

        const result =
            await withdrawService.approveWithdraw(id);

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({
            message: error.message,
        });

    }
};

// ==========================
// Admin - Reject
// ==========================
export const rejectWithdraw = async (req, res) => {
    try {

        const { id } = req.params;

        const { adminRemark } = req.body;

        const result =
            await withdrawService.rejectWithdraw(
                id,
                adminRemark
            );

        return res.status(200).json(result);

    } catch (error) {

        return res.status(400).json({
            message: error.message,
        });

    }
};