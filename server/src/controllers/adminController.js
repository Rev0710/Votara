const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// =========================================================
// CONSTANTS
// =========================================================

const ADMIN_ROLE = "admin";
const EB_ROLE = "electoral_board";

// =========================================================
// ADMIN AUTHENTICATION HELPER
//
// Verifies:
// 1. Bearer token exists
// 2. JWT is valid
// 3. JWT role is admin
// 4. JWT contains userId
// 5. Admin account still exists
// 6. Admin account is active
// =========================================================

const authenticateAdmin = async (req) => {
    const authHeader =
        req.headers.authorization || "";

    // -----------------------------------------------------
    // CHECK AUTHORIZATION HEADER
    // -----------------------------------------------------

    if (
        !authHeader.startsWith("Bearer ")
    ) {
        const error = new Error(
            "Authentication token is required."
        );

        error.statusCode = 401;

        throw error;
    }

    const token =
        authHeader
            .substring(7)
            .trim();

    if (!token) {
        const error = new Error(
            "Authentication token is missing."
        );

        error.statusCode = 401;

        throw error;
    }

    // -----------------------------------------------------
    // VERIFY JWT
    // -----------------------------------------------------

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        const authError = new Error(
            "Invalid or expired administrator session."
        );

        authError.statusCode = 401;

        throw authError;
    }

    // -----------------------------------------------------
    // VERIFY ROLE
    // -----------------------------------------------------

    if (
        !decoded ||
        decoded.role !== ADMIN_ROLE
    ) {
        const error = new Error(
            "Administrator access is required."
        );

        error.statusCode = 403;

        throw error;
    }

    // -----------------------------------------------------
    // VERIFY USER ID
    //
    // staffAuthController creates:
    //
    // userId: user.id
    //
    // Therefore we must use decoded.userId.
    // -----------------------------------------------------

    if (!decoded.userId) {
        const error = new Error(
            "Invalid administrator session."
        );

        error.statusCode = 401;

        throw error;
    }

    // -----------------------------------------------------
    // VERIFY ADMIN ACCOUNT IN DATABASE
    // -----------------------------------------------------

    const {
        data: adminUser,
        error: adminError,
    } = await supabase
        .from("staff_users")
        .select(`
            id,
            full_name,
            email,
            role,
            is_active,
            must_change_password,
            profile_photo_url
        `)
        .eq(
            "id",
            decoded.userId
        )
        .eq(
            "role",
            ADMIN_ROLE
        )
        .maybeSingle();

    if (adminError) {
        console.error(
            "❌ Admin authentication lookup error:",
            adminError.message
        );

        const error = new Error(
            "Unable to verify administrator account."
        );

        error.statusCode = 500;

        throw error;
    }

    // -----------------------------------------------------
    // ACCOUNT DOES NOT EXIST
    // -----------------------------------------------------

    if (!adminUser) {
        const error = new Error(
            "Administrator account was not found."
        );

        error.statusCode = 401;

        throw error;
    }

    // -----------------------------------------------------
    // ACCOUNT INACTIVE
    // -----------------------------------------------------

    if (
        adminUser.is_active !== true
    ) {
        const error = new Error(
            "Administrator account is inactive."
        );

        error.statusCode = 403;

        throw error;
    }

    // -----------------------------------------------------
    // RETURN COMPLETE ADMIN SESSION
    // -----------------------------------------------------

    return {
        id:
            adminUser.id,

        userId:
            adminUser.id,

        fullName:
            adminUser.full_name,

        email:
            adminUser.email,

        role:
            adminUser.role,

        isActive:
            adminUser.is_active,

        mustChangePassword:
            Boolean(
                adminUser.must_change_password
            ),

        profilePhotoUrl:
            adminUser.profile_photo_url || "",

        tokenIssuedAt:
            decoded.iat || null,

        tokenExpiresAt:
            decoded.exp || null,
    };
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

    const randomCharacter = (
        characters
    ) => {
        return characters[
            crypto.randomInt(
                0,
                characters.length
            )
        ];
    };

    // -----------------------------------------------------
    // GUARANTEE PASSWORD REQUIREMENTS
    // -----------------------------------------------------

    let password =
        randomCharacter(upper) +
        randomCharacter(lower) +
        randomCharacter(numbers) +
        randomCharacter(special);

    // -----------------------------------------------------
    // ADD MORE SECURE CHARACTERS
    // -----------------------------------------------------

    while (
        password.length < 12
    ) {
        password += randomCharacter(all);
    }

    // -----------------------------------------------------
    // SECURE FISHER-YATES SHUFFLE
    // -----------------------------------------------------

    const passwordArray =
        password.split("");

    for (
        let i =
            passwordArray.length - 1;
        i > 0;
        i--
    ) {
        const j =
            crypto.randomInt(
                0,
                i + 1
            );

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
// COMMON ADMIN ERROR HANDLER
// =========================================================

const handleAdminError = (
    error,
    res,
    defaultMessage
) => {
    console.error(
        "❌ Admin Controller Error:",
        error
    );

    // -----------------------------------------------------
    // AUTHENTICATION / AUTHORIZATION
    // -----------------------------------------------------

    if (
        error.statusCode
    ) {
        return res.status(
            error.statusCode
        ).json({
            success: false,
            message:
                error.message ||
                defaultMessage,
        });
    }

    // -----------------------------------------------------
    // JWT ERRORS
    // -----------------------------------------------------

    if (
        error.name ===
            "JsonWebTokenError" ||
        error.name ===
            "TokenExpiredError"
    ) {
        return res.status(401).json({
            success: false,
            message:
                "Invalid or expired administrator session.",
        });
    }

    // -----------------------------------------------------
    // SERVER ERROR
    // -----------------------------------------------------

    return res.status(500).json({
        success: false,

        message:
            defaultMessage,

        error:
            process.env.NODE_ENV ===
            "development"
                ? error.message
                : undefined,
    });
};

// =========================================================
// ADMIN DASHBOARD STATISTICS
// =========================================================

const getAdminDashboard = async (
    req,
    res
) => {
    try {
        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        const admin =
            await authenticateAdmin(req);

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
        // ACTIVE STAFF
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
        // ELECTION COUNT
        // -------------------------------------------------

        const {
            count: totalElections,
            error: electionsError,
        } = await supabase
            .from("elections")
            .select("*", {
                count: "exact",
                head: true,
            });

        if (electionsError) {
            throw new Error(
                `Unable to count elections: ${electionsError.message}`
            );
        }

        // -------------------------------------------------
        // ACTIVE ELECTION
        // -------------------------------------------------

        const {
            data: activeElection,
            error: activeElectionError,
        } = await supabase
            .from("elections")
            .select(`
                id,
                title,
                election_date,
                start_time,
                end_time,
                status,
                is_published
            `)
            .in(
                "status",
                [
                    "active",
                    "scheduled",
                ]
            )
            .order(
                "created_at",
                {
                    ascending: false,
                }
            )
            .limit(1)
            .maybeSingle();

        if (activeElectionError) {
            throw new Error(
                `Unable to load active election: ${activeElectionError.message}`
            );
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            admin: {
                id:
                    admin.id,

                userId:
                    admin.userId,

                fullName:
                    admin.fullName,

                email:
                    admin.email,

                role:
                    admin.role,

                isActive:
                    admin.isActive,

                mustChangePassword:
                    admin.mustChangePassword,

                profilePhotoUrl:
                    admin.profilePhotoUrl,
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

                totalElections:
                    totalElections || 0,
            },

            activeElection:
                activeElection || null,

            generatedAt:
                new Date().toISOString(),
        });

    } catch (error) {
        return handleAdminError(
            error,
            res,
            "Unable to load Admin Dashboard data."
        );
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

        await authenticateAdmin(req);

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
                must_change_password,
                profile_photo_url
            `)
            .eq(
                "role",
                ADMIN_ROLE
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

        return res.status(200).json({
            success: true,

            admins:
                admins || [],

            count:
                admins?.length || 0,
        });

    } catch (error) {
        return handleAdminError(
            error,
            res,
            "Unable to load Admin accounts."
        );
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

        await authenticateAdmin(req);

        // -------------------------------------------------
        // GET EB ACCOUNTS
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
                updated_at,
                must_change_password,
                profile_photo_url
            `)
            .eq(
                "role",
                EB_ROLE
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

        return res.status(200).json({
            success: true,

            staff:
                staff || [],

            count:
                staff?.length || 0,
        });

    } catch (error) {
        return handleAdminError(
            error,
            res,
            "Unable to load Electoral Board accounts."
        );
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
            await authenticateAdmin(req);

        // -------------------------------------------------
        // REQUEST DATA
        // -------------------------------------------------

        const {
            fullName,
            email,
        } = req.body;

        // -------------------------------------------------
        // VALIDATE NAME
        // -------------------------------------------------

        if (
            !fullName ||
            !String(fullName).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name is required.",
            });
        }

        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        if (
            !email ||
            !String(email).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email address is required.",
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

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
        // CHECK DUPLICATE
        // -------------------------------------------------

        const {
            data: existingUser,
            error: existingUserError,
        } = await supabase
            .from("staff_users")
            .select(`
                id,
                email,
                role
            `)
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

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // -------------------------------------------------
        // CREATE EB ACCOUNT
        // -------------------------------------------------

        const {
            data: createdUser,
            error: createError,
        } = await supabase
            .from("staff_users")
            .insert([
                {
                    full_name:
                        String(fullName).trim(),

                    email:
                        normalizedEmail,

                    password_hash:
                        passwordHash,

                    role:
                        EB_ROLE,

                    is_active:
                        true,

                    failed_login_attempts:
                        0,

                    locked_until:
                        null,

                    last_login_at:
                        null,

                    created_by:
                        admin.userId,

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
        return handleAdminError(
            error,
            res,
            "Unable to create Electoral Board account."
        );
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
            await authenticateAdmin(req);

        // -------------------------------------------------
        // REQUEST DATA
        // -------------------------------------------------

        const {
            fullName,
            email,
        } = req.body;

        // -------------------------------------------------
        // VALIDATE NAME
        // -------------------------------------------------

        if (
            !fullName ||
            !String(fullName).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Full name is required.",
            });
        }

        // -------------------------------------------------
        // VALIDATE EMAIL
        // -------------------------------------------------

        if (
            !email ||
            !String(email).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Email address is required.",
            });
        }

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();

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
            .select(`
                id,
                email,
                role
            `)
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
        // GENERATE PASSWORD
        // -------------------------------------------------

        const temporaryPassword =
            generateTemporaryPassword();

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // -------------------------------------------------
        // CREATE ADMIN
        // -------------------------------------------------

        const {
            data: createdUser,
            error: createError,
        } = await supabase
            .from("staff_users")
            .insert([
                {
                    full_name:
                        String(fullName).trim(),

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

                    last_login_at:
                        null,

                    created_by:
                        admin.userId,

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
        return handleAdminError(
            error,
            res,
            "Unable to create Admin account."
        );
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
        await authenticateAdmin(req);

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
        // FIND ACCOUNT
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
            .eq(
                "id",
                id
            )
            .eq(
                "role",
                EB_ROLE
            )
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
        // ACTIVATE
        // -------------------------------------------------

        const {
            data: updatedUser,
            error: updateError,
        } = await supabase
            .from("staff_users")
            .update({
                is_active:
                    true,

                updated_at:
                    new Date().toISOString(),
            })
            .eq(
                "id",
                id
            )
            .eq(
                "role",
                EB_ROLE
            )
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

            user:
                updatedUser,
        });

    } catch (error) {
        return handleAdminError(
            error,
            res,
            "Unable to activate Electoral Board account."
        );
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
        await authenticateAdmin(req);

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
        // VALIDATE REASON
        // -------------------------------------------------

        if (
            !reason ||
            !String(reason).trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A reason is required when deactivating an Electoral Board account.",
            });
        }

        if (
            String(reason).trim().length < 5
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "The deactivation reason must contain at least 5 characters.",
            });
        }

        // -------------------------------------------------
        // FIND ACCOUNT
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
            .eq(
                "id",
                id
            )
            .eq(
                "role",
                EB_ROLE
            )
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
        // DEACTIVATE
        // -------------------------------------------------

        const {
            data: updatedUser,
            error: updateError,
        } = await supabase
            .from("staff_users")
            .update({
                is_active:
                    false,

                updated_at:
                    new Date().toISOString(),
            })
            .eq(
                "id",
                id
            )
            .eq(
                "role",
                EB_ROLE
            )
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
                String(reason).trim(),

            note:
                "The deactivation reason was validated but is not permanently stored because the current staff_users schema does not contain a confirmed reason field.",
        });

    } catch (error) {
        return handleAdminError(
            error,
            res,
            "Unable to deactivate Electoral Board account."
        );
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
        await authenticateAdmin(req);

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
        // FIND ACCOUNT
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
            .eq(
                "id",
                id
            )
            .eq(
                "role",
                EB_ROLE
            )
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
        // GENERATE TEMPORARY PASSWORD
        // -------------------------------------------------

        const temporaryPassword =
            generateTemporaryPassword();

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // -------------------------------------------------
        // UPDATE PASSWORD
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
            .eq(
                "id",
                id
            )
            .eq(
                "role",
                EB_ROLE
            )
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
        return handleAdminError(
            error,
            res,
            "Unable to reset Electoral Board password."
        );
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