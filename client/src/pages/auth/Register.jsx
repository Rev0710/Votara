import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

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
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        studentId:
                            studentId.trim(),

                        email:
                            email.trim(),
                    }),
                }
            );

            const data =
                await response.json();

            if (!response.ok || !data.success) {
            throw new Error(
                data.message ||
                "Unable to send OTP. Please try again."
            );
        }

        // Save email for OTP verification
        sessionStorage.setItem(
            "registrationEmail",
            email.trim().toLowerCase()
        );


            /*
             * Pass registration information
             * to OTP page.
             */
            navigate(
                "/verify-otp",
                {
                    state: {
                        studentId:
                            studentId.trim(),

                        email:
                            email.trim(),
                    },
                }
            );

        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            setError(
                error.message ||
                    "Something went wrong. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">

            <div className="register-card">

                {/* LEFT */}
                <section className="register-left">

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


                {/* RIGHT */}
                <section className="register-right">

                    <div className="register-content">

                        <div className="register-heading">

                            <h1>
                                Welcome!
                            </h1>

                            <p>
                                Register as a voter on
                                the Western Institute
                                of Technology voting
                                platform to vote in
                                your preferred candidate.
                            </p>

                        </div>


                        {error && (
                            <div className="register-error">
                                {error}
                            </div>
                        )}


                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-group">

                                <label htmlFor="studentId">
                                    Student ID No.
                                </label>

                                <input
                                    id="studentId"
                                    type="text"
                                    value={studentId}
                                    onChange={(e) =>
                                        setStudentId(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your Student ID"
                                    required
                                    disabled={loading}
                                />

                            </div>


                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter your email address"
                                    required
                                    disabled={loading}
                                />

                            </div>


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
                            to="/admin/register"
                            className="admin-link"
                        >
                            Sign up as Admin
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