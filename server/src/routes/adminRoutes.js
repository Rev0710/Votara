const express = require("express");

const {
    getAdminDashboard,
    getAdminAccounts,
    getElectoralBoardAccounts,
    createElectoralBoardAccount,
    createAdminAccount,
    activateElectoralBoardAccount,
    deactivateElectoralBoardAccount,
    resetElectoralBoardPassword,
} = require("../controllers/adminController");

const router = express.Router();

// =========================================================
// ADMIN DASHBOARD
// =========================================================

router.get(
    "/dashboard",
    getAdminDashboard
);

// =========================================================
// ADMIN ACCOUNT MANAGEMENT
// =========================================================

// Create additional Admin account
router.post(
    "/admin",
    createAdminAccount
);

// =========================================================
// ELECTORAL BOARD MANAGEMENT
// =========================================================

// Get Electoral Board accounts
router.get(
    "/electoral-board",
    getElectoralBoardAccounts
);

// Create Electoral Board account
router.post(
    "/electoral-board",
    createElectoralBoardAccount
);

// Activate Electoral Board account
router.patch(
    "/electoral-board/:id/activate",
    activateElectoralBoardAccount
);

// Deactivate Electoral Board account
router.patch(
    "/electoral-board/:id/deactivate",
    deactivateElectoralBoardAccount
);

// Reset Electoral Board password
router.post(
    "/electoral-board/:id/reset-password",
    resetElectoralBoardPassword
);

// =====================================================
// ADMIN ACCOUNT MANAGEMENT
// =====================================================

router.get(
    "/admin",
    getAdminAccounts
);

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;