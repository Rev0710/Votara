const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateEB = async (req) => {
    const authHeader = req.headers.authorization;

    if (
        !authHeader ||
        !authHeader.startsWith("Bearer ")
    ) {
        throw new Error(
            "Authentication token is required."
        );
    }

    const token =
        authHeader.split(" ")[1];

    if (!token) {
        throw new Error(
            "Authentication token is required."
        );
    }

    const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    if (
        !decoded ||
        decoded.role !== "electoral_board"
    ) {
        throw new Error(
            "Electoral Board access is required."
        );
    }

    if (!decoded.userId) {
        throw new Error(
            "Invalid Electoral Board account."
        );
    }

    const {
        data: staff,
        error
    } = await supabase
        .from("staff_users")
        .select(
            `
            id,
            full_name,
            email,
            role,
            is_active
            `
        )
        .eq(
            "id",
            decoded.userId
        )
        .eq(
            "role",
            "electoral_board"
        )
        .eq(
            "is_active",
            true
        )
        .maybeSingle();

    if (error) {
        console.error(
            "EB authentication database error:",
            error
        );

        throw new Error(
            "Unable to verify Electoral Board account."
        );
    }

    if (!staff) {
        throw new Error(
            "Electoral Board account is inactive or unavailable."
        );
    }

    return staff;
};

// =========================================================
// GET RESULTS & REPORTS
// =========================================================

