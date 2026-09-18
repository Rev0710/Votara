import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    getActiveElection,
    getElectionConfiguration,
    isElectionActive,
} from "../../services/electionService";

import {
    checkVoteStatus,
    submitVote,
} from "../../services/votingService";

import "./StudentDashboard.css";


// =========================================================
// STUDENT VOTING PAGE
// =========================================================

const Vote = () => {
    const navigate = useNavigate();

    // -------------------------------------------------------
    // STATE
    // -------------------------------------------------------

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [election, setElection] = useState(null);
    const [configuration, setConfiguration] = useState(null);

    const [positions, setPositions] = useState([]);
    const [yearLevels, setYearLevels] = useState([]);
    const [candidates, setCandidates] = useState([]);

    const [student, setStudent] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    const [selections, setSelections] = useState({});

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showReview, setShowReview] = useState(false);


    // =====================================================
    // LOAD STUDENT
    // =====================================================

    useEffect(() => {
        try {
            const storedStudent =
                localStorage.getItem("votaraStudent");

            if (storedStudent) {
                setStudent(JSON.parse(storedStudent));
            }
        } catch (error) {
            console.error(
                "Failed to read student session:",
                error
            );
        }
    }, []);


    // =====================================================
    // LOAD ELECTION
    // =====================================================

    useEffect(() => {
        loadVotingData();
    }, []);


    const loadVotingData = async () => {
        try {
            setLoading(true);
            setError("");

            // ------------------------------------------------
            // 1. GET ACTIVE ELECTION
            // ------------------------------------------------

            const activeResponse =
                await getActiveElection();

            if (
                !activeResponse ||
                !activeResponse.success ||
                !activeResponse.election
            ) {
                setError(
                    activeResponse?.message ||
                    "There is currently no active election."
                );

                return;
            }

            const activeElection =
                activeResponse.election;

            // ------------------------------------------------
            // 2. CHECK ACTIVE + PUBLISHED
            // ------------------------------------------------

            if (!isElectionActive(activeElection)) {
                setError(
                    "The election is not currently open for voting."
                );

                return;
            }

            setElection(activeElection);

            const electionId =
                activeElection.id;

            // ------------------------------------------------
            // 3. CHECK IF STUDENT ALREADY VOTED
            // ------------------------------------------------

            const voteStatus =
                await checkVoteStatus(electionId);

            if (voteStatus?.hasVoted) {
                setHasVoted(true);
                return;
            }

            // ------------------------------------------------
            // 4. GET ELECTION CONFIGURATION
            // ------------------------------------------------

            const configResponse =
                await getElectionConfiguration(
                    electionId
                );

            if (
                !configResponse ||
                !configResponse.success
            ) {
                throw new Error(
                    configResponse?.message ||
                    "Unable to load election configuration."
                );
            }

            setConfiguration(configResponse);

            // ------------------------------------------------
            // 5. NORMALIZE CONFIGURATION
            // ------------------------------------------------

            const loadedPositions =
                configResponse.positions ||
                configResponse.configuration?.positions ||
                [];

            const loadedYearLevels =
                configResponse.yearLevels ||
                configResponse.electionYearLevels ||
                configResponse.configuration?.yearLevels ||
                [];

            const loadedCandidates =
                configResponse.candidates ||
                configResponse.configuration?.candidates ||
                [];

            setPositions(
                Array.isArray(loadedPositions)
                    ? loadedPositions
                    : []
            );

            setYearLevels(
                Array.isArray(loadedYearLevels)
                    ? loadedYearLevels
                    : []
            );

            setCandidates(
                Array.isArray(loadedCandidates)
                    ? loadedCandidates
                    : []
            );

        } catch (error) {
            console.error(
                "❌ Failed to load voting data:",
                error
            );

            setError(
                error.response?.data?.message ||
                error.message ||
                "Failed to load the voting page."
            );
        } finally {
            setLoading(false);
        }
    };


    // =====================================================
    // GET STUDENT YEAR LEVEL
    // =====================================================

    const studentYearLevel = useMemo(() => {
        return (
            student?.year_level ||
            student?.yearLevel ||
            ""
        );
    }, [student]);


    // =====================================================
    // NORMALIZE YEAR LEVEL
    // =====================================================

    const normalizeYearLevel = (value) => {
        if (!value) return "";

        const text =
            String(value)
                .trim()
                .toLowerCase();

        if (
            text === "1" ||
            text === "1st" ||
            text === "1st year" ||
            text === "first year"
        ) {
            return "1st Year";
        }

        if (
            text === "2" ||
            text === "2nd" ||
            text === "2nd year" ||
            text === "second year"
        ) {
            return "2nd Year";
        }

        if (
            text === "3" ||
            text === "3rd" ||
            text === "3rd year" ||
            text === "third year"
        ) {
            return "3rd Year";
        }

        if (
            text === "4" ||
            text === "4th" ||
            text === "4th year" ||
            text === "fourth year"
        ) {
            return "4th Year";
        }

        return value;
    };


    const currentYearLevel =
        normalizeYearLevel(studentYearLevel);


    // =====================================================
    // CHECK YEAR-LEVEL ELIGIBILITY
    // =====================================================

    const electionAllowsStudent = useMemo(() => {
        if (!currentYearLevel) {
            return true;
        }

        if (!yearLevels.length) {
            return true;
        }

        return yearLevels.some((item) => {
            const configuredYear =
                item.year_level ||
                item.yearLevel;

            return (
                normalizeYearLevel(
                    configuredYear
                ) === currentYearLevel
            );
        });
    }, [
        yearLevels,
        currentYearLevel,
    ]);


    // =====================================================
    // POSITION ELIGIBILITY
    // =====================================================

    const isPositionEligible = (position) => {
        if (!currentYearLevel) {
            return true;
        }

        /*
         * Some configurations may contain:
         *
         * position.year_levels
         * position.yearLevels
         *
         * or the configuration may already return
         * only the student's eligible positions.
         */

        const configuredYears =
            position.year_levels ||
            position.yearLevels;

        if (
            !configuredYears ||
            !Array.isArray(configuredYears) ||
            configuredYears.length === 0
        ) {
            return true;
        }

        return configuredYears.some((item) => {
            const value =
                typeof item === "string"
                    ? item
                    : item.year_level ||
                      item.yearLevel;

            return (
                normalizeYearLevel(value) ===
                currentYearLevel
            );
        });
    };


    // =====================================================
    // ELIGIBLE POSITIONS
    // =====================================================

    const eligiblePositions = useMemo(() => {
        return positions
            .filter(
                (position) =>
                    position.is_active !== false
            )
            .filter(isPositionEligible)
            .sort(
                (a, b) =>
                    (a.display_order || 0) -
                    (b.display_order || 0)
            );
    }, [
        positions,
        currentYearLevel,
    ]);


    // =====================================================
    // GET POSITION CANDIDATES
    // =====================================================

    const getCandidatesForPosition = (
        positionId
    ) => {
        return candidates.filter((candidate) => {
            const candidatePositionId =
                candidate.position_id ||
                candidate.positionId;

            return (
                candidatePositionId ===
                positionId &&
                candidate.is_active !== false
            );
        });
    };


    // =====================================================
    // SELECT CANDIDATE
    // =====================================================

    const handleCandidateSelect = (
        positionId,
        candidateId
    ) => {
        setSelections((previous) => ({
            ...previous,
            [positionId]: candidateId,
        }));

        setError("");
        setSuccess("");
    };


    // =====================================================
    // REQUIRED POSITION CHECK
    // =====================================================

    const missingRequiredPositions = useMemo(() => {
        return eligiblePositions.filter(
            (position) => {
                if (
                    position.is_required ===
                    false
                ) {
                    return false;
                }

                return !selections[position.id];
            }
        );
    }, [
        eligiblePositions,
        selections,
    ]);


    // =====================================================
    // HANDLE REVIEW
    // =====================================================

    const handleReviewVote = () => {
        setError("");
        setSuccess("");

        if (!election) {
            setError(
                "No active election was found."
            );

            return;
        }

        if (!electionAllowsStudent) {
            setError(
                `You are not eligible to vote in this election because your year level (${currentYearLevel}) is not included.`
            );

            return;
        }

        if (
            missingRequiredPositions.length >
            0
        ) {
            const missingNames =
                missingRequiredPositions
                    .map(
                        (position) =>
                            position.name
                    )
                    .join(", ");

            setError(
                `Please select a candidate for: ${missingNames}.`
            );

            return;
        }

        setShowReview(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    // =====================================================
    // BACK TO BALLOT
    // =====================================================

    const handleBackToBallot = () => {
        setShowReview(false);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    // =====================================================
    // SUBMIT VOTE
    // =====================================================

    const handleSubmitVote = async () => {
        try {
            setSubmitting(true);
            setError("");
            setSuccess("");

            if (!election?.id) {
                throw new Error(
                    "Election information is missing."
                );
            }

            if (
                missingRequiredPositions.length >
                0
            ) {
                throw new Error(
                    "Please complete all required positions before submitting."
                );
            }

            // ----------------------------------------------
            // Convert selection object to backend format
            // ----------------------------------------------

            const formattedSelections =
                eligiblePositions
                    .filter(
                        (position) =>
                            selections[
                                position.id
                            ]
                    )
                    .map((position) => ({
                        positionId:
                            position.id,

                        candidateId:
                            selections[
                                position.id
                            ],
                    }));

            // ----------------------------------------------
            // SUBMIT
            // ----------------------------------------------

            const response =
                await submitVote(
                    election.id,
                    formattedSelections
                );

            if (!response?.success) {
                throw new Error(
                    response?.message ||
                    "Vote submission failed."
                );
            }

            setHasVoted(true);

            setSuccess(
                response.message ||
                "Your vote has been successfully submitted."
            );

            /*
             * Store ballot information only if your
             * application needs it for the success page.
             *
             * Do not store the actual vote selections
             * in localStorage.
             */

            if (response.ballotId) {
                localStorage.setItem(
                    "votaraLastBallotId",
                    response.ballotId
                );
            }

            // ----------------------------------------------
            // Navigate to success page
            // ----------------------------------------------

            setTimeout(() => {
                navigate(
                    "/student-dashboard",
                    {
                        state: {
                            voteSubmitted: true,
                            message:
                                response.message ||
                                "Your vote has been successfully submitted.",
                        },
                    }
                );
            }, 1200);

        } catch (error) {
            console.error(
                "❌ Vote submission error:",
                error
            );

            setError(
                error.response?.data?.message ||
                error.message ||
                "Failed to submit your vote."
            );

            setShowReview(false);

        } finally {
            setSubmitting(false);
        }
    };


    // =====================================================
    // CANCEL / BACK
    // =====================================================

    const handleBack = () => {
        navigate(
            "/student-dashboard"
        );
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {
        return (
            <div className="vote-page">
                <main className="vote-main">
                    <div className="vote-heading">
                        <h1>
                            Loading Election
                        </h1>

                        <p>
                            Please wait while we
                            prepare your ballot...
                        </p>
                    </div>

                    <div className="vote-position-section">
                        <p>
                            Loading election
                            configuration...
                        </p>
                    </div>
                </main>
            </div>
        );
    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error && !election) {
        return (
            <div className="vote-page">
                <main className="vote-main">

                    <div className="vote-heading">
                        <h1>
                            Voting Unavailable
                        </h1>

                        <p>
                            {error}
                        </p>
                    </div>

                    <div className="vote-submit-section">
                        <button
                            type="button"
                            className="submit-vote-button"
                            onClick={
                                handleBack
                            }
                        >
                            Back to Dashboard
                        </button>
                    </div>

                </main>
            </div>
        );
    }


    // =====================================================
    // ALREADY VOTED
    // =====================================================

    if (hasVoted) {
        return (
            <div className="vote-page">
                <main className="vote-main">

                    <div className="vote-heading">
                        <h1>
                            Vote Already Submitted
                        </h1>

                        <p>
                            You have already
                            submitted your vote
                            for this election.
                        </p>
                    </div>

                    <div className="vote-submit-section">
                        <button
                            type="button"
                            className="submit-vote-button"
                            onClick={
                                handleBack
                            }
                        >
                            Return to Dashboard
                        </button>
                    </div>

                </main>
            </div>
        );
    }


    // =====================================================
    // YEAR LEVEL NOT ELIGIBLE
    // =====================================================

    if (
        election &&
        !electionAllowsStudent
    ) {
        return (
            <div className="vote-page">
                <main className="vote-main">

                    <div className="vote-heading">
                        <h1>
                            You Are Not Eligible
                        </h1>

                        <p>
                            Your year level
                            <strong>
                                {" "}
                                {currentYearLevel ||
                                    "Unknown"}
                            </strong>{" "}
                            is not included in
                            this election.
                        </p>
                    </div>

                    <div className="vote-submit-section">
                        <button
                            type="button"
                            className="submit-vote-button"
                            onClick={
                                handleBack
                            }
                        >
                            Back to Dashboard
                        </button>
                    </div>

                </main>
            </div>
        );
    }


    // =====================================================
    // NO POSITIONS
    // =====================================================

    if (
        eligiblePositions.length ===
        0
    ) {
        return (
            <div className="vote-page">
                <main className="vote-main">

                    <div className="vote-heading">
                        <h1>
                            No Voting Positions
                        </h1>

                        <p>
                            No eligible voting
                            positions are currently
                            configured for your
                            year level.
                        </p>
                    </div>

                    <div className="vote-submit-section">
                        <button
                            type="button"
                            className="submit-vote-button"
                            onClick={
                                handleBack
                            }
                        >
                            Back to Dashboard
                        </button>
                    </div>

                </main>
            </div>
        );
    }


    // =====================================================
    // REVIEW SCREEN
    // =====================================================

    if (showReview) {
        return (
            <div className="vote-page">

                <main className="vote-main">

                    <div className="vote-heading">

                        <h1>
                            Review Your Vote
                        </h1>

                        <p>
                            Please carefully
                            review your selections
                            before submitting.
                        </p>

                    </div>


                    {/* ERROR */}

                    {error && (
                        <div
                            className="vote-error"
                            role="alert"
                        >
                            {error}
                        </div>
                    )}


                    {/* ELECTION */}

                    <div className="vote-position-section">

                        <h2 className="vote-position-heading">
                            {election?.title ||
                                "Election"}
                        </h2>

                        {election?.description && (
                            <p>
                                {
                                    election.description
                                }
                            </p>
                        )}

                    </div>


                    {/* REVIEW SELECTIONS */}

                    {eligiblePositions.map(
                        (position) => {

                            const selectedId =
                                selections[
                                    position.id
                                ];

                            const selectedCandidate =
                                getCandidatesForPosition(
                                    position.id
                                ).find(
                                    (candidate) =>
                                        candidate.id ===
                                        selectedId
                                );

                            return (
                                <div
                                    className="vote-position-section"
                                    key={
                                        position.id
                                    }
                                >

                                    <h2 className="vote-position-heading">
                                        {
                                            position.name
                                        }
                                    </h2>

                                    <div className="candidate-card candidate-selected">

                                        <div className="candidate-card-top">

                                            {selectedCandidate?.profile_picture && (
                                                <img
                                                    src={
                                                        selectedCandidate.profile_picture
                                                    }
                                                    alt={
                                                        selectedCandidate.full_name
                                                    }
                                                    className="candidate-image"
                                                />
                                            )}

                                            <div>
                                                <h3>
                                                    {
                                                        selectedCandidate?.full_name ||
                                                        "Selected Candidate"
                                                    }
                                                </h3>

                                                {selectedCandidate?.platform && (
                                                    <p>
                                                        {
                                                            selectedCandidate.platform
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                        </div>

                                    </div>

                                </div>
                            );
                        }
                    )}


                    {/* REVIEW ACTIONS */}

                    <div className="vote-submit-section">

                        <button
                            type="button"
                            className="candidate-details-button"
                            onClick={
                                handleBackToBallot
                            }
                            disabled={
                                submitting
                            }
                        >
                            Back to Ballot
                        </button>

                        <button
                            type="button"
                            className="submit-vote-button"
                            onClick={
                                handleSubmitVote
                            }
                            disabled={
                                submitting
                            }
                        >
                            {submitting
                                ? "Submitting Vote..."
                                : "Confirm & Submit Vote"}
                        </button>

                    </div>

                </main>
            </div>
        );
    }


    // =====================================================
    // MAIN BALLOT
    // =====================================================

    return (
        <div className="vote-page">

            <main className="vote-main">

                {/* =========================================
                    HEADER
                ========================================= */}

                <div className="vote-heading">

                    <h1>
                        {election?.title ||
                            "Student Election"}
                    </h1>

                    <p>
                        Select one candidate
                        for each required
                        position.
                    </p>

                    {currentYearLevel && (
                        <p>
                            Year Level:{" "}
                            <strong>
                                {
                                    currentYearLevel
                                }
                            </strong>
                        </p>
                    )}

                </div>


                {/* =========================================
                    ERROR
                ========================================= */}

                {error && (
                    <div
                        className="vote-error"
                        role="alert"
                    >
                        {error}
                    </div>
                )}


                {/* =========================================
                    SUCCESS
                ========================================= */}

                {success && (
                    <div
                        className="vote-success"
                        role="status"
                    >
                        {success}
                    </div>
                )}


                {/* =========================================
                    ELECTION DESCRIPTION
                ========================================= */}

                {election?.description && (
                    <div className="vote-position-section">

                        <p>
                            {
                                election.description
                            }
                        </p>

                    </div>
                )}


                {/* =========================================
                    POSITIONS
                ========================================= */}

                {eligiblePositions.map(
                    (position) => {

                        const positionCandidates =
                            getCandidatesForPosition(
                                position.id
                            );

                        return (
                            <section
                                className="vote-position-section"
                                key={
                                    position.id
                                }
                            >

                                <h2 className="vote-position-heading">

                                    {
                                        position.name
                                    }

                                    {position.is_required !==
                                        false && (
                                        <span>
                                            {" "}
                                            *
                                        </span>
                                    )}

                                </h2>


                                {position.description && (
                                    <p>
                                        {
                                            position.description
                                        }
                                    </p>
                                )}


                                {/* NO CANDIDATES */}

                                {positionCandidates.length ===
                                    0 ? (
                                    <div className="candidate-grid">

                                        <p>
                                            No active
                                            candidates
                                            are available
                                            for this
                                            position.
                                        </p>

                                    </div>
                                ) : (

                                    /* CANDIDATES */

                                    <div className="candidate-grid">

                                        {positionCandidates.map(
                                            (
                                                candidate
                                            ) => {

                                                const selected =
                                                    selections[
                                                        position.id
                                                    ] ===
                                                    candidate.id;

                                                return (
                                                    <div
                                                        key={
                                                            candidate.id
                                                        }
                                                        className={`candidate-card ${
                                                            selected
                                                                ? "candidate-selected"
                                                                : ""
                                                        }`}
                                                    >

                                                        {/* TOP */}

                                                        <div className="candidate-card-top">

                                                            {candidate.profile_picture ? (
                                                                <img
                                                                    src={
                                                                        candidate.profile_picture
                                                                    }
                                                                    alt={
                                                                        candidate.full_name
                                                                    }
                                                                    className="candidate-image"
                                                                />
                                                            ) : (
                                                                <div className="candidate-image candidate-placeholder">
                                                                    {candidate.full_name
                                                                        ?.charAt(
                                                                            0
                                                                        )
                                                                        ?.toUpperCase() ||
                                                                        "?"}
                                                                </div>
                                                            )}


                                                            <div>

                                                                <h3>
                                                                    {
                                                                        candidate.full_name
                                                                    }
                                                                </h3>

                                                                {candidate.platform && (
                                                                    <p>
                                                                        {
                                                                            candidate.platform
                                                                        }
                                                                    </p>
                                                                )}

                                                            </div>

                                                        </div>


                                                        {/* BOTTOM */}

                                                        <div className="candidate-card-bottom">

                                                            <button
                                                                type="button"
                                                                className="candidate-vote-button"
                                                                onClick={() =>
                                                                    handleCandidateSelect(
                                                                        position.id,
                                                                        candidate.id
                                                                    )
                                                                }
                                                            >
                                                                {selected
                                                                    ? "Selected"
                                                                    : "Vote"}
                                                            </button>

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>
                                )}

                            </section>
                        );
                    }
                )}


                {/* =========================================
                    SUBMIT
                ========================================= */}

                <div className="vote-submit-section">

                    <button
                        type="button"
                        className="candidate-details-button"
                        onClick={
                            handleBack
                        }
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="submit-vote-button"
                        onClick={
                            handleReviewVote
                        }
                        disabled={
                            missingRequiredPositions.length >
                                0 ||
                            submitting
                        }
                    >
                        Review Vote
                    </button>

                </div>

            </main>
        </div>
    );
};


export default Vote;