const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const supabase = require("../config/supabase");

const STORAGE_BUCKET = "student-verification";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
];

const IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
];

// =========================================================
// KIOSK SESSION / OPERATION TIMING
// =========================================================

const KIOSK_INACTIVITY_WARNING_MS = 60 * 1000;
const KIOSK_INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000;
const KIOSK_OPERATION_STALE_MS = 2 * 60 * 1000;

const nowIso = () => new Date().toISOString();

const isOlderThan = (dateValue, milliseconds) => {
    if (!dateValue) return true;

    const timestamp = new Date(dateValue).getTime();

    if (Number.isNaN(timestamp)) {
        return true;
    }

    return Date.now() - timestamp >= milliseconds;
};

// =========================================================
// GENERAL HELPERS
// =========================================================

const isElectionClosed = (election) => {
    if (!election) return true;

    return [
        "closed",
        "completed",
        "cancelled",
        "canceled",
    ].includes(
        String(election.status || "").toLowerCase()
    );
};

const normalizeYearLevel = (value) => {
    const raw = String(value || "")
        .trim()
        .toLowerCase();

    if (
        raw === "1" ||
        raw === "1st" ||
        raw === "1st year"
    ) {
        return "1st Year";
    }

    if (
        raw === "2" ||
        raw === "2nd" ||
        raw === "2nd year"
    ) {
        return "2nd Year";
    }

    if (
        raw === "3" ||
        raw === "3rd" ||
        raw === "3rd year"
    ) {
        return "3rd Year";
    }

    if (
        raw === "4" ||
        raw === "4th" ||
        raw === "4th year"
    ) {
        return "4th Year";
    }

    return String(value || "").trim();
};

// =========================================================
// FILE HELPERS
// =========================================================

const parseDataUrl = (dataUrl) => {
    if (typeof dataUrl !== "string") {
        return null;
    }

    const match = dataUrl.match(
        /^data:([^;]+);base64,(.+)$/
    );

    if (!match) {
        return null;
    }

    return {
        mimeType: match[1],
        buffer: Buffer.from(match[2], "base64"),
    };
};

const getExtension = (mimeType) => {
    switch (mimeType) {
        case "image/jpeg":
            return "jpg";

        case "image/png":
            return "png";

        case "application/pdf":
            return "pdf";

        default:
            return "bin";
    }
};

const validateFile = (
    file,
    label,
    allowedTypes = DOCUMENT_TYPES
) => {
    if (!file?.data) {
        return {
            valid: false,
            message: `${label} is required.`,
        };
    }

    const parsed = parseDataUrl(file.data);

    if (
        !parsed ||
        !allowedTypes.includes(parsed.mimeType)
    ) {
        return {
            valid: false,
            message: `${label} has an invalid file type.`,
        };
    }

    if (parsed.buffer.length > MAX_FILE_SIZE) {
        return {
            valid: false,
            message: `${label} must be 5MB or smaller.`,
        };
    }

    return {
        valid: true,
        ...parsed,
    };
};

const uploadToStorage = async ({
    buffer,
    mimeType,
    path,
}) => {
    const {
        error,
    } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, buffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (error) {
        throw error;
    }

    return path;
};

// =========================================================
// STUDENT ACCOUNT HELPER
// =========================================================

const getStudentAccount = async (studentId) => {
    const {
        data,
        error,
    } = await supabase
        .from("student_accounts")
        .select(`
            id,
            student_id,
            email,
            must_change_password,
            account_status
        `)
        .eq("student_id", studentId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
};

// =========================================================
// PARTICIPATION
// =========================================================

const getParticipation = async (
    electionId,
    studentUuid
) => {
    const {
        data,
        error,
    } = await supabase
        .from("vote_participations")
        .select(`
            id,
            has_voted,
            voted_at
        `)
        .eq("election_id", electionId)
        .eq("student_id", studentUuid)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
};

// =========================================================
// YEAR ELIGIBILITY
// =========================================================

const ensureYearEligibility = async (
    electionId,
    yearLevel
) => {
    const normalized =
        normalizeYearLevel(yearLevel);

    // IMPORTANT:
    // 1st Year students are NOT eligible.
    if (
        ![
            "2nd Year",
            "3rd Year",
            "4th Year",
        ].includes(normalized)
    ) {
        throw new Error(
            "1st Year students are not eligible to vote in this election."
        );
    }

    const {
        data,
        error,
    } = await supabase
        .from("election_year_levels")
        .select("id, year_level")
        .eq("election_id", electionId)
        .eq("year_level", normalized)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error(
            `${normalized} students are not configured as eligible voters for this election.`
        );
    }

    return normalized;
};

// =========================================================
// KIOSK STUDENT TOKEN
// =========================================================

const createKioskStudentToken = ({
    student,
    session,
}) => {
    return jwt.sign(
        {
            id: student.id,

            studentId:
                student.student_id,

            role: "student",

            kiosk: true,

            kioskSessionId:
                session.id,

            electionId:
                session.election_id,

            kioskOperationId:
                session.kioskOperationId ||
                undefined,
        },

        process.env.JWT_SECRET,

        {
            expiresIn: "30m",
        }
    );
};

// =========================================================
// KIOSK OPERATION HELPERS
// =========================================================

const expireStaleOperations = async (
    sessionId
) => {
    if (!sessionId) return;

    const cutoff = new Date(
        Date.now() -
            KIOSK_OPERATION_STALE_MS
    ).toISOString();

    const {
        error,
    } = await supabase
        .from("kiosk_operations")
        .update({
            operation_status: "expired",
            ended_at: nowIso(),
            updated_at: nowIso(),
        })
        .eq(
            "kiosk_session_id",
            sessionId
        )
        .eq(
            "operation_status",
            "active"
        )
        .lt(
            "last_activity_at",
            cutoff
        );

    if (error) {
        throw error;
    }
};

const getActiveOperationCount = async (
    sessionId
) => {
    await expireStaleOperations(
        sessionId
    );

    const {
        count,
        error,
    } = await supabase
        .from("kiosk_operations")
        .select("id", {
            count: "exact",
            head: true,
        })
        .eq(
            "kiosk_session_id",
            sessionId
        )
        .eq(
            "operation_status",
            "active"
        );

    if (error) {
        throw error;
    }

    return count || 0;
};

const touchKioskSession = async (
    sessionId
) => {
    const {
        error,
    } = await supabase
        .from("kiosk_sessions")
        .update({
            last_activity_at: nowIso(),
            updated_at: nowIso(),
        })
        .eq("id", sessionId)
        .eq(
            "session_status",
            "active"
        );

    if (error) {
        throw error;
    }
};

