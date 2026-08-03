import express from "express";

import {
    uploadIPO,
    handleUploadError,
} from "../middleware/upload.js";

import {
    create,
    update,
    updateUser,
    remove,
    close,
} from "../controllers/adminIPOController.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Admin IPO Routes
|--------------------------------------------------------------------------
*/

// Create IPO
router.post(
    "/create",
    uploadIPO,
    handleUploadError,
    create
);

// Update User IPO
router.put("/update-user", updateUser);

// Close IPO
router.put("/close/:id", close);

router.put(
    "/:id",
    uploadIPO,
    handleUploadError,
    update
);

// Delete IPO
router.delete("/:id", remove);

export default router;