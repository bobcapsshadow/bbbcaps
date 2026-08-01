import User from "../models/User.js";
import WithdrawRequest from "../models/WithdrawRequest.js";
import History from "../models/History.js";

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

class WithdrawService {

    // ==========================
    // Get Withdraw Page Details
    // ==========================
    async getWithdrawDetails(userId) {

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        return {
            username: user.username,
            phone: user.phone,
            balance: user.balance,
            bankDetails: user.bankDetails ?? null,
        };
    }

    // ==========================
    // Save Bank Details
    // ==========================
    async saveBankDetails(userId, data) {

        const {
            bankName,
            holderName,
            accountNumber,
            confirmAccountNumber,
            ifsc,
        } = data;

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.bankDetails?.isAdded) {
            throw new Error("Bank details already added.");
        }

        if (
            !bankName ||
            !holderName ||
            !accountNumber ||
            !confirmAccountNumber ||
            !ifsc
        ) {
            throw new Error("All bank details are required.");
        }

        if (accountNumber !== confirmAccountNumber) {
            throw new Error("Account numbers do not match.");
        }

        if (!/^[0-9]{8,18}$/.test(accountNumber)) {
            throw new Error("Invalid account number.");
        }

        const formattedIfsc = ifsc.toUpperCase();

        if (!IFSC_REGEX.test(formattedIfsc)) {
            throw new Error("Invalid IFSC Code.");
        }

        user.bankDetails = {

            bankName,

            holderName,

            accountNumber,

            ifsc: formattedIfsc,

            isAdded: true,

            addedAt: new Date(),
        };

        await user.save();

        return {
            message: "Bank details added successfully.",
        };
    }

    // ==========================
    // Create Withdraw Request
    // ==========================
    async createWithdrawRequest(userId, amount) {

        const user = await User.findById(userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (!user.bankDetails?.isAdded) {
            throw new Error("Please add your bank account first.");
        }

        if (!amount || Number(amount) <= 0) {
            throw new Error("Invalid withdraw amount.");
        }

        if (Number(amount) > user.balance) {
            throw new Error("Insufficient balance.");
        }

        const pending = await WithdrawRequest.findOne({
            userId,
            status: "pending",
        });

        if (pending) {
            throw new Error(
                "You already have a pending withdrawal request."
            );
        }

        const request = await WithdrawRequest.create({

            userId: user._id,

            username: user.username,

            phone: user.phone,

            amount: Number(amount),

            bankDetails: {

                bankName: user.bankDetails.bankName,

                holderName: user.bankDetails.holderName,

                accountNumber: user.bankDetails.accountNumber,

                ifsc: user.bankDetails.ifsc,
            },
        });

        await History.create({
            userId: user._id,
            withdrawRequestId: request._id,
            type: "withdraw",
            amount: Number(amount),
            status: "pending",
            message: "Withdrawal request submitted",
        });

        return {
            message: "Withdrawal request submitted successfully.",
            request,
        };
    }

    // ==========================
    // User Withdraw History
    // ==========================
    async getWithdrawHistory(userId) {

        return WithdrawRequest.find({ userId })
            .sort({ createdAt: -1 });
    }

    // ==========================
    // Admin Pending Requests
    // ==========================
    async getAllWithdrawRequests() {

        return WithdrawRequest.find()
            .sort({ createdAt: -1 });
    }

    // ==========================
    // Admin Approve
    // ==========================
    async approveWithdraw(requestId) {

        const request = await WithdrawRequest.findById(requestId);

        if (!request) {
            throw new Error("Withdrawal request not found.");
        }

        if (request.status !== "pending") {
            throw new Error("Request already processed.");
        }

        const user = await User.findById(request.userId);

        if (!user) {
            throw new Error("User not found.");
        }

        if (user.balance < request.amount) {
            throw new Error("User balance is insufficient.");
        }

        user.balance -= request.amount;

        await user.save();

        request.status = "approved";

        request.approvedAt = new Date();

        await request.save();

        await History.findOneAndUpdate(
            {
                withdrawRequestId: request._id,
            },
            {
                status: "approved",
                message: "Withdrawal approved",
            },
            {
                sort: { createdAt: -1 },
            }
        );

        return {
            message: "Withdrawal approved successfully.",
        };
    }

    // ==========================
    // Admin Reject
    // ==========================
    async rejectWithdraw(requestId, adminRemark = "") {

        const request = await WithdrawRequest.findById(requestId);

        if (!request) {
            throw new Error("Withdrawal request not found.");
        }

        if (request.status !== "pending") {
            throw new Error("Request already processed.");
        }

        request.status = "rejected";

        request.rejectedAt = new Date();

        request.adminRemark = adminRemark;

        await request.save();

        await History.findOneAndUpdate(
            {
                withdrawRequestId: request._id,
            },
            {
                status: "rejected",
                reason: adminRemark,
                message: "Withdrawal rejected",
            },
            {
                sort: { createdAt: -1 },
            }
        );

        return {
            message: "Withdrawal rejected successfully.",
        };
    }
}

export default new WithdrawService();