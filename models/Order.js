import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
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
            required: true,
            trim: true,
        },

        blockTradeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BlockTrade",
            default: null,
            index: true,
        },

        type: {
            type: String,
            enum: ["BUY", "SELL"],
            required: true,
            index: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0,
        },

        averageBuyPrice: {
            type: Number,
            default: 0,
        },

        realizedProfit: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["COMPLETED"],
            default: "COMPLETED",
        },

        orderTime: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

orderSchema.index({
    userId: 1,
    orderTime: -1,
});

orderSchema.index({
    userId: 1,
    symbol: 1,
});

export default mongoose.model("Order", orderSchema);