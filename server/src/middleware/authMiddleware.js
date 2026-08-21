const jwt = require("jsonwebtoken");

const protectStudent = (req, res, next) => {
    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        const token =
            authHeader.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid authentication token.",
            });
        }

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.student = decoded;

        next();

    } catch (error) {

        console.error(
            "❌ Authentication error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired authentication token.",
        });
    }
};

module.exports = {
    protectStudent,
};