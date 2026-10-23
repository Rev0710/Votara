import { registrationHeaders } from "./registrationSession";
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

console.log("🌐 VOTARA API BASE URL:", API_BASE_URL);

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
// ADMIN TOKEN
// =====================================================

const getAdminToken = () => {
    return localStorage.getItem("votaraAdminToken") || "";
};

// =====================================================
// STAFF TOKEN
// =====================================================

const getStaffToken = () => {
    return localStorage.getItem("votaraStaffToken") || "";
};

// =====================================================
// ELECTORAL BOARD TOKEN
// =====================================================
// Current Electoral Board login stores its JWT in
// votaraStaffToken.
//
// Older builds may use votaraEBToken.
//
// We inspect the JWT and only accept a token whose
// role is "electoral_board".
// =====================================================

const getEBToken = () => {

    const candidates = [
        localStorage.getItem("votaraEBToken"),
        localStorage.getItem("votaraStaffToken"),
    ].filter(Boolean);

    for (const token of candidates) {

        try {

            const parts = token.split(".");

            if (parts.length !== 3) {
                continue;
            }

            const base64Payload = parts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const paddedPayload =
                base64Payload +
                "=".repeat(
                    (4 - (base64Payload.length % 4)) % 4
                );

            const payload = JSON.parse(
                atob(paddedPayload)
            );

            // Ignore expired token
            if (
                payload?.exp &&
                Number(payload.exp) * 1000 <= Date.now()
            ) {
                continue;
            }

            // Only accept Electoral Board token
            if (
                payload?.role === "electoral_board"
            ) {
                return token;
            }

        } catch {
            // Ignore invalid JWT candidates
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

let ebSessionRedirectStarted = false;

// =====================================================
// REQUEST TYPE HELPERS
// =====================================================

const isVotingRequest = (url = "") => {

    const normalizedUrl =
        String(url).toLowerCase();

    return (
        /\/voting(\/|$)/.test(normalizedUrl) ||
        /\/vote(\/|$)/.test(normalizedUrl)
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

        const registrationInput = config.data || config.params || {};
        if (String(config.url || "").startsWith("/registration")) {
            config.headers = config.headers || {};
            Object.assign(config.headers, registrationHeaders(registrationInput.studentId, registrationInput.email));
        }

        const requestUrl =
            config.url || "";

        const normalizedRequestUrl =
            String(requestUrl).toLowerCase();

        const currentPath =
            typeof window !== "undefined"
                ? String(
                    window.location.pathname || ""
                ).toLowerCase()
                : "";

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

        // =================================================
        // LOGIN REQUEST
        // =================================================

        const isLoginRequest =
            normalizedRequestUrl.includes(
                "/staff-auth/login"
            ) ||
            normalizedRequestUrl.includes(
                "/eb-auth/login"
            ) ||
            normalizedRequestUrl.includes(
                "/auth/login"
            );

        // =================================================
        // ADMIN REQUEST
        // =================================================

        const isAdminRequest =
            currentPath === "/admin-dashboard" ||
            currentPath === "/admin-login" ||
            currentPath.startsWith("/admin/") ||
            normalizedRequestUrl.startsWith("/admin/") ||
            normalizedRequestUrl.includes(
                "/admin-dashboard"
            );

        // =================================================
        // ELECTORAL BOARD REQUEST
        // =================================================

        const isEBRequest =
            currentPath.startsWith(
                "/electoral-board"
            ) ||
            normalizedRequestUrl.startsWith(
                "/electoral-board"
            ) ||
            normalizedRequestUrl.startsWith(
                "/eb/"
            );

        // =================================================
        // PRESERVE EXPLICIT AUTHORIZATION
        // =================================================
        //
        // kioskService.js explicitly sends the EB JWT.
        //
        // Never overwrite it here.
        // =================================================

        const existingAuthorization =
            config.headers?.Authorization ||
            config.headers?.authorization;

        if (existingAuthorization) {
            return config;
        }

        // =================================================
        // LOGIN REQUESTS
        // =================================================
        //
        // Login must not send an old JWT.
        // =================================================

        if (isLoginRequest) {
            return config;
        }

        let token = "";

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
        // ADMIN
        // =================================================

        else if (
            isAdminRequest &&
            adminToken
        ) {

            token = adminToken;

        }

        // =================================================
        // ELECTORAL BOARD KIOSK
        // =================================================
        //
        // IMPORTANT:
        // Kiosk management must use an EB JWT.
        // =================================================

        else if (
            isKioskRequest(requestUrl) &&
            ebToken
        ) {

            token = ebToken;

        }

        // =================================================
        // ELECTORAL BOARD
        // =================================================

        else if (
            isEBRequest &&
            ebToken
        ) {

            token = ebToken;

        }

        // EB endpoints must never fall through to an admin, generic staff,
        // or student token. Let the server return its normal unauthenticated
        // response when there is no valid Electoral Board session.
        else if (isEBRequest) {

            token = "";

        }

        // =================================================
        // EB FALLBACK
        // =================================================

        else if (ebToken) {

            token = ebToken;

        }

        // =================================================
        // LEGACY STAFF FALLBACK
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
            const requestUrl =
                error.config?.url || "";

            const currentPath = typeof window !== "undefined"
                ? String(window.location.pathname || "").toLowerCase()
                : "";
            const isEBContext = currentPath.startsWith("/electoral-board/");
            const normalizedRequestUrl = String(requestUrl).toLowerCase();
            const isEBAuthRequest = normalizedRequestUrl.includes("/eb-auth/login") ||
                normalizedRequestUrl.includes("/eb-auth/register");

            // An expired or revoked EB session must not leave the workspace
            // making repeated protected requests without a valid token.
            if (isEBContext && error.response.status === 401 && !isEBAuthRequest) {
                localStorage.removeItem("votaraEBToken");
                localStorage.removeItem("votaraEBUser");
                localStorage.removeItem("votaraStaffToken");
                localStorage.removeItem("votaraStaffUser");
                if (!ebSessionRedirectStarted && typeof window !== "undefined") {
                    ebSessionRedirectStarted = true;
                    console.warn("Electoral Board session expired. Redirecting to sign in.");
                    window.location.replace("/electoral-board/login");
                }
                return Promise.reject(error);
            }

            console.error(
                "API Error:",
                error.response.status,
                error.response.data
            );

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
            //
            // Only clear the temporary kiosk STUDENT session.
            //
            // Do NOT delete the Electoral Board login token.
            // =================================================

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

                if (
                    typeof window !== "undefined" &&
                    window.location.pathname.startsWith("/kiosk-voting")
                ) {
                    window.location.replace("/electoral-board/dashboard");
                }

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
