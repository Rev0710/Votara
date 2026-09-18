const crypto = require("crypto");
const supabase = require("../config/supabase");

// =========================================================
// GENERATE BALLOT TOKEN HASH
// =========================================================

const generateBallotTokenHash = () => {
    const token = crypto.randomBytes(32).toString("hex");

    const hash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    return {
        token,
        hash,
    };
};


// =========================================================
// SUBMIT VOTE
// =========================================================

const submitVote = async ({
    electionId,
    studentId,
    selections,
}) => {

    if (!electionId) {
        throw new Error(
            "Election ID is required."
        );
    }

    if (!studentId) {
        throw new Error(
            "Student ID is required."
        );
    }

    if (
        !Array.isArray(selections) ||
        selections.length === 0
    ) {
        throw new Error(
            "At least one vote selection is required."
        );
    }


    // -----------------------------------------------------
    // Validate selection structure
    // -----------------------------------------------------

    const normalizedSelections =
        selections.map((selection) => {

            if (
                !selection.positionId ||
                !selection.candidateId
            ) {
                throw new Error(
                    "Each vote selection must contain a positionId and candidateId."
                );
            }

            return {
                positionId:
                    selection.positionId,
                candidateId:
                    selection.candidateId,
            };
        });


    // -----------------------------------------------------
    // Prevent duplicate positions in request
    // -----------------------------------------------------

    const positionIds =
        normalizedSelections.map(
            (selection) =>
                selection.positionId
        );

    const uniquePositionIds =
        new Set(positionIds);

    if (
        uniquePositionIds.size !==
        positionIds.length
    ) {
        throw new Error(
            "A position cannot have multiple selections."
        );
    }


    // -----------------------------------------------------
    // Generate ballot token
    // -----------------------------------------------------

    const {
        token,
        hash,
    } = generateBallotTokenHash();


    // -----------------------------------------------------
    // Submit through Supabase RPC
    // -----------------------------------------------------

    const {
        data,
        error,
    } = await supabase.rpc(
        "submit_votara_vote",
        {
            p_election_id:
                electionId,

            p_student_id:
                studentId,

            p_selections:
                normalizedSelections,

            p_ballot_token_hash:
                hash,
        }
    );


    if (error) {
        console.error(
            "Vote submission RPC error:",
            error
        );

        throw new Error(
            error.message
        );
    }


    if (
        !data ||
        data.success !== true
    ) {
        throw new Error(
            "Vote submission failed."
        );
    }


    return {
        success: true,

        ballotId:
            data.ballotId,

        // This token can later be used to
        // generate the student's QR receipt.
        ballotToken:
            token,

        message:
            data.message ||
            "Vote submitted successfully.",
    };
};


// =========================================================
// CHECK WHETHER STUDENT ALREADY VOTED
// =========================================================

const checkVoteStatus = async ({
    electionId,
    studentId,
}) => {

    const {
        data,
        error,
    } = await supabase
        .from("vote_participations")
        .select(
            "id, has_voted, voted_at"
        )
        .eq(
            "election_id",
            electionId
        )
        .eq(
            "student_id",
            studentId
        )
        .maybeSingle();


    if (error) {
        throw new Error(
            error.message
        );
    }


    return {
        hasVoted:
            data?.has_voted === true,

        votedAt:
            data?.voted_at || null,
    };
};


module.exports = {
    submitVote,
    checkVoteStatus,
};