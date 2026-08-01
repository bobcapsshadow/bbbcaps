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
    if (!username || typeof username !== "string" || !username.trim()) {
        throw new Error("Username is required.");
    }

    return username.trim().toLowerCase();
}

function normalizeSymbol(symbol) {
    if (!symbol || typeof symbol !== "string" || !symbol.trim()) {
        throw new Error("Stock symbol is required.");
    }

    return symbol.trim().toUpperCase();
}

function validateQuantity(quantity) {

    const qty = Number(quantity);

    if (!Number.isFinite(qty) || Number.isNaN(qty) || qty <= 0) {
        throw new Error("Invalid quantity.");
    }

    return qty;
}

/*
|--------------------------------------------------------------------------
| Live Stock Validation
|--------------------------------------------------------------------------
| Ensures the stock exists BEFORE any of its properties (like marketState)
| are accessed, preventing "Cannot read property of undefined" crashes.
*/

function validateLiveStock(stock) {

    if (!stock) {
        throw new Error("Unable to fetch stock.");
    }

    const skipMarketCheck =
    String(process.env.SKIP_MARKET_CHECK).toLowerCase() === "true";

if (!skipMarketCheck) {

    const now = new Date();

    // India Standard Time
    const indiaTime = new Date(
        now.toLocaleString("en-US", {
            timeZone: "Asia/Kolkata",
        })
    );

    const day = indiaTime.getDay(); // 0=Sun, 6=Sat

    const hour = indiaTime.getHours();
    const minute = indiaTime.getMinutes();

    const currentMinutes = hour * 60 + minute;

    const marketOpen = 9 * 60 + 15;   // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    const isWeekday = day >= 1 && day <= 5;

    if (
        !isWeekday ||
        currentMinutes < marketOpen ||
        currentMinutes > marketClose
    ) {
        throw new Error("Market is currently closed.");
    }
}

    if (!stock.price || stock.price <= 0) {
        throw new Error("Invalid live stock price.");
    }

}

/*
|--------------------------------------------------------------------------
| Update Position Values
|--------------------------------------------------------------------------
| Single source of truth for recalculating a position's derived fields:
| currentPrice, currentValue, profitLoss, profitLossPercent and
| lastPriceUpdated. Used for new positions, merges and partial sells so
| these numbers can never drift out of sync with each other.
*/

function updatePosition(position, currentPrice) {

    position.currentPrice = currentPrice;

    position.currentValue = Number(
        (position.quantity * currentPrice).toFixed(2)
    );

    position.profitLoss = Number(
        (
            position.currentValue -
            position.investedAmount
        ).toFixed(2)
    );

    position.profitLossPercent =
        position.investedAmount === 0
            ? 0
            : Number(
                  (
                      (position.profitLoss /
                          position.investedAmount) *
                      100
                  ).toFixed(2)
              );

    position.lastPriceUpdated = new Date();

    return position;

}
/*
|--------------------------------------------------------------------------
| BUY STOCK
|--------------------------------------------------------------------------
*/