const expireInactiveSessionIfNeeded =
    async (session) => {
        if (
            !session ||
            session.session_status !==
                "active"
        ) {
            return {
                session,
                expired: false,
                activeOperations: 0,
            };
        }

        const activeOperations =
            await getActiveOperationCount(
                session.id
            );

        // Active student work keeps the
        // parent kiosk session alive.
        if (activeOperations > 0) {
            return {
                session,
                expired: false,
                activeOperations,
            };
        }

        if (
            isOlderThan(
                session.last_activity_at,
                KIOSK_INACTIVITY_TIMEOUT_MS
            )
        ) {
            const {
                data: expiredSession,
                error,
            } = await supabase
                .from("kiosk_sessions")
                .update({
                    session_status:
                        "expired",

                    ended_at:
                        nowIso(),

                    updated_at:
                        nowIso(),
                })
                .eq(
                    "id",
                    session.id
                )
                .eq(
                    "session_status",
                    "active"
                )
                .select(`
                    id,
                    election_id,
                    eb_member_id,
                    session_status,
                    started_at,
                    ended_at,
                    last_activity_at,
                    students_served,
                    created_at,
                    updated_at,
                    elections (
                        id,
                        title,
                        election_date,
                        start_time,
                        end_time,
                        status,
                        is_published
                    )
                `)
                .maybeSingle();

            if (error) {
                throw error;
            }

            return {
                session:
                    expiredSession ||
                    session,

                expired: true,

                activeOperations: 0,
            };
        }

        return {
            session,
            expired: false,
            activeOperations: 0,
        };
    };

// =========================================================
// SHARED ACTIVE SESSION
// =========================================================

const getActiveSessionForEB = async (
    _ebMemberId,
    sessionId
) => {
    let query = supabase
        .from("kiosk_sessions")
        .select(`
            id,
            election_id,
            eb_member_id,
            session_status,
            started_at,
            ended_at,
            last_activity_at,
            students_served,
            created_at,
            updated_at,
            elections (
                id,
                title,
                description,
                election_date,
                start_time,
                end_time,
                status,
                is_published
            ),
            staff_users (
                id,
                full_name,
                email,
                role
            )
        `)
        .eq(
            "session_status",
            "active"
        );

    if (sessionId) {
        query =
            query.eq(
                "id",
                sessionId
            );
    } else {
        query =
            query
                .order(
                    "started_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1);
    }

    const {
        data,
        error,
    } = await query.maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        return null;
    }

    const sessionState =
        await expireInactiveSessionIfNeeded(
            data
        );

    if (sessionState.expired) {
        return null;
    }

    return {
        ...sessionState.session,

        active_operations:
            sessionState.activeOperations,

        inactivity_warning:
            sessionState.activeOperations ===
                0 &&
            isOlderThan(
                sessionState
                    .session
                    ?.last_activity_at,

                KIOSK_INACTIVITY_WARNING_MS
            ),

        inactivity_timeout_ms:
            KIOSK_INACTIVITY_TIMEOUT_MS,

        inactivity_warning_ms:
            KIOSK_INACTIVITY_WARNING_MS,
    };
};

// =========================================================
// VALIDATE SESSION + ELECTION
// =========================================================

const validateSessionElection = async (
    _ebMemberId,
    sessionId,
    electionId
) => {
    const session =
        await getActiveSessionForEB(
            _ebMemberId,
            sessionId
        );

    if (!session) {
        throw new Error(
            "There is no active kiosk session."
        );
    }

    if (
        electionId &&
        session.election_id !==
            electionId
    ) {
        throw new Error(
            "The student is not being processed for the active kiosk election."
        );
    }

    if (
        isElectionClosed(
            session.elections
        ) ||
        session.elections
            ?.is_published !== true
    ) {
        throw new Error(
            "The election is not currently available for kiosk voting."
        );
    }

    // =====================================================
    // IMPORTANT FIX
    // ElectionManagement uses "open", NOT "active".
    // =====================================================

    if (
        String(
            session.elections.status
        ).toLowerCase() !==
        "open"
    ) {
        throw new Error(
            "The election is not currently open for voting."
        );
    }

    return session;
};

// =========================================================
// CREATE KIOSK OPERATION
// =========================================================

const createKioskOperation = async ({
    sessionId,
    ebMemberId,
    operationType,
}) => {
    if (
        ![
            "voting",
            "registration",
        ].includes(operationType)
    ) {
        throw new Error(
            "Invalid kiosk operation type."
        );
    }

    const {
        data: operation,
        error,
    } = await supabase
        .from("kiosk_operations")
        .insert({
            kiosk_session_id:
                sessionId,

            eb_member_id:
                ebMemberId,

            operation_type:
                operationType,

            operation_status:
                "active",

            started_at:
                nowIso(),

            last_activity_at:
                nowIso(),
        })
        .select(`
            id,
            kiosk_session_id,
            eb_member_id,
            operation_type,
            operation_status,
            started_at,
            last_activity_at,
            ended_at,
            created_at,
            updated_at
        `)
        .single();

    if (error) {
        throw error;
    }

    await touchKioskSession(
        sessionId
    );

    return operation;
};

// =========================================================
// GET KIOSK OPERATION
// =========================================================

const getKioskOperation = async (
    operationId
) => {
    if (!operationId) {
        return null;
    }

    const {
        data,
        error,
    } = await supabase
        .from("kiosk_operations")
        .select(`
            id,
            kiosk_session_id,
            eb_member_id,
            operation_type,
            operation_status,
            started_at,
            last_activity_at,
            ended_at,
            created_at,
            updated_at,
            kiosk_sessions (
                id,
                election_id,
                session_status,
                students_served,
                elections (
                    id,
                    title,
                    status,
                    is_published
                )
            )
        `)
        .eq(
            "id",
            operationId
        )
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
};

// =========================================================
// COMPLETE KIOSK OPERATION
// =========================================================

const completeKioskOperation =
    async (
        operationId,
        incrementStudentServed = true
    ) => {
        const operation =
            await getKioskOperation(
                operationId
            );

        if (!operation) {
            return null;
        }

        if (
            operation.operation_status !==
            "active"
        ) {
            return operation;
        }

        const {
            data: updatedOperation,
            error,
        } = await supabase
            .from("kiosk_operations")
            .update({
                operation_status:
                    "completed",

                ended_at:
                    nowIso(),

                last_activity_at:
                    nowIso(),

                updated_at:
                    nowIso(),
            })
            .eq(
                "id",
                operationId
            )
            .eq(
                "operation_status",
                "active"
            )
            .select(`
                id,
                kiosk_session_id,
                eb_member_id,
                operation_type,
                operation_status,
                started_at,
                last_activity_at,
                ended_at,
                created_at,
                updated_at
            `)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (
            incrementStudentServed &&
            updatedOperation
        ) {
            const {
                data: session,
                error:
                    sessionError,
            } = await supabase
                .from(
                    "kiosk_sessions"
                )
                .select(
                    "students_served"
                )
                .eq(
                    "id",
                    operation.kiosk_session_id
                )
                .maybeSingle();

            if (sessionError) {
                throw sessionError;
            }

            await supabase
                .from(
                    "kiosk_sessions"
                )
                .update({
                    students_served:
                        Number(
                            session
                                ?.students_served ||
                                0
                        ) + 1,

                    last_activity_at:
                        nowIso(),

                    updated_at:
                        nowIso(),
                })
                .eq(
                    "id",
                    operation.kiosk_session_id
                );
        } else {
            await touchKioskSession(
                operation.kiosk_session_id
            );
        }

        return (
            updatedOperation ||
            operation
        );
    };

