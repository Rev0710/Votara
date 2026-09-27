const jwt = require("jsonwebtoken");

const supabase = require("../config/supabase");

// =========================================================
// AUDIT LOGS CONTROLLER
// VOTARA ELECTORAL BOARD
// =========================================================


// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateStaff = async (req) => {
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
        authHeader.split(" ")[1];

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch (error) {
        const authError = new Error(
            "Invalid or expired authentication token."
        );
        authError.statusCode = 401;
        throw authError;
    }

    if (
        !decoded ||
        decoded.role !== "electoral_board"
    ) {
        const error = new Error(
            "Electoral Board access is required."
        );
        error.statusCode = 403;
        throw error;
    }

    if (!decoded.userId) {
        const error = new Error(
            "Invalid staff account."
        );
        error.statusCode = 401;
        throw error;
    }

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
            is_active
        `)
        .eq("id", decoded.userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!staff) {
        const error = new Error(
            "Staff account not found."
        );
        error.statusCode = 401;
        throw error;
    }

    if (!staff.is_active) {
        const error = new Error(
            "Staff account is inactive."
        );
        error.statusCode = 403;
        throw error;
    }

    return staff;
};


// =========================================================
// GET AUDIT LOGS
// =========================================================

const getAuditLogs = async (req, res) => {

    try {

        const staff =
            await authenticateStaff(req);


        // -------------------------------------------------
        // QUERY PARAMETERS
        // -------------------------------------------------

        const search =
            String(
                req.query.search ||
                ""
            ).trim();


        const module =
            String(
                req.query.module ||
                ""
            ).trim();


        const action =
            String(
                req.query.action ||
                ""
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
                req.query.page ||
                "1",
                10
            );


        let limit =
            parseInt(
                req.query.limit ||
                "20",
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

        if (
            limit > 100
        ) {

            limit = 100;
        }


        const from =
            (page - 1) *
            limit;


        const to =
            from +
            limit -
            1;


        // -------------------------------------------------
        // BUILD QUERY
        // -------------------------------------------------

        let query =
            supabase
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
                        ascending:
                            false
                    }
                );


        // -------------------------------------------------
        // SECURITY SCOPE: EB LOGS ONLY
        // -------------------------------------------------
        //
        // This route belongs exclusively to the Electoral
        // Board. Admin monitoring uses /api/admin/audit-logs.
        // Therefore an EB account can never retrieve Admin
        // activity from this endpoint.
        //
        query = query.eq(
            "actor_role",
            "electoral_board"
        );


        // -------------------------------------------------
        // FILTER: MODULE
        // -------------------------------------------------

        if (module) {

            query =
                query.eq(
                    "module",
                    module
                );
        }


        // -------------------------------------------------
        // FILTER: ACTION
        // -------------------------------------------------

        if (action) {

            query =
                query.eq(
                    "action",
                    action
                );
        }


        // -------------------------------------------------
        // FILTER: ELECTION
        // -------------------------------------------------

        if (electionId) {

            query =
                query.eq(
                    "election_id",
                    electionId
                );
        }


        // -------------------------------------------------
        // FILTER: DATE FROM
        // -------------------------------------------------

        if (dateFrom) {

            query =
                query.gte(
                    "created_at",
                    `${dateFrom}T00:00:00`
                );
        }


        // -------------------------------------------------
        // FILTER: DATE TO
        // -------------------------------------------------

        if (dateTo) {

            query =
                query.lte(
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
                    .replace(
                        /,/g,
                        ""
                    )
                    .replace(
                        /\(/g,
                        ""
                    )
                    .replace(
                        /\)/g,
                        "" 
                    );


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
        // TOTAL PAGES
        // -------------------------------------------------

        const total =
            count || 0;


        const totalPages =
            Math.ceil(
                total /
                limit
            );


        // -------------------------------------------------
        // GLOBAL ACTIVITY SUMMARY
        // -------------------------------------------------
        //
        // The current page is paginated, but the summary is
        // calculated from the complete audit_logs table so
        // the Admin dashboard shows the real totals.
        //

        const {
            data: summaryLogs,
            error: summaryError,
        } = await supabase
            .from("audit_logs")
            .select(`
                action,
                module,
                actor_role
            `)
            .eq(
                "actor_role",
                "electoral_board"
            );

        if (summaryError) {
            throw summaryError;
        }

        const summary = {
            total: total || 0,

            categories: {
                all: total || 0,
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

        (summaryLogs || []).forEach((log) => {
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

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            logs:
                data || [],

            summary,

            pagination: {

                page,

                limit,

                total,

                totalPages,

                hasNextPage:
                    page <
                    totalPages,

                hasPreviousPage:
                    page >
                    1
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

                id:
                    staff.id,

                fullName:
                    staff.full_name,

                email:
                    staff.email,

                role:
                    staff.role
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

            "Administrator or Electoral Board access is required.",

            "Invalid staff account.",

            "Staff account not found.",

            "Staff account is inactive."
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
            error.name ===
                "JsonWebTokenError" ||

            error.name ===
                "TokenExpiredError"
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

const getAuditLogById = async (
    req,
    res
) => {

    try {

        const staff =
            await authenticateStaff(req);


        const logId =
            String(
                req.params.id ||
                ""
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
            .eq(
                "actor_role",
                "electoral_board"
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
        // RESOLVE RELATED RECORDS
        // -------------------------------------------------

        const related =
            await resolveAuditLogRelations(
                data
            );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------
        //
        // IMPORTANT:
        // The original audit log is still returned exactly
        // as stored in audit_logs.
        //
        // "related" is additional information for the
        // Activity Details UI.
        //
        // This means the actual audit trail remains intact.
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            log:
                data,

            related,


            requestedBy: {

                id:
                    staff.id,

                fullName:
                    staff.full_name,

                email:
                    staff.email,

                role:
                    staff.role
            },


            generatedAt:
                new Date().toISOString()
        });


    } catch (error) {

        console.error(
            "❌ Audit Log details error:",
            error
        );


        // -------------------------------------------------
        // JWT ERRORS
        // -------------------------------------------------

        if (
            error.name ===
                "JsonWebTokenError" ||

            error.name ===
                "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid or expired authentication token."
            });
        }


        // -------------------------------------------------
        // AUTHENTICATION ERRORS
        // -------------------------------------------------

        if (
            error.message ===
                "Authentication token is required." ||

            error.message ===
                "Administrator or Electoral Board access is required." ||

            error.message ===
                "Invalid staff account." ||

            error.message ===
                "Staff account not found." ||

            error.message ===
                "Staff account is inactive."
        ) {

            return res.status(401).json({

                success: false,

                message:
                    error.message
            });
        }


        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

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