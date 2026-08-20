const { generateOTP } = require("../utils/otp");
const { sendOTPEmail } = require("../services/emailService");

// Temporary storage for testing.
// Later we will move this into MongoDB/Redis.
const otpStore = new Map();

const sendRegistrationOTP = async (req, res) => {
    try {
        const { studentId, email } = req.body;

        // Validate input
        if (!studentId || !email) {
            return res.status(400).json({
                success: false,
                message: "Student ID and email address are required.",
            });
        }

        // Basic email validation
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // OTP expires after 5 minutes
        const expiresAt = Date.now() + 5 * 60 * 1000;

        // Store temporarily
        otpStore.set(email.toLowerCase(), {
            studentId,
            otp,
            expiresAt,
        });

        // Send email
        await sendOTPEmail(email, otp);

        console.log(
            `📨 OTP sent to ${email}`
        );

        // Don't return OTP to frontend
        return res.status(200).json({
            success: true,
            message: "OTP has been sent to your email address.",
        });

    } catch (error) {
        console.error("❌ OTP sending error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to send OTP. Please try again.",
        });
    }
};

const verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        const registration = otpStore.get(
            email.toLowerCase()
        );

        if (!registration) {
            return res.status(400).json({
                success: false,
                message: "OTP not found. Please request a new OTP.",
            });
        }

        // Check expiration
        if (Date.now() > registration.expiresAt) {
            otpStore.delete(email.toLowerCase());

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new OTP.",
            });
        }

        // Check OTP
        if (registration.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        // OTP successfully verified
        otpStore.delete(email.toLowerCase());

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
            studentId: registration.studentId,
        });

    } catch (error) {
        console.error("❌ OTP verification error:");
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Unable to verify OTP.",
        });
    }
};

module.exports = {
    sendRegistrationOTP,
    verifyRegistrationOTP,
};