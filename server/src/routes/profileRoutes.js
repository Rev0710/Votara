const express = require("express");

const {
    getStudentProfile,
    updateStudentProfile,
} = require("../controllers/profileController");

const {
    protectStudent,
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// GET STUDENT PROFILE
// =====================================================

router.get(
    "/",
    protectStudent,
    getStudentProfile
);


// =====================================================
// UPDATE STUDENT PROFILE
// =====================================================

router.put(
    "/",
    protectStudent,
    updateStudentProfile
);


module.exports = router;