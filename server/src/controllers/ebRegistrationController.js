const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");

// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateEB = (req) => {
    const authHeader =
        req.headers.authorization;

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

    if (!token) {
        throw new Error(
            "Authentication token is missing."
        );
    }

    const decoded =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

    if (
        !decoded ||
        decoded.role !==
            "electoral_board"
    ) {
        throw new Error(
            "Electoral Board access is required."
        );
    }

    return decoded;
};

// =========================================================
// GET STUDENT REGISTRATION APPLICATIONS
// =========================================================

const getStudentRegistrations =
    async (req, res) => {

        try {

            // -------------------------------------------------
            // VERIFY EB
            // -------------------------------------------------

            authenticateEB(req);

            // -------------------------------------------------
            // GET REGISTRATION APPLICATIONS
            // -------------------------------------------------

            const {
                data: applications,
                error,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .select(`
                    id,
                    student_id,
                    registration_type,
                    application_status,
                    email,
                    full_name,
                    year_level,
                    birthday,
                    contact_number,
                    province,
                    barangay,
                    city,
                    otp_verified_at,
                    submitted_at,
                    reviewed_at,
                    reviewed_by,
                    rejection_reason,
                    correction_message,
                    created_at,
                    updated_at
                `)
                .order(
                    "created_at",
                    {
                        ascending: false,
                    }
                );

            if (error) {

                throw new Error(
                    `Unable to load registration applications: ${error.message}`
                );

            }

            // -------------------------------------------------
            // RESPONSE
            // -------------------------------------------------

            return res.status(200).json({

                success: true,

                applications:
                    applications || [],

                count:
                    applications?.length || 0,

            });

        } catch (error) {

            console.error(
                "❌ EB registration loading error:",
                error
            );

            // -------------------------------------------------
            // AUTHENTICATION ERROR
            // -------------------------------------------------

            if (
                error.name ===
                    "JsonWebTokenError" ||
                error.name ===
                    "TokenExpiredError" ||
                error.message.includes(
                    "Electoral Board access"
                ) ||
                error.message.includes(
                    "Authentication token"
                )
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        error.message ||
                        "Electoral Board authentication failed.",

                });

            }

            // -------------------------------------------------
            // SERVER ERROR
            // -------------------------------------------------

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load student registration applications.",

                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error.message
                        : undefined,

            });

        }
    };


    // =========================================================
// GET SINGLE STUDENT REGISTRATION APPLICATION
// =========================================================

const getStudentRegistrationById = async (
    req,
    res
) => {

    try {

        // -------------------------------------------------
        // VERIFY ELECTORAL BOARD
        // -------------------------------------------------

        authenticateEB(req);

        // -------------------------------------------------
        // GET APPLICATION ID
        // -------------------------------------------------

        const {
            id,
        } = req.params;

        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Registration application ID is required.",

            });

        }

        // -------------------------------------------------
        // FIND APPLICATION
        // -------------------------------------------------

        const {
            data: application,
            error,
        } = await supabase
            .from(
                "registration_applications"
            )
            .select(`
                id,
                student_id,
                registration_type,
                application_status,
                email,
                full_name,
                year_level,
                birthday,
                contact_number,
                province,
                barangay,
                city,
                otp_verified_at,
                submitted_at,
                reviewed_at,
                reviewed_by,
                rejection_reason,
                correction_message,
                created_at,
                updated_at
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

        if (error) {

            console.error(
                "❌ Student registration lookup error:",
                error.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load the student registration application.",

            });

        }

        // -------------------------------------------------
        // APPLICATION NOT FOUND
        // -------------------------------------------------

        if (!application) {

            return res.status(404).json({

                success: false,

                message:
                    "Student registration application not found.",

            });

        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            application,

        });

    } catch (error) {

        console.error(
            "❌ EB single registration error:",
            error
        );

        // -------------------------------------------------
        // AUTHENTICATION ERRORS
        // -------------------------------------------------

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.message.includes(
                "Electoral Board access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    error.message ||
                    "Electoral Board authentication failed.",

            });

        }

        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

        return res.status(500).json({

            success: false,

            message:
                "Unable to load the student registration application.",

        });

    }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    getStudentRegistrations,
    getStudentRegistrationById,
};