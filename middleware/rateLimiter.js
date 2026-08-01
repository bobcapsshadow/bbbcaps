// backend/middleware/rateLimiter.js

import rateLimit from "express-rate-limit";

/**
 * OTP Send Limiter
 */

export const otpLimiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 5,

    standardHeaders: true,

    legacyHeaders: false,

    message: {

        success: false,

        message:
            "Too many OTP requests. Please try again after 15 minutes."

    }

});

/**
 * OTP Verify Limiter
 */

export const verifyLimiter = rateLimit({

    windowMs: 10 * 60 * 1000,

    max: 10,

    standardHeaders: true,

    legacyHeaders: false,

    message: {

        success: false,

        message:
            "Too many verification attempts. Please try again later."

    }

});