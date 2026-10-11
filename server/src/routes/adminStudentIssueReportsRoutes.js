const express = require("express");
const {
    getAdminStudentIssueReports,
    updateAdminStudentIssueReport,
    getAdminStudentIssueReportHistory,
} = require("../controllers/studentIssueReportsController");
const router = express.Router();
router.get("/", getAdminStudentIssueReports);
router.patch("/:id", updateAdminStudentIssueReport);
router.get("/:id/history", getAdminStudentIssueReportHistory);
module.exports = router;
