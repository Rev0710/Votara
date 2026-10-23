const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");


// =====================================================
// PROTECT STUDENT ROUTES
// =====================================================
//
// This middleware:
// 1. Reads the Bearer JWT.
// 2. Verifies the JWT.
// 3. Reads the Student ID from the JWT.
// 4. Finds the official student record in Supabase.
// 5. Attaches BOTH identifiers to req.student:
//
//    req.student.id
//        = Supabase students.id UUID
//
//    req.student.studentId
//        = Official Student ID number
//
// This is important because the voting tables use the
// Supabase students.id UUID, while the login JWT contains
// the student's Student ID number.
// =====================================================

const protectStudent = async (req, res, next) => {

    try {

        // =================================================
        // AUTHORIZATION HEADER
        // =================================================

        const authHeader =
            req.headers.authorization;


        if (!authHeader) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required.",

            });

        }


        // =================================================
        // EXTRACT BEARER TOKEN
        // =================================================

        const token =
            authHeader.startsWith("Bearer ")
                ? authHeader.substring(7).trim()
                : null;


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid authentication token.",

            });

        }


        // =================================================
        // VERIFY JWT
        // =================================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // =================================================
        // VERIFY STUDENT ROLE
        // =================================================
        //
        // Normal student login tokens contain:
        //
        // {
        //     studentId: "...",
        //     role: "student"
        // }
        //
        // We preserve the decoded token and add the
        // Supabase student UUID below.
        // =================================================

        if (
            decoded.role &&
            decoded.role !== "student"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Student access is required.",

            });

        }


        // =================================================
        // GET STUDENT ID FROM JWT
        // =================================================
        //
        // Normal student JWT:
        //
        // decoded.studentId
        //
        // We also support a few alternate property names
        // so this middleware remains compatible with
        // existing VOTARA authentication flows.
        // =================================================

        const studentId =
            decoded.studentId ||
            decoded.student_id ||
            decoded.studentNumber;


        if (!studentId) {

            console.error(
                "❌ Student authentication failed: JWT does not contain a Student ID."
            );

            return res.status(401).json({

                success: false,

                message:
                    "Student authentication information is missing.",

            });

        }


        const cleanStudentId =
            String(
                studentId
            ).trim();


        // Kiosk credentials have their own short-lived operation, not a normal
        // student login session. They may access only ballot routes.
        if (decoded.kiosk === true) {
            if (!/^\/api\/voting(?:\/|$)/.test(req.originalUrl || "") ||
                !decoded.kioskOperationId || !decoded.kioskSessionId || !decoded.electionId) {
                return res.status(403).json({success:false, message:"Kiosk access is limited to its active voting operation."});
            }
            const {data: operation, error: operationError} = await supabase.from("kiosk_operations")
                .select("id,kiosk_session_id,operation_status,last_activity_at,kiosk_sessions(id,election_id,session_status)")
                .eq("id", decoded.kioskOperationId).maybeSingle();
            if (operationError) return res.status(503).json({success:false, message:"Unable to verify the kiosk operation."});
            if (!operation || operation.operation_status !== "active" ||
                operation.kiosk_session_id !== decoded.kioskSessionId ||
                operation.kiosk_sessions?.session_status !== "active" ||
                operation.kiosk_sessions?.election_id !== decoded.electionId ||
                !Number.isFinite(new Date(operation.last_activity_at).getTime()) ||
                Date.now() - new Date(operation.last_activity_at).getTime() > 2 * 60 * 1000) {
                return res.status(401).json({success:false, code:"KIOSK_OPERATION_EXPIRED",
                    message:"This kiosk assistance has ended. Verify the student again."});
            }
        } else {
        // Enforce the database-backed single active session for newly issued tokens.
        if (!decoded.userId || !decoded.sid) {
            return res.status(401).json({
                success: false,
                code: "STUDENT_SESSION_INVALID",
                message: "Your session is no longer valid. Please log in again.",
            });
        }

        const { data: activeSession, error: activeSessionError } = await supabase
            .from("student_active_sessions")
            .select("session_id, expires_at")
            .eq("student_account_id", decoded.userId)
            .eq("session_id", decoded.sid)
            .maybeSingle();

        if (activeSessionError) {
            console.error("Student active-session verification failed:", activeSessionError.message);
            return res.status(503).json({
                success: false,
                message: "Unable to verify your active session. Please try again.",
            });
        }

        if (!activeSession || new Date(activeSession.expires_at).getTime() <= Date.now()) {
            return res.status(401).json({
                success: false,
                code: "STUDENT_SESSION_EXPIRED",
                message: "Your session has expired or is no longer active. Please log in again.",
            });
        }

        // Extend the idle timeout when the session is actively used.
        const refreshedExpiry = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        const { error: refreshError } = await supabase
            .from("student_active_sessions")
            .update({ expires_at: refreshedExpiry, last_seen_at: new Date().toISOString() })
            .eq("student_account_id", decoded.userId)
            .eq("session_id", decoded.sid);

        if (refreshError) {
            console.error("Student session activity refresh failed:", refreshError.message);
            return res.status(503).json({
                success: false,
                message: "Unable to refresh your session securely. Please try again.",
            });
        }



        }
        // =================================================
        // FIND OFFICIAL STUDENT RECORD
        // =================================================
        //
        // IMPORTANT:
        //
        // students.student_id
        //     = student's school ID number
        //
        // students.id
        //     = Supabase UUID
        //
        // Voting uses students.id.
        // =================================================

        const {
            data: studentRecord,
            error: studentError,
        } = await supabase

            .from("students")

            .select(`
                id,
                student_id,
                full_name,
                year_level,
                enrollment_status
            `)

            .eq(
                "student_id",
                cleanStudentId
            )

            .maybeSingle();


        // =================================================
        // SUPABASE ERROR
        // =================================================

        if (studentError) {

            console.error(
                "❌ Student authentication database error:",
                studentError
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to verify student authentication.",

            });

        }


        // =================================================
        // STUDENT NOT FOUND
        // =================================================

        if (!studentRecord) {

            console.warn(
                "⚠️ Student authentication failed. Student ID not found:",
                cleanStudentId
            );

            return res.status(401).json({

                success: false,

                message:
                    "Student account could not be verified.",

            });

        }


        // =================================================
        // OPTIONAL ENROLLMENT CHECK
        // =================================================
        //
        // If the official record exists but is not active,
        // do not allow normal student voting.
        //
        // We intentionally allow NULL/undefined here so
        // existing records without an enrollment status do
        // not suddenly break authentication.
        // =================================================

        if (
            studentRecord.enrollment_status &&
            String(
                studentRecord.enrollment_status
            ).toUpperCase() !== "ACTIVE"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Student is not currently enrolled.",

            });

        }


        // =================================================
        // ATTACH AUTHENTICATED STUDENT
        // =================================================
        //
        // Preserve everything from the JWT and add the
        // official Supabase student information.
        //
        // req.student.id
        //     -> UUID used by vote_participations
        //
        // req.student.studentId
        //     -> official Student ID number
        // =================================================

        req.student = {

            ...decoded,

            id:
                studentRecord.id,

            studentId:
                studentRecord.student_id,

            fullName:
                studentRecord.full_name,

            yearLevel:
                studentRecord.year_level,

            enrollmentStatus:
                studentRecord.enrollment_status,

        };


        // =================================================
        // AUTHENTICATION SUCCESS
        // =================================================

        console.log(
            "✅ Student authenticated:",
            studentRecord.student_id
        );


        next();

    } catch (error) {

        // =================================================
        // JWT ERRORS
        // =================================================

        console.error(
            "❌ Authentication error:",
            error.message
        );


        return res.status(401).json({

            success: false,

            message:
                "Invalid or expired authentication token.",

        });

    }

};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    protectStudent,

};