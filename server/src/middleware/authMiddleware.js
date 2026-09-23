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