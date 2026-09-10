import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 4,
            maxlength: 20,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        password1: {
            type: String,
            default: "",
        },

        balance: {
            type: Number,
            default: 0,
            min: 0,
        },

        creditScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },

        isKycVerified: {
            type: Boolean,
            default: false,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        // Discount applied to all stocks for this user.
        // Example: 10 means 10% discount.
        discountPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        kyc: {

            status: {
                type: String,
                enum: [
                    "not_started",
                    "pending",
                    "approved",
                    "rejected",
                ],
                default: "not_started",
            },

            fullName: {
                type: String,
                default: "",
            },

            dob: {
                type: Date,
                default: null,
            },

            aadhaarNumber: {
                type: String,
                default: "",
            },

            panNumber: {
                type: String,
                default: "",
            },

            aadhaarFront: {
                type: String,
                default: "",
            },

            aadhaarBack: {
                type: String,
                default: "",
            },

            panImage: {
                type: String,
                default: "",
            },

            submittedAt: {
                type: Date,
                default: null,
            },

            approvedAt: {
                type: Date,
                default: null,
            },

            rejectedReason: {
                type: String,
                default: "",
            },

        },

        bankDetails: {

            bankName: {
                type: String,
                default: "",
                trim: true,
            },

            holderName: {
                type: String,
                default: "",
                trim: true,
            },

            accountNumber: {
                type: String,
                default: "",
                trim: true,
            },

            ifsc: {
                type: String,
                default: "",
                trim: true,
                uppercase: true,
            },

            isAdded: {
                type: Boolean,
                default: false,
            },

            addedAt: {
                type: Date,
                default: null,
            },

        },

        lastLogin: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;