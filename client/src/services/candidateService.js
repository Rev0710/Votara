import api from "./api";

export const getApprovedCandidatesForElection = async (electionId) => {
    const response = await api.get(
        `/candidates/election/${electionId}/approved`
    );

    return response.data;
};

export const getCandidateById = async (candidateId) => {
    const response = await api.get(
        `/candidates/${candidateId}`
    );

    return response.data;
};