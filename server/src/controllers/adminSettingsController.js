const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");

const auditLogsService =
    require("../services/auditLogsService");


// =========================================================
// VOTARA ADMIN SETTINGS CONTROLLER
// =========================================================


// =========================================================
// ADMIN AUTHENTICATION
// =========================================================

const authenticateAdmin = async (req) => {

    const authHeader =
        req.headers.authorization || "";

    if (
        !authHeader.startsWith(
            "Bearer "
        )
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

        decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

    } catch (error) {

        const authError =
            new Error(
                "Invalid or expired administrator session."
            );

        authError.statusCode = 401;

        throw authError;
    }


    // -----------------------------------------------------
    // VERIFY ADMIN ROLE
    // -----------------------------------------------------

    if (
        !decoded ||
        decoded.role !== "admin"
    ) {

        const error = new Error(
            "Administrator access is required."
        );

        error.statusCode = 403;

        throw error;
    }


    // -----------------------------------------------------
    // VERIFY USER ID
    // -----------------------------------------------------

    if (!decoded.userId) {

        const error = new Error(
            "Invalid administrator session."
        );

        error.statusCode = 401;

        throw error;
    }


    // -----------------------------------------------------
    // VERIFY ADMIN ACCOUNT
    // -----------------------------------------------------

    const {
        data: admin,
        error: adminError,
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
            "admin"
        )
        .maybeSingle();


    if (adminError) {

        console.error(
            "❌ Admin Settings authentication lookup error:",
            adminError
        );

        const error = new Error(
            `Unable to verify administrator account: ${adminError.message}`
        );

        error.statusCode = 500;

        throw error;
    }


    if (!admin) {

        const error = new Error(
            "Administrator account was not found."
        );

        error.statusCode = 401;

        throw error;
    }


    // -----------------------------------------------------
    // ACTIVE ACCOUNT
    // -----------------------------------------------------

    if (
        admin.is_active !== true
    ) {

        const error = new Error(
            "Administrator account is inactive."
        );

        error.statusCode = 403;

        throw error;
    }


    return admin;
};


// =========================================================
// ALLOWED SETTINGS
// =========================================================

const ALLOWED_SETTINGS = [

    "primaryColor",

    "theme",

    "systemName",

    "language",

    "timezone",

    "dateFormat",

    "academicYear",

    "registrationPeriod",

    "votingPeriod",

    "remoteVoting",

    "campusKiosk",

    "lateEnrolleeWindow",

    "otpMethod",

    "otpLength",

    "otpExpiry",

    "maxOtpAttempts",

    "resendCooldown",

    "senderEmail",

    "loginAttempts",

    "lockoutDuration",

    "otpRequestLimit",

    "registrationSubmissions",

    "ipRateLimit",

    "passwordRules",

    "forcePasswordChange",

    "sessionTimeout",

    "singleSession",

    "twoStepVerification",

    "kioskRestrictions",

    "maintenanceMode",

    "scheduledStart",

    "scheduledEnd",

    "adminAccess",

    "votingSafeguard",

    "maintenanceMessage",

    "emailNotifications",

    "electionNotifications",

    "securityNotifications",

    "allowRegistration",

    "allowVoting",

    "autoBackup",

    "backupFrequency",

];


// =========================================================
// PICK ALLOWED SETTINGS
// =========================================================

const pickAllowedSettings = (
    input = {}
) => {

    const output = {};

    ALLOWED_SETTINGS.forEach(
        (key) => {

            if (
                Object.prototype.hasOwnProperty.call(
                    input,
                    key
                )
            ) {

                output[key] =
                    input[key];

            }

        }
    );

    return output;
};


// =========================================================
// SAFE VALUE COMPARISON
// =========================================================

const valuesAreEqual = (
    left,
    right
) => {

    return (
        JSON.stringify(left) ===
        JSON.stringify(right)
    );
};


// =========================================================
// ERROR HANDLER
// =========================================================

const handleAdminSettingsError = (
    error,
    res,
    fallbackMessage
) => {

    console.error(
        "❌ Admin Settings error:",
        error
    );


    const statusCode =
        Number(
            error?.statusCode
        );


    if (
        statusCode === 401 ||
        statusCode === 403
    ) {

        return res.status(
            statusCode
        ).json({

            success: false,

            message:
                error.message ||
                "Administrator access is required.",

        });

    }


    return res.status(500).json({

        success: false,

        message:
            fallbackMessage,

        error:
            error?.message,

    });
};


// =========================================================
// GET ADMIN SYSTEM SETTINGS
// =========================================================
// GET /api/admin/settings
// =========================================================

