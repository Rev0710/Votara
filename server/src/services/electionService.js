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

const createElection = async (data, userId = null) => {
    const {
        title,
        description = "",
        electionDate,
        startTime,
        endTime,
        yearLevelAccess = [],
    } = data;

    if (!title || !electionDate || !startTime || !endTime) {
        throw new Error(
            "Title, election date, start time, and end time are required."
        );
    }

    const { data: election, error } = await supabase
        .from("elections")
        .insert({
            title: title.trim(),
            description: description?.trim() || "",
            election_date: electionDate,
            start_time: startTime,
            end_time: endTime,

            // Correct initial status
            status: "draft",

            created_by: userId || null,
            is_published: false,
        })
        .select()
        .single();

    if (error) {
        console.error(
            "Supabase create election error:",
            error
        );

        throw new Error(error.message);
    }

    // =====================================================
    // SAVE YEAR-LEVEL ACCESS
    // =====================================================

    if (
        Array.isArray(yearLevelAccess) &&
        yearLevelAccess.length > 0
    ) {
        const yearLevelRows = yearLevelAccess.map(
            (yearLevel) => ({
                election_id: election.id,
                year_level: yearLevel,
            })
        );

        const {
            error: yearLevelError,
        } = await supabase
            .from("election_year_levels")
            .insert(yearLevelRows);

        if (yearLevelError) {
            console.error(
                "Election year-level error:",
                yearLevelError
            );

            // Remove election if configuration fails
            await supabase
                .from("elections")
                .delete()
                .eq("id", election.id);

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
                    ascending: false,
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
            Array.isArray(elections)
                ? elections
                : [];

        if (electionList.length === 0) {
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
                (election) => election.id
            );

        const {
            data: yearLevels,
            error: yearLevelError,
        } = await supabase
            .from("election_year_levels")
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
            Array.isArray(yearLevels)
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
            error.code === "PGRST116"
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
        data.title !== undefined
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
        data.description !== undefined
    ) {
        allowedFields.description =
            data.description?.trim() ||
            "";
    }

    if (
        data.electionDate !== undefined
    ) {
        allowedFields.election_date =
            data.electionDate;
    }

    if (
        data.startTime !== undefined
    ) {
        allowedFields.start_time =
            data.startTime;
    }

    if (
        data.endTime !== undefined
    ) {
        allowedFields.end_time =
            data.endTime;
    }

    // Only update the election if
    // there are actual fields to update.
    if (
        Object.keys(allowedFields).length >
        0
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
                .insert(rows);

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
// UPDATE ELECTION STATUS
// =========================================================

const updateElectionStatus = async (
    electionId,
    status
) => {
    // =====================================================
    // VALIDATE STATUS
    // =====================================================

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

    // =====================================================
    // CANCELLED ELECTION
    // =====================================================

    if (
        election.status ===
            "cancelled" &&
        status !== "cancelled"
    ) {
        throw new Error(
            "A cancelled election cannot be reopened."
        );
    }

    // =====================================================
    // CLOSED ELECTION
    // =====================================================

    if (
        election.status ===
            "closed" &&
        status !== "closed"
    ) {
        throw new Error(
            "A closed election cannot be reopened."
        );
    }

    // =====================================================
    // OPEN ELECTION
    // =====================================================

    if (
        election.status ===
            "open" &&
        status === "draft"
    ) {
        throw new Error(
            "An open election cannot be changed back to draft."
        );
    }

    // =====================================================
    // BUILD UPDATE
    // =====================================================

    const updateData = {
        status,
    };

    // Save closing timestamp
    if (
        status === "closed"
    ) {
        updateData.closed_at =
            new Date().toISOString();
    }

    // If reopening from scheduled to open,
    // make sure it remains published.
    if (
        status === "open"
    ) {
        updateData.is_published = true;
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

const publishElection = async (
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
            is_published: true,

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

const unpublishElection = async (
    electionId
) => {
    const election =
        await getElectionById(
            electionId
        );

    // =====================================================
    // OPEN
    // =====================================================

    if (
        election.status ===
            "open"
    ) {
        throw new Error(
            "An open election cannot be unpublished."
        );
    }

    // =====================================================
    // CLOSED
    // =====================================================

    if (
        election.status ===
            "closed"
    ) {
        throw new Error(
            "A closed election cannot be unpublished."
        );
    }

    // =====================================================
    // CANCELLED
    // =====================================================

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
            is_published: false,
            published_at: null,

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
                data.order || 0,

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
            .insert(rows);

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

const getElectionPositions = async (
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
            )
        `)
        .eq(
            "election_id",
            electionId
        )
        .order(
            "display_order",
            {
                ascending: true,
            }
        );

    if (error) {
        console.error(
            "Supabase get positions error:",
            error
        );

        throw new Error(
            error.message
        );
    }

    return positions || [];
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
        data.name !== undefined
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
        data.order !== undefined
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
        Object.keys(updateData).length >
        0
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
                .insert(rows);

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

const deactivatePosition = async (
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
            is_active: false,
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

const deleteElection = async (
    electionId
) => {

    // Make sure the election exists first.
    const election =
        await getElectionById(
            electionId
        );

    if (!election) {
        throw new Error(
            "Election not found."
        );
    }

    // -----------------------------------------------------
    // Prevent deleting an active election.
    // -----------------------------------------------------

    if (
        election.status ===
        "active"
    ) {
        throw new Error(
            "An active election cannot be deleted."
        );
    }

    // -----------------------------------------------------
    // Delete the election.
    //
    // election_year_levels and other election-related
    // records will follow the database foreign-key rules.
    // -----------------------------------------------------

    const {
        error,
    } = await supabase
        .from("elections")
        .delete()
        .eq(
            "id",
            electionId
        );

    if (error) {

        console.error(
            "Supabase delete election error:",
            error
        );

        throw new Error(
            error.message
        );
    }

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

const getActiveElection = async () => {
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
                ascending: false,
            }
        )
        .limit(1)
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