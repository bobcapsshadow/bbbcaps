import { verifyToken } from "../utils/jwt.js";

export const protect = (
    req,
    res,
    next
) => {
    try {
        let token = null;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith(
                "Bearer "
            )
        ) {
            token =
                req.headers.authorization.split(
                    " "
                )[1];
        }

        if (!token)
            return res.status(401).json({
                success: false,
                message:
                    "Access denied. Token missing.",
            });

        const decoded =
            verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired token.",
        });
    }
};