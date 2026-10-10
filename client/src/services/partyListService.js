import api from "./api";

export const getPartyListsForElection = async (electionId) => {
    if (!electionId) {
        throw new Error("Election ID is required.");
    }

    const response = await api.get("/party-lists", {
        params: {
            election_id: electionId,
        },
    });

    return response?.data || {};
};

export const getPartyListCandidates = async (partyListId) => {
    if (!partyListId) {
        throw new Error("Party list ID is required.");
    }

    const response = await api.get(
        `/party-lists/${partyListId}/candidates`
    );

    return response?.data || {};
};