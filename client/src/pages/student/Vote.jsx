import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
    getActiveElection,
    getElectionConfiguration,
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
                setStudent(
                    JSON.parse(storedStudent)
                );
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
            setSuccess("");

            // ------------------------------------------------
            // 1. GET CURRENT ELECTION
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
                    "There is currently no election available."
                );

                return;
            }

            const activeElection =
                activeResponse.election;

            // ------------------------------------------------
            // 2. ELECTION STATUS
            //
            // VOTARA uses:
            // draft
            // scheduled
            // open
            // closed
            // cancelled
            //
            // Only "open" allows voting.
            // ------------------------------------------------

            const electionStatus =
                String(
                    activeElection.status || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                electionStatus !== "open"
            ) {
                setElection(
                    activeElection
                );

                setError(
                    electionStatus ===
                        "scheduled"
                        ? "The election has been scheduled but has not been opened for voting yet."
                        : electionStatus ===
                          "closed"
                        ? "Voting for this election has ended."
                        : electionStatus ===
                          "cancelled"
                        ? "This election has been cancelled."
                        : "The election is not currently open for voting."
                );

                return;
            }

            // ------------------------------------------------
            // 3. PUBLISHED CHECK
            // ------------------------------------------------

            if (
                activeElection.is_published ===
                false
            ) {
                setElection(
                    activeElection
                );

                setError(
                    "This election has not been published for student voting."
                );

                return;
            }

            setElection(
                activeElection
            );

            const electionId =
                activeElection.id;

            // ------------------------------------------------
            // 4. CHECK IF STUDENT ALREADY VOTED
            // ------------------------------------------------

            const voteStatus =
                await checkVoteStatus(
                    electionId
                );

            if (
                voteStatus?.hasVoted
            ) {
                setHasVoted(true);
                return;
            }

            // ------------------------------------------------
            // 5. GET ELECTION CONFIGURATION
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

            setConfiguration(
                configResponse
            );

            // ------------------------------------------------
            // 6. NORMALIZE CONFIGURATION
            // ------------------------------------------------

            const configurationData =
                configResponse.configuration ||
                {};

            const loadedPositions =
                configResponse.positions ||
                configurationData.positions ||
                [];

            const loadedYearLevels =
                configResponse.yearLevels ||
                configResponse.electionYearLevels ||
                configurationData.yearLevels ||
                [];

            /*
             * Candidates can be returned directly or
             * inside configuration.
             */
            const loadedCandidates =
                configResponse.candidates ||
                configurationData.candidates ||
                [];

            setPositions(
                Array.isArray(
                    loadedPositions
                )
                    ? loadedPositions
                    : []
            );

            setYearLevels(
                Array.isArray(
                    loadedYearLevels
                )
                    ? loadedYearLevels
                    : []
            );

            setCandidates(
                Array.isArray(
                    loadedCandidates
                )
                    ? loadedCandidates
                    : []
            );

            // ------------------------------------------------
            // DEBUG INFORMATION
            // ------------------------------------------------

            console.log(
                "VOTARA Voting Data Loaded:",
                {
                    election:
                        activeElection,
                    positions:
                        loadedPositions,
                    yearLevels:
                        loadedYearLevels,
                    candidates:
                        loadedCandidates,
                }
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

    const studentYearLevel =
        useMemo(() => {
            return (
                student?.year_level ||
                student?.yearLevel ||
                ""
            );
        }, [student]);


    // =====================================================
    // NORMALIZE YEAR LEVEL
    // =====================================================

    const normalizeYearLevel = (
        value
    ) => {
        if (!value) {
            return "";
        }

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
        normalizeYearLevel(
            studentYearLevel
        );


    // =====================================================
    // STUDENT YEAR-LEVEL ELIGIBILITY
    // =====================================================

    const electionAllowsStudent =
        useMemo(() => {

            /*
             * VOTARA RULE:
             *
             * 1st Year students cannot vote.
             *
             * Eligible:
             * 2nd Year
             * 3rd Year
             * 4th Year
             */

            if (
                currentYearLevel ===
                "1st Year"
            ) {
                return false;
            }

            if (
                !currentYearLevel
            ) {
                return false;
            }

            if (
                !yearLevels.length
            ) {
                return [
                    "2nd Year",
                    "3rd Year",
                    "4th Year",
                ].includes(
                    currentYearLevel
                );
            }

            return yearLevels.some(
                (item) => {
                    const configuredYear =
                        item?.year_level ||
                        item?.yearLevel;

                    return (
                        normalizeYearLevel(
                            configuredYear
                        ) ===
                        currentYearLevel
                    );
                }
            );

        }, [
            yearLevels,
            currentYearLevel,
        ]);


    // =====================================================
    // POSITION ELIGIBILITY
    // =====================================================

    const isPositionEligible = (
        position
    ) => {

        if (
            currentYearLevel ===
            "1st Year"
        ) {
            return false;
        }

        if (
            !currentYearLevel
        ) {
            return false;
        }

        /*
         * Position may contain:
         *
         * position.year_levels
         * position.yearLevels
         */

        const configuredYears =
            position?.year_levels ||
            position?.yearLevels;

        if (
            !configuredYears ||
            !Array.isArray(
                configuredYears
            ) ||
            configuredYears.length ===
                0
        ) {
            return true;
        }

        return configuredYears.some(
            (item) => {

                const value =
                    typeof item ===
                    "string"
                        ? item
                        : item?.year_level ||
                          item?.yearLevel;

                return (
                    normalizeYearLevel(
                        value
                    ) ===
                    currentYearLevel
                );
            }
        );
    };


    // =====================================================
    // ELIGIBLE POSITIONS
    // =====================================================

    const eligiblePositions =
        useMemo(() => {

            return positions
                .filter(
                    (position) =>
                        position?.is_active !==
                        false
                )
                .filter(
                    isPositionEligible
                )
                .sort(
                    (a, b) =>
                        Number(
                            a?.display_order ||
                                0
                        ) -
                        Number(
                            b?.display_order ||
                                0
                        )
                );

        }, [
            positions,
            currentYearLevel,
        ]);


    // =====================================================
    // NORMALIZE ID
    // =====================================================

    const normalizeId = (
        value
    ) => {
        if (
            value === null ||
            value === undefined
        ) {
            return "";
        }

        return String(
            value
        ).trim();
    };


    // =====================================================
    // GET POSITION ID FROM CANDIDATE
    // =====================================================

    const getCandidatePositionId = (
        candidate
    ) => {
        return (
            candidate?.position_id ||
            candidate?.positionId ||
            candidate?.position?.id ||
            ""
        );
    };


    // =====================================================
    // GET CANDIDATE IMAGE
    // =====================================================

    const getCandidateImage = (
        candidate
    ) => {

        return (
            candidate?.profile_picture ||
            candidate?.profilePicture ||
            candidate?.profile_picture_url ||
            candidate?.profilePictureUrl ||
            candidate?.student?.profile_picture ||
            candidate?.student?.profilePicture ||
            ""
        );
    };


    // =====================================================
    // GET POSITION CANDIDATES
    // =====================================================

    const getCandidatesForPosition = (
        positionId
    ) => {

        const normalizedPositionId =
            normalizeId(
                positionId
            );

        return candidates.filter(
            (candidate) => {

                const candidatePositionId =
                    normalizeId(
                        getCandidatePositionId(
                            candidate
                        )
                    );

                /*
                 * IMPORTANT:
                 *
                 * We DO NOT check:
                 *
                 * candidate.approval_status
                 *
                 * because candidate approval is
                 * no longer required by the VOTARA
                 * voting flow.
                 *
                 * A candidate must simply:
                 *
                 * 1. Belong to the position
                 * 2. Be active
                 */

                return (
                    candidatePositionId ===
                        normalizedPositionId &&
                    candidate?.is_active !==
                        false
                );
            }
        );
    };


    // =====================================================
    // SELECT CANDIDATE
    // =====================================================

    const handleCandidateSelect = (
        positionId,
        candidateId
    ) => {

        const electionStatus =
            String(
                election?.status || ""
            )
                .trim()
                .toLowerCase();

        if (
            electionStatus !==
            "open"
        ) {
            setError(
                "The election is not currently open for voting."
            );

            return;
        }

        if (
            !electionAllowsStudent
        ) {
            setError(
                "You are not eligible to vote in this election."
            );

            return;
        }

        setSelections(
            (previous) => ({
                ...previous,
                [positionId]:
                    candidateId,
            })
        );

        setError("");
        setSuccess("");
    };


    // =====================================================
    // REQUIRED POSITION CHECK
    // =====================================================

    const missingRequiredPositions =
        useMemo(() => {

            return eligiblePositions.filter(
                (position) => {

                    if (
                        position?.is_required ===
                        false
                    ) {
                        return false;
                    }

                    return !selections[
                        position.id
                    ];
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
                "No election was found."
            );

            return;
        }

        const electionStatus =
            String(
                election.status || ""
            )
                .trim()
                .toLowerCase();

        if (
            electionStatus !==
            "open"
        ) {
            setError(
                "The election is not currently open for voting."
            );

            return;
        }

        if (
            !electionAllowsStudent
        ) {
            setError(
                `You are not eligible to vote in this election because your year level (${currentYearLevel}) is not eligible.`
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

        setShowReview(
            true
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    // =====================================================
    // BACK TO BALLOT
    // =====================================================

    const handleBackToBallot =
        () => {

            setShowReview(
                false
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        };


    // =====================================================
    // SUBMIT VOTE
    // =====================================================

    const handleSubmitVote =
        async () => {

            try {

                setSubmitting(
                    true
                );

                setError("");
                setSuccess("");

                if (
                    !election?.id
                ) {
                    throw new Error(
                        "Election information is missing."
                    );
                }

                const electionStatus =
                    String(
                        election.status ||
                            ""
                    )
                        .trim()
                        .toLowerCase();

                if (
                    electionStatus !==
                    "open"
                ) {
                    throw new Error(
                        "The election is no longer open for voting."
                    );
                }

                if (
                    !electionAllowsStudent
                ) {
                    throw new Error(
                        "You are not eligible to vote in this election."
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

                // ------------------------------------------
                // FORMAT SELECTIONS
                // ------------------------------------------

                const formattedSelections =
                    eligiblePositions
                        .filter(
                            (position) =>
                                selections[
                                    position.id
                                ]
                        )
                        .map(
                            (position) => ({
                                positionId:
                                    position.id,

                                candidateId:
                                    selections[
                                        position.id
                                    ],
                            })
                        );

                // ------------------------------------------
                // MAKE SURE EVERY SELECTED CANDIDATE
                // STILL EXISTS AND IS ACTIVE
                // ------------------------------------------

                for (
                    const selection of
                        formattedSelections
                ) {

                    const position =
                        eligiblePositions.find(
                            (item) =>
                                normalizeId(
                                    item.id
                                ) ===
                                normalizeId(
                                    selection.positionId
                                )
                        );

                    if (!position) {
                        throw new Error(
                            "One of your selected positions is no longer available."
                        );
                    }

                    const availableCandidates =
                        getCandidatesForPosition(
                            position.id
                        );

                    const selectedCandidate =
                        availableCandidates.find(
                            (candidate) =>
                                normalizeId(
                                    candidate.id
                                ) ===
                                normalizeId(
                                    selection.candidateId
                                )
                        );

                    if (
                        !selectedCandidate
                    ) {
                        throw new Error(
                            `The selected candidate for ${position.name} is no longer available. Please review your ballot.`
                        );
                    }
                }

                // ------------------------------------------
                // SUBMIT TO BACKEND
                // ------------------------------------------

                const response =
                    await submitVote(
                        election.id,
                        formattedSelections
                    );

                if (
                    !response?.success
                ) {
                    throw new Error(
                        response?.message ||
                        "Vote submission failed."
                    );
                }

                setHasVoted(
                    true
                );

                setSuccess(
                    response.message ||
                    "Your vote has been successfully submitted."
                );

                /*
                 * Store ballot ID only.
                 *
                 * DO NOT store candidate selections
                 * in localStorage.
                 */

                if (
                    response.ballotId
                ) {
                    localStorage.setItem(
                        "votaraLastBallotId",
                        response.ballotId
                    );
                }

                // ------------------------------------------
                // RETURN TO DASHBOARD
                // ------------------------------------------

                setTimeout(
                    () => {

                        navigate(
                            "/student-dashboard",
                            {
                                state: {
                                    voteSubmitted:
                                        true,

                                    message:
                                        response.message ||
                                        "Your vote has been successfully submitted.",
                                },
                            }
                        );

                    },
                    1200
                );

            } catch (error) {

                console.error(
                    "❌ Vote submission error:",
                    error
                );

                setError(
                    error.response?.data
                        ?.message ||
                    error.message ||
                    "Failed to submit your vote."
                );

                setShowReview(
                    false
                );

            } finally {

                setSubmitting(
                    false
                );
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
    // ERROR WITH NO ELECTION
    // =====================================================

    if (
        error &&
        !election
    ) {

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
    // ELECTION NOT OPEN
    // =====================================================

    if (
        election &&
        String(
            election.status || ""
        )
            .trim()
            .toLowerCase() !==
            "open"
    ) {

        const status =
            String(
                election.status || ""
            )
                .trim()
                .toLowerCase();

        const statusTitle =
            status ===
            "scheduled"
                ? "Voting Has Not Opened Yet"
                : status ===
                  "closed"
                ? "Voting Has Ended"
                : status ===
                  "cancelled"
                ? "Election Cancelled"
                : "Voting Unavailable";

        const statusMessage =
            status ===
            "scheduled"
                ? "The Electoral Board has scheduled this election but has not opened voting yet."
                : status ===
                  "closed"
                ? "The Electoral Board has closed voting for this election."
                : status ===
                  "cancelled"
                ? "This election has been cancelled."
                : "This election is not currently available for voting.";

        return (
            <div className="vote-page">

                <main className="vote-main">

                    <div className="vote-heading">

                        <h1>
                            {statusTitle}
                        </h1>

                        <p>
                            {election.title}
                        </p>

                    </div>

                    <div className="vote-position-section">

                        <h2 className="vote-position-heading">
                            {statusTitle}
                        </h2>

                        <p>
                            {statusMessage}
                        </p>

                        {election.election_date && (
                            <p>
                                Election Date:{" "}
                                <strong>
                                    {
                                        election.election_date
                                    }
                                </strong>
                            </p>
                        )}

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
                            is not eligible to
                            vote in this election.
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
                                        normalizeId(
                                            candidate.id
                                        ) ===
                                        normalizeId(
                                            selectedId
                                        )
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

                                            {getCandidateImage(
                                                selectedCandidate
                                            ) ? (
                                                <img
                                                    src={
                                                        getCandidateImage(
                                                            selectedCandidate
                                                        )
                                                    }
                                                    alt={
                                                        selectedCandidate?.full_name ||
                                                        "Selected Candidate"
                                                    }
                                                    className="candidate-image"
                                                />
                                            ) : (
                                                <div className="candidate-image candidate-placeholder">
                                                    {selectedCandidate?.full_name
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
                        You May Now Cast Your Votes!
                    </h1>

                    <p>
                        {election?.title ||
                            "Student Election"}
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
                                                    normalizeId(
                                                        selections[
                                                            position.id
                                                        ]
                                                    ) ===
                                                    normalizeId(
                                                        candidate.id
                                                    );

                                                const candidateImage =
                                                    getCandidateImage(
                                                        candidate
                                                    );

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

                                                            {candidateImage ? (
                                                                <img
                                                                    src={
                                                                        candidateImage
                                                                    }
                                                                    alt={
                                                                        candidate.full_name ||
                                                                        "Candidate"
                                                                    }
                                                                    className="candidate-image"
                                                                    onError={(
                                                                        event
                                                                    ) => {
                                                                        event.currentTarget.style.display =
                                                                            "none";
                                                                    }}
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
                                                                        candidate.full_name ||
                                                                        "Candidate"
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