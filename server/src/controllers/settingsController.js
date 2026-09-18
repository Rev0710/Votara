const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");


// =========================================================
// VOTARA SETTINGS CONTROLLER
// ELECTORAL BOARD
// =========================================================


// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateEB = async (req) => {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        throw new Error(
            "Authentication token is required."
        );
    }

    const token =
        authHeader.split(" ")[1];

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    if (
        !decoded ||
        decoded.role !== "electoral_board"
    ) {
        throw new Error(
            "Electoral Board access is required."
        );
    }

    if (!decoded.userId) {
        throw new Error(
            "Invalid Electoral Board account."
        );
    }

    const {
        data: staff,
        error
    } = await supabase
        .from("staff_users")
        .select(`
            id,
            full_name,
            email,
            role,
            is_active
        `)
        .eq(
            "id",
            decoded.userId
        )
        .eq(
            "role",
            "electoral_board"
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!staff) {
        throw new Error(
            "Electoral Board account not found."
        );
    }

    if (!staff.is_active) {
        throw new Error(
            "Electoral Board account is inactive."
        );
    }

    return staff;
};


// =========================================================
// GET SETTINGS
// =========================================================

const getSettings = async (req, res) => {

    try {

        const staff =
            await authenticateEB(req);

        return res.status(200).json({

            success: true,

            account: {
                id: staff.id,
                fullName:
                    staff.full_name || "",
                email:
                    staff.email || "",
                role:
                    staff.role || "electoral_board",
                isActive:
                    Boolean(staff.is_active)
            },

            security: {
                authentication:
                    "JWT",
                sessionDuration:
                    "8 hours",
                accessLevel:
                    "Electoral Board"
            },

            system: {
                systemName:
                    "VOTARA",
                module:
                    "Electoral Board",
                database:
                    "Supabase",
                ballotSecrecy:
                    true
            },

            generatedAt:
                new Date().toISOString()

        });

    } catch (error) {

        console.error(
            "❌ Settings error:",
            error
        );

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid or expired authentication token."

            });
        }

        const authenticationErrors = [
            "Authentication token is required.",
            "Electoral Board access is required.",
            "Invalid Electoral Board account.",
            "Electoral Board account not found.",
            "Electoral Board account is inactive."
        ];

        if (
            authenticationErrors.includes(
                error.message
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    error.message

            });
        }

        return res.status(500).json({

            success: false,

            message:
                "Unable to load Electoral Board settings.",

            error:
                error.message

        });
    }
};


// =========================================================
// CHECK ACCOUNT STATUS
// =========================================================

const getAccountStatus = async (req, res) => {

    try {

        const staff =
            await authenticateEB(req);

        return res.status(200).json({

            success: true,

            account: {

                id:
                    staff.id,

                fullName:
                    staff.full_name || "",

                email:
                    staff.email || "",

                role:
                    staff.role || "electoral_board",

                status:
                    staff.is_active
                        ? "active"
                        : "inactive"

            },

            checkedAt:
                new Date().toISOString()

        });

    } catch (error) {

        console.error(
            "❌ Account status error:",
            error
        );

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid or expired authentication token."

            });
        }

        if (
            error.message ===
                "Authentication token is required." ||
            error.message ===
                "Electoral Board access is required." ||
            error.message ===
                "Invalid Electoral Board account." ||
            error.message ===
                "Electoral Board account not found." ||
            error.message ===
                "Electoral Board account is inactive."
        ) {

            return res.status(401).json({

                success: false,

                message:
                    error.message

            });
        }

        return res.status(500).json({

            success: false,

            message:
                "Unable to check account status.",

            error:
                error.message

        });
    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    getSettings,
    getAccountStatus
};