// =========================================================
// CANCEL KIOSK OPERATION
// =========================================================

const cancelKioskOperation =
    async (operationId) => {
        const {
            data,
            error,
        } = await supabase
            .from(
                "kiosk_operations"
            )
            .update({
                operation_status:
                    "cancelled",

                ended_at:
                    nowIso(),

                last_activity_at:
                    nowIso(),

                updated_at:
                    nowIso(),
            })
            .eq(
                "id",
                operationId
            )
            .eq(
                "operation_status",
                "active"
            )
            .select(`
                id,
                kiosk_session_id,
                eb_member_id,
                operation_type,
                operation_status,
                started_at,
                last_activity_at,
                ended_at,
                created_at,
                updated_at
            `)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data;
    };

// =========================================================
// GET AVAILABLE ELECTIONS
// =========================================================

const getKioskElections = async (
    req,
    res
) => {
    try {
        const {
            data,
            error,
        } = await supabase
            .from("elections")
            .select(`
                id,
                title,
                description,
                election_date,
                start_time,
                end_time,
                status,
                is_published
            `)
            .order(
                "election_date",
                {
                    ascending: false,
                }
            );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            elections: data || [],
        });
    } catch (error) {
        console.error(
            "❌ Get kiosk elections error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load elections.",
        });
    }
};

// =========================================================
// ACTIVE KIOSK SESSION
// =========================================================

const getActiveKioskSession = async (
    req,
    res
) => {
    try {
        const data =
            await getActiveSessionForEB(
                req.user.userId
            );

        if (!data) {
            return res.json({
                success: true,
                session: null,
            });
        }

        if (
            isElectionClosed(
                data.elections
            )
        ) {
            await supabase
                .from(
                    "kiosk_sessions"
                )
                .update({
                    session_status:
                        "expired",

                    ended_at:
                        nowIso(),

                    updated_at:
                        nowIso(),
                })
                .eq(
                    "id",
                    data.id
                )
                .eq(
                    "session_status",
                    "active"
                );

            return res.json({
                success: true,
                session: null,
                expired: true,
                message:
                    "The kiosk session expired because the election is closed.",
            });
        }

        return res.json({
            success: true,
            session: data,
        });
    } catch (error) {
        console.error(
            "❌ Get active kiosk session error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load kiosk session.",
        });
    }
};

// =========================================================
// SESSION HISTORY
// =========================================================

const getKioskSessions = async (
    req,
    res
) => {
    try {
        const {
            electionId,
        } = req.query;

        let query = supabase
            .from(
                "kiosk_sessions"
            )
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                started_at,
                ended_at,
                last_activity_at,
                students_served,
                created_at,
                updated_at,
                elections (
                    id,
                    title,
                    election_date,
                    status
                ),
                staff_users (
                    id,
                    full_name,
                    email,
                    role
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

        if (electionId) {
            query =
                query.eq(
                    "election_id",
                    electionId
                );
        }

        const {
            data,
            error,
        } = await query;

        if (error) {
            throw error;
        }

        const visibleSessions =
            (data || []).filter(
                (session) =>
                    !(
                        session.session_status ===
                            "expired" &&
                        Number(
                            session
                                .students_served ||
                                0
                        ) === 0
                    )
            );

        return res.json({
            success: true,
            sessions:
                visibleSessions,
        });
    } catch (error) {
        console.error(
            "❌ Get kiosk sessions error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load kiosk session history.",
        });
    }
};

// =========================================================
// START SHARED KIOSK SESSION
// =========================================================

const startKioskSession = async (
    req,
    res
) => {
    try {
        const ebMemberId =
            req.user.userId;

        const {
            electionId,
        } = req.body;

        if (!electionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Election is required.",
            });
        }

        const {
            data: election,
            error:
                electionError,
        } = await supabase
            .from("elections")
            .select(`
                id,
                title,
                description,
                election_date,
                start_time,
                end_time,
                status,
                is_published
            `)
            .eq(
                "id",
                electionId
            )
            .maybeSingle();

        if (electionError) {
            throw electionError;
        }

        if (!election) {
            return res.status(404).json({
                success: false,
                message:
                    "Election not found.",
            });
        }

        if (
            isElectionClosed(
                election
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This election is already closed.",
            });
        }

        if (
            election.is_published !==
            true
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Publish the election before opening the student kiosk.",
            });
        }

        // =================================================
        // IMPORTANT FIX:
        // VOTARA uses "open", NOT "active".
        // =================================================

        if (
            String(
                election.status
            ).toLowerCase() !==
            "open"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "The election is not currently open for voting.",
            });
        }

        // Clean up stale operations first.
        const {
            data: existingSessions,
            error:
                existingError,
        } = await supabase
            .from(
                "kiosk_sessions"
            )
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                started_at,
                last_activity_at,
                students_served,
                staff_users (
                    id,
                    full_name,
                    email,
                    role
                )
            `)
            .eq(
                "election_id",
                electionId
            )
            .eq(
                "session_status",
                "active"
            )
            .limit(1);

        if (existingError) {
            throw existingError;
        }

        const existingSession =
            existingSessions?.[0] ||
            null;

        if (existingSession) {
            return res.status(409).json({
                success: false,
                code:
                    "ACTIVE_SESSION_EXISTS",

                message:
                    "An active kiosk session already exists for this election. Open the existing student kiosk instead of starting another session.",

                session:
                    existingSession,
            });
        }

        const now = nowIso();

        const {
            data: session,
            error:
                createError,
        } = await supabase
            .from(
                "kiosk_sessions"
            )
            .insert({
                election_id:
                    electionId,

                eb_member_id:
                    ebMemberId,

                session_status:
                    "active",

                started_at:
                    now,

                last_activity_at:
                    now,

                students_served:
                    0,
            })
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                started_at,
                ended_at,
                last_activity_at,
                students_served,
                created_at,
                updated_at,
                elections (
                    id,
                    title,
                    description,
                    election_date,
                    start_time,
                    end_time,
                    status,
                    is_published
                ),
                staff_users (
                    id,
                    full_name,
                    email,
                    role
                )
            `)
            .single();

        if (createError) {
            if (
                createError.code ===
                "23505"
            ) {
                return res.status(409).json({
                    success: false,
                    code:
                        "ACTIVE_SESSION_EXISTS",

                    message:
                        "An active kiosk session already exists for this election. Open the existing student kiosk instead.",
                });
            }

            throw createError;
        }

        return res.status(201).json({
            success: true,

            message:
                "Shared kiosk session started successfully.",

            session: {
                ...session,

                active_operations:
                    0,

                inactivity_warning:
                    false,

                inactivity_timeout_ms:
                    KIOSK_INACTIVITY_TIMEOUT_MS,

                inactivity_warning_ms:
                    KIOSK_INACTIVITY_WARNING_MS,
            },
        });
    } catch (error) {
        console.error(
            "❌ Start kiosk session error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to start kiosk session.",
        });
    }
};

