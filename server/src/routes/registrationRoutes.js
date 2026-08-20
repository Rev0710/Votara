const express = require("express");

const {
    sendRegistrationOTP,
    verifyRegistrationOTP,
} = require("../controllers/registrationController");

const router = express.Router();

/*
========================================
SEND OTP
POST /api/registration/send-otp
========================================
*/
router.post(
    "/send-otp",
    sendRegistrationOTP
);


/*
========================================
VERIFY OTP
POST /api/registration/verify-otp
========================================
*/
router.post(
    "/verify-otp",
    verifyRegistrationOTP
);

module.exports = router;