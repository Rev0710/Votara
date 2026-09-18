const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// =========================================================
// PASSWORD VALIDATION
// =========================================================

const isValidPassword = (password) => {
    return (
        typeof password === "string" &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
};

// =========================================================
// EB REGISTRATION
// =========================================================

const registerEB = async (req, res) => {
    try {
        const {
            fullName,
            email,
            password,
            confirmPassword,
            registrationCode
        } = req.body;

        // -------------------------------------------------
        // Required fields
        // -------------------------------------------------

        if (
            !fullName ||
            !email ||
            !password ||
            !confirmPassword ||
            !registrationCode
        ) {
            return res.status(400).json({
                success: false,
                message: "Please complete all required fields."
            });
        }

        const cleanFullName = String(fullName).trim();
        const cleanEmail = String(email).trim().toLowerCase();
        const cleanRegistrationCode =
            String(registrationCode).trim();

        // -------------------------------------------------
        // Validate email
        // -------------------------------------------------

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // -------------------------------------------------
        // Check EB registration code
        // -------------------------------------------------

        if (!process.env.EB_REGISTRATION_CODE) {
            console.error(
                "❌ EB_REGISTRATION_CODE is missing from server/.env"
            );

            return res.status(500).json({
                success: false,
                message:
                    "EB registration is not configured on the server."
            });
        }

        const configuredCode =
            String(process.env.EB_REGISTRATION_CODE).trim();

        if (cleanRegistrationCode !== configuredCode) {
            return res.status(403).json({
                success: false,
                message: "Invalid EB registration code."
            });
        }

        // -------------------------------------------------
        // Validate password
        // -------------------------------------------------

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters and contain an uppercase letter, lowercase letter, number, and special character."
            });
        }

        // -------------------------------------------------
        // Confirm password
        // -------------------------------------------------

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match."
            });
        }

        // -------------------------------------------------
        // Check existing email
        // -------------------------------------------------

        const {
            data: existingUser,
            error: existingUserError
        } = await supabase
            .from("staff_users")
            .select("id, email, role")
            .eq("email", cleanEmail)
            .maybeSingle();

        if (existingUserError) {
            console.error(
                "❌ EB account lookup error:",
                existingUserError.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to check whether this email is already registered."
            });
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "This email is already used. Please use another email."
            });
        }

        // -------------------------------------------------
        // Hash password
        // -------------------------------------------------

        const passwordHash =
            await bcrypt.hash(password, 12);

        // -------------------------------------------------
        // Create EB account
        // -------------------------------------------------

        const {
            data: newUser,
            error: insertError
        } = await supabase
            .from("staff_users")
            .insert([
                {
                    full_name: cleanFullName,
                    email: cleanEmail,
                    password_hash: passwordHash,

                    // IMPORTANT:
                    // EB accounts always use this exact role.
                    role: "electoral_board",

                    is_active: true,
                    failed_login_attempts: 0
                }
            ])
            .select(
                "id, full_name, email, role, is_active, created_at"
            )
            .single();

        // -------------------------------------------------
        // Handle database errors
        // -------------------------------------------------

        if (insertError) {
            console.error(
                "❌ EB account creation error:",
                insertError.message
            );

            if (insertError.code === "23505") {
                return res.status(409).json({
                    success: false,
                    message:
                        "This email is already used. Please use another email."
                });
            }

            return res.status(500).json({
                success: false,
                message:
                    "Unable to create EB account."
            });
        }

        console.log(
            `✅ EB account created: ${newUser.email}`
        );

        return res.status(201).json({
            success: true,
            message:
                "Electoral Board account created successfully.",
            user: newUser
        });

    } catch (error) {
        console.error(
            "❌ EB registration error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during EB registration."
        });
    }
};

// =========================================================
// EB LOGIN
// =========================================================

