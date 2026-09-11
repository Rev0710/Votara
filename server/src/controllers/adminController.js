const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// =========================================================
// ADMIN AUTHENTICATION HELPER
// =========================================================

const authenticateAdmin = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Authentication token is required.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        throw new Error("Authentication token is missing.");
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    if (!decoded || decoded.role !== "admin") {
        throw new Error("Administrator access is required.");
    }

    return decoded;
};

// =========================================================
// GENERATE SECURE TEMPORARY PASSWORD
// =========================================================

const generateTemporaryPassword = () => {
    const upper =
        "ABCDEFGHJKLMNPQRSTUVWXYZ";

    const lower =
        "abcdefghijkmnopqrstuvwxyz";

    const numbers =
        "23456789";

    const special =
        "!@#$%&*";

    const all =
        upper +
        lower +
        numbers +
        special;

    const randomCharacter = (characters) => {
        return characters[
            crypto.randomInt(0, characters.length)
        ];
    };

    // Guarantee the required character types.
    let password =
        randomCharacter(upper) +
        randomCharacter(lower) +
        randomCharacter(numbers) +
        randomCharacter(special);

    // Add additional secure random characters.
    while (password.length < 12) {
        password += randomCharacter(all);
    }

    // Secure Fisher-Yates shuffle.
    const passwordArray = password.split("");

    for (
        let i = passwordArray.length - 1;
        i > 0;
        i--
    ) {
        const j = crypto.randomInt(0, i + 1);

        [
            passwordArray[i],
            passwordArray[j],
        ] = [
            passwordArray[j],
            passwordArray[i],
        ];
    }

    return passwordArray.join("");
};

// =========================================================
// ADMIN DASHBOARD STATISTICS
// =========================================================