// =========================================================
// SESSION HEARTBEAT
// =========================================================

const heartbeatKioskSession = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const increment =
            Number(
                req.body
                    ?.studentsServedIncrement ||
                    0
            );

        if (
            !Number.isInteger(
                increment
            ) ||
            increment < 0 ||
            increment > 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid student activity value.",
            });
        }

        const {
            data: session,
            error:
                sessionError,
        } = await supabase
            .from(
                "kiosk_sessions"
            )
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                students_served,
                last_activity_at,
                elections (
                    id,
                    title,
                    status,
                    is_published
                )
            `)
            .eq(
                "id",
                id
            )
            .maybeSingle();

        if (sessionError) {
            throw sessionError;
        }

        if (!session) {
            return res.status(404).json({
                success: false,
                message:
                    "Kiosk session not found.",
            });
        }

        if (
            session.session_status !==
            "active"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This kiosk session is no longer active.",
            });
        }

        if (
            isElectionClosed(
                session.elections
            ) ||
            session.elections
                ?.is_published !== true ||
            String(
                session.elections
                    ?.status || ""
            ).toLowerCase() !==
                "open"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "The election is not currently open for voting.",
            });
        }

        const {
            data: updatedSession,
            error,
        } = await supabase
            .from(
                "kiosk_sessions"
            )
            .update({
                last_activity_at:
                    nowIso(),

                students_served:
                    Number(
                        session
                            .students_served ||
                            0
                    ) + increment,

                updated_at:
                    nowIso(),
            })
            .eq(
                "id",
                id
            )
            .eq(
                "session_status",
                "active"
            )
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                started_at,
                ended_at,
                last_activity_at,
                students_served,
                created_at,
                updated_at
            `)
            .single();

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            session:
                updatedSession,
        });
    } catch (error) {
        console.error(
            "❌ Kiosk heartbeat error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update kiosk activity.",
        });
    }
};

// =========================================================
// START KIOSK OPERATION
// =========================================================

const startKioskOperation = async (
    req,
    res
) => {
    try {
        const {
            sessionId,
            operationType,
        } = req.body;

        if (
            !sessionId ||
            !operationType
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Kiosk session and operation type are required.",
            });
        }

        const session =
            await validateSessionElection(
                req.user.userId,
                sessionId
            );

        const activeOperations =
            await getActiveOperationCount(
                session.id
            );

        if (
            activeOperations > 0
        ) {
            return res.status(409).json({
                success: false,
                code:
                    "SESSION_IN_USE",

                message:
                    "Please wait until the other finishes. A student is currently being assisted or is voting.",
            });
        }

        const operation =
            await createKioskOperation({
                sessionId:
                    session.id,

                ebMemberId:
                    req.user.userId,

                operationType,
            });

        return res.status(201).json({
            success: true,
            operation,
        });
    } catch (error) {
        console.error(
            "❌ Start kiosk operation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to start kiosk operation.",
        });
    }
};

// =========================================================
// OPERATION HEARTBEAT
// =========================================================

const heartbeatKioskOperation =
    async (req, res) => {
        try {
            const {
                id,
            } = req.params;

            const operation =
                await getKioskOperation(
                    id
                );

            if (!operation) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Kiosk operation not found.",
                });
            }

            if (
                operation.operation_status !==
                "active"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "This kiosk operation is no longer active.",
                });
            }

            const session =
                operation.kiosk_sessions;

            if (
                !session ||
                session.session_status !==
                    "active"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The kiosk session is no longer active.",
                });
            }

            if (
                isElectionClosed(
                    session.elections
                ) ||
                session.elections
                    ?.is_published !==
                    true ||
                String(
                    session.elections
                        ?.status ||
                        ""
                ).toLowerCase() !==
                    "open"
            ) {
                await cancelKioskOperation(
                    id
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "The election is no longer open. This kiosk operation has ended.",
                });
            }

            const {
                data:
                    updatedOperation,
                error,
            } = await supabase
                .from(
                    "kiosk_operations"
                )
                .update({
                    last_activity_at:
                        nowIso(),

                    updated_at:
                        nowIso(),
                })
                .eq(
                    "id",
                    id
                )
                .eq(
                    "operation_status",
                    "active"
                )
                .select(`
                    id,
                    kiosk_session_id,
                    eb_member_id,
                    operation_type,
                    operation_status,
                    started_at,
                    last_activity_at,
                    ended_at,
                    created_at,
                    updated_at
                `)
                .single();

            if (error) {
                throw error;
            }

            await touchKioskSession(
                operation.kiosk_session_id
            );

            return res.json({
                success: true,
                operation:
                    updatedOperation,
            });
        } catch (error) {
            console.error(
                "❌ Kiosk operation heartbeat error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update kiosk operation activity.",
            });
        }
    };

// =========================================================
// COMPLETE OPERATION
// =========================================================

const finishKioskOperation = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const incrementStudentServed =
            req.body
                ?.incrementStudentServed !==
            false;

        const operation =
            await completeKioskOperation(
                id,
                incrementStudentServed
            );

        if (!operation) {
            return res.status(404).json({
                success: false,
                message:
                    "Kiosk operation not found.",
            });
        }

        return res.json({
            success: true,
            operation,
        });
    } catch (error) {
        console.error(
            "❌ Complete kiosk operation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to complete kiosk operation.",
        });
    }
};

// =========================================================
// CANCEL OPERATION
// =========================================================

const abortKioskOperation = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const operation =
            await cancelKioskOperation(
                id
            );

        if (!operation) {
            return res.status(404).json({
                success: false,
                message:
                    "Kiosk operation not found.",
            });
        }

        return res.json({
            success: true,
            operation,
        });
    } catch (error) {
        console.error(
            "❌ Cancel kiosk operation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to cancel kiosk operation.",
        });
    }
};

// =========================================================
// VERIFY STUDENT
// =========================================================

