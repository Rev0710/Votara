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