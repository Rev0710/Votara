const { generateOTP } = require("../utils/otp");
const { sendOTPEmail } = require("../services/emailService");

// Temporary storage for testing.
// Later this can be moved to MongoDB or Redis.
const otpStore = new Map();

/*
========================================
SEND REGISTRATION OTP
========================================
*/
const sendRegistrationOTP = async (req, res) => {
    try {
        const { studentId, email } = req.body;

        // Validate required fields
        if (!studentId || !email) {
            return res.status(400).json({
                success: false,
                message: "Student ID and email address are required.",
            });
        }

        // Clean input
        const cleanStudentId = String(studentId).trim();
        const cleanEmail = String(email).trim().toLowerCase();

        // Validate email
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address.",
            });
        }

        /*
        ========================================
        GENERATE OTP
        ========================================
        */

        // Always convert OTP to STRING
        const otp = String(generateOTP()).trim();

        console.log("=================================");
        console.log("GENERATED OTP");
        console.log("Student ID:", cleanStudentId);
        console.log("Email:", cleanEmail);
        console.log("OTP:", otp);
        console.log("OTP Type:", typeof otp);
        console.log("=================================");

        // OTP expires after 5 minutes
        const expiresAt =
            Date.now() + 5 * 60 * 1000;

        /*
        ========================================
        SAVE OTP
        ========================================
        */

        // If an OTP already exists for this email,
        // this replaces it with the new OTP.
        otpStore.set(cleanEmail, {
            studentId: cleanStudentId,
            otp: otp,
            expiresAt: expiresAt,
        });

        /*
        ========================================
        SEND EMAIL
        ========================================
        */

        await sendOTPEmail(cleanEmail, otp);

        console.log(`📨 OTP successfully sent to ${cleanEmail}`);

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


/*
========================================
VERIFY REGISTRATION OTP
========================================
*/
const verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate input
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: "Email and OTP are required.",
            });
        }

        // Normalize email and OTP
        const cleanEmail =
            String(email).trim().toLowerCase();

        const cleanOTP =
            String(otp).trim();

        /*
        ========================================
        CHECK OTP FORMAT
        ========================================
        */

        if (!/^\d{6}$/.test(cleanOTP)) {
            return res.status(400).json({
                success: false,
                message: "OTP must contain exactly 6 digits.",
            });
        }

        /*
        ========================================
        FIND REGISTRATION
        ========================================
        */

        const registration =
            otpStore.get(cleanEmail);

        if (!registration) {
            return res.status(400).json({
                success: false,
                message:
                    "OTP not found. Please request a new OTP.",
            });
        }

        /*
        ========================================
        CHECK EXPIRATION
        ========================================
        */

        if (Date.now() > registration.expiresAt) {

            otpStore.delete(cleanEmail);

            return res.status(400).json({
                success: false,
                message:
                    "OTP has expired. Please request a new OTP.",
            });
        }

        /*
        ========================================
        CHECK OTP
        ========================================
        */

        // Convert BOTH values to strings before comparing.
        const storedOTP =
            String(registration.otp).trim();

        console.log("=================================");
        console.log("OTP VERIFICATION");
        console.log("Email:", cleanEmail);
        console.log("Stored OTP:", storedOTP);
        console.log("Entered OTP:", cleanOTP);
        console.log(
            "Match:",
            storedOTP === cleanOTP
        );
        console.log("=================================");

        if (storedOTP !== cleanOTP) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP.",
            });
        }

        /*
        ========================================
        OTP SUCCESSFULLY VERIFIED
        ========================================
        */

        // Remove OTP so it cannot be reused
        otpStore.delete(cleanEmail);

        console.log(
            `✅ OTP verified successfully for ${cleanEmail}`
        );

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully.",
            studentId: registration.studentId,
            email: cleanEmail,
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


/*
========================================
EXPORT
========================================
*/

module.exports = {
    sendRegistrationOTP,
    verifyRegistrationOTP,
};