import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(

    {

        email: {

            type: String,

            required: true,

            lowercase: true,

            trim: true,

            index: true

        },

        otp: {

            type: String,

            required: true

        },

        verified: {

            type: Boolean,

            default: false

        },

        expiresAt: {

            type: Date,

            required: true,

            

        },

        verificationExpiresAt: {

            type: Date,

            default: null

        },

        attempts: {

            type: Number,

            default: 0

        }

    },

    {

        timestamps: true

    }

);

/*
=========================================
AUTO DELETE OTP DOCUMENT
=========================================

MongoDB automatically deletes the
document once expiresAt time is reached.

No cron job.
No setInterval.
No memory leak.

*/

otpSchema.index(

    {

        expiresAt: 1

    },

    {

        expireAfterSeconds: 0

    }

);

export default mongoose.model(
    "OTP",
    otpSchema
);