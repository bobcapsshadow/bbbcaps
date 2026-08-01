import mongoose from "mongoose";

const blockTradeSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },

        companyName: {
            type: String,
            required: true,
            trim: true,
        },

        symbol: {
            type: String,
            default: "",
            uppercase: true,
            trim: true,
        },

        logo: {
            type: String,
            default: "",
        },

        tradeType: {
            type: String,
            enum: ["BUY", "SELL"],
            required: true,
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

        value: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
    }
);

/*
|--------------------------------------------------------------------------
| Compound Index
|--------------------------------------------------------------------------
|
| Same user ke liye same company aur same trade type duplicate
| create nahi hone dega.
|
*/

blockTradeSchema.index(
    {
        username: 1,
        companyName: 1,
        tradeType: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model(
    "BlockTrade",
    blockTradeSchema
);