const verifyKioskStudent = async (
    req,
    res
) => {
    try {
        const {
            sessionId,
            studentId,
        } = req.body;

        const cleanStudentId =
            String(
                studentId || ""
            ).trim();

        if (
            !sessionId ||
            !cleanStudentId
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Kiosk session and Student ID are required.",
            });
        }

        const session =
            await validateSessionElection(
                req.user.userId,
                sessionId
            );

        const {
            data: student,
            error:
                studentError,
        } = await supabase
            .from("students")
            .select(`
                id,
                student_id,
                full_name,
                year_level,
                enrollment_status
            `)
            .eq(
                "student_id",
                cleanStudentId
            )
            .maybeSingle();

        if (studentError) {
            throw studentError;
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                code:
                    "STUDENT_NOT_FOUND",

                message:
                    "Student ID was not found in the official student roster.",

                canRegister: true,
            });
        }

        let yearLevel;

        try {
            yearLevel =
                await ensureYearEligibility(
                    session.election_id,
                    student.year_level
                );
        } catch (
            eligibilityError
        ) {
            return res.status(403).json({
                success: false,
                code:
                    "NOT_ELIGIBLE",

                message:
                    eligibilityError.message,

                student: {
                    id:
                        student.id,

                    studentId:
                        student.student_id,

                    fullName:
                        student.full_name,

                    yearLevel:
                        student.year_level,
                },
            });
        }

        const account =
            await getStudentAccount(
                student.student_id
            );

        const participation =
            await getParticipation(
                session.election_id,
                student.id
            );

        if (
            participation?.has_voted
        ) {
            return res.status(409).json({
                success: false,
                code:
                    "ALREADY_VOTED",

                message:
                    "This student has already voted in this election.",

                student: {
                    id:
                        student.id,

                    studentId:
                        student.student_id,

                    fullName:
                        student.full_name,

                    yearLevel,
                },
            });
        }

        return res.json({
            success: true,
            eligible: true,

            accountExists:
                Boolean(account),

            student: {
                id:
                    student.id,

                studentId:
                    student.student_id,

                fullName:
                    student.full_name,

                yearLevel,

                enrollmentStatus:
                    student
                        .enrollment_status ||
                    null,
            },

            election: {
                id:
                    session.election_id,

                title:
                    session
                        .elections
                        .title,
            },
        });
    } catch (error) {
        console.error(
            "❌ Verify kiosk student error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to verify student.",
        });
    }
};

// =========================================================
// AUTHORIZE STUDENT FOR VOTING
// =========================================================

const authorizeKioskStudent =
    async (req, res) => {
        try {
            const {
                sessionId,
                studentId,
            } = req.body;

            const cleanStudentId =
                String(
                    studentId || ""
                ).trim();

            if (
                !sessionId ||
                !cleanStudentId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Kiosk session and Student ID are required.",
                });
            }

            const session =
                await validateSessionElection(
                    req.user.userId,
                    sessionId
                );

            const {
                data: student,
                error:
                    studentError,
            } = await supabase
                .from("students")
                .select(`
                    id,
                    student_id,
                    full_name,
                    year_level
                `)
                .eq(
                    "student_id",
                    cleanStudentId
                )
                .maybeSingle();

            if (studentError) {
                throw studentError;
            }

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student was not found.",
                });
            }

            const yearLevel =
                await ensureYearEligibility(
                    session.election_id,
                    student.year_level
                );

            const account =
                await getStudentAccount(
                    student.student_id
                );

            if (!account) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This student does not have a VOTARA account yet. Complete assisted registration first.",
                });
            }

            const participation =
                await getParticipation(
                    session.election_id,
                    student.id
                );

            if (
                participation?.has_voted
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This student has already voted in this election.",
                });
            }

            const activeOperations =
                await getActiveOperationCount(
                    session.id
                );

            if (
                activeOperations > 0
            ) {
                return res.status(409).json({
                    success: false,
                    code:
                        "SESSION_IN_USE",

                    message:
                        "Please wait until the other finishes. A student is currently being assisted or is voting.",
                });
            }

            const operation =
                await createKioskOperation({
                    sessionId:
                        session.id,

                    ebMemberId:
                        req.user.userId,

                    operationType:
                        "voting",
                });

            const token =
                createKioskStudentToken({
                    student,

                    session: {
                        ...session,

                        kioskOperationId:
                            operation.id,
                    },
                });

            return res.json({
                success: true,

                token,

                operationId:
                    operation.id,

                student: {
                    id:
                        student.id,

                    studentId:
                        student.student_id,

                    fullName:
                        student.full_name,

                    yearLevel,
                },

                electionId:
                    session.election_id,

                sessionId:
                    session.id,
            });
        } catch (error) {
            console.error(
                "❌ Authorize kiosk student error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to authorize student.",
            });
        }
    };

// =========================================================
// SUBMIT ASSISTED REGISTRATION
// =========================================================

