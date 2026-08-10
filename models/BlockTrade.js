import mongoose from "mongoose";

/*
|--------------------------------------------------------------------------
| Block Sell Request Schema
|--------------------------------------------------------------------------
|
| SELL Block Trade par user direct balance receive nahi karega.
| User ek SELL request submit karega jo admin accept/reject karega.
|
*/

const sellRequestSchema = new mongoose.Schema(
    {
        requestId: {
            type: String,
            required: true,
            trim: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        username: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            default: "",
            trim: true,
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

        /*
        |--------------------------------------------------------------------------
        | Amount that will be added to user's balance after admin accepts
        |--------------------------------------------------------------------------
        */
        amount: {
            type: Number,
            required: true,
            min: 0,
        },

        /*
        |--------------------------------------------------------------------------
        | User balance at the exact time the SELL request was created
        |--------------------------------------------------------------------------
        */
        balanceAtRequest: {
            type: Number,
            required: true,
            min: 0,
        },
        
        userInvestedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        
        status: {
            type: String,
            enum: ["PENDING", "ACCEPTED", "REJECTED"],
            default: "PENDING",
        },

        requestedAt: {
            type: Date,
            default: Date.now,
        },

        processedAt: {
            type: Date,
            default: null,
        },
    },
    {
        _id: false,
    }
);

/*
|--------------------------------------------------------------------------
| Block Trade Schema
|--------------------------------------------------------------------------
*/

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

        /*
        |--------------------------------------------------------------------------
        | Admin-defined total Block Trade value
        |--------------------------------------------------------------------------
        |
        | quantity × price
        |
        */
        value: {
            type: Number,
            required: true,
            min: 0,
        },

        /*
        |--------------------------------------------------------------------------
        | Block Trade Execution Status
        |--------------------------------------------------------------------------
        |
        | BUY:
        | AVAILABLE → EXECUTED
        |
        | SELL:
        | AVAILABLE → EXECUTED after admin accepts sell request
        |
        */
        executionStatus: {
            type: String,
            enum: ["AVAILABLE", "EXECUTED"],
            default: "AVAILABLE",
        },

        executedAt: {
            type: Date,
            default: null,
        },

        /*
        |--------------------------------------------------------------------------
        | SELL REQUESTS
        |--------------------------------------------------------------------------
        |
        | SELL Block Trade ke liye user yahan request submit karega.
        |
        | PENDING  → Admin ne abhi decision nahi liya
        | ACCEPTED → Shares sell + balance add
        | REJECTED → Kuch bhi change nahi hoga
        |
        */
        sellRequests: {
            type: [sellRequestSchema],
            default: [],
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