import {
    buyStock,
    sellStock,
    getPosition,
    getPositions,
} from "../services/tradeService.js";

import {
    createMarketRequest,
    sellMarketPosition,
    getUserMarketRequests,
    getUserActiveMarketPositions,
    getMarketRequest,
} from "../services/marketTradeService.js";

// =====================================================
// BUY STOCK
// =====================================================
//
// POST /api/trade/buy
//
// Existing normal stock BUY endpoint.
// Kept for backward compatibility.
//


export async function buy(req, res) {

    try {

        const {
            username,
            symbol,
            quantity,
        } = req.body;


        const result =
            await buyStock(
                username,
                symbol,
                quantity
            );


        return res
            .status(200)
            .json(result);


    } catch (err) {

        console.error(
            "❌ Buy Stock Error:",
            err
        );


        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message ||
                    "Failed to buy stock.",

            });

    }

}


// =====================================================
// SELL STOCK
// =====================================================
//
// POST /api/trade/sell
//
// Existing normal stock SELL endpoint.
// Kept for backward compatibility.
//


export async function sell(req, res) {

    try {

        const {
            username,
            symbol,
            quantity,
        } = req.body;


        const result =
            await sellStock(
                username,
                symbol,
                quantity
            );


        return res
            .status(200)
            .json(result);


    } catch (err) {

        console.error(
            "❌ Sell Stock Error:",
            err
        );


        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message ||
                    "Failed to sell stock.",

            });

    }

}


// =====================================================
// GET SINGLE POSITION
// =====================================================
//
// GET /api/trade/position/:symbol?username=USERNAME
//
// Existing endpoint.
//


export async function position(
    req,
    res
) {

    try {

        const {
            username,
        } = req.query;


        const {
            symbol,
        } = req.params;


        const result =
            await getPosition(
                username,
                symbol
            );


        return res.json(
            result
        );


    } catch (err) {

        console.error(
            "❌ Get Position Error:",
            err
        );


        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message,

            });

    }

}


// =====================================================
// GET ALL POSITIONS
// =====================================================
//
// GET /api/trade/positions?username=USERNAME
//
// Existing endpoint.
//


export async function positions(
    req,
    res
) {

    try {

        const {
            username,
        } = req.query;


        const result =
            await getPositions(
                username
            );


        return res.json(
            result
        );


    } catch (err) {

        console.error(
            "❌ Get Positions Error:",
            err
        );


        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message,

            });

    }

}

// =====================================================
// CREATE MARKET REQUEST
// =====================================================
//
// POST /api/trade/market-request
//
// Creates a new admin-controlled MarketRequest.
// The MarketRequest remains PENDING until Admin SET.
//
export async function createMarketTradeRequest(
    req,
    res
) {

    try {

        const {
            username,
            symbol,
            side = "BUY",
            quantity,
            lots,
            leverage,
        } = req.body || {};

        const normalizedSide =
            String(side || "BUY")
                .trim()
                .toUpperCase();

        // Market opening order is BUY only.
        // SELL is only used to close the existing Market position.
        if (normalizedSide !== "BUY") {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Market opening order must be BUY. Use the sell endpoint to close the existing Market position.",
                });
        }

        const result =
            await createMarketRequest({
                username,
                symbol,
                side: "BUY",
                quantity,
                lots,
                leverage,
            });

        return res
            .status(201)
            .json(
                result
            );

    } catch (err) {

        console.error(
            "❌ Create Market Request Error:",
            err
        );

        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message ||
                    "Unable to create Market request.",

            });

    }

}


// =====================================================
// SELL / CLOSE MARKET POSITION
// =====================================================
//
// POST /api/trade/market-request/:requestId/sell
//
export async function sellMarket(
    req,
    res
) {

    try {

        const {
            username,
        } = req.body || {};

        const {
            requestId,
        } = req.params;

        if (!requestId) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Market request ID is required.",

                });

        }

        const result =
            await sellMarketPosition(
                username,
                requestId
            );

        return res.json(
            result
        );

    } catch (err) {

        console.error(
            "❌ Sell Market Position Error:",
            err
        );

        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message ||
                    "Unable to sell Market position.",

            });

    }

}


// =====================================================
// GET USER MARKET REQUESTS
// =====================================================
//
// GET /api/trade/market-requests?username=USERNAME
//
export async function marketRequests(
    req,
    res
) {

    try {

        const {
            username,
            status,
        } = req.query || {};

        const result =
            await getUserMarketRequests(
                username,
                {
                    status,
                }
            );

        return res.json(
            result
        );

    } catch (err) {

        console.error(
            "❌ Get Market Requests Error:",
            err
        );

        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message ||
                    "Unable to get Market requests.",

            });

    }

}


// =====================================================
// GET USER ACTIVE MARKET POSITIONS
// =====================================================
//
// GET /api/trade/market-positions?username=USERNAME
//
export async function marketPositions(
    req,
    res
) {

    try {

        const {
            username,
        } = req.query || {};

        const result =
            await getUserActiveMarketPositions(
                username
            );

        return res.json(
            result
        );

    } catch (err) {

        console.error(
            "❌ Get Active Market Positions Error:",
            err
        );

        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message ||
                    "Unable to get active Market positions.",

            });

    }

}


// =====================================================
// GET SINGLE MARKET REQUEST
// =====================================================
//
// GET /api/trade/market-request/:requestId?username=USERNAME
//
export async function marketRequest(
    req,
    res
) {

    try {

        const {
            username,
        } = req.query || {};

        const {
            requestId,
        } = req.params;

        if (!requestId) {

            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        "Market request ID is required.",

                });

        }

        const result =
            await getMarketRequest(
                requestId,
                username
            );

        return res.json(
            result
        );

    } catch (err) {

        console.error(
            "❌ Get Market Request Error:",
            err
        );

        return res
            .status(400)
            .json({

                success: false,

                message:
                    err.message ||
                    "Unable to get Market request.",

            });

    }

}

