const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// =========================================================
// ADMIN AUDIT LOGS CONTROLLER
// =========================================================
//
// This endpoint is ADMIN-ONLY.
//
// The Admin audit page exposes ADMIN activity only.
// Electoral Board activity is served exclusively by the
// Electoral Board audit endpoint.
//
// The Electoral Board audit endpoint remains separate and is
// restricted to ELECTORAL BOARD records only.
//
// =========================================================

const ADMIN_ROLE = "admin";

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
// AUTHENTICATE ADMIN
// =========================================================

const authenticateAdmin = async (req) => {
    const authHeader =
        req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
        const error = new Error(
            "Authentication token is required."
        );
        error.statusCode = 401;
        throw error;
    }

    const token =
        authHeader.substring(7).trim();

    if (!token) {
        const error = new Error(
            "Authentication token is missing."
        );
        error.statusCode = 401;
        throw error;
    }

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

    if (!decoded.userId) {
        const error = new Error(
            "Invalid administrator session."
        );
        error.statusCode = 401;
        throw error;
    }

    const {
        data: admin,
        error,
    } = await supabase
        .from("staff_users")
        .select(`
            id,
            full_name,
            email,
            role,
            is_active
        `)
        .eq("id", decoded.userId)
        .eq("role", ADMIN_ROLE)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!admin) {
        const authError = new Error(
            "Administrator account was not found."
        );
        authError.statusCode = 401;
        throw authError;
    }

    if (admin.is_active !== true) {
        const authError = new Error(
            "Administrator account is inactive."
        );
        authError.statusCode = 403;
        throw authError;
    }

    return admin;
};

// =========================================================
// SUMMARY HELPER
// =========================================================

const buildActivitySummary = (logs = []) => {
    const summary = {
        total: logs.length,
        categories: {
            all: logs.length,
            authentication: 0,
            elections: 0,
            candidates: 0,
            accounts: 0,
            system: 0,
            security: 0,
            kiosk: 0,
        },
        severity: {
            info: 0,
            success: 0,
            warning: 0,
            critical: 0,
        },
    };

    logs.forEach((log) => {
        const moduleName = String(
            log?.module || ""
        ).toLowerCase();

        const actionName = String(
            log?.action || ""
        ).toLowerCase();

        let category = "system";

        if (
            actionName.includes("login") ||
            actionName.includes("logout") ||
            actionName.includes("password") ||
            actionName.includes("otp") ||
            actionName.includes("pin") ||
            moduleName.includes("auth") ||
            moduleName.includes("security")
        ) {
            category = "authentication";
        } else if (
            moduleName.includes("election") ||
            moduleName.includes("result") ||
            moduleName.includes("voting")
        ) {
            category = "elections";
        } else if (
            moduleName.includes("candidate") ||
            moduleName.includes("party")
        ) {
            category = "candidates";
        } else if (
            moduleName.includes("account") ||
            moduleName.includes("admin")
        ) {
            category = "accounts";
        } else if (
            moduleName.includes("kiosk")
        ) {
            category = "kiosk";
        } else if (
            actionName.includes("failed") ||
            actionName.includes("reject") ||
            actionName.includes("suspicious") ||
            actionName.includes("lock")
        ) {
            category = "security";
        }

        summary.categories[category] += 1;

        if (
            actionName.includes("failed") ||
            actionName.includes("reject") ||
            actionName.includes("suspicious") ||
            actionName.includes("lock")
        ) {
            summary.severity.critical += 1;
        } else if (
            actionName.includes("warning") ||
            actionName.includes("correction") ||
            actionName.includes("deactivate")
        ) {
            summary.severity.warning += 1;
        } else if (
            actionName.includes("login") ||
            actionName.includes("logout") ||
            actionName.includes("view") ||
            actionName.includes("search")
        ) {
            summary.severity.info += 1;
        } else {
            summary.severity.success += 1;
        }
    });

    return summary;
};

// =========================================================
// GET ADMIN MONITORING LOGS
// =========================================================

