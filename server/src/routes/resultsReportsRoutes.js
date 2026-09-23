const express = require("express");

const {
    getResultsReports,
    exportResultsReports
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


// =========================================================
// EXPORT RESULTS & REPORTS
// =========================================================

// GET Excel export of election results
router.get(
    "/export",
    exportResultsReports
);


module.exports = router;