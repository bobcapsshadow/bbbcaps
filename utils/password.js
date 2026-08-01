import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash User Password
 */
export const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare Password
 */
export const comparePassword = async (
    plainPassword,
    hashedPassword
) => {
    return await bcrypt.compare(
        plainPassword,
        hashedPassword
    );
};