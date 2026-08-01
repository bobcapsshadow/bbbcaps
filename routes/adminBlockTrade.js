import express from "express";

import {
    getAll,
    create,
    update,
    remove,
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

router.get(
    "/all",
    getAll
);


// Create Block Trade
router.post(
    "/create",
    uploadBlockTrade,
    handleUploadError,
    create
);

router.put(
    "/:id",
    uploadBlockTrade,
    handleUploadError,
    update
);

// Delete Block Trade
router.delete(
    "/:id",
    remove
);

export default router;