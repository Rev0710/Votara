import axios from "axios";

// =====================================================
// API BASE URL
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (
        import.meta.env.PROD
            ? "https://votara-api-olij.onrender.com/api"
            : "http://localhost:5000/api"
    );

console.log(
    "🌐 VOTARA API BASE URL:",
    API_BASE_URL
);

// =====================================================
// AXIOS INSTANCE
// =====================================================

const api = axios.create({
    baseURL: API_BASE_URL,

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


// =====================================================
// STAFF TOKEN
// =====================================================

const getStaffToken = () => {
    return (
        localStorage.getItem("votaraStaffToken") ||
        ""
    );
};


// =====================================================
// ELECTORAL BOARD TOKEN
// =====================================================
// Older versions may use votaraEBToken.
// The current EB login stores the token in
// votaraStaffToken, so we check both.
//
// We verify the JWT role before using it.
// =====================================================

const getEBToken = () => {

    const candidates = [
        localStorage.getItem("votaraEBToken"),
        localStorage.getItem("votaraStaffToken"),
    ].filter(Boolean);


    for (const token of candidates) {

        try {

            const parts =
                token.split(".");


            if (parts.length !== 3) {
                continue;
            }


            const base64Payload =
                parts[1]
                    .replace(/-/g, "+")
                    .replace(/_/g, "/");


            // Add missing Base64 padding if necessary
            const paddedPayload =
                base64Payload +
                "=".repeat(
                    (4 -
                        (base64Payload.length %
                            4)) %
                        4
                );


            const payload =
                JSON.parse(
                    atob(paddedPayload)
                );


            // Ignore expired tokens
            if (
                payload?.exp &&
                Number(payload.exp) * 1000 <=
                    Date.now()
            ) {
                continue;
            }


            // IMPORTANT:
            // Only accept Electoral Board tokens
            if (
                payload?.role ===
                "electoral_board"
            ) {
                return token;
            }

        } catch (error) {

            console.warn(
                "Unable to inspect possible EB token."
            );

        }

    }


    return "";
};


// =====================================================
// KIOSK TOKEN
// =====================================================

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
        /\/voting(\/|$)/.test(
            normalizedUrl
        ) ||
        /\/vote(\/|$)/.test(
            normalizedUrl
        )
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


        // =================================================
        // IMPORTANT
        // =================================================
        //
        // If a service already supplied an Authorization
        // header, DO NOT overwrite it.
        //
        // This is especially important for kioskService.js,
        // which explicitly supplies the Electoral Board JWT.
        // =================================================

        const existingAuthorization =
            config.headers?.Authorization ||
            config.headers?.authorization;


        if (
            existingAuthorization
        ) {

            return config;

        }


        // =================================================
        // KIOSK VOTING
        // =================================================

        if (
            kioskMode &&
            isVotingRequest(requestUrl) &&
            kioskToken
        ) {

            token = kioskToken;

        }


        // =================================================
        // NORMAL STUDENT VOTING
        // =================================================

        else if (
            isVotingRequest(requestUrl) &&
            studentToken
        ) {

            token = studentToken;

        }


        // =================================================
        // KIOSK NON-VOTING
        // =================================================

        else if (
            kioskMode &&
            isKioskRequest(requestUrl) &&
            kioskToken
        ) {

            token = kioskToken;

        }


        // =================================================
        // ELECTORAL BOARD
        // =================================================
        //
        // IMPORTANT:
        // EB token is checked BEFORE generic staff token.
        //
        // This prevents an Admin token from being sent
        // to Electoral Board endpoints.
        // =================================================

        else if (
            isKioskRequest(requestUrl) &&
            ebToken
        ) {

            token = ebToken;

        }


        else if (ebToken) {

            token = ebToken;

        }


        // =================================================
        // STAFF / ADMIN
        // =================================================

        else if (staffToken) {

            token = staffToken;

        }


        // =================================================
        // STUDENT FALLBACK
        // =================================================

        else if (studentToken) {

            token = studentToken;

        }


        // =================================================
        // ATTACH TOKEN
        // =================================================

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


            // =================================================
            // KIOSK STUDENT SESSION EXPIRED
            // =================================================

            if (
                (
                    error.response.status ===
                        401 ||
                    error.response.status ===
                        403
                ) &&
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


// =====================================================
// EXPORT
// =====================================================

export default api;