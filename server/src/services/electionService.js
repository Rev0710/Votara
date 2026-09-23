const supabase = require("../config/supabase");

// =========================================================
// VOTARA ELECTION STATUS
// =========================================================
// IMPORTANT:
// These values MUST match the Supabase elections_status_check:
//
// draft
// scheduled
// open
// closed
// cancelled
// =========================================================

const ELECTION_STATUSES = [
    "draft",
    "scheduled",
    "open",
    "closed",
    "cancelled",
];


// =========================================================
// CREATE ELECTION
// =========================================================

const createElection = async (
    data,
    userId = null
) => {

    const {
        title,
        description = "",
        electionDate,
        startTime,
        endTime,
        yearLevelAccess = [],
    } = data;


    if (
        !title ||
        !electionDate ||
        !startTime ||
        !endTime
    ) {

        throw new Error(
            "Title, election date, start time, and end time are required."
        );
    }


    const {
        data: election,
        error,
    } = await supabase
        .from("elections")
        .insert({

            title:
                title.trim(),

            description:
                description?.trim() || "",

            election_date:
                electionDate,

            start_time:
                startTime,

            end_time:
                endTime,

            // Correct initial status
            status:
                "draft",

            created_by:
                userId || null,

            is_published:
                false,

        })
        .select()
        .single();


    if (error) {

        console.error(
            "Supabase create election error:",
            error
        );

        throw new Error(
            error.message
        );
    }


    // =====================================================
    // SAVE YEAR-LEVEL ACCESS
    // =====================================================

    if (
        Array.isArray(
            yearLevelAccess
        ) &&
        yearLevelAccess.length > 0
    ) {

        const yearLevelRows =
            yearLevelAccess.map(
                (yearLevel) => ({

                    election_id:
                        election.id,

                    year_level:
                        yearLevel,

                })
            );


        const {
            error: yearLevelError,
        } = await supabase
            .from(
                "election_year_levels"
            )
            .insert(
                yearLevelRows
            );


        if (yearLevelError) {

            console.error(
                "Election year-level error:",
                yearLevelError
            );


            // Remove election if
            // configuration fails
            await supabase
                .from("elections")
                .delete()
                .eq(
                    "id",
                    election.id
                );


            throw new Error(
                yearLevelError.message
            );
        }
    }


    return await getElectionById(
        election.id
    );
};


// =========================================================
// GET ALL ELECTIONS
// =========================================================

const getAllElections = async () => {

    try {

        const {
            data: elections,
            error: electionError,
        } = await supabase
            .from("elections")
            .select("*")
            .order(
                "election_date",
                {
                    ascending:
                        false,
                }
            );


        if (electionError) {

            console.error(
                "Supabase get elections error:",
                electionError
            );

            throw new Error(
                electionError.message
            );
        }


        const electionList =
            Array.isArray(
                elections
            )
                ? elections
                : [];


        if (
            electionList.length === 0
        ) {

            console.log(
                "📋 Elections loaded from Supabase: 0"
            );

            return [];
        }


        // =================================================
        // GET YEAR-LEVEL ACCESS
        // =================================================

        const electionIds =
            electionList.map(
                (election) =>
                    election.id
            );


        const {
            data: yearLevels,
            error: yearLevelError,
        } = await supabase
            .from(
                "election_year_levels"
            )
            .select(`
                id,
                election_id,
                year_level
            `)
            .in(
                "election_id",
                electionIds
            );


        if (yearLevelError) {

            console.warn(
                "⚠️ Election year-level loading warning:",
                yearLevelError.message
            );
        }


        const yearLevelList =
            Array.isArray(
                yearLevels
            )
                ? yearLevels
                : [];


        // =================================================
        // ATTACH YEAR LEVELS
        // =================================================

        const result =
            electionList.map(
                (election) => ({

                    ...election,

                    election_year_levels:
                        yearLevelList.filter(
                            (yearLevel) =>
                                yearLevel.election_id ===
                                election.id
                        ),

                })
            );


        console.log(
            `📋 Elections loaded from Supabase: ${result.length}`
        );


        return result;

    } catch (error) {

        console.error(
            "Get all elections service error:",
            error
        );

        throw error;
    }
};


// =========================================================
// GET ELECTION BY ID
// =========================================================

