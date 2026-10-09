const crypto = require("crypto");

const OTP_TTL_MS = 5 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const otpStore = new Map();
const resetTokenStore = new Map();

const normalizeEmail = (email) =>
    String(email || "").trim().toLowerCase();

const hashValue = (value) =>
    crypto
        .createHash("sha256")
        .update(String(value))
        .digest("hex");

const generateOtp = (email) => {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
        throw new Error("Email is required.");
    }

    const otp = String(crypto.randomInt(100000, 1000000));

    otpStore.set(normalizedEmail, {
        otpHash: hashValue(otp),
        expiresAt: Date.now() + OTP_TTL_MS,
        attempts: 0,
    });

    return otp;
};

const verifyOtp = (email, otp) => {
    const normalizedEmail = normalizeEmail(email);
    const record = otpStore.get(normalizedEmail);

    if (!record) {
        return {
            success: false,
            message: "No active verification code was found. Please request a new code.",
        };
    }

    if (Date.now() > record.expiresAt) {
        otpStore.delete(normalizedEmail);

        return {
            success: false,
            message: "Your verification code has expired. Please request a new code.",
        };
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
        otpStore.delete(normalizedEmail);

        return {
            success: false,
            message: "Too many incorrect attempts. Please request a new code.",
        };
    }

    record.attempts += 1;

    if (hashValue(otp) !== record.otpHash) {
        return {
            success: false,
            message: "The verification code is incorrect.",
        };
    }

    otpStore.delete(normalizedEmail);

    const resetToken = crypto.randomBytes(32).toString("hex");

    resetTokenStore.set(hashValue(resetToken), {
        email: normalizedEmail,
        expiresAt: Date.now() + RESET_TOKEN_TTL_MS,
    });

    return {
        success: true,
        resetToken,
    };
};

const validateResetToken = (email, resetToken) => {
    const normalizedEmail = normalizeEmail(email);
    const tokenHash = hashValue(resetToken);
    const record = resetTokenStore.get(tokenHash);

    if (!record) {
        return false;
    }

    if (
        record.email !== normalizedEmail ||
        Date.now() > record.expiresAt
    ) {
        resetTokenStore.delete(tokenHash);
        return false;
    }

    return true;
};

const consumeResetToken = (email, resetToken) => {
    const normalizedEmail = normalizeEmail(email);
    const tokenHash = hashValue(resetToken);
    const record = resetTokenStore.get(tokenHash);

    if (!record) {
        return false;
    }

    if (
        record.email !== normalizedEmail ||
        Date.now() > record.expiresAt
    ) {
        resetTokenStore.delete(tokenHash);
        return false;
    }

    resetTokenStore.delete(tokenHash);
    return true;
};

const cleanupExpiredEntries = () => {
    const now = Date.now();

    for (const [email, record] of otpStore.entries()) {
        if (now > record.expiresAt) {
            otpStore.delete(email);
        }
    }

    for (const [tokenHash, record] of resetTokenStore.entries()) {
        if (now > record.expiresAt) {
            resetTokenStore.delete(tokenHash);
        }
    }
};

const cleanupTimer = setInterval(
    cleanupExpiredEntries,
    60 * 1000
);

if (typeof cleanupTimer.unref === "function") {
    cleanupTimer.unref();
}

module.exports = {
    generateOtp,
    verifyOtp,
    validateResetToken,
    consumeResetToken,
};
