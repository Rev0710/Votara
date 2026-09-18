const express = require("express");

const {
    getStudentRegistrations,
    getStudentRegistrationById,
    reviewStudentRegistration,
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
// REVIEW STUDENT REGISTRATION APPLICATION
//
// Supported decisions:
// - approve
// - reject
// - request_correction
//
// Endpoint:
// PATCH /api/eb/registrations/:id/review
// =========================================================

router.patch(
    "/registrations/:id/review",
    reviewStudentRegistration
);

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;