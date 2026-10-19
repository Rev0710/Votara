const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const { generateOTP } = require("../utils/otp");
const { sendOTPEmail } = require("../services/emailService");
const { ownsRegistration, issueRegistrationToken } = require("../services/registrationSessionService");

// Existing applications require their original capability or email verification.
// A new late-enrollee draft receives its capability in the existing response.
const prepareRegistrationSession = async (req, res, next) => {
    const studentId = String(req.body?.studentId || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!/^\d{5}$/.test(studentId) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return next();
    try {
        const { data: registration, error } = await supabase.from("registration_applications")
            .select("*").eq("student_id", studentId).order("created_at", { ascending: false })
            .limit(1).maybeSingle();
        if (error) throw error;
        const protectedApplication = registration && (
            ["otp_verified", "needs_correction"].includes(registration.application_status)
            || (["late", "late_enrollee"].includes(registration.registration_type)
                && registration.application_status === "draft")
        );
        if (protectedApplication) {
            if (String(registration.email || "").trim().toLowerCase() !== email) {
                return res.status(409).json({ success: false,
                    message: "Please use the email already linked to this registration." });
            }
            if (!ownsRegistration(req, registration)) {
                // Recover through the same OTP page; never issue a capability from identifiers alone.
                const otp = generateOTP();
                const otpHash = await bcrypt.hash(otp, 10);
                const { error: invalidateError } = await supabase.from("otp_codes")
                    .update({ verification_status: "invalidated" })
                    .eq("registration_id", registration.id).eq("verification_status", "active");
                if (invalidateError) throw invalidateError;
                const { error: insertError } = await supabase.from("otp_codes").insert({
                    registration_id: registration.id, student_id: studentId, email,
                    otp_hash: otpHash, purpose: "registration", attempt_count: 0, max_attempts: 5,
                    verification_status: "active", expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
                });
                if (insertError) throw insertError;
                try {
                    await sendOTPEmail(email, studentId, otp);
                } catch (emailError) {
                    await supabase.from("otp_codes").update({ verification_status: "invalidated" })
                        .eq("registration_id", registration.id).eq("otp_hash", otpHash);
                    throw emailError;
                }
                return res.status(200).json({ success: true, studentFound: true, exists: true,
                    requiresOTP: true, registrationType: registration.registration_type,
                    message: "A verification code has been sent to your registration email.",
                    student: { studentId, email, fullName: registration.full_name,
                        yearLevel: registration.year_level, registrationType: registration.registration_type } });
            }
            req.registrationSessionVerified = true;
        }
        const originalJson = res.json;
        res.json = function (body) {
            if (body?.success && body.registrationId && (req.registrationSessionVerified
                || (body.isLateEnrollee && (!registration
                    || String(body.registrationId) !== String(registration.id))))) {
                body.registrationToken = issueRegistrationToken({ id: body.registrationId,
                    student_id: studentId, email });
            }
            return originalJson.call(this, body);
        };
        return next();
    } catch {
        return res.status(503).json({ success: false, message: "Unable to prepare registration verification. Please try again." });
    }
};

module.exports = prepareRegistrationSession;
