const supabase = require("../config/supabase");
const jwt = require("jsonwebtoken");
const auditLogsService = require("../services/auditLogsService");

// =========================================================
// CANDIDATE AUDIT LOG HELPER
// =========================================================

const getCandidateAuditActor = async (req) => {
    try {
        const authHeader = req.headers?.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return null;
        }

        const token = authHeader.split(" ")[1];

        if (!token || !process.env.JWT_SECRET) {
            return null;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (
            !decoded ||
            decoded.role !== "electoral_board" ||
            !decoded.userId
        ) {
            return null;
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
            .eq("id", decoded.userId)
            .eq("role", "electoral_board")
            .maybeSingle();

        if (
            error ||
            !staff ||
            !staff.is_active ||
            !staff.email
        ) {
            return null;
        }

        return {
            actorId: staff.id,
            actorName: staff.full_name,
            actorEmail: staff.email,
            actorRole: staff.role,
        };

    } catch (error) {

        console.error(
            "Candidate audit actor lookup failed:",
            error?.message || error
        );

        return null;
    }
};


// =========================================================
// WRITE CANDIDATE AUDIT LOG
// =========================================================

const writeCandidateAuditLog = async (
    req,
    {
        action,
        description,
        electionId = null,
        targetId = null,
        metadata = {},
    }
) => {

    try {

        const actor =
            await getCandidateAuditActor(req);

        // actor_email is NOT NULL in audit_logs.
        //
        // If the actor cannot be resolved, skip the
        // audit log instead of breaking Candidate Management.

        if (
            !actor ||
            !actor.actorEmail
        ) {

            console.warn(
                "Candidate audit log skipped: Electoral Board actor could not be resolved."
            );

            return;
        }

        await auditLogsService.createAuditLog({

            ...actor,

            action,

            module:
                "Candidate Management",

            description,

            electionId,

            targetId,

            targetType:
                "candidate",

            metadata,

            ipAddress:
                req.ip ||
                req.headers?.["x-forwarded-for"]
                    ?.split(",")[0]
                    ?.trim() ||
                null,

            userAgent:
                typeof req.get === "function"
                    ? req.get("user-agent")
                    : null,
        });

    } catch (auditError) {

        // Audit logging must never break the
        // existing Candidate Management operation.

        console.error(
            "Candidate audit log write failed:",
            auditError?.message || auditError
        );
    }
};


// =========================================================
// GET ALL CANDIDATES
// =========================================================

const getAllCandidates = async (req, res) => {

    try {

        const {
            election_id
        } = req.query;

        let query = supabase
            .from("candidates")
            .select(`
                *,
                student:students (
                    id,
                    student_id,
                    full_name,
                    year_level,
                    enrollment_status
                ),
                position:positions (
                    id,
                    name,
                    description,
                    display_order,
                    is_required,
                    is_active
                ),
                party_list:party_lists (
                    id,
                    name,
                    description,
                    logo_url,
                    approval_status,
                    is_active
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false,
                }
            );

        if (election_id) {

            query = query.eq(
                "election_id",
                election_id
            );
        }

        const {
            data,
            error
        } = await query;

        if (error) {
            throw error;
        }

        return res.status(200).json({

            success: true,

            count:
                data?.length || 0,

            candidates:
                data || [],
        });

    } catch (error) {

        console.error(
            "Get candidates error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to load candidates.",
        });
    }
};


// =========================================================
// GET CANDIDATE BY ID
// =========================================================

const getCandidateById = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;

        const {
            data,
            error
        } = await supabase
            .from("candidates")
            .select(`
                *,
                student:students (
                    id,
                    student_id,
                    full_name,
                    year_level,
                    enrollment_status
                ),
                position:positions (
                    id,
                    name,
                    description,
                    display_order,
                    is_required,
                    is_active
                ),
                party_list:party_lists (
                    id,
                    name,
                    description,
                    logo_url,
                    approval_status,
                    is_active
                )
            `)
            .eq(
                "id",
                id
            )
            .single();

        if (error) {
            throw error;
        }

        return res.status(200).json({

            success: true,

            candidate:
                data,
        });

    } catch (error) {

        console.error(
            "Get candidate error:",
            error
        );

        return res.status(404).json({

            success: false,

            message:
                error.message ||
                "Candidate not found.",
        });
    }
};


// =========================================================
// GET REGISTERED STUDENTS
// =========================================================

const getCandidateStudents = async (
    req,
    res
) => {

    try {

        const {
            election_id
        } = req.query;

        let query = supabase
            .from("students")
            .select(`
                id,
                student_id,
                full_name,
                year_level,
                enrollment_status
            `)
            .order(
                "full_name",
                {
                    ascending: true,
                }
            );

        const {
            data,
            error
        } = await query;

        if (error) {
            throw error;
        }

        let students =
            data || [];

        // -----------------------------------------------------
        // Remove students already assigned to a candidate
        // for this election.
        // -----------------------------------------------------

        if (election_id) {

            const {
                data: existingCandidates,
                error: candidateError,
            } = await supabase
                .from("candidates")
                .select(
                    "student_id"
                )
                .eq(
                    "election_id",
                    election_id
                );

            if (candidateError) {
                throw candidateError;
            }

            const usedStudentIds =
                new Set(
                    (
                        existingCandidates ||
                        []
                    ).map(
                        (candidate) =>
                            String(
                                candidate.student_id
                            )
                    )
                );

            students =
                students.filter(
                    (student) =>
                        !usedStudentIds.has(
                            String(
                                student.id
                            )
                        )
                );
        }

        return res.status(200).json({

            success: true,

            count:
                students.length,

            students,
        });

    } catch (error) {

        console.error(
            "Get candidate students error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Unable to load registered students.",
        });
    }
};


// =========================================================
// CREATE CANDIDATE
// =========================================================

const createCandidate = async (
    req,
    res
) => {

    try {

        const {
            election_id,
            position_id,
            student_id,
            party_list_id,
            platform,
            profile_picture,
        } = req.body;


        if (!election_id) {

            return res.status(400).json({

                success: false,

                message:
                    "Election is required.",
            });
        }


        if (!position_id) {

            return res.status(400).json({

                success: false,

                message:
                    "Position is required.",
            });
        }


        if (!student_id) {

            return res.status(400).json({

                success: false,

                message:
                    "Registered student is required.",
            });
        }


        // -----------------------------------------------------
        // Verify election
        // -----------------------------------------------------

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
                election_id
            )
            .single();

        if (
            electionError ||
            !election
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Selected election does not exist.",
            });
        }


        // -----------------------------------------------------
        // Verify student
        // -----------------------------------------------------

        const {
            data: student,
            error: studentError,
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
                "id",
                student_id
            )
            .single();

        if (
            studentError ||
            !student
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Selected student does not exist.",
            });
        }


        // -----------------------------------------------------
        // Verify position belongs to election
        // -----------------------------------------------------

        const {
            data: position,
            error: positionError,
        } = await supabase
            .from("positions")
            .select(`
                id,
                election_id,
                name,
                is_active
            `)
            .eq(
                "id",
                position_id
            )
            .single();


        if (
            positionError ||
            !position
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Selected position does not exist.",
            });
        }


        if (
            String(
                position.election_id
            ) !==
            String(
                election_id
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The selected position does not belong to this election.",
            });
        }


        if (
            position.is_active === false
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The selected position is inactive.",
            });
        }


        // -----------------------------------------------------
        // Verify party list if provided
        // -----------------------------------------------------

        if (party_list_id) {

            const {
                data: partyList,
                error: partyError,
            } = await supabase
                .from("party_lists")
                .select(`
                    id,
                    election_id,
                    approval_status,
                    is_active
                `)
                .eq(
                    "id",
                    party_list_id
                )
                .single();


            if (
                partyError ||
                !partyList
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected party list does not exist.",
                });
            }


            if (
                String(
                    partyList.election_id
                ) !==
                String(
                    election_id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The selected party list does not belong to this election.",
                });
            }


            if (
                partyList.approval_status !==
                "approved"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only approved party lists can be assigned to candidates.",
                });
            }


            if (
                partyList.is_active === false
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The selected party list is inactive.",
                });
            }
        }


        // -----------------------------------------------------
        // CANDIDATE UNIQUENESS RULES
        // -----------------------------------------------------
        //
        // 1. A student can only be a candidate ONCE per election.
        //
        // 2. A party list can only have ONE candidate per position.
        //
        // 3. Different party lists may have candidates
        //    for the same position.
        //
        // 4. Independent candidates do not use party-position
        //    uniqueness.
        // -----------------------------------------------------

        const {
            data: existingStudentCandidate,
            error: existingStudentCandidateError,
        } = await supabase
            .from("candidates")
            .select(
                "id, party_list_id, position_id, full_name"
            )
            .eq(
                "election_id",
                election_id
            )
            .eq(
                "student_id",
                student_id
            )
            .maybeSingle();


        if (
            existingStudentCandidateError
        ) {

            throw existingStudentCandidateError;
        }


        if (
            existingStudentCandidate
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This student is already registered as a candidate for this election. A student can only be assigned to one candidate position.",
            });
        }


        if (party_list_id) {

            const {
                data:
                    existingPartyPositionCandidate,

                error:
                    existingPartyPositionCandidateError,

            } = await supabase
                .from("candidates")
                .select(
                    "id, full_name, student_id"
                )
                .eq(
                    "election_id",
                    election_id
                )
                .eq(
                    "party_list_id",
                    party_list_id
                )
                .eq(
                    "position_id",
                    position_id
                )
                .maybeSingle();


            if (
                existingPartyPositionCandidateError
            ) {

                throw existingPartyPositionCandidateError;
            }


            if (
                existingPartyPositionCandidate
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        `The party list already has a candidate for ${position.name}. Please choose another position.`,
                });
            }
        }


        // -----------------------------------------------------
        // Create candidate
        // -----------------------------------------------------

        const {
            data: candidate,
            error: createError,
        } = await supabase
            .from("candidates")
            .insert({

                election_id,

                position_id,

                student_id,

                full_name:
                    student.full_name,

                party_list_id:
                    party_list_id ||
                    null,

                platform:
                    platform ||
                    "",

                profile_picture:
                    profile_picture ||
                    "",

                is_active:
                    true,

                // Existing database compatibility.
                // This is NOT a candidate approval workflow.

                approval_status:
                    "pending",
            })
            .select(`
                *,
                student:students (
                    id,
                    student_id,
                    full_name,
                    year_level,
                    enrollment_status
                ),
                position:positions (
                    id,
                    name
                ),
                party_list:party_lists (
                    id,
                    name,
                    approval_status
                )
            `)
            .single();


        if (createError) {
            throw createError;
        }


        // =====================================================
        // AUDIT LOG - CREATE
        // =====================================================

        await writeCandidateAuditLog(
            req,
            {

                action:
                    "create",

                description:
                    `Added candidate "${candidate?.full_name || student.full_name}" for "${position?.name || "Unknown position"}".`,

                electionId:
                    election_id,

                targetId:
                    candidate?.id ||
                    null,

                metadata: {

                    candidateName:
                        candidate?.full_name ||
                        student.full_name ||
                        null,

                    positionId:
                        position_id,

                    positionName:
                        position?.name ||
                        null,

                    partyListId:
                        party_list_id ||
                        null,
                },
            }
        );


        return res.status(201).json({

            success: true,

            message:
                "Candidate added successfully.",

            candidate,
        });

    } catch (error) {

        console.error(
            "Create candidate error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to create candidate.",
        });
    }
};


// =========================================================
// UPDATE CANDIDATE
// =========================================================

const updateCandidate = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;

        const {
            election_id,
            position_id,
            student_id,
            party_list_id,
            platform,
            profile_picture,
        } = req.body;


        const {
            data: existing,
            error: existingError,
        } = await supabase
            .from("candidates")
            .select("*")
            .eq(
                "id",
                id
            )
            .single();


        if (
            existingError ||
            !existing
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Candidate not found.",
            });
        }


        const finalElectionId =
            election_id ||
            existing.election_id;


        const finalPositionId =
            position_id ||
            existing.position_id;


        const finalStudentId =
            student_id ||
            existing.student_id;


        // -----------------------------------------------------
        // Student
        // -----------------------------------------------------

        const {
            data: student,
            error: studentError,
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
                "id",
                finalStudentId
            )
            .single();


        if (
            studentError ||
            !student
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Selected student does not exist.",
            });
        }


        // -----------------------------------------------------
        // Position
        // -----------------------------------------------------

        const {
            data: position,
            error: positionError,
        } = await supabase
            .from("positions")
            .select(`
                id,
                election_id,
                name,
                is_active
            `)
            .eq(
                "id",
                finalPositionId
            )
            .single();


        if (
            positionError ||
            !position
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Selected position does not exist.",
            });
        }


        if (
            String(
                position.election_id
            ) !==
            String(
                finalElectionId
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The selected position does not belong to this election.",
            });
        }


        // -----------------------------------------------------
        // Party list
        // -----------------------------------------------------

        if (party_list_id) {

            const {
                data: partyList,
                error: partyError,
            } = await supabase
                .from("party_lists")
                .select(`
                    id,
                    election_id,
                    approval_status,
                    is_active
                `)
                .eq(
                    "id",
                    party_list_id
                )
                .single();


            if (
                partyError ||
                !partyList
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Selected party list does not exist.",
                });
            }


            if (
                String(
                    partyList.election_id
                ) !==
                String(
                    finalElectionId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The selected party list does not belong to this election.",
                });
            }


            if (
                partyList.approval_status !==
                "approved"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only approved party lists can be assigned to candidates.",
                });
            }


            if (
                partyList.is_active === false
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "The selected party list is inactive.",
                });
            }
        }


        // -----------------------------------------------------
        // CANDIDATE UNIQUENESS RULES
        // -----------------------------------------------------

        const {
            data: existingStudentCandidate,
            error: existingStudentCandidateError,
        } = await supabase
            .from("candidates")
            .select(
                "id, party_list_id, position_id, full_name"
            )
            .eq(
                "election_id",
                finalElectionId
            )
            .eq(
                "student_id",
                finalStudentId
            )
            .neq(
                "id",
                id
            )
            .maybeSingle();


        if (
            existingStudentCandidateError
        ) {

            throw existingStudentCandidateError;
        }


        if (
            existingStudentCandidate
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "This student is already registered as a candidate for this election. A student can only be assigned to one candidate position.",
            });
        }


        if (party_list_id) {

            const {
                data:
                    existingPartyPositionCandidate,

                error:
                    existingPartyPositionCandidateError,

            } = await supabase
                .from("candidates")
                .select(
                    "id, full_name, student_id"
                )
                .eq(
                    "election_id",
                    finalElectionId
                )
                .eq(
                    "party_list_id",
                    party_list_id
                )
                .eq(
                    "position_id",
                    finalPositionId
                )
                .neq(
                    "id",
                    id
                )
                .maybeSingle();


            if (
                existingPartyPositionCandidateError
            ) {

                throw existingPartyPositionCandidateError;
            }


            if (
                existingPartyPositionCandidate
            ) {

                return res.status(409).json({

                    success: false,

                    message:
                        `The party list already has a candidate for ${position.name}. Please choose another position.`,
                });
            }
        }


        // -----------------------------------------------------
        // Update
        // -----------------------------------------------------

        const {
            data: candidate,
            error: updateError,
        } = await supabase
            .from("candidates")
            .update({

                election_id:
                    finalElectionId,

                position_id:
                    finalPositionId,

                student_id:
                    finalStudentId,

                full_name:
                    student.full_name,

                party_list_id:
                    party_list_id ||
                    null,

                platform:
                    platform ||
                    "",

                profile_picture:
                    profile_picture ||
                    "",

                updated_at:
                    new Date().toISOString(),
            })
            .eq(
                "id",
                id
            )
            .select(`
                *,
                student:students (
                    id,
                    student_id,
                    full_name,
                    year_level,
                    enrollment_status
                ),
                position:positions (
                    id,
                    name
                ),
                party_list:party_lists (
                    id,
                    name,
                    approval_status
                )
            `)
            .single();


        if (updateError) {
            throw updateError;
        }


        // =====================================================
        // AUDIT LOG - UPDATE
        // =====================================================

        await writeCandidateAuditLog(
            req,
            {

                action:
                    "update",

                description:
                    `Updated candidate "${candidate?.full_name || student.full_name}".`,

                electionId:
                    candidate?.election_id ||
                    finalElectionId ||
                    null,

                targetId:
                    candidate?.id ||
                    id,

                metadata: {

                    candidateName:
                        candidate?.full_name ||
                        student.full_name ||
                        null,

                    positionId:
                        candidate?.position_id ||
                        finalPositionId ||
                        null,

                    positionName:
                        position?.name ||
                        null,

                    partyListId:
                        candidate?.party_list_id ||
                        party_list_id ||
                        null,
                },
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "Candidate updated successfully.",

            candidate,
        });

    } catch (error) {

        console.error(
            "Update candidate error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to update candidate.",
        });
    }
};


// =========================================================
// ACTIVATE CANDIDATE
// =========================================================

const activateCandidate = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const {
            data,
            error,
        } = await supabase
            .from("candidates")
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
            .select()
            .single();


        if (error) {
            throw error;
        }


        // =====================================================
        // AUDIT LOG - ACTIVATE
        // =====================================================

        await writeCandidateAuditLog(
            req,
            {

                action:
                    "activate",

                description:
                    `Activated candidate "${data?.full_name || "Unknown candidate"}".`,

                electionId:
                    data?.election_id ||
                    null,

                targetId:
                    data?.id ||
                    id,

                metadata: {

                    candidateName:
                        data?.full_name ||
                        null,

                    positionId:
                        data?.position_id ||
                        null,

                    partyListId:
                        data?.party_list_id ||
                        null,
                },
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "Candidate activated successfully.",

            candidate:
                data,
        });

    } catch (error) {

        console.error(
            "Activate candidate error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to activate candidate.",
        });
    }
};


// =========================================================
// DEACTIVATE CANDIDATE
// =========================================================

const deactivateCandidate = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const {
            data,
            error,
        } = await supabase
            .from("candidates")
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
            .select()
            .single();


        if (error) {
            throw error;
        }


        // =====================================================
        // AUDIT LOG - DEACTIVATE
        // =====================================================

        await writeCandidateAuditLog(
            req,
            {

                action:
                    "deactivate",

                description:
                    `Deactivated candidate "${data?.full_name || "Unknown candidate"}".`,

                electionId:
                    data?.election_id ||
                    null,

                targetId:
                    data?.id ||
                    id,

                metadata: {

                    candidateName:
                        data?.full_name ||
                        null,

                    positionId:
                        data?.position_id ||
                        null,

                    partyListId:
                        data?.party_list_id ||
                        null,
                },
            }
        );


        return res.status(200).json({

            success: true,

            message:
                "Candidate deactivated successfully.",

            candidate:
                data,
        });

    } catch (error) {

        console.error(
            "Deactivate candidate error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message ||
                "Unable to deactivate candidate.",
        });
    }
};


// =========================================================
// DELETE CANDIDATE
// =========================================================
//
// IMPORTANT:
// Only inactive candidates can be permanently deleted.
//
// If the candidate is already referenced by ballot_votes,
// PostgreSQL will prevent physical deletion.
//
// =========================================================

const deleteCandidate = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        if (!id) {

            return res.status(400).json({

                success: false,

                message:
                    "Candidate ID is required.",
            });
        }


        // -----------------------------------------------------
        // Find candidate first
        // -----------------------------------------------------

        const {
            data: candidate,
            error: findError,
        } = await supabase
            .from("candidates")
            .select(`
                id,
                full_name,
                is_active,
                election_id,
                position_id
            `)
            .eq(
                "id",
                id
            )
            .single();


        if (
            findError ||
            !candidate
        ) {

            console.error(
                "Find candidate before delete error:",
                findError
            );

            return res.status(404).json({

                success: false,

                message:
                    "Candidate not found.",
            });
        }


        // -----------------------------------------------------
        // SAFETY CHECK
        // -----------------------------------------------------
        //
        // Active candidates cannot be permanently deleted.
        //
        // EB must deactivate the candidate first.
        //
        // -----------------------------------------------------

        if (
            candidate.is_active ===
            true
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Active candidates cannot be deleted. Deactivate the candidate first.",
            });
        }


        // -----------------------------------------------------
        // Permanently delete inactive candidate
        // -----------------------------------------------------

        const {
            error: deleteError,
        } = await supabase
            .from("candidates")
            .delete()
            .eq(
                "id",
                id
            );


        if (deleteError) {

            console.error(
                "Delete candidate error:",
                deleteError
            );


            // -------------------------------------------------
            // CANDIDATE HAS EXISTING VOTES
            // -------------------------------------------------
            //
            // PostgreSQL error 23503 means another table still
            // references this candidate.
            //
            // In VOTARA this is the ballot_votes relationship.
            //
            // We preserve the voting records and return a
            // meaningful response instead of a generic 500.
            // -------------------------------------------------

            if (
                deleteError.code ===
                "23503"
            ) {

                return res.status(409).json({

                    success: false,

                    code:
                        "CANDIDATE_HAS_VOTES",

                    message:
                        `Candidate "${candidate.full_name}" cannot be permanently deleted because voting records are already associated with this candidate.`,

                    action:
                        "Keep the candidate inactive to preserve the existing voting records.",
                });
            }


            return res.status(500).json({

                success: false,

                message:
                    deleteError.message ||
                    "Unable to delete candidate.",
            });
        }


        // =====================================================
        // AUDIT LOG - DELETE
        // =====================================================

        await writeCandidateAuditLog(
            req,
            {

                action:
                    "delete",

                description:
                    `Permanently deleted candidate "${candidate.full_name}".`,

                electionId:
                    candidate.election_id ||
                    null,

                targetId:
                    candidate.id ||
                    id,

                metadata: {

                    candidateName:
                        candidate.full_name,

                    positionId:
                        candidate.position_id,

                    deletionType:
                        "permanent",
                },
            }
        );


        return res.status(200).json({

            success: true,

            message:
                `${candidate.full_name} was permanently removed from the candidate list.`,

            candidate_id:
                id,
        });

    } catch (error) {

        console.error(
            "Delete candidate controller error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "An unexpected error occurred while deleting the candidate.",
        });
    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getAllCandidates,

    getCandidateById,

    getCandidateStudents,

    createCandidate,

    updateCandidate,

    activateCandidate,

    deactivateCandidate,

    deleteCandidate,
};