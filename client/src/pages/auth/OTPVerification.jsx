import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const OTPVerification = () => {
    const navigate = useNavigate();

    const [otp, setOtp] = useState([
        "",
        "",
        "",
        "",
        "",
        "",
    ]);

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const inputRefs = useRef([]);

    // ==========================================
    // LOAD EMAIL FROM REGISTRATION
    // ==========================================

    useEffect(() => {
        const savedEmail =
            sessionStorage.getItem("votara_email");

        if (!savedEmail) {
            setError(
                "Registration information is missing. Please register again."
            );

            return;
        }

        setEmail(savedEmail);
    }, []);


    // ==========================================
    // OTP INPUT
    // ==========================================

    const handleChange = (value, index) => {
        // Only allow numbers
        if (!/^\d?$/.test(value)) {
            return;
        }

        const newOtp = [...otp];

        newOtp[index] = value;

        setOtp(newOtp);

        setError("");

        // Move to next box
        if (
            value &&
            index < 5
        ) {
            inputRefs.current[index + 1]?.focus();
        }
    };


    // ==========================================
    // BACKSPACE
    // ==========================================

    const handleKeyDown = (e, index) => {
        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };


    // ==========================================
    // PASTE OTP
    // ==========================================

    const handlePaste = (e) => {
        e.preventDefault();

        const pastedData =
            e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, 6);

        if (!pastedData) {
            return;
        }

        const newOtp = [
            "",
            "",
            "",
            "",
            "",
            "",
        ];

        pastedData
            .split("")
            .forEach((digit, index) => {
                newOtp[index] = digit;
            });

        setOtp(newOtp);
        setError("");

        const focusIndex =
            Math.min(
                pastedData.length,
                5
            );

        inputRefs.current[focusIndex]?.focus();
    };


    // ==========================================
    // VERIFY OTP
    // ==========================================

    const handleVerifyOTP = async () => {
        setError("");

        const enteredOTP =
            otp.join("");

        if (enteredOTP.length !== 6) {
            setError(
                "Please enter the complete 6-digit OTP."
            );

            return;
        }

        if (!email) {
            setError(
                "Registration information is missing. Please register again."
            );

            return;
        }

        setLoading(true);

        try {
            console.log(
                "🔐 Verifying OTP..."
            );

            console.log(
                "Email:",
                email
            );

            console.log(
                "OTP:",
                enteredOTP
            );

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
                    data.message ||
                    "Invalid OTP."
                );
            }

            // ==========================================
            // SAVE VERIFIED STUDENT
            // ==========================================

            if (data.student) {
                sessionStorage.setItem(
                    "votara_student",
                    JSON.stringify(data.student)
                );
            }

            // ==========================================
            // REMOVE TEMPORARY REGISTRATION DATA
            // ==========================================

            sessionStorage.removeItem(
                "votara_email"
            );

            sessionStorage.removeItem(
                "votara_student_id"
            );

            // ==========================================
            // REGISTRATION SUCCESS
            // ==========================================

            navigate(
                "/registration-confirmation"
            );

        } catch (error) {
            console.error(
                "OTP verification error:",
                error
            );

            setError(
                error.message ||
                "Unable to verify OTP."
            );

        } finally {
            setLoading(false);
        }
    };


    // ==========================================
    // RESEND OTP
    // ==========================================

    const handleResendOTP = async () => {
        setError("");

        if (!email) {
            setError(
                "Registration information is missing. Please register again."
            );

            return;
        }

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

            // Clear old OTP
            setOtp([
                "",
                "",
                "",
                "",
                "",
                "",
            ]);

            inputRefs.current[0]?.focus();

            alert(
                "A new OTP has been sent to your email."
            );

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


    // ==========================================
    // MASK EMAIL
    // ==========================================

    const maskEmail = (emailAddress) => {
        if (!emailAddress) {
            return "your email";
        }

        const [username, domain] =
            emailAddress.split("@");

        if (!username || !domain) {
            return emailAddress;
        }

        if (username.length <= 2) {
            return `${username[0] || ""}***@${domain}`;
        }

        return `${username.substring(
            0,
            2
        )}***@${domain}`;
    };


    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "35px",
                fontFamily:
                    "Poppins, Arial, sans-serif",
            }}
        >

            {/* =====================================
                PROGRESS BAR
            ===================================== */}

            <div
                style={{
                    width: "50%",
                    maxWidth: "560px",
                    minWidth: "320px",
                }}
            >

                <div
                    style={{
                        display: "flex",
                        height: "3px",
                    }}
                >
                    <div
                        style={{
                            width: "50%",
                            background: "#1450ff",
                        }}
                    />

                    <div
                        style={{
                            width: "50%",
                            background: "#69c7e8",
                        }}
                    />
                </div>

                <div
                    style={{
                        textAlign: "right",
                        fontSize: "12px",
                        marginTop: "7px",
                    }}
                >
                    2 of 3 steps
                </div>

            </div>


            {/* =====================================
                OTP CONTENT
            ===================================== */}

            <div
                style={{
                    width: "100%",
                    maxWidth: "720px",
                    textAlign: "center",
                    marginTop: "80px",
                }}
            >

                <h1
                    style={{
                        fontSize: "24px",
                        fontWeight: "500",
                        lineHeight: "1.4",
                        marginBottom: "8px",
                    }}
                >
                    Enter the OTP sent to
                    <br />
                    {maskEmail(email)}
                </h1>


                <p
                    style={{
                        fontSize: "14px",
                        marginTop: "45px",
                        marginBottom: "30px",
                    }}
                >
                    We sent a 6-digit verification
                    code to your email address.
                </p>


                {/* =================================
                    OTP BOXES
                ================================= */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                    }}
                    onPaste={handlePaste}
                >

                    {otp.map((digit, index) => (
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
                                handleChange(
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
                            style={{
                                width: "54px",
                                height: "64px",
                                border: "1px solid #999",
                                borderRadius: "10px",
                                textAlign: "center",
                                fontSize: "28px",
                                outline: "none",
                            }}
                        />
                    ))}

                </div>


                {/* =================================
                    ERROR
                ================================= */}

                {error && (
                    <p
                        style={{
                            color: "#ff3030",
                            fontSize: "14px",
                            marginTop: "15px",
                        }}
                    >
                        {error}
                    </p>
                )}


                {/* =================================
                    RESEND OTP
                ================================= */}

                <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={
                        resending ||
                        loading
                    }
                    style={{
                        marginTop: "20px",
                        border: "none",
                        background: "transparent",
                        color: "#1450ff",
                        fontSize: "14px",
                        cursor: "pointer",
                    }}
                >
                    {resending
                        ? "Sending..."
                        : "Resend OTP"}
                </button>


                {/* =================================
                    VERIFY BUTTON
                ================================= */}

                <button
                    type="button"
                    onClick={handleVerifyOTP}
                    disabled={loading}
                    style={{
                        display: "block",
                        width: "90%",
                        maxWidth: "650px",
                        margin: "30px auto 0",
                        padding: "18px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#1450ff",
                        color: "#ffffff",
                        fontSize: "17px",
                        fontWeight: "600",
                        cursor: "pointer",
                    }}
                >
                    {loading
                        ? "Verifying..."
                        : "Verify OTP"}
                </button>


                {/* =================================
                    BACK
                ================================= */}

                <Link
                    to="/register"
                    style={{
                        display: "inline-block",
                        marginTop: "20px",
                        color: "#1450ff",
                        fontSize: "14px",
                    }}
                >
                    ← Back to Registration
                </Link>

            </div>

        </div>
    );
};

export default OTPVerification;