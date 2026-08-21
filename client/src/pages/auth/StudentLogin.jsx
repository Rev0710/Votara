import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { studentLogin } from "../../services/authService";
import "./StudentLogin.css";

const StudentLogin = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleStudentIdChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");

        if (value.length <= 5) {
            setStudentId(value);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        if (!studentId || !password) {
            setError("Please enter your Student ID and Password.");
            return;
        }

        try {
            setLoading(true);

            const data = await studentLogin(
                studentId,
                password
            );

            // Save authentication token
            localStorage.setItem(
                "votaraToken",
                data.token
            );

            // Save student information
            localStorage.setItem(
                "votaraStudent",
                JSON.stringify(data.student)
            );

            console.log("✅ Student login successful");

            // First login → change temporary password
            if (data.mustChangePassword) {
                navigate("/change-password");
                return;
            }

            // Normal login → dashboard
            navigate("/student-dashboard");

        } catch (error) {
            console.error("❌ Login error:", error);

            setError(
                error.message ||
                "Unable to login. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="student-login-page">

            <div className="student-login-card">

                {/* LEFT SIDE */}
                <section className="student-login-left">

                    <Link
                        to="/"
                        className="student-login-logo"
                    >
                        <span className="student-login-logo-mark">

                            <span className="triangle triangle-top"></span>

                            <span className="circle"></span>

                            <span className="triangle triangle-bottom"></span>

                        </span>

                        <span>Votara</span>
                    </Link>

                    <div className="student-login-visual">

                        <img
                       src="/src/images/Login.png"
                        alt="Votara login illustration"
                        className="student-login-illustration"
                      />

                    </div>

                </section>


                {/* RIGHT SIDE */}
                <section className="student-login-right">

                    <div className="student-login-form-container">

                        <h1>Welcome !</h1>

                        <p className="login-description">
                            Login as a voter on Western Institute
                            <br />
                            of Technology voting platform to vote in
                            <br />
                            your preferred candidate
                        </p>


                        {/* ERROR MESSAGE */}
                        {error && (
                            <div
                                style={{
                                    color: "#d93025",
                                    background: "#fff1f0",
                                    padding: "12px",
                                    borderRadius: "8px",
                                    marginBottom: "15px",
                                    fontSize: "14px",
                                }}
                            >
                                {error}
                            </div>
                        )}


                        <form onSubmit={handleLogin}>

                            <div className="login-input-group">

                                <input
                                    type="text"
                                    placeholder="Student ID No. (max 5 digits)"
                                    value={studentId}
                                    onChange={handleStudentIdChange}
                                    maxLength={5}
                                    required
                                />

                            </div>


                            <div className="login-input-group">

                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                />

                            </div>


                            <button
                                type="submit"
                                className="student-login-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Logging in..."
                                    : "Login"}
                            </button>

                        </form>


                        <div className="login-back">

                            <Link to="/">
                                ← Back to Home
                            </Link>

                        </div>

                    </div>

                </section>

            </div>

        </div>
    );
};

export default StudentLogin;
