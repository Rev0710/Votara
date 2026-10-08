import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import votaraLogo from "../../assets/images/votara-logo.png";
import api from "../../services/api";
import "./ForgotPassword.css";

const OTP_LENGTH = 6;

const ForgotPassword = () => {
    const navigate = useNavigate();
    const otpRefs = useRef([]);

    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [resetToken, setResetToken] = useState("");
    const [passwordChanged, setPasswordChanged] = useState(false);

    const passwordRequirements = {
        minLength: newPassword.length >= 8,
        uppercase: /[A-Z]/.test(newPassword),
        lowercase: /[a-z]/.test(newPassword),
        number: /[0-9]/.test(newPassword),
        special: /[^A-Za-z0-9]/.test(newPassword),
    };

    const passwordRequirementsMet =
        passwordRequirements.minLength &&
        passwordRequirements.uppercase &&
        passwordRequirements.lowercase &&
        passwordRequirements.number &&
        passwordRequirements.special;

    const passwordsMatch =
        newPassword.length > 0 &&
        confirmPassword.length > 0 &&
        newPassword === confirmPassword;

    const clearError = () => {
        setError("");
    };

    const getApiErrorMessage = (
        err,
        fallback = "Something went wrong. Please try again."
    ) => {
        const status = err?.response?.status;
        const serverMessage = err?.response?.data?.message;

        if (status === 429) {
            return (
                serverMessage ||
                "You recently changed your password. Please come back again after 48 hours to change your password, or contact the Electoral Board directly."
            );
        }

        if (status === 403) {
            return (
                serverMessage ||
                "You are not allowed to change your password yet. Please come back again after 48 hours or contact the Electoral Board directly."
            );
        }

        return serverMessage || fallback;
    };

    const handleBack = () => {
        if (!loading) {
            navigate("/login");
        }
    };

    const handleEmailSubmit = async (event) => {
        event.preventDefault();
        clearError();

        const normalizedEmail = email.trim().toLowerCase();

        if (!normalizedEmail) {
            setError(
                "Please enter the email address you used when you registered."
            );
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            setLoading(true);

            await api.post("/auth/forgot-password", {
                email: normalizedEmail,
            });

            setEmail(normalizedEmail);
            setOtp(Array(OTP_LENGTH).fill(""));
            setStep("otp");
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "We could not send the verification code. Please check your registered email and try again."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        clearError();

        const digit = value.replace(/\D/g, "").slice(-1);
        const nextOtp = [...otp];

        nextOtp[index] = digit;
        setOtp(nextOtp);

        if (digit && index < OTP_LENGTH - 1) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, event) => {
        if (
            event.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            otpRefs.current[index - 1]?.focus();
        }

        if (event.key === "ArrowLeft" && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }

        if (
            event.key === "ArrowRight" &&
            index < OTP_LENGTH - 1
        ) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpPaste = (event) => {
        event.preventDefault();

        const pasted = event.clipboardData
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, OTP_LENGTH);

        if (!pasted) {
            return;
        }

        const nextOtp = Array(OTP_LENGTH).fill("");

        pasted.split("").forEach((digit, index) => {
            nextOtp[index] = digit;
        });

        setOtp(nextOtp);
        clearError();

        const focusIndex = Math.min(
            pasted.length,
            OTP_LENGTH - 1
        );

        otpRefs.current[focusIndex]?.focus();
    };

    const handleVerifyOtp = async (event) => {
        event.preventDefault();
        clearError();

        const enteredOtp = otp.join("");

        if (enteredOtp.length !== OTP_LENGTH) {
            setError(
                "Please enter the complete 6-digit verification code."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await api.post(
                "/auth/verify-forgot-password-otp",
                {
                    email,
                    otp: enteredOtp,
                }
            );

            const receivedResetToken =
                response?.data?.resetToken;

            if (!receivedResetToken) {
                throw new Error(
                    "The verification session could not be created. Please request a new code."
                );
            }

            setResetToken(receivedResetToken);
            setConfirmed(true);

            window.setTimeout(() => {
                setConfirmed(false);
                setStep("password");
            }, 850);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "That verification code is invalid or expired. Please try again."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        clearError();

        if (!passwordRequirementsMet) {
            setError(
                "Please meet all password requirements before continuing."
            );
            return;
        }

        if (!passwordsMatch) {
            setError("Your passwords do not match.");
            return;
        }

        if (!resetToken) {
            setError(
                "Your verification session has expired. Please request a new verification code."
            );
            return;
        }

        try {
            setLoading(true);

            await api.post("/auth/reset-password", {
                email,
                resetToken,
                newPassword,
                confirmPassword,
            });

            setPasswordChanged(true);

            window.setTimeout(() => {
                navigate("/login", {
                    replace: true,
                    state: {
                        message:
                            "Your password has been changed. You can now sign in with your new password.",
                    },
                });
            }, 2500);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Unable to change your password. Please try again."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const maskedEmail = email
        ? email.replace(
              /^(.{2})(.*)(@.*)$/,
              (_, first, middle, domain) =>
                  `${first}${"•".repeat(
                      Math.min(Math.max(middle.length, 2), 5)
                  )}${domain}`
          )
        : "your registered email";

    const renderRequirement = (isMet, text) => {
        return (
            <li className={isMet ? "met" : ""}>
                <span className="requirement-icon">
                    {isMet ? "✓" : "○"}
                </span>
                <span>{text}</span>
            </li>
        );
    };

    const renderStepContent = () => {
        if (step === "email") {
            return (
                <>
                    <span className="forgot-kicker">
                        ACCOUNT RECOVERY
                    </span>

                    <h1>Forgot your password?</h1>

                    <p className="forgot-description">
                        Enter the email address you used when you
                        registered. We&apos;ll send a 6-digit
                        verification code to confirm your account.
                    </p>

                    <form onSubmit={handleEmailSubmit}>
                        <label htmlFor="forgot-email">
                            Registered email
                        </label>

                        <div className="forgot-input-wrap">
                            <input
                                id="forgot-email"
                                type="email"
                                value={email}
                                onChange={(event) => {
                                    setEmail(event.target.value);
                                    clearError();
                                }}
                                placeholder="Enter your registered email"
                                autoComplete="email"
                                disabled={loading}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="forgot-primary-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Sending code..."
                                : "Send verification code"}
                        </button>
                    </form>
                </>
            );
        }

        if (step === "otp") {
            return (
                <>
                    <span className="forgot-kicker">
                        VERIFY YOUR ACCOUNT
                    </span>

                    <h1>Enter your code.</h1>

                    <p className="forgot-description">
                        We sent a 6-digit verification code to
                        <strong> {maskedEmail}</strong>. Enter it
                        below to continue.
                    </p>

                    <form onSubmit={handleVerifyOtp}>
                        <label>6-digit verification code</label>

                        <div
                            className="forgot-otp"
                            onPaste={handleOtpPaste}
                        >
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(element) => {
                                        otpRefs.current[index] =
                                            element;
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(event) =>
                                        handleOtpChange(
                                            index,
                                            event.target.value
                                        )
                                    }
                                    onKeyDown={(event) =>
                                        handleOtpKeyDown(
                                            index,
                                            event
                                        )
                                    }
                                    disabled={loading}
                                    aria-label={`Verification code digit ${
                                        index + 1
                                    }`}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="forgot-primary-button"
                            disabled={loading}
                        >
                            {loading
                                ? "Verifying..."
                                : "Verify code"}
                        </button>

                        <button
                            type="button"
                            className="forgot-text-button"
                            onClick={() => {
                                setStep("email");
                                clearError();
                            }}
                            disabled={loading}
                        >
                            Use a different email
                        </button>
                    </form>

                    {confirmed && (
                        <div
                            className="forgot-confirmed"
                            role="status"
                        >
                            <span>✓</span>
                            Email confirmed. Taking you to the new
                            password step...
                        </div>
                    )}
                </>
            );
        }

        return (
            <>
                <span className="forgot-kicker">
                    REQUIRED ACCOUNT STEP
                </span>

                <h1>Secure your account</h1>

                <p className="forgot-description">
                    Replace your password with one only you know.
                </p>

                <form onSubmit={handleResetPassword}>
                    <label htmlFor="forgot-new-password">
                        New password
                    </label>

                    <div className="forgot-input-wrap password-wrap">
                        <input
                            id="forgot-new-password"
                            type="password"
                            value={newPassword}
                            onChange={(event) => {
                                setNewPassword(
                                    event.target.value
                                );
                                clearError();
                            }}
                            placeholder="Password"
                            autoComplete="new-password"
                            disabled={loading}
                            required
                        />
                    </div>

                    <label htmlFor="forgot-confirm-password">
                        Confirm new password
                    </label>

                    <div className="forgot-input-wrap password-wrap">
                        <input
                            id="forgot-confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => {
                                setConfirmPassword(
                                    event.target.value
                                );
                                clearError();
                            }}
                            placeholder="Re-enter your password"
                            autoComplete="new-password"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="forgot-password-rules">
                        <strong>Password requirements</strong>

                        <ul>
                            {renderRequirement(
                                passwordRequirements.minLength,
                                "At least 8 characters"
                            )}

                            {renderRequirement(
                                passwordRequirements.uppercase,
                                "At least one uppercase letter"
                            )}

                            {renderRequirement(
                                passwordRequirements.lowercase,
                                "At least one lowercase letter"
                            )}

                            {renderRequirement(
                                passwordRequirements.number,
                                "At least one number"
                            )}

                            {renderRequirement(
                                passwordRequirements.special,
                                "At least one special character"
                            )}
                        </ul>
                    </div>

                    <div
                        className={
                            passwordsMatch
                                ? "forgot-password-match met"
                                : "forgot-password-match"
                        }
                    >
                        <span className="requirement-icon">
                            {passwordsMatch ? "✓" : "○"}
                        </span>

                        <span>
                            {confirmPassword.length === 0
                                ? "Passwords must match"
                                : passwordsMatch
                                ? "Passwords match"
                                : "Passwords do not match"}
                        </span>
                    </div>

                    <div className="forgot-password-tip">
                        <strong>
                            Make it long and unique.
                        </strong>

                        <span>
                            Avoid your student ID, name, or a
                            password you used before.
                        </span>
                    </div>

                    <button
                        type="submit"
                        className="forgot-primary-button"
                        disabled={
                            loading ||
                            !passwordRequirementsMet ||
                            !passwordsMatch
                        }
                    >
                        {loading
                            ? "Saving..."
                            : "Save new password"}
                    </button>
                </form>
            </>
        );
    };

    return (
        <div className="forgot-page">
            {passwordChanged && (
                <div
                    className="forgot-success-overlay"
                    role="alertdialog"
                    aria-modal="true"
                >
                    <div className="forgot-success-modal">
                        <div className="forgot-success-icon">
                            ✓
                        </div>

                        <h2>Congratulations!</h2>

                        <p>
                            Your password was changed
                            successfully.
                            <br />
                            You will be redirected to the login
                            page.
                        </p>
                    </div>
                </div>
            )}

            <div className="forgot-card">
                <aside className="forgot-left">
                    <button
                        type="button"
                        className="forgot-logo"
                        onClick={() => navigate("/")}
                        disabled={loading}
                    >
                        <img
                            src={votaraLogo}
                            alt="Votara"
                        />
                    </button>

                    <div className="forgot-left-content">
                        <span className="forgot-left-label">
                            VOTARA&nbsp; / &nbsp;ACCOUNT SECURITY
                        </span>

                        <h2>
                            {step === "email" &&
                                "Recover your account."}

                            {step === "otp" &&
                                "Confirm it is really you."}

                            {step === "password" &&
                                "Set a password only you know."}
                        </h2>

                        <p>
                            {step === "email" &&
                                "Enter your registered email and we will help you securely regain access."}

                            {step === "otp" &&
                                "Use the 6-digit code sent to your registered email before creating a new password."}

                            {step === "password" &&
                                "Your email has been confirmed. Choose a new password before continuing."}
                        </p>

                        <div className="forgot-steps">
                            <span
                                className={
                                    step === "email"
                                        ? "active"
                                        : "complete"
                                }
                            >
                                01&nbsp; Enter your registered
                                email
                            </span>

                            <span
                                className={
                                    step === "otp"
                                        ? "active"
                                        : step === "password"
                                        ? "complete"
                                        : ""
                                }
                            >
                                02&nbsp; Verify the 6-digit code
                            </span>

                            <span
                                className={
                                    step === "password"
                                        ? "active"
                                        : ""
                                }
                            >
                                03&nbsp; Create your new password
                            </span>
                        </div>
                    </div>

                    <div
                        className="forgot-orbit"
                        aria-hidden="true"
                    >
                        <div className="forgot-orbit-ring ring-one" />
                        <div className="forgot-orbit-ring ring-two" />
                        <div className="forgot-orbit-ring ring-three" />

                        <div className="forgot-orbit-core">
                            <img
                                src={votaraLogo}
                                alt=""
                            />
                        </div>

                        <span className="forgot-orbit-icon icon-one">
                            ✓
                        </span>

                        <span className="forgot-orbit-icon icon-two">
                            ✦
                        </span>

                        <span className="forgot-orbit-icon icon-three">
                            ●
                        </span>
                    </div>
                </aside>

                <main className="forgot-right">
                    <div className="forgot-form-card">
                        <button
                            type="button"
                            className="forgot-back-top"
                            onClick={() => navigate("/")}
                            disabled={loading}
                        >
                            Back to VOTARA
                        </button>

                        {error && (
                            <div
                                className="forgot-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}

                        {renderStepContent()}

                        <button
                            type="button"
                            className="forgot-back-link"
                            onClick={handleBack}
                            disabled={loading}
                        >
                            Sign in
                        </button>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ForgotPassword;