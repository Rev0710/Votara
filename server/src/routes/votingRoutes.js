const express = require("express");

const router = express.Router();

const {
    submitVote,
    checkVoteStatus,
} = require("../controllers/votingController");

const {
    protectStudent,
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


router.get("/notices", protectStudent, require("../controllers/votingControlController").notices);
module.exports = router;