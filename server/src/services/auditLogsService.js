const supabase = require("../config/supabase");

// =========================================================
// AUDIT LOGS SERVICE
// VOTARA ELECTORAL BOARD
// =========================================================
//
// This service provides reusable functions for:
//
// 1. Creating audit logs
// 2. Getting audit logs
// 3. Getting a single audit log
//
// IMPORTANT:
// Audit logs must never store passwords, authentication
// tokens, student ballot selections, or other sensitive
// voting information.
//
// =========================================================


// =========================================================
// SAFE AUDIT LOG FIELDS
// =========================================================

const AUDIT_LOG_FIELDS = `
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
    ip_address,
    user_agent,
    created_at
`;


// =========================================================
// REMOVE SENSITIVE DATA FROM METADATA
// =========================================================
//
// This protects the audit log from accidentally storing:
//
// - passwords
// - authentication tokens
// - access tokens
// - refresh tokens
// - ballot tokens
// - private ballot selections
// - student passwords
//
// =========================================================

const sanitizeMetadata = (
    metadata
) => {

    if (
        !metadata ||
        typeof metadata !== "object"
    ) {
        return {};
    }

    const blockedKeys = new Set([
        "password",
        "current_password",
        "new_password",
        "confirm_password",

        "token",
        "access_token",
        "refresh_token",
        "authorization",

        "jwt",
        "jwt_token",
        "auth_token",

        "ballot_token",
        "ballotToken",

        "selected_candidates",
        "selectedCandidates",
        "selections",
        "selection",
        "votes",
        "ballot_votes",
        "ballotVotes",

        "student_password",
        "studentPassword",

        "private_key",
        "secret",
        "secret_key",
        "api_key",
        "apiKey"
    ]);

    const cleanMetadata = {};

    Object.entries(metadata).forEach(
        ([key, value]) => {

            const normalizedKey =
                String(key)
                    .trim()
                    .toLowerCase();

            if (
                blockedKeys.has(
                    normalizedKey
                )
            ) {
                return;
            }

            // -------------------------------------------------
            // Prevent nested sensitive objects from being
            // stored.
            // -------------------------------------------------

            if (
                value &&
                typeof value === "object" &&
                !Array.isArray(value)
            ) {

                cleanMetadata[key] =
                    sanitizeMetadata(value);

                return;
            }

            // -------------------------------------------------
            // Arrays
            // -------------------------------------------------

            if (
                Array.isArray(value)
            ) {

                cleanMetadata[key] =
                    value.map(
                        (item) => {

                            if (
                                item &&
                                typeof item === "object"
                            ) {
                                return sanitizeMetadata(
                                    item
                                );
                            }

                            return item;
                        }
                    );

                return;
            }

            cleanMetadata[key] =
                value;
        }
    );

    return cleanMetadata;
};


// =========================================================
// CREATE AUDIT LOG
// =========================================================
//
// Example:
//
// await createAuditLog({
//     actorId: staff.id,
//     actorName: staff.full_name,
//     actorEmail: staff.email,
//     actorRole: staff.role,
//     action: "create",
//     module: "Election Management",
//     description: "Created a new election.",
//     electionId: election.id,
//     targetId: election.id,
//     targetType: "election",
//     metadata: {
//         electionTitle: election.title
//     },
//     ipAddress: req.ip,
//     userAgent: req.get("user-agent")
// });
//
// =========================================================

