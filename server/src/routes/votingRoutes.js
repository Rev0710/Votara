const express = require("express");

const router = express.Router();

const {
    submitVote,
    checkVoteStatus,
} = require("../controllers/votingController");

const {
    protectVotingStudent,
} = require("../middleware/authMiddleware");


// =========================================================
// SUBMIT VOTE
// =========================================================

router.post(
    "/submit",
    protectVotingStudent,
    submitVote
);


// =========================================================
// CHECK VOTE STATUS
// =========================================================

router.get(
    "/status/:electionId",
    protectVotingStudent,
    checkVoteStatus
);


module.exports = router;