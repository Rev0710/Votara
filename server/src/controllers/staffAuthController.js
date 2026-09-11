const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");


// =====================================================
// CONSTANTS
// =====================================================

const ADMIN_ROLE = "admin";
const EB_ROLE = "electoral_board";


// =====================================================
// PASSWORD VALIDATION
// =====================================================

const isValidPassword = (password) => {

    if (
        typeof password !== "string" ||
        password.length < 8
    ) {
        return false;
    }

    return (
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
};


// =====================================================
// CREATE STAFF JWT
// =====================================================

const createStaffToken = (user) => {

    return jwt.sign(

        {
            userId:
                user.id,

            email:
                user.email,

            role:
                user.role,

            fullName:
                user.full_name,
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "8h",
        }

    );
};


// =====================================================
// SHARED ADMIN / EB LOGIN
//
// One login endpoint for:
//
// ADMIN
// ELECTORAL BOARD
//
// The server identifies the role automatically.
// =====================================================

const loginStaff = async (
    req,
    res
) => {

    try {

        const {
            email,
            password,
            securityCode,
        } = req.body;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !email ||
            !password ||
            !securityCode
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email, password, and security code are required.",

            });
        }


        // =================================================
        // NORMALIZE EMAIL
        // =================================================

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const providedSecurityCode =
            String(securityCode)
                .trim();


        // =================================================
        // FIND STAFF ACCOUNT
        // =================================================

        const {
            data: user,
            error: userError,
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                full_name,
                email,
                password_hash,
                role,
                is_active,
                failed_login_attempts,
                locked_until,
                must_change_password,
                profile_photo_url
            `)
            .eq(
                "email",
                normalizedEmail
            )
            .maybeSingle();


        if (userError) {

            console.error(
                "❌ Staff login lookup error:",
                userError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to process login.",

            });
        }


        // =================================================
        // ACCOUNT NOT FOUND
        // =================================================

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password.",

            });
        }


        // =================================================
        // ROLE VALIDATION
        // =================================================

        if (
            user.role !== ADMIN_ROLE &&
            user.role !== EB_ROLE
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This account is not authorized for staff login.",

            });
        }


        // =================================================
        // ACTIVE ACCOUNT CHECK
        // =================================================

        if (
            user.is_active !== true
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This account is currently inactive. Please contact an active administrator.",

            });
        }


        // =================================================
        // ACCOUNT LOCK CHECK
        // =================================================

        if (
            user.locked_until &&
            new Date(
                user.locked_until
            ) > new Date()
        ) {

            return res.status(423).json({

                success: false,

                message:
                    "This account is temporarily locked. Please try again later.",

            });
        }


        // =================================================
        // PASSWORD CHECK
        // =================================================

        const passwordValid =
            await bcrypt.compare(
                String(password),
                user.password_hash
            );


        if (
            !passwordValid
        ) {

            const failedAttempts =
                (user.failed_login_attempts || 0) +
                1;

            const shouldLock =
                failedAttempts >= 5;

            const lockedUntil =
                shouldLock
                    ? new Date(
                        Date.now() +
                        15 * 60 * 1000
                    ).toISOString()
                    : null;


            await supabase
                .from("staff_users")
                .update({

                    failed_login_attempts:
                        failedAttempts,

                    locked_until:
                        lockedUntil,

                    updated_at:
                        new Date().toISOString(),

                })
                .eq(
                    "id",
                    user.id
                );


            return res.status(401).json({

                success: false,

                message:
                    shouldLock
                        ? "Too many failed login attempts. This account is temporarily locked for 15 minutes."
                        : "Invalid email or password.",

            });
        }


        // =================================================
        // SECURITY CODE
        //
        // ADMIN:
        // ADMIN_LOGIN_CODE
        //
        // EB:
        // EB_SECURITY_CODE
        // =================================================

        let expectedSecurityCode;


        if (
            user.role === ADMIN_ROLE
        ) {

            expectedSecurityCode =
                String(
                    process.env.ADMIN_LOGIN_CODE ||
                    ""
                ).trim();

        } else {

            expectedSecurityCode =
                String(
                    process.env.EB_SECURITY_CODE ||
                    process.env.EB_REGISTRATION_CODE ||
                    ""
                ).trim();

        }


        // =================================================
        // SECURITY CODE CONFIGURATION CHECK
        // =================================================

        if (
            !expectedSecurityCode
        ) {

            console.error(
                `❌ Security code is not configured for role: ${user.role}`
            );

            return res.status(500).json({

                success: false,

                message:
                    "Staff login security is not configured on the server.",

            });
        }


        // =================================================
        // SECURITY CODE VALIDATION
        // =================================================

        if (
            providedSecurityCode !==
            expectedSecurityCode
        ) {

            return res.status(403).json({

                success: false,

                message:
                    user.role === ADMIN_ROLE
                        ? "Invalid Admin Security Code."
                        : "Invalid Electoral Board Security Code.",

            });
        }


        // =================================================
        // RESET FAILED LOGIN ATTEMPTS
        // =================================================

        const {
            error:
                updateError,
        } = await supabase
            .from("staff_users")
            .update({

                failed_login_attempts:
                    0,

                locked_until:
                    null,

                last_login_at:
                    new Date().toISOString(),

                updated_at:
                    new Date().toISOString(),

            })
            .eq(
                "id",
                user.id
            );


        if (updateError) {

            console.error(
                "⚠️ Unable to update staff login information:",
                updateError.message
            );

            // Do not stop an otherwise valid login.
        }


        // =================================================
        // CREATE JWT
        // =================================================

        const token =
            createStaffToken(
                user
            );


        // =================================================
        // DETERMINE ROLE
        // =================================================

        const isAdmin =
            user.role === ADMIN_ROLE;

        const isEB =
            user.role === EB_ROLE;


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                isAdmin
                    ? "Admin login successful."
                    : "Electoral Board login successful.",

            token,

            user: {

                id:
                    user.id,

                fullName:
                    user.full_name,

                email:
                    user.email,

                role:
                    user.role,

                isActive:
                    user.is_active,

                mustChangePassword:
                    Boolean(
                        user.must_change_password
                    ),

                profilePhotoUrl:
                    user.profile_photo_url,

            },

        });

    } catch (error) {

        console.error(
            "❌ loginStaff error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to process staff login.",

        });
    }
};


// =====================================================
// VERIFY STAFF JWT
// =====================================================

const authenticateStaff = (req) => {

    const authorization =
        req.headers.authorization || "";


    if (
        !authorization.startsWith(
            "Bearer "
        )
    ) {

        const error =
            new Error(
                "Staff authentication is required."
            );

        error.statusCode = 401;

        throw error;
    }


    const token =
        authorization
            .substring(7)
            .trim();


    if (!token) {

        const error =
            new Error(
                "Staff authentication is required."
            );

        error.statusCode = 401;

        throw error;
    }


    try {

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        if (
            decoded.role !== ADMIN_ROLE &&
            decoded.role !== EB_ROLE
        ) {

            const error =
                new Error(
                    "Staff access is required."
                );

            error.statusCode = 403;

            throw error;
        }


        return decoded;

    } catch (error) {

        if (
            error.statusCode
        ) {

            throw error;
        }


        const authError =
            new Error(
                "Invalid or expired staff session."
            );

        authError.statusCode = 401;

        throw authError;
    }
};


// =====================================================
// CHANGE STAFF PASSWORD
//
// Used for Admin/EB accounts created by another Admin.
//
// must_change_password becomes FALSE after success.
// =====================================================

const changeStaffPassword = async (
    req,
    res
) => {

    try {

        const staff =
            authenticateStaff(
                req
            );


        const {
            newPassword,
            confirmPassword,
        } = req.body;


        // =================================================
        // REQUIRED
        // =================================================

        if (
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password and confirmation password are required.",

            });
        }


        // =================================================
        // MATCH
        // =================================================

        if (
            newPassword !==
            confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Passwords do not match.",

            });
        }


        // =================================================
        // VALIDATE PASSWORD
        // =================================================

        if (
            !isValidPassword(
                newPassword
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",

            });
        }


        // =================================================
        // HASH
        // =================================================

        const passwordHash =
            await bcrypt.hash(
                newPassword,
                12
            );


        // =================================================
        // UPDATE PASSWORD
        // =================================================

        const {
            data:
                updatedUser,
            error:
                updateError,
        } = await supabase
            .from("staff_users")
            .update({

                password_hash:
                    passwordHash,

                must_change_password:
                    false,

                password_changed_at:
                    new Date().toISOString(),

                failed_login_attempts:
                    0,

                locked_until:
                    null,

                updated_at:
                    new Date().toISOString(),

            })
            .eq(
                "id",
                staff.userId
            )
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                must_change_password,
                profile_photo_url
            `)
            .single();


        if (updateError) {

            console.error(
                "❌ Staff password update error:",
                updateError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to update the password.",

            });
        }


        // =================================================
        // CREATE NEW TOKEN
        //
        // Gives the user a fresh session after changing
        // the temporary password.
        // =================================================

        const newToken =
            createStaffToken(
                updatedUser
            );


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Password changed successfully.",

            token:
                newToken,

            user: {

                id:
                    updatedUser.id,

                fullName:
                    updatedUser.full_name,

                email:
                    updatedUser.email,

                role:
                    updatedUser.role,

                isActive:
                    updatedUser.is_active,

                mustChangePassword:
                    false,

                profilePhotoUrl:
                    updatedUser.profile_photo_url,

            },

        });

    } catch (error) {

        console.error(
            "❌ changeStaffPassword error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Unable to change staff password.",

        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    loginStaff,

    changeStaffPassword,

};