const loginEB = async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        // -------------------------------------------------
        // Required fields
        // -------------------------------------------------

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and password are required."
            });
        }

        const cleanEmail =
            String(email).trim().toLowerCase();

        // -------------------------------------------------
        // Find EB account
        // -------------------------------------------------

        const {
            data: user,
            error: userError
        } = await supabase
            .from("staff_users")
            .select("*")
            .eq("email", cleanEmail)
            .maybeSingle();

        if (userError) {
            console.error(
                "❌ EB login lookup error:",
                userError.message
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to process login."
            });
        }

        // -------------------------------------------------
        // Account does not exist
        // -------------------------------------------------

        if (!user) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        // -------------------------------------------------
        // Verify EB role
        // -------------------------------------------------

        const userRole =
            String(user.role || "")
                .trim()
                .toLowerCase();

        if (userRole !== "electoral_board") {
            return res.status(403).json({
                success: false,
                message:
                    "This account is not an Electoral Board account."
            });
        }

        // -------------------------------------------------
        // Verify active status
        // -------------------------------------------------

        if (user.is_active !== true) {
            return res.status(403).json({
                success: false,
                message:
                    "Your EB account is currently inactive."
            });
        }

        // -------------------------------------------------
        // Check temporary lock
        // -------------------------------------------------

        if (
            user.locked_until &&
            new Date(user.locked_until) > new Date()
        ) {
            return res.status(423).json({
                success: false,
                message:
                    "Your account is temporarily locked. Please try again later."
            });
        }

        // -------------------------------------------------
        // Verify password
        // -------------------------------------------------

        const passwordMatches =
            await bcrypt.compare(
                password,
                user.password_hash
            );

        if (!passwordMatches) {

            const failedAttempts =
                (user.failed_login_attempts || 0) + 1;

            // ---------------------------------------------
            // Lock after 5 failed attempts
            // ---------------------------------------------

            if (failedAttempts >= 5) {

                const lockedUntil =
                    new Date(
                        Date.now() +
                        15 * 60 * 1000
                    );

                await supabase
                    .from("staff_users")
                    .update({
                        failed_login_attempts:
                            failedAttempts,

                        locked_until:
                            lockedUntil.toISOString(),

                        updated_at:
                            new Date().toISOString()
                    })
                    .eq("id", user.id);

                return res.status(423).json({
                    success: false,
                    message:
                        "Too many failed login attempts. Your account is locked for 15 minutes."
                });
            }

            await supabase
                .from("staff_users")
                .update({
                    failed_login_attempts:
                        failedAttempts,

                    updated_at:
                        new Date().toISOString()
                })
                .eq("id", user.id);

            return res.status(401).json({
                success: false,
                message:
                    "Invalid email or password."
            });
        }

        // -------------------------------------------------
        // Successful login
        // -------------------------------------------------

        await supabase
            .from("staff_users")
            .update({
                failed_login_attempts: 0,
                locked_until: null,
                last_login_at:
                    new Date().toISOString(),
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", user.id);

        // =================================================
        // CREATE EB JWT
        // =================================================
        //
        // IMPORTANT:
        // Always explicitly issue the Electoral Board role.
        //
        // ebRegistrationController expects:
        //
        // decoded.role === "electoral_board"
        //
        // and:
        //
        // decoded.userId
        // =================================================

        const tokenPayload = {
            userId: user.id,
            email: user.email,

            // IMPORTANT:
            // Do NOT rely on an unnormalized DB value here.
            role: "electoral_board",

            fullName: user.full_name
        };

        const token =
            jwt.sign(
                tokenPayload,
                process.env.JWT_SECRET,
                {
                    expiresIn: "8h"
                }
            );

        // -------------------------------------------------
        // Server-side verification
        // -------------------------------------------------
        // This confirms the token we just generated has
        // the exact claims expected by EB APIs.
        // -------------------------------------------------

        const verifiedToken =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        console.log(
            "================================="
        );

        console.log(
            `✅ EB login successful: ${user.email}`
        );

        console.log(
            "🔐 EB JWT verified:"
        );

        console.log({
            userId: verifiedToken.userId,
            role: verifiedToken.role,
            email: verifiedToken.email
        });

        console.log(
            "================================="
        );

        // -------------------------------------------------
        // Return login response
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "EB login successful.",

            token,

            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,

                // Keep frontend user role consistent too.
                role: "electoral_board"
            }
        });

    } catch (error) {
        console.error(
            "❌ EB login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error during EB login."
        });
    }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    registerEB,
    loginEB
};