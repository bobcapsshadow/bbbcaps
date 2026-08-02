import multer from "multer";
import path from "path";
import crypto from "crypto";
import { CloudinaryStorage } from "multer-storage-cloudinary";

import cloudinary from "../config/cloudinary.js";

// =====================================================
// Allowed File Types
// =====================================================

const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
];

// =====================================================
// File Filter
// =====================================================

const fileFilter = (req, file, cb) => {

    const extension = path
        .extname(file.originalname)
        .toLowerCase();

    const validMime =
        allowedMimeTypes.includes(file.mimetype);

    const validExtension =
        allowedExtensions.includes(extension);

    if (!validMime || !validExtension) {

        return cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            ),
            false
        );

    }

    cb(null, true);

};

// =====================================================
// Cloudinary Storage
// =====================================================

const storage = new CloudinaryStorage({

    cloudinary,

    params: async (req, file) => {

        let folder = "bobstock/misc";

        switch (file.fieldname) {

            case "aadhaarFront":

            case "aadhaarBack":
                folder = "bobstock/kyc/aadhaar";
                break;

            case "panImage":
                folder = "bobstock/kyc/pan";
                break;

            case "logo":
                folder = "bobstock/ipo";
                break;

            case "blockTradeLogo":
                folder = "bobstock/blocktrade";
                break;

            default:
                folder = "bobstock/misc";

        }

        return {

            folder,

            public_id:
                `${Date.now()}-${crypto.randomBytes(12).toString("hex")}`,

            resource_type: "image",

            use_filename: false,

            unique_filename: false,

            overwrite: false,

        };

    },

});
// =====================================================
// Multer Upload Configuration
// =====================================================

export const uploadKyc = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024,

        files: 3,

    },

}).fields([

    {

        name: "aadhaarFront",

        maxCount: 1,

    },

    {

        name: "aadhaarBack",

        maxCount: 1,

    },

    {

        name: "panImage",

        maxCount: 1,

    },

]);

export const uploadIPO = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024,

        files: 1,

    },

}).single("logo");

export const uploadBlockTrade = multer({

    storage,

    fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024,

        files: 1,

    },

}).single("blockTradeLogo");

// =====================================================
// Multer Error Handler
// =====================================================

export const handleUploadError = (
    err,
    req,
    res,
    next
) => {

    if (!err) {
        return next();
    }

    if (err instanceof multer.MulterError) {

        switch (err.code) {

            case "LIMIT_FILE_SIZE":

                return res.status(400).json({

                    success: false,

                    message:
                        "Each image must be smaller than 5MB.",

                });

            case "LIMIT_FILE_COUNT":

                return res.status(400).json({

                    success: false,

                    message:
                        "Maximum 3 files are allowed.",

                });

            case "LIMIT_UNEXPECTED_FILE":

                return res.status(400).json({

                    success: false,

                    message:
                        "Unexpected file received.",

                });

            default:

                return res.status(400).json({

                    success: false,

                    message: err.message,

                });

        }

    }

    return res.status(400).json({

        success: false,

        message:
            err.message ||
            "File upload failed.",

    });

};