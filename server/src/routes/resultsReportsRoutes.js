const express = require("express");

const {
    getResultsReports,
    exportResultsReports,
    releaseElectionResults
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

// GET downloadable PDF export of election results
router.get(
    "/export",
    exportResultsReports
);

router.post(
    "/release",
    releaseElectionResults
);


module.exports = router;
