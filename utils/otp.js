// backend/utils/otp.js

import crypto from "crypto";

/*
=========================================
CONFIG
=========================================
*/

export const OTP_LENGTH =
    Number(process.env.OTP_LENGTH || 6);

export const OTP_EXPIRY_MINUTES =
    Number(process.env.OTP_EXPIRY_MINUTES || 1);

export const VERIFICATION_EXPIRY_MINUTES =
    Number(process.env.VERIFICATION_EXPIRY_MINUTES || 5);

/*
=========================================
GENERATE SECURE OTP
=========================================
*/

export function generateOTP() {

    const min = Math.pow(10, OTP_LENGTH - 1);

    const max = Math.pow(10, OTP_LENGTH);

    return crypto
        .randomInt(min, max)
        .toString();

}

/*
=========================================
OTP EXPIRY
=========================================
*/

export function getExpiryTime() {

    return new Date(

        Date.now() +

        OTP_EXPIRY_MINUTES * 60 * 1000

    );

}

/*
=========================================
VERIFICATION EXPIRY
=========================================
*/

export function getVerificationExpiry() {

    return new Date(

        Date.now() +

        VERIFICATION_EXPIRY_MINUTES * 60 * 1000

    );

}

/*
=========================================
CHECK EXPIRED
=========================================
*/

export function isExpired(expiresAt) {

    if (!expiresAt)
        return true;

    return new Date() > new Date(expiresAt);

}