const getElectionById = async (
    electionId
) => {

    const {
        data: election,
        error,
    } = await supabase
        .from("elections")
        .select(`
            *,
            election_year_levels (
                id,
                year_level
            )
        `)
        .eq(
            "id",
            electionId
        )
        .single();


    if (error) {

        if (
            error.code ===
            "PGRST116"
        ) {

            throw new Error(
                "Election not found."
            );
        }


        console.error(
            "Supabase get election error:",
            error
        );


        throw new Error(
            error.message
        );
    }


    return election;
};


// =========================================================
// UPDATE ELECTION
// =========================================================

const updateElection = async (
    electionId,
    data
) => {

    const existingElection =
        await getElectionById(
            electionId
        );


    // Closed and cancelled elections
    // should not be edited.
    if (
        existingElection.status ===
        "cancelled"
    ) {

        throw new Error(
            "Cancelled elections cannot be edited."
        );
    }


    if (
        existingElection.status ===
        "closed"
    ) {

        throw new Error(
            "Closed elections cannot be edited."
        );
    }


    // Open elections should not be
    // reconfigured.
    if (
        existingElection.status ===
        "open"
    ) {

        throw new Error(
            "An open election cannot be edited."
        );
    }


    const allowedFields = {};


    if (
        data.title !==
        undefined
    ) {

        if (
            !data.title ||
            !data.title.trim()
        ) {

            throw new Error(
                "Election title cannot be empty."
            );
        }


        allowedFields.title =
            data.title.trim();
    }


    if (
        data.description !==
        undefined
    ) {

        allowedFields.description =
            data.description?.trim() ||
            "";
    }


    if (
        data.electionDate !==
        undefined
    ) {

        allowedFields.election_date =
            data.electionDate;
    }


    if (
        data.startTime !==
        undefined
    ) {

        allowedFields.start_time =
            data.startTime;
    }


    if (
        data.endTime !==
        undefined
    ) {

        allowedFields.end_time =
            data.endTime;
    }


    // Only update the election if
    // there are actual fields to update.
    if (
        Object.keys(
            allowedFields
        ).length > 0
    ) {

        const {
            error,
        } = await supabase
            .from("elections")
            .update(
                allowedFields
            )
            .eq(
                "id",
                electionId
            );


        if (error) {

            console.error(
                "Supabase update election error:",
                error
            );


            throw new Error(
                error.message
            );
        }
    }


    // =====================================================
    // UPDATE YEAR-LEVEL ACCESS
    // =====================================================

    if (
        data.yearLevelAccess !==
        undefined
    ) {

        const {
            error: deleteYearError,
        } = await supabase
            .from(
                "election_year_levels"
            )
            .delete()
            .eq(
                "election_id",
                electionId
            );


        if (deleteYearError) {

            throw new Error(
                deleteYearError.message
            );
        }


        if (
            Array.isArray(
                data.yearLevelAccess
            ) &&
            data.yearLevelAccess.length >
            0
        ) {

            const rows =
                data.yearLevelAccess.map(
                    (yearLevel) => ({

                        election_id:
                            electionId,

                        year_level:
                            yearLevel,

                    })
                );


            const {
                error: yearError,
            } = await supabase
                .from(
                    "election_year_levels"
                )
                .insert(
                    rows
                );


            if (yearError) {

                throw new Error(
                    yearError.message
                );
            }
        }
    }


    return await getElectionById(
        electionId
    );
};


// =========================================================
// VALIDATE ELECTION READINESS FOR OPENING
// =========================================================
// Before an election can become Open, every active
// required position must have at least one active candidate.
//
// This validation is performed on the backend so the rule
// cannot be bypassed by calling the API directly.
// =========================================================

