import crypto from "crypto";

import cloudinary from "../config/cloudinary.js";

import BlockTrade from "../models/BlockTrade.js";
import User from "../models/User.js";
import Position from "../models/Position.js";
import Order from "../models/Order.js";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeUsername(username) {
    if (
        !username ||
        typeof username !== "string" ||
        !username.trim()
    ) {
        throw new Error("Username is required.");
    }

    return username.trim().toLowerCase();
}

function normalizeSymbol(symbol) {
    if (
        !symbol ||
        typeof symbol !== "string" ||
        !symbol.trim()
    ) {
        return "";
    }

    return symbol.trim().toUpperCase();
}

function getBlockTradeSymbol(blockTrade) {
    return (
        normalizeSymbol(blockTrade.symbol) ||
        normalizeSymbol(blockTrade.companyName)
    );
}

function validateQuantity(quantity) {
    const qty = Number(quantity);

    if (
        !Number.isFinite(qty) ||
        Number.isNaN(qty) ||
        qty <= 0
    ) {
        throw new Error("Invalid quantity.");
    }

    return qty;
}

function validatePrice(price) {
    const value = Number(price);

    if (
        !Number.isFinite(value) ||
        Number.isNaN(value) ||
        value <= 0
    ) {
        throw new Error("Invalid price.");
    }

    return value;
}

function getExchange(symbol) {
    return symbol?.endsWith(".BO")
        ? "BSE"
        : "NSE";
}

/*
|--------------------------------------------------------------------------
| Create Block Trade
|--------------------------------------------------------------------------
*/

export async function createBlockTrade(data, file) {
    const username =
        data.username?.trim().toLowerCase();

    if (!username) {
        throw new Error("Username is required.");
    }

    if (!data.companyName?.trim()) {
        throw new Error("Company name is required.");
    }

    if (
        !["BUY", "SELL"].includes(
            data.tradeType
        )
    ) {
        throw new Error("Invalid trade type.");
    }

    const quantity =
        Number(data.quantity);

    const price =
        Number(data.price);

    if (
        Number.isNaN(quantity) ||
        quantity <= 0
    ) {
        throw new Error("Invalid quantity.");
    }

    if (
        Number.isNaN(price) ||
        price <= 0
    ) {
        throw new Error("Invalid price.");
    }

    const alreadyExists =
        await BlockTrade.findOne({
            username,
            companyName:
                data.companyName.trim(),
            tradeType: data.tradeType,
        });

    if (alreadyExists) {
        throw new Error(
            "Block Trade already exists for this user."
        );
    }

    const value = Number(
        (quantity * price).toFixed(2)
    );

    const blockTrade =
        await BlockTrade.create({
            username,

            companyName:
                data.companyName.trim(),

            symbol:
                normalizeSymbol(
                    data.symbol ||
                    data.companyName
                ),

            logo: file
                ? file.path
                : "",

            tradeType:
                data.tradeType,

            quantity,

            price,

            value,

            executionStatus:
                "AVAILABLE",

            executedAt: null,

            sellRequests: [],
        });

    return blockTrade;
}

/*
|--------------------------------------------------------------------------
| Get User Block Trades
|--------------------------------------------------------------------------
*/

export async function getUserBlockTrades(
    username
) {
    username =
        normalizeUsername(username);

    return await BlockTrade.find({
        username,
    }).sort({
        createdAt: -1,
    });
}

/*
|--------------------------------------------------------------------------
| BUY BLOCK TRADE
|--------------------------------------------------------------------------
|
| User confirms BUY.
|
| Important requirement:
|
| If Block Trade value is greater than user's balance,
| user's complete available balance becomes 0.
|
| Example:
|
| Balance       = ₹10,000
| Trade Value   = ₹50,000
|
| New Balance   = ₹0
|
| The Block Trade still creates the complete position.
|
*/