export async function buyStock(username, symbol, quantity) {

    username = normalizeUsername(username);

    symbol = normalizeSymbol(symbol);

    quantity = validateQuantity(quantity);

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findOne({
        username,
    });

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Fetch Live Stock
    //----------------------------------

    const stock = await fetchStock(symbol);

    // Existence check must happen before touching any stock property.
    validateLiveStock(stock);

    //----------------------------------
    // Calculate Buy Amount
    //----------------------------------

    const totalAmount = Number(
        (stock.price * quantity).toFixed(2)
    );

    //----------------------------------
    // Balance Check
    //----------------------------------
    // Balance is computed first, then validated, then only persisted
    // once we know the trade is actually allowed to go through.

    const updatedBalance = Number(
        (user.balance - totalAmount).toFixed(2)
    );

    if (updatedBalance < 0) {
        throw new Error(
            `Insufficient balance. Required ₹${totalAmount}`
        );
    }

    //----------------------------------
    // Existing Position
    //----------------------------------

    let position = await Position.findOne({
        userId: user._id,
        symbol,
    });

    //----------------------------------
    // Create New Position
    //----------------------------------

    if (!position) {

        position = new Position({

            userId: user._id,

            username: user.username,

            symbol,

            company: stock.companyName,

            // Prefer the exchange reported by the live feed; fall back to
            // symbol-suffix detection only when Yahoo doesn't provide one.
            exchange: stock.exchange || (
                symbol.endsWith(".BO")
                    ? "BSE"
                    : "NSE"
            ),

            quantity,

            averagePrice: stock.price,

            investedAmount: totalAmount,

        });

        // Derive currentValue / profitLoss / profitLossPercent /
        // lastPriceUpdated through the single shared helper so a brand
        // new position is calculated exactly the same way as any other.
        updatePosition(position, stock.price);

    }
        //----------------------------------
    // Existing Position Update
    //----------------------------------

    else {

        const updatedQuantity =
            position.quantity + quantity;

        const updatedInvestment =
            position.investedAmount + totalAmount;

        const updatedAveragePrice =
            updatedInvestment / updatedQuantity;

        position.quantity = updatedQuantity;

        position.averagePrice = Number(
            updatedAveragePrice.toFixed(2)
        );

        position.investedAmount = Number(
            updatedInvestment.toFixed(2)
        );

        position.currentPrice = stock.price;

        updatePosition(
            position,
            stock.price
        );

    }

    //----------------------------------
    // Save Position
    //----------------------------------
    if (position.quantity <= 0) {
        throw new Error("Invalid position quantity.");
    }

    await position.save();

    //----------------------------------
    // Save Order
    //----------------------------------
    // A completed order record is created only after the position has
    // been persisted successfully, and before the wallet is touched.

    await Order.create({

        userId: user._id,

        username: user.username,

        symbol,

        company: stock.companyName || symbol,

        exchange: stock.exchange || "NSE",

        type: "BUY",

        quantity,

        price: stock.price,

        totalAmount,

        averageBuyPrice: stock.price,

        realizedProfit: 0,

    });

    //----------------------------------
    // Deduct User Balance
    //----------------------------------

    user.balance = updatedBalance;

    await user.save();

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        message: "Stock purchased successfully.",

        order: {

            type: "BUY",

            symbol: position.symbol,

            company: position.company,

            exchange: position.exchange,

            quantity,

            price: stock.price,

            totalAmount,

            orderTime: new Date(),

        },

        position: {

            symbol: position.symbol,

            company: position.company,

            quantity: position.quantity,

            averagePrice: position.averagePrice,

            investedAmount: position.investedAmount,

            currentPrice: position.currentPrice,

            currentValue: position.currentValue,

            profitLoss: position.profitLoss,

            profitLossPercent: position.profitLossPercent,

        },

        wallet: {

            balance: user.balance,

        },

    };

}
/*
|--------------------------------------------------------------------------
| SELL STOCK
|--------------------------------------------------------------------------
*/

