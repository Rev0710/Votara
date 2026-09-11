const express = require("express");

const {
    loginStaff,
    changeStaffPassword,
} = require("../controllers/staffAuthController");

const router = express.Router();

// =====================================================
// STAFF LOGIN
// =====================================================

router.post(
    "/login",
    loginStaff
);

// =====================================================
// STAFF CHANGE PASSWORD
// =====================================================

router.post(
    "/change-password",
    changeStaffPassword
);

module.exports = router;