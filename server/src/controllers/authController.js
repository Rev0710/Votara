const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");

// =====================================================
// STUDENT LOGIN
// =====================================================

const studentLogin = async (req, res) => {
    try {
        const { studentId, password } = req.body;

        if (!studentId || !password) {
            return res.status(400).json({
                success: false,
                message:
                    "Student ID and password are required.",
            });
        }

        const cleanStudentId =
            String(studentId).trim();

        // =================================================
        // FIND STUDENT
        // =================================================

        const student =
            await Student.findOne({
                studentId: cleanStudentId,
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student ID not found.",
            });
        }

        // =================================================
        // STUDENT MUST REGISTER FIRST
        // =================================================

        if (
            student.registrationStatus !==
            "submitted"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Your registration has not been completed. Please register first.",
            });
        }

        // =================================================
        // PASSWORD
        // =================================================

        const defaultPassword =
            process.env.DEFAULT_STUDENT_PASSWORD;

        let passwordCorrect = false;

        // =================================================
        // FIRST LOGIN
        // =================================================

        if (!student.passwordHash) {

            if (!defaultPassword) {
                return res.status(500).json({
                    success: false,
                    message:
                        "Default student password is not configured on the server.",
                });
            }

            passwordCorrect =
                password === defaultPassword;

        } else {

            // =================================================
            // NORMAL LOGIN AFTER PASSWORD CHANGE
            // =================================================

            passwordCorrect =
                await bcrypt.compare(
                    password,
                    student.passwordHash
                );
        }

        // =================================================
        // INCORRECT PASSWORD
        // =================================================

        if (!passwordCorrect) {
            return res.status(401).json({
                success: false,
                message:
                    "Incorrect password.",
            });
        }

        // =================================================
        // CREATE JWT
        // =================================================

        const token =
            jwt.sign(
                {
                    studentId:
                        student.studentId,

                    role: "student",
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:
                        process.env.JWT_EXPIRES_IN ||
                        "1d",
                }
            );

        // =================================================
        // CHECK PASSWORD STATUS
        // =================================================

        const mustChangePassword =
            !student.passwordHash ||
            student.mustChangePassword === true;

        // =================================================
        // LOGIN SUCCESS
        // =================================================

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            mustChangePassword,

            student: {
                studentId:
                    student.studentId,

                fullName:
                    student.fullName,

                yearLevel:
                    student.yearLevel,

                email:
                    student.email,

                profilePicture:
                    student.profilePicture,

                registrationStatus:
                    student.registrationStatus,
            },
        });

    } catch (error) {

        console.error(
            "❌ Student login error:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to login.",
        });
    }
};


// =====================================================
// CHANGE TEMPORARY PASSWORD
// =====================================================

const changeTemporaryPassword = async (
    req,
    res
) => {

    try {

        const studentId =
            req.student.studentId;

        const {
            newPassword,
            confirmPassword,
        } = req.body;

        // =================================================
        // VALIDATION
        // =================================================

        if (
            !newPassword ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please enter and confirm your new password.",
            });
        }

        if (
            newPassword !==
            confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match.",
            });
        }

       // =============================================
// PASSWORD SECURITY REQUIREMENTS
// =============================================

if (newPassword.length < 8) {
    return res.status(400).json({
        success: false,
        message:
            "Password must be at least 8 characters.",
    });
}

if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({
        success: false,
        message:
            "Password must contain at least one uppercase letter.",
    });
}

if (!/[a-z]/.test(newPassword)) {
    return res.status(400).json({
        success: false,
        message:
            "Password must contain at least one lowercase letter.",
    });
}

if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({
        success: false,
        message:
            "Password must contain at least one number.",
    });
}

if (!/[^A-Za-z0-9]/.test(newPassword)) {
    return res.status(400).json({
        success: false,
        message:
            "Password must contain at least one special character.",
    });
}
        // =================================================
        // FIND STUDENT
        // =================================================

        const student =
            await Student.findOne({
                studentId,
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student not found.",
            });
        }

        // =================================================
        // MAKE SURE REGISTRATION IS COMPLETE
        // =================================================

        if (
            student.registrationStatus !==
            "submitted"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Student registration is not completed.",
            });
        }

        // =================================================
        // HASH NEW PASSWORD
        // =================================================

        const passwordHash =
            await bcrypt.hash(
                newPassword,
                10
            );

        student.passwordHash =
            passwordHash;

        student.mustChangePassword =
            false;

        await student.save();

        console.log(
            `✅ Password changed for Student ID ${student.studentId}`
        );

        return res.status(200).json({
            success: true,
            message:
                "Password changed successfully.",
        });

    } catch (error) {

        console.error(
            "❌ Change password error:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to change password.",
        });
    }
};


// =====================================================
// UPLOAD PROFILE PICTURE
// =====================================================

const uploadProfilePicture = async (
    req,
    res
) => {

    try {

        const studentId =
            req.student.studentId;

        const {
            profilePicture,
        } = req.body;

        if (!profilePicture) {
            return res.status(400).json({
                success: false,
                message:
                    "Profile picture is required.",
            });
        }

        // =================================================
        // BASIC IMAGE VALIDATION
        // =================================================

        if (
            !profilePicture.startsWith(
                "data:image/"
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid image format.",
            });
        }

        // =================================================
        // FIND STUDENT
        // =================================================

        const student =
            await Student.findOne({
                studentId,
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student not found.",
            });
        }

        // =================================================
        // PASSWORD MUST ALREADY BE CHANGED
        // =================================================

        if (
            student.mustChangePassword === true
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Please change your password before uploading your profile picture.",
            });
        }

        // =================================================
        // SAVE PROFILE PICTURE
        // =================================================

        student.profilePicture =
            profilePicture;

        student.profilePictureUploadedAt =
            new Date();

        await student.save();

        console.log(
            `📸 Profile picture uploaded for Student ID ${student.studentId}`
        );

        return res.status(200).json({

            success: true,

            message:
                "Profile picture uploaded successfully.",

            profilePicture:
                student.profilePicture,
        });

    } catch (error) {

        console.error(
            "❌ Profile picture upload error:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to upload profile picture.",
        });
    }
};


// =====================================================
// GET CURRENT STUDENT
// =====================================================

const getCurrentStudent = async (
    req,
    res
) => {

    try {

        const student =
            await Student.findOne({
                studentId:
                    req.student.studentId,
            });

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student not found.",
            });
        }

        return res.status(200).json({

            success: true,

            student: {

                studentId:
                    student.studentId,

                fullName:
                    student.fullName,

                yearLevel:
                    student.yearLevel,

                email:
                    student.email,

                profilePicture:
                    student.profilePicture,

                registrationStatus:
                    student.registrationStatus,

                hasVoted:
                    student.hasVoted,
            },
        });

    } catch (error) {

        console.error(
            "❌ Get student error:"
        );

        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to get student information.",
        });
    }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
    studentLogin,
    changeTemporaryPassword,
    uploadProfilePicture,
    getCurrentStudent,
};