const express = require("express");

const {
    getStudentRegistrations,
    getStudentRegistrationById,
} = require("../controllers/ebRegistrationController");

const router = express.Router();

// =========================================================
// GET ALL STUDENT REGISTRATION APPLICATIONS
// =========================================================

router.get(
    "/registrations",
    getStudentRegistrations
);

// =========================================================
// GET SINGLE STUDENT REGISTRATION APPLICATION
// =========================================================

router.get(
    "/registrations/:id",
    getStudentRegistrationById
);

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;