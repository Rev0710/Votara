const express = require("express");

const {
    studentLogin,
    changeTemporaryPassword,
} = require("../controllers/studentAuthController");

const {
    uploadProfilePicture,
    getCurrentStudent,
    forgotPassword,
    verifyForgotPasswordOTP,
    resetPassword,
} = require("../controllers/authController");

const {
    protectStudent,
} = require("../middleware/authMiddleware");


const router =
    express.Router();


// =====================================================
// STUDENT LOGIN
// =====================================================

router.post(
    "/student-login",
    studentLogin
);


// =====================================================
// CHANGE TEMPORARY PASSWORD
// =====================================================

router.post(
    "/change-password",
    changeTemporaryPassword
);



// =====================================================
// FORGOT PASSWORD
// =====================================================

router.post(
    "/forgot-password",
    forgotPassword
);

router.post(
    "/verify-forgot-password-otp",
    verifyForgotPasswordOTP
);

router.post(
    "/reset-password",
    resetPassword
);

// =====================================================
// PROFILE PICTURE
// =====================================================

router.post(
    "/profile-picture",
    protectStudent,
    uploadProfilePicture
);


// =====================================================
// CURRENT STUDENT
// =====================================================

router.get(
    "/me",
    protectStudent,
    getCurrentStudent
);


module.exports = router;