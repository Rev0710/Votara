const express = require("express");

const {
    getStudentProfile,
    updateStudentProfile,
    changeStudentPassword,
    updateStudentProfilePicture,
    removeStudentProfilePicture,
    deactivateStudentAccount,
    requestStudentAccountDeletion,
} = require("../controllers/studentController");


// =========================================================
// EXISTING STUDENT AUTHENTICATION MIDDLEWARE
// =========================================================
//
// VOTARA already uses authMiddleware.js for student
// authentication.
//
// DO NOT create another student authentication middleware.
// DO NOT modify authMiddleware.js.
// =========================================================

const {
    protectStudent,
} = require("../middleware/authMiddleware");


const router =
    express.Router();


// =========================================================
// STUDENT AUTHENTICATION
// =========================================================
//
// Every route below requires a valid student JWT.
//
// protectStudent places the decoded JWT inside:
// req.student
// =========================================================

router.use(
    protectStudent
);


// =========================================================
// STUDENT PROFILE
// =========================================================

// Get current student's profile
router.get(
    "/profile",
    getStudentProfile
);


// Update current student's profile
router.patch(
    "/profile",
    updateStudentProfile
);


// =========================================================
// PROFILE PICTURE
// =========================================================

// Update profile picture
router.patch(
    "/profile-picture",
    updateStudentProfilePicture
);


// Remove profile picture
router.delete(
    "/profile-picture",
    removeStudentProfilePicture
);


// =========================================================
// PASSWORD
// =========================================================

// Change student password
router.patch(
    "/password",
    changeStudentPassword
);


// =========================================================
// ACCOUNT MANAGEMENT
// =========================================================

// Deactivate account
router.post(
    "/deactivate",
    deactivateStudentAccount
);


// Request account deletion
router.delete(
    "/account",
    requestStudentAccountDeletion
);


// =========================================================
// EXPORT
// =========================================================

module.exports =
    router;