const createAuditLog = async ({
    actorId = null,
    actorName = null,
    actorEmail = null,
    actorRole = null,

    action,
    module,
    description = null,

    electionId = null,

    targetId = null,
    targetType = null,

    metadata = {},

    ipAddress = null,
    userAgent = null
} = {}) => {

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!action) {
        throw new Error(
            "Audit log action is required."
        );
    }

    if (!module) {
        throw new Error(
            "Audit log module is required."
        );
    }


    // -------------------------------------------------
    // SANITIZE METADATA
    // -------------------------------------------------

    const safeMetadata =
        sanitizeMetadata(
            metadata
        );


    // -------------------------------------------------
    // INSERT AUDIT LOG
    // -------------------------------------------------

    const {
        data,
        error
    } = await supabase
        .from("audit_logs")
        .insert([
            {
                actor_id:
                    actorId,

                actor_name:
                    actorName,

                actor_email:
                    actorEmail,

                actor_role:
                    actorRole,

                action:
                    action,

                module:
                    module,

                description:
                    description,

                election_id:
                    electionId,

                target_id:
                    targetId,

                target_type:
                    targetType,

                metadata:
                    safeMetadata,

                ip_address:
                    ipAddress,

                user_agent:
                    userAgent
            }
        ])
        .select(
            AUDIT_LOG_FIELDS
        )
        .single();


    // -------------------------------------------------
    // HANDLE ERROR
    // -------------------------------------------------

    if (error) {
        throw error;
    }


    return data;
};


// =========================================================
// GET AUDIT LOGS
// =========================================================
//
// Supports:
//
// - Search
// - Module filter
// - Action filter
// - Election filter
// - Date from
// - Date to
// - Pagination
//
// =========================================================

