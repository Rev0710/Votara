require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

// =====================================================
// ROUTES
// =====================================================

const settingsRoutes =
    require("./src/routes/settingsRoutes");

    const adminSettingsRoutes =
    require("./src/routes/adminSettingsRoutes");

const auditLogsRoutes =
    require("./src/routes/auditLogsRoutes");

const lateEnrolleeRoutes =
    require("./src/routes/lateEnrolleeRoutes");

const candidateRoutes =
    require("./src/routes/candidateRoutes");

const supabase =
    require("./src/config/supabase");

const electionRoutes =
    require("./src/routes/electionRoutes");

const adminAuthRoutes =
    require("./src/routes/adminAuthRoutes");

const authRoutes =
    require("./src/routes/authRoutes");

const ebAuthRoutes =
    require("./src/routes/ebAuthRoutes");

const profileRoutes =
    require("./src/routes/profileRoutes");

const registrationRoutes =
    require("./src/routes/registrationRoutes");

const registrationDocumentsRoutes =
    require("./src/routes/registrationDocumentsRoutes");

const staffAuthRoutes =
    require("./src/routes/staffAuthRoutes");

const adminRoutes =
    require("./src/routes/adminRoutes");

const ebRegistrationRoutes =
    require("./src/routes/ebRegistrationRoutes");

const votingRoutes =
    require("./src/routes/votingRoutes");

const partyListRoutes =
    require("./src/routes/partyListRoutes");

const votingMonitoringRoutes =
    require("./src/routes/votingMonitoringRoutes");

const kioskRoutes =
    require("./src/routes/kioskRoutes");

const resultsReportsRoutes =
    require("./src/routes/resultsReportsRoutes");

const studentRoutes =
    require("./src/routes/studentRoutes");


// =====================================================
// EXPRESS APP
// =====================================================

const app = express();


// =====================================================
// ENVIRONMENT
// =====================================================

require("dotenv").config({
    path: path.join(__dirname, ".env"),
});

const PORT =
    process.env.PORT || 5000;


// =====================================================
// ENVIRONMENT CHECK
// =====================================================

console.log("=================================");
console.log("🔧 VOTARA ENVIRONMENT CHECK");
console.log("=================================");

console.log(
    "SUPABASE_URL configured:",
    Boolean(process.env.SUPABASE_URL)
);

console.log(
    "SUPABASE_SECRET_KEY configured:",
    Boolean(process.env.SUPABASE_SECRET_KEY)
);

console.log(
    "JWT_SECRET configured:",
    Boolean(process.env.JWT_SECRET)
);

console.log(
    "EMAIL_HOST:",
    process.env.EMAIL_HOST || "Not configured"
);

console.log(
    "EMAIL_PORT:",
    process.env.EMAIL_PORT || "Not configured"
);

console.log(
    "EMAIL_USER:",
    process.env.EMAIL_USER || "Not configured"
);

console.log(
    "EMAIL_PASS configured:",
    Boolean(process.env.EMAIL_PASS)
);

console.log(
    "DEFAULT_STUDENT_PASSWORD configured:",
    Boolean(process.env.DEFAULT_STUDENT_PASSWORD)
);

console.log(
    "PORT:",
    PORT
);

console.log("=================================");


// =====================================================
// CORS
// =====================================================

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://votara-election-system.vercel.app",
        ],
        credentials: true,
    })
);


// =====================================================
// BODY PARSER
// =====================================================

app.use(
    express.json({
        limit: "12mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "12mb",
    })
);


// =====================================================
// STAFF AUTH API
// =====================================================

app.use(
    "/api/staff-auth",
    staffAuthRoutes
);


// =====================================================
// ADMIN API
// =====================================================

app.use(
    "/api/admin",
    adminRoutes
);


// =====================================================
// VOTING API
// =====================================================

app.use(
    "/api/voting",
    votingRoutes
);


// =====================================================
// ELECTORAL BOARD REGISTRATION API
// =====================================================

app.use(
    "/api/eb",
    ebRegistrationRoutes
);


// =====================================================
// ELECTION API
// =====================================================

app.use(
    "/api/elections",
    electionRoutes
);


// =====================================================
// CANDIDATE API
// =====================================================

app.use(
    "/api/candidates",
    candidateRoutes
);


// =====================================================
// PARTY LIST API
// =====================================================

app.use(
    "/api/party-lists",
    partyListRoutes
);


// =====================================================
// VOTING MONITORING API
// =====================================================

app.use(
    "/api/electoral-board/voting-monitoring",
    votingMonitoringRoutes
);


// =====================================================
// ELECTORAL BOARD KIOSK API
// =====================================================

app.use(
    "/api/kiosk",
    kioskRoutes
);


// =====================================================
// LATE ENROLLEE API
// =====================================================

app.use(
    "/api/electoral-board/late-enrollees",
    lateEnrolleeRoutes
);


// =====================================================
// RESULTS & REPORTS API
// =====================================================

app.use(
    "/api/electoral-board/results-reports",
    resultsReportsRoutes
);


// =====================================================
// AUDIT LOGS API
// =====================================================

app.use(
    "/api/electoral-board/audit-logs",
    auditLogsRoutes
);


// =====================================================
// STUDENT API
// =====================================================

app.use(
    "/api/students",
    studentRoutes
);


// =====================================================
// ELECTORAL BOARD SETTINGS API
// =====================================================

