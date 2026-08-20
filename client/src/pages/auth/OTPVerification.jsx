import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./OTPVerification.css";

const OTP_LENGTH = 6;

const OTPVerification = () => {
    const navigate = useNavigate();

    const [otp, setOtp] = useState(
        Array(OTP_LENGTH).fill("")
    );

    const [email, setEmail] = useState("");
    const [studentId, setStudentId] = useState("");

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const [countdown, setCountdown] = useState(30);

    const inputRefs = useRef([]);

    /*
     * Get registration information
     * saved by Register.jsx
     */
    useEffect(() => {

        const savedRegistration =
            sessionStorage.getItem("votaraRegistration");

        if (!savedRegistration) {
            setError(
                "Registration information is missing. Please register again."
            );
            return;
        }

        try {

            const registration =
                JSON.parse(savedRegistration);

            setEmail(registration.email || "");
            setStudentId(registration.studentId || "");

        } catch (error) {

            console.error(
                "Registration data error:",
                error
            );

            setError(
                "Registration information is invalid. Please register again."
            );
        }

    }, []);


    /*
     * Countdown for resend OTP
     */
    useEffect(() => {

        if (countdown <= 0) {
            return;
        }

        const timer = setInterval(() => {

            setCountdown((previous) => previous - 1);

        }, 1000);

        return () => clearInterval(timer);

    }, [countdown]);


    /*
     * Handle OTP input
     */
    const handleOtpChange = (index, value) => {

        // Only allow numbers
        if (!/^\d*$/.test(value)) {
            return;
        }

        const newOtp = [...otp];

        newOtp[index] = value.slice(-1);

        setOtp(newOtp);

        setError("");
        setMessage("");

        // Move to next input
        if (
            value &&
            index < OTP_LENGTH - 1
        ) {
            inputRefs.current[index + 1]?.focus();
        }
    };


    /*
     * Handle backspace
     */
    const handleKeyDown = (index, e) => {

        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    };


    /*
     * Paste 6-digit OTP
     */
    const handlePaste = (e) => {

        e.preventDefault();

        const pastedData =
            e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, OTP_LENGTH);

        if (!pastedData) {
            return;
        }

        const newOtp = Array(OTP_LENGTH).fill("");

        pastedData
            .split("")
            .forEach((number, index) => {
                newOtp[index] = number;
            });

        setOtp(newOtp);

        const nextIndex = Math.min(
            pastedData.length,
            OTP_LENGTH - 1
        );

        inputRefs.current[nextIndex]?.focus();
    };


    /*
     * VERIFY OTP
     */
    const handleVerifyOTP = async (e) => {

        e.preventDefault();

        const enteredOTP = otp.join("");

        setError("");
        setMessage("");

        /*
         * Make sure all 6 digits are entered
         */
        if (enteredOTP.length !== OTP_LENGTH) {

            setError(
                "Please enter the complete 6-digit OTP."
            );

            return;
        }

        if (!email || !studentId) {

            setError(
                "Registration information is missing. Please register again."
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
                        studentId,
                        email,
                        otp: enteredOTP,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Invalid OTP. Please try again."
                );
            }

            /*
             * OTP is correct.
             *
             * Move to registration confirmation.
             */
            navigate("/registration-confirmation");

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


    /*
     * RESEND OTP
     */
    const handleResendOTP = async () => {

        if (countdown > 0 || resending) {
            return;
        }

        if (!email || !studentId) {

            setError(
                "Registration information is missing. Please register again."
            );

            return;
        }

        setError("");
        setMessage("");
        setResending(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/registration/send-otp",
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

            if (!response.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "Unable to resend OTP."
                );
            }

            /*
             * Clear old OTP
             */
            setOtp(
                Array(OTP_LENGTH).fill("")
            );

            /*
             * Restart timer
             */
            setCountdown(30);

            setMessage(
                "A new OTP has been sent to your email."
            );

            /*
             * Focus first box
             */
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


    /*
     * Mask email
     */
    const maskEmail = (emailAddress) => {

        if (!emailAddress) {
            return "your email";
        }

        const [name, domain] =
            emailAddress.split("@");

        if (!name || !domain) {
            return emailAddress;
        }

        if (name.length <= 2) {
            return `${name[0]}***@${domain}`;
        }

        return `${name.substring(0, 2)}***@${domain}`;
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
                <div className="otp-progress-wrapper">

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
                            {maskEmail(email)}
                        </span>
                    </h1>


                    {/* OTP FORM */}
                    <form onSubmit={handleVerifyOTP}>

                        <div
                            className="otp-inputs"
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
                                        handleOtpChange(
                                            index,
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={(e) =>
                                        handleKeyDown(
                                            index,
                                            e
                                        )
                                    }
                                    aria-label={`OTP digit ${index + 1}`}
                                />

                            ))}

                        </div>


                        {/* ERROR */}
                        {error && (
                            <p className="otp-error">
                                {error}
                            </p>
                        )}


                        {/* SUCCESS MESSAGE */}
                        {message && (
                            <p className="otp-success">
                                {message}
                            </p>
                        )}


                        {/* RESEND */}
                        <button
                            type="button"
                            className={
                                countdown > 0
                                    ? "resend-button disabled"
                                    : "resend-button"
                            }
                            onClick={handleResendOTP}
                            disabled={
                                countdown > 0 ||
                                resending
                            }
                        >

                            {resending
                                ? "Sending..."
                                : countdown > 0
                                    ? `Resend OTP (${String(
                                        Math.floor(countdown / 60)
                                    ).padStart(2, "0")}:${String(
                                        countdown % 60
                                    ).padStart(2, "0")})`
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
                    <button
                        type="button"
                        className="otp-back"
                        onClick={() =>
                            navigate("/register")
                        }
                    >
                        BACK
                    </button>

                </div>

            </div>

        </div>
    );
};

export default OTPVerification;