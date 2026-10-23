const jwt = require("jsonwebtoken");
const { buildResultsPdf } = require("../services/resultsPdf");

const supabase = require("../config/supabase");

const {
    getResultsReportsData,
    buildResultsExportData
} = require("../services/resultsReportsService");


// =========================================================
// AUTHENTICATE ELECTORAL BOARD
// =========================================================

const authenticateEB = async (req) => {

    const authHeader =
        req.headers.authorization;

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

    let decoded;

    try {

        decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

    } catch (error) {

        throw new Error(
            "Invalid or expired authentication token."
        );

    }

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
            "Electoral Board user ID is required."
        );

    }

    const {
        data: staff,
        error
    } = await supabase
        .from("staff_users")
        .select(`
            id,
            full_name,
            email,
            role,
            is_active
        `)
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

        throw new Error(
            error.message
        );

    }

    if (!staff) {

        throw new Error(
            "Electoral Board account is inactive or not found."
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
        // LOAD RESULTS DATA
        // -------------------------------------------------

        const resultsData =
            await getResultsReportsData(
                requestedElectionId
            );


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------
        //
        // ResultsReports.jsx expects:
        //
        // response.data.success === true
        //
        // The service returns the actual results,
        // so we add success: true here.
        //
        // -------------------------------------------------

        return res.status(200).json({

            success: true,

            ...resultsData

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
                "Authentication token"
            ) ||
            message.includes(
                "Invalid or expired"
            ) ||
            message.includes(
                "Electoral Board access"
            ) ||
            message.includes(
                "Electoral Board account"
            ) ||
            message.includes(
                "Invalid Electoral Board"
            ) ||
            message.includes(
                "user ID is required"
            )
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

            message

        });

    }

};


// =========================================================
// EXPORT RESULTS & REPORTS TO PDF
// =========================================================


const exportResultsReports = async (req, res) => {
    try {
        await authenticateEB(req);
        const electionId = req.query.election_id || req.query.electionId || null;
        const results = await getResultsReportsData(electionId);
        if (!results.election || (electionId && String(results.election.id) !== String(electionId))) {
            return res.status(404).json({success: false, message: "Election not found."});
        }
        const pdf = await buildResultsPdf(buildResultsExportData(results));
        const name = String(results.election.title || "Election")
            .replace(/[^a-z0-9]/gi, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "Election";
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="' + name + '_Results.pdf"');
        res.setHeader("Cache-Control", "private, no-store");
        return res.status(200).send(pdf);
    } catch (error) {
        console.error("Export Results & Reports error:", error);
        const message = error?.message || "Unable to export election results.";
        const authError = /Authentication token|Invalid or expired|Electoral Board access|Electoral Board account|Invalid Electoral Board|user ID is required/.test(message);
        return res.status(authError ? 401 : 500).json({success: false, message});
    }
};

// =========================================================
// RELEASE OFFICIAL RESULTS TO STUDENTS
// =========================================================

const releaseElectionResults = async (req, res) => {
    try {
        await authenticateEB(req);

        const electionId = req.body?.election_id || req.body?.electionId;
        if (!electionId) {
            return res.status(400).json({ success: false, message: "Select an election before releasing results." });
        }

        const { data: election, error: electionError } = await supabase
            .from("elections")
            .select("id, title, status, is_published, results_released")
            .eq("id", electionId)
            .maybeSingle();

        if (electionError) throw electionError;
        if (!election) {
            return res.status(404).json({ success: false, message: "Election not found." });
        }

        if (!["closed", "completed", "finished"].includes(String(election.status || "").toLowerCase())) {
            return res.status(409).json({ success: false, message: "Close the election before releasing its results." });
        }

        if (election.is_published !== true) {
            return res.status(409).json({ success: false, message: "Publish the election before releasing its results." });
        }

        // Recalculate from submitted ballots on the server. The PDF file is
        // an export; its contents are never accepted as result input.
        const results = await getResultsReportsData(electionId);
        if (!results?.election || String(results.election.id) !== String(electionId)) {
            return res.status(409).json({ success: false, message: "Could not verify the election tally." });
        }

        const releasedAt = new Date().toISOString();
        const { data: updatedElection, error: updateError } = await supabase
            .from("elections")
            .update({ results_released: true, results_released_at: releasedAt })
            .eq("id", electionId)
            .select("id, title, status, results_released, results_released_at")
            .single();

        if (updateError) throw updateError;

        return res.status(200).json({
            success: true,
            message: "Official election results released to students.",
            election: updatedElection,
        });
    } catch (error) {
        console.error("Release election results error:", error);
        const message = error?.message || "Failed to release election results.";
        if (/results_released(_at)?/i.test(message)) {
            return res.status(409).json({
                success: false,
                message: "Apply server/results-release.sql in Supabase before releasing results to students.",
            });
        }
        const isAuthError = ["Authentication token", "Invalid or expired", "Electoral Board access", "Electoral Board account", "Invalid Electoral Board", "user ID is required"].some((text) => message.includes(text));
        return res.status(isAuthError ? 401 : 500).json({ success: false, message });
    }
};


// =========================================================
// EXPORT CONTROLLER FUNCTIONS
// =========================================================

module.exports = {

    getResultsReports,

    exportResultsReports,

    releaseElectionResults

};
