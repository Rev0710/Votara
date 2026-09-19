const express = require("express");

const {
    getVotingMonitoring
} = require(
    "../controllers/votingMonitoringController"
);

const router = express.Router();

// =========================================================
// GET VOTING MONITORING
// =========================================================

router.get(
    "/",
    getVotingMonitoring
);

module.exports = router;