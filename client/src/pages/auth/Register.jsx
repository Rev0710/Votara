import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

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
                        studentId: studentId.trim(),
                        email: email.trim().toLowerCase(),
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(
                    data.message ||
                    "Unable to send OTP. Please try again."
                );
            }

            // ==========================================
            // SAVE REGISTRATION INFORMATION
            // ==========================================

            sessionStorage.setItem(
                "votara_student_id",
                studentId.trim()
            );

            sessionStorage.setItem(
                "votara_email",
                email.trim().toLowerCase()
            );

            // ==========================================
            // GO TO OTP PAGE
            // ==========================================

            navigate("/verify-otp");

        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-card">

                {/* =========================================
                    LEFT SIDE
                ========================================= */}

                <section className="register-left">

                    {/* VOTARA LOGO */}

                    <Link
                        to="/"
                        className="register-logo"
                    >

                        <span className="register-logo-mark">

                            <span className="triangle triangle-top"></span>

                            <span className="circle"></span>

                            <span className="triangle triangle-bottom"></span>

                        </span>

                        <span>Votara</span>

                    </Link>


                    {/* =========================================
                        VECTOR ILLUSTRATION
                    ========================================= */}

                    <div className="register-visual">

                        <img
                            src="/src/images/Register.png"
                            alt="Votara registration illustration"
                            className="register-illustration"
                        />

                    </div>

                </section>


                {/* =========================================
                    RIGHT SIDE
                ========================================= */}

                <section className="register-right">

                    <div className="register-content">

                        {/* =========================================
                            HEADING
                        ========================================= */}

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


                        {/* =========================================
                            ERROR
                        ========================================= */}

                        {error && (
                            <div className="register-error">
                                {error}
                            </div>
                        )}


                        {/* =========================================
                            REGISTRATION FORM
                        ========================================= */}

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
                                    placeholder="Enter your Student ID"
                                    value={studentId}
                                    maxLength={5}
                                    onChange={(e) =>
                                        setStudentId(
                                            e.target.value.slice(0, 5)
                                        )
                                    }
                                    required
                                    disabled={loading}
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
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    required
                                    disabled={loading}
                                />

                            </div>


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


                        {/* =========================================
                            BOTTOM LINKS
                        ========================================= */}

                        <div className="register-links">

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

                    </div>

                </section>

            </div>

        </div>
    );
};

export default Register;