const getAdminAuditLogs = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const search = String(
            req.query.search || ""
        ).trim();

        const module = String(
            req.query.module || ""
        ).trim();

        const action = String(
            req.query.action || ""
        ).trim();

        const electionId = String(
            req.query.election_id ||
            req.query.electionId ||
            ""
        ).trim();

        const dateFrom = String(
            req.query.date_from ||
            req.query.dateFrom ||
            ""
        ).trim();

        const dateTo = String(
            req.query.date_to ||
            req.query.dateTo ||
            ""
        ).trim();

        let page = parseInt(
            req.query.page || "1",
            10
        );

        let limit = parseInt(
            req.query.limit || "20",
            10
        );

        if (Number.isNaN(page) || page < 1) {
            page = 1;
        }

        if (Number.isNaN(limit) || limit < 1) {
            limit = 20;
        }

        if (limit > 100) {
            limit = 100;
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from("audit_logs")
            .select(AUDIT_LOG_FIELDS, {
                count: "exact",
            })
            .order("created_at", {
                ascending: false,
            });

        // SECURITY SCOPE: ADMIN LOGS ONLY.
        // Never allow the Admin endpoint to return EB records.
        query = query.eq(
            "actor_role",
            ADMIN_ROLE
        );

        if (module) {
            query = query.eq(
                "module",
                module
            );
        }

        if (action) {
            query = query.eq(
                "action",
                action
            );
        }

        if (electionId) {
            query = query.eq(
                "election_id",
                electionId
            );
        }

        if (dateFrom) {
            query = query.gte(
                "created_at",
                `${dateFrom}T00:00:00`
            );
        }

        if (dateTo) {
            query = query.lte(
                "created_at",
                `${dateTo}T23:59:59`
            );
        }

        if (search) {
            const escapedSearch = search
                .replace(/,/g, "")
                .replace(/\(/g, "")
                .replace(/\)/g, "");

            query = query.or(
                `actor_name.ilike.%${escapedSearch}%,` +
                `actor_email.ilike.%${escapedSearch}%,` +
                `description.ilike.%${escapedSearch}%,` +
                `module.ilike.%${escapedSearch}%,` +
                `action.ilike.%${escapedSearch}%`
            );
        }

        query = query.range(from, to);

        const {
            data,
            error,
            count,
        } = await query;

        if (error) {
            throw error;
        }

        // Build the dashboard summary from the complete audit
        // stream, not just the current page.
        let summaryQuery = supabase
            .from("audit_logs")
            .select(`
                action,
                module,
                actor_role
            `);

        // Keep the summary restricted to Admin records as well.
        summaryQuery = summaryQuery.eq(
            "actor_role",
            ADMIN_ROLE
        );

        if (module) {
            summaryQuery = summaryQuery.eq(
                "module",
                module
            );
        }

        if (action) {
            summaryQuery = summaryQuery.eq(
                "action",
                action
            );
        }

        if (electionId) {
            summaryQuery = summaryQuery.eq(
                "election_id",
                electionId
            );
        }

        if (dateFrom) {
            summaryQuery = summaryQuery.gte(
                "created_at",
                `${dateFrom}T00:00:00`
            );
        }

        if (dateTo) {
            summaryQuery = summaryQuery.lte(
                "created_at",
                `${dateTo}T23:59:59`
            );
        }

        const {
            data: summaryLogs,
            error: summaryError,
        } = await summaryQuery;

        if (summaryError) {
            throw summaryError;
        }

        const summary =
            buildActivitySummary(
                summaryLogs || []
            );

        const total = count || 0;
        summary.total = total;
        summary.categories.all = total;

        return res.status(200).json({
            success: true,
            logs: data || [],
            summary,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(
                    total / limit
                ),
                hasNextPage:
                    page <
                    Math.ceil(total / limit),
                hasPreviousPage:
                    page > 1,
            },
            accessScope: {
                viewer: "admin",
                includes: [
                    "admin",
                ],
            },
            generatedAt:
                new Date().toISOString(),
        });
    } catch (error) {
        console.error(
            "❌ Admin audit logs error:",
            error
        );

        if (error.statusCode) {
            return res.status(
                error.statusCode
            ).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to load Admin monitoring logs.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? error.message
                    : undefined,
        });
    }
};

// =========================================================
// GET ONE ADMIN MONITORING LOG
// =========================================================

const getAdminAuditLogById = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const logId = String(
            req.params.id || ""
        ).trim();

        if (!logId) {
            return res.status(400).json({
                success: false,
                message:
                    "Audit log ID is required.",
            });
        }

        const {
            data,
            error,
        } = await supabase
            .from("audit_logs")
            .select(AUDIT_LOG_FIELDS)
            .eq("id", logId)
            .eq("actor_role", ADMIN_ROLE)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message:
                    "Audit log not found.",
            });
        }

        return res.status(200).json({
            success: true,
            log: data,
        });
    } catch (error) {
        console.error(
            "❌ Admin audit log detail error:",
            error
        );

        if (error.statusCode) {
            return res.status(
                error.statusCode
            ).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to load audit log details.",
        });
    }
};

module.exports = {
    getAdminAuditLogs,
    getAdminAuditLogById,
};
