const express = require("express");

const {
    getAdminReports,
    exportAdminReports,
} = require("../controllers/adminReportsController");

const router = express.Router();

// GET /api/admin/reports
router.get(
    "/",
    getAdminReports
);

// GET /api/admin/reports/export
router.get(
    "/export",
    exportAdminReports
);

module.exports = router;