const validateElectionReadyForOpening =
    async (
        electionId
    ) => {

        // =================================================
        // GET REQUIRED ACTIVE POSITIONS
        // =================================================

        const {
            data: positions,
            error: positionError,
        } = await supabase
            .from("positions")
            .select(`
                id,
                name,
                is_required,
                is_active
            `)
            .eq(
                "election_id",
                electionId
            )
            .eq(
                "is_active",
                true
            )
            .eq(
                "is_required",
                true
            )
            .order(
                "display_order",
                {
                    ascending:
                        true,
                }
            );


        if (positionError) {

            console.error(
                "Supabase election readiness position error:",
                positionError
            );


            throw new Error(
                positionError.message
            );
        }


        const requiredPositions =
            Array.isArray(
                positions
            )
                ? positions
                : [];


        // =================================================
        // MAKE SURE REQUIRED POSITIONS EXIST
        // =================================================

        if (
            requiredPositions.length ===
            0
        ) {

            throw new Error(
                "This election cannot be opened because no required active positions have been configured yet. Add the required positions first."
            );
        }


        // =================================================
        // GET ACTIVE CANDIDATES
        // =================================================

        const {
            data: candidates,
            error: candidateError,
        } = await supabase
            .from("candidates")
            .select(`
                id,
                position_id
            `)
            .eq(
                "election_id",
                electionId
            )
            .eq(
                "is_active",
                true
            );


        if (candidateError) {

            console.error(
                "Supabase election readiness candidate error:",
                candidateError
            );


            throw new Error(
                candidateError.message
            );
        }


        const candidateList =
            Array.isArray(
                candidates
            )
                ? candidates
                : [];


        // =================================================
        // FIND POSITIONS THAT HAVE CANDIDATES
        // =================================================

        const candidatePositionIds =
            new Set(
                candidateList.map(
                    (candidate) =>
                        String(
                            candidate.position_id
                        )
                )
            );


        // =================================================
        // FIND MISSING POSITIONS
        // =================================================

        const missingPositions =
            requiredPositions.filter(
                (position) =>
                    !candidatePositionIds.has(
                        String(
                            position.id
                        )
                    )
            );


        // =================================================
        // BLOCK OPENING IF ANY POSITION IS EMPTY
        // =================================================

        if (
            missingPositions.length >
            0
        ) {

            const missingNames =
                missingPositions.map(
                    (position) =>
                        position.name
                );


            throw new Error(
                `Election cannot be opened yet. The following required position${
                    missingNames.length ===
                    1
                        ? ""
                        : "s"
                } still need an active candidate: ${missingNames.join(
                    ", "
                )}.`
            );
        }


        // =================================================
        // READY
        // =================================================

        return {

            ready:
                true,

            requiredPositionCount:
                requiredPositions.length,

            missingPositions:
                [],

        };
    };


// =========================================================
// UPDATE ELECTION STATUS
// =========================================================

const updateElectionStatus =
    async (
        electionId,
        status
    ) => {

        // =================================================
        // VALIDATE STATUS
        // =================================================

        if (
            !ELECTION_STATUSES.includes(
                status
            )
        ) {

            throw new Error(
                `Invalid election status. Allowed statuses: ${ELECTION_STATUSES.join(
                    ", "
                )}.`
            );
        }


        const election =
            await getElectionById(
                electionId
            );


        // =================================================
        // OPENING REQUIREMENTS
        // =================================================
        // An election may only be opened from Scheduled.
        //
        // Before opening:
        //
        // 1. Election must be Scheduled
        // 2. Election must be Published
        // 3. Required positions must exist
        // 4. Every required position must have
        //    at least one active candidate
        // =================================================

        if (
            status === "open"
        ) {

            // -------------------------------------------------
            // ONLY SCHEDULED CAN BECOME OPEN
            // -------------------------------------------------

            if (
                election.status !==
                "scheduled"
            ) {

                throw new Error(
                    `Only a Scheduled election can be opened. The current status is ${
                        election.status ||
                        "unknown"
                    }.`
                );
            }


            // -------------------------------------------------
            // MUST BE PUBLISHED
            // -------------------------------------------------

            if (
                election.is_published !==
                true
            ) {

                throw new Error(
                    "This election must be published before it can be opened."
                );
            }


            // -------------------------------------------------
            // CHECK ALL REQUIRED POSITIONS
            // -------------------------------------------------

            await validateElectionReadyForOpening(
                electionId
            );
        }


        // =================================================
        // CANCELLED ELECTION
        // =================================================

        if (
            election.status ===
            "cancelled" &&
            status !==
            "cancelled"
        ) {

            throw new Error(
                "A cancelled election cannot be reopened."
            );
        }


        // =================================================
        // CLOSED ELECTION
        // =================================================

        if (
            election.status ===
            "closed" &&
            status !==
            "closed"
        ) {

            throw new Error(
                "A closed election cannot be reopened."
            );
        }


        // =================================================
        // OPEN ELECTION
        // =================================================

        if (
            election.status ===
            "open" &&
            status ===
            "draft"
        ) {

            throw new Error(
                "An open election cannot be changed back to draft."
            );
        }


        // =================================================
        // BUILD UPDATE
        // =================================================

        const updateData = {
            status,
        };


        // Save closing timestamp
        if (
            status ===
            "closed"
        ) {

            updateData.closed_at =
                new Date().toISOString();
        }


        // If opening from scheduled,
        // make sure it remains published.
        if (
            status ===
            "open"
        ) {

            updateData.is_published =
                true;
        }


        const {
            data: updatedElection,
            error,
        } = await supabase
            .from("elections")
            .update(
                updateData
            )
            .eq(
                "id",
                electionId
            )
            .select()
            .single();


        if (error) {

            console.error(
                "Supabase update election status error:",
                error
            );


            throw new Error(
                error.message
            );
        }


        return updatedElection;
    };