const submitKioskRegistration =
    async (req, res) => {
        let operation = null;

        try {
            const {
                sessionId,
                studentId,
                fullName,
                yearLevel,
                email,

                studentIdFront,
                studentIdBack,
                enrollmentProof,
                selfie,

                supportingDocument,
            } = req.body;

            const cleanStudentId =
                String(
                    studentId || ""
                ).trim();

            const cleanName =
                String(
                    fullName || ""
                ).trim();

            if (
                !sessionId ||
                !cleanStudentId ||
                !cleanName ||
                !yearLevel
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Kiosk session, Student ID, full name, and year level are required.",
                });
            }

            const session =
                await validateSessionElection(
                    req.user.userId,
                    sessionId
                );

            const normalizedYear =
                await ensureYearEligibility(
                    session.election_id,
                    yearLevel
                );

            const front =
                validateFile(
                    studentIdFront,
                    "School ID front"
                );

            if (!front.valid) {
                return res.status(400).json({
                    success: false,
                    message:
                        front.message,
                });
            }

            const back =
                validateFile(
                    studentIdBack,
                    "School ID back"
                );

            if (!back.valid) {
                return res.status(400).json({
                    success: false,
                    message:
                        back.message,
                });
            }

            const enrollment =
                validateFile(
                    enrollmentProof,
                    "Enrollment proof"
                );

            if (!enrollment.valid) {
                return res.status(400).json({
                    success: false,
                    message:
                        enrollment.message,
                });
            }

            const selfieValidation =
                validateFile(
                    selfie,
                    "Selfie",
                    IMAGE_TYPES
                );

            if (
                !selfieValidation.valid
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        selfieValidation.message,
                });
            }

            const {
                data: existingStudent,
                error:
                    existingStudentError,
            } = await supabase
                .from("students")
                .select(`
                    id,
                    student_id,
                    full_name,
                    year_level
                `)
                .eq(
                    "student_id",
                    cleanStudentId
                )
                .maybeSingle();

            if (existingStudentError) {
                throw existingStudentError;
            }

            const {
                data: existingAccount,
                error:
                    accountError,
            } = await supabase
                .from(
                    "student_accounts"
                )
                .select("id")
                .eq(
                    "student_id",
                    cleanStudentId
                )
                .maybeSingle();

            if (accountError) {
                throw accountError;
            }

            if (existingAccount) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This student already has an account. Use Student ID verification instead.",
                });
            }

            const {
                data:
                    existingApplication,
                error:
                    applicationLookupError,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .select(`
                    id,
                    application_status
                `)
                .eq(
                    "student_id",
                    cleanStudentId
                )
                .order(
                    "created_at",
                    {
                        ascending: false,
                    }
                )
                .limit(1)
                .maybeSingle();

            if (
                applicationLookupError
            ) {
                throw applicationLookupError;
            }

            if (
                existingApplication &&
                [
                    "pending_review",
                    "approved",
                ].includes(
                    existingApplication
                        .application_status
                )
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This student's registration is already under review or approved.",
                });
            }

            // A student not found in the official
            // roster is treated as a late enrollee.
            const registrationType =
                existingStudent
                    ? "normal"
                    : "late_enrollee";

            let registration;

            if (
                existingApplication
            ) {
                const {
                    data,
                    error,
                } = await supabase
                    .from(
                        "registration_applications"
                    )
                    .update({
                        email: email
                            ? String(
                                  email
                              ).trim()
                            : null,

                        full_name:
                            cleanName,

                        year_level:
                            normalizedYear,

                        registration_type:
                            registrationType,

                        registration_source:
                            "kiosk",
                            
                        application_status:
                            "pending_review",

                        submitted_at:
                            nowIso(),

                        updated_at:
                            nowIso(),
                    })
                    .eq(
                        "id",
                        existingApplication.id
                    )
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                registration =
                    data;
            } else {
                const {
                    data,
                    error,
                } = await supabase
                    .from(
                        "registration_applications"
                    )
                    .insert({
                        student_id:
                            cleanStudentId,

                        registration_type:
                            registrationType,

                        application_status:
                            "pending_review",

                        email: email
                            ? String(
                                  email
                              ).trim()
                            : null,

                        full_name:
                            cleanName,

                        year_level:
                            normalizedYear,

                        submitted_at:
                            nowIso(),
                    })
                    .select()
                    .single();

                if (error) {
                    throw error;
                }

                registration =
                    data;
            }

            const activeOperations =
                await getActiveOperationCount(
                    session.id
                );

            if (
                activeOperations > 0
            ) {
                return res.status(409).json({
                    success: false,
                    code:
                        "SESSION_IN_USE",

                    message:
                        "Please wait until the other finishes. A student is currently being assisted or is voting.",
                });
            }

            operation =
                await createKioskOperation({
                    sessionId:
                        session.id,

                    ebMemberId:
                        req.user.userId,

                    operationType:
                        "registration",
                });

            const storagePrefix =
                `registrations/${registration.id}`;

            const documents = [
                {
                    validation:
                        front,

                    type:
                        "student_id_front",

                    path:
                        `${storagePrefix}/student-id-front.${getExtension(
                            front.mimeType
                        )}`,

                    original:
                        studentIdFront.name ||
                        "student-id-front",
                },

                {
                    validation:
                        back,

                    type:
                        "student_id_back",

                    path:
                        `${storagePrefix}/student-id-back.${getExtension(
                            back.mimeType
                        )}`,

                    original:
                        studentIdBack.name ||
                        "student-id-back",
                },

                {
                    validation:
                        enrollment,

                    type:
                        "enrollment_proof",

                    path:
                        `${storagePrefix}/enrollment-proof.${getExtension(
                            enrollment.mimeType
                        )}`,

                    original:
                        enrollmentProof.name ||
                        "enrollment-proof",
                },
            ];

            if (
                supportingDocument?.data
            ) {
                const supporting =
                    validateFile(
                        supportingDocument,
                        "Supporting document"
                    );

                if (!supporting.valid) {
                    return res.status(400).json({
                        success: false,
                        message:
                            supporting.message,
                    });
                }

                documents.push({
                    validation:
                        supporting,

                    type:
                        "other",

                    path:
                        `${storagePrefix}/supporting-document.${getExtension(
                            supporting.mimeType
                        )}`,

                    original:
                        supportingDocument.name ||
                        "supporting-document",
                });
            }

            for (
                const document of documents
            ) {
                await uploadToStorage({
                    buffer:
                        document
                            .validation
                            .buffer,

                    mimeType:
                        document
                            .validation
                            .mimeType,

                    path:
                        document.path,
                });
            }

            const {
                error:
                    deleteDocumentsError,
            } = await supabase
                .from(
                    "registration_documents"
                )
                .delete()
                .eq(
                    "registration_id",
                    registration.id
                );

            if (
                deleteDocumentsError
            ) {
                throw deleteDocumentsError;
            }

            const {
                error:
                    documentInsertError,
            } = await supabase
                .from(
                    "registration_documents"
                )
                .insert(
                    documents.map(
                        (document) => ({
                            registration_id:
                                registration.id,

                            student_id:
                                cleanStudentId,

                            document_type:
                                document.type,

                            storage_path:
                                document.path,

                            original_file_name:
                                document.original,

                            file_type:
                                document
                                    .validation
                                    .mimeType,

                            file_size:
                                document
                                    .validation
                                    .buffer
                                    .length,

                            verification_status:
                                "pending",
                        })
                    )
                );

            if (
                documentInsertError
            ) {
                throw documentInsertError;
            }

            const selfiePath =
                `${storagePrefix}/selfie.${getExtension(
                    selfieValidation.mimeType
                )}`;

            await uploadToStorage({
                buffer:
                    selfieValidation.buffer,

                mimeType:
                    selfieValidation.mimeType,

                path:
                    selfiePath,
            });

            await supabase
                .from(
                    "identity_verifications"
                )
                .delete()
                .eq(
                    "registration_id",
                    registration.id
                );

            const {
                error:
                    identityError,
            } = await supabase
                .from(
                    "identity_verifications"
                )
                .insert({
                    registration_id:
                        registration.id,

                    student_id:
                        existingStudent?.id ||
                        null,

                    selfie_storage_path:
                        selfiePath,

                    verification_method:
                        "kiosk",

                    verification_status:
                        "pending",
                });

            if (identityError) {
                throw identityError;
            }

            const signedDocuments =
                await Promise.all(
                    documents.map(
                        async (
                            document
                        ) => {
                            const {
                                data,
                            } =
                                await supabase
                                    .storage
                                    .from(
                                        STORAGE_BUCKET
                                    )
                                    .createSignedUrl(
                                        document.path,
                                        10 * 60
                                    );

                            return {
                                type:
                                    document.type,

                                name:
                                    document.original,

                                url:
                                    data
                                        ?.signedUrl ||
                                    null,
                            };
                        }
                    )
                );

            const {
                data:
                    selfieUrlData,
            } = await supabase
                .storage
                .from(
                    STORAGE_BUCKET
                )
                .createSignedUrl(
                    selfiePath,
                    10 * 60
                );

            return res.status(201).json({
                success: true,

                message:
                    "Assisted registration submitted for Electoral Board verification.",

                operationId:
                    operation.id,

                registration: {
                    id:
                        registration.id,

                    studentId:
                        cleanStudentId,

                    fullName:
                        cleanName,

                    yearLevel:
                        normalizedYear,

                    registrationType,
                },

                review: {
                    documents:
                        signedDocuments,

                    selfieUrl:
                        selfieUrlData
                            ?.signedUrl ||
                        null,
                },
            });
        } catch (error) {
            console.error(
                "❌ Kiosk registration submission error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to submit assisted registration.",
            });
        }
    };

