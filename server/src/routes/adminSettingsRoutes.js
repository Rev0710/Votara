const express = require("express");

const {
    getAdminSystemSettings,
    updateAdminSystemSettings,
} = require(
    "../controllers/adminSettingsController"
);


const router =
    express.Router();


// =========================================================
// GET ADMIN SYSTEM SETTINGS
// GET /api/admin/settings
// =========================================================

router.get(
    "/",
    getAdminSystemSettings
);


// =========================================================
// UPDATE ADMIN SYSTEM SETTINGS
// PUT /api/admin/settings
// =========================================================

router.put(
    "/",
    updateAdminSystemSettings
);


// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;