export async function buyBlockTrade(
    id,
    username
) {
    username =
        normalizeUsername(username);

    if (!id) {
        throw new Error(
            "Block Trade ID is required."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Block Trade
    |--------------------------------------------------------------------------
    */

    const blockTrade =
        await BlockTrade.findById(id);

    if (!blockTrade) {
        throw new Error(
            "Block Trade not found."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Trade Type
    |--------------------------------------------------------------------------
    */

    if (
        blockTrade.tradeType !== "BUY"
    ) {
        throw new Error(
            "This Block Trade is not a BUY trade."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent Duplicate Execution
    |--------------------------------------------------------------------------
    */

    if (
        blockTrade.executionStatus ===
        "EXECUTED"
    ) {
        throw new Error(
            "This Block Trade has already been executed."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | User
    |--------------------------------------------------------------------------
    */

    const user =
        await User.findOne({
            username,
        });

    if (!user) {
        throw new Error(
            "User not found."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Verify This Block Trade Belongs To User
    |--------------------------------------------------------------------------
    */

    if (
        blockTrade.username !==
        user.username
    ) {
        throw new Error(
            "This Block Trade does not belong to this user."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Block Trade Values
    |--------------------------------------------------------------------------
    */

    const quantity =
        validateQuantity(
            blockTrade.quantity
        );

    const price =
        validatePrice(
            blockTrade.price
        );

    const totalAmount =
        Number(
            (
                quantity * price
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Available Balance
    |--------------------------------------------------------------------------
    |
    | User requirement:
    |
    | If trade value > balance,
    | complete available balance is removed.
    |
    */

    const currentBalance =
        Math.max(
            0,
            Number(user.balance || 0)
        );

    const amountToDeduct =
        Math.min(
            currentBalance,
            totalAmount
        );

    const updatedBalance =
        Number(
            (
                currentBalance -
                amountToDeduct
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Check Existing Position For This Block Trade
    |--------------------------------------------------------------------------
    */

    const blockTradeSymbol =
        getBlockTradeSymbol(blockTrade);

    const existingPosition =
        await Position.findOne({
            userId: user._id,
            symbol: blockTradeSymbol,
            blockTradeId:
                blockTrade._id,
        });

    if (existingPosition) {
        throw new Error(
            "Position for this Block Trade already exists."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Block Trade Position
    |--------------------------------------------------------------------------
    */

    const symbol =
        getBlockTradeSymbol(blockTrade);

    const position =
        new Position({
            userId: user._id,

            username:
                user.username,

            symbol,

            company:
                blockTrade.companyName,

            exchange:
                getExchange(symbol),

            logo:
                blockTrade.logo || "",

            quantity,

            averagePrice:
                price,

            /*
            | The Block Trade's complete value
            | remains the position's invested amount.
            */
            investedAmount:
                totalAmount,

            userInvestedAmount: amountToDeduct,

            currentPrice:
                price,

            currentValue:
                totalAmount,

            profitLoss: 0,

            profitLossPercent: 0,

            lastPriceUpdated:
                new Date(),

            blockTradeId:
                blockTrade._id,
        });

    /*
    |--------------------------------------------------------------------------
    | Save Position
    |--------------------------------------------------------------------------
    */

    await position.save();

    /*
    |--------------------------------------------------------------------------
    | Create BUY Order
    |--------------------------------------------------------------------------
    */

    await Order.create({
        userId: user._id,

        username: user.username,

        symbol,

        company: blockTrade.companyName,

        exchange: getExchange(symbol),

        blockTradeId: blockTrade._id,

        type: "BUY",

        quantity,

        price,

        totalAmount,

        averageBuyPrice: price,

        realizedProfit: 0,
    });

    /*
    |--------------------------------------------------------------------------
    | Deduct Balance
    |--------------------------------------------------------------------------
    */

    user.balance =
        updatedBalance;

    await user.save();

    /*
    |--------------------------------------------------------------------------
    | Mark Block Trade Executed
    |--------------------------------------------------------------------------
    */

    blockTrade.executionStatus =
        "EXECUTED";

    blockTrade.executedAt =
        new Date();

    await blockTrade.save();

    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    return {
        success: true,

        message:
            "Block Trade purchased successfully.",

        blockTrade: {
            id:
                blockTrade._id,

            tradeType:
                blockTrade.tradeType,

            symbol,

            company:
                blockTrade.companyName,

            quantity,

            price,

            totalAmount,
        },

        position: {
            id:
                position._id,

            symbol:
                position.symbol,

            company:
                position.company,

            exchange:
                position.exchange,

            quantity:
                position.quantity,

            averagePrice:
                position.averagePrice,

            investedAmount:
                position.investedAmount,

            userInvestedAmount:
                position.userInvestedAmount,

            currentPrice:
                position.currentPrice,

            currentValue:
                position.currentValue,

            profitLoss:
                position.profitLoss,

            profitLossPercent:
                position.profitLossPercent,
        },

        wallet: {
            previousBalance:
                currentBalance,

            deductedAmount:
                amountToDeduct,

            balance:
                user.balance,
        },
    };
}

/*
|--------------------------------------------------------------------------
| CREATE BLOCK SELL REQUEST
|--------------------------------------------------------------------------
|
| SELL does NOT directly add money to balance.
|
| User submits a sell request.
|
| Position remains unchanged.
| Balance remains unchanged.
|
| Request is shown in the Admin Panel.
| Admin can delete the request.
|
*/

export async function createBlockSellRequest(
    id,
    username
) {
    username =
        normalizeUsername(username);

    if (!id) {
        throw new Error(
            "Block Trade ID is required."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Block Trade
    |--------------------------------------------------------------------------
    */

    const blockTrade =
        await BlockTrade.findById(id);

    if (!blockTrade) {
        throw new Error(
            "Block Trade not found."
        );
    }

    /*
|--------------------------------------------------------------------------
| Validate Owned Block Trade
|--------------------------------------------------------------------------
|
| A user can sell only a Block Trade that they
| previously bought and that has already been executed.
|
*/

    if (blockTrade.tradeType !== "BUY") {
        throw new Error(
            "Only a BUY Block Trade position can be sold."
        );
    }

    if (blockTrade.executionStatus !== "EXECUTED") {
        throw new Error(
            "This Block Trade has not been executed yet."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | User
    |--------------------------------------------------------------------------
    */

    const user =
        await User.findOne({
            username,
        });

    if (!user) {
        throw new Error(
            "User not found."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Verify Ownership
    |--------------------------------------------------------------------------
    */

    if (
        blockTrade.username !==
        user.username
    ) {
        throw new Error(
            "This Block Trade does not belong to this user."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Check Existing Pending Request
    |--------------------------------------------------------------------------
    */

    const existingPendingRequest =
        blockTrade.sellRequests?.find(
            (request) =>
                request.username ===
                user.username &&
                request.status ===
                "PENDING"
        );

    if (existingPendingRequest) {
        throw new Error(
            "A sell request is already pending for this Block Trade."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Block Trade Position
    |--------------------------------------------------------------------------
    */

    const symbol =
        getBlockTradeSymbol(blockTrade);

    const position =
        await Position.findOne({
            userId: user._id,

            symbol,

            blockTradeId:
                blockTrade._id,
        });

    if (!position) {
        throw new Error(
            "You don't own this Block Trade position."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Shares
    |--------------------------------------------------------------------------
    */

    const quantity =
        validateQuantity(
            blockTrade.quantity
        );

    if (
        quantity >
        position.quantity
    ) {
        throw new Error(
            `You only own ${position.quantity} shares.`
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Calculate Sell Amount
    |--------------------------------------------------------------------------
    |
    | Admin-defined Block Trade price is used.
    | Live market price is NOT used here.
    |
    */

    const price =
        validatePrice(
            blockTrade.price
        );

    const amount =
        Number(
            (
                quantity * price
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Create Request
    |--------------------------------------------------------------------------
    */

    const requestId =
        crypto.randomUUID();

    const request = {
        requestId,

        userId:
            user._id,

        username:
            user.username,

        phone:
            user.phone || "",

        quantity,

        price,

        amount,

        balanceAtRequest:
            Number(
                user.balance || 0
            ),

        userInvestedAmount:
            Number(
                position.userInvestedAmount || 0
            ),

        status:
            "PENDING",

        requestedAt:
            new Date(),

        processedAt:
            null,
    };

    blockTrade.sellRequests.push(
        request
    );

    await blockTrade.save();

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return {
        success: true,

        message: "Sell request submitted successfully.",

        request: {
            requestId,

            blockTradeId: blockTrade._id,

            username: user.username,

            phone: user.phone || "",

            symbol,

            company: blockTrade.companyName,

            quantity,

            price,

            status: "PENDING",

            requestedAt: request.requestedAt,
        },
    };
}

/*
|--------------------------------------------------------------------------
| Get Pending Block Sell Requests
|--------------------------------------------------------------------------
|
| Admin panel ke liye.
|
*/

export async function getBlockSellRequests() {
    const blockTrades =
        await BlockTrade.find({
            tradeType: "BUY",

            "sellRequests.status":
                "PENDING",
        }).sort({
            createdAt: -1,
        });

    const requests = [];

    for (
        const blockTrade of blockTrades
    ) {
        for (
            const request of
            blockTrade.sellRequests
        ) {
            if (
                request.status !==
                "PENDING"
            ) {
                continue;
            }

            requests.push({
                requestId:
                    request.requestId,

                blockTradeId:
                    blockTrade._id,

                username:
                    request.username,

                phone:
                    request.phone,

                companyName:
                    blockTrade.companyName,

                symbol:
                    blockTrade.symbol,

                logo:
                    blockTrade.logo,

                quantity:
                    request.quantity,

                price:
                    request.price,

                amount:
                    request.amount,

                balanceAtRequest:
                    request.balanceAtRequest,

                userInvestedAmount:
                    request.userInvestedAmount,

                status:
                    request.status,

                requestedAt:
                    request.requestedAt,
            });
        }
    }

    return requests;
}


/*
|--------------------------------------------------------------------------
| Update Block Trade
|--------------------------------------------------------------------------
*/

export async function updateBlockTrade(
    id,
    data,
    file
) {
    const blockTrade =
        await BlockTrade.findById(id);

    if (!blockTrade) {
        throw new Error(
            "Block Trade not found."
        );
    }

    blockTrade.companyName =
        data.companyName?.trim() ||
        blockTrade.companyName;

    blockTrade.symbol =
        normalizeSymbol(
            data.symbol ||
            data.companyName ||
            blockTrade.companyName
        );

    blockTrade.tradeType =
        data.tradeType ||
        blockTrade.tradeType;

    blockTrade.quantity =
        Number(data.quantity);

    blockTrade.price =
        Number(data.price);

    blockTrade.value =
        Number(
            (
                blockTrade.quantity *
                blockTrade.price
            ).toFixed(2)
        );

    if (file) {
        if (
            blockTrade.logo &&
            blockTrade.logo.startsWith(
                "https://"
            )
        ) {
            try {
                const match =
                    blockTrade.logo.match(
                        /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/
                    );

                if (match) {
                    await cloudinary.uploader.destroy(
                        match[1]
                    );
                }
            } catch (error) {
                console.error(
                    "Cloudinary delete failed:",
                    error.message
                );
            }
        }

        blockTrade.logo =
            file.path;
    }

    await blockTrade.save();

    return blockTrade;
}

/*
|--------------------------------------------------------------------------
| Delete Block Trade
|--------------------------------------------------------------------------
*/

export async function deleteBlockTrade(
    id
) {
    const blockTrade =
        await BlockTrade.findById(id);

    if (!blockTrade) {
        throw new Error(
            "Block Trade not found."
        );
    }

    if (
        blockTrade.logo &&
        blockTrade.logo.startsWith(
            "https://"
        )
    ) {
        try {
            const match =
                blockTrade.logo.match(
                    /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/
                );

            if (match) {
                await cloudinary.uploader.destroy(
                    match[1]
                );
            }
        } catch (error) {
            console.error(
                "Cloudinary delete failed:",
                error.message
            );
        }
    }

    await Position.deleteMany({
        blockTradeId: blockTrade._id,
    });

    await Order.deleteMany({
        blockTradeId: blockTrade._id,
    });

    await blockTrade.deleteOne();

    return true;
}
/*
|--------------------------------------------------------------------------
| DELETE BLOCK SELL REQUEST
|--------------------------------------------------------------------------
|
| Admin deletes a Block Trade sell request.
|
| This permanently removes:
|   - the sell request
|   - the related Block Trade position
|   - related Block Trade orders
|   - the Block Trade itself
|
*/

export async function deleteBlockSellRequest(requestId) {
    if (
        !requestId ||
        typeof requestId !== "string"
    ) {
        throw new Error(
            "Sell request ID is required."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Block Trade containing this request
    |--------------------------------------------------------------------------
    */

    const blockTrade =
        await BlockTrade.findOne({
            tradeType: "BUY",
            "sellRequests.requestId":
                requestId,
        });

    if (!blockTrade) {
        throw new Error(
            "Sell request not found."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find Sell Request
    |--------------------------------------------------------------------------
    */

    const request =
        blockTrade.sellRequests.find(
            (item) =>
                item.requestId ===
                requestId
        );

    if (!request) {
        throw new Error(
            "Sell request not found."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Related Position
    |--------------------------------------------------------------------------
    */

    await Position.deleteMany({
        blockTradeId:
            blockTrade._id,
    });

    /*
    |--------------------------------------------------------------------------
    | Delete Related Orders
    |--------------------------------------------------------------------------
    */

    await Order.deleteMany({
        blockTradeId:
            blockTrade._id,
    });

    /*
    |--------------------------------------------------------------------------
    | Delete Block Trade
    |--------------------------------------------------------------------------
    |
    | The sellRequests array is embedded inside
    | the BlockTrade document.
    |
    | Therefore deleting the BlockTrade also
    | permanently removes the sell request.
    |
    */

    await blockTrade.deleteOne();

    return {
        success: true,
        requestId,
        blockTradeId:
            blockTrade._id,
    };
}