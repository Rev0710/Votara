import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentLogin } from "../../services/authService";
import "./StudentLogin.css";

const StudentLogin = () => {
    const navigate = useNavigate();

    const [studentId, setStudentId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // =====================================================
    // LOGIN
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        // Basic validation
        if (!studentId.trim() || !password) {
            setError(
                "Please enter your Student ID and password."
            );
            return;
        }

        try {
            setLoading(true);

            // =================================================
            // CALL LOGIN API
            // =================================================

            const data = await studentLogin(
                studentId.trim(),
                password
            );

            console.log("✅ Login successful:", data);

            // =================================================
            // SAVE JWT TOKEN
            // =================================================

            localStorage.setItem(
                "votaraToken",
                data.token
            );

            // =================================================
            // SAVE STUDENT INFORMATION
            // =================================================

            localStorage.setItem(
                "votaraStudent",
                JSON.stringify(data.student)
            );

            // =================================================
            // STEP 1
            // CHANGE TEMPORARY PASSWORD
            // =================================================

            if (data.mustChangePassword === true) {
                console.log(
                    "🔐 Student must change temporary password."
                );

                navigate("/change-password", {
                    replace: true,
                });

                return;
            }

            // =================================================
            // STEP 2
            // PROFILE PICTURE
            // =================================================

            if (data.needsProfilePicture === true) {
                console.log(
                    "📸 Student must upload a profile picture."
                );

                navigate("/upload-profile-picture", {
                    replace: true,
                });

                return;
            }

            // =================================================
            // STEP 3
            // EVERYTHING COMPLETE
            // =================================================

            console.log(
                "🎉 Student onboarding complete."
            );

            navigate("/student-dashboard", {
                replace: true,
            });

        } catch (error) {
            console.error(
                "❌ Login error:",
                error
            );

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

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <div className="student-login-left">

                    {/* VOTARA LOGO */}

                    <button
                        type="button"
                        className="student-login-logo"
                        onClick={() => navigate("/")}
                        aria-label="Go to VOTARA home"
                    >
                        <span className="student-login-logo-mark">
                            <span className="triangle-top"></span>
                            <span className="circle"></span>
                            <span className="triangle-bottom"></span>
                        </span>

                        <span>
                            Votara
                        </span>
                    </button>

 {/* REGISTER VECTOR ILLUSTRATION */}

    <div className="student-login-visual">

        <img
            src="/src/images/Register.png"
            alt="Votara student login illustration"
            className="student-login-illustration"
        />

    </div>

</div>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <div className="student-login-right">

                    <div className="student-login-form-container">

                        <h1>
                            Welcome !
                        </h1>

                        <p className="login-description">
                            Login as a voter on Western Institute
                            <br />
                            of Technology voting platform to vote in
                            <br />
                            your preferred candidate
                        </p>


                        {/* =================================================
                            ERROR MESSAGE
                        ================================================= */}

                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}


                        {/* =================================================
                            LOGIN FORM
                        ================================================= */}

                       <form onSubmit={handleSubmit}>

    {/* STUDENT ID */}

    <div className="login-input-group">

        <input
            id="studentId"
            type="text"
            value={studentId}
            onChange={(e) =>
                setStudentId(
                    e.target.value
                )
            }
            placeholder="Student ID No."
            maxLength={5}
            required
            disabled={loading}
            autoComplete="username"
        />

    </div>


    {/* PASSWORD */}

    <div className="login-input-group">

        <input
            id="password"
            type="password"
            value={password}
            onChange={(e) =>
                setPassword(
                    e.target.value
                )
            }
            placeholder="Password"
            required
            disabled={loading}
            autoComplete="current-password"
        />

    </div>


    {/* LOGIN BUTTON */}

    <button
        type="submit"
        className="student-login-button"
        disabled={loading}
    >
        {loading
            ? "..."
            : "Login"}
    </button>


    {/* BACK BUTTON */}

    <button
        type="button"
        className="student-login-back-button"
        onClick={() => navigate("/")}
        disabled={loading}
    >
        ← Back
        
    </button>

</form>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default StudentLogin;