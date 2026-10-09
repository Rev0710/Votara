import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCheck, FiShield, FiUser } from "react-icons/fi";
import { studentLogin } from "../../services/authService";
import votaraLogo from "../../assets/images/votara-logo.png";
import "./StudentLogin.css";

const StudentLogin = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const getStudentFlag = (data, flagName) => (
        data?.[flagName] === true || data?.student?.[flagName] === true
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const normalizedStudentId = studentId.trim();

        if (!normalizedStudentId || !password) {
            setError("Please enter your Student ID and password.");
            return;
        }

        try {
            setLoading(true);

            const data = await studentLogin(normalizedStudentId, password);

            if (!data?.token) {
                throw new Error("Login was successful, but no authentication token was returned.");
            }

            localStorage.removeItem("votaraStaffToken");
            localStorage.removeItem("votaraEBToken");
            localStorage.removeItem("votaraStaffUser");
            localStorage.removeItem("votaraEBUser");

            localStorage.setItem("votaraToken", data.token);

            if (data.student) {
                localStorage.setItem("votaraStudent", JSON.stringify(data.student));
            }

            const mustChangePassword = getStudentFlag(data, "mustChangePassword");
            const needsProfilePicture = getStudentFlag(data, "needsProfilePicture");

            if (mustChangePassword) {
                navigate("/change-password", { replace: true });
                return;
            }

            if (needsProfilePicture) {
                navigate("/upload-profile-picture", { replace: true });
                return;
            }

            navigate("/student-dashboard", { replace: true });
        } catch (error) {
            console.error("Student login error:", error);

            localStorage.removeItem("votaraToken");
            localStorage.removeItem("votaraStudent");

            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Unable to login. Please check your Student ID and password.";

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        if (!loading) navigate("/");
    };

    return (
        <main className="student-login-page">

            <section className="student-login-card" aria-label="VOTARA student login">
                <div className="student-login-left">
                    <button
                        type="button"
                        className="student-login-logo"
                        onClick={handleBack}
                        aria-label="Go to VOTARA home"
                        disabled={loading}
                    >
                        <img src={votaraLogo} alt="Votara" />
                    </button>

                    <div className="student-login-copy">
                        <span className="student-login-kicker">VOTARA&nbsp; / &nbsp;CAMPUS ELECTIONS</span>
                        <h2>Your vote.<br />Your voice.</h2>
                        <p>
                            Sign in with your temporary password. After<br className="desktop-break" />
                            your first login, you'll create a new password.
                        </p>

                        <div className="student-login-steps">
                            <span><b>01</b> Sign in with your issued password</span>
                            <span><b>02</b> Create a new password</span>
                        </div>
                    </div>

                    <div className="student-login-orbit" aria-hidden="true">
                    <div className="student-login-orbit-ring ring-one" />
                    <div className="student-login-orbit-ring ring-two" />
                    <div className="student-login-orbit-ring ring-three" />

                    <div className="student-login-orbit-core">
                        <img src={votaraLogo} alt="" />
                    </div>

                    <div className="student-login-orbit-track orbit-track-outer">
                        <span className="student-login-orbit-icon">
                            <FiCheck />
                        </span>
                    </div>

                    <div className="student-login-orbit-track orbit-track-middle">
                        <span className="student-login-orbit-icon">
                            <FiShield />
                        </span>
                    </div>

                    <div className="student-login-orbit-track orbit-track-inner">
                        <span className="student-login-orbit-icon">
                            <FiUser />
                        </span>
                    </div>
                </div>
                </div>

                <div className="student-login-right">
                    <div className="student-login-form-card">
                            <button
                                type="button"
                                className="student-login-back-button"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                ← Back to VOTARA
                            </button>

                            <span className="student-login-label">STUDENT LOGIN</span>
                            <h1>Welcome back</h1>
                        <p className="login-description">
                            Sign in with your student ID and the temporary<br className="desktop-break" />
                            password sent after your registration is approved.
                        </p>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <label htmlFor="studentId">Student ID</label>
                            <div className="login-input-group">
                                <input
                                    id="studentId"
                                    name="studentId"
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => {
                                        setStudentId(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="Enter your student ID"
                                    maxLength={5}
                                    inputMode="numeric"
                                    autoComplete="username"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <label htmlFor="password">Temporary password</label>
                            <div className="login-input-group">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError("");
                                    }}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <button
                                type="button"
                                className="forgot-password-link"
                                onClick={() => navigate("/forgot-password")}
                                disabled={loading}
                            >
                                Forgot password
                            </button>

                            <button
                                type="submit"
                                className="student-login-button"
                                disabled={loading}
                            >
                                {loading ? "Logging in..." : "Log in"}
                            </button>

                            <button
                                type="button"
                                className="student-signup-button"
                                onClick={() => navigate("/register")}
                                disabled={loading}
                            >
                                Sign up
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default StudentLogin;
