import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OTPVerification.css";

const OTPVerification = () => {
    const navigate = useNavigate();

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(30);

    const inputRefs = useRef([]);

    const studentId = sessionStorage.getItem("votaraStudentId");
    const email = sessionStorage.getItem("votaraEmail");

    useEffect(() => {
        if (!studentId || !email) {
            navigate("/register");
        }
    }, [studentId, email, navigate]);

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setInterval(() => {
            setCountdown((previous) => previous - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown]);

    const handleChange = (value, index) => {

        if (!/^\d?$/.test(value)) {
            return;
        }

        const updatedOtp = [...otp];
        updatedOtp[index] = value;

        setOtp(updatedOtp);
        setError("");

        if (value && index < otp.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {

        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {

        e.preventDefault();

        const pasted = e.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 6);

        if (!pasted) return;

        const updatedOtp = ["", "", "", "", "", ""];

        pasted.split("").forEach((digit, index) => {
            updatedOtp[index] = digit;
        });

        setOtp(updatedOtp);

        const nextIndex = Math.min(pasted.length, 5);

        inputRefs.current[nextIndex]?.focus();
    };

    const handleVerify = async (e) => {

        e.preventDefault();

        const otpCode = otp.join("");

        if (otpCode.length !== 6) {
            setError("Please enter the complete 6-digit OTP.");
            return;
        }

        setLoading(true);
        setError("");

        try {

            /*
             * Backend endpoint:
             * POST /api/auth/verify-otp
             */

            const response = await fetch(
                "http://localhost:5000/api/auth/verify-otp",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        studentId,
                        email,
                        otp: otpCode,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Invalid OTP."
                );
            }

            sessionStorage.removeItem("votaraStudentId");
            sessionStorage.removeItem("votaraEmail");

            navigate("/registration-submitted");

        } catch (error) {

            setError(
                error.message ||
                "Unable to verify OTP."
            );

        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {

        if (countdown > 0 || resending) {
            return;
        }

        setResending(true);
        setError("");

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/resend-otp",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        studentId,
                        email,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to resend OTP."
                );
            }

            setOtp(["", "", "", "", "", ""]);
            setCountdown(30);
            inputRefs.current[0]?.focus();

        } catch (error) {

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

                <div className="otp-logo">
                    <span className="otp-logo-symbol">✦</span>
                    <span>Votara</span>
                </div>

                {/* PROGRESS */}

                <div className="otp-progress-container">

                    <div className="otp-progress">
                        <div className="otp-progress-active"></div>
                    </div>

                    <span>2 of 3 steps</span>

                </div>

                {/* TITLE */}

                <h1>OTP Verification</h1>

                <p className="otp-description">
                    Enter the OTP sent to
                </p>

                <p className="otp-email">
                    {email
                        ? email.replace(
                            /(^.).*(@.*$)/,
                            "$1***$2"
                        )
                        : ""}
                </p>

                {/* OTP */}

                <form onSubmit={handleVerify}>

                    <div
                        className="otp-input-container"
                        onPaste={handlePaste}
                    >

                        {otp.map((digit, index) => (

                            <input
                                key={index}
                                ref={(element) => {
                                    inputRefs.current[index] = element;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                value={digit}
                                onChange={(e) =>
                                    handleChange(
                                        e.target.value,
                                        index
                                    )
                                }
                                onKeyDown={(e) =>
                                    handleKeyDown(e, index)
                                }
                                autoComplete={
                                    index === 0
                                        ? "one-time-code"
                                        : "off"
                                }
                            />

                        ))}

                    </div>

                    {error && (
                        <div className="otp-error">
                            {error}
                        </div>
                    )}

                    <button
                        type="button"
                        className="resend-button"
                        onClick={handleResend}
                        disabled={
                            countdown > 0 ||
                            resending
                        }
                    >
                        {resending
                            ? "Sending..."
                            : countdown > 0
                                ? `Resend OTP (${countdown})`
                                : "Resend OTP"}
                    </button>

                    <button
                        type="submit"
                        className="verify-button"
                        disabled={loading}
                    >
                        {loading
                            ? "Verifying..."
                            : "Verify OTP"}
                    </button>

                </form>

                <button
                    className="otp-back"
                    onClick={() => navigate("/register")}
                >
                    BACK
                </button>

            </div>

        </div>
    );
};

export default OTPVerification;