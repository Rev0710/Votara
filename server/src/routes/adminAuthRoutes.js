const express = require("express");
const rateLimit = require("express-rate-limit");

const {
    registerInitialAdmin,
    loginAdmin,
    keepAdminSession,
    requestAdminPasswordReset,
    verifyAdminPasswordResetOtp,
    resetAdminPassword,
} = require("../controllers/adminAuthController");

const router = express.Router();
const adminRecoveryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many password recovery attempts. Please try again later." },
});


// =====================================================
// INITIAL ADMIN REGISTRATION
// =====================================================

router.post(
    "/register",
    registerInitialAdmin
);


// =====================================================
// ADMIN LOGIN
//
// Shared Admin / EB login will be handled separately
// after the authentication foundation is completed.
// =====================================================

router.post(
    "/login",
    loginAdmin
);

router.post("/forgot-password", adminRecoveryLimiter, requestAdminPasswordReset);
router.post("/verify-forgot-password-otp", adminRecoveryLimiter, verifyAdminPasswordResetOtp);
router.post("/reset-password", adminRecoveryLimiter, resetAdminPassword);

router.post(
    "/session/keepalive",
    keepAdminSession
);


module.exports = router;
