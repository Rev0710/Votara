const express = require("express");

const {
    getDataManagementStudents,
    importStudentDataset,
    updateStudentEnrollmentStatus,
    archiveStudent,
} = require("../controllers/adminDataManagementController");

const router = express.Router();

// ============================================================
// VOTARA ADMIN — DATA MANAGEMENT
// Mounted in server.js as:
// /api/admin/data-management
// ============================================================

router.get("/students", getDataManagementStudents);

router.post("/students/import", importStudentDataset);

router.patch(
    "/students/:id/enrollment-status",
    updateStudentEnrollmentStatus
);

router.patch(
    "/students/:id/archive",
    archiveStudent
);

module.exports = router;
