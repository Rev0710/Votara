const express = require("express");

const {
    registerInitialAdmin,
    loginAdmin,
    keepAdminSession,
} = require("../controllers/adminAuthController");

const router = express.Router();


// =====================================================
// INITIAL ADMIN REGISTRATION
// =====================================================

router.post(
    "/register",
    registerInitialAdmin
);


// =====================================================
// ADMIN LOGIN
//
// Shared Admin / EB login will be handled separately
// after the authentication foundation is completed.
// =====================================================

router.post(
    "/login",
    loginAdmin
);

router.post(
    "/session/keepalive",
    keepAdminSession
);


module.exports = router;