const getResultsReports = async (
    req,
    res
) => {

    try {

        // -------------------------------------------------
        // AUTHENTICATION
        // -------------------------------------------------

        await authenticateEB(req);

        // -------------------------------------------------
        // OPTIONAL ELECTION ID
        // -------------------------------------------------

        const requestedElectionId =
            req.query.election_id ||
            req.query.electionId ||
            null;

        // -------------------------------------------------
        // GET ELECTIONS
        // -------------------------------------------------

        const {
            data: elections,
            error: electionsError
        } = await supabase
            .from("elections")
            .select(
                `
                id,
                title,
                description,
                election_date,
                start_time,
                end_time,
                status,
                is_published,
                published_at,
                closed_at,
                created_at
                `
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (electionsError) {
            throw electionsError;
        }

        if (
            !elections ||
            elections.length === 0
        ) {

            return res.json({
                success: true,
                election: null,
                elections: [],
                statistics: {
                    eligibleVoters: 0,
                    votersWhoVoted: 0,
                    remainingVoters: 0,
                    turnoutPercentage: 0,
                    submittedBallots: 0
                },
                positions: [],
                generatedAt:
                    new Date().toISOString()
            });
        }

        // -------------------------------------------------
        // SELECT ELECTION
        // -------------------------------------------------

        let election = null;

        if (requestedElectionId) {

            election =
                elections.find(
                    (item) =>
                        item.id ===
                        requestedElectionId
                ) || null;
        }

        // If no specific election was requested,
        // prefer the latest closed election,
        // otherwise active/scheduled/draft/latest.
        if (!election) {

            election =
                elections.find(
                    (item) =>
                        item.status === "closed"
                ) ||
                elections.find(
                    (item) =>
                        item.status === "active"
                ) ||
                elections.find(
                    (item) =>
                        item.status === "scheduled"
                ) ||
                elections[0];
        }

        // -------------------------------------------------
        // GET ELECTION YEAR LEVELS
        // -------------------------------------------------

        const {
            data: yearLevelRows,
            error: yearLevelError
        } = await supabase
            .from("election_year_levels")
            .select(
                `
                id,
                year_level
                `
            )
            .eq(
                "election_id",
                election.id
            );

        if (yearLevelError) {
            throw yearLevelError;
        }

        // VOTARA voting rule:
        // 1st Year students do NOT vote.
        const eligibleYearLevels =
            (yearLevelRows || [])
                .filter(
                    (item) =>
                        item.year_level !==
                        "1st Year"
                );

        // -------------------------------------------------
        // COUNT ELIGIBLE STUDENTS
        // -------------------------------------------------

        let eligibleVoters = 0;

        const allowedYearLevels =
            eligibleYearLevels.map(
                (item) =>
                    item.year_level
            );

        if (
            allowedYearLevels.length > 0
        ) {

            const {
                count,
                error: studentCountError
            } = await supabase
                .from("students")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .in(
                    "year_level",
                    allowedYearLevels
                );

            if (studentCountError) {
                throw studentCountError;
            }

            eligibleVoters =
                count || 0;
        }

        // -------------------------------------------------
        // COUNT VOTERS WHO VOTED
        // -------------------------------------------------

        const {
            count: votersWhoVoted,
            error: participationError
        } = await supabase
            .from("vote_participations")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "election_id",
                election.id
            )
            .eq(
                "has_voted",
                true
            );

        if (participationError) {
            throw participationError;
        }

        const totalVotersWhoVoted =
            votersWhoVoted || 0;

        // -------------------------------------------------
        // COUNT SUBMITTED BALLOTS
        // -------------------------------------------------

        const {
            count: submittedBallots,
            error: ballotsError
        } = await supabase
            .from("ballots")
            .select(
                "id",
                {
                    count: "exact",
                    head: true
                }
            )
            .eq(
                "election_id",
                election.id
            )
            .eq(
                "status",
                "submitted"
            );

        if (ballotsError) {
            throw ballotsError;
        }

        const totalSubmittedBallots =
            submittedBallots || 0;

        // -------------------------------------------------
        // TURNOUT
        // -------------------------------------------------

        const remainingVoters =
            Math.max(
                eligibleVoters -
                totalVotersWhoVoted,
                0
            );

        const turnoutPercentage =
            eligibleVoters > 0
                ? Number(
                    (
                        (
                            totalVotersWhoVoted /
                            eligibleVoters
                        ) * 100
                    ).toFixed(2)
                )
                : 0;

        // -------------------------------------------------
        // GET POSITIONS
        // -------------------------------------------------

        const {
            data: positions,
            error: positionsError
        } = await supabase
            .from("positions")
            .select(
                `
                id,
                name,
                description,
                display_order,
                is_required,
                is_active
                `
            )
            .eq(
                "election_id",
                election.id
            )
            .eq(
                "is_active",
                true
            )
            .order(
                "display_order",
                {
                    ascending: true
                }
            );

        if (positionsError) {
            throw positionsError;
        }

        // -------------------------------------------------
        // GET CANDIDATES
        // -------------------------------------------------

        const {
            data: candidates,
            error: candidatesError
        } = await supabase
            .from("candidates")
            .select(
                `
                id,
                position_id,
                student_id,
                full_name,
                profile_picture,
                platform,
                party_list_id,
                is_active
                `
            )
            .eq(
                "election_id",
                election.id
            )
            .eq(
                "is_active",
                true
            );

        if (candidatesError) {
            throw candidatesError;
        }

        // -------------------------------------------------
        // GET PARTY LIST NAMES
        // -------------------------------------------------

        const partyListIds =
            (candidates || [])
                .map(
                    (candidate) =>
                        candidate.party_list_id
                )
                .filter(Boolean);

        let partyLists = [];

        if (partyListIds.length > 0) {

            const {
                data,
                error
            } = await supabase
                .from("party_lists")
                .select(
                    `
                    id,
                    name
                    `
                )
                .in(
                    "id",
                    partyListIds
                );

            if (error) {
                throw error;
            }

            partyLists =
                data || [];
        }

        // -------------------------------------------------
        // GET SUBMITTED BALLOT VOTES
        //
        // IMPORTANT:
        // Only aggregate candidate/position IDs are
        // processed here.
        //
        // Student identity is NOT returned.
        // Individual ballot records are NOT returned.
        // -------------------------------------------------

       const {
    data: submittedBallotRows,
    error: submittedBallotsQueryError
} = await supabase
    .from("ballots")
    .select("id")
    .eq(
        "election_id",
        election.id
    )
    .eq(
        "status",
        "submitted"
    );

if (submittedBallotsQueryError) {
    throw submittedBallotsQueryError;
}

const submittedBallotIds =
    (submittedBallotRows || [])
        .map(
            (ballot) =>
                ballot.id
        );

let ballotVotes = [];

if (submittedBallotIds.length > 0) {

    const {
        data,
        error
    } = await supabase
        .from("ballot_votes")
        .select(
            `
            id,
            candidate_id,
            position_id,
            ballot_id
            `
        )
        .in(
            "ballot_id",
            submittedBallotIds
        );

    if (error) {
        throw error;
    }

    ballotVotes =
        data || [];
}

        // -------------------------------------------------
        // COUNT VOTES PER CANDIDATE
        // -------------------------------------------------

        const voteCounts = {};

        (ballotVotes || [])
            .forEach(
                (vote) => {

                    if (
                        !vote.candidate_id
                    ) {
                        return;
                    }

                    voteCounts[
                        vote.candidate_id
                    ] =
                        (
                            voteCounts[
                                vote.candidate_id
                            ] || 0
                        ) + 1;
                }
            );

        // -------------------------------------------------
        // PARTY LIST LOOKUP
        // -------------------------------------------------

        const partyListMap =
            {};

        partyLists.forEach(
            (party) => {

                partyListMap[
                    party.id
                ] = party.name;

            }
        );

        // -------------------------------------------------
        // POSITION RESULTS
        // -------------------------------------------------

        const resultPositions =
            (positions || []).map(
                (position) => {

                    const positionCandidates =
                        (candidates || [])
                            .filter(
                                (candidate) =>
                                    candidate.position_id ===
                                    position.id
                            )
                            .map(
                                (candidate) => ({
                                    id:
                                        candidate.id,

                                    fullName:
                                        candidate.full_name,

                                    profilePicture:
                                        candidate.profile_picture ||
                                        "",

                                    platform:
                                        candidate.platform ||
                                        "",

                                    partyListId:
                                        candidate.party_list_id ||
                                        null,

                                    partyListName:
                                        candidate.party_list_id
                                            ? (
                                                partyListMap[
                                                    candidate.party_list_id
                                                ] || "Independent"
                                            )
                                            : "Independent",

                                    voteCount:
                                        voteCounts[
                                            candidate.id
                                        ] || 0
                                })
                            )
                            .sort(
                                (
                                    a,
                                    b
                                ) =>
                                    b.voteCount -
                                    a.voteCount
                            );

                    // -----------------------------------------
                    // DETERMINE RESULT STATUS
                    // -----------------------------------------

                    let resultStatus =
                        "no_votes";

                    let winner = null;

                    if (
                        positionCandidates.length >
                        0
                    ) {

                        const highestVoteCount =
                            Math.max(
                                ...positionCandidates.map(
                                    (candidate) =>
                                        candidate.voteCount
                                )
                            );

                        const leaders =
                            positionCandidates.filter(
                                (candidate) =>
                                    candidate.voteCount ===
                                    highestVoteCount
                            );

                        if (
                            highestVoteCount ===
                            0
                        ) {

                            resultStatus =
                                "no_votes";

                        } else if (
                            leaders.length >
                            1
                        ) {

                            resultStatus =
                                "tie";

                        } else {

                            resultStatus =
                                "winner";

                            winner =
                                leaders[0];
                        }
                    }

                    return {
                        id:
                            position.id,

                        name:
                            position.name,

                        description:
                            position.description ||
                            "",

                        displayOrder:
                            position.display_order,

                        isRequired:
                            position.is_required,

                        resultStatus,

                        winner,

                        candidates:
                            positionCandidates
                    };
                }
            );

        // -------------------------------------------------
        // SUMMARY
        // -------------------------------------------------

        const totalPositions =
            resultPositions.length;

        const positionsWithResults =
            resultPositions.filter(
                (position) =>
                    position.resultStatus ===
                    "winner"
            ).length;

        const tiedPositions =
            resultPositions.filter(
                (position) =>
                    position.resultStatus ===
                    "tie"
            ).length;

        const positionsWithoutVotes =
            resultPositions.filter(
                (position) =>
                    position.resultStatus ===
                    "no_votes"
            ).length;

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.json({

            success: true,

            election: {
                id:
                    election.id,

                title:
                    election.title,

                description:
                    election.description,

                election_date:
                    election.election_date,

                start_time:
                    election.start_time,

                end_time:
                    election.end_time,

                status:
                    election.status,

                is_published:
                    election.is_published,

                published_at:
                    election.published_at,

                closed_at:
                    election.closed_at
            },

            elections:
                elections.map(
                    (item) => ({
                        id:
                            item.id,

                        title:
                            item.title,

                        election_date:
                            item.election_date,

                        status:
                            item.status
                    })
                ),

            eligibleYearLevels,

            statistics: {

                eligibleVoters,

                votersWhoVoted:
                    totalVotersWhoVoted,

                remainingVoters,

                turnoutPercentage,

                submittedBallots:
                    totalSubmittedBallots,

                totalPositions,

                positionsWithResults,

                tiedPositions,

                positionsWithoutVotes
            },

            positions:
                resultPositions,

            generatedAt:
                new Date().toISOString()
        });

    } catch (error) {

        console.error(
            "❌ Results & Reports error:",
            error
        );

        const message =
            error?.message ||
            "Failed to load election results.";

        // -------------------------------------------------
        // AUTH ERRORS
        // -------------------------------------------------

        if (
            message.includes(
                "Authentication"
            ) ||
            message.includes(
                "Electoral Board access"
            ) ||
            message.includes(
                "Invalid Electoral Board"
            ) ||
            error?.name ===
                "JsonWebTokenError" ||
            error?.name ===
                "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                message

            });
        }

        // -------------------------------------------------
        // SERVER ERROR
        // -------------------------------------------------

        return res.status(500).json({

            success: false,

            message:
                "Failed to load election results.",

            error:
                process.env.NODE_ENV ===
                "development"
                    ? message
                    : undefined
        });
    }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    getResultsReports
};