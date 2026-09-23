import api from "./api";

// =========================================================
// GET ALL ELECTIONS
// =========================================================

export const getAllElections = async () => {
    const response = await api.get(
        "/elections"
    );

    return response.data;
};


// =========================================================
// GET ACTIVE ELECTION
// =========================================================

export const getActiveElection = async () => {
    const response = await api.get(
        "/elections/active"
    );

    return response.data;
};


// =========================================================
// GET ELECTION BY ID
// =========================================================

export const getElectionById = async (
    electionId
) => {
    const response = await api.get(
        `/elections/${electionId}`
    );

    return response.data;
};


// =========================================================
// GET ELECTION CONFIGURATION
// =========================================================

export const getElectionConfiguration =
    async (electionId) => {

        const response =
            await api.get(
                `/elections/${electionId}/configuration`
            );

        return response.data;
    };


// =========================================================
// GET ELECTION POSITIONS
// =========================================================

export const getElectionPositions =
    async (electionId) => {

        const response =
            await api.get(
                `/elections/${electionId}/positions`
            );

        return response.data;
    };


// =========================================================
// CREATE ELECTION
// =========================================================

export const createElection =
    async (electionData) => {

        const response =
            await api.post(
                "/elections",
                electionData
            );

        return response.data;
    };


// =========================================================
// UPDATE ELECTION
// =========================================================

export const updateElection =
    async (
        electionId,
        electionData
    ) => {

        const response =
            await api.put(
                `/elections/${electionId}`,
                electionData
            );

        return response.data;
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

const validateElectionReadyForOpening = async (
    electionId
) => {

    // =====================================================
    // GET REQUIRED ACTIVE POSITIONS
    // =====================================================

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
                ascending: true,
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
        Array.isArray(positions)
            ? positions
            : [];


    // =====================================================
    // MAKE SURE POSITIONS EXIST
    // =====================================================

    if (
        requiredPositions.length === 0
    ) {

        throw new Error(
            "This election cannot be opened because no required active positions have been configured yet. Add the required positions first."
        );
    }


    // =====================================================
    // GET ACTIVE CANDIDATES
    // =====================================================

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
        Array.isArray(candidates)
            ? candidates
            : [];


    // =====================================================
    // FIND POSITIONS THAT HAVE CANDIDATES
    // =====================================================

    const candidatePositionIds =
        new Set(
            candidateList.map(
                (candidate) =>
                    String(
                        candidate.position_id
                    )
            )
        );


    // =====================================================
    // FIND MISSING POSITIONS
    // =====================================================

    const missingPositions =
        requiredPositions.filter(
            (position) =>
                !candidatePositionIds.has(
                    String(
                        position.id
                    )
                )
        );


    // =====================================================
    // BLOCK OPENING IF ANY POSITION IS EMPTY
    // =====================================================

    if (
        missingPositions.length > 0
    ) {

        const missingNames =
            missingPositions.map(
                (position) =>
                    position.name
            );

        throw new Error(
            `Election cannot be opened yet. The following required position${
                missingNames.length === 1
                    ? ""
                    : "s"
            } still need an active candidate: ${missingNames.join(
                ", "
            )}.`
        );
    }


    // =====================================================
    // READY
    // =====================================================

    return {
        ready: true,

        requiredPositionCount:
            requiredPositions.length,

        missingPositions: [],
    };
};

// =========================================================
// UPDATE ELECTION STATUS
// =========================================================

export const updateElectionStatus =
    async (
        electionId,
        status
    ) => {

        const response =
            await api.patch(
                `/elections/${electionId}/status`,
                {
                    status,
                }
            );

        return response.data;
    };


// =========================================================
// PUBLISH ELECTION
// =========================================================

export const publishElection =
    async (electionId) => {

        const response =
            await api.patch(
                `/elections/${electionId}/publish`
            );

        return response.data;
    };


// =========================================================
// UNPUBLISH ELECTION
// =========================================================

export const unpublishElection =
    async (electionId) => {

        const response =
            await api.patch(
                `/elections/${electionId}/unpublish`
            );

        return response.data;
    };


// =========================================================
// ADD POSITION
// =========================================================

export const addPosition =
    async (
        electionId,
        positionData
    ) => {

        const response =
            await api.post(
                `/elections/${electionId}/positions`,
                positionData
            );

        return response.data;
    };


// =========================================================
// UPDATE POSITION
// =========================================================

export const updatePosition =
    async (
        positionId,
        positionData
    ) => {

        const response =
            await api.put(
                `/elections/positions/${positionId}`,
                positionData
            );

        return response.data;
    };


// =========================================================
// DEACTIVATE POSITION
// =========================================================

export const deactivatePosition =
    async (positionId) => {

        const response =
            await api.patch(
                `/elections/positions/${positionId}/deactivate`
            );

        return response.data;
    };


// =========================================================
// CHECK FRONTEND ACTIVE STATE
// =========================================================

export const isElectionActive = (
    election
) => {

    return (
        Boolean(election) &&
        election.status ===
            "active" &&
        election.is_published ===
            true
    );
};