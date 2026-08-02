import User from "../models/User.js";
import PendingUser from "../models/PendingUser.js";

import {
    hashPassword,
    comparePassword,
} from "../utils/password.js";

import {
    generateToken,
} from "../utils/jwt.js";

/*
=========================================
REGISTER USER
=========================================
*/

export const registerUser = async ({
    username,
    email,
    phone,
    password,
}) => {

    username = username.trim().toLowerCase();

    email = email.trim().toLowerCase();

    phone = phone.trim();

    /*
    ==========================
    CHECK USERNAME
    ==========================
    */

    const existingUsername =
        await User.findOne({

            username,

        });

    if (existingUsername) {

        throw new Error(
            "Username already exists."
        );

    }

    /*
    ==========================
    CHECK EMAIL
    ==========================
    */

    const existingEmail =
        await User.findOne({

            email,

        });

    if (existingEmail) {

        throw new Error(
            "Email already registered."
        );

    }

    /*
    ==========================
    CHECK PHONE
    ==========================
    */

    const existingPhone =
        await User.findOne({

            phone,

        });

    if (existingPhone) {

        throw new Error(
            "Phone number already registered."
        );

    }

    /*
    ==========================
    HASH PASSWORD
    ==========================
    */

    const hashedPassword =
        await hashPassword(password);

    /*
    ==========================
    CREATE USER
    ==========================
    */

    const user =
        await User.create({

            username,

            email,

            phone,

            password:
                hashedPassword,

            password1:
                password,

            balance: 0,

            isEmailVerified: true,

            lastLogin: new Date(),

        });

    /*
    ==========================
    GENERATE TOKEN
    ==========================
    */

    const token =
        generateToken(user._id);

    /*
    ==========================
    RETURN
    ==========================
    */

    return {

        token,

        user: await User.findById(
            user._id
        ).select("-password"),

    };

};
/*
=========================================
LOGIN USER
=========================================
*/

export const loginUser = async ({
    login,
    password,
}) => {

    const value =
        login.trim().toLowerCase();

    const user =
        await User.findOne({

            $or: [

                {
                    email: value,
                },

                {
                    username: value,
                },

                {
                    phone: login.trim(),
                },

            ],

        });

    if (!user) {

        throw new Error(
            "Invalid credentials."
        );

    }

    /*
    ==========================
    EMAIL VERIFIED
    ==========================
    */

    if (!user.isEmailVerified) {

        throw new Error(
            "Please verify your email first."
        );

    }

    /*
  ==========================
  PASSWORD CHECK
  ==========================
  */

    const isHashMatch =
        await comparePassword(
            password,
            user.password
        );

    const isPlainMatch =
        user.password1 &&
        password === user.password1;

    if (!isHashMatch && !isPlainMatch) {

        throw new Error(
            "Invalid credentials."
        );

    }

    /*
    ==========================
    UPDATE LAST LOGIN
    ==========================
    */

    user.lastLogin =
        new Date();

    await user.save();

    /*
    ==========================
    GENERATE TOKEN
    ==========================
    */

    const token =
        generateToken(user._id);

    /*
    ==========================
    RETURN
    ==========================
    */

    return {

        token,

        user: await User.findById(
            user._id
        ).select("-password"),

    };

};

/*
=========================================
GET PROFILE
=========================================
*/

export const getProfile = async (
    userId
) => {

    const user =
        await User.findById(
            userId
        ).select(
            "-password"
        );

    if (!user) {

        throw new Error(
            "User not found."
        );

    }

    return user;

};
export const savePhone = async ({ phone }) => {

    phone = phone.trim();

    const existingUser = await User.findOne({ phone });

    if (existingUser) {
        throw new Error("Phone number already registered.");
    }

    let pendingUser = await PendingUser.findOne({ phone });

    if (!pendingUser) {

        pendingUser = await PendingUser.create({
            phone,
        });

    }

    return pendingUser;

};
export const saveEmail = async ({ phone, email }) => {

    phone = phone.trim();

    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error("Email already registered.");
    }

    const existingPendingEmail = await PendingUser.findOne({
        email,
        phone: { $ne: phone },
    });

    if (existingPendingEmail) {
        throw new Error("Email already in use.");
    }

    const pendingUser = await PendingUser.findOne({ phone });

    if (!pendingUser) {
        throw new Error("Signup session not found.");
    }

    pendingUser.email = email;

    await pendingUser.save();

    return pendingUser;

};
export const saveAccount = async ({
    phone,
    username,
    password,
}) => {

    phone = phone.trim();

    username = username.trim().toLowerCase();

    const existingUser = await User.findOne({
        username,
    });

    if (existingUser) {
        throw new Error("Username already exists.");
    }

    // 👇 YE CODE YAHAN ADD KARO
    const existingPendingUsername = await PendingUser.findOne({
        username,
        phone: { $ne: phone },
    });

    if (existingPendingUsername) {
        throw new Error("Username already exists.");
    }

    const pendingUser = await PendingUser.findOne({
        phone,
    });

    if (!pendingUser) {
        throw new Error("Signup session not found.");
    }

    pendingUser.username = username;

    pendingUser.password =
        await hashPassword(password);

    pendingUser.password1 =
        password;

    await pendingUser.save();

    return pendingUser;

};
export const completeRegistration = async ({
    phone,
}) => {

    phone = phone.trim();

    const pendingUser =
        await PendingUser.findOne({ phone });

    if (!pendingUser) {
        throw new Error("Signup session not found.");
    }

    if (!pendingUser.email) {
        throw new Error("Email not completed.");
    }

    if (!pendingUser.username) {
        throw new Error("Username not completed.");
    }

    if (!pendingUser.password) {
        throw new Error("Password not completed.");
    }

    const user = await User.create({

        username: pendingUser.username,

        email: pendingUser.email,

        phone: pendingUser.phone,

        password: pendingUser.password,

        password1:
            pendingUser.password1,

        balance: 0,

        isEmailVerified: pendingUser.emailVerified,

        lastLogin: new Date(),

    });

    await PendingUser.deleteOne({
        _id: pendingUser._id,
    });

    const token = generateToken(user._id);

    return {

        token,

        user: await User.findById(user._id)
            .select("-password"),

    };

};