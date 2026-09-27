const express = require("express");

const {
    getStudentRegistry,
    getDataManagementSummary,
    importStudentsCSV,
    updateEnrollmentStatus,
    deactivateStudent,
    activateStudent,
    removeStudent,
} = require("../controllers/adminDataController");

const router = express.Router();

// =========================================================
// ADMIN DATA MANAGEMENT
// Mounted at: /api/admin/data
// =========================================================

router.get(
    "/students",
    getStudentRegistry
);

router.get(
    "/summary",
    getDataManagementSummary
);

router.post(
    "/students/import",
    importStudentsCSV
);

router.patch(
    "/students/:studentId/status",
    updateEnrollmentStatus
);

router.patch(
    "/students/:studentId/deactivate",
    deactivateStudent
);

router.patch(
    "/students/:studentId/activate",
    activateStudent
);

router.patch(
    "/students/:studentId/remove",
    removeStudent
);

module.exports = router;
