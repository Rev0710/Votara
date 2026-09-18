import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./OTPVerification.css";

const OTP_LENGTH = 6;

const OTPVerification = () => {
    const navigate = useNavigate();

    // =====================================================
    // STATE
    // =====================================================

    const [otp, setOtp] = useState(
        Array(OTP_LENGTH).fill("")
    );

    const [email, setEmail] = useState("");
    const [studentId, setStudentId] = useState("");
    const [fullName, setFullName] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [registrationType, setRegistrationType] =
        useState("normal");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const [countdown, setCountdown] = useState(30);

    const inputRefs = useRef([]);

    // =====================================================
    // LOAD REGISTRATION INFORMATION
    // =====================================================

    useEffect(() => {
        const savedStudentId =
            sessionStorage.getItem(
                "votara_student_id"
            );

        const savedEmail =
            sessionStorage.getItem(
                "votara_email"
            );

        const savedFullName =
            sessionStorage.getItem(
                "votara_full_name"
            );

        const savedYearLevel =
            sessionStorage.getItem(
                "votara_year_level"
            );

        const savedRegistrationType =
            sessionStorage.getItem(
                "votara_registration_type"
            );

        // -------------------------------------------------
        // REQUIRE BASIC REGISTRATION INFORMATION
        // -------------------------------------------------

        if (
            !savedStudentId ||
            !savedEmail
        ) {
            setError(
                "Registration information is missing. Please register again."
            );

            return;
        }

        setStudentId(savedStudentId);
        setEmail(savedEmail);
        setFullName(savedFullName || "");
        setYearLevel(savedYearLevel || "");

        setRegistrationType(
            savedRegistrationType ||
            "normal"
        );

    }, []);

    // =====================================================
    // COUNTDOWN
    // =====================================================

    useEffect(() => {
        if (countdown <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setCountdown(
                (previous) =>
                    previous - 1
            );
        }, 1000);

        return () => {
            clearInterval(timer);
        };

    }, [countdown]);

    // =====================================================
    // OTP INPUT
    // =====================================================

    const handleOtpChange = (
        index,
        value
    ) => {

        // Numbers only
        if (!/^\d*$/.test(value)) {
            return;
        }

        const newOtp = [...otp];

        newOtp[index] =
            value.slice(-1);

        setOtp(newOtp);

        setError("");
        setMessage("");

        // Move to next box
        if (
            value &&
            index < OTP_LENGTH - 1
        ) {
            inputRefs.current[
                index + 1
            ]?.focus();
        }
    };

    // =====================================================
    // BACKSPACE
    // =====================================================

    const handleKeyDown = (
        index,
        e
    ) => {

        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[
                index - 1
            ]?.focus();
        }
    };

    // =====================================================
    // PASTE OTP
    // =====================================================

    const handlePaste = (e) => {

        e.preventDefault();

        const pastedData =
            e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(
                    0,
                    OTP_LENGTH
                );

        if (!pastedData) {
            return;
        }

        const newOtp =
            Array(OTP_LENGTH).fill("");

        pastedData
            .split("")
            .forEach(
                (
                    number,
                    index
                ) => {
                    newOtp[index] =
                        number;
                }
            );

        setOtp(newOtp);

        setError("");
        setMessage("");

        const nextIndex =
            Math.min(
                pastedData.length,
                OTP_LENGTH - 1
            );

        inputRefs.current[
            nextIndex
        ]?.focus();
    };

    // =====================================================
    // VERIFY OTP
    // =====================================================

    const handleVerifyOTP = async (
        e
    ) => {

        e.preventDefault();

        // -------------------------------------------------
        // PREVENT DOUBLE SUBMISSION
        // -------------------------------------------------

        if (loading) {
            return;
        }

        setError("");
        setMessage("");

        const enteredOTP =
            otp.join("");

        // -------------------------------------------------
        // VALIDATE OTP
        // -------------------------------------------------

        if (
            enteredOTP.length !==
            OTP_LENGTH
        ) {
            setError(
                "Please enter the complete 6-digit OTP."
            );

            return;
        }

        // -------------------------------------------------
        // VALIDATE REGISTRATION INFO
        // -------------------------------------------------

        if (
            !studentId ||
            !email
        ) {
            setError(
                "Registration information is missing. Please register again."
            );

            return;
        }

        setLoading(true);

        try {

            // =================================================
            // VERIFY WITH BACKEND
            // =================================================

            const response =
                await fetch(
                    "http://localhost:5000/api/registration/verify-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            studentId,
                            email,
                            otp: enteredOTP,
                        }),
                    }
                );

            let data;

            try {
                data =
                    await response.json();
            } catch {
                throw new Error(
                    "The server returned an invalid response."
                );
            }

            console.log(
                "OTP verification response:",
                data
            );

            // =================================================
            // HANDLE SERVER ERROR
            // =================================================

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Invalid OTP. Please try again."
                );
            }

            // =================================================
            // OTP SUCCESSFULLY VERIFIED
            // =================================================

            /*
             * IMPORTANT:
             *
             * OTP verification does NOT mean
             * EB/Admin approval.
             *
             * OTP verification only confirms
             * the student's email.
             *
             * The student must still complete:
             *
             * 1. Personal information
             * 2. Required documents
             * 3. Real-time selfie
             * 4. Final registration submission
             *
             * The application MUST NOT become
             * "pending_review" at this stage.
             *
             * "pending_review" should only happen
             * after the documents and selfie are
             * successfully uploaded.
             */

            // -------------------------------------------------
            // KEEP REGISTRATION INFORMATION
            // -------------------------------------------------

            sessionStorage.setItem(
                "votara_student_id",
                studentId
            );

            sessionStorage.setItem(
                "votara_email",
                email
            );

            sessionStorage.setItem(
                "votara_full_name",
                fullName ||
                    data.student?.fullName ||
                    ""
            );

            sessionStorage.setItem(
                "votara_year_level",
                yearLevel ||
                    data.student?.yearLevel ||
                    ""
            );

            sessionStorage.setItem(
                "votara_registration_type",
                registrationType
            );

            // -------------------------------------------------
            // MARK OTP AS VERIFIED
            // -------------------------------------------------

            sessionStorage.setItem(
                "votara_otp_verified",
                "true"
            );

            // -------------------------------------------------
            // CLEAR OLD REGISTRATION STATUS
            // -------------------------------------------------

            /*
             * Remove stale status/correction values.
             *
             * This is important when testing multiple
             * registrations in the same browser.
             */

            sessionStorage.removeItem(
                "votara_registration_status"
            );

            sessionStorage.removeItem(
                "votara_correction_message"
            );

            // -------------------------------------------------
            // SAVE SERVER RETURNED STUDENT INFORMATION
            // -------------------------------------------------

            if (data.student) {

                sessionStorage.setItem(
                    "votara_verified_student",
                    JSON.stringify(
                        data.student
                    )
                );

                // -------------------------------------------------
                // USE SERVER AUTHORITATIVE INFORMATION
                // -------------------------------------------------

                if (
                    data.student.fullName
                ) {
                    sessionStorage.setItem(
                        "votara_full_name",
                        data.student.fullName
                    );
                }

                if (
                    data.student.yearLevel
                ) {
                    sessionStorage.setItem(
                        "votara_year_level",
                        data.student.yearLevel
                    );
                }
            }

            // -------------------------------------------------
            // CLEAR OTP INPUT
            // -------------------------------------------------

            setOtp(
                Array(OTP_LENGTH).fill("")
            );

            // -------------------------------------------------
            // GO TO EXISTING REQUIREMENTS PAGE
            // -------------------------------------------------

            /*
             * IMPORTANT FLOW CHANGE
             *
             * DO NOT navigate to:
             *
             * /student-registration
             *
             * because that page does not exist.
             *
             * The existing VOTARA page that handles
             * the remaining registration process is:
             *
             * /registration-requirements
             *
             * That page handles:
             *
             * - Personal information
             * - Student ID Front
             * - Student ID Back
             * - Enrollment Proof
             * - Supporting Document
             * - Real-time Selfie
             * - Final submission
             *
             * Only after that final submission should
             * the backend change the application to:
             *
             * pending_review
             */

            navigate(
                "/registration-requirements",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(
                "❌ OTP verification error:",
                error
            );

            setError(
                error.message ||
                "Unable to verify OTP. Please try again."
            );

        } finally {

            setLoading(false);
        }
    };

    // =====================================================
    // RESEND OTP
    // =====================================================

    const handleResendOTP = async () => {

        // -------------------------------------------------
        // PREVENT MULTIPLE REQUESTS
        // -------------------------------------------------

        if (
            countdown > 0 ||
            resending
        ) {
            return;
        }

        if (
            !studentId ||
            !email
        ) {
            setError(
                "Registration information is missing. Please register again."
            );

            return;
        }

        setError("");
        setMessage("");
        setResending(true);

        try {

            // =================================================
            // REQUEST NEW OTP
            // =================================================

            const response =
                await fetch(
                    "http://localhost:5000/api/registration/resend-otp",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body: JSON.stringify({
                            studentId,
                            email,
                        }),
                    }
                );

            let data;

            try {
                data =
                    await response.json();
            } catch {
                throw new Error(
                    "The server returned an invalid response."
                );
            }

            // =================================================
            // SERVER ERROR
            // =================================================

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to resend OTP."
                );
            }

            // =================================================
            // CLEAR OLD OTP
            // =================================================

            setOtp(
                Array(OTP_LENGTH).fill("")
            );

            // =================================================
            // RESTART TIMER
            // =================================================

            setCountdown(30);

            // =================================================
            // SUCCESS MESSAGE
            // =================================================

            setMessage(
                "A new OTP has been sent to your email."
            );

            // =================================================
            // FOCUS FIRST OTP BOX
            // =================================================

            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 50);

        } catch (error) {

            console.error(
                "❌ Resend OTP error:",
                error
            );

            setError(
                error.message ||
                "Unable to resend OTP."
            );

        } finally {

            setResending(false);
        }
    };

    // =====================================================
    // MASK EMAIL
    // =====================================================

    const maskEmail = (
        emailAddress
    ) => {

        if (!emailAddress) {
            return "your email";
        }

        const [
            name,
            domain,
        ] =
            emailAddress.split("@");

        if (
            !name ||
            !domain
        ) {
            return emailAddress;
        }

        if (name.length <= 2) {
            return `${name[0]}***@${domain}`;
        }

        return `${name.substring(
            0,
            2
        )}***@${domain}`;
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="otp-page">

            <div className="otp-card">

                {/* =================================================
                    LOGO
                ================================================= */}

                <Link
                    to="/"
                    className="otp-logo"
                >
                    <span className="otp-logo-mark">

                        <span className="triangle triangle-top"></span>

                        <span className="circle"></span>

                        <span className="triangle triangle-bottom"></span>

                    </span>

                    <span>
                        Votara
                    </span>

                </Link>

                {/* =================================================
                    PROGRESS
                ================================================= */}

                <div className="otp-progress-section">

                    <div className="otp-progress">

                        <div
                            className="otp-progress-active"
                            style={{
                                width: "50%",
                            }}
                        ></div>

                    </div>

                    <span>
                        Registration Step 2
                        of 4
                    </span>

                </div>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <div className="otp-content">

                    <h1>
                        Verify Your Email
                    </h1>

                    <p>
                        We sent a 6-digit
                        verification code
                        to:
                    </p>

                    <strong>
                        {maskEmail(email)}
                    </strong>

                    <p>
                        Enter the OTP below
                        to continue your
                        VOTARA registration.
                    </p>

                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (
                        <p
                            className="otp-error"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    {/* =================================================
                        SUCCESS MESSAGE
                    ================================================= */}

                    {message && (
                        <p
                            className="otp-success"
                            role="status"
                        >
                            {message}
                        </p>
                    )}

                    {/* =================================================
                        OTP FORM
                    ================================================= */}

                    <form
                        onSubmit={
                            handleVerifyOTP
                        }
                    >

                        <div
                            className="otp-input-container"
                            onPaste={
                                handlePaste
                            }
                        >

                            {otp.map(
                                (
                                    digit,
                                    index
                                ) => (
                                    <input
                                        key={index}
                                        ref={(element) => {
                                            inputRefs.current[
                                                index
                                            ] =
                                                element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete={
                                            index === 0
                                                ? "one-time-code"
                                                : "off"
                                        }
                                        maxLength={1}
                                        value={digit}
                                        onChange={(
                                            e
                                        ) =>
                                            handleOtpChange(
                                                index,
                                                e.target
                                                    .value
                                            )
                                        }
                                        onKeyDown={(
                                            e
                                        ) =>
                                            handleKeyDown(
                                                index,
                                                e
                                            )
                                        }
                                        disabled={
                                            loading
                                        }
                                        aria-label={`OTP digit ${
                                            index + 1
                                        }`}
                                    />
                                )
                            )}

                        </div>

                        {/* =================================================
                            RESEND
                        ================================================= */}

                        <button
                            type="button"
                            className={
                                countdown > 0 ||
                                resending
                                    ? "resend-button disabled"
                                    : "resend-button"
                            }
                            onClick={
                                handleResendOTP
                            }
                            disabled={
                                countdown > 0 ||
                                resending ||
                                loading
                            }
                        >
                            {resending
                                ? "Sending..."
                                : countdown > 0
                                    ? `Resend OTP (${countdown}s)`
                                    : "Resend OTP"}
                        </button>

                        {/* =================================================
                            VERIFY
                        ================================================= */}

                        <button
                            type="submit"
                            className="verify-button"
                            disabled={
                                loading ||
                                resending
                            }
                        >
                            {loading
                                ? "Verifying..."
                                : "Verify OTP"}
                        </button>

                    </form>

                    {/* =================================================
                        BACK
                    ================================================= */}

                    <button
                        type="button"
                        className="otp-back"
                        disabled={
                            loading ||
                            resending
                        }
                        onClick={() => {
                            navigate(
                                "/register"
                            );
                        }}
                    >
                        ← Back to Registration
                    </button>

                </div>

            </div>

        </div>
    );
};

export default OTPVerification;