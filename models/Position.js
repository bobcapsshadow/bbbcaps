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
        
        userInvestedAmount: {
            type: Number,
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

        /*
        |--------------------------------------------------------------------------
        | Block Trade Reference
        |--------------------------------------------------------------------------
        |
        | Normal position:
        | blockTradeId = null
        |
        | Block Trade position:
        | blockTradeId = related BlockTrade document ID
        |
        | Isse same user + same symbol ki normal aur Block Trade
        | positions ko alag identify kiya ja sakta hai.
        |
        */
        blockTradeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BlockTrade",
            default: null,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

/*
|--------------------------------------------------------------------------
| Position Uniqueness
|--------------------------------------------------------------------------
|
| Normal position:
| userId + symbol + blockTradeId(null)
|
| Block Trade position:
| userId + symbol + blockTradeId(BlockTrade ID)
|
| Isse same user ke same symbol ki normal position aur
| Block Trade position alag documents ho sakti hain.
|
*/

positionSchema.index(
    {
        userId: 1,
        symbol: 1,
        blockTradeId: 1,
    },
    {
        unique: true,
    }
);

const Position = mongoose.model("Position", positionSchema);

export default Position;