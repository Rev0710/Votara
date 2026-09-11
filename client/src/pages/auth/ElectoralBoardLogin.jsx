import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ElectoralBoardLogin = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // =========================================================
    // EB LOGIN
    // =========================================================

    const handleLogin = async (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (!email.trim() || !password) {
            setErrorMessage(
                "Please enter your email and password."
            );
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_BASE_URL}/eb-auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Invalid email or password."
                );
            }

            // =================================================
            // SAVE EB TOKEN
            // =================================================

            localStorage.setItem(
                "votaraEBToken",
                data.token
            );

            localStorage.setItem(
                "votaraEBUser",
                JSON.stringify(data.user)
            );

            setSuccessMessage(
                "Login successful. Redirecting to your dashboard..."
            );

            // =================================================
            // GO TO EB DASHBOARD
            // =================================================

            setTimeout(() => {
                navigate("/electoral-board/dashboard");
            }, 600);

        } catch (error) {
            console.error(
                "❌ EB login error:",
                error
            );

            setErrorMessage(
                error.message ||
                    "Unable to login. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#eef2ff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "30px 20px",
                boxSizing: "border-box"
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "480px",
                    background: "#ffffff",
                    borderRadius: "18px",
                    padding: "40px",
                    boxSizing: "border-box",
                    boxShadow:
                        "0 10px 35px rgba(0, 0, 0, 0.08)"
                }}
            >

                {/* =================================================
                    LOGO
                ================================================= */}

                <Link
                    to="/"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        textDecoration: "none",
                        color: "#1f55ff",
                        fontSize: "28px",
                        fontWeight: "700",
                        marginBottom: "35px"
                    }}
                >

                    <span
                        style={{
                            fontSize: "28px"
                        }}
                    >
                        ◆
                    </span>

                    <span>Votara</span>

                </Link>


                {/* =================================================
                    HEADING
                ================================================= */}

                <div
                    style={{
                        marginBottom: "28px"
                    }}
                >

                    <h1
                        style={{
                            margin: "0 0 8px",
                            fontSize: "30px",
                            color: "#111827"
                        }}
                    >
                        Electoral Board Login
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color: "#6b7280",
                            fontSize: "15px",
                            lineHeight: "1.5"
                        }}
                    >
                        Sign in using the personal email and
                        password associated with your EB account.
                    </p>

                </div>


                {/* =================================================
                    ERROR
                ================================================= */}

                {errorMessage && (

                    <div
                        style={{
                            background: "#fff1f1",
                            border: "1px solid #ffcaca",
                            color: "#c62828",
                            borderRadius: "10px",
                            padding: "12px 14px",
                            marginBottom: "18px",
                            fontSize: "14px"
                        }}
                    >
                        {errorMessage}
                    </div>

                )}


                {/* =================================================
                    SUCCESS
                ================================================= */}

                {successMessage && (

                    <div
                        style={{
                            background: "#effaf2",
                            border: "1px solid #bde5c5",
                            color: "#218838",
                            borderRadius: "10px",
                            padding: "12px 14px",
                            marginBottom: "18px",
                            fontSize: "14px"
                        }}
                    >
                        {successMessage}
                    </div>

                )}


                {/* =================================================
                    LOGIN FORM
                ================================================= */}

                <form onSubmit={handleLogin}>

                    {/* EMAIL */}

                    <div
                        style={{
                            marginBottom: "20px"
                        }}
                    >

                        <label
                            htmlFor="eb-login-email"
                            style={{
                                display: "block",
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: "8px"
                            }}
                        >
                            Personal Email
                        </label>

                        <input
                            id="eb-login-email"
                            type="email"
                            value={email}
                            onChange={(event) => {
                                setEmail(event.target.value);
                                setErrorMessage("");
                            }}
                            placeholder="example@gmail.com"
                            autoComplete="email"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "14px",
                                border: "1px solid #d7dce5",
                                borderRadius: "10px",
                                fontSize: "15px",
                                boxSizing: "border-box",
                                outline: "none"
                            }}
                        />

                    </div>


                    {/* PASSWORD */}

                    <div
                        style={{
                            marginBottom: "24px"
                        }}
                    >

                        <label
                            htmlFor="eb-login-password"
                            style={{
                                display: "block",
                                fontWeight: "600",
                                color: "#111827",
                                marginBottom: "8px"
                            }}
                        >
                            Password
                        </label>

                        <div
                            style={{
                                position: "relative"
                            }}
                        >

                            <input
                                id="eb-login-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(event) => {
                                    setPassword(
                                        event.target.value
                                    );
                                    setErrorMessage("");
                                }}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                                style={{
                                    width: "100%",
                                    padding: "14px 70px 14px 14px",
                                    border: "1px solid #d7dce5",
                                    borderRadius: "10px",
                                    fontSize: "15px",
                                    boxSizing: "border-box",
                                    outline: "none"
                                }}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                                disabled={loading}
                                style={{
                                    position: "absolute",
                                    right: "10px",
                                    top: "50%",
                                    transform:
                                        "translateY(-50%)",
                                    border: "none",
                                    background: "transparent",
                                    color: "#555",
                                    cursor: "pointer",
                                    fontSize: "13px"
                                }}
                            >
                                {showPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>

                        </div>

                    </div>


                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            border: "none",
                            borderRadius: "10px",
                            background: "#1f55ff",
                            color: "#ffffff",
                            fontSize: "15px",
                            fontWeight: "600",
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading
                            ? "Signing in..."
                            : "Login as Electoral Board →"}
                    </button>

                </form>


                {/* =================================================
                    REGISTRATION LINK
                ================================================= */}

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "24px",
                        fontSize: "14px",
                        color: "#6b7280"
                    }}
                >

                    Don't have an EB account yet?

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/account-selection")
                        }
                        style={{
                            marginLeft: "5px",
                            border: "none",
                            background: "transparent",
                            color: "#1f55ff",
                            fontWeight: "600",
                            cursor: "pointer",
                            padding: 0
                        }}
                    >
                        Register here
                    </button>

                </div>


                {/* =================================================
                    BACK
                ================================================= */}

                <div
                    style={{
                        textAlign: "center",
                        marginTop: "18px"
                    }}
                >

                    <Link
                        to="/account-selection"
                        style={{
                            color: "#555",
                            fontSize: "14px",
                            textDecoration: "none"
                        }}
                    >
                        ← Back to Account Selection
                    </Link>

                </div>

            </div>

        </div>
    );
};

export default ElectoralBoardLogin;