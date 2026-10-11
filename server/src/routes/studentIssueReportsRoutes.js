const express = require("express");
const {
    createStudentIssueReport,
    getStudentIssueReports,
    getStudentIssueReportHistory,
} = require("../controllers/studentIssueReportsController");
const router = express.Router();
router.get("/", getStudentIssueReports);
router.post("/", createStudentIssueReport);
router.get("/:id/history", getStudentIssueReportHistory);
module.exports = router;
