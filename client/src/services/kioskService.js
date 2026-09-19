import api from "./api";

// =========================================================
// KIOSK SERVICE
// =========================================================


// =========================================================
// KIOSK ELECTIONS
// =========================================================

export const getKioskElections = async () => {
    const response = await api.get("/kiosk/elections");
    return response.data;
};


// =========================================================
// SHARED KIOSK SESSION
// =========================================================

export const getActiveKioskSession = async () => {
    const response = await api.get("/kiosk/active");
    return response.data;
};

export const getKioskSessions = async (electionId = "") => {
    const response = await api.get("/kiosk/sessions", {
        params: electionId ? { electionId } : {},
    });

    return response.data;
};

export const startKioskSession = async (electionId) => {
    const response = await api.post("/kiosk/start", {
        electionId,
    });

    return response.data;
};

export const heartbeatKioskSession = async (
    sessionId,
    studentsServedIncrement = 0
) => {
    const response = await api.patch(
        `/kiosk/${sessionId}/heartbeat`,
        {
            studentsServedIncrement,
        }
    );

    return response.data;
};

export const closeKioskSession = async (sessionId) => {
    const response = await api.post(
        `/kiosk/${sessionId}/close`
    );

    return response.data;
};

export const cancelKioskSession = async (sessionId) => {
    const response = await api.post(
        `/kiosk/${sessionId}/cancel`
    );

    return response.data;
};


// =========================================================
// KIOSK OPERATION
// =========================================================
// An operation represents one student currently being:
// - assisted with registration
// - verified
// - or voting
//
// IMPORTANT:
// This is separate from the shared kiosk session.
// Multiple EB members can work under the same session,
// while the system tracks the active student operation.
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
        }
    );

    return response.data;
};

export const heartbeatKioskOperation = async (
    operationId
) => {
    const response = await api.patch(
        `/kiosk/operation/${operationId}/heartbeat`
    );

    return response.data;
};

export const finishKioskOperation = async (
    operationId
) => {
    const response = await api.post(
        `/kiosk/operation/${operationId}/complete`
    );

    return response.data;
};

export const abortKioskOperation = async (
    operationId
) => {
    const response = await api.post(
        `/kiosk/operation/${operationId}/cancel`
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
        }
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
        }
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
        registrationData
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
        }
    );

    return response.data;
};


// =========================================================
// SET PERSONAL PASSWORD
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