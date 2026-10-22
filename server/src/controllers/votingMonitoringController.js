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

    const token = authHeader.split(" ")[1];

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

    const { data: staff, error } =
        await supabase
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
            .eq("id", decoded.userId)
            .eq("role", "electoral_board")
            .eq("is_active", true)
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
// GET VOTING MONITORING
// =========================================================

const getVotingMonitoring = async (req, res) => {
    try {
        // -------------------------------------------------
        // AUTHENTICATION
        // -------------------------------------------------

        await authenticateEB(req);

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

        if (!elections || elections.length === 0) {
            return res.json({
                success: true,
                election: null,
                eligibleYearLevels: [],
                statistics: {
                    eligibleVoters: 0,
                    votersWhoVoted: 0,
                    remainingVoters: 0,
                    votingPercentage: 0,
                    submittedBallots: 0
                },
                recentActivity: [],
                updatedAt: new Date().toISOString()
            });
        }

        // -------------------------------------------------
        // SELECT CURRENT ELECTION
        // -------------------------------------------------

        const currentElection =
            elections.find(
                (election) =>
                    election.status === "active"
            ) ||
            elections.find(
                (election) =>
                    election.status === "scheduled"
            ) ||
            elections.find(
                (election) =>
                    election.status === "draft"
            ) ||
            elections[0];

        // -------------------------------------------------
        // GET YEAR LEVELS FOR ELECTION
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
                currentElection.id
            )
            .order(
                "year_level",
                {
                    ascending: true
                }
            );

        if (yearLevelError) {
            throw yearLevelError;
        }

        let eligibleYearLevels =
            yearLevelRows || [];

        // -------------------------------------------------
        // VOTARA RULE
        //
        // 1st Year does not vote.
        // Voting year levels are:
        // 2nd Year
        // 3rd Year
        // 4th Year
        // -------------------------------------------------

        if (
            eligibleYearLevels.length === 0
        ) {
            eligibleYearLevels = [
                {
                    id: null,
                    year_level: "2nd Year"
                },
                {
                    id: null,
                    year_level: "3rd Year"
                },
                {
                    id: null,
                    year_level: "4th Year"
                }
            ];
        }

        eligibleYearLevels =
            eligibleYearLevels.filter(
                (item) =>
                    item.year_level !==
                    "1st Year"
            );

        const allowedYearLevels =
            eligibleYearLevels.map(
                (item) => item.year_level
            );

        // -------------------------------------------------
        // COUNT ELIGIBLE STUDENTS
        // -------------------------------------------------

        let eligibleVoters = 0;

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
        // COUNT STUDENTS WHO VOTED
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
                currentElection.id
            )
            .eq(
                "has_voted",
                true
            );

        if (participationError) {
            throw participationError;
        }

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
                currentElection.id
            )
            .eq(
                "status",
                "submitted"
            );

        if (ballotsError) {
            throw ballotsError;
        }

        // -------------------------------------------------
        // CALCULATE STATISTICS
        // -------------------------------------------------

        const voted =
            votersWhoVoted || 0;

        const ballots =
            submittedBallots || 0;

        const remainingVoters =
            Math.max(
                eligibleVoters - voted,
                0
            );

        const votingPercentage =
            eligibleVoters > 0
                ? Number(
                    (
                        (voted /
                            eligibleVoters) *
                        100
                    ).toFixed(2)
                )
                : 0;

        // -------------------------------------------------
        // RECENT ACTIVITY
        //
        // IMPORTANT:
        // Do NOT expose:
        // - student identity
        // - ballot choices
        // - candidate selections
        // -------------------------------------------------

        const {
            data: recentActivity,
            error: activityError
        } = await supabase
            .from("vote_participations")
            .select(
                `
                id,
                has_voted,
                voted_at
                `
            )
            .eq(
                "election_id",
                currentElection.id
            )
            .eq(
                "has_voted",
                true
            )
            .order(
                "voted_at",
                {
                    ascending: false
                }
            )
            .limit(10);

        if (activityError) {
            throw activityError;
        }

        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        return res.json({
            success: true,

            election: currentElection,

            eligibleYearLevels,

            statistics: {
                eligibleVoters,
                votersWhoVoted: voted,
                remainingVoters,
                votingPercentage,
                submittedBallots: ballots
            },

            recentActivity:
                recentActivity || [],

            updatedAt:
                new Date().toISOString()
        });

    } catch (error) {

        console.error(
            "❌ Voting Monitoring error:",
            error
        );

        const message =
            error?.message ||
            "Failed to load voting monitoring.";

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

        return res.status(500).json({
            success: false,
            message:
                "Failed to load voting monitoring.",
            error:
                process.env.NODE_ENV ===
                "development"
                    ? message
                    : undefined
        });
    }
};

// =========================================================
// GET AGGREGATED TURNOUT TOTALS FOR EB ELECTIONS
// =========================================================

const getElectionTurnoutSummaries = async (req, res) => {
    try {
        await authenticateEB(req);

        const { data: elections, error: electionsError } = await supabase
            .from("elections")
            .select("id")
            .order("created_at", { ascending: false });
        if (electionsError) throw electionsError;

        if (!elections?.length) {
            return res.json({ success: true, elections: [], updatedAt: new Date().toISOString() });
        }

        const electionIds = elections.map(({ id }) => id);
        const { data: yearLevels, error: yearLevelsError } = await supabase
            .from("election_year_levels")
            .select("election_id, year_level")
            .in("election_id", electionIds);
        if (yearLevelsError) throw yearLevelsError;

        const summaries = await Promise.all(elections.map(async ({ id }) => {
            const configuredYears = (yearLevels || [])
                .filter((row) => row.election_id === id)
                .map((row) => row.year_level)
                .filter((year) => year && year !== "1st Year");
            const eligibleYears = configuredYears.length
                ? [...new Set(configuredYears)]
                : ["2nd Year", "3rd Year", "4th Year"];

            const [studentsResult, participationResult] = await Promise.all([
                supabase.from("students").select("id", { count: "exact", head: true }).in("year_level", eligibleYears),
                supabase.from("vote_participations").select("id", { count: "exact", head: true }).eq("election_id", id).eq("has_voted", true),
            ]);
            if (studentsResult.error) throw studentsResult.error;
            if (participationResult.error) throw participationResult.error;

            return {
                id,
                voter_count: studentsResult.count || 0,
                vote_count: participationResult.count || 0,
            };
        }));

        return res.json({ success: true, elections: summaries, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Election turnout summary error:", error);
        const message = error?.message || "Failed to load election turnout totals.";
        const authError = /Authentication|Electoral Board access|Invalid Electoral Board/i.test(message) ||
            error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError";
        return res.status(authError ? 401 : 500).json({ success: false, message });
    }
};

// =========================================================
// EXPORT
// =========================================================

module.exports = {
    getVotingMonitoring,
    getElectionTurnoutSummaries,
};
