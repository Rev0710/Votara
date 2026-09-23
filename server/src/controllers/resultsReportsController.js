const jwt = require("jsonwebtoken");
const XLSX = require("xlsx");

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
// EXPORT RESULTS & REPORTS TO EXCEL
// =========================================================

const exportResultsReports = async (
    req,
    res
) => {

    try {

        // -----------------------------------------------------
        // AUTHENTICATE ELECTORAL BOARD
        // -----------------------------------------------------

        await authenticateEB(req);


        // -----------------------------------------------------
        // GET SELECTED ELECTION
        // -----------------------------------------------------

        const requestedElectionId =
            req.query.election_id ||
            req.query.electionId ||
            null;


        // -----------------------------------------------------
        // LOAD RESULTS DATA
        // -----------------------------------------------------

        const resultsData =
            await getResultsReportsData(
                requestedElectionId
            );


        // -----------------------------------------------------
        // BUILD SAFE EXPORT DATA
        // -----------------------------------------------------

        const exportData =
            buildResultsExportData(
                resultsData
            );


        // -----------------------------------------------------
        // CREATE WORKBOOK
        // -----------------------------------------------------

        const workbook =
            XLSX.utils.book_new();


        // =====================================================
        // SAFE DATA REFERENCES
        // =====================================================

        const election =
            exportData?.election ||
            {};

        const summary =
            exportData?.summary ||
            {};

        const positions =
            Array.isArray(
                exportData?.positions
            )
                ? exportData.positions
                : [];


        // =====================================================
        // CALCULATE TOTAL CANDIDATES
        // =====================================================

        const totalCandidates =
            positions.reduce(
                (
                    total,
                    position
                ) => {

                    const candidates =
                        Array.isArray(
                            position?.candidates
                        )
                            ? position.candidates
                            : [];

                    return (
                        total +
                        candidates.length
                    );

                },
                0
            );


        // =====================================================
        // SUMMARY SHEET
        // =====================================================

        const summaryRows = [

            [
                "VOTARA - RESULTS & REPORTS"
            ],

            [],

            [
                "Election Information"
            ],

            [
                "Election",
                election.title ||
                "N/A"
            ],

            [
                "Election Date",
                election.electionDate ||
                "N/A"
            ],

            [
                "Start Time",
                election.startTime ||
                "N/A"
            ],

            [
                "End Time",
                election.endTime ||
                "N/A"
            ],

            [
                "Status",
                election.status ||
                "N/A"
            ],

            [],

            [
                "Participation Summary"
            ],

            [
                "Eligible Voters",
                summary.eligibleVoters ??
                0
            ],

            [
                "Votes Cast",
                summary.votersWhoVoted ??
                0
            ],

            [
                "Remaining Voters",
                summary.remainingVoters ??
                0
            ],

            [
                "Turnout",
                `${Number(
                    summary.turnoutPercentage ??
                    0
                ).toFixed(2)}%`
            ],

            [
                "Submitted Ballots",
                summary.submittedBallots ??
                0
            ],

            [],

            [
                "Result Summary"
            ],

            [
                "Positions",
                summary.totalPositions ??
                positions.length
            ],

            [
                "Candidates",
                totalCandidates
            ],

            [
                "Positions with Results",
                summary.positionsWithResults ??
                0
            ],

            [
                "Positions without Results",
                summary.positionsWithoutVotes ??
                0
            ],

            [
                "Tied Positions",
                summary.tiedPositions ??
                0
            ],

            [],

            [
                "Generated At",
                exportData.generatedAt ||
                new Date().toISOString()
            ],

            [],

            [
                "Privacy Notice"
            ],

            [
                "This export contains aggregate election results only."
            ],

            [
                "It does not contain individual student selections,"
            ],

            [
                "ballot tokens, authentication tokens, passwords,"
            ],

            [
                "private student documents, selfie images, or raw ballot records."
            ]

        ];


        const summaryWorksheet =
            XLSX.utils.aoa_to_sheet(
                summaryRows
            );


        // -----------------------------------------------------
        // SUMMARY COLUMN WIDTHS
        // -----------------------------------------------------

        summaryWorksheet["!cols"] = [

            {
                wch: 32
            },

            {
                wch: 55
            }

        ];


        XLSX.utils.book_append_sheet(
            workbook,
            summaryWorksheet,
            "Summary"
        );


        // =====================================================
        // ELECTION RESULTS SHEET
        // =====================================================

        const resultRows = [

            [
                "Position",
                "Candidate",
                "Party List",
                "Votes",
                "Percentage",
                "Result Status",
                "Winner / Tie"
            ]

        ];


        // =====================================================
        // BUILD CANDIDATE RESULTS
        // =====================================================

        positions.forEach(
            (position) => {

                const candidates =
                    Array.isArray(
                        position?.candidates
                    )
                        ? position.candidates
                        : [];


                const positionName =
                    position?.position ||
                    "N/A";


                // -------------------------------------------------
                // POSITION WITHOUT CANDIDATES
                // -------------------------------------------------

                if (
                    candidates.length === 0
                ) {

                    resultRows.push([

                        positionName,

                        "No candidates",

                        "",

                        0,

                        "0%",

                        position?.status ||
                        "no_votes",

                        ""

                    ]);

                    return;
                }


                // -------------------------------------------------
                // TOTAL VOTES FOR THIS POSITION
                // -------------------------------------------------

                const totalVotes =
                    candidates.reduce(
                        (
                            total,
                            candidate
                        ) => {

                            return (
                                total +
                                Number(
                                    candidate?.votes ||
                                    0
                                )
                            );

                        },
                        0
                    );


                // -------------------------------------------------
                // WINNER INFORMATION
                // -------------------------------------------------

                const winner =
                    position?.winner ||
                    null;


                // -------------------------------------------------
                // ADD EACH CANDIDATE
                // -------------------------------------------------

                candidates.forEach(
                    (candidate) => {

                        const votes =
                            Number(
                                candidate?.votes ||
                                0
                            );


                        // -------------------------------------------------
                        // CALCULATE PERCENTAGE
                        // -------------------------------------------------

                        const percentage =
                            totalVotes > 0
                                ? (
                                    (
                                        votes /
                                        totalVotes
                                    ) *
                                    100
                                ).toFixed(2) + "%"
                                : "0%";


                        let resultLabel =
                            "";


                        // -------------------------------------------------
                        // WINNER
                        // -------------------------------------------------

                        if (
                            winner &&
                            winner.name ===
                                candidate.name
                        ) {

                            resultLabel =
                                "Winner";

                        }


                        // -------------------------------------------------
                        // TIE
                        // -------------------------------------------------

                        else if (
                            position?.status ===
                            "tie"
                        ) {

                            resultLabel =
                                "Tie";

                        }


                        // -------------------------------------------------
                        // ADD CANDIDATE RESULT ROW
                        // -------------------------------------------------

                        resultRows.push([

                            positionName,

                            candidate?.name ||
                            "N/A",

                            candidate?.party ||
                            "Independent",

                            votes,

                            percentage,

                            position?.status ||
                            "no_votes",

                            resultLabel

                        ]);

                    }
                );

            }
        );


        // =====================================================
        // CREATE RESULTS WORKSHEET
        // =====================================================

        const resultsWorksheet =
            XLSX.utils.aoa_to_sheet(
                resultRows
            );


        // -----------------------------------------------------
        // RESULTS COLUMN WIDTHS
        // -----------------------------------------------------

        resultsWorksheet["!cols"] = [

            {
                wch: 30
            },

            {
                wch: 35
            },

            {
                wch: 28
            },

            {
                wch: 14
            },

            {
                wch: 14
            },

            {
                wch: 18
            },

            {
                wch: 18
            }

        ];


        // -----------------------------------------------------
        // ADD RESULTS SHEET
        // -----------------------------------------------------

        XLSX.utils.book_append_sheet(
            workbook,
            resultsWorksheet,
            "Election Results"
        );


        // =====================================================
        // GENERATE EXCEL FILE
        // =====================================================

        const excelBuffer =
            XLSX.write(
                workbook,
                {
                    type: "buffer",
                    bookType: "xlsx"
                }
            );


        // =====================================================
        // SAFE FILE NAME
        // =====================================================

        const electionTitle =
            election.title ||
            "Election";


        const safeFileName =
            String(
                electionTitle
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


        const finalFileName =
            `${safeFileName || "Election"}_Results.xlsx`;


        // =====================================================
        // RESPONSE HEADERS
        // =====================================================

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );


        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${finalFileName}"`
        );


        // =====================================================
        // SEND EXCEL FILE
        // =====================================================

        return res
            .status(200)
            .send(excelBuffer);


    } catch (error) {

        console.error(
            "❌ Export Results & Reports Error:",
            error
        );


        const message =
            error?.message ||
            "Failed to export election results.";


        // -----------------------------------------------------
        // AUTH ERRORS
        // -----------------------------------------------------

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


        // -----------------------------------------------------
        // SERVER ERROR
        // -----------------------------------------------------

        return res.status(500).json({

            success: false,

            message

        });

    }

};


// =========================================================
// EXPORT CONTROLLER FUNCTIONS
// =========================================================

module.exports = {

    getResultsReports,

    exportResultsReports

};