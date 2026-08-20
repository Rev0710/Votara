const express = require("express");

const {
    sendRegistrationOTP,
    verifyRegistrationOTP,
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

module.exports = router;