// =========================================================
// PUBLISH ELECTION
// =========================================================

const publishElection =
    async (
        electionId
    ) => {

        const election =
            await getElectionById(
                electionId
            );


        if (
            election.status ===
            "cancelled"
        ) {

            throw new Error(
                "A cancelled election cannot be published."
            );
        }


        if (
            election.status ===
            "closed"
        ) {

            throw new Error(
                "A closed election cannot be published."
            );
        }


        if (
            election.status ===
            "open"
        ) {

            throw new Error(
                "An open election is already active."
            );
        }


        const {
            data: updatedElection,
            error,
        } = await supabase
            .from("elections")
            .update({

                is_published:
                    true,

                published_at:
                    new Date().toISOString(),

                // draft becomes scheduled
                status:
                    election.status ===
                    "draft"
                        ? "scheduled"
                        : election.status,

            })
            .eq(
                "id",
                electionId
            )
            .select()
            .single();


        if (error) {

            console.error(
                "Supabase publish election error:",
                error
            );


            throw new Error(
                error.message
            );
        }


        return updatedElection;
    };


// =========================================================
// UNPUBLISH ELECTION
// =========================================================

const unpublishElection =
    async (
        electionId
    ) => {

        const election =
            await getElectionById(
                electionId
            );


        // =================================================
        // OPEN
        // =================================================

        if (
            election.status ===
            "open"
        ) {

            throw new Error(
                "An open election cannot be unpublished."
            );
        }


        // =================================================
        // CLOSED
        // =================================================

        if (
            election.status ===
            "closed"
        ) {

            throw new Error(
                "A closed election cannot be unpublished."
            );
        }


        // =================================================
        // CANCELLED
        // =================================================

        if (
            election.status ===
            "cancelled"
        ) {

            throw new Error(
                "A cancelled election cannot be unpublished."
            );
        }


        const {
            data: updatedElection,
            error,
        } = await supabase
            .from("elections")
            .update({

                is_published:
                    false,

                published_at:
                    null,

                // scheduled becomes draft
                status:
                    election.status ===
                    "scheduled"
                        ? "draft"
                        : election.status,

            })
            .eq(
                "id",
                electionId
            )
            .select()
            .single();


        if (error) {

            console.error(
                "Supabase unpublish election error:",
                error
            );


            throw new Error(
                error.message
            );
        }


        return updatedElection;
    };


// =========================================================
// ADD POSITION
// =========================================================

