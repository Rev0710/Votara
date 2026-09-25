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
// RESOLVE AUDIT LOG RELATED RECORDS
// =========================================================
// This keeps UUIDs in the audit database while returning
// human-readable names to the Activity Details modal.
//
// Example:
//
// election_id
//     -> Election title
//
// target_id + target_type = candidate
//     -> Candidate name
//     -> Position name
//     -> Party list name
//
// target_id + target_type = party_list
//     -> Party list name
//
// target_id + target_type = election
//     -> Election title
//
// target_id + target_type = position
//     -> Position name
// =========================================================

const resolveAuditLogRelations = async (log) => {

    const related = {
        electionName: null,
        targetName: null,
        positionName: null,
        partyListName: null,
    };

    try {

        // -------------------------------------------------
        // RELATED ELECTION
        // -------------------------------------------------

        if (log?.election_id) {

            const {
                data: election,
                error: electionError,
            } = await supabase
                .from("elections")
                .select(
                    "id, title"
                )
                .eq(
                    "id",
                    log.election_id
                )
                .maybeSingle();

            if (
                !electionError &&
                election
            ) {
                related.electionName =
                    election.title ||
                    null;
            }
        }


        // -------------------------------------------------
        // TARGET
        // -------------------------------------------------

        const targetType =
            String(
                log?.target_type ||
                ""
            ).toLowerCase();


        if (log?.target_id) {

            // =================================================
            // CANDIDATE
            // =================================================

            if (
                targetType === "candidate" ||
                String(
                    log?.module ||
                    ""
                )
                    .toLowerCase()
                    .includes(
                        "candidate"
                    )
            ) {

                const {
                    data: candidate,
                    error: candidateError,
                } = await supabase
                    .from("candidates")
                    .select(`
                        id,
                        full_name,
                        position_id,
                        party_list_id
                    `)
                    .eq(
                        "id",
                        log.target_id
                    )
                    .maybeSingle();


                if (
                    !candidateError &&
                    candidate
                ) {

                    // Candidate name
                    related.targetName =
                        candidate.full_name ||
                        null;


                    // -------------------------------------------------
                    // POSITION
                    // -------------------------------------------------

                    if (
                        candidate.position_id
                    ) {

                        const {
                            data: position,
                            error: positionError,
                        } = await supabase
                            .from("positions")
                            .select(
                                "id, name"
                            )
                            .eq(
                                "id",
                                candidate.position_id
                            )
                            .maybeSingle();


                        if (
                            !positionError &&
                            position
                        ) {

                            related.positionName =
                                position.name ||
                                null;
                        }
                    }


                    // -------------------------------------------------
                    // PARTY LIST
                    // -------------------------------------------------

                    if (
                        candidate.party_list_id
                    ) {

                        const {
                            data: partyList,
                            error: partyListError,
                        } = await supabase
                            .from("party_lists")
                            .select(
                                "id, name"
                            )
                            .eq(
                                "id",
                                candidate.party_list_id
                            )
                            .maybeSingle();


                        if (
                            !partyListError &&
                            partyList
                        ) {

                            related.partyListName =
                                partyList.name ||
                                null;
                        }
                    }
                }
            }


            // =================================================
            // PARTY LIST
            // =================================================

            else if (
                targetType === "party_list" ||
                targetType === "partylist"
            ) {

                const {
                    data: partyList,
                    error: partyListError,
                } = await supabase
                    .from("party_lists")
                    .select(
                        "id, name"
                    )
                    .eq(
                        "id",
                        log.target_id
                    )
                    .maybeSingle();


                if (
                    !partyListError &&
                    partyList
                ) {

                    related.targetName =
                        partyList.name ||
                        null;

                    related.partyListName =
                        partyList.name ||
                        null;
                }
            }


            // =================================================
            // ELECTION
            // =================================================

            else if (
                targetType === "election"
            ) {

                const {
                    data: election,
                    error: electionError,
                } = await supabase
                    .from("elections")
                    .select(
                        "id, title"
                    )
                    .eq(
                        "id",
                        log.target_id
                    )
                    .maybeSingle();


                if (
                    !electionError &&
                    election
                ) {

                    related.targetName =
                        election.title ||
                        null;
                }
            }


            // =================================================
            // POSITION
            // =================================================

            else if (
                targetType === "position"
            ) {

                const {
                    data: position,
                    error: positionError,
                } = await supabase
                    .from("positions")
                    .select(
                        "id, name"
                    )
                    .eq(
                        "id",
                        log.target_id
                    )
                    .maybeSingle();


                if (
                    !positionError &&
                    position
                ) {

                    related.targetName =
                        position.name ||
                        null;

                    related.positionName =
                        position.name ||
                        null;
                }
            }
        }


        // =================================================
        // FALLBACK TO METADATA
        // =================================================
        //
        // Some older audit records may already contain
        // candidateName in metadata. Use it if the
        // candidate table lookup did not resolve the name.
        // =================================================

        if (
            !related.targetName &&
            log?.metadata?.candidateName
        ) {

            related.targetName =
                log.metadata.candidateName;
        }


        // -------------------------------------------------
        // FALLBACK: PARTY LIST FROM METADATA
        // -------------------------------------------------

        if (
            !related.partyListName &&
            log?.metadata?.partyListName
        ) {

            related.partyListName =
                log.metadata.partyListName;
        }


        // -------------------------------------------------
        // FALLBACK: POSITION FROM METADATA
        // -------------------------------------------------

        if (
            !related.positionName &&
            log?.metadata?.positionName
        ) {

            related.positionName =
                log.metadata.positionName;
        }


        return related;

    } catch (error) {

        console.error(
            "⚠️ Audit log relation lookup failed:",
            error?.message ||
                error
        );

        // Important:
        // Do NOT fail the Activity Details request just
        // because a related record could not be resolved.
        return related;
    }
};


// =========================================================
// GET AUDIT LOGS
// =========================================================

const getAuditLogs = async (req, res) => {

    try {

        const staff =
            await authenticateEB(req);


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
        // RESPONSE
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            logs:
                data || [],


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
            await authenticateEB(req);


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