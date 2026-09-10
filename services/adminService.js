import User from "../models/User.js";
import History from "../models/History.js";

/*
=========================================
GET ALL USERS
=========================================
*/

export const getAllUsers = async () => {

    return await User.find({})
        .select("-password")
        .sort({ createdAt: -1 });

};

/*
=========================================
ADD BALANCE
=========================================
*/

export const addBalance = async ({
    userId,
    amount,
}) => {

    if (!amount || Number(amount) <= 0) {
        throw new Error("Invalid amount.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    user.balance += Number(amount);

    await user.save();

    await History.create({

        userId: user._id,

        type: "deposit",

        amount: Number(amount),

        status: "completed",

        message: "Balance Updated",

    });

    return {

        message: "Balance added successfully.",

        balance: user.balance,

    };

};

/*
=========================================
DEDUCT BALANCE
=========================================
*/

export const deductBalance = async ({
    userId,
    amount,
}) => {

    if (!amount || Number(amount) <= 0) {
        throw new Error("Invalid amount.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    if (user.balance < Number(amount)) {
        throw new Error("Insufficient balance.");
    }

    user.balance -= Number(amount);

    await user.save();

    await History.create({

        userId: user._id,

        type: "withdraw",

        amount: Number(amount),

        status: "completed",

        message: "Balance deducted by admin",

    });

    return {

        message: "Balance deducted successfully.",

        balance: user.balance,

    };

};

/*
=========================================
UPDATE CREDIT SCORE
=========================================
*/

export const updateCreditScore = async ({
    userId,
    creditScore,
}) => {

    if (
        creditScore === undefined ||
        creditScore === null
    ) {
        throw new Error("Credit score is required.");
    }

    const score = Number(creditScore);

    if (Number.isNaN(score)) {
        throw new Error("Invalid credit score.");
    }

    if (score < 0 || score > 100) {
        throw new Error("Credit score must be between 0 and 100.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    user.creditScore = score;

    await user.save();

    return {

        message: "Credit score updated successfully.",

        creditScore: user.creditScore,

    };

};

/*
=========================================
UPDATE USER DISCOUNT
=========================================

Admin username aur discount percentage
dalega.

Example:

username: "yusuf"
discountPercent: 10

Is user ke saare stocks ke liye
10% discount save hoga.

0% set karne par discount remove
ho jayega.
=========================================
*/

export const updateUserDiscount = async ({
    username,
    discountPercent,
}) => {

    if (!username || !String(username).trim()) {
        throw new Error("Username is required.");
    }

    if (
        discountPercent === undefined ||
        discountPercent === null ||
        discountPercent === ""
    ) {
        throw new Error("Discount percentage is required.");
    }

    const discount = Number(discountPercent);

    if (Number.isNaN(discount)) {
        throw new Error("Invalid discount percentage.");
    }

    if (discount < 0 || discount > 100) {
        throw new Error(
            "Discount percentage must be between 0 and 100."
        );
    }

    const user = await User.findOne({
        username: String(username).trim().toLowerCase(),
    });

    if (!user) {
        throw new Error("User not found.");
    }

    user.discountPercent = discount;

    await user.save();

    return {

        message: "User discount updated successfully.",

        username: user.username,

        discountPercent: user.discountPercent,

    };

};