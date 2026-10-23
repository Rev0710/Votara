const express = require("express");

const router = express.Router();

const {
    submitVote,
    checkVoteStatus,
} = require("../controllers/votingController");

const {
    protectStudent,
} = require("../middleware/authMiddleware");


// =========================================================
// SUBMIT VOTE
// =========================================================

router.post(
    "/submit",
    protectStudent,
    submitVote
);


// =========================================================
// CHECK VOTE STATUS
// =========================================================

router.get(
    "/status/:electionId",
    protectStudent,
    checkVoteStatus
);


router.get("/notices", protectStudent, require("../controllers/votingControlController").notices);
module.exports = router;