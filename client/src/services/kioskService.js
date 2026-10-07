import api from "./api";

// =========================================================
// KIOSK SERVICE
// =========================================================

// =========================================================
// ELECTORAL BOARD AUTHENTICATION
// =========================================================

const getEBAuthToken = () => {
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

            const base64 = parts[1]
                .replace(/-/g, "+")
                .replace(/_/g, "/");

            const payload = JSON.parse(atob(base64));

            // Ignore expired tokens
            if (
                payload?.exp &&
                Number(payload.exp) * 1000 <= Date.now()
            ) {
                continue;
            }

            // Only use Electoral Board token
            if (payload?.role === "electoral_board") {
                return token;
            }
        } catch {
            // Ignore malformed tokens
        }
    }

    return null;
};

// =========================================================
// AUTHORIZED REQUEST CONFIG
// =========================================================

const getEBRequestConfig = () => {
    const token = getEBAuthToken();

    if (!token) {
        const error = new Error(
            "Electoral Board authentication is required. Please log in again."
        );

        error.code = "EB_AUTH_REQUIRED";
        error.statusCode = 401;

        throw error;
    }

    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// =========================================================
// KIOSK ELECTIONS
// =========================================================

export const getKioskElections = async () => {
    const response = await api.get(
        "/kiosk/elections",
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// ACTIVE KIOSK SESSION
// =========================================================

export const getActiveKioskSession = async () => {
    const response = await api.get(
        "/kiosk/active",
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// KIOSK SESSIONS
// =========================================================

export const getKioskSessions = async (electionId = "") => {
    const response = await api.get(
        "/kiosk/sessions",
        {
            ...getEBRequestConfig(),
            params: electionId
                ? { electionId }
                : {},
        }
    );

    return response.data;
};

// =========================================================
// START KIOSK SESSION
// =========================================================

export const startKioskSession = async (electionId) => {
    const response = await api.post(
        "/kiosk/start",
        { electionId },
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// HEARTBEAT KIOSK SESSION
// =========================================================

export const heartbeatKioskSession = async (
    sessionId,
    studentsServedIncrement = 0
) => {
    const response = await api.patch(
        `/kiosk/${sessionId}/heartbeat`,
        { studentsServedIncrement },
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// CLOSE KIOSK SESSION
// =========================================================

export const closeKioskSession = async (sessionId) => {
    const response = await api.post(
        `/kiosk/${sessionId}/close`,
        {},
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// CANCEL KIOSK SESSION
// =========================================================

export const cancelKioskSession = async (sessionId) => {
    const response = await api.post(
        `/kiosk/${sessionId}/cancel`,
        {},
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// KIOSK OPERATION
// =========================================================

export const startKioskOperation = async ({
    sessionId,
    operationType,
}) => {
    const response = await api.post(
        "/kiosk/operation/start",
        {
            sessionId,
            operationType,
        },
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// HEARTBEAT KIOSK OPERATION
// =========================================================

export const heartbeatKioskOperation = async (operationId) => {
    const response = await api.patch(
        `/kiosk/operation/${operationId}/heartbeat`,
        {},
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// FINISH KIOSK OPERATION
// =========================================================

export const finishKioskOperation = async (operationId) => {
    const response = await api.post(
        `/kiosk/operation/${operationId}/complete`,
        {},
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// ABORT KIOSK OPERATION
// =========================================================

export const abortKioskOperation = async (operationId) => {
    const response = await api.post(
        `/kiosk/operation/${operationId}/cancel`,
        {},
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// STUDENT VERIFICATION
// =========================================================

export const verifyKioskStudent = async (
    sessionId,
    studentId
) => {
    const response = await api.post(
        "/kiosk/verify-student",
        {
            sessionId,
            studentId,
        },
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// AUTHORIZE EXISTING STUDENT
// =========================================================

export const authorizeKioskStudent = async (
    sessionId,
    studentId
) => {
    const response = await api.post(
        "/kiosk/authorize-student",
        {
            sessionId,
            studentId,
        },
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// KIOSK REGISTRATION
// =========================================================

export const submitKioskRegistration = async (
    registrationData
) => {
    const response = await api.post(
        "/kiosk/registration/submit",
        registrationData,
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// APPROVE KIOSK REGISTRATION
// =========================================================

export const approveKioskRegistration = async ({
    registrationId,
    sessionId,
    operationId,
}) => {
    const response = await api.post(
        "/kiosk/registration/approve",
        {
            registrationId,
            sessionId,
            operationId,
        },
        getEBRequestConfig()
    );

    return response.data;
};

// =========================================================
// SET PERSONAL PASSWORD
// =========================================================
// This endpoint uses the student's activation token,
// not the Electoral Board JWT.
// =========================================================

export const setKioskPersonalPassword = async (
    activationToken,
    password
) => {
    const response = await api.post(
        "/kiosk/registration/set-password",
        {
            activationToken,
            password,
        }
    );

    return response.data;
};