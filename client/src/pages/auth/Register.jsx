import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleStudentIdChange = (e) => {
        const value = e.target.value;
        // Restrict input length to a maximum of 5 characters
        if (value.length <= 5) {
            setStudentId(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

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
                    data.message || "Unable to send OTP."
                );
            }

            /*
             * IMPORTANT
             * Save registration information temporarily
             * so OTPVerification.jsx can access it.
             */
            sessionStorage.setItem(
                "votaraRegistration",
                JSON.stringify({
                    studentId,
                    email,
                })
            );

            // Go to OTP page
            navigate("/verify-otp");

        } catch (error) {
            console.error("Registration error:", error);

            setError(
                error.message ||
                "Unable to send OTP. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-card">

                {/* LEFT SIDE */}
                <section className="register-left">

                    <Link to="/" className="register-logo">

                        <span className="register-logo-mark">
                            <span className="triangle triangle-top"></span>
                            <span className="circle"></span>
                            <span className="triangle triangle-bottom"></span>
                        </span>

                        <span>Votara</span>

                    </Link>

                    <div className="register-visual">

                        <div className="visual-circle visual-circle-one"></div>
                        <div className="visual-circle visual-circle-two"></div>

                        <div className="visual-content">
                            <span className="visual-line"></span>
                            <span className="visual-line"></span>
                            <span className="visual-line"></span>
                        </div>

                    </div>

                </section>


                {/* RIGHT SIDE */}
                <section className="register-right">

                    <div className="register-content">

                        <div className="register-heading">

                            <h1>
                                Welcome!
                            </h1>

                            <p>
                                Register as a voter on the Western Institute
                                of Technology voting platform to vote in your
                                preferred candidate.
                            </p>

                        </div>


                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                        >

                            {/* STUDENT ID */}
                            <div className="form-group">

                                <label htmlFor="studentId">
                                    Student ID No.
                                </label>

                                <input
                                    id="studentId"
                                    type="text"
                                    value={studentId}
                                    onChange={handleStudentIdChange}
                                    maxLength={5}
                                    placeholder="Enter your Student ID (max 5 chars)"
                                    required
                                />

                            </div>


                            {/* EMAIL */}
                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    placeholder="Enter your email address"
                                    required
                                />

                            </div>


                            {/* ERROR */}
                            {error && (
                                <p className="register-error">
                                    {error}
                                </p>
                            )}


                            {/* SUBMIT */}
                            <button
                                type="submit"
                                className="register-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Sending OTP..."
                                    : "Sign up"}
                            </button>

                        </form>


                        <Link
                            to="/account-selection"
                             className="admin-link"
                        >
                            Sign up as Admin/Electoral Board
                        </Link>


                        <Link
                            to="/"
                            className="back-link"
                        >
                            ← Back to Votara
                        </Link>

                    </div>

                </section>

            </div>

        </div>
    );
};

export default Register;