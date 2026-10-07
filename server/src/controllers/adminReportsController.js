const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const XLSX = require("xlsx");

const {
    getResultsReportsData,
    buildResultsExportData,
} = require("../services/resultsReportsService");

const ADMIN_ROLE = "admin";

// =========================================================
// ADMIN AUTHENTICATION
// =========================================================

const authenticateAdmin = async (req) => {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
        const error = new Error(
            "Authentication token is required."
        );
        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
        const error = new Error(
            "Authentication token is missing."
        );
        error.statusCode = 401;
        throw error;
    }

    let decoded;

    try {
        decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
    } catch {
        const error = new Error(
            "Invalid or expired administrator session."
        );
        error.statusCode = 401;
        throw error;
    }

    if (!decoded || decoded.role !== ADMIN_ROLE) {
        const error = new Error(
            "Administrator access is required."
        );
        error.statusCode = 403;
        throw error;
    }

    if (!decoded.userId) {
        const error = new Error(
            "Invalid administrator session."
        );
        error.statusCode = 401;
        throw error;
    }

    const {
        data: admin,
        error,
    } = await supabase
        .from("staff_users")
        .select(`
            id,
            full_name,
            email,
            role,
            is_active
        `)
        .eq("id", decoded.userId)
        .eq("role", ADMIN_ROLE)
        .maybeSingle();

    if (error) {
        console.error(
            "Admin Reports authentication lookup error:",
            error.message
        );

        const authError = new Error(
            "Unable to verify administrator account."
        );
        authError.statusCode = 500;
        throw authError;
    }

    if (!admin) {
        const error = new Error(
            "Administrator account was not found."
        );
        error.statusCode = 401;
        throw error;
    }

    if (admin.is_active !== true) {
        const error = new Error(
            "Administrator account is inactive."
        );
        error.statusCode = 403;
        throw error;
    }

    return admin;
};

// =========================================================
// TURNOUT TREND
//
// Uses vote_participations.voted_at only.
// No student identity or ballot selections are returned.
// =========================================================

const getTurnoutOverTime = async (electionId, eligibleVoters) => {
    if (!electionId) return [];

    const {
        data,
        error,
    } = await supabase
        .from("vote_participations")
        .select("voted_at")
        .eq("election_id", electionId)
        .eq("has_voted", true)
        .not("voted_at", "is", null)
        .order("voted_at", {
            ascending: true,
        });

    if (error) {
        throw error;
    }

    const rows = Array.isArray(data) ? data : [];

    if (!rows.length) {
        return [];
    }

    const daily = new Map();

    rows.forEach((row) => {
        const date = new Date(row.voted_at);

        if (Number.isNaN(date.getTime())) return;

        const key = date.toISOString().slice(0, 10);

        daily.set(
            key,
            (daily.get(key) || 0) + 1
        );
    });

    let cumulative = 0;

    return Array.from(daily.entries()).map(
        ([date, count]) => {
            cumulative += count;

            const percentage =
                eligibleVoters > 0
                    ? Number(
                          (
                              (cumulative /
                                  eligibleVoters) *
                              100
                          ).toFixed(2)
                      )
                    : 0;

            return {
                date,
                label: new Date(
                    `${date}T00:00:00`
                ).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                }),
                votes: cumulative,
                dailyVotes: count,
                value: percentage,
            };
        }
    );
};

// =========================================================
// GET ADMIN REPORTS
// =========================================================

const getAdminReports = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const requestedElectionId =
            req.query.election_id ||
            req.query.electionId ||
            null;

        const report =
            await getResultsReportsData(
                requestedElectionId
            );

        if (!report.election) {
            return res.status(200).json({
                success: true,
                ...report,
                turnoutOverTime: [],
            });
        }

        const turnoutOverTime =
            await getTurnoutOverTime(
                report.election.id,
                report.statistics?.eligibleVoters || 0
            );

        return res.status(200).json({
            success: true,
            ...report,
            turnoutOverTime,
        });
    } catch (error) {
        console.error(
            "❌ Admin Reports error:",
            error
        );

        const statusCode =
            error.statusCode ||
            (
                error.name === "JsonWebTokenError" ||
                error.name === "TokenExpiredError"
                    ? 401
                    : 500
            );

        return res.status(statusCode).json({
            success: false,
            message:
                error.message ||
                "Unable to load Reports & Analytics.",
        });
    }
};

// =========================================================
// EXPORT ADMIN REPORTS
// =========================================================

