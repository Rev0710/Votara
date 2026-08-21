import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./OTPVerification.css";

const OTPVerification = () => {
    const navigate = useNavigate();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);

    const inputRefs = useRef([]);

    // =====================================================
    // GET EMAIL FROM REGISTRATION
    // =====================================================

    useEffect(() => {
        const savedEmail = sessionStorage.getItem(
            "registrationEmail"
        );

        if (!savedEmail) {
            setError(
                "Registration information is missing. Please register again."
            );
            return;
        }

        setEmail(savedEmail);
    }, []);


    // =====================================================
    // RESEND TIMER
    // =====================================================

    useEffect(() => {
        if (resendTimer <= 0) return;

        const timer = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [resendTimer]);


    // =====================================================
    // HANDLE OTP INPUT
    // =====================================================

    const handleOTPChange = (value, index) => {
        // Allow numbers only
        if (!/^\d?$/.test(value)) {
            return;
        }

        const newOTP = [...otp];
        newOTP[index] = value;

        setOtp(newOTP);
        setError("");

        // Move to next input
        if (
            value &&
            index < 5
        ) {
            inputRefs.current[index + 1]?.focus();
        }
    };


    // =====================================================
    // HANDLE BACKSPACE
    // =====================================================

    const handleKeyDown = (e, index) => {

        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };


    // =====================================================
    // HANDLE PASTE
    // =====================================================

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedData =
            e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

        if (!pastedData) return;

        const newOTP = ["", "", "", "", "", ""];

        pastedData
            .split("")
            .forEach((digit, index) => {
                newOTP[index] = digit;
            });

        setOtp(newOTP);
        setError("");

        const focusIndex =
            Math.min(pastedData.length, 5);

        inputRefs.current[focusIndex]?.focus();
    };


    // =====================================================
    // VERIFY OTP
    // =====================================================

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        setError("");

        const enteredOTP = otp.join("");

        // Check email
        if (!email) {
            setError(
                "Registration information is missing. Please register again."
            );
            return;
        }

        // Check OTP
        if (enteredOTP.length !== 6) {
            setError(
                "Please enter the complete 6-digit OTP."
            );
            return;
        }

        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/registration/verify-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email,
                        otp: enteredOTP,
                    }),
                }
            );

            const data = await response.json();

            console.log(
                "OTP verification response:",
                data
            );

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message || "Invalid OTP."
                );
            }

            // =================================================
            // OTP VERIFIED SUCCESSFULLY
            // =================================================

            // Save returned student information
            if (data.student) {
                sessionStorage.setItem(
                    "registeredStudent",
                    JSON.stringify(data.student)
                );
            }

            // Remove temporary registration email
            sessionStorage.removeItem(
                "registrationEmail"
            );

            // Go directly to confirmation page
            navigate(
                "/registration-confirmation",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(
                "OTP verification error:",
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

        if (!email) {
            setError(
                "Registration information is missing. Please register again."
            );
            return;
        }

        if (resendTimer > 0) {
            return;
        }

        setError("");
        setResending(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/registration/resend-otp",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to resend OTP."
                );
            }

            // Clear previous OTP
            setOtp([
                "",
                "",
                "",
                "",
                "",
                "",
            ]);

            setResendTimer(30);

            inputRefs.current[0]?.focus();

        } catch (error) {

            console.error(
                "Resend OTP error:",
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


    return (
        <div className="otp-page">

            <div className="otp-card">

                {/* LOGO */}
                <Link
                    to="/"
                    className="otp-logo"
                >
                    <span className="otp-logo-mark">
                        <span className="triangle triangle-top"></span>
                        <span className="circle"></span>
                        <span className="triangle triangle-bottom"></span>
                    </span>

                    <span>Votara</span>
                </Link>


                {/* PROGRESS */}
                <div className="otp-progress-section">

                    <div className="otp-progress">
                        <div className="otp-progress-active"></div>
                    </div>

                    <span>
                        2 of 3 steps
                    </span>

                </div>


                {/* CONTENT */}
                <div className="otp-content">

                    <h1>
                        Enter the OTP sent to
                        <br />

                        <span>
                            {email
                                ? email.replace(
                                    /^(.{2}).*(@.*)$/,
                                    "$1***$2"
                                )
                                : "your email"
                            }
                        </span>
                    </h1>


                    <p className="otp-description">
                        We sent a 6-digit verification code
                        to your email address.
                    </p>


                    {/* OTP FORM */}
                    <form
                        onSubmit={handleVerifyOTP}
                        className="otp-form"
                    >

                        <div
                            className="otp-inputs"
                            onPaste={handlePaste}
                        >

                            {otp.map(
                                (digit, index) => (
                                    <input
                                        key={index}
                                        ref={(element) => {
                                            inputRefs.current[index] =
                                                element;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) =>
                                            handleOTPChange(
                                                e.target.value,
                                                index
                                            )
                                        }
                                        onKeyDown={(e) =>
                                            handleKeyDown(
                                                e,
                                                index
                                            )
                                        }
                                        className="otp-input"
                                        autoComplete="one-time-code"
                                    />
                                )
                            )}

                        </div>


                        {/* ERROR */}
                        {error && (
                            <p className="otp-error">
                                {error}
                            </p>
                        )}


                        {/* RESEND */}
                        <button
                            type="button"
                            className="resend-button"
                            onClick={handleResendOTP}
                            disabled={
                                resendTimer > 0 ||
                                resending
                            }
                        >

                            {resending
                                ? "Sending..."
                                : resendTimer > 0
                                    ? `Resend OTP (${resendTimer}s)`
                                    : "Resend OTP"
                            }

                        </button>


                        {/* VERIFY */}
                        <button
                            type="submit"
                            className="verify-button"
                            disabled={loading}
                        >

                            {loading
                                ? "Verifying..."
                                : "Verify OTP"
                            }

                        </button>

                    </form>


                    {/* BACK */}
                    <Link
                        to="/register"
                        className="otp-back"
                    >
                        ← Back to Registration
                    </Link>

                </div>

            </div>

        </div>
    );
};

export default OTPVerification;