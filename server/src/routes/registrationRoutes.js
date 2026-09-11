const express = require("express");

const router = express.Router();

const {
    checkStudent,
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP,
    submitRegistration,

    // Electoral Board
    getEBDashboardStats,
    getEBPendingRegistrations,
    getEBRegistrationDetails,
} = require("../controllers/registrationController");


// =====================================================
// STUDENT REGISTRATION
// =====================================================

// -----------------------------------------------------
// CHECK STUDENT
// -----------------------------------------------------

router.post(
    "/check-student",
    checkStudent
);


// -----------------------------------------------------
// SEND REGISTRATION OTP
// -----------------------------------------------------

router.post(
    "/send-otp",
    sendRegistrationOTP
);


// -----------------------------------------------------
// VERIFY REGISTRATION OTP
// -----------------------------------------------------

router.post(
    "/verify-otp",
    verifyRegistrationOTP
);


// -----------------------------------------------------
// RESEND REGISTRATION OTP
// -----------------------------------------------------

router.post(
    "/resend-otp",
    resendRegistrationOTP
);


// -----------------------------------------------------
// SUBMIT REGISTRATION
//
// OTP verification does NOT mean approval.
//
// After the student completes the registration,
// the application becomes:
//
// pending_review
//
// This is what the Electoral Board will see.
// -----------------------------------------------------

router.post(
    "/submit",
    submitRegistration
);


// =====================================================
// ELECTORAL BOARD
// =====================================================

// -----------------------------------------------------
// EB DASHBOARD STATISTICS
//
// Returns real counts from Supabase.
// -----------------------------------------------------

router.get(
    "/eb/dashboard-stats",
    getEBDashboardStats
);


// -----------------------------------------------------
// EB PENDING REGISTRATIONS
//
// Returns applications with:
//
// application_status = pending_review
// -----------------------------------------------------

router.get(
    "/eb/pending",
    getEBPendingRegistrations
);


// -----------------------------------------------------
// EB REGISTRATION DETAILS
//
// Example:
//
// GET /api/registration/eb/application/<id>
// -----------------------------------------------------

router.get(
    "/eb/application/:id",
    getEBRegistrationDetails
);


module.exports = router;