export async function sellStock(username, symbol, quantity) {

    username = normalizeUsername(username);

    symbol = normalizeSymbol(symbol);

    quantity = validateQuantity(quantity);

    //----------------------------------
    // Find User
    //----------------------------------

    const user = await User.findOne({
        username,
    });

    if (!user) {
        throw new Error("User not found.");
    }

    //----------------------------------
    // Find Position
    //----------------------------------

    const position = await Position.findOne({
        userId: user._id,
        symbol,
    });

    if (!position) {
        throw new Error(
            "You don't own this stock."
        );
    }

    //----------------------------------
    // Quantity Validation
    //----------------------------------

    if (quantity > position.quantity) {

        throw new Error(
            `You only own ${position.quantity} shares.`
        );

    }

    //----------------------------------
    // Fetch Live Price
    //----------------------------------

    const stock = await fetchStock(symbol);

    // Existence check must happen before touching any stock property.
    validateLiveStock(stock);

    //----------------------------------
    // Sell Amount
    //----------------------------------

    const sellAmount = Number(
        (stock.price * quantity).toFixed(2)
    );

    //----------------------------------
    // Average Cost
    //----------------------------------

    const averageCost = Number(
        position.averagePrice.toFixed(2)
    );

    //----------------------------------
    // Cost Of Sold Shares
    //----------------------------------

    const soldInvestment = Number(
        (averageCost * quantity).toFixed(2)
    );

    //----------------------------------
    // Realized Profit
    //----------------------------------

    const realizedProfit = Number(
        (
            sellAmount -
            soldInvestment
        ).toFixed(2)
    );
        //----------------------------------
    // Remaining Position
    //----------------------------------

    const remainingQuantity =
        position.quantity - quantity;

    //----------------------------------
    // Full Sell
    //----------------------------------

    if (remainingQuantity === 0) {

        await Position.deleteOne({
            _id: position._id,
        });

    }

    //----------------------------------
    // Partial Sell
    //----------------------------------

    else {

        position.quantity = remainingQuantity;

        position.investedAmount = Number(
            (
                position.averagePrice *
                remainingQuantity
            ).toFixed(2)
        );

        position.currentPrice = stock.price;

        updatePosition(
            position,
            stock.price
        );

        await position.save();

    }

    //----------------------------------
    // Save Order
    //----------------------------------
    // A completed order record is created only after the position has
    // been updated/deleted successfully, and before the wallet is touched.

    await Order.create({

        userId: user._id,

        username: user.username,

        symbol,

        company: stock.companyName || symbol,

        exchange: stock.exchange || "NSE",

        type: "SELL",

        quantity,

        price: stock.price,

        totalAmount: sellAmount,

        averageBuyPrice: averageCost,

        realizedProfit,

    });

    //----------------------------------
    // Add Money To Wallet
    //----------------------------------
    // Balance is computed and validated before it is ever persisted.

    const updatedBalance = Number(
        (
            user.balance +
            sellAmount
        ).toFixed(2)
    );

    if (updatedBalance < 0) {
        throw new Error("Wallet balance became invalid.");
    }

    user.balance = updatedBalance;

    await user.save();

    //----------------------------------
    // Success Response
    //----------------------------------

    return {

        success: true,

        message: "Stock sold successfully.",

        order: {

            type: "SELL",

            symbol,

            company: position.company,

            exchange: position.exchange,

            quantity,

            sellPrice: stock.price,

            averageBuyPrice:
                averageCost,

            sellAmount,

            realizedProfit,

            orderTime: new Date(),

        },

        wallet: {

            balance: user.balance,

        },

        remainingPosition:

            remainingQuantity === 0

                ? null

                : {

                    symbol: position.symbol,

                    company: position.company,

                    quantity: position.quantity,

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
export async function getPosition(username, symbol) {

    username = normalizeUsername(username);
    symbol = normalizeSymbol(symbol);

    const user = await User.findOne({ username });

    if (!user) {
        throw new Error("User not found.");
    }

    const position = await Position.findOne({
        userId: user._id,
        symbol,
    });

    if (!position) {
        return {
            success: true,
            position: null,
        };
    }

    //----------------------------------
    // Refresh Live Price (StockDetails-style)
    //----------------------------------
    // If Yahoo fails, do NOT throw — simply log and fall back to the
    // existing MongoDB values so the API never breaks.

    try {

        const stock = await fetchStock(position.symbol);

        if (stock && stock.price > 0) {

            updatePosition(position, stock.price);

            await position.save();

        }

    } catch (error) {
        console.error(
            `Failed to refresh live price for ${position.symbol}:`,
            error
        );
    }

    return {
        success: true,
        position,
    };
}
export async function getPositions(username) {

    username = normalizeUsername(username);

    const user = await User.findOne({ username });

    if (!user) {
        throw new Error("User not found.");
    }

    const positions = await Position.find({
        userId: user._id,
    });

    //----------------------------------
    // Refresh Live Prices (StockDetails-style)
    //----------------------------------
    // Every position is refreshed in parallel via Promise.all() for
    // production performance. If Yahoo fails for one stock, do NOT
    // throw and do NOT stop the others — simply log and keep the
    // existing MongoDB values for that position.

    await Promise.all(
        positions.map(async (position) => {

            try {

                const stock = await fetchStock(position.symbol);

                if (stock && stock.price > 0) {

                    updatePosition(position, stock.price);

                    await position.save();

                }

            } catch (error) {
                console.error(
                    `Failed to refresh live price for ${position.symbol}:`,
                    error
                );
            }

        })
    );

    return {
        success: true,
        positions,
    };
}