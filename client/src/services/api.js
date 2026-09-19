import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "http://localhost:5000/api",

    headers: {
        "Content-Type": "application/json",
    },
});

// =====================================================
// TOKEN HELPERS
// =====================================================

const getStudentToken = () => {
    return (
        localStorage.getItem("votaraToken") ||
        localStorage.getItem("votaraStudentToken") ||
        localStorage.getItem("studentToken") ||
        ""
    );
};

const getStaffToken = () => {
    return (
        localStorage.getItem("votaraStaffToken") ||
        ""
    );
};

const getEBToken = () => {
    return (
        localStorage.getItem("votaraEBToken") ||
        ""
    );
};

const getKioskToken = () => {
    return (
        localStorage.getItem("votaraKioskToken") ||
        ""
    );
};


// =====================================================
// REQUEST TYPE HELPERS
// =====================================================

const isVotingRequest = (url = "") => {
    const normalizedUrl =
        String(url).toLowerCase();

    return (
        normalizedUrl.includes("/voting/") ||
        normalizedUrl.includes("/voting") ||
        normalizedUrl.includes("/vote/")
    );
};

const isKioskRequest = (url = "") => {
    const normalizedUrl =
        String(url).toLowerCase();

    return (
        normalizedUrl.includes("/kiosk/") ||
        normalizedUrl.includes("/kiosk")
    );
};


// =====================================================
// AUTHENTICATION INTERCEPTOR
// =====================================================

api.interceptors.request.use(
    (config) => {
        const requestUrl =
            config.url || "";

        const kioskMode =
            localStorage.getItem(
                "votaraKioskMode"
            ) === "true";

        const studentToken =
            getStudentToken();

        const ebToken =
            getEBToken();

        const staffToken =
            getStaffToken();

        const kioskToken =
            getKioskToken();

        let token = "";

        // -------------------------------------------------
        // KIOSK VOTING
        // -------------------------------------------------
        //
        // Kiosk students use the temporary kiosk JWT.
        // This must take priority over EB/staff tokens.
        //
        if (
            kioskMode &&
            isVotingRequest(requestUrl) &&
            kioskToken
        ) {
            token = kioskToken;
        }

        // -------------------------------------------------
        // NORMAL STUDENT VOTING
        // -------------------------------------------------
        //
        // /voting/* must ALWAYS use the student JWT.
        //
        else if (
            isVotingRequest(requestUrl) &&
            studentToken
        ) {
            token = studentToken;
        }

        // -------------------------------------------------
        // KIOSK NON-VOTING REQUEST
        // -------------------------------------------------
        //
        // Keep the kiosk token available for kiosk-specific
        // student requests when kiosk mode is active.
        //
        else if (
            kioskMode &&
            isKioskRequest(requestUrl) &&
            kioskToken
        ) {
            token = kioskToken;
        }

        // -------------------------------------------------
        // ELECTORAL BOARD
        // -------------------------------------------------
        //
        // EB-specific API calls use the EB token.
        //
        else if (ebToken) {
            token = ebToken;
        }

        // -------------------------------------------------
        // STAFF / ADMIN
        // -------------------------------------------------
        else if (staffToken) {
            token = staffToken;
        }

        // -------------------------------------------------
        // STUDENT FALLBACK
        // -------------------------------------------------
        else if (studentToken) {
            token = studentToken;
        }

        // -------------------------------------------------
        // ATTACH TOKEN
        // -------------------------------------------------

        if (token) {
            config.headers =
                config.headers || {};

            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
    (response) => {
        return response;
    },

    (error) => {

        if (error.response) {

            console.error(
                "API Error:",
                error.response.status,
                error.response.data
            );

            const requestUrl =
                error.config?.url || "";

            const kioskMode =
                localStorage.getItem(
                    "votaraKioskMode"
                ) === "true";

            const isKioskVotingRequest =
                kioskMode &&
                isVotingRequest(
                    requestUrl
                );

            // ------------------------------------------------
            // KIOSK SESSION EXPIRED
            // ------------------------------------------------

            if (
                (error.response.status ===
                    401 ||
                    error.response.status ===
                    403) &&
                isKioskVotingRequest
            ) {

                console.warn(
                    "Kiosk student session expired."
                );

                localStorage.removeItem(
                    "votaraKioskToken"
                );

                localStorage.removeItem(
                    "votaraKioskStudent"
                );

                localStorage.removeItem(
                    "votaraKioskElectionId"
                );

                localStorage.removeItem(
                    "votaraKioskSessionId"
                );

                localStorage.removeItem(
                    "votaraKioskOperationId"
                );

                localStorage.removeItem(
                    "votaraKioskMode"
                );
            }
        }

        else {
            console.error(
                "API Network Error:",
                error.message
            );
        }

        return Promise.reject(error);
    }
);


export default api;