const exportAdminReports = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const requestedElectionId =
            req.query.election_id ||
            req.query.electionId ||
            null;

        const resultsData =
            await getResultsReportsData(
                requestedElectionId
            );

        const exportData =
            buildResultsExportData(
                resultsData
            );

        const workbook =
            XLSX.utils.book_new();

        const election =
            exportData.election || {};

        const summary =
            exportData.summary || {};

        const positions =
            Array.isArray(exportData.positions)
                ? exportData.positions
                : [];

        const totalCandidates =
            positions.reduce(
                (total, position) =>
                    total +
                    (
                        Array.isArray(
                            position.candidates
                        )
                            ? position.candidates.length
                            : 0
                    ),
                0
            );

        const summaryRows = [
            ["VOTARA Reports & Analytics", ""],
            [
                "Election",
                election.title || "N/A",
            ],
            [
                "Election Date",
                election.electionDate || "N/A",
            ],
            [
                "Start Time",
                election.startTime || "N/A",
            ],
            [
                "End Time",
                election.endTime || "N/A",
            ],
            [
                "Status",
                election.status || "N/A",
            ],
            [],
            ["Participation Summary", ""],
            [
                "Eligible Voters",
                summary.eligibleVoters || 0,
            ],
            [
                "Voters Who Voted",
                summary.votersWhoVoted || 0,
            ],
            [
                "Remaining Voters",
                summary.remainingVoters || 0,
            ],
            [
                "Turnout Percentage",
                `${summary.turnoutPercentage || 0}%`,
            ],
            [
                "Submitted Ballots",
                summary.submittedBallots || 0,
            ],
            [],
            ["Result Summary", ""],
            [
                "Positions",
                summary.totalPositions ||
                    positions.length,
            ],
            [
                "Candidates",
                totalCandidates,
            ],
            [
                "Positions With Results",
                summary.positionsWithResults || 0,
            ],
            [
                "Tied Positions",
                summary.tiedPositions || 0,
            ],
            [
                "Positions Without Results",
                summary.positionsWithoutVotes || 0,
            ],
            [],
            [
                "Generated At",
                exportData.generatedAt ||
                    new Date().toISOString(),
            ],
            [],
            ["Privacy Notice", ""],
            [
                "This export contains aggregate election results only.",
            ],
            [
                "It does not contain individual student selections,",
            ],
            [
                "student identities, ballot tokens, passwords, or raw ballots.",
            ],
        ];

        const summarySheet =
            XLSX.utils.aoa_to_sheet(
                summaryRows
            );

        summarySheet["!cols"] = [
            { wch: 32 },
            { wch: 58 },
        ];

        XLSX.utils.book_append_sheet(
            workbook,
            summarySheet,
            "Summary"
        );

        const resultRows = [
            [
                "Position",
                "Candidate",
                "Party List",
                "Votes",
                "Percentage",
                "Result Status",
                "Winner / Tie",
            ],
        ];

        positions.forEach((position) => {
            const candidates =
                Array.isArray(position.candidates)
                    ? position.candidates
                    : [];

            if (!candidates.length) {
                resultRows.push([
                    position.position || "N/A",
                    "No candidates",
                    "",
                    0,
                    "0%",
                    position.status || "no_votes",
                    "",
                ]);
                return;
            }

            const totalVotes =
                candidates.reduce(
                    (sum, candidate) =>
                        sum +
                        Number(
                            candidate.votes || 0
                        ),
                    0
                );

            candidates.forEach((candidate) => {
                const votes =
                    Number(candidate.votes || 0);

                const percentage =
                    totalVotes > 0
                        ? `${(
                              (votes /
                                  totalVotes) *
                              100
                          ).toFixed(2)}%`
                        : "0%";

                const isWinner =
                    position.winner &&
                    position.winner.name ===
                        candidate.name;

                resultRows.push([
                    position.position || "N/A",
                    candidate.name || "N/A",
                    candidate.party || "Independent",
                    votes,
                    percentage,
                    position.status || "no_votes",
                    isWinner
                        ? "Winner"
                        : position.status === "tie"
                        ? "Tie"
                        : "",
                ]);
            });
        });

        const resultsSheet =
            XLSX.utils.aoa_to_sheet(
                resultRows
            );

        resultsSheet["!cols"] = [
            { wch: 30 },
            { wch: 35 },
            { wch: 28 },
            { wch: 14 },
            { wch: 14 },
            { wch: 18 },
            { wch: 18 },
        ];

        XLSX.utils.book_append_sheet(
            workbook,
            resultsSheet,
            "Election Results"
        );

        const excelBuffer =
            XLSX.write(workbook, {
                type: "buffer",
                bookType: "xlsx",
            });

        const safeFileName =
            String(
                election.title ||
                    "VOTARA_Election_Report"
            )
                .replace(
                    /[^a-z0-9]/gi,
                    "_"
                )
                .replace(
                    /_+/g,
                    "_"
                )
                .replace(
                    /^_+|_+$/g,
                    ""
                );

        const filename =
            `${safeFileName || "VOTARA_Election_Report"}_Results.xlsx`;

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        return res
            .status(200)
            .send(excelBuffer);
    } catch (error) {
        console.error(
            "❌ Admin Reports export error:",
            error
        );

        const statusCode =
            error.statusCode ||
            (
                error.name === "JsonWebTokenError" ||
                error.name === "TokenExpiredError"
                    ? 401
                    : 500
            );

        return res.status(statusCode).json({
            success: false,
            message:
                error.message ||
                "Unable to export Reports & Analytics.",
        });
    }
};

module.exports = {
    getAdminReports,
    exportAdminReports,
};