const addPosition = async (
    electionId,
    data
) => {

    const election =
        await getElectionById(
            electionId
        );


    // Positions cannot be modified
    // while voting is open.
    if (
        election.status ===
        "open"
    ) {

        throw new Error(
            "Positions cannot be added while the election is open."
        );
    }


    if (
        election.status ===
        "closed"
    ) {

        throw new Error(
            "Positions cannot be added to a closed election."
        );
    }


    if (
        election.status ===
        "cancelled"
    ) {

        throw new Error(
            "Positions cannot be added to a cancelled election."
        );
    }


    if (
        !data.name ||
        !data.name.trim()
    ) {

        throw new Error(
            "Position name is required."
        );
    }


    const {
        data: position,
        error,
    } = await supabase
        .from("positions")
        .insert({

            election_id:
                electionId,

            name:
                data.name.trim(),

            description:
                data.description?.trim() ||
                "",

            display_order:
                data.order ||
                0,

            is_required:
                data.isRequired !==
                undefined
                    ? data.isRequired
                    : true,

            is_active:
                true,

        })
        .select()
        .single();


    if (error) {

        console.error(
            "Supabase add position error:",
            error
        );


        throw new Error(
            error.message
        );
    }


    // =====================================================
    // POSITION YEAR-LEVEL ACCESS
    // =====================================================

    if (
        Array.isArray(
            data.yearLevelAccess
        ) &&
        data.yearLevelAccess.length >
        0
    ) {

        const rows =
            data.yearLevelAccess.map(
                (yearLevel) => ({

                    position_id:
                        position.id,

                    year_level:
                        yearLevel,

                })
            );


        const {
            error: yearError,
        } = await supabase
            .from(
                "position_year_levels"
            )
            .insert(
                rows
            );


        if (yearError) {

            console.error(
                "Supabase position year-level error:",
                yearError
            );


            // Remove position if
            // year-level configuration fails.
            await supabase
                .from("positions")
                .delete()
                .eq(
                    "id",
                    position.id
                );


            throw new Error(
                yearError.message
            );
        }
    }


    return await getPositionById(
        position.id
    );
};


// =========================================================
// GET POSITION BY ID
// =========================================================

const getPositionById = async (
    positionId
) => {

    const {
        data: position,
        error,
    } = await supabase
        .from("positions")
        .select(`
            *,
            position_year_levels (
                id,
                year_level
            )
        `)
        .eq(
            "id",
            positionId
        )
        .single();


    if (error) {

        if (
            error.code ===
            "PGRST116"
        ) {

            throw new Error(
                "Position not found."
            );
        }


        throw new Error(
            error.message
        );
    }


    return position;
};


// =========================================================
// GET POSITIONS FOR ELECTION
// =========================================================

const getElectionPositions =
    async (
        electionId
    ) => {

        await getElectionById(
            electionId
        );


        const {
            data: positions,
            error,
        } = await supabase
            .from("positions")
            .select(`
                *,
                position_year_levels (
                    id,
                    year_level
                ),
                candidates (
                    id,
                    election_id,
                    student_id,
                    position_id,
                    party_list_id,
                    full_name,
                    profile_picture,
                    platform,
                    approval_status,
                    is_active,
                    created_at,
                    updated_at,
                    party_list:party_lists (
                        id,
                        name,
                        description,
                        logo_url,
                        approval_status,
                        is_active
                    )
                )
            `)
            .eq(
                "election_id",
                electionId
            )
            .order(
                "display_order",
                {
                    ascending:
                        true,
                }
            );


        if (error) {

            console.error(
                "Supabase get positions with candidates error:",
                error
            );


            throw new Error(
                error.message
            );
        }


        // =====================================================
        // BALLOT CANDIDATE RULE
        // =====================================================
        // A candidate appears on the ballot when the EB has
        // added the candidate and the candidate is active.
        // There is no separate candidate-approval workflow.
        //
        // Party-list information is included with each candidate
        // so the Kiosk and Student ballot can display the party
        // when a candidate belongs to one.
        // =====================================================

        const normalizedPositions =
            (positions || []).map(
                (position) => ({

                    ...position,

                    candidates: Array.isArray(
                        position.candidates
                    )
                        ? position.candidates.filter(
                              (candidate) =>
                                  candidate.is_active !== false
                          )
                        : [],
                })
            );


        return normalizedPositions;
    };


// =========================================================
// UPDATE POSITION
// =========================================================

