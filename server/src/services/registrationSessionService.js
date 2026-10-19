const jwt = require("jsonwebtoken");

const normalizeEmail = value => String(value || "").trim().toLowerCase();
const normalizeId = value => String(value || "").trim();
const audience = "votara-registration";

const issueRegistrationToken = registration => jwt.sign({
    registrationId: registration.id,
    studentId: normalizeId(registration.student_id),
    email: normalizeEmail(registration.email),
    purpose: "registration",
    role: "registration",
}, process.env.JWT_SECRET, { algorithm: "HS256", audience, expiresIn: "7d" });

const readRegistrationToken = req => {
    const token = req.headers["x-registration-token"];
    if (typeof token !== "string" || !token) return null;
    try {
        const claims = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ["HS256"], audience,
        });
        return claims.purpose === "registration" && claims.registrationId ? claims : null;
    } catch {
        return null;
    }
};

const ownsRegistration = (req, registration) => {
    const claims = readRegistrationToken(req);
    return Boolean(claims && String(claims.registrationId) === String(registration.id)
        && claims.studentId === normalizeId(registration.student_id)
        && claims.email === normalizeEmail(registration.email));
};

const requireRegistrationSession = (req, res, next) => {
    const claims = readRegistrationToken(req);
    const input = req.method === "GET" ? req.query : req.body;
    if (!claims || claims.studentId !== normalizeId(input?.studentId)
        || claims.email !== normalizeEmail(input?.email)) {
        return res.status(401).json({ success: false, code: "REGISTRATION_SESSION_REQUIRED",
            message: "Please verify your registration email again before continuing." });
    }
    req.registrationSession = claims;
    return next();
};

module.exports = { issueRegistrationToken, readRegistrationToken, ownsRegistration, requireRegistrationSession };
