import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./VerifyOTP.css";

const VerifyOTP = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [studentId, setStudentId] = useState("");
    const [otp, setOtp] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const [message, setMessage] = useState("");

    useEffect(() => {
        const savedEmail =
            sessionStorage.getItem(
                "votara_email"
            );

        const savedStudentId =
            sessionStorage.getItem(
                "votara_student_id"
            );

        if (!savedEmail || !savedStudentId) {
            navigate("/register");
            return;
        }

        setEmail(savedEmail);
        setStudentId(savedStudentId);
    }, [navigate]);

    // =====================================================
    // HANDLE OTP INPUT
    // =====================================================

    const handleOTPChange = (e) => {
        const value =
            e.target.value
                .replace(/\D/g, "")
                .slice(0, 6);

        setOtp(value);
        setError("");
    };

    // =====================================================
    // VERIFY OTP
    // =====================================================

    const handleVerifyOTP = async (e) => {
        e.preventDefault();

        setError("");
        setMessage("");

        if (!otp) {
            setError(
                "Please enter the OTP sent to your email."
            );
            return;
        }

        if (otp.length !== 6) {
            setError(
                "OTP must contain exactly 6 digits."
            );
            return;
        }

        setLoading(true);

        try {
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
                            email,
                            otp,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to verify OTP."
                );
            }

            // =================================================
            // SAVE UPDATED INFORMATION
            // =================================================

            if (
                data.student?.registrationType
            ) {
                sessionStorage.setItem(
                    "votara_registration_type",
                    data.student.registrationType
                );
            }

            if (
                data.student?.ebApprovalStatus
            ) {
                sessionStorage.setItem(
                    "votara_eb_approval_status",
                    data.student.ebApprovalStatus
                );
            }

            // =================================================
            // SAVE LATE ENROLLEE STATUS
            // =================================================

            if (
                data.student?.registrationType ===
                "late_enrollee"
            ) {
                sessionStorage.setItem(
                    "votara_late_enrollee",
                    "true"
                );
            } else {
                sessionStorage.setItem(
                    "votara_late_enrollee",
                    "false"
                );
            }

            // =================================================
            // REGISTRATION SUBMITTED
            // =================================================

            sessionStorage.setItem(
                "votara_registration_submitted",
                "true"
            );

            // =================================================
            // GO TO REGISTRATION SUBMITTED
            // =================================================

            navigate(
                "/registration-submitted"
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
        setError("");
        setMessage("");
        setResending(true);

        try {
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
                            email,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "Unable to resend OTP."
                );
            }

            setMessage(
                "A new OTP has been sent to your email."
            );

            setOtp("");

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

    return (
        <div className="verify-otp-page">

            <div className="verify-otp-card">

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <section className="verify-otp-left">

                    <Link
                        to="/"
                        className="verify-otp-logo"
                    >

                        <span className="verify-otp-logo-mark">

                            <span className="triangle triangle-top">
                            </span>

                            <span className="circle">
                            </span>

                            <span className="triangle triangle-bottom">
                            </span>

                        </span>

                        <span>
                            Votara
                        </span>

                    </Link>

                    <div className="verify-otp-visual">

                        <img
                            src="/src/images/Register.png"
                            alt="OTP verification"
                            className="verify-otp-illustration"
                        />

                    </div>

                </section>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <section className="verify-otp-right">

                    <div className="verify-otp-content">

                        <div className="verify-otp-heading">

                            <h1>
                                Verify Your Email
                            </h1>

                            <p>
                                We sent a 6-digit verification
                                code to your email address.
                            </p>

                        </div>


                        {/* =================================================
                            EMAIL DISPLAY
                        ================================================= */}

                        <div className="otp-email-box">

                            <span>
                                Verification email
                            </span>

                            <strong>
                                {email}
                            </strong>

                        </div>


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {error && (
                            <div className="verify-otp-error">
                                {error}
                            </div>
                        )}


                        {/* =================================================
                            SUCCESS MESSAGE
                        ================================================= */}

                        {message && (
                            <div className="verify-otp-success">
                                {message}
                            </div>
                        )}


                        {/* =================================================
                            OTP FORM
                        ================================================= */}

                        <form
                            className="verify-otp-form"
                            onSubmit={
                                handleVerifyOTP
                            }
                        >

                            <div className="form-group">

                                <label htmlFor="otp">
                                    Enter OTP
                                </label>

                                <input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    placeholder="Enter 6-digit OTP"
                                    value={otp}
                                    maxLength={6}
                                    onChange={
                                        handleOTPChange
                                    }
                                    disabled={loading}
                                    required
                                />

                            </div>


                            <button
                                type="submit"
                                className="verify-otp-submit"
                                disabled={
                                    loading
                                }
                            >

                                {loading
                                    ? "Verifying..."
                                    : "Verify OTP"}

                            </button>

                        </form>


                        {/* =================================================
                            RESEND
                        ================================================= */}

                        <div className="resend-section">

                            <p>
                                Didn't receive the code?
                            </p>

                            <button
                                type="button"
                                className="resend-button"
                                onClick={
                                    handleResendOTP
                                }
                                disabled={
                                    resending
                                }
                            >

                                {resending
                                    ? "Sending..."
                                    : "Resend OTP"}

                            </button>

                        </div>


                        {/* =================================================
                            BACK
                        ================================================= */}

                        <Link
                            to="/register"
                            className="verify-back-link"
                        >
                            ← Back to Registration
                        </Link>

                    </div>

                </section>

            </div>

        </div>
    );
};

export default VerifyOTP;