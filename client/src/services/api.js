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


export const getStudentToken = () => {
    for (const key of ["votaraToken", "votaraStudentToken", "studentToken"]) {
        const token = localStorage.getItem(key);
        if (!token) continue;
        try {
            const parts = token.split(".");
            if (parts.length !== 3) continue;
            const encoded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(atob(encoded + "=".repeat((4 - encoded.length % 4) % 4)));
            // Only select student credentials. Signature and account/session
            // validation remain the server's responsibility.


            if (payload.kiosk === true) continue;

            if (payload.role && payload.role !== "student") continue;
            if (!(payload.studentId || payload.student_id || payload.studentNumber)) continue;
            if (payload.exp && Number(payload.exp) * 1000 <= Date.now()) continue;
            return token;
        } catch {
            // Try a supported legacy student key if this entry is malformed.
        }
    }
    return "";
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

export const getEBToken = () => {

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


export const getSessionIdentity = token => {
    try {
        const encoded = String(token).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const claims = JSON.parse(atob(encoded + "=".repeat((4 - encoded.length % 4) % 4)));
        return {expired: Boolean(claims.exp && Number(claims.exp) * 1000 <= Date.now()), role: claims.role || (claims.studentId || claims.student_id || claims.studentNumber ? "student" : ""),
            id: String(claims.userId || claims.id || claims.studentId || claims.student_id || claims.studentNumber || "")};
    } catch { return {role: "", id: ""}; }
};

export const clearAccountSession = role => {
    const keys = role === "student"
        ? ["votaraToken", "votaraStudentToken", "studentToken", "votaraStudent"]
        : role === "admin" ? ["votaraAdminToken", "votaraAdminUser"]
        : ["votaraEBToken", "votaraEBUser", "votaraKioskToken", "votaraKioskStudent",
            "votaraKioskElectionId", "votaraKioskSessionId", "votaraKioskOperationId", "votaraKioskMode"];
    keys.forEach(key => localStorage.removeItem(key));
    if (role !== "student" && getSessionIdentity(localStorage.getItem("votaraStaffToken")).role === role) {
        localStorage.removeItem("votaraStaffToken");
        localStorage.removeItem("votaraStaffUser");
    }
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

let sessionRedirectStarted = false;

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

        const kioskMode = currentPath.startsWith("/kiosk-voting") &&
            localStorage.getItem("votaraKioskMode") === "true";

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

        const isLoginRequest = /\/(?:admin-auth|staff-auth|eb-auth|auth)\/login(?:\/|$|\?)/.test(normalizedRequestUrl) || normalizedRequestUrl.startsWith("/auth/kiosk-online-access/") || normalizedRequestUrl === "/auth/student-login";
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


        // Student-owned endpoints never use EB/admin/staff credentials.
        // Shared election/candidate endpoints use the active student page's session.
        const isStudentRequest =
            /^\/students(?:\/|$)/.test(normalizedRequestUrl) ||
            /^\/profile(?:\/|$)/.test(normalizedRequestUrl) ||
            /^\/auth\/(?:me|session\/keepalive|student-logout)(?:\/|$)/.test(normalizedRequestUrl);
        const isStudentContext = [
            "/student-dashboard", "/change-password", "/upload-profile-picture", "/vote", "/profile", "/settings",
        ].includes(currentPath);

        const existingAuthorization =
            config.headers?.Authorization ||
            config.headers?.authorization;

        if (isLoginRequest) {
            config.headers?.delete?.("Authorization");
            if (config.headers) { delete config.headers.Authorization; delete config.headers.authorization; }
            return config;
        }
        if (isStudentRequest) {
            config.headers = config.headers || {};
            config.headers.delete?.("Authorization");
            delete config.headers.Authorization;
            delete config.headers.authorization;
            if (studentToken) config.headers.Authorization = "Bearer " + studentToken;
            return config;
        }

        if (existingAuthorization) {
            return config;
        }

        // =================================================
        // LOGIN REQUESTS
        // =================================================
        //
        // Login must not send an old JWT.
        // =================================================



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

        else if (isStudentRequest || isVotingRequest(requestUrl) ||
            (isStudentContext && !isEBRequest && !isAdminRequest && !isKioskRequest(requestUrl))) {
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
const studentContext = ["/student-dashboard", "/change-password", "/upload-profile-picture", "/vote", "/profile", "/settings"].includes(currentPath);
            const adminContext = currentPath === "/admin-dashboard" || currentPath.startsWith("/admin/");
            const role = studentContext ? "student" : isEBContext ? "electoral_board" : adminContext ? "admin" : "";
            const authFailure = error.response.status === 401 ||
                (error.response.status === 403 && /Student access is required|(?:Staff|Administrator|Electoral Board) account is inactive/i.test(error.response.data?.message || ""));
            const authRequest = /\/(?:auth|eb-auth|admin-auth|staff-auth)\/(?:login|register|forgot-password|reset-password)/.test(normalizedRequestUrl) || normalizedRequestUrl.startsWith("/auth/kiosk-online-access/") || normalizedRequestUrl === "/auth/student-login";
            // Ignore an old request that failed after this tab received a newer login/renewal.
            const sentHeader = error.config?.headers?.Authorization || error.config?.headers?.authorization || "";
            const sentToken = String(sentHeader).replace(/^Bearer\s+/i, "");
            const currentToken = role === "student" ? getStudentToken()
                : role === "electoral_board" ? getEBToken() : getAdminToken();
            if (role && authFailure && !authRequest && (!sentToken || !currentToken || sentToken === currentToken)) {
                clearAccountSession(role);
                if (!sessionRedirectStarted) {
                    sessionRedirectStarted = true;
                    window.location.replace(role === "student" ? "/student-login"
                        : role === "electoral_board" ? "/admin-login?role=electoral_board" : "/admin-login");
                }
                return Promise.reject(error);
            }
            console.error(
                "API Error:",
                error.response.status,
                error.response.data
            );

            const kioskMode = currentPath.startsWith("/kiosk-voting") &&
            localStorage.getItem("votaraKioskMode") === "true";

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
                    "Kiosk student session expired. Returning to kiosk student ID entry."
                );

                // Preserve the active kiosk session ID so the kiosk can
                // re-open at student ID entry instead of sending the
                // operator to the Electoral Board dashboard.
                const kioskSessionId =
                    localStorage.getItem("votaraKioskSessionId") ||
                    new URLSearchParams(window.location.search).get("sessionId") ||
                    "";

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
                    const kioskUrl = kioskSessionId
                        ? `/kiosk-voting?sessionId=${encodeURIComponent(kioskSessionId)}`
                        : "/kiosk-voting";
                    window.location.replace(kioskUrl);
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
