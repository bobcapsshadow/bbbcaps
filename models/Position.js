import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
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
            lowercase: true,
            trim: true,
            index: true,
        },

        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            index: true,
        },

        company: {
            type: String,
            required: true,
            trim: true,
        },

        exchange: {
            type: String,
            enum: ["NSE", "BSE"],
            required: true,
        },

        logo: {
            type: String,
            default: "",
        },

        quantity: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },

        averagePrice: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },

        investedAmount: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },

        currentPrice: {
            type: Number,
            default: 0,
            min: 0,
        },

        currentValue: {
            type: Number,
            default: 0,
            min: 0,
        },

        profitLoss: {
            type: Number,
            default: 0,
        },

        profitLossPercent: {
            type: Number,
            default: 0,
        },

        lastPriceUpdated: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Ek user ke liye ek symbol sirf ek hi position hogi
positionSchema.index(
    {
        userId: 1,
        symbol: 1,
    },
    {
        unique: true,
    }
);

const Position = mongoose.model("Position", positionSchema);

export default Position;