// =========================================================
// APPROVE ASSISTED REGISTRATION
// =========================================================

const approveKioskRegistration =
    async (req, res) => {
        try {
            const {
                registrationId,
                sessionId,
                operationId,
            } = req.body;

            if (
                !registrationId ||
                !sessionId
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Registration and kiosk session are required.",
                });
            }

            const session =
                await validateSessionElection(
                    req.user.userId,
                    sessionId
                );

            const {
                data: application,
                error:
                    applicationError,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .select("*")
                .eq(
                    "id",
                    registrationId
                )
                .maybeSingle();

            if (applicationError) {
                throw applicationError;
            }

            if (!application) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Registration application not found.",
                });
            }

            if (
                application
                    .application_status !==
                "pending_review"
            ) {
                return res.status(409).json({
                    success: false,
                    message:
                        "This registration is not awaiting approval.",
                });
            }

            const normalizedYear =
                await ensureYearEligibility(
                    session.election_id,
                    application.year_level
                );

            let student;

            const {
                data: existingStudent,
                error:
                    existingStudentError,
            } = await supabase
                .from("students")
                .select(`
                    id,
                    student_id,
                    full_name,
                    year_level
                `)
                .eq(
                    "student_id",
                    application.student_id
                )
                .maybeSingle();

            if (existingStudentError) {
                throw existingStudentError;
            }

            if (existingStudent) {
                student =
                    existingStudent;
            } else {
                const {
                    data:
                        createdStudent,
                    error:
                        studentCreateError,
                } = await supabase
                    .from("students")
                    .insert({
                        student_id:
                            application.student_id,

                        full_name:
                            application.full_name,

                        year_level:
                            normalizedYear,
                    })
                    .select(`
                        id,
                        student_id,
                        full_name,
                        year_level
                    `)
                    .single();

                if (studentCreateError) {
                    throw studentCreateError;
                }

                student =
                    createdStudent;
            }

            const existingAccount =
                await getStudentAccount(
                    student.student_id
                );

            if (existingAccount) {
                return res.status(409).json({
                    success: false,
                    message:
                        "A student account already exists for this Student ID.",
                });
            }

            const temporaryPassword =
                crypto
                    .randomBytes(6)
                    .toString(
                        "base64url"
                    )
                    .slice(0, 10);

            const passwordHash =
                await bcrypt.hash(
                    temporaryPassword,
                    12
                );

            const {
                data: account,
                error:
                    accountError,
            } = await supabase
                .from(
                    "student_accounts"
                )
                .insert({
                    student_id:
                        student.student_id,

                    registration_id:
                        application.id,

                    email:
                        application.email ||
                        null,

                    password_hash:
                        passwordHash,

                    must_change_password:
                        true,
                })
                .select(`
                    id,
                    student_id,
                    email,
                    must_change_password,
                    account_status
                `)
                .single();

            if (accountError) {
                throw accountError;
            }

            const {
                data:
                    updatedApplication,
                error:
                    applicationUpdateError,
            } = await supabase
                .from(
                    "registration_applications"
                )
                .update({
                    application_status:
                        "approved",

                    reviewed_at:
                        nowIso(),

                    reviewed_by:
                        req.user.userId,

                    rejection_reason:
                        null,

                    correction_message:
                        null,

                    updated_at:
                        nowIso(),
                })
                .eq(
                    "id",
                    application.id
                )
                .eq(
                    "application_status",
                    "pending_review"
                )
                .select()
                .maybeSingle();

            if (
                applicationUpdateError ||
                !updatedApplication
            ) {
                await supabase
                    .from(
                        "student_accounts"
                    )
                    .delete()
                    .eq(
                        "id",
                        account.id
                    );

                if (!existingStudent) {
                    await supabase
                        .from(
                            "students"
                        )
                        .delete()
                        .eq(
                            "id",
                            student.id
                        );
                }

                throw (
                    applicationUpdateError ||
                    new Error(
                        "The registration changed before approval was completed."
                    )
                );
            }

            let operation = null;

            if (operationId) {
                operation =
                    await getKioskOperation(
                        operationId
                    );

                if (
                    !operation ||
                    operation.kiosk_session_id !==
                        session.id ||
                    operation.operation_status !==
                        "active"
                ) {
                    return res.status(409).json({
                        success: false,
                        message:
                            "The assisted registration operation is no longer active.",
                    });
                }
            } else {
                const activeOperations =
                    await getActiveOperationCount(
                        session.id
                    );

                if (
                    activeOperations > 0
                ) {
                    return res.status(409).json({
                        success: false,
                        code:
                            "SESSION_IN_USE",

                        message:
                            "Please wait until the other finishes. A student is currently being assisted or is voting.",
                    });
                }

                operation =
                    await createKioskOperation({
                        sessionId:
                            session.id,

                        ebMemberId:
                            req.user.userId,

                        operationType:
                            "registration",
                    });
            }

            const token =
                createKioskStudentToken({
                    student,

                    session: {
                        ...session,

                        kioskOperationId:
                            operation.id,
                    },
                });

            const activationToken =
                jwt.sign(
                    {
                        role:
                            "kiosk_activation",

                        accountId:
                            account.id,

                        studentId:
                            student.student_id,

                        studentIdUuid:
                            student.id,

                        kioskSessionId:
                            session.id,

                        electionId:
                            session.election_id,

                        kioskOperationId:
                            operation.id,
                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "15m",
                    }
                );

            return res.json({
                success: true,

                message:
                    "Student approved and authorized for kiosk voting.",

                token,

                student: {
                    id:
                        student.id,

                    studentId:
                        student.student_id,

                    fullName:
                        student.full_name,

                    yearLevel:
                        normalizedYear,
                },

                electionId:
                    session.election_id,

                sessionId:
                    session.id,

                operationId:
                    operation.id,

                activationToken,

                account: {
                    id:
                        account.id,

                    mustChangePassword:
                        account
                            .must_change_password,
                },

                temporaryPassword,
            });
        } catch (error) {
            console.error(
                "❌ Kiosk registration approval error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    error.message ||
                    "Unable to approve assisted registration.",
            });
        }
    };

// =========================================================
// SET PERSONAL PASSWORD
// =========================================================

