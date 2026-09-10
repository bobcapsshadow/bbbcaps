import User from "../models/User.js";
import Position from "../models/Position.js";
import Order from "../models/Order.js";
import { fetchStock } from "./yahooService.js";

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
        throw new Error("Stock symbol is required.");
    }

    return symbol.trim().toUpperCase();
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

/*
|--------------------------------------------------------------------------
| Exchange Helper
|--------------------------------------------------------------------------
*/

function normalizeExchange(stock, symbol) {
    if (
        symbol &&
        symbol.endsWith(".BO")
    ) {
        return "BSE";
    }

    if (
        stock &&
        stock.exchange === "BSE"
    ) {
        return "BSE";
    }

    return "NSE";
}

/*
|--------------------------------------------------------------------------
| Regular Position Filter
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Block Trade positions have blockTradeId.
|
| Normal stock trading must NEVER pick a Block Trade position.
|
| Normal positions have:
|
| blockTradeId = null
|
*/

function regularPositionFilter(
    userId,
    symbol
) {
    return {
        userId,
        symbol,

        /*
        |--------------------------------------------------------------------------
        | Only normal stock positions.
        |--------------------------------------------------------------------------
        |
        | MongoDB treats null as matching fields that are null or missing.
        | Existing old positions without blockTradeId therefore continue
        | working.
        |
        */
        blockTradeId: null,
    };
}

/*
|--------------------------------------------------------------------------
| Live Stock Validation
|--------------------------------------------------------------------------
|
| Ensures the stock exists BEFORE any of its properties are accessed.
|
*/

