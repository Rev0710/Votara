const express = require("express");

const {
    studentLogin,
    changeTemporaryPassword,
    uploadProfilePicture,
    getCurrentStudent,
} = require("../controllers/authController");

const {
    protectStudent,
} = require("../middleware/authMiddleware");

const router = express.Router();


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
    protectStudent,
    changeTemporaryPassword
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