import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

// =====================================================
// Resolve Current Directory
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// Upload Directories
// =====================================================

const uploadRoot = path.join(__dirname, "../uploads");

const aadhaarDir = path.join(uploadRoot, "aadhaar");
const panDir = path.join(uploadRoot, "pan");
const ipoDir = path.join(uploadRoot, "ipo");
const blockTradeDir = path.join(
    uploadRoot,
    "blocktrade"
);

// =====================================================
// Create Upload Folders Automatically
// =====================================================

[aadhaarDir, panDir, ipoDir, blockTradeDir,].forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true,
        });
    }
});

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

    const extension = path.extname(file.originalname).toLowerCase();

    const validMime = allowedMimeTypes.includes(file.mimetype);

    const validExtension = allowedExtensions.includes(extension);

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
// Storage
// =====================================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        switch (file.fieldname) {

            case "aadhaarFront":

            case "aadhaarBack":
                cb(null, aadhaarDir);
                break;

            case "panImage":
                cb(null, panDir);
                break;

            case "logo":
                cb(null, ipoDir);
                break;

            case "blockTradeLogo":
                cb(null, blockTradeDir);
                break;

            default:
                cb(new Error("Invalid upload field."));
        }

    },

    filename: (req, file, cb) => {

        const extension = path.extname(file.originalname);

        const uniqueName =
            `${Date.now()}-${crypto.randomBytes(12).toString("hex")}${extension}`;

        cb(null, uniqueName);

    },

});
// =====================================================
// Multer Upload Configuration
// =====================================================

export const uploadKyc = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
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
        message: err.message || "File upload failed.",
    });

};