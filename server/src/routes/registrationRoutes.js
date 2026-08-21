const express = require("express");

const {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP,
} = require("../controllers/registrationController");

const router = express.Router();


// Send OTP
router.post(
    "/send-otp",
    sendRegistrationOTP
);


// Verify OTP
router.post(
    "/verify-otp",
    verifyRegistrationOTP
);


// Resend OTP
router.post(
    "/resend-otp",
    resendRegistrationOTP
);


module.exports = router;