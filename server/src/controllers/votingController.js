const votingService = require("../services/votingService");

// =========================================================
// SUBMIT VOTE
// =========================================================

const submitVote = async (req, res) => {
    try {
        const {
            electionId,
            selections,
        } = req.body;

        // -------------------------------------------------
        // Get authenticated student
        // -------------------------------------------------
        // protectStudent places the decoded JWT inside:
        // req.student
        //
        // JWT structure:
        // {
        //     id: student.id,
        //     studentId: student.student_id,
        //     role: "student"
        // }
        //
        // For database voting, use students.id (UUID).
        // -------------------------------------------------

        const studentId = req.student?.id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });
        }

        // -------------------------------------------------
        // Basic request validation
        // -------------------------------------------------

        if (!electionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Election ID is required.",
            });
        }

        if (!Array.isArray(selections)) {
            return res.status(400).json({
                success: false,
                message:
                    "Vote selections must be provided.",
            });
        }

        // -------------------------------------------------
        // Submit vote
        // -------------------------------------------------

        const result =
            await votingService.submitVote({
                electionId,
                studentId,
                selections,
            });

        // -------------------------------------------------
        // Success response
        // -------------------------------------------------

        return res.status(201).json({
            success: true,

            message:
                result.message,

            ballotId:
                result.ballotId,

            ballotToken:
                result.ballotToken,
        });

    } catch (error) {

        console.error(
            "❌ Submit vote error:",
            error
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to submit vote.",
        });
    }
};


// =========================================================
// CHECK VOTE STATUS
// =========================================================

const checkVoteStatus = async (req, res) => {
    try {

        // -------------------------------------------------
        // Get authenticated student
        // -------------------------------------------------

        const studentId = req.student?.id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message:
                    "Student authentication is required.",
            });
        }

        const {
            electionId,
        } = req.params;

        // -------------------------------------------------
        // Validate election ID
        // -------------------------------------------------

        if (!electionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Election ID is required.",
            });
        }

        // -------------------------------------------------
        // Check voting status
        // -------------------------------------------------

        const result =
            await votingService.checkVoteStatus({
                electionId,
                studentId,
            });

        // -------------------------------------------------
        // Return status
        // -------------------------------------------------

        return res.status(200).json({
            success: true,

            hasVoted:
                result.hasVoted,

            votedAt:
                result.votedAt,
        });

    } catch (error) {

        console.error(
            "❌ Check vote status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to check voting status.",
        });
    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    submitVote,
    checkVoteStatus,
};