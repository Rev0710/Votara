const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");

// =========================================================
// AUDIT LOGS CONTROLLER
// VOTARA ELECTORAL BOARD
// =========================================================


// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateEB = async (req) => {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        throw new Error(
            "Authentication token is required."
        );
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    if (
        !decoded ||
        decoded.role !== "electoral_board"
    ) {
        throw new Error(
            "Electoral Board access is required."
        );
    }

    if (!decoded.userId) {
        throw new Error(
            "Invalid Electoral Board account."
        );
    }

    const {
        data: staff,
        error
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
            "electoral_board"
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!staff) {
        throw new Error(
            "Electoral Board account not found."
        );
    }

    if (!staff.is_active) {
        throw new Error(
            "Electoral Board account is inactive."
        );
    }

    return staff;
};


// =========================================================
// GET AUDIT LOGS
// =========================================================

const getAuditLogs = async (req, res) => {
    try {

        const staff = await authenticateEB(req);

        // -------------------------------------------------
        // QUERY PARAMETERS
        // -------------------------------------------------

        const search =
            String(
                req.query.search || ""
            ).trim();

        const module =
            String(
                req.query.module || ""
            ).trim();

        const action =
            String(
                req.query.action || ""
            ).trim();

        const electionId =
            String(
                req.query.election_id ||
                req.query.electionId ||
                ""
            ).trim();

        const dateFrom =
            String(
                req.query.date_from ||
                req.query.dateFrom ||
                ""
            ).trim();

        const dateTo =
            String(
                req.query.date_to ||
                req.query.dateTo ||
                ""
            ).trim();

        let page =
            parseInt(
                req.query.page || "1",
                10
            );

        let limit =
            parseInt(
                req.query.limit || "20",
                10
            );

        // -------------------------------------------------
        // SANITIZE PAGINATION
        // -------------------------------------------------

        if (
            Number.isNaN(page) ||
            page < 1
        ) {
            page = 1;
        }

        if (
            Number.isNaN(limit) ||
            limit < 1
        ) {
            limit = 20;
        }

        // Maximum 100 records per request
        if (limit > 100) {
            limit = 100;
        }

        const from =
            (page - 1) * limit;

        const to =
            from + limit - 1;

        // -------------------------------------------------
        // BUILD QUERY
        // -------------------------------------------------

        let query = supabase
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
                ip_address,
                user_agent,
                created_at
            `, {
                count: "exact"
            })
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        // -------------------------------------------------
        // FILTER: MODULE
        // -------------------------------------------------

        if (module) {
            query = query.eq(
                "module",
                module
            );
        }

        // -------------------------------------------------
        // FILTER: ACTION
        // -------------------------------------------------

        if (action) {
            query = query.eq(
                "action",
                action
            );
        }

        // -------------------------------------------------
        // FILTER: ELECTION
        // -------------------------------------------------

        if (electionId) {
            query = query.eq(
                "election_id",
                electionId
            );
        }

        // -------------------------------------------------
        // FILTER: DATE FROM
        // -------------------------------------------------

        if (dateFrom) {
            query = query.gte(
                "created_at",
                `${dateFrom}T00:00:00`
            );
        }

        // -------------------------------------------------
        // FILTER: DATE TO
        // -------------------------------------------------

        if (dateTo) {
            query = query.lte(
                "created_at",
                `${dateTo}T23:59:59`
            );
        }

        // -------------------------------------------------
        // SEARCH
        // -------------------------------------------------
        //
        // Search actor name, email, description,
        // module and action.
        //
        // -------------------------------------------------

        if (search) {

            const escapedSearch =
                search
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

        // -------------------------------------------------
        // PAGINATION
        // -------------------------------------------------

        query = query.range(
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
        // TOTAL PAGES
        // -------------------------------------------------

        const total =
            count || 0;

        const totalPages =
            Math.ceil(
                total / limit
            );

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            logs: data || [],

            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNextPage:
                    page < totalPages,
                hasPreviousPage:
                    page > 1
            },

            filters: {
                search,
                module,
                action,
                electionId,
                dateFrom,
                dateTo
            },

            requestedBy: {
                id: staff.id,
                fullName: staff.full_name,
                email: staff.email,
                role: staff.role
            },

            generatedAt:
                new Date().toISOString()
        });

    } catch (error) {

        console.error(
            "❌ Audit Logs error:",
            error
        );

        // -------------------------------------------------
        // AUTHENTICATION ERRORS
        // -------------------------------------------------

        const authenticationMessages = [
            "Authentication token is required.",
            "Electoral Board access is required.",
            "Invalid Electoral Board account.",
            "Electoral Board account not found.",
            "Electoral Board account is inactive."
        ];

        if (
            authenticationMessages.includes(
                error.message
            )
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message
            });
        }

        // -------------------------------------------------
        // JWT ERRORS
        // -------------------------------------------------

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid or expired authentication token."
            });
        }

        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

        return res.status(500).json({
            success: false,
            message:
                "Unable to load audit logs.",
            error:
                error.message
        });
    }
};


// =========================================================
// GET SINGLE AUDIT LOG
// =========================================================

const getAuditLogById = async (req, res) => {
    try {

        const staff = await authenticateEB(req);

        const logId =
            String(
                req.params.id || ""
            ).trim();

        if (!logId) {
            return res.status(400).json({
                success: false,
                message:
                    "Audit log ID is required."
            });
        }

        // -------------------------------------------------
        // GET LOG
        // -------------------------------------------------

        const {
            data,
            error
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
                ip_address,
                user_agent,
                created_at
            `)
            .eq(
                "id",
                logId
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message:
                    "Audit log not found."
            });
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            log: data,

            requestedBy: {
                id: staff.id,
                fullName: staff.full_name,
                email: staff.email,
                role: staff.role
            },

            generatedAt:
                new Date().toISOString()
        });

    } catch (error) {

        console.error(
            "❌ Audit Log details error:",
            error
        );

        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                success: false,
                message:
                    "Invalid or expired authentication token."
            });
        }

        if (
            error.message ===
            "Authentication token is required." ||
            error.message ===
            "Electoral Board access is required." ||
            error.message ===
            "Invalid Electoral Board account." ||
            error.message ===
            "Electoral Board account not found." ||
            error.message ===
            "Electoral Board account is inactive."
        ) {
            return res.status(401).json({
                success: false,
                message:
                    error.message
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Unable to load audit log details.",
            error:
                error.message
        });
    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    getAuditLogs,
    getAuditLogById
};