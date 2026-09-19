const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");


// =========================================================
// STUDENT LOGIN
// =========================================================

const studentLogin = async (req, res) => {

    try {

        const {
            studentId,
            password,
        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !studentId ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Student ID and password are required.",

            });

        }


        const normalizedStudentId =
            String(studentId).trim();


        // =================================================
        // FIND STUDENT ACCOUNT
        // =================================================

        const {
            data: account,
            error: accountError,
        } = await supabase
            .from("student_accounts")
            .select(`
                id,
                student_id,
                registration_id,
                email,
                password_hash,
                must_change_password,
                account_status,
                created_at
            `)
            .eq(
                "student_id",
                normalizedStudentId
            )
            .maybeSingle();


        if (accountError) {

            console.error(
                "❌ Student account lookup error:",
                accountError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to process student login.",

            });

        }


        if (!account) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid Student ID or password.",

            });

        }


        // =================================================
        // CHECK ACCOUNT STATUS
        // =================================================

        if (
            account.account_status !==
            "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your VOTARA account is not currently active.",

            });

        }


        // =================================================
        // VERIFY PASSWORD
        // =================================================

        const passwordMatches =
            await bcrypt.compare(
                password,
                account.password_hash
            );


        if (!passwordMatches) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid Student ID or password.",

            });

        }


        // =================================================
        // GET OFFICIAL STUDENT INFORMATION
        // =================================================

        const {
            data: student,
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
                account.student_id
            )
            .maybeSingle();


        if (studentError) {

            console.error(
                "❌ Student information lookup error:",
                studentError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load student information.",

            });

        }


        if (!student) {

            return res.status(403).json({

                success: false,

                message:
                    "Your student record could not be found.",

            });

        }


        // =================================================
        // VERIFY ACTIVE ENROLLMENT
        // =================================================

        if (
            String(
                student.enrollment_status
            ).toUpperCase() !==
            "ACTIVE"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your enrollment status is not active.",

            });

        }


        // =================================================
        // PASSWORD SETUP STATUS
        // =================================================

        const mustChangePassword =
            account.must_change_password === true;


        // =================================================
        // CREATE JWT
        // =================================================

        const token =
            jwt.sign(

                {
                    userId:
                        account.id,

                    studentId:
                        account.student_id,

                    email:
                        account.email,

                    fullName:
                        student.full_name,

                    yearLevel:
                        student.year_level,

                    role:
                        "student",

                    mustChangePassword,

                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "8h",
                }

            );


        // =================================================
        // NEXT STEP
        // =================================================

        let nextStep =
            "dashboard";


        if (
            mustChangePassword
        ) {

            nextStep =
                "change-password";

        }


        // =================================================
        // LOGIN RESPONSE
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                mustChangePassword
                    ? "Login successful. You must change your temporary password before continuing."
                    : "Login successful.",

            token,

            mustChangePassword,

            needsProfilePicture:
                false,

            nextStep,

            student: {

                studentId:
                    account.student_id,

                fullName:
                    student.full_name,

                email:
                    account.email,

                yearLevel:
                    student.year_level,

            },

        });

    } catch (error) {

        console.error(
            "❌ Student login error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to process student login.",

        });

    }
};


// =========================================================
// CHANGE TEMPORARY PASSWORD
// =========================================================

const changeTemporaryPassword = async (
    req,
    res
) => {

    try {

        // =================================================
        // AUTHENTICATION
        // =================================================

        const authHeader =
            req.headers.authorization;


        if (
            !authHeader ||
            !authHeader.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token is required.",

            });

        }


        const token =
            authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token is missing.",

            });

        }


        let decoded;

        try {

            decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

        } catch (tokenError) {

            return res.status(401).json({

                success: false,

                message:
                    "Your login session has expired. Please log in again.",

            });

        }


        // =================================================
        // VERIFY STUDENT TOKEN
        // =================================================

        if (
            !decoded ||
            decoded.role !==
                "student" ||
            !decoded.userId ||
            !decoded.studentId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Student access is required.",

            });

        }


        // =================================================
        // REQUEST DATA
        // =================================================

        const {
            newPassword,
            confirmPassword,
        } = req.body;


        if (
            !newPassword ||
            !confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password and confirmation password are required.",

            });

        }


        // =================================================
        // PASSWORD RULES
        // =================================================

        const requirements = {

            minLength:
                newPassword.length >= 8,

            uppercase:
                /[A-Z]/.test(
                    newPassword
                ),

            lowercase:
                /[a-z]/.test(
                    newPassword
                ),

            number:
                /[0-9]/.test(
                    newPassword
                ),

            special:
                /[^A-Za-z0-9]/.test(
                    newPassword
                ),

        };


        const passwordValid =
            Object.values(
                requirements
            ).every(
                Boolean
            );


        if (!passwordValid) {

            return res.status(400).json({

                success: false,

                message:
                    "Password does not meet all requirements.",

                requirements,

            });

        }


        // =================================================
        // CONFIRM PASSWORD
        // =================================================

        if (
            newPassword !==
            confirmPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password and confirmation password do not match.",

            });

        }


        // =================================================
        // FIND ACCOUNT
        // =================================================

        const {
            data: account,
            error: accountError,
        } = await supabase
            .from("student_accounts")
            .select(`
                id,
                student_id,
                email,
                password_hash,
                must_change_password,
                account_status
            `)
            .eq(
                "id",
                decoded.userId
            )
            .eq(
                "student_id",
                decoded.studentId
            )
            .maybeSingle();


        if (accountError) {

            console.error(
                "❌ Password account lookup error:",
                accountError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to access your student account.",

            });

        }


        if (!account) {

            return res.status(404).json({

                success: false,

                message:
                    "Student account not found.",

            });

        }


        // =================================================
        // ACCOUNT STATUS
        // =================================================

        if (
            account.account_status !==
            "active"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Your student account is not active.",

            });

        }


        // =================================================
        // CHECK IF PASSWORD IS ALREADY PERMANENT
        // =================================================

        if (
            account.must_change_password !==
            true
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Your temporary password has already been changed.",

            });

        }


        // =================================================
        // PREVENT REUSING TEMPORARY PASSWORD
        // =================================================

        const samePassword =
            await bcrypt.compare(
                newPassword,
                account.password_hash
            );


        if (samePassword) {

            return res.status(400).json({

                success: false,

                message:
                    "Your new password must be different from your temporary password.",

            });

        }


        // =================================================
        // HASH NEW PASSWORD
        // =================================================

        const newPasswordHash =
            await bcrypt.hash(
                newPassword,
                12
            );


        // =================================================
        // UPDATE ACCOUNT
        // =================================================

        const {
            data: updatedAccount,
            error: updateError,
        } = await supabase
            .from("student_accounts")
            .update({

                password_hash:
                    newPasswordHash,

                must_change_password:
                    false,

            })
            .eq(
                "id",
                account.id
            )
            .eq(
                "must_change_password",
                true
            )
            .select(`
                id,
                student_id,
                email,
                must_change_password,
                account_status
            `)
            .single();


        if (updateError) {

            console.error(
                "❌ Student password update error:",
                updateError.message
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to update your password.",

            });

        }


        // =================================================
        // SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Password changed successfully. Your temporary password is no longer valid.",

            mustChangePassword:
                updatedAccount.must_change_password,

            student: {

                studentId:
                    updatedAccount.student_id,

                email:
                    updatedAccount.email,

            },

        });

    } catch (error) {

        console.error(
            "❌ Student password change error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to change student password.",

        });

    }
};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    studentLogin,

    changeTemporaryPassword,

};