const getAdminDashboard = async (req, res) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        const admin = authenticateAdmin(req);

        // -------------------------------------------------
        // STUDENT COUNT
        // -------------------------------------------------

        const {
            count: totalStudents,
            error: studentsError,
        } = await supabase
            .from("students")
            .select("*", {
                count: "exact",
                head: true,
            });

        if (studentsError) {
            throw new Error(
                `Unable to count students: ${studentsError.message}`
            );
        }

        // -------------------------------------------------
        // STAFF COUNT
        // -------------------------------------------------

        const {
            count: totalStaff,
            error: staffError,
        } = await supabase
            .from("staff_users")
            .select("*", {
                count: "exact",
                head: true,
            });

        if (staffError) {
            throw new Error(
                `Unable to count staff accounts: ${staffError.message}`
            );
        }

        // -------------------------------------------------
        // PENDING REGISTRATIONS
        // -------------------------------------------------

        const {
            count: pendingRegistrations,
            error: registrationError,
        } = await supabase
            .from("registration_applications")
            .select("*", {
                count: "exact",
                head: true,
            })
            .eq(
                "application_status",
                "pending"
            );

        if (registrationError) {
            throw new Error(
                `Unable to count pending registrations: ${registrationError.message}`
            );
        }

        // -------------------------------------------------
        // ACTIVE STAFF ACCOUNTS
        // -------------------------------------------------

        const {
            count: activeStaff,
            error: activeStaffError,
        } = await supabase
            .from("staff_users")
            .select("*", {
                count: "exact",
                head: true,
            })
            .eq(
                "is_active",
                true
            );

        if (activeStaffError) {
            throw new Error(
                `Unable to count active staff: ${activeStaffError.message}`
            );
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            admin: {
                id: admin.id || null,
                role: admin.role,
            },

            statistics: {
                totalStudents:
                    totalStudents || 0,

                totalStaff:
                    totalStaff || 0,

                pendingRegistrations:
                    pendingRegistrations || 0,

                activeStaff:
                    activeStaff || 0,
            },

            generatedAt:
                new Date().toISOString(),
        });

    } catch (error) {
        console.error(
            "❌ Admin dashboard error:",
            error
        );

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.message.includes(
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to load Admin Dashboard data.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// GET ADMIN ACCOUNTS
// =========================================================

const getAdminAccounts = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        authenticateAdmin(req);

        // -------------------------------------------------
        // GET ADMIN ACCOUNTS
        // -------------------------------------------------

        const {
            data: admins,
            error,
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                failed_login_attempts,
                locked_until,
                last_login_at,
                created_at,
                updated_at,
                must_change_password
            `)
            .eq(
                "role",
                "admin"
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

        if (error) {
            throw new Error(
                `Unable to load Admin accounts: ${error.message}`
            );
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            admins:
                admins || [],

            count:
                admins?.length || 0,
        });

    } catch (error) {
        console.error(
            "❌ Admin accounts error:",
            error
        );

        // -------------------------------------------------
        // AUTHENTICATION / AUTHORIZATION ERROR
        // -------------------------------------------------

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.message.includes(
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,

                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

        return res.status(500).json({
            success: false,

            message:
                "Unable to load Admin accounts.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// GET ELECTORAL BOARD ACCOUNTS
// =========================================================

const getElectoralBoardAccounts = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        authenticateAdmin(req);

        // -------------------------------------------------
        // GET ELECTORAL BOARD STAFF
        // -------------------------------------------------

        const {
            data: staff,
            error,
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                failed_login_attempts,
                locked_until,
                last_login_at,
                created_at,
                updated_at
            `)
            .eq(
                "role",
                "electoral_board"
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

        if (error) {
            throw new Error(
                `Unable to load Electoral Board accounts: ${error.message}`
            );
        }

        // -------------------------------------------------
        // RETURN DATA
        // -------------------------------------------------

        return res.status(200).json({
            success: true,
            staff: staff || [],
            count: staff?.length || 0,
        });

    } catch (error) {
        console.error(
            "❌ Electoral Board accounts error:",
            error
        );

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.message.includes(
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to load Electoral Board accounts.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// CREATE ELECTORAL BOARD ACCOUNT
// =========================================================

const createElectoralBoardAccount = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        const admin =
            authenticateAdmin(req);

        // -------------------------------------------------
        // GET REQUEST DATA
        // -------------------------------------------------

        const {
            fullName,
            email,
        } = req.body;

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !fullName ||
            !fullName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name is required.",
            });
        }

        if (
            !email ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email address is required.",
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // -------------------------------------------------
        // EMAIL VALIDATION
        // -------------------------------------------------

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(
                normalizedEmail
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address.",
            });
        }

        // -------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // -------------------------------------------------

        const {
            data: existingUser,
            error: existingUserError,
        } = await supabase
            .from("staff_users")
            .select(
                "id, email"
            )
            .eq(
                "email",
                normalizedEmail
            )
            .maybeSingle();

        if (existingUserError) {
            throw new Error(
                `Unable to check existing account: ${existingUserError.message}`
            );
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email address already exists.",
            });
        }

        // -------------------------------------------------
        // GENERATE TEMPORARY PASSWORD
        // -------------------------------------------------

        const temporaryPassword =
            generateTemporaryPassword();

        // -------------------------------------------------
        // HASH PASSWORD
        // -------------------------------------------------

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // -------------------------------------------------
        // CREATE ACCOUNT
        // -------------------------------------------------

        const {
            data: createdUser,
            error: createError,
        } = await supabase
            .from("staff_users")
            .insert([
                {
                    full_name:
                        fullName.trim(),

                    email:
                        normalizedEmail,

                    password_hash:
                        passwordHash,

                    role:
                        "electoral_board",

                    is_active:
                        true,

                    failed_login_attempts:
                        0,

                    locked_until:
                        null,

                    last_login_at:
                        null,

                    created_by:
                        admin.id,

                    must_change_password:
                        true,
                },
            ])
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                must_change_password,
                created_at
            `)
            .single();

        if (createError) {
            throw new Error(
                `Unable to create Electoral Board account: ${createError.message}`
            );
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(201).json({
            success: true,

            message:
                "Electoral Board account created successfully.",

            user:
                createdUser,

            temporaryPassword:
                temporaryPassword,
        });

    } catch (error) {
        console.error(
            "❌ Create EB account error:",
            error
        );

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.message.includes(
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to create Electoral Board account.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// CREATE ADDITIONAL ADMIN ACCOUNT
// =========================================================

const createAdminAccount = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        const admin =
            authenticateAdmin(req);

        // -------------------------------------------------
        // GET REQUEST DATA
        // -------------------------------------------------

        const {
            fullName,
            email,
        } = req.body;

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (
            !fullName ||
            !fullName.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name is required.",
            });
        }

        if (
            !email ||
            !email.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email address is required.",
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        // -------------------------------------------------
        // EMAIL VALIDATION
        // -------------------------------------------------

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (
            !emailRegex.test(
                normalizedEmail
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide a valid email address.",
            });
        }

        // -------------------------------------------------
        // CHECK DUPLICATE EMAIL
        // -------------------------------------------------

        const {
            data: existingUser,
            error: existingUserError,
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
            throw new Error(
                `Unable to check existing account: ${existingUserError.message}`
            );
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message:
                    "An account with this email address already exists.",
            });
        }

        // -------------------------------------------------
        // GENERATE SECURE TEMPORARY PASSWORD
        // -------------------------------------------------

        const temporaryPassword =
            generateTemporaryPassword();

        // -------------------------------------------------
        // HASH PASSWORD
        // -------------------------------------------------

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // -------------------------------------------------
        // CREATE ADMIN ACCOUNT
        // -------------------------------------------------

        const {
            data: createdUser,
            error: createError,
        } = await supabase
            .from("staff_users")
            .insert([
                {
                    full_name:
                        fullName.trim(),

                    email:
                        normalizedEmail,

                    password_hash:
                        passwordHash,

                    role:
                        "admin",

                    is_active:
                        true,

                    failed_login_attempts:
                        0,

                    locked_until:
                        null,

                    last_login_at:
                        null,

                    created_by:
                        admin.id,

                    must_change_password:
                        true,
                },
            ])
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                must_change_password,
                created_at
            `)
            .single();

        if (createError) {
            throw new Error(
                `Unable to create Admin account: ${createError.message}`
            );
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(201).json({
            success: true,

            message:
                "Admin account created successfully.",

            user:
                createdUser,

            temporaryPassword:
                temporaryPassword,
        });

    } catch (error) {
        console.error(
            "❌ Create Admin account error:",
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
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

        return res.status(500).json({
            success: false,
            message:
                "Unable to create Admin account.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// ACTIVATE ELECTORAL BOARD ACCOUNT
// =========================================================

const activateElectoralBoardAccount = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        authenticateAdmin(req);

        const {
            id,
        } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Electoral Board account ID is required.",
            });
        }

        // -------------------------------------------------
        // VERIFY ACCOUNT EXISTS AND IS EB
        // -------------------------------------------------

        const {
            data: existingUser,
            error: findError,
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active
            `)
            .eq("id", id)
            .eq("role", "electoral_board")
            .maybeSingle();

        if (findError) {
            throw new Error(
                `Unable to find Electoral Board account: ${findError.message}`
            );
        }

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message:
                    "Electoral Board account was not found.",
            });
        }

        // -------------------------------------------------
        // ACTIVATE ACCOUNT
        // -------------------------------------------------

        const {
            data: updatedUser,
            error: updateError,
        } = await supabase
            .from("staff_users")
            .update({
                is_active: true,
                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id)
            .eq("role", "electoral_board")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                updated_at
            `)
            .single();

        if (updateError) {
            throw new Error(
                `Unable to activate Electoral Board account: ${updateError.message}`
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Electoral Board account activated successfully.",
            user: updatedUser,
        });

    } catch (error) {
        console.error(
            "❌ Activate EB account error:",
            error
        );

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.message.includes(
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to activate Electoral Board account.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// DEACTIVATE ELECTORAL BOARD ACCOUNT
// =========================================================

const deactivateElectoralBoardAccount = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        authenticateAdmin(req);

        const {
            id,
        } = req.params;

        const {
            reason,
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Electoral Board account ID is required.",
            });
        }

        // -------------------------------------------------
        // REQUIRE DEACTIVATION REASON
        // -------------------------------------------------

        if (
            !reason ||
            !reason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A reason is required when deactivating an Electoral Board account.",
            });
        }

        if (
            reason.trim().length < 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "The deactivation reason must contain at least 5 characters.",
            });
        }

        // -------------------------------------------------
        // VERIFY ACCOUNT
        // -------------------------------------------------

        const {
            data: existingUser,
            error: findError,
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active
            `)
            .eq("id", id)
            .eq("role", "electoral_board")
            .maybeSingle();

        if (findError) {
            throw new Error(
                `Unable to find Electoral Board account: ${findError.message}`
            );
        }

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message:
                    "Electoral Board account was not found.",
            });
        }

        // -------------------------------------------------
        // DEACTIVATE ACCOUNT
        // -------------------------------------------------

        const {
            data: updatedUser,
            error: updateError,
        } = await supabase
            .from("staff_users")
            .update({
                is_active: false,
                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id)
            .eq("role", "electoral_board")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                updated_at
            `)
            .single();

        if (updateError) {
            throw new Error(
                `Unable to deactivate Electoral Board account: ${updateError.message}`
            );
        }

        return res.status(200).json({
            success: true,

            message:
                "Electoral Board account deactivated successfully.",

            user:
                updatedUser,

            deactivationReason:
                reason.trim(),

            note:
                "The deactivation reason has been validated but is not yet permanently stored because the current staff_users schema does not expose a confirmed reason field.",
        });

    } catch (error) {
        console.error(
            "❌ Deactivate EB account error:",
            error
        );

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.message.includes(
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to deactivate Electoral Board account.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// RESET ELECTORAL BOARD PASSWORD
// =========================================================

const resetElectoralBoardPassword = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        authenticateAdmin(req);

        const {
            id,
        } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Electoral Board account ID is required.",
            });
        }

        // -------------------------------------------------
        // VERIFY ACCOUNT
        // -------------------------------------------------

        const {
            data: existingUser,
            error: findError,
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active
            `)
            .eq("id", id)
            .eq("role", "electoral_board")
            .maybeSingle();

        if (findError) {
            throw new Error(
                `Unable to find Electoral Board account: ${findError.message}`
            );
        }

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message:
                    "Electoral Board account was not found.",
            });
        }

        // -------------------------------------------------
        // GENERATE NEW TEMPORARY PASSWORD
        // -------------------------------------------------

        const temporaryPassword =
            generateTemporaryPassword();

        // -------------------------------------------------
        // HASH NEW PASSWORD
        // -------------------------------------------------

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // -------------------------------------------------
        // UPDATE ACCOUNT
        // -------------------------------------------------

        const {
            data: updatedUser,
            error: updateError,
        } = await supabase
            .from("staff_users")
            .update({
                password_hash:
                    passwordHash,

                must_change_password:
                    true,

                failed_login_attempts:
                    0,

                locked_until:
                    null,

                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id)
            .eq("role", "electoral_board")
            .select(`
                id,
                full_name,
                email,
                role,
                is_active,
                must_change_password,
                updated_at
            `)
            .single();

        if (updateError) {
            throw new Error(
                `Unable to reset Electoral Board password: ${updateError.message}`
            );
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Electoral Board password reset successfully.",

            user:
                updatedUser,

            temporaryPassword:
                temporaryPassword,

            securityNote:
                "The temporary password is returned only in this response and is not stored in plaintext.",
        });

    } catch (error) {
        console.error(
            "❌ Reset EB password error:",
            error
        );

        if (
            error.name ===
                "JsonWebTokenError" ||
            error.name ===
                "TokenExpiredError" ||
            error.message.includes(
                "Administrator access"
            ) ||
            error.message.includes(
                "Authentication token"
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Administrator authentication failed.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to reset Electoral Board password.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// EXPORT CONTROLLERS
// =========================================================

module.exports = {
    getAdminDashboard,

    getAdminAccounts,

    getElectoralBoardAccounts,

    createElectoralBoardAccount,

    createAdminAccount,

    activateElectoralBoardAccount,

    deactivateElectoralBoardAccount,

    resetElectoralBoardPassword,
};