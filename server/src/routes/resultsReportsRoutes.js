const express = require("express");

const {
    getResultsReports
} = require(
    "../controllers/resultsReportsController"
);

const router = express.Router();

// =========================================================
// RESULTS & REPORTS
// =========================================================

// GET election results and summary reports
router.get(
    "/",
    getResultsReports
);

module.exports = router;