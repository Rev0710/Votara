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
    // HELPER
    // Get a value whether the backend returns it directly
    // or inside data.student.
    // =====================================================

    const getStudentFlag = (data, flagName) => {
        return (
            data?.[flagName] === true ||
            data?.student?.[flagName] === true
        );
    };

    // =====================================================
    // LOGIN
    // =====================================================

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");

        // =================================================
        // VALIDATION
        // =================================================

        const normalizedStudentId = studentId.trim();

        if (!normalizedStudentId || !password) {
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
                normalizedStudentId,
                password
            );

            console.log(
                "✅ Student login successful."
            );

            // =================================================
            // CHECK TOKEN
            // =================================================

            if (!data?.token) {
                throw new Error(
                    "Login was successful, but no authentication token was returned."
                );
            }

            // =================================================
            // CLEAR OLD ROLE TOKENS
            //
            // This prevents an old Admin/EB session from
            // interfering with the Student session.
            // =================================================

            localStorage.removeItem(
                "votaraStaffToken"
            );

            localStorage.removeItem(
                "votaraEBToken"
            );

            localStorage.removeItem(
                "votaraStaffUser"
            );

            localStorage.removeItem(
                "votaraEBUser"
            );

            // =================================================
            // SAVE STUDENT JWT
            // =================================================

            localStorage.setItem(
                "votaraToken",
                data.token
            );

            console.log(
                "🔐 Student JWT saved."
            );

            // =================================================
            // SAVE STUDENT INFORMATION
            // =================================================

            if (data.student) {

                localStorage.setItem(
                    "votaraStudent",
                    JSON.stringify(data.student)
                );

            }

            // =================================================
            // DETERMINE ONBOARDING STATUS
            //
            // Supports both:
            //
            // data.mustChangePassword
            //
            // OR
            //
            // data.student.mustChangePassword
            // =================================================

            const mustChangePassword =
                getStudentFlag(
                    data,
                    "mustChangePassword"
                );

            const needsProfilePicture =
                getStudentFlag(
                    data,
                    "needsProfilePicture"
                );

            // =================================================
            // DEBUG INFORMATION
            // =================================================

            console.log(
                "🔐 Must change password:",
                mustChangePassword
            );

            console.log(
                "📸 Needs profile picture:",
                needsProfilePicture
            );

            // =================================================
            // STEP 1
            // FORCE PASSWORD CHANGE
            // =================================================

            if (mustChangePassword) {

                console.log(
                    "🔐 Student must change temporary password."
                );

                navigate(
                    "/change-password",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // STEP 2
            // FORCE PROFILE PHOTO
            // =================================================

            if (needsProfilePicture) {

                console.log(
                    "📸 Student must take/upload profile picture."
                );

                navigate(
                    "/upload-profile-picture",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // =================================================
            // STEP 3
            // ONBOARDING COMPLETE
            // =================================================

            console.log(
                "🎉 Student onboarding complete."
            );

            navigate(
                "/student-dashboard",
                {
                    replace: true,
                }
            );

        } catch (error) {

            console.error(
                "❌ Student login error:",
                error
            );

            // =================================================
            // CLEANUP TOKEN IF LOGIN FAILED AFTER TOKEN SET
            // =================================================

            localStorage.removeItem(
                "votaraToken"
            );

            localStorage.removeItem(
                "votaraStudent"
            );

            // =================================================
            // FRIENDLY ERROR MESSAGE
            // =================================================

            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                "Unable to login. Please check your Student ID and password.";

            setError(
                errorMessage
            );

        } finally {

            setLoading(false);

        }
    };

    // =====================================================
    // BACK TO LANDING PAGE
    // =====================================================

    const handleBack = () => {

        if (loading) {
            return;
        }

        navigate(
            "/"
        );
    };

    return (
        <div className="student-login-page">

            <div className="student-login-card">

                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <div className="student-login-left">

                    {/* =================================================
                        VOTARA LOGO
                    ================================================= */}

                    <button
                        type="button"
                        className="student-login-logo"
                        onClick={handleBack}
                        aria-label="Go to VOTARA home"
                        disabled={loading}
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


                    {/* =================================================
                        LOGIN ILLUSTRATION
                    ================================================= */}

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

                        {/* =================================================
                            TITLE
                        ================================================= */}

                        <h1>
                            Welcome !
                        </h1>


                        {/* =================================================
                            DESCRIPTION
                        ================================================= */}

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
                            <div
                                className="login-error"
                                role="alert"
                            >
                                {error}
                            </div>
                        )}


                        {/* =================================================
                            LOGIN FORM
                        ================================================= */}

                        <form
                            onSubmit={handleSubmit}
                            noValidate={false}
                        >

                            {/* =================================================
                                STUDENT ID
                            ================================================= */}

                            <div className="login-input-group">

                                <input
                                    id="studentId"
                                    name="studentId"
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => {
                                        setStudentId(
                                            e.target.value
                                        );

                                        if (error) {
                                            setError("");
                                        }
                                    }}
                                    placeholder="Student ID No."
                                    maxLength={5}
                                    inputMode="numeric"
                                    autoComplete="username"
                                    required
                                    disabled={loading}
                                    aria-label="Student ID"
                                />

                            </div>


                            {/* =================================================
                                PASSWORD
                            ================================================= */}

                            <div className="login-input-group">

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(
                                            e.target.value
                                        );

                                        if (error) {
                                            setError("");
                                        }
                                    }}
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    aria-label="Password"
                                />

                            </div>


                            {/* =================================================
                                LOGIN BUTTON
                            ================================================= */}

                            <button
                                type="submit"
                                className="student-login-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Logging in..."
                                    : "Login"
                                }
                            </button>


                            {/* =================================================
                                BACK BUTTON
                            ================================================= */}

                            <button
                                type="button"
                                className="student-login-back-button"
                                onClick={handleBack}
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