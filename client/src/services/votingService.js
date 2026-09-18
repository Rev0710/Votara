import api from "./api";

// =========================================================
// SUBMIT VOTE
// =========================================================

export const submitVote = async (electionId, selections) => {
    const response = await api.post("/voting/submit", {
        electionId,
        selections,
    });

    return response.data;
};

// =========================================================
// CHECK VOTE STATUS
// =========================================================

export const checkVoteStatus = async (electionId) => {
    const response = await api.get(
        `/voting/status/${electionId}`
    );

    return response.data;
};