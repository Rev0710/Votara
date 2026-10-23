const supabase = require("../config/supabase");

const isMissingReleaseSchema = (error) =>
    /results_released(_at)?|results-release/i.test(String(error?.message || error?.details || ""));


// =========================================================
// RESULTS & REPORTS SERVICE
// VOTARA ELECTORAL BOARD
// =========================================================
//
// IMPORTANT SECURITY RULE
//
// This service returns AGGREGATED election results only.
//
// It does NOT return:
// - Student identities connected to votes
// - Individual student selections
// - Ballot tokens
// - Authentication tokens
// - Passwords
// - Student documents
// - Selfie/profile documents
// - Raw ballot records
//
// The service only calculates totals per candidate/position.
// =========================================================


// =========================================================
// GET ELECTION RESULTS DATA
// =========================================================

const getResultsReportsData = async (
    requestedElectionId = null
) => {

    // -----------------------------------------------------
    // GET ELECTIONS
    // -----------------------------------------------------

    const baseElectionFields = `
        id, title, description, election_date, start_time, end_time,
        status, is_published, published_at, closed_at, created_at
    `;
    const releaseElectionFields = `
        id, title, description, election_date, start_time, end_time,
        status, is_published, published_at, closed_at,
        results_released, results_released_at, created_at
    `;

    let resultsReleaseSupported = true;
    let { data: elections, error: electionsError } = await supabase
        .from("elections")
        .select(releaseElectionFields)
        .order(
            "created_at",
            {
                ascending: false
            }
        );

    // Keep reports usable before the optional result-release migration has
    // been applied. Release itself stays disabled until the schema is ready.
    if (electionsError && isMissingReleaseSchema(electionsError)) {
        resultsReleaseSupported = false;
        ({ data: elections, error: electionsError } = await supabase
            .from("elections")
            .select(baseElectionFields)
            .order("created_at", { ascending: false }));
    }


    if (electionsError) {
        throw electionsError;
    }


    // -----------------------------------------------------
    // NO ELECTIONS
    // -----------------------------------------------------

    if (
        !elections ||
        elections.length === 0
    ) {

        return {
            election: null,

            elections: [],

            eligibleYearLevels: [],

            statistics: {
                eligibleVoters: 0,
                votersWhoVoted: 0,
                remainingVoters: 0,
                turnoutPercentage: 0,
                submittedBallots: 0,
                totalPositions: 0,
                positionsWithResults: 0,
                tiedPositions: 0,
                positionsWithoutVotes: 0
            },

            positions: [],

            resultsReleaseSupported,

            generatedAt:
                new Date().toISOString()
        };
    }


    // -----------------------------------------------------
    // SELECT ELECTION
    // -----------------------------------------------------

    let election = null;


    if (requestedElectionId) {

        election =
            elections.find(
                (item) =>
                    item.id ===
                    requestedElectionId
            ) || null;
    }


    // -----------------------------------------------------
    // DEFAULT ELECTION SELECTION
    // -----------------------------------------------------
    //
    // Prefer:
    // 1. Closed election
    // 2. Active/Open election
    // 3. Scheduled election
    // 4. Latest election
    //
    // -----------------------------------------------------

    if (!election) {

        election =
            elections.find(
                (item) =>
                    item.status ===
                    "closed"
            ) ||

            elections.find(
                (item) =>
                    item.status ===
                    "active"
            ) ||

            elections.find(
                (item) =>
                    item.status ===
                    "open"
            ) ||

            elections.find(
                (item) =>
                    item.status ===
                    "scheduled"
            ) ||

            elections[0];
    }


    // Independent reads share the same election scope and run together.
    // Page through tally rows: Supabase otherwise caps a result at 1,000 rows.
    const allRows = async (query) => {
        const rows = [];
        for (let offset = 0; ; offset += 1000) {
            const { data, error } = await query().range(offset, offset + 999)
                .abortSignal(AbortSignal.timeout(20000));
            if (error) throw error;
            rows.push(...(data || []));
            if (!data || data.length < 1000) return rows;
        }
    };
    const checkedCount = async (query) => {
        const { count, error } = await query.abortSignal(AbortSignal.timeout(20000));
        if (error) throw error;
        return count || 0;
    };
    const [yearLevelRows, positions, candidates, submittedBallotRows, totalVotersWhoVoted] = await Promise.all([
        allRows(() => supabase.from("election_year_levels").select("id,year_level")
            .eq("election_id", election.id).order("id")),
        allRows(() => supabase.from("positions")
            .select("id,name,description,display_order,is_required,is_active")
            .eq("election_id", election.id).eq("is_active", true)
            .order("display_order").order("id")),
        allRows(() => supabase.from("candidates")
            .select("id,position_id,student_id,full_name,profile_picture,platform,party_list_id,is_active")
            .eq("election_id", election.id).eq("is_active", true).order("id")),
        allRows(() => supabase.from("ballots").select("id")
            .eq("election_id", election.id).eq("status", "submitted").order("id")),
        checkedCount(supabase.from("vote_participations").select("id", {count: "exact", head: true})
            .eq("election_id", election.id).eq("has_voted", true)),
    ]);
    const eligibleYearLevels = yearLevelRows.filter(item => item.year_level !== "1st Year");
    const allowedYearLevels = eligibleYearLevels.map(item => item.year_level);
    const submittedBallotIds = submittedBallotRows.map(ballot => ballot.id);
    const partyListIds = [...new Set(candidates.map(candidate => candidate.party_list_id).filter(Boolean))];
    const batches = (values, size = 200) => Array.from(
        {length: Math.ceil(values.length / size)}, (_, index) => values.slice(index * size, (index + 1) * size)
    );
    const [eligibleVoters, partyLists, ballotVotes] = await Promise.all([
        allowedYearLevels.length
            ? checkedCount(supabase.from("students").select("id", {count: "exact", head: true})
                .in("year_level", allowedYearLevels))
            : Promise.resolve(0),
        (async () => {
            const rows = [];
            for (const ids of batches(partyListIds)) {
                rows.push(...await allRows(() => supabase.from("party_lists").select("id,name").in("id", ids).order("id")));
            }
            return rows;
        })(),
        (async () => {
            const rows = [];
            // Bound IN lists and paginate so every submitted vote is included.
            for (const ids of batches(submittedBallotIds)) {
                rows.push(...await allRows(() => supabase.from("ballot_votes")
                    .select("id,candidate_id,position_id,ballot_id").in("ballot_id", ids).order("id")));
            }
            return rows;
        })(),
    ]);
    const totalSubmittedBallots = submittedBallotRows.length;
    const remainingVoters = Math.max(eligibleVoters - totalVotersWhoVoted, 0);
    const turnoutPercentage = eligibleVoters > 0
        ? Number((totalVotersWhoVoted / eligibleVoters * 100).toFixed(2)) : 0;
    const partyListMap = Object.fromEntries(partyLists.map(party => [party.id, party.name]));
    // -----------------------------------------------------
    // COUNT VOTES PER CANDIDATE
    // -----------------------------------------------------

    const voteCounts = {};


    (
        ballotVotes ||
        []
    ).forEach(
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


    // -----------------------------------------------------
    // BUILD POSITION RESULTS
    // -----------------------------------------------------

    const resultPositions =
        (
            positions ||
            []
        ).map(
            (position) => {

                // -----------------------------------------
                // CANDIDATES FOR THIS POSITION
                // -----------------------------------------

                const positionCandidates =
                    (
                        candidates ||
                        []
                    )
                        .filter(
                            (candidate) =>
                                candidate.position_id ===
                                position.id
                        )
                        .map(
                            (candidate) => {

                                const voteCount =
                                    voteCounts[
                                        candidate.id
                                    ] || 0;


                                return {
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
                                                ] ||
                                                "Independent"
                                            )
                                            : "Independent",

                                    voteCount
                                };
                            }
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


                let winner =
                    null;


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


                // -----------------------------------------
                // RETURN AGGREGATED POSITION RESULT
                // -----------------------------------------

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


    // -----------------------------------------------------
    // RESULT SUMMARY
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // ELECTION LIST FOR FRONTEND
    // -----------------------------------------------------

    const electionList =
        elections.map(
            (item) => ({

                id:
                    item.id,

                title:
                    item.title,

                election_date:
                    item.election_date,

                status:
                    item.status,
                results_released:
                    item.results_released === true,
                results_released_at:
                    item.results_released_at || null
            })
        );


    // -----------------------------------------------------
    // FINAL SAFE RESULT
    // -----------------------------------------------------
    //
    // IMPORTANT:
    //
    // Notice that ballotVotes,
    // submittedBallotIds,
    // students,
    // and raw ballot records are NOT included.
    //
    // Only aggregate information is returned.
    //
    // -----------------------------------------------------

    return {

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
                election.closed_at,

            results_released:
                election.results_released === true,

            results_released_at:
                election.results_released_at || null
        },

        resultsReleaseSupported,


        elections:
            electionList,


        eligibleYearLevels:
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
    };
};


// =========================================================
// BUILD SAFE EXPORT DATA
// =========================================================
//
// This function prepares the aggregate results for future
// PDF / Excel / CSV export.
//
// It deliberately excludes:
//
// - student identity
// - student_id
// - ballot_id
// - ballot token
// - authentication data
// - raw ballot records
// - individual vote selections
//
// =========================================================

const buildResultsExportData = (
    resultsData
) => {

    if (
        !resultsData
    ) {

        return {

            election: null,

            summary: {},

            positions: []
        };
    }


    const election =
        resultsData.election ||
        null;


    const statistics =
        resultsData.statistics ||
        {};


    const positions =
        resultsData.positions ||
        [];


    // -----------------------------------------------------
    // EXPORT POSITION DATA
    // -----------------------------------------------------

    const exportPositions =
        positions.map(
            (position) => ({

                position:
                    position.name,

                status:
                    position.resultStatus,

                winner:
                    position.winner
                        ? {
                            name:
                                position.winner.fullName,

                            party:
                                position.winner.partyListName,

                            votes:
                                position.winner.voteCount
                        }
                        : null,

                candidates:
                    (
                        position.candidates ||
                        []
                    ).map(
                        (candidate) => ({

                            name:
                                candidate.fullName,

                            party:
                                candidate.partyListName,

                            votes:
                                candidate.voteCount
                        })
                    )
            })
        );


    // -----------------------------------------------------
    // SAFE EXPORT OBJECT
    // -----------------------------------------------------

    return {

        election: {

            id:
                election.id,

            title:
                election.title,

            description:
                election.description,

            electionDate:
                election.election_date,

            startTime:
                election.start_time,

            endTime:
                election.end_time,

            status:
                election.status
        },


        summary: {

            eligibleVoters:
                statistics.eligibleVoters ||
                0,

            votersWhoVoted:
                statistics.votersWhoVoted ||
                0,

            remainingVoters:
                statistics.remainingVoters ||
                0,

            turnoutPercentage:
                statistics.turnoutPercentage ||
                0,

            submittedBallots:
                statistics.submittedBallots ||
                0,

            totalPositions:
                statistics.totalPositions ||
                0,

            positionsWithResults:
                statistics.positionsWithResults ||
                0,

            tiedPositions:
                statistics.tiedPositions ||
                0,

            positionsWithoutVotes:
                statistics.positionsWithoutVotes ||
                0
        },


        positions:
            exportPositions,


        generatedAt:
            resultsData.generatedAt ||
            new Date().toISOString()
    };
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getResultsReportsData,

    buildResultsExportData
};
