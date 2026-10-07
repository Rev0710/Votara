import axios from "axios";


// =====================================================
// API BASE URL
// =====================================================
//
// Production:
// https://votara-api-olij.onrender.com/api
//
// Local development:
// http://localhost:5000/api
//
// Vercel uses VITE_API_BASE_URL when configured.
// The production fallback prevents localhost from being
// accidentally used when the Vercel environment variable
// is missing.
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (
        import.meta.env.PROD
            ? "https://votara-api-olij.onrender.com/api"
            : "http://localhost:5000/api"
    );


// =====================================================
// DEBUG
// =====================================================

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


const getAdminToken = () => {
    return localStorage.getItem("votaraAdminToken") || "";
};


// Legacy staff token is intentionally retained only as a fallback
// for older non-Admin staff flows. Admin pages use votaraAdminToken.
const getStaffToken = () => {
    return localStorage.getItem("votaraStaffToken") || "";
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


        const adminToken =
            getAdminToken();


        const ebToken =
            getEBToken();


        const staffToken =
            getStaffToken();


        const kioskToken =
            getKioskToken();


        const normalizedRequestUrl =
            String(requestUrl).toLowerCase();

        const currentPath =
            String(window.location.pathname || "").toLowerCase();

        const isLoginRequest =
            normalizedRequestUrl.includes("/staff-auth/login") ||
            normalizedRequestUrl.includes("/eb-auth/login") ||
            normalizedRequestUrl.includes("/auth/login");

        const isAdminRequest =
            currentPath === "/admin-dashboard" ||
            currentPath === "/admin-login" ||
            currentPath.startsWith("/admin/") ||
            normalizedRequestUrl.startsWith("/admin/") ||
            normalizedRequestUrl.includes("/admin-dashboard");

        const isEBRequest =
            currentPath.startsWith("/electoral-board") ||
            normalizedRequestUrl.startsWith("/electoral-board") ||
            normalizedRequestUrl.startsWith("/eb/");


        let token = "";


        // -------------------------------------------------
        // KIOSK VOTING
        // -------------------------------------------------
        //
        // Kiosk students use the temporary kiosk JWT.
        // This must take priority over EB/staff tokens.
        //

        // Login endpoints must NEVER inherit a previous session token.
        if (isLoginRequest) {
            return config;
        }


        // -------------------------------------------------
        // KIOSK VOTING
        // -------------------------------------------------
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
        else if (
            isVotingRequest(requestUrl) &&
            studentToken
        ) {

            token = studentToken;

        }


        // -------------------------------------------------
        // KIOSK NON-VOTING
        // -------------------------------------------------
        else if (
            kioskMode &&
            isKioskRequest(requestUrl) &&
            kioskToken
        ) {

            token = kioskToken;

        }


        // -------------------------------------------------
        // ADMIN
        // -------------------------------------------------
        // Admin token is selected before EB/staff whenever the
        // request originates from an Admin route or /admin/* API.
        else if (
            isAdminRequest &&
            adminToken
        ) {

            token = adminToken;

        }


        // -------------------------------------------------
        // ELECTORAL BOARD
        // -------------------------------------------------
        else if (
            isEBRequest &&
            ebToken
        ) {

            token = ebToken;

        }


        // -------------------------------------------------
        // LEGACY STAFF FALLBACK
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
                (
                    error.response.status === 401 ||
                    error.response.status === 403
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