function validateLiveStock(stock) {
    if (!stock) {
        throw new Error(
            "Unable to fetch stock."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Optional Market Check
    |--------------------------------------------------------------------------
    |
    | Set:
    |
    | SKIP_MARKET_CHECK=true
    |
    | only when you intentionally want to bypass
    | market timing validation.
    |
    */

    const skipMarketCheck =
        String(
            process.env.SKIP_MARKET_CHECK
        ).toLowerCase() === "true";

    if (!skipMarketCheck) {
        const now = new Date();

        const indiaTime =
            new Date(
                now.toLocaleString(
                    "en-US",
                    {
                        timeZone:
                            "Asia/Kolkata",
                    }
                )
            );

        const day =
            indiaTime.getDay();

        const hour =
            indiaTime.getHours();

        const minute =
            indiaTime.getMinutes();

        const currentMinutes =
            hour * 60 + minute;

        const marketOpen =
            9 * 60 + 15;

        const marketClose =
            15 * 60 + 30;

        const isWeekday =
            day >= 1 &&
            day <= 5;

        if (
            !isWeekday ||
            currentMinutes <
                marketOpen ||
            currentMinutes >
                marketClose
        ) {
            throw new Error(
                "Market is currently closed."
            );
        }
    }

    if (
        !stock.price ||
        stock.price <= 0
    ) {
        throw new Error(
            "Invalid live stock price."
        );
    }
}

/*
|--------------------------------------------------------------------------
| Update Position Values
|--------------------------------------------------------------------------
|
| Single source of truth for:
|
| currentPrice
| currentValue
| profitLoss
| profitLossPercent
| lastPriceUpdated
|
*/

function updatePosition(
    position,
    currentPrice
) {
    position.currentPrice =
        currentPrice;

    position.currentValue =
        Number(
            (
                position.quantity *
                currentPrice
            ).toFixed(2)
        );

    // IMPORTANT:
    // investedAmount is the ACTUAL discounted cash paid at BUY time.
    // It must NOT be used as the P&L cost basis.
    // P&L is calculated against the REAL market BUY price in averagePrice.
    const realCostBasis =
        Number(
            (
                position.averagePrice *
                position.quantity
            ).toFixed(2)
        );

    position.profitLoss =
        Number(
            (
                position.currentValue -
                realCostBasis
            ).toFixed(2)
        );

    position.profitLossPercent =
        realCostBasis === 0
            ? 0
            : Number(
                  (
                      (
                          position.profitLoss /
                          realCostBasis
                      ) *
                      100
                  ).toFixed(2)
              );

    position.lastPriceUpdated =
        new Date();

    return position;
}

/*
|--------------------------------------------------------------------------
| BUY STOCK
|--------------------------------------------------------------------------
|
| POST /api/trade/buy
|
| This function handles ONLY normal market stock BUY.
|
| Block Trade BUY is handled by blockTradeService.js.
|
*/

export async function buyStock(
    username,
    symbol,
    quantity
) {
    username =
        normalizeUsername(username);

    symbol =
        normalizeSymbol(symbol);

    quantity =
        validateQuantity(quantity);

    /*
    |--------------------------------------------------------------------------
    | Find User
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
    | Fetch Live Stock
    |--------------------------------------------------------------------------
    */

    const stock =
        await fetchStock(symbol);

    validateLiveStock(stock);

    /*
    |--------------------------------------------------------------------------
    | Calculate Buy Amount
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | Calculate User Discounted Buy Amount
    |--------------------------------------------------------------------------
    |
    | Admin can set one discount percentage on a user.
    | That discount applies to ALL normal stocks purchased
    | by that user.
    |
    | Example:
    | Stock price = ₹1,000
    | Discount    = 10%
    | Buy price   = ₹900
    |
    | IMPORTANT:
    | The discount is calculated on the backend using the
    | user's saved discountPercent. The frontend price is
    | never trusted for the purchase calculation.
    |
    */

    const discountPercent =
        Number(
            user.discountPercent || 0
        );

    if (
        !Number.isFinite(discountPercent) ||
        discountPercent < 0 ||
        discountPercent > 100
    ) {
        throw new Error(
            "Invalid user discount percentage."
        );
    }

    const discountAmount =
        Number(
            (
                stock.price *
                (discountPercent / 100)
            ).toFixed(2)
        );

    const discountedPrice =
        Number(
            (
                stock.price -
                discountAmount
            ).toFixed(2)
        );

    const totalAmount =
        Number(
            (
                discountedPrice *
                quantity
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Balance Check
    |--------------------------------------------------------------------------
    */

    const currentBalance =
        Number(
            user.balance || 0
        );

    const updatedBalance =
        Number(
            (
                currentBalance -
                totalAmount
            ).toFixed(2)
        );

    if (
        updatedBalance < 0
    ) {
        throw new Error(
            `Insufficient balance. Required ₹${totalAmount}`
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Existing NORMAL Position
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | blockTradeId: null prevents a Block Trade
    | position from being merged into normal stock trading.
    |
    */

    let position =
        await Position.findOne(
            regularPositionFilter(
                user._id,
                symbol
            )
        );

    /*
    |--------------------------------------------------------------------------
    | Create New NORMAL Position
    |--------------------------------------------------------------------------
    */

    if (!position) {
        position =
            new Position({
                userId:
                    user._id,

                username:
                    user.username,

                symbol,

                company:
                    stock.companyName ||
                    symbol,

                exchange:
                    normalizeExchange(
                        stock,
                        symbol
                    ),

                logo:
                    stock.logo || "",

                quantity,

                averagePrice:
                    stock.price,

                investedAmount:
                    totalAmount,

                blockTradeId:
                    null,
            });

        updatePosition(
            position,
            stock.price
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Existing NORMAL Position Update
    |--------------------------------------------------------------------------
    */

    else {
        const updatedQuantity =
            position.quantity +
            quantity;

        // P&L cost basis uses REAL market BUY prices.
        // totalAmount remains the discounted amount actually paid.
        const existingRealCostBasis =
            Number(position.averagePrice || 0) *
            Number(position.quantity || 0);

        const newRealCostBasis =
            Number(stock.price || 0) *
            Number(quantity || 0);

        const updatedRealCostBasis =
            existingRealCostBasis +
            newRealCostBasis;

        const updatedAveragePrice =
            updatedQuantity === 0
                ? 0
                : updatedRealCostBasis /
                  updatedQuantity;

        const updatedInvestment =
            position.investedAmount +
            totalAmount;

        position.quantity =
            updatedQuantity;

        position.averagePrice =
            Number(
                updatedAveragePrice.toFixed(
                    2
                )
            );

        // Actual discounted cash paid remains the accounting amount.
        position.investedAmount =
            Number(
                updatedInvestment.toFixed(
                    2
                )
            );

        updatePosition(
            position,
            stock.price
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Position
    |--------------------------------------------------------------------------
    */

    if (
        position.quantity <= 0
    ) {
        throw new Error(
            "Invalid position quantity."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Save Position
    |--------------------------------------------------------------------------
    */

    await position.save();

    /*
    |--------------------------------------------------------------------------
    | Save BUY Order
    |--------------------------------------------------------------------------
    */

    await Order.create({
        userId:
            user._id,

        username:
            user.username,

        symbol,

        company:
            stock.companyName ||
            symbol,

        exchange:
            normalizeExchange(
                stock,
                symbol
            ),

        type: "BUY",

        quantity,

        price:
            discountedPrice,

        totalAmount,

        averageBuyPrice:
            discountedPrice,

        realizedProfit:
            0,
    });

    /*
    |--------------------------------------------------------------------------
    | Deduct User Balance
    |--------------------------------------------------------------------------
    */

    user.balance =
        updatedBalance;

    await user.save();

    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    return {
        success: true,

        message:
            "Stock purchased successfully.",

        order: {
            type: "BUY",

            symbol:
                position.symbol,

            company:
                position.company,

            exchange:
                position.exchange,

            quantity,

            originalPrice:
                stock.price,

            discountPercent,

            discountAmount,

            price:
                discountedPrice,

            totalAmount,

            orderTime:
                new Date(),
        },

        position: {
            symbol:
                position.symbol,

            company:
                position.company,

            quantity:
                position.quantity,

            averagePrice:
                position.averagePrice,

            investedAmount:
                position.investedAmount,

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
            balance:
                user.balance,
        },
    };
}

/*
|--------------------------------------------------------------------------
| SELL STOCK
|--------------------------------------------------------------------------
|
| Normal market SELL only.
|
| Block Trade SELL requests are handled separately by
| blockTradeService.js.
|
*/

export async function sellStock(
    username,
    symbol,
    quantity
) {
    username =
        normalizeUsername(username);

    symbol =
        normalizeSymbol(symbol);

    quantity =
        validateQuantity(quantity);

    /*
    |--------------------------------------------------------------------------
    | Find User
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
    | Find NORMAL Position Only
    |--------------------------------------------------------------------------
    */

    const position =
        await Position.findOne(
            regularPositionFilter(
                user._id,
                symbol
            )
        );

    if (!position) {
        throw new Error(
            "You don't own this stock."
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Quantity Validation
    |--------------------------------------------------------------------------
    */

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
    | Fetch Live Price
    |--------------------------------------------------------------------------
    */

    const stock =
        await fetchStock(symbol);

    validateLiveStock(stock);

    /*
    |--------------------------------------------------------------------------
    | Sell Amount
    |--------------------------------------------------------------------------
    */

    const sellAmount =
        Number(
            (
                stock.price *
                quantity
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Average Cost
    |--------------------------------------------------------------------------
    */

    const averageCost =
        Number(
            Number(
                position.averagePrice
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Cost Of Sold Shares
    |--------------------------------------------------------------------------
    */

    const soldInvestment =
        Number(
            (
                averageCost *
                quantity
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Realized Profit
    |--------------------------------------------------------------------------
    */

    const realizedProfit =
        Number(
            (
                sellAmount -
                soldInvestment
            ).toFixed(2)
        );

    /*
    |--------------------------------------------------------------------------
    | Remaining Position
    |--------------------------------------------------------------------------
    */

    const remainingQuantity =
        position.quantity -
        quantity;

    /*
    |--------------------------------------------------------------------------
    | Save Position / Full Sell
    |--------------------------------------------------------------------------
    */

    if (
        remainingQuantity === 0
    ) {
        await Position.deleteOne({
            _id:
                position._id,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Partial Sell
    |--------------------------------------------------------------------------
    */

    else {
        position.quantity =
            remainingQuantity;

        // Preserve the proportional ACTUAL discounted cash paid
        // for the shares that remain after a partial SELL.
        const originalQuantity =
            Number(position.quantity || 0);

        const originalInvestedAmount =
            Number(position.investedAmount || 0);

        const remainingInvestedAmount =
            originalQuantity > 0
                ? (
                      originalInvestedAmount *
                      remainingQuantity
                  ) /
                  originalQuantity
                : 0;

        position.investedAmount =
            Number(
                remainingInvestedAmount.toFixed(2)
            );

        updatePosition(
            position,
            stock.price
        );

        await position.save();
    }

    /*
    |--------------------------------------------------------------------------
    | Save SELL Order
    |--------------------------------------------------------------------------
    */

    await Order.create({
        userId:
            user._id,

        username:
            user.username,

        symbol,

        company:
            stock.companyName ||
            symbol,

        exchange:
            normalizeExchange(
                stock,
                symbol
            ),

        type: "SELL",

        quantity,

        price:
            stock.price,

        totalAmount:
            sellAmount,

        averageBuyPrice:
            averageCost,

        realizedProfit,
    });

    /*
    |--------------------------------------------------------------------------
    | Add Money To Wallet
    |--------------------------------------------------------------------------
    */

    const currentBalance =
        Number(
            user.balance || 0
        );

    const updatedBalance =
        Number(
            (
                currentBalance +
                sellAmount
            ).toFixed(2)
        );

    if (
        updatedBalance < 0
    ) {
        throw new Error(
            "Wallet balance became invalid."
        );
    }

    user.balance =
        updatedBalance;

    await user.save();

    /*
    |--------------------------------------------------------------------------
    | Success Response
    |--------------------------------------------------------------------------
    */

    return {
        success: true,

        message:
            "Stock sold successfully.",

        order: {
            type: "SELL",

            symbol,

            company:
                position.company,

            exchange:
                position.exchange,

            quantity,

            sellPrice:
                stock.price,

            averageBuyPrice:
                averageCost,

            sellAmount,

            realizedProfit,

            orderTime:
                new Date(),
        },

        wallet: {
            balance:
                user.balance,
        },

        remainingPosition:
            remainingQuantity === 0
                ? null
                : {
                      symbol:
                          position.symbol,

                      company:
                          position.company,

                      quantity:
                          position.quantity,

                      averagePrice:
                          position.averagePrice,

                      investedAmount:
                          position.investedAmount,

                      currentPrice:
                          position.currentPrice,

                      currentValue:
                          position.currentValue,

                      profitLoss:
                          position.profitLoss,

                      profitLossPercent:
                          position.profitLossPercent,
                  },
    };
}

/*
|--------------------------------------------------------------------------
| GET SINGLE NORMAL POSITION
|--------------------------------------------------------------------------
|
| Block Trade positions are intentionally excluded.
|
*/

export async function getPosition(
    username,
    symbol
) {
    username =
        normalizeUsername(username);

    symbol =
        normalizeSymbol(symbol);

    /*
    |--------------------------------------------------------------------------
    | Find User
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
    | Find NORMAL Position
    |--------------------------------------------------------------------------
    */

    const position =
        await Position.findOne(
            regularPositionFilter(
                user._id,
                symbol
            )
        );

    if (!position) {
        return {
            success: true,

            position: null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Refresh Live Price
    |--------------------------------------------------------------------------
    |
    | If Yahoo fails, don't break the API.
    |
    */

    try {
        const stock =
            await fetchStock(
                position.symbol
            );

        if (
            stock &&
            stock.price > 0
        ) {
            updatePosition(
                position,
                stock.price
            );

            await position.save();
        }
    } catch (error) {
        console.error(
            `Failed to refresh live price for ${position.symbol}:`,
            error
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return {
        success: true,

        position,
    };
}

/*
|--------------------------------------------------------------------------
| GET ALL NORMAL POSITIONS
|--------------------------------------------------------------------------
|
| Block Trade positions are intentionally excluded.
|
*/

export async function getPositions(
    username
) {
    username =
        normalizeUsername(username);

    /*
    |--------------------------------------------------------------------------
    | Find User
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
    | Find NORMAL Positions Only
    |--------------------------------------------------------------------------
    */

    const positions =
    await Position.find({
        userId:
            user._id,
    });

    /*
    |--------------------------------------------------------------------------
    | Refresh Live Prices
    |--------------------------------------------------------------------------
    |
    | Parallel refresh.
    |
    | One failed Yahoo request does not break
    | the remaining positions.
    |
    */

    await Promise.all(
        positions.map(
            async (position) => {
                // Block Trade positions use the
                // admin-defined Block Trade price.
                if (position.blockTradeId) {
                    return;
                }
    
                try {
                    const stock =
                        await fetchStock(
                            position.symbol
                        );
    
                    if (
                        stock &&
                        stock.price > 0
                    ) {
                        updatePosition(
                            position,
                            stock.price
                        );
    
                        await position.save();
                    }
                } catch (error) {
                    console.error(
                        `Failed to refresh live price for ${position.symbol}:`,
                        error
                    );
                }
            }
        )
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return {
        success: true,

        positions,
    };
}