import jwt from "jsonwebtoken";

/**
 * Generate JWT
 */
export const generateToken = (userId) => {
    return jwt.sign(
        {
            id: userId,
        },
        process.env.JWT_SECRET
    );
};

/**
 * Verify JWT
 */
export const verifyToken = (token) => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
};