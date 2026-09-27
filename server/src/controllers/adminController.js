const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const os = require("os");
const { google } = require("googleapis");
const auditLogsService = require("../services/auditLogsService");

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

const writeAdminAuditLog = async (
    req,
    {
        action,
        description,
        targetId = null,
        targetType = null,
        metadata = {},
        electionId = null,
    } = {}
) => {
    try {
        const requestUser =
            req.user ||
            req.admin ||
            {};

        let actorId =
            requestUser.userId ||
            requestUser.id ||
            null;

        let actorName =
            requestUser.fullName ||
            requestUser.full_name ||
            "Administrator";

        let actorEmail =
            requestUser.email ||
            null;

        let actorRole =
            requestUser.role ||
            ADMIN_ROLE;

        // The current admin middleware may only place userId/role
        // in req.user. Decode the already-authenticated JWT so the
        // audit record can still resolve the administrator email.
        if (!actorId) {
            const authHeader =
                req.headers?.authorization || "";

            if (authHeader.startsWith("Bearer ")) {
                try {
                    const token =
                        authHeader.substring(7).trim();

                    const decoded =
                        jwt.verify(
                            token,
                            process.env.JWT_SECRET
                        );

                    actorId =
                        decoded.userId ||
                        decoded.id ||
                        null;

                    actorRole =
                        decoded.role ||
                        actorRole;
                } catch (tokenError) {
                    // Do not fail the main request because audit
                    // enrichment could not decode the token.
                }
            }
        }

        if (actorId) {
            const { data: staff } =
                await supabase
                    .from("staff_users")
                    .select(
                        "id, full_name, email, role"
                    )
                    .eq("id", actorId)
                    .maybeSingle();

            if (staff) {
                actorName =
                    staff.full_name ||
                    actorName;

                actorEmail =
                    staff.email ||
                    actorEmail;

                actorRole =
                    staff.role ||
                    actorRole;
            }
        }

        // audit_logs.actor_email is NOT NULL in the current schema.
        // Never send null for this required field.
        actorEmail =
            actorEmail ||
            process.env.EMAIL_USER ||
            "votara.election@gmail.com";

        await auditLogsService.createAuditLog({
            actorId,
            actorName,
            actorEmail,
            actorRole,
            action,
            module: "Admin Management",
            description,
            electionId,
            targetId,
            targetType,
            metadata,
            ipAddress:
            req.headers?.["x-forwarded-for"]
                ?.split(",")[0]
                ?.trim() ||
            req.ip ||
            req.socket?.remoteAddress ||
            req.connection?.remoteAddress ||
            "0.0.0.0",
            
            userAgent:
                typeof req.get === "function"
                    ? req.get("user-agent")
                    : null,
        });
    } catch (auditError) {
        console.error(
            "⚠️ Admin audit log write failed:",
            auditError?.message || auditError
        );
    }
};

// =========================================================
// STAFF PROFILE PHOTO UPLOAD
// =========================================================

const uploadStaffProfilePhoto = async (
    profilePhotoData,
    profilePhotoName,
    profilePhotoType,
    staffId
) => {
    if (!profilePhotoData) {
        return null;
    }

    if (
        typeof profilePhotoData !== "string" ||
        !profilePhotoData.startsWith("data:image/")
    ) {
        throw new Error(
            "Invalid profile picture format. Please upload a PNG, JPG, or WEBP image."
        );
    }

    const match =
        profilePhotoData.match(
            /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i
        );

    if (!match) {
        throw new Error(
            "Invalid profile picture data."
        );
    }

    const contentType =
        match[1].toLowerCase() === "image/jpg"
            ? "image/jpeg"
            : match[1].toLowerCase();

    const buffer =
        Buffer.from(
            match[2],
            "base64"
        );

    if (buffer.length > 2 * 1024 * 1024) {
        throw new Error(
            "Profile picture must be 2 MB or smaller."
        );
    }

    const extensionMap = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
    };

    const extension =
        extensionMap[contentType] ||
        "jpg";

    const safeOriginalName =
        String(profilePhotoName || "profile")
            .replace(/[^a-zA-Z0-9._-]/g, "_")
            .replace(/\.[^.]+$/, "");

    const filePath =
        `staff/${staffId}/${Date.now()}-${safeOriginalName}.${extension}`;

    const bucketName =
        "staff-profiles";

    // Create the bucket once if it does not exist.
    const { data: bucket } =
        await supabase.storage
            .getBucket(bucketName);

    if (!bucket) {
        await supabase.storage.createBucket(
            bucketName,
            {
                public: true,
                fileSizeLimit: "2MB",
                allowedMimeTypes: [
                    "image/png",
                    "image/jpeg",
                    "image/webp",
                ],
            }
        );
    }

    const {
        error: uploadError,
    } = await supabase.storage
        .from(bucketName)
        .upload(
            filePath,
            buffer,
            {
                contentType,
                cacheControl: "3600",
                upsert: false,
            }
        );

    if (uploadError) {
        throw new Error(
            `Unable to upload profile picture: ${uploadError.message}`
        );
    }

    const {
        data: publicData,
    } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

    return publicData?.publicUrl || null;
};

