const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const {buildResultsPdf} = require("../services/resultsPdf");

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
        const requestedElectionId = req.query.election_id || req.query.electionId || null;
        const resultsData = await getResultsReportsData(requestedElectionId);
        if (!resultsData.election || (requestedElectionId && String(resultsData.election.id) !== String(requestedElectionId))) {
            return res.status(404).json({success:false,message:"Election not found."});
        }
        const pdf = await buildResultsPdf(buildResultsExportData(resultsData));
        const filename = (String(resultsData.election.title || "VOTARA_Election_Report")
            .replace(/[^a-z0-9]/gi,"_").replace(/_+/g,"_").replace(/^_+|_+$/g,"") || "VOTARA_Election_Report") + "_Results.pdf";
        res.setHeader("Content-Type","application/pdf");
        res.setHeader("Content-Disposition",'attachment; filename="'+filename+'"');
        res.setHeader("Cache-Control","private, no-store");
        res.setHeader("X-Content-Type-Options","nosniff");
        return res.status(200).send(pdf);
    } catch (error) {
        console.error("Admin Reports PDF export error:",error);
        const statusCode=error.statusCode || (["JsonWebTokenError","TokenExpiredError"].includes(error.name)?401:500);
        return res.status(statusCode).json({success:false,message:error.message || "Unable to export the PDF report."});
    }
};


module.exports = {
    getAdminReports,
    exportAdminReports,
};
