const express = require("express");

const {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP,
} = require("../controllers/registrationController");

const router = express.Router();


// ==========================================
// SEND OTP
// ==========================================

router.post(
    "/send-otp",
    sendRegistrationOTP
);


// ==========================================
// VERIFY OTP
// ==========================================

router.post(
    "/verify-otp",
    verifyRegistrationOTP
);


// ==========================================
// RESEND OTP
// ==========================================

router.post(
    "/resend-otp",
    resendRegistrationOTP
);


module.exports = router;