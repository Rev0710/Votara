import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentLogin } from "../../services/authService";

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

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#eef3ff",
                fontFamily: "Poppins, sans-serif",
                padding: "20px",
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    background: "#ffffff",
                    padding: "40px",
                    borderRadius: "15px",
                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.08)",
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <h1
                    style={{
                        textAlign: "center",
                        marginBottom: "10px",
                    }}
                >
                    Student Login
                </h1>

                <p
                    style={{
                        textAlign: "center",
                        color: "#666",
                        marginBottom: "30px",
                        lineHeight: "1.6",
                    }}
                >
                    Enter the credentials provided
                    by the Electoral Board.
                </p>

                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}

                {error && (
                    <div
                        style={{
                            background: "#fff1f0",
                            color: "#d93025",
                            padding: "12px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            fontSize: "14px",
                            lineHeight: "1.5",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* =================================================
                    LOGIN FORM
                ================================================= */}

                <form onSubmit={handleSubmit}>

                    {/* STUDENT ID */}

                    <label
                        htmlFor="studentId"
                        style={{
                            display: "block",
                            fontWeight: "600",
                            marginBottom: "8px",
                        }}
                    >
                        Student ID
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
                        placeholder="Enter Student ID"
                        maxLength={5}
                        required
                        disabled={loading}
                        autoComplete="username"
                        style={{
                            width: "100%",
                            padding: "13px",
                            marginBottom: "20px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            fontSize: "15px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />

                    {/* PASSWORD */}

                    <label
                        htmlFor="password"
                        style={{
                            display: "block",
                            fontWeight: "600",
                            marginBottom: "8px",
                        }}
                    >
                        Password
                    </label>

                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                        placeholder="Enter your password"
                        required
                        disabled={loading}
                        autoComplete="current-password"
                        style={{
                            width: "100%",
                            padding: "13px",
                            marginBottom: "25px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            fontSize: "15px",
                            outline: "none",
                            boxSizing: "border-box",
                        }}
                    />

                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "13px",
                            border: "none",
                            borderRadius: "8px",
                            background: loading
                                ? "#8aa8ff"
                                : "#1455ff",
                            color: "#ffffff",
                            fontWeight: "600",
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                            fontSize: "15px",
                        }}
                    >
                        {loading
                            ? "Signing in..."
                            : "Login"}
                    </button>

                </form>

            </div>

        </div>
    );
};

export default StudentLogin;
