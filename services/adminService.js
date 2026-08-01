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