const getAdminSystemSettings = async (
    req,
    res
) => {

    try {

        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        const admin =
            await authenticateAdmin(
                req
            );


        // -------------------------------------------------
        // GET SETTINGS
        // -------------------------------------------------

        const {
            data,
            error,
        } = await supabase
            .from(
                "system_settings"
            )
            .select(`
                id,
                settings,
                updated_by,
                created_at,
                updated_at
            `)
            .eq(
                "id",
                1
            )
            .maybeSingle();


        if (error) {

            throw new Error(
                `Unable to load system settings: ${error.message}`
            );

        }


        // -------------------------------------------------
        // CREATE DEFAULT ROW IF MISSING
        // -------------------------------------------------

        if (!data) {

            const {
                data: created,
                error: createError,
            } = await supabase
                .from(
                    "system_settings"
                )
                .insert([
                    {
                        id: 1,
                        settings: {},
                    },
                ])
                .select(`
                    id,
                    settings,
                    updated_by,
                    created_at,
                    updated_at
                `)
                .single();


            if (createError) {

                throw new Error(
                    `Unable to initialize system settings: ${createError.message}`
                );

            }


            return res.status(200).json({

                success: true,

                settings:
                    created.settings ||
                    {},

                metadata: {

                    id:
                        created.id,

                    updatedBy:
                        created.updated_by,

                    updatedAt:
                        created.updated_at,

                    updatedByAdmin: {

                        id:
                            admin.id,

                        fullName:
                            admin.full_name,

                        email:
                            admin.email,

                    },

                },

            });

        }


        // -------------------------------------------------
        // RETURN EXISTING SETTINGS
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            settings:
                data.settings ||
                {},

            metadata: {

                id:
                    data.id,

                updatedBy:
                    data.updated_by,

                updatedAt:
                    data.updated_at,

                updatedByAdmin:
                    data.updated_by ===
                        admin.id
                        ? {

                            id:
                                admin.id,

                            fullName:
                                admin.full_name,

                            email:
                                admin.email,

                        }
                        : null,

            },

        });

    } catch (error) {

        return handleAdminSettingsError(
            error,
            res,
            "Unable to load Admin System Settings."
        );

    }
};


// =========================================================
// UPDATE ADMIN SYSTEM SETTINGS
// =========================================================
// PUT /api/admin/settings
// =========================================================

const updateAdminSystemSettings = async (
    req,
    res
) => {

    try {

        // -------------------------------------------------
        // VERIFY ADMIN
        // -------------------------------------------------

        const admin =
            await authenticateAdmin(
                req
            );


        // -------------------------------------------------
        // REQUEST DATA
        // -------------------------------------------------

        const incomingSettings =
            req.body?.settings;


        if (
            !incomingSettings ||
            typeof incomingSettings !==
                "object" ||
            Array.isArray(
                incomingSettings
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A valid settings object is required.",

            });

        }


        // -------------------------------------------------
        // ONLY ACCEPT ALLOWED SETTINGS
        // -------------------------------------------------

        const safeIncoming =
            pickAllowedSettings(
                incomingSettings
            );


        // -------------------------------------------------
        // LOAD CURRENT SETTINGS
        // -------------------------------------------------

        const {
            data: existingRow,
            error: existingError,
        } = await supabase
            .from(
                "system_settings"
            )
            .select(`
                id,
                settings,
                updated_by,
                updated_at
            `)
            .eq(
                "id",
                1
            )
            .maybeSingle();


        if (existingError) {

            throw new Error(
                `Unable to read current system settings: ${existingError.message}`
            );

        }


        const currentSettings =
            existingRow?.settings &&
            typeof existingRow.settings ===
                "object"
                ? existingRow.settings
                : {};


        // -------------------------------------------------
        // MERGE SETTINGS
        // -------------------------------------------------

        const mergedSettings = {

            ...currentSettings,

            ...safeIncoming,

        };


        // -------------------------------------------------
        // DETERMINE CHANGED KEYS
        // -------------------------------------------------

        const changedKeys =
            ALLOWED_SETTINGS.filter(
                (key) =>

                    Object.prototype.hasOwnProperty.call(
                        safeIncoming,
                        key
                    ) &&

                    !valuesAreEqual(
                        currentSettings[key],
                        mergedSettings[key]
                    )
            );


        // -------------------------------------------------
        // NOTHING CHANGED
        // -------------------------------------------------

        if (
            changedKeys.length === 0
        ) {

            return res.status(200).json({

                success: true,

                message:
                    "No system settings were changed.",

                settings:
                    currentSettings,

                changedKeys: [],

                metadata: {

                    updatedAt:
                        existingRow?.updated_at ||
                        null,

                },

            });

        }


        // -------------------------------------------------
        // SAVE TO SUPABASE
        // -------------------------------------------------

        const {
            data: updatedRow,
            error: updateError,
        } = await supabase
            .from(
                "system_settings"
            )
            .upsert(
                [
                    {
                        id: 1,

                        settings:
                            mergedSettings,

                        updated_by:
                            admin.id,

                        updated_at:
                            new Date().toISOString(),

                    },
                ],
                {
                    onConflict:
                        "id",
                }
            )
            .select(`
                id,
                settings,
                updated_by,
                created_at,
                updated_at
            `)
            .single();


        if (updateError) {

            throw new Error(
                `Unable to save system settings: ${updateError.message}`
            );

        }


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        try {

            await auditLogsService
                .createAuditLog({

                    actorId:
                        admin.id,

                    actorName:
                        admin.full_name,

                    actorEmail:
                        admin.email,

                    actorRole:
                        admin.role,

                    action:
                        "update",

                    module:
                        "System Settings",

                    description:
                        "Updated Admin System Settings.",

                    targetId:
                        "1",

                    targetType:
                        "system_settings",

                    metadata: {

                        changedKeys,

                    },

                    ipAddress:
                        req.ip,

                    userAgent:
                        req.get(
                            "user-agent"
                        ),

                });

        } catch (auditError) {

            // Settings have already been saved.
            // Do not undo a successful settings update
            // just because audit logging encountered an error.

            console.error(
                "⚠️ System Settings audit log failed:",
                auditError
            );

        }


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "System settings saved successfully.",

            settings:
                updatedRow.settings,

            changedKeys,

            metadata: {

                updatedAt:
                    updatedRow.updated_at,

                updatedBy:
                    admin.id,

            },

        });

    } catch (error) {

        return handleAdminSettingsError(
            error,
            res,
            "Unable to save Admin System Settings."
        );

    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    getAdminSystemSettings,

    updateAdminSystemSettings,

};