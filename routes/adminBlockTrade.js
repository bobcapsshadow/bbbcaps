import express from "express";

import {
    getAll,
    create,
    update,
    remove,
    getSellRequests,
    deleteSellRequest,
} from "../controllers/adminBlockTradeController.js";

import {
    uploadBlockTrade,
    handleUploadError,
} from "../middleware/upload.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin Block Trade Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Get All Block Trades
|--------------------------------------------------------------------------
*/

router.get(
    "/all",
    getAll
);

/*
|--------------------------------------------------------------------------
| Get Block Sell Requests
|--------------------------------------------------------------------------
|
| Admin panel ke liye pending SELL requests.
|
*/

router.get(
    "/sell-requests",
    getSellRequests
);

/*
|--------------------------------------------------------------------------
| Delete Block Sell Request
|--------------------------------------------------------------------------
|
| Admin delete par:
| - Sell request remove
| - Related Position remove
| - Related Block Trade Order(s) remove
| - Block Trade remove
|
*/

router.delete(
    "/sell-requests/:requestId",
    deleteSellRequest
);

/*
|--------------------------------------------------------------------------
| Create Block Trade
|--------------------------------------------------------------------------
*/

router.post(
    "/create",
    uploadBlockTrade,
    handleUploadError,
    create
);

/*
|--------------------------------------------------------------------------
| Update Block Trade
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",
    uploadBlockTrade,
    handleUploadError,
    update
);

/*
|--------------------------------------------------------------------------
| Delete Block Trade
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",
    remove
);

export default router;