const getAuditLogs = async ({
    search = "",
    module = "",
    action = "",
    electionId = "",
    dateFrom = "",
    dateTo = "",
    page = 1,
    limit = 20
} = {}) => {

    // -------------------------------------------------
    // SANITIZE PAGINATION
    // -------------------------------------------------

    let safePage =
        parseInt(
            page,
            10
        );

    let safeLimit =
        parseInt(
            limit,
            10
        );

    if (
        Number.isNaN(
            safePage
        ) ||
        safePage < 1
    ) {
        safePage = 1;
    }

    if (
        Number.isNaN(
            safeLimit
        ) ||
        safeLimit < 1
    ) {
        safeLimit = 20;
    }

    if (
        safeLimit > 100
    ) {
        safeLimit = 100;
    }


    // -------------------------------------------------
    // CALCULATE RANGE
    // -------------------------------------------------

    const from =
        (
            safePage - 1
        ) * safeLimit;

    const to =
        from +
        safeLimit -
        1;


    // -------------------------------------------------
    // BUILD QUERY
    // -------------------------------------------------

    let query =
        supabase
            .from("audit_logs")
            .select(
                AUDIT_LOG_FIELDS,
                {
                    count: "exact"
                }
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    // -------------------------------------------------
    // MODULE FILTER
    // -------------------------------------------------

    if (
        String(module)
            .trim()
    ) {

        query =
            query.eq(
                "module",
                String(module)
                    .trim()
            );
    }


    // -------------------------------------------------
    // ACTION FILTER
    // -------------------------------------------------

    if (
        String(action)
            .trim()
    ) {

        query =
            query.eq(
                "action",
                String(action)
                    .trim()
            );
    }


    // -------------------------------------------------
    // ELECTION FILTER
    // -------------------------------------------------

    if (
        String(electionId)
            .trim()
    ) {

        query =
            query.eq(
                "election_id",
                String(electionId)
                    .trim()
            );
    }


    // -------------------------------------------------
    // DATE FROM
    // -------------------------------------------------

    if (
        String(dateFrom)
            .trim()
    ) {

        query =
            query.gte(
                "created_at",
                `${String(dateFrom).trim()}T00:00:00`
            );
    }


    // -------------------------------------------------
    // DATE TO
    // -------------------------------------------------

    if (
        String(dateTo)
            .trim()
    ) {

        query =
            query.lte(
                "created_at",
                `${String(dateTo).trim()}T23:59:59`
            );
    }


    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    const cleanSearch =
        String(search || "")
            .trim();

    if (cleanSearch) {

        const escapedSearch =
            cleanSearch
                .replace(/,/g, "")
                .replace(/\(/g, "")
                .replace(/\)/g, "");

        query =
            query.or(
                `actor_name.ilike.%${escapedSearch}%,` +
                `actor_email.ilike.%${escapedSearch}%,` +
                `description.ilike.%${escapedSearch}%,` +
                `module.ilike.%${escapedSearch}%,` +
                `action.ilike.%${escapedSearch}%`
            );
    }


    // -------------------------------------------------
    // PAGINATION
    // -------------------------------------------------

    query =
        query.range(
            from,
            to
        );


    // -------------------------------------------------
    // EXECUTE
    // -------------------------------------------------

    const {
        data,
        error,
        count
    } = await query;


    if (error) {
        throw error;
    }


    // -------------------------------------------------
    // TOTAL
    // -------------------------------------------------

    const total =
        count || 0;


    const totalPages =
        Math.ceil(
            total /
            safeLimit
        );


    // -------------------------------------------------
    // RETURN
    // -------------------------------------------------

    return {

        logs:
            data || [],

        pagination: {

            page:
                safePage,

            limit:
                safeLimit,

            total,

            totalPages,

            hasNextPage:
                safePage <
                totalPages,

            hasPreviousPage:
                safePage >
                1
        }

    };
};


// =========================================================
// GET SINGLE AUDIT LOG
// =========================================================

const getAuditLogById = async (
    logId
) => {

    const id =
        String(
            logId || ""
        ).trim();


    if (!id) {

        throw new Error(
            "Audit log ID is required."
        );
    }


    // -------------------------------------------------
    // GET LOG
    // -------------------------------------------------

    const {
        data,
        error
    } = await supabase
        .from("audit_logs")
        .select(
            AUDIT_LOG_FIELDS
        )
        .eq(
            "id",
            id
        )
        .maybeSingle();


    if (error) {
        throw error;
    }


    if (!data) {

        const notFoundError =
            new Error(
                "Audit log not found."
            );

        notFoundError.code =
            "AUDIT_LOG_NOT_FOUND";

        throw notFoundError;
    }


    return data;
};


// =========================================================
// GET AUDIT LOGS BY ELECTION
// =========================================================
//
// Useful for future election-specific audit reports.
//
// =========================================================

const getAuditLogsByElection = async (
    electionId,
    options = {}
) => {

    if (!electionId) {

        throw new Error(
            "Election ID is required."
        );
    }


    return getAuditLogs({

        ...options,

        electionId

    });
};


// =========================================================
// GET AUDIT LOGS BY ACTOR
// =========================================================
//
// Useful when the EB needs to review the actions
// performed by a specific Electoral Board member.
//
// =========================================================

const getAuditLogsByActor = async (
    actorId,
    options = {}
) => {

    if (!actorId) {

        throw new Error(
            "Actor ID is required."
        );
    }


    let safePage =
        parseInt(
            options.page || 1,
            10
        );

    let safeLimit =
        parseInt(
            options.limit || 20,
            10
        );

    if (
        Number.isNaN(safePage) ||
        safePage < 1
    ) {
        safePage = 1;
    }

    if (
        Number.isNaN(safeLimit) ||
        safeLimit < 1
    ) {
        safeLimit = 20;
    }

    if (
        safeLimit > 100
    ) {
        safeLimit = 100;
    }


    const from =
        (
            safePage - 1
        ) * safeLimit;

    const to =
        from +
        safeLimit -
        1;


    const {
        data,
        error,
        count
    } = await supabase
        .from("audit_logs")
        .select(
            AUDIT_LOG_FIELDS,
            {
                count: "exact"
            }
        )
        .eq(
            "actor_id",
            actorId
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .range(
            from,
            to
        );


    if (error) {
        throw error;
    }


    const total =
        count || 0;


    const totalPages =
        Math.ceil(
            total /
            safeLimit
        );


    return {

        logs:
            data || [],

        pagination: {

            page:
                safePage,

            limit:
                safeLimit,

            total,

            totalPages,

            hasNextPage:
                safePage <
                totalPages,

            hasPreviousPage:
                safePage >
                1
        }

    };
};


// =========================================================
// DELETE AUDIT LOGS IS INTENTIONALLY NOT PROVIDED
// =========================================================
//
// Audit logs are accountability records.
//
// They should not normally be deleted from the
// Electoral Board interface.
//
// =========================================================


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    createAuditLog,

    getAuditLogs,

    getAuditLogById,

    getAuditLogsByElection,

    getAuditLogsByActor

};