const updatePosition = async (
    positionId,
    data
) => {

    const position =
        await getPositionById(
            positionId
        );


    const election =
        await getElectionById(
            position.election_id
        );


    if (
        election.status ===
        "open"
    ) {

        throw new Error(
            "Positions cannot be modified while the election is open."
        );
    }


    if (
        election.status ===
        "closed"
    ) {

        throw new Error(
            "Positions cannot be modified in a closed election."
        );
    }


    if (
        election.status ===
        "cancelled"
    ) {

        throw new Error(
            "Positions cannot be modified in a cancelled election."
        );
    }


    const updateData = {};


    if (
        data.name !==
        undefined
    ) {

        if (
            !data.name ||
            !data.name.trim()
        ) {

            throw new Error(
                "Position name cannot be empty."
            );
        }


        updateData.name =
            data.name.trim();
    }


    if (
        data.description !==
        undefined
    ) {

        updateData.description =
            data.description?.trim() ||
            "";
    }


    if (
        data.order !==
        undefined
    ) {

        updateData.display_order =
            data.order;
    }


    if (
        data.isRequired !==
        undefined
    ) {

        updateData.is_required =
            data.isRequired;
    }


    if (
        data.isActive !==
        undefined
    ) {

        updateData.is_active =
            data.isActive;
    }


    if (
        Object.keys(
            updateData
        ).length > 0
    ) {

        const {
            error,
        } = await supabase
            .from("positions")
            .update(
                updateData
            )
            .eq(
                "id",
                positionId
            );


        if (error) {

            throw new Error(
                error.message
            );
        }
    }


    // =====================================================
    // UPDATE YEAR-LEVEL ACCESS
    // =====================================================

    if (
        data.yearLevelAccess !==
        undefined
    ) {

        const {
            error: deleteError,
        } = await supabase
            .from(
                "position_year_levels"
            )
            .delete()
            .eq(
                "position_id",
                positionId
            );


        if (deleteError) {

            throw new Error(
                deleteError.message
            );
        }


        if (
            Array.isArray(
                data.yearLevelAccess
            ) &&
            data.yearLevelAccess.length >
            0
        ) {

            const rows =
                data.yearLevelAccess.map(
                    (yearLevel) => ({

                        position_id:
                            positionId,

                        year_level:
                            yearLevel,

                    })
                );


            const {
                error: yearError,
            } = await supabase
                .from(
                    "position_year_levels"
                )
                .insert(
                    rows
                );


            if (yearError) {

                throw new Error(
                    yearError.message
                );
            }
        }
    }


    return await getPositionById(
        positionId
    );
};


// =========================================================
// DEACTIVATE POSITION
// =========================================================

const deactivatePosition =
    async (
        positionId
    ) => {

        const position =
            await getPositionById(
                positionId
            );


        const election =
            await getElectionById(
                position.election_id
            );


        if (
            election.status ===
            "open"
        ) {

            throw new Error(
                "An open election's positions cannot be removed."
            );
        }


        if (
            election.status ===
            "closed"
        ) {

            throw new Error(
                "A closed election's positions cannot be removed."
            );
        }


        if (
            election.status ===
            "cancelled"
        ) {

            throw new Error(
                "A cancelled election's positions cannot be removed."
            );
        }


        const {
            data: updatedPosition,
            error,
        } = await supabase
            .from("positions")
            .update({
                is_active:
                    false,
            })
            .eq(
                "id",
                positionId
            )
            .select()
            .single();


        if (error) {

            throw new Error(
                error.message
            );
        }


        return updatedPosition;
    };


// =========================================================
// DELETE ELECTION
// =========================================================
//
// IMPORTANT:
// An election may have positions that are referenced by
// ballot_votes.position_id.
//
// PostgreSQL will reject deletion of those positions when
// ballot records already exist. Therefore, we check for
// ballot records BEFORE attempting to delete the election.
//
// Rules:
// - Open elections cannot be deleted.
// - Closed/completed elections cannot be deleted because
//   their historical voting records must be preserved.
// - Draft/scheduled/cancelled elections may be deleted only
//   when they have no ballot records.
// =========================================================

