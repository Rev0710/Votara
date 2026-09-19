import api from "./api";

/**
 * Get candidates for a specific election.
 *
 * The VOTARA backend exposes candidates through:
 *
 * GET /api/candidates?election_id=:electionId
 *
 * The previous version used:
 *
 * /api/candidates/election/:electionId/approved
 *
 * That route does not exist in the current backend,
 * which caused the 404 error in StudentDashboard.
 */
export const getApprovedCandidatesForElection = async (electionId) => {
    if (!electionId) {
        throw new Error("Election ID is required.");
    }

    const response = await api.get("/candidates", {
        params: {
            election_id: electionId,
        },
    });

    const payload = response?.data || {};

    /*
     * Expected backend response:
     *
     * {
     *     success: true,
     *     count: 3,
     *     candidates: [...]
     * }
     *
     * Return the complete response because the
     * StudentDashboard can use response.candidates.
     */
    return payload;
};


/**
 * Get one candidate by ID.
 */
export const getCandidateById = async (candidateId) => {
    if (!candidateId) {
        throw new Error("Candidate ID is required.");
    }

    const response = await api.get(
        `/candidates/${candidateId}`
    );

    return response.data;
};