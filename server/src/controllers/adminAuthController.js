const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");

// =====================================================
// CONSTANTS
// =====================================================

const ADMIN_ROLE = "admin";


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

    const hasUppercase =
        /[A-Z]/.test(password);

    const hasLowercase =
        /[a-z]/.test(password);

    const hasNumber =
        /[0-9]/.test(password);

    const hasSpecial =
        /[^A-Za-z0-9]/.test(password);

    return (
        hasUppercase &&
        hasLowercase &&
        hasNumber &&
        hasSpecial
    );
};


// =====================================================
// EMAIL VALIDATION
// =====================================================

const isValidEmail = (email) => {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
};


// =====================================================
// INITIAL ADMIN REGISTRATION
//
// IMPORTANT:
// This endpoint is ONLY for creating the first Admin.
//
// Additional Admin accounts will later be created
// from the Admin Dashboard.
// =====================================================

const registerInitialAdmin = async (
    req,
    res
) => {

    try {

        const {
            fullName,
            email,
            password,
            confirmPassword,
            adminRegistrationCode,
            photoData,
        } = req.body;


        // =================================================
        // REQUIRED FIELDS
        // =================================================

        if (
            !fullName ||
            !email ||
            !password ||
            !confirmPassword ||
            !adminRegistrationCode ||
            !photoData
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "All fields are required, including the profile photo.",

            });
        }


        // =================================================
        // CLEAN INPUT
        // =================================================

        const normalizedFullName =
            String(fullName).trim();

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const providedCode =
            String(
                adminRegistrationCode
            ).trim();

        const providedPassword =
            String(password);

        const providedConfirmPassword =
            String(confirmPassword);


        // =================================================
        // NAME VALIDATION
        // =================================================

        if (
            normalizedFullName.length < 2
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid full name.",

            });
        }


        // =================================================
        // EMAIL VALIDATION
        // =================================================

        if (
            !isValidEmail(
                normalizedEmail
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide a valid email address.",

            });
        }


        // =================================================
        // PASSWORD MATCH
        // =================================================

        if (
            providedPassword !==
            providedConfirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Passwords do not match.",

            });
        }


        // =================================================
        // PASSWORD REQUIREMENTS
        // =================================================

        if (
            !isValidPassword(
                providedPassword
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",

            });
        }


        // =================================================
        // CHECK ADMIN REGISTRATION CODE
        //
        // Code is NEVER hardcoded in frontend.
        // =================================================

        const configuredCode =
            String(
                process.env.ADMIN_REGISTRATION_CODE ||
                ""
            ).trim();


        if (
            !configuredCode
        ) {

            console.error(
                "❌ ADMIN_REGISTRATION_CODE is missing from server/.env"
            );

            return res.status(500).json({

                success: false,

                message:
                    "Admin registration is not configured on the server.",

            });
        }


        if (
            providedCode !==
            configuredCode
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Invalid Admin Registration Code.",

            });
        }


        // =================================================
        // CHECK WHETHER AN ADMIN ALREADY EXISTS
        //
        // This is the most important protection for the
        // public Admin Registration page.
        // =================================================

        const {
            count:
                adminCount,
            error:
                adminCountError,
        } = await supabase
            .from("staff_users")
            .select(
                "id",
                {
                    count: "exact",
                    head: true,
                }
            )
            .eq(
                "role",
                ADMIN_ROLE
            );


        if (adminCountError) {

            console.error(
                "❌ Admin count check error:",
                adminCountError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to check administrator availability.",

            });
        }


        // =================================================
        // ONLY FIRST ADMIN
        // =================================================

        if (
            (adminCount || 0) > 0
        ) {

            return res.status(403).json({

                success: false,

                registrationClosed: true,

                message:
                    "Initial Admin Registration is already closed. An existing Admin must create additional Admin accounts.",

            });
        }


        // =================================================
        // CHECK EMAIL
        // =================================================

        const {
            data:
                existingUser,
            error:
                existingUserError,
        } = await supabase
            .from("staff_users")
            .select(
                "id, email, role"
            )
            .eq(
                "email",
                normalizedEmail
            )
            .maybeSingle();


        if (existingUserError) {

            console.error(
                "❌ Admin email lookup error:",
                existingUserError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to check the email address.",

            });
        }


        if (
            existingUser
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This email is already used. Please use another email.",

            });
        }


        // =================================================
        // PASSWORD HASH
        // =================================================

        const passwordHash =
            await bcrypt.hash(
                providedPassword,
                12
            );


        // =================================================
        // CREATE ADMIN
        // =================================================

        const {
            data:
                admin,
            error:
                insertError,
        } = await supabase
            .from("staff_users")
            .insert({

                full_name:
                    normalizedFullName,

                email:
                    normalizedEmail,

                password_hash:
                    passwordHash,

                role:
                    ADMIN_ROLE,

                is_active:
                    true,

                failed_login_attempts:
                    0,

                locked_until:
                    null,

                must_change_password:
                    false,

                profile_photo_url:
                    null,

                created_by:
                    null,

            })
            .select(
                `
                id,
                full_name,
                email,
                role,
                is_active,
                must_change_password,
                profile_photo_url,
                created_at
                `
            )
            .single();


        if (insertError) {

            console.error(
                "❌ Admin creation error:",
                insertError.message
            );


            // PostgreSQL duplicate email
            if (
                insertError.code ===
                "23505"
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        "This email is already used. Please use another email.",

                });
            }


            return res.status(500).json({

                success: false,

                message:
                    "Unable to create the Admin account.",

            });
        }


        // =================================================
        // SUCCESS
        //
        // Photo upload will be connected after the
        // storage bucket is prepared.
        // =================================================

        return res.status(201).json({

            success: true,

            message:
                "Admin account created successfully.",

            user: admin,

            photoReceived:
                Boolean(photoData),

        });

    } catch (error) {

        console.error(
            "❌ registerInitialAdmin error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to create the Admin account.",

        });
    }
};


