const Student = require("../models/Student");
const bcrypt = require("bcryptjs");
const { generateOTP } = require("../utils/otp");
const {sendOTPEmail} = require("../services/emailService");


// =====================================================
// SEND OTP
// =====================================================

const sendRegistrationOTP = async (req, res) => {
    try {
        const { studentId, email } = req.body;

        if (!studentId || !email) {
            return res.status(400).json({
                success: false,
                message: "Student ID and email are required.",
            });
        }

        const cleanStudentId = String(studentId).trim();
        const cleanEmail = String(email).trim().toLowerCase();

        // ---------------------------------------------
        // Find student in MongoDB
        // ---------------------------------------------

        const student = await Student.findOne({
            studentId: cleanStudentId,
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Student ID not found in the enrollment records. Please check your Student ID.",
            });
        }

        // ---------------------------------------------
        // Prevent duplicate registration
        // ---------------------------------------------

        if (student.registrationStatus === "submitted") {
            return res.status(400).json({
                success: false,
                message:
                    "This student is already registered.",
            });
        }

        // ---------------------------------------------
        // Generate 6-digit OTP
        // ---------------------------------------------

        const otp = generateOTP();

        console.log("=================================");
        console.log("🔐 NEW REGISTRATION OTP");
        console.log("Student ID:", cleanStudentId);
        console.log("Email:", cleanEmail);
        console.log("OTP:", otp);
        console.log("=================================");

        // ---------------------------------------------
        // Hash OTP
        // ---------------------------------------------

        const otpHash = await bcrypt.hash(otp, 10);

        // ---------------------------------------------
        // Save registration information
        // ---------------------------------------------

        student.email = cleanEmail;
        student.otpHash = otpHash;

        student.otpExpiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        student.otpVerified = false;
        student.otpVerifiedAt = null;

        student.registrationStatus = "pending";

        await student.save();

        // ---------------------------------------------
        // Send OTP email
        // ---------------------------------------------

        await sendOTPEmail(cleanEmail, otp);

        console.log(
            `📨 OTP sent successfully to ${cleanEmail}`
        );

        return res.status(200).json({
            success: true,
            message:
                "OTP has been sent to your email address.",
            studentId: student.studentId,
            email: student.email,
        });

    } catch (error) {
        console.error("❌ OTP sending error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to send OTP. Please try again.",
        });
    }
};


// =====================================================
// VERIFY OTP
// =====================================================

const verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message:
                    "Email and OTP are required.",
            });
        }

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        const cleanOTP = String(otp).trim();

        console.log("=================================");
        console.log("🔐 OTP VERIFICATION");
        console.log("Email:", cleanEmail);
        console.log("OTP received:", cleanOTP);
        console.log("=================================");

        // ---------------------------------------------
        // IMPORTANT:
        // otpHash has select:false in Student.js.
        // Therefore we MUST explicitly select it.
        // ---------------------------------------------

        const student = await Student.findOne({
            email: cleanEmail,
        }).select("+otpHash");

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Registration information not found. Please register again.",
            });
        }

        // ---------------------------------------------
        // Check OTP
        // ---------------------------------------------

        if (!student.otpHash) {
            return res.status(400).json({
                success: false,
                message:
                    "No active OTP found. Please request a new OTP.",
            });
        }

        // ---------------------------------------------
        // Check expiration
        // ---------------------------------------------

        if (
            !student.otpExpiresAt ||
            new Date() > student.otpExpiresAt
        ) {
            student.otpHash = null;
            student.otpExpiresAt = null;

            await student.save();

            return res.status(400).json({
                success: false,
                message:
                    "OTP has expired. Please request a new OTP.",
            });
        }

        // ---------------------------------------------
        // Compare OTP
        // ---------------------------------------------

        const otpIsCorrect = await bcrypt.compare(
            cleanOTP,
            student.otpHash
        );

        if (!otpIsCorrect) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid OTP. Please check the code sent to your email.",
            });
        }

        // =============================================
        // OTP SUCCESSFULLY VERIFIED
        // =============================================

        student.otpHash = null;
        student.otpExpiresAt = null;

        student.otpVerified = true;
        student.otpVerifiedAt = new Date();

        student.registrationStatus = "submitted";
        student.registeredAt = new Date();

        await student.save();

        console.log(
            `✅ OTP verified for ${cleanEmail}`
        );

        console.log(
            `✅ Registration submitted for Student ID ${student.studentId}`
        );

        return res.status(200).json({
            success: true,
            message:
                "OTP verified successfully. Registration submitted.",

            student: {
                studentId: student.studentId,
                fullName: student.fullName,
                yearLevel: student.yearLevel,
                email: student.email,
                registrationStatus:
                    student.registrationStatus,
            },
        });

    } catch (error) {
        console.error("❌ OTP verification error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to verify OTP.",
        });
    }
};


// =====================================================
// RESEND OTP
// =====================================================

const resendRegistrationOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message:
                    "Email address is required.",
            });
        }

        const cleanEmail = String(email)
            .trim()
            .toLowerCase();

        // ---------------------------------------------
        // Find student
        // ---------------------------------------------

        const student = await Student.findOne({
            email: cleanEmail,
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message:
                    "Registration information not found. Please register again.",
            });
        }

        // ---------------------------------------------
        // Don't resend if already submitted
        // ---------------------------------------------

        if (student.registrationStatus === "submitted") {
            return res.status(400).json({
                success: false,
                message:
                    "This registration has already been submitted.",
            });
        }

        // ---------------------------------------------
        // Generate NEW OTP
        // ---------------------------------------------

        const otp = generateOTP();

        console.log("=================================");
        console.log("🔄 RESEND OTP");
        console.log("Email:", cleanEmail);
        console.log("New OTP:", otp);
        console.log("=================================");

        // ---------------------------------------------
        // Hash new OTP
        // ---------------------------------------------

        const otpHash = await bcrypt.hash(otp, 10);

        student.otpHash = otpHash;

        student.otpExpiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        student.otpVerified = false;
        student.otpVerifiedAt = null;

        student.registrationStatus = "pending";

        await student.save();

        // ---------------------------------------------
        // Send NEW OTP
        // ---------------------------------------------

        await sendOTPEmail(cleanEmail, otp);

        console.log(
            `🔄 New OTP sent to: ${cleanEmail}`
        );

        return res.status(200).json({
            success: true,
            message:
                "A new OTP has been sent to your email.",
        });

    } catch (error) {
        console.error("❌ Resend OTP error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Unable to resend OTP.",
        });
    }
};


module.exports = {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP,
};