// =========================================================
// SEND ELECTORAL BOARD CREDENTIALS EMAIL
// =========================================================

const sendEBAccountCredentialsEmail = async ({
    email,
    fullName,
    temporaryPassword,
}) => {
    const clientId =
        process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
        process.env.GOOGLE_CLIENT_SECRET;

    const refreshToken =
        process.env.GOOGLE_REFRESH_TOKEN;

    const fromEmail =
        process.env.EMAIL_USER ||
        "votara.election@gmail.com";

    if (
        !clientId ||
        !clientSecret ||
        !refreshToken
    ) {
        throw new Error(
            "Google Gmail OAuth configuration is incomplete."
        );
    }

    const oauth2Client =
        new google.auth.OAuth2(
            clientId,
            clientSecret
        );

    oauth2Client.setCredentials({
        refresh_token: refreshToken,
    });

    const gmail = google.gmail({
        version: "v1",
        auth: oauth2Client,
    });

    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    const safeName =
        escapeHtml(fullName);

    const safeEmail =
        escapeHtml(email);

    const safePassword =
        escapeHtml(temporaryPassword);

    const loginUrl =
        process.env.VOTARA_CLIENT_URL ||
        process.env.CLIENT_URL ||
        "http://localhost:5173/admin-login";

    const safeLoginUrl =
        escapeHtml(loginUrl);

    const html = `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:30px;background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;">
            <h2 style="color:#266eff;margin:0 0 8px;">VOTARA Electoral Board Account</h2>
            <p style="color:#667085;margin-top:0;">Your Electoral Board account has been created by a VOTARA Administrator.</p>

            <p>Hello <strong>${safeName}</strong>,</p>

            <p>Your VOTARA Electoral Board account is ready. Use the credentials below to sign in.</p>

            <div style="margin:24px 0;padding:20px;background:#f4f7ff;border:1px solid #dbe5ff;border-radius:12px;">
                <p style="margin:0 0 10px;"><strong>Email:</strong> ${safeEmail}</p>
                <p style="margin:0 0 8px;"><strong>Temporary Password:</strong></p>
                <div style="padding:14px;text-align:center;background:#ffffff;border:1px solid #dbe5ff;border-radius:9px;font-size:22px;font-weight:700;letter-spacing:1px;color:#266eff;">
                    ${safePassword}
                </div>
            </div>

            <p style="color:#92400e;background:#fff7ed;border-left:4px solid #f59e0b;padding:14px;border-radius:7px;">
                This is a temporary password. After your first successful login, you must change it to your personal password.
            </p>

            <p style="margin-top:24px;">
                <a href="${safeLoginUrl}" style="display:inline-block;padding:12px 18px;background:#266eff;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">
                    Open VOTARA Login
                </a>
            </p>

            <p style="font-size:12px;color:#667085;line-height:1.6;margin-top:28px;">
                VOTARA Electoral Board<br>
                Western Institute of Technology
            </p>
        </div>
    `;

    const message = [
        `From: "VOTARA Electoral Board" <${fromEmail}>`,
        `To: ${email}`,
        "Subject: VOTARA Electoral Board Account Created",
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: 8bit",
        "",
        html,
    ].join("\r\n");

    const raw =
        Buffer.from(
            message,
            "utf8"
        )
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

    const response =
        await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw,
            },
        });

    return {
        success: true,
        messageId: response.data?.id || null,
    };
};