const setKioskPersonalPassword =
    async (req, res) => {
        try {
            const {
                activationToken,
                password,
            } = req.body;

            if (
                !activationToken ||
                !password
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Activation token and password are required.",
                });
            }

            if (
                String(password)
                    .length !== 8
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must be exactly 8 characters.",
                });
            }

            if (
                !/[A-Z]/.test(
                    password
                ) ||
                !/[a-z]/.test(
                    password
                ) ||
                !/[0-9]/.test(
                    password
                ) ||
                !/[^A-Za-z0-9]/.test(
                    password
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain an uppercase letter, lowercase letter, number, and special character.",
                });
            }

            const decoded =
                jwt.verify(
                    activationToken,
                    process.env.JWT_SECRET
                );

            if (
                decoded?.role !==
                    "kiosk_activation" ||
                !decoded?.accountId ||
                !decoded?.studentId
            ) {
                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid kiosk activation token.",
                });
            }

            const passwordHash =
                await bcrypt.hash(
                    password,
                    12
                );

            const {
                data: account,
                error,
            } = await supabase
                .from(
                    "student_accounts"
                )
                .update({
                    password_hash:
                        passwordHash,

                    must_change_password:
                        false,

                    updated_at:
                        nowIso(),
                })
                .eq(
                    "id",
                    decoded.accountId
                )
                .eq(
                    "student_id",
                    decoded.studentId
                )
                .select(`
                    id,
                    student_id,
                    must_change_password,
                    account_status
                `)
                .single();

            if (error) {
                throw error;
            }

            const {
                data: student,
                error:
                    studentError,
            } = await supabase
                .from("students")
                .select(`
                    id,
                    student_id,
                    full_name,
                    year_level
                `)
                .eq(
                    "id",
                    decoded.studentIdUuid
                )
                .maybeSingle();

            if (studentError) {
                throw studentError;
            }

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Student record could not be loaded.",
                });
            }

            const {
                data: session,
                error:
                    sessionError,
            } = await supabase
                .from(
                    "kiosk_sessions"
                )
                .select(`
                    id,
                    election_id,
                    session_status
                `)
                .eq(
                    "id",
                    decoded.kioskSessionId
                )
                .maybeSingle();

            if (sessionError) {
                throw sessionError;
            }

            if (
                !session ||
                session.session_status !==
                    "active"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The kiosk session is no longer active.",
                });
            }

            const token =
                createKioskStudentToken({
                    student,

                    session: {
                        ...session,

                        kioskOperationId:
                            decoded
                                .kioskOperationId ||
                            undefined,
                    },
                });

            return res.json({
                success: true,

                message:
                    "Personal password created successfully.",

                token,

                operationId:
                    decoded
                        .kioskOperationId ||
                    null,

                student: {
                    id:
                        student.id,

                    studentId:
                        student.student_id,

                    fullName:
                        student.full_name,

                    yearLevel:
                        student.year_level,
                },

                account,
            });
        } catch (error) {
            console.error(
                "❌ Kiosk personal password error:",
                error
            );

            return res.status(401).json({
                success: false,
                message:
                    error.message ||
                    "Unable to set personal password.",
            });
        }
    };

// =========================================================
// SHARED SESSION MANAGEMENT HELPER
// =========================================================

const getSharedSessionForManagement =
    async (sessionId) => {
        const {
            data: session,
            error,
        } = await supabase
            .from(
                "kiosk_sessions"
            )
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                started_at,
                ended_at,
                last_activity_at,
                students_served,
                elections (
                    id,
                    title,
                    status,
                    is_published
                )
            `)
            .eq(
                "id",
                sessionId
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        return session;
    };

// =========================================================
// CLOSE SESSION
// =========================================================

const closeKioskSession = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const session =
            await getSharedSessionForManagement(
                id
            );

        if (!session) {
            return res.status(404).json({
                success: false,
                message:
                    "Kiosk session not found.",
            });
        }

        if (
            session.session_status !==
            "active"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This kiosk session is already closed.",
            });
        }

        const activeOperations =
            await getActiveOperationCount(
                id
            );

        if (
            activeOperations > 0
        ) {
            return res.status(409).json({
                success: false,
                code:
                    "SESSION_IN_USE",

                message:
                    "Please wait until the other finishes. A student is currently being assisted or is voting.",

                activeOperations,
            });
        }

        const {
            data: updatedSession,
            error,
        } = await supabase
            .from(
                "kiosk_sessions"
            )
            .update({
                session_status:
                    "closed",

                ended_at:
                    nowIso(),

                last_activity_at:
                    nowIso(),

                updated_at:
                    nowIso(),
            })
            .eq(
                "id",
                id
            )
            .eq(
                "session_status",
                "active"
            )
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                started_at,
                ended_at,
                last_activity_at,
                students_served
            `)
            .single();

        if (error) {
            throw error;
        }

        return res.json({
            success: true,

            message:
                "Kiosk session closed successfully.",

            session:
                updatedSession,
        });
    } catch (error) {
        console.error(
            "❌ Close kiosk session error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to close kiosk session.",
        });
    }
};

// =========================================================
// CANCEL SESSION
// =========================================================

const cancelKioskSession = async (
    req,
    res
) => {
    try {
        const {
            id,
        } = req.params;

        const session =
            await getSharedSessionForManagement(
                id
            );

        if (!session) {
            return res.status(404).json({
                success: false,
                message:
                    "Kiosk session not found.",
            });
        }

        if (
            session.session_status !==
            "active"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This kiosk session is no longer active.",
            });
        }

        const activeOperations =
            await getActiveOperationCount(
                id
            );

        if (
            activeOperations > 0
        ) {
            return res.status(409).json({
                success: false,
                code:
                    "SESSION_IN_USE",

                message:
                    "Please wait until the other finishes. A student is currently being assisted or is voting.",

                activeOperations,
            });
        }

        const {
            data: updatedSession,
            error,
        } = await supabase
            .from(
                "kiosk_sessions"
            )
            .update({
                session_status:
                    "cancelled",

                ended_at:
                    nowIso(),

                last_activity_at:
                    nowIso(),

                updated_at:
                    nowIso(),
            })
            .eq(
                "id",
                id
            )
            .eq(
                "session_status",
                "active"
            )
            .select(`
                id,
                election_id,
                eb_member_id,
                session_status,
                started_at,
                ended_at,
                last_activity_at,
                students_served
            `)
            .single();

        if (error) {
            throw error;
        }

        return res.json({
            success: true,

            message:
                "Kiosk session cancelled.",

            session:
                updatedSession,
        });
    } catch (error) {
        console.error(
            "❌ Cancel kiosk session error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to cancel kiosk session.",
        });
    }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    getKioskElections,

    getActiveKioskSession,

    getKioskSessions,

    startKioskSession,

    heartbeatKioskSession,

    startKioskOperation,

    heartbeatKioskOperation,

    finishKioskOperation,

    abortKioskOperation,

    closeKioskSession,

    cancelKioskSession,

    verifyKioskStudent,

    authorizeKioskStudent,

    submitKioskRegistration,

    approveKioskRegistration,

    setKioskPersonalPassword,
};