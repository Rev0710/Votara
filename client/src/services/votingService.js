import api from "./api";


// =========================================================
// GET STUDENT TOKEN
// =========================================================

const getStudentToken = () => {
    return (
        localStorage.getItem("votaraToken") ||
        localStorage.getItem("votaraStudentToken") ||
        localStorage.getItem("studentToken") ||
        ""
    );
};


// =========================================================
// GET KIOSK TOKEN
// =========================================================

const getKioskToken = () => {
    return (
        localStorage.getItem(
            "votaraKioskToken"
        ) || ""
    );
};


// =========================================================
// CHECK KIOSK MODE
// =========================================================

const isKioskMode = () => {
    return (
        localStorage.getItem(
            "votaraKioskMode"
        ) === "true"
    );
};


// =========================================================
// GET VOTING AUTH CONFIG
// =========================================================
//
// Normal student:
//     votaraToken
//
// Kiosk student:
//     votaraKioskToken
//
// The kiosk token takes priority when kiosk mode
// is active.
// =========================================================

const getVotingAuthConfig = () => {

    const kioskMode =
        isKioskMode();

    const kioskToken =
        getKioskToken();

    const studentToken =
        getStudentToken();

    // Kiosk ballots must always use the temporary token issued by the
    // server for the verified student in the active kiosk session. Never
    // fall back to a regular Student Portal token while kiosk mode is on.
    if (kioskMode && !kioskToken) {
        throw new Error(
            "Kiosk authorization is missing. Return to student ID entry and verify the student again."
        );
    }

    const token = kioskMode ? kioskToken : studentToken;

    if (!token) {
        throw new Error(
            "Student authentication token is missing. Please log in again."
        );
    }

    return {
        headers: {
            Authorization:
                `Bearer ${token}`,
        },
    };
};


// =========================================================
// SUBMIT VOTE
// =========================================================

export const submitVote = async (
    electionId,
    selections
) => {

    if (!electionId) {
        throw new Error(
            "Election ID is required."
        );
    }

    if (
        !Array.isArray(
            selections
        )
    ) {
        throw new Error(
            "Vote selections must be an array."
        );
    }

    const authConfig =
        getVotingAuthConfig();

    const response =
        await api.post(
            "/voting/submit",
            {
                electionId,
                selections,
            },
            authConfig
        );

    return response.data;
};


// =========================================================
// CHECK VOTE STATUS
// =========================================================

export const checkVoteStatus = async (
    electionId
) => {

    if (!electionId) {
        throw new Error(
            "Election ID is required."
        );
    }

    const authConfig =
        getVotingAuthConfig();

    const response =
        await api.get(
            `/voting/status/${electionId}`,
            authConfig
        );

    return response.data;
};