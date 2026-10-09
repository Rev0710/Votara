const express = require("express");

const {
    getMaintenanceStatus,
} = require("../controllers/maintenanceStatusController");

const router = express.Router();

// GET /api/system/maintenance-status
// Public: the frontend needs this before a student/non-admin account
// can be shown the normal application.
router.get(
    "/maintenance-status",
    getMaintenanceStatus
);

module.exports = router;