// =========================================================
// ADMIN DASHBOARD STATISTICS
// =========================================================

const getAdminDashboard = async (
    req,
    res
) => {
    try {
        const admin = await authenticateAdmin(req);

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

        const {
            count: pendingRegistrations,
            error: registrationError,
        } = await supabase
            .from("registration_applications")
            .select("*", {
                count: "exact",
                head: true,
            })
            .in("application_status", [
                "pending",
                "pending_review",
            ]);

        if (registrationError) {
            throw new Error(
                `Unable to count pending registrations: ${registrationError.message}`
            );
        }

        const {
            count: activeStaff,
            error: activeStaffError,
        } = await supabase
            .from("staff_users")
            .select("*", {
                count: "exact",
                head: true,
            })
            .eq("is_active", true);

        if (activeStaffError) {
            throw new Error(
                `Unable to count active staff: ${activeStaffError.message}`
            );
        }

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
            .in("status", [
                "open",
                "active",
                "scheduled",
            ])
            .order("created_at", {
                ascending: false,
            })
            .limit(1)
            .maybeSingle();

        if (activeElectionError) {
            throw new Error(
                `Unable to load active election: ${activeElectionError.message}`
            );
        }

        // -------------------------------------------------
        // SERVER USAGE
        // -------------------------------------------------

        const memoryUsage = process.memoryUsage();
        const totalSystemMemory = os.totalmem();

        const serverUsagePercent =
            totalSystemMemory > 0
                ? Number(
                    (
                        (memoryUsage.rss / totalSystemMemory) *
                        100
                    ).toFixed(2)
                )
                : 0;

        // -------------------------------------------------
        // AUDIT LOG COUNT
        // -------------------------------------------------

        const {
            count: auditLogCount,
            error: auditCountError,
        } = await supabase
            .from("audit_logs")
            .select("id", {
                count: "exact",
                head: true,
            });

        if (auditCountError) {
            throw new Error(
                `Unable to count audit logs: ${auditCountError.message}`
            );
        }

        // -------------------------------------------------
        // RECENT AUDIT LOGS
        // -------------------------------------------------

        const {
            data: recentAuditLogs,
            error: recentAuditError,
        } = await supabase
            .from("audit_logs")
            .select(`
                id,
                actor_id,
                actor_name,
                actor_email,
                actor_role,
                action,
                module,
                description,
                election_id,
                target_id,
                target_type,
                metadata,
                created_at
            `)
            .order("created_at", {
                ascending: false,
            })
            .limit(5);

        if (recentAuditError) {
            throw new Error(
                `Unable to load recent audit logs: ${recentAuditError.message}`
            );
        }

        const totalUsers =
            (totalStudents || 0) +
            (totalStaff || 0);

        const systemDashboard = {
            systemHealth: {
                status: "Online",
                api: "Online",
                database: "Connected",
            },

            totalUsers,

            electionStatus: {
                status:
                    activeElection?.status ||
                    "No Election",
                election:
                    activeElection ||
                    null,
            },

            serverUsage: {
                memoryPercent:
                    serverUsagePercent,
                rssMB:
                    Number(
                        (
                            memoryUsage.rss /
                            1024 /
                            1024
                        ).toFixed(2)
                    ),
                heapUsedMB:
                    Number(
                        (
                            memoryUsage.heapUsed /
                            1024 /
                            1024
                        ).toFixed(2)
                    ),
                heapTotalMB:
                    Number(
                        (
                            memoryUsage.heapTotal /
                            1024 /
                            1024
                        ).toFixed(2)
                    ),
                uptimeSeconds:
                    Math.floor(
                        process.uptime()
                    ),
                nodeVersion:
                    process.version,
            },

            activityLogs: {
                total:
                    auditLogCount || 0,
                recent:
                    recentAuditLogs || [],
            },
        };

        // -------------------------------------------------
        // LOG ADMIN DASHBOARD ACCESS
        // -------------------------------------------------

        await writeAdminAuditLog(req, {
            action: "view_dashboard",
            description:
                "Administrator viewed the Admin Dashboard.",
            targetType: "admin_dashboard",
            metadata: {
                source: "Admin Dashboard",
            },
        });

        return res.status(200).json({
            success: true,

            admin: {
                id: admin.id,
                userId: admin.userId,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role,
                isActive: admin.isActive,
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

            systemDashboard,

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
        const admin =
            await authenticateAdmin(req);

        const {
            fullName,
            email,
            profilePhotoData,
            profilePhotoName,
            profilePhotoType,
        } = req.body || {};

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

        if (!profilePhotoData) {
            return res.status(400).json({
                success: false,
                message:
                    "Profile picture is required for an Electoral Board account.",
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

        const {
            data: existingUser,
            error: existingUserError,
        } = await supabase
            .from("staff_users")
            .select("id, email, role")
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

        const temporaryPassword =
            generateTemporaryPassword();

        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                12
            );

        // Create the staff record first so the profile image path
        // can be tied to the permanent staff ID.
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
                profile_photo_url,
                created_at
            `)
            .single();

        if (createError) {
            throw new Error(
                `Unable to create Electoral Board account: ${createError.message}`
            );
        }

        let profilePhotoUrl =
            createdUser.profile_photo_url ||
            null;

        try {
            profilePhotoUrl =
                await uploadStaffProfilePhoto(
                    profilePhotoData,
                    profilePhotoName,
                    profilePhotoType,
                    createdUser.id
                );

            if (profilePhotoUrl) {
                const {
                    data: updatedUser,
                    error: profileUpdateError,
                } = await supabase
                    .from("staff_users")
                    .update({
                        profile_photo_url:
                            profilePhotoUrl,
                        updated_at:
                            new Date().toISOString(),
                    })
                    .eq(
                        "id",
                        createdUser.id
                    )
                    .select(`
                        id,
                        full_name,
                        email,
                        role,
                        is_active,
                        must_change_password,
                        profile_photo_url,
                        created_at
                    `)
                    .single();

                if (profileUpdateError) {
                    throw new Error(
                        `Unable to save profile picture URL: ${profileUpdateError.message}`
                    );
                }

                Object.assign(
                    createdUser,
                    updatedUser
                );
            }
        } catch (profileError) {
            // Remove the account if the required profile picture
            // cannot be stored. This keeps account creation atomic
            // from the Admin user's perspective.
            await supabase
                .from("staff_users")
                .delete()
                .eq("id", createdUser.id);

            throw profileError;
        }

        let emailSent = false;
        let emailMessageId = null;

        try {
            const emailResult =
                await sendEBAccountCredentialsEmail({
                    email: normalizedEmail,
                    fullName:
                        String(fullName).trim(),
                    temporaryPassword,
                });

            emailSent =
                emailResult.success === true;

            emailMessageId =
                emailResult.messageId ||
                null;
        } catch (emailError) {
            console.error(
                "⚠️ EB credentials email failed:",
                emailError?.message ||
                emailError
            );
        }

        await writeAdminAuditLog(req, {
            action:
                "create_eb_account",
            description:
                `Administrator created an Electoral Board account for "${createdUser.full_name}".`,
            targetId:
                createdUser.id,
            targetType:
                "staff_user",
            metadata: {
                role:
                    EB_ROLE,
                emailSent,
                profilePictureUploaded:
                    Boolean(profilePhotoUrl),
            },
        });

        return res.status(201).json({
            success: true,
            message:
                "Electoral Board account created successfully.",
            user:
                createdUser,
            temporaryPassword,
            emailSent,
            emailMessageId,
            passwordNote:
                "The password is intentionally not stored in plaintext. Use Reset Password to generate a new temporary password later.",
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

        let emailSent = false;

        try {
            const emailResult =
                await sendEBAccountCredentialsEmail({
                    email: updatedUser.email,
                    fullName: updatedUser.full_name,
                    temporaryPassword,
                });

            emailSent =
                emailResult.success === true;
        } catch (emailError) {
            console.error(
                "⚠️ Reset EB credentials email failed:",
                emailError?.message || emailError
            );
        }

        await writeAdminAuditLog(req, {
            action: "reset_eb_password",
            description:
                `Administrator generated a new temporary password for Electoral Board account "${updatedUser.full_name}".`,
            targetId: updatedUser.id,
            targetType: "staff_user",
            metadata: {
                role: EB_ROLE,
                emailSent,
            },
        });

        return res.status(200).json({
            success: true,

            message:
                "Electoral Board password reset successfully.",

            user:
                updatedUser,

            temporaryPassword:
                temporaryPassword,

            emailSent,

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