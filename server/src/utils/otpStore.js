const otpStore = new Map();

const saveOTP = (email, otp, studentId) => {
    otpStore.set(email.toLowerCase().trim(), {
        otp: String(otp),
        studentId,
        expiresAt: Date.now() + 5 * 60 * 1000,
    });
};

const getOTP = (email) => {
    return otpStore.get(email.toLowerCase().trim());
};

const deleteOTP = (email) => {
    otpStore.delete(email.toLowerCase().trim());
};

module.exports = {
    saveOTP,
    getOTP,
    deleteOTP,
};