// =====================================================
// ADMIN LOGIN
//
// This will be used by the shared Admin / EB login
// system later.
//
// For now, we are preparing the Admin authentication
// foundation only.
// =====================================================

const loginAdmin = async (
    req,
    res
) => {

    try {

        const {
            email,
            password,
            securityCode,
        } = req.body;


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


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

        const providedCode =
            String(
                securityCode
            ).trim();


        // =================================================
        // FIND STAFF ACCOUNT
        // =================================================

        const {
            data:
                user,
            error:
                userError,
        } = await supabase
            .from("staff_users")
            .select("*")
            .eq(
                "email",
                normalizedEmail
            )
            .maybeSingle();


        if (userError) {

            console.error(
                "❌ Admin login lookup error:",
                userError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to process login.",

            });
        }


        if (
            !user
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password.",

            });
        }


        // =================================================
        // ADMIN ROLE ONLY
        // =================================================

        if (
            user.role !==
            ADMIN_ROLE
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This account is not an Administrator account.",

            });
        }


        // =================================================
        // ACTIVE CHECK
        // =================================================

        if (
            user.is_active !== true
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This Admin account is currently inactive. Please contact an active administrator.",

            });
        }


        // =================================================
        // LOCK CHECK
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
                        15 *
                        60 *
                        1000
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
                        ? "Too many failed login attempts. Your account is temporarily locked."
                        : "Invalid email or password.",

            });
        }


        // =================================================
        // ADMIN SECURITY CODE
        // =================================================

        const configuredCode =
            String(
                process.env.ADMIN_LOGIN_CODE ||
                ""
            ).trim();


        if (
            !configuredCode
        ) {

            console.error(
                "❌ ADMIN_LOGIN_CODE is missing from server/.env"
            );

            return res.status(500).json({

                success: false,

                message:
                    "Admin login is not configured on the server.",

            });
        }


        if (
            providedCode !==
            configuredCode
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Invalid Admin Security Code.",

            });
        }


        // =================================================
        // RESET FAILED LOGIN COUNTER
        // =================================================

        await supabase
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


        // =================================================
        // JWT
        // =================================================

        const token =
            jwt.sign(

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
                    expiresIn:
                        "8h",
                }

            );


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Admin login successful.",

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
            "❌ loginAdmin error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to process Admin login.",

        });
    }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    registerInitialAdmin,

    loginAdmin,

};