import mongoose from "mongoose";

const withdrawRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        username: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        amount: {
            type: Number,
            required: true,
            min: 1,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "approved",
                "rejected",
            ],
            default: "pending",
        },

        bankDetails: {
            bankName: {
                type: String,
                required: true,
                trim: true,
            },

            holderName: {
                type: String,
                required: true,
                trim: true,
            },

            accountNumber: {
                type: String,
                required: true,
                trim: true,
            },

            ifsc: {
                type: String,
                required: true,
                trim: true,
                uppercase: true,
            },
        },

        approvedAt: {
            type: Date,
            default: null,
        },

        rejectedAt: {
            type: Date,
            default: null,
        },

        adminRemark: {
            type: String,
            default: "",
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const WithdrawRequest = mongoose.model(
    "WithdrawRequest",
    withdrawRequestSchema
);

export default WithdrawRequest;