app.use(
    "/api/electoral-board/settings",
    settingsRoutes
);


// =====================================================
// SERVER TEST ROUTE
// =====================================================

app.get(
    "/",
    (req, res) => {

        return res.status(200).json({
            success: true,
            message: "VOTARA server is running.",
            port: PORT,
        });

    }
);


// =====================================================
// API HEALTH CHECK
// =====================================================

app.get(
    "/api/health",
    (req, res) => {

        return res.status(200).json({
            success: true,
            message: "VOTARA API is running.",
            database: "Supabase",
            timestamp:
                new Date().toISOString(),
        });

    }
);


// =====================================================
// SUPABASE TEST ROUTE
// =====================================================

app.get(
    "/api/test-supabase",
    async (req, res) => {

        try {

            const {
                data,
                error,
            } = await supabase
                .from("students")
                .select(
                    "student_id, full_name, year_level"
                )
                .limit(5);


            if (error) {

                console.error(
                    "❌ Supabase test error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Supabase connection failed.",
                    error:
                        error.message,
                });

            }


            return res.status(200).json({
                success: true,
                message:
                    "Supabase connection successful.",
                students: data,
            });

        } catch (error) {

            console.error(
                "❌ Supabase connection error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Unable to connect to Supabase.",
            });

        }

    }
);


// =====================================================
// SUPABASE STUDENT TEST ROUTE
// =====================================================

app.get(
    "/api/test-supabase-student/:studentId",
    async (req, res) => {

        try {

            const studentId =
                String(
                    req.params.studentId
                ).trim();


            console.log(
                "🔎 Testing Supabase student ID:",
                studentId
            );


            const {
                data,
                error,
            } = await supabase
                .from("students")
                .select(
                    "student_id, full_name, year_level"
                )
                .eq(
                    "student_id",
                    studentId
                )
                .maybeSingle();


            console.log(
                "📦 Supabase returned:",
                data
            );


            if (error) {

                console.error(
                    "❌ Supabase student test error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    error:
                        error.message,
                });

            }


            return res.status(200).json({

                success: true,

                searchedStudentId:
                    studentId,

                found:
                    Boolean(data),

                student:
                    data,

            });

        } catch (error) {

            console.error(
                "❌ Student lookup test failed:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Student lookup test failed.",

            });

        }

    }
);


// =====================================================
// ADMIN AUTH API
// =====================================================

app.use(
    "/api/admin-auth",
    adminAuthRoutes
);

app.use(
    "/api/admin/settings",
    adminSettingsRoutes
);

// =====================================================
// REGISTRATION API
// =====================================================

app.use(
    "/api/registration",
    registrationRoutes
);


// =====================================================
// REGISTRATION DOCUMENTS API
// =====================================================

app.use(
    "/api/registration-documents",
    registrationDocumentsRoutes
);


// =====================================================
// AUTH API
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);


// =====================================================
// ELECTORAL BOARD AUTH API
// =====================================================

app.use(
    "/api/eb-auth",
    ebAuthRoutes
);


// =====================================================
// PROFILE API
// =====================================================

app.use(
    "/api/profile",
    profileRoutes
);


// =====================================================
// UNKNOWN ROUTE
// =====================================================

app.use(
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                `Route not found: ${req.method} ${req.originalUrl}`,

        });

    }
);


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "================================="
        );

        console.error(
            "❌ SERVER ERROR"
        );

        console.error(
            "================================="
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );


        return res.status(500).json({

            success: false,

            message:
                "An unexpected server error occurred.",

        });

    }
);


// =====================================================
// START SERVER
// =====================================================

const startServer = async () => {

    try {

        // =================================================
        // CHECK REQUIRED ENVIRONMENT VARIABLES
        // =================================================

        if (!process.env.JWT_SECRET) {

            throw new Error(
                "JWT_SECRET is missing from .env"
            );

        }


        if (!process.env.SUPABASE_URL) {

            throw new Error(
                "SUPABASE_URL is missing from .env"
            );

        }


        if (!process.env.SUPABASE_SECRET_KEY) {

            throw new Error(
                "SUPABASE_SECRET_KEY is missing from .env"
            );

        }


        // =================================================
        // START EXPRESS SERVER
        // =================================================

        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    "================================="
                );

                console.log(
                    `🚀 VOTARA server running on port ${PORT}`
                );

                console.log(
                    `🌐 Server host: 0.0.0.0:${PORT}`
                );

                console.log(
                    `❤️  Health: /api/health`
                );

                console.log(
                    `🟦 Supabase: /api/test-supabase`
                );

                console.log(
                    `📝 Registration API: /api/registration`
                );

                console.log(
                    `📁 Registration Documents API: /api/registration-documents`
                );

                console.log(
                    `📊 Results & Reports API: /api/electoral-board/results-reports`
                );

                console.log(
                    `🗳️ Voting API: /api/voting`
                );

                console.log(
                    `🏫 Electoral Board API: /api/eb`
                );

                console.log(
                    `🖥️ Kiosk API: /api/kiosk`
                );

                console.log(
                    "================================="
                );

            }
        );

    } catch (error) {

        console.error(
            "================================="
        );

        console.error(
            "❌ VOTARA SERVER STARTUP FAILED"
        );

        console.error(
            "================================="
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );

        process.exit(1);

    }

};

// =====================================================
// RUN SERVER
// =====================================================

startServer();