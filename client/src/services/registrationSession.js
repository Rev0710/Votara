const keyFor = (studentId, email) => `votaraRegistrationSession:${String(studentId || "").trim()}:${String(email || "").trim().toLowerCase()}`;

export const getRegistrationToken = (studentId, email) => {
    try { return localStorage.getItem(keyFor(studentId, email)) || ""; }
    catch { return ""; }
};

export const saveRegistrationToken = (studentId, email, token) => {
    if (token) localStorage.setItem(keyFor(studentId, email), token);
};

export const registrationHeaders = (studentId, email) => {
    const token = getRegistrationToken(studentId, email);
    return token ? { "X-Registration-Token": token } : {};
};
