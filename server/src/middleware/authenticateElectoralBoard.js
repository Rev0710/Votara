const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateElectoralBoard = async (
    req,
    res,
    next
) => {
    try {
        const authorization =
            req.headers.authorization || "";

        // =================================================
        // CHECK AUTHORIZATION HEADER
        // =================================================

        if (
            !authorization.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Electoral Board authentication is required."
            });
        }

        const token =
            authorization
                .substring(7)
                .trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message:
                    "Electoral Board authentication token is required."
            });
        }

        // =================================================
        // VERIFY JWT
        // =================================================

        let decoded;

        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid or expired Electoral Board session."
            });
        }

        // =================================================
        // VERIFY ROLE
        // =================================================

        if (
            decoded?.role !==
            "electoral_board"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Electoral Board access is required."
            });
        }

        // =================================================
        // GET USER ID
        // =================================================
        //
        // Support both:
        //
        // decoded.userId
        // decoded.id
        //
        // This keeps the middleware compatible with
        // existing Electoral Board authentication tokens.
        // =================================================

        const userId =
            decoded.userId ||
            decoded.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid Electoral Board account."
            });
        }

        // =================================================
        // VERIFY STAFF ACCOUNT
        // =================================================

        const {
            data: staff,
            error
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                email,
                full_name,
                role,
                is_active
            `)
            .eq(
                "id",
                userId
            )
            .eq(
                "role",
                "electoral_board"
            )
            .eq(
                "is_active",
                true
            )
            .maybeSingle();

        // =================================================
        // DATABASE ERROR
        // =================================================

        if (error) {
            console.error(
                "❌ EB authentication lookup error:",
                error.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to verify Electoral Board account."
            });
        }

        // =================================================
        // STAFF ACCOUNT NOT FOUND
        // =================================================

        if (!staff) {
            return res.status(403).json({
                success: false,
                message:
                    "Electoral Board account is inactive or unavailable."
            });
        }

        // =================================================
        // ATTACH AUTHENTICATED USER
        // =================================================

        req.user = {
            userId: staff.id,
            email: staff.email,
            fullName: staff.full_name,
            role: staff.role
        };

        // =================================================
        // CONTINUE REQUEST
        // =================================================

        next();

    } catch (error) {
        console.error(
            "❌ Electoral Board authentication error:",
            error
        );

        return res.status(401).json({
            success: false,
            message:
                "Electoral Board authentication failed."
        });
    }
};

module.exports =
    authenticateElectoralBoard;