const deleteElection = async (
    electionId
) => {

    // -----------------------------------------------------
    // 1. MAKE SURE THE ELECTION EXISTS
    // -----------------------------------------------------

    const election =
        await getElectionById(
            electionId
        );


    if (!election) {

        const error =
            new Error(
                "Election not found."
            );

        error.statusCode = 404;

        throw error;
    }


    // -----------------------------------------------------
    // 2. NEVER DELETE AN OPEN ELECTION
    // -----------------------------------------------------

    if (
        election.status ===
        "open"
    ) {

        const error =
            new Error(
                "An open election cannot be deleted."
            );

        error.statusCode = 409;

        throw error;
    }


    // -----------------------------------------------------
    // 3. NEVER DELETE A CLOSED / COMPLETED ELECTION
    // -----------------------------------------------------
    //
    // A closed election may already contain voting records.
    // Keeping it protects the historical election data.
    // -----------------------------------------------------

    if (
        election.status ===
        "closed"
    ) {

        const error =
            new Error(
                "This completed election cannot be deleted because its historical election records must be preserved."
            );

        error.statusCode = 409;

        error.code =
            "COMPLETED_ELECTION_CANNOT_BE_DELETED";

        throw error;
    }


    // -----------------------------------------------------
    // 4. GET POSITIONS BELONGING TO THIS ELECTION
    // -----------------------------------------------------

    const {
        data: positions,
        error: positionError,
    } = await supabase
        .from("positions")
        .select(`
            id
        `)
        .eq(
            "election_id",
            electionId
        );


    if (positionError) {

        console.error(
            "Supabase election position check error:",
            positionError
        );

        const error =
            new Error(
                positionError.message
            );

        error.statusCode = 500;

        throw error;
    }


    // -----------------------------------------------------
    // 5. CHECK WHETHER BALLOT VOTES EXIST
    // -----------------------------------------------------
    //
    // The database error you received was:
    //
    // update or delete on table "positions"
    // violates foreign key constraint
    // "ballot_votes_position_id_fkey"
    //
    // Therefore, we check ballot_votes.position_id before
    // deleting the election.
    // -----------------------------------------------------

    const positionIds =
        Array.isArray(
            positions
        )
            ? positions
                .map(
                    (position) =>
                        position.id
                )
                .filter(Boolean)
            : [];


    if (
        positionIds.length >
        0
    ) {

        const {
            data: ballotVotes,
            error: ballotVoteError,
        } = await supabase
            .from("ballot_votes")
            .select(`
                id
            `)
            .in(
                "position_id",
                positionIds
            )
            .limit(1);


        if (ballotVoteError) {

            console.error(
                "Supabase ballot vote check error:",
                ballotVoteError
            );

            const error =
                new Error(
                    ballotVoteError.message
                );

            error.statusCode = 500;

            throw error;
        }


        // -------------------------------------------------
        // BALLOT RECORDS ALREADY EXIST
        // -------------------------------------------------

        if (
            Array.isArray(
                ballotVotes
            ) &&
            ballotVotes.length >
                0
        ) {

            const error =
                new Error(
                    "This election cannot be deleted because voting records already exist. Historical election records must be preserved."
                );

            error.statusCode = 409;

            error.code =
                "ELECTION_HAS_BALLOT_RECORDS";

            throw error;
        }
    }


    // -----------------------------------------------------
    // 6. DELETE THE ELECTION
    // -----------------------------------------------------
    //
    // At this point:
    //
    // - The election is not open.
    // - The election is not closed.
    // - No ballot_votes record references its positions.
    //
    // The database can now process the deletion according
    // to the existing foreign-key rules.
    // -----------------------------------------------------

    const {
        error: deleteError,
    } = await supabase
        .from("elections")
        .delete()
        .eq(
            "id",
            electionId
        );


    if (deleteError) {

        console.error(
            "Supabase delete election error:",
            deleteError
        );

        const error =
            new Error(
                deleteError.message
            );

        error.statusCode = 409;

        throw error;
    }


    // -----------------------------------------------------
    // 7. RETURN DELETED ELECTION
    // -----------------------------------------------------

    return {
        id:
            electionId,

        title:
            election.title,
    };
};


// =========================================================
// GET ACTIVE / OPEN ELECTION
// =========================================================

const getActiveElection =
    async () => {

        const {
            data: election,
            error,
        } = await supabase
            .from("elections")
            .select(`
                *,
                election_year_levels (
                    id,
                    year_level
                )
            `)
            .eq(
                "status",
                "open"
            )
            .eq(
                "is_published",
                true
            )
            .order(
                "election_date",
                {
                    ascending:
                        false,
                }
            )
            .limit(
                1
            )
            .maybeSingle();


        if (error) {

            throw new Error(
                error.message
            );
        }


        return election;
    };


// =========================================================
// GET ELECTION CONFIGURATION
// =========================================================

const getElectionConfiguration =
    async (
        electionId
    ) => {

        const election =
            await getElectionById(
                electionId
            );


        const positions =
            await getElectionPositions(
                electionId
            );


        return {

            election,

            positions,

        };
    };


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    createElection,

    getAllElections,

    getElectionById,

    updateElection,

    updateElectionStatus,

    publishElection,

    unpublishElection,

    deleteElection,

    addPosition,

    getPositionById,

    getElectionPositions,

    updatePosition,

    deactivatePosition,

    getActiveElection,

    getElectionConfiguration,

};