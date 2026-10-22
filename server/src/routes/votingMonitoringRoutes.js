const express = require("express");

const {
    getVotingMonitoring,
    getElectionTurnoutSummaries,
} = require(
    "../controllers/votingMonitoringController"
);

const router = express.Router();

// =========================================================
// GET VOTING MONITORING
// =========================================================

router.get(
    "/election-turnout",
    getElectionTurnoutSummaries
);

router.get(
    "/",
    getVotingMonitoring
);

module.exports = router;
