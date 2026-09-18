import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// =====================================================
// SHARED ADMIN / ELECTORAL BOARD LOGIN
// =====================================================

const StaffLogin = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        securityCode: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showSecurityCode, setShowSecurityCode] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // =================================================
    // HANDLE INPUT
    // =================================================

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
    };

    // =================================================
    // SUBMIT LOGIN
    // =================================================

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");

        // ---------------------------------------------
        // VALIDATE REQUIRED FIELDS
        // ---------------------------------------------

        const email = formData.email.trim().toLowerCase();
        const password = formData.password;
        const securityCode = formData.securityCode.trim();

        if (!email || !password || !securityCode) {
            setError(
                "Please enter your email, password, and security code."
            );
            return;
        }

        try {
            setLoading(true);

            // ---------------------------------------------
            // REMOVE OLD STAFF SESSION
            // ---------------------------------------------
            // This prevents an old Admin/EB session from
            // interfering with the newly authenticated user.

            localStorage.removeItem("votaraStaffToken");
            localStorage.removeItem("votaraStaffUser");

            // ---------------------------------------------
            // STAFF LOGIN REQUEST
            // ---------------------------------------------

            const response = await fetch(
                `${API_BASE_URL}/staff-auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email,
                        password,
                        securityCode,
                    }),
                }
            );

            // ---------------------------------------------
            // SAFELY READ SERVER RESPONSE
            // ---------------------------------------------

            let data = {};

            try {
                data = await response.json();
            } catch {
                data = {};
            }

            // ---------------------------------------------
            // LOGIN ERROR
            // ---------------------------------------------

            if (!response.ok) {
                console.error(
                    "Staff login failed:",
                    response.status,
                    data
                );

                setError(
                    data.message ||
                        "Unable to login. Please check your credentials and security code."
                );

                return;
            }

            // ---------------------------------------------
            // VALIDATE LOGIN RESPONSE
            // ---------------------------------------------

            if (!data.token || !data.user) {
                console.error(
                    "Invalid staff login response:",
                    data
                );

                setError(
                    "Login succeeded, but the server returned an invalid session."
                );

                return;
            }

            // ---------------------------------------------
            // NORMALIZE USER ROLE
            // ---------------------------------------------

            const user = {
                ...data.user,
                role:
                    typeof data.user.role === "string"
                        ? data.user.role.trim().toLowerCase()
                        : "",
            };

            // ---------------------------------------------
            // SAVE STAFF SESSION
            //
            // Password is NEVER stored.
            // ---------------------------------------------

            localStorage.setItem(
                "votaraStaffToken",
                data.token
            );

            localStorage.setItem(
                "votaraStaffUser",
                JSON.stringify(user)
            );

            // ---------------------------------------------
            // PASSWORD CHANGE REQUIREMENT
            // ---------------------------------------------

            if (user.mustChangePassword === true) {
                navigate(
                    "/staff-change-password",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // ---------------------------------------------
            // ADMIN
            // ---------------------------------------------

            if (user.role === "admin") {
                navigate(
                    "/admin-dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // ---------------------------------------------
            // ELECTORAL BOARD
            // ---------------------------------------------

            if (user.role === "electoral_board") {
                navigate(
                    "/electoral-board/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            // ---------------------------------------------
            // UNKNOWN ROLE
            // ---------------------------------------------

            console.error(
                "Unknown staff role:",
                user.role
            );

            // Remove invalid session
            localStorage.removeItem("votaraStaffToken");
            localStorage.removeItem("votaraStaffUser");

            setError(
                "Your account role is not recognized."
            );
        } catch (error) {
            console.error(
                "Staff login error:",
                error
            );

            setError(
                "Unable to connect to the VOTARA server. Please make sure the backend is running."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "30px 20px",
                background:
                    "linear-gradient(135deg, #eff6ff, #f8fafc)",
                fontFamily:
                    "Poppins, Arial, sans-serif",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "480px",
                    background: "#ffffff",
                    borderRadius: "22px",
                    padding: "34px",
                    boxShadow:
                        "0 20px 50px rgba(15, 23, 42, 0.12)",
                }}
            >
                {/* =====================================
                    HEADER
                ====================================== */}

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "28px",
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            margin: "0 auto 14px",
                            borderRadius: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#eff6ff",
                            fontSize: "30px",
                        }}
                    >
                        🔐
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            color: "#172554",
                            fontSize: "28px",
                        }}
                    >
                        Staff Login
                    </h1>

                    <p
                        style={{
                            margin: "8px 0 0",
                            color: "#64748b",
                            fontSize: "14px",
                        }}
                    >
                        Admin / Electoral Board
                    </p>
                </div>

                {/* =====================================
                    ERROR
                ====================================== */}

                {error && (
                    <div
                        style={{
                            marginBottom: "18px",
                            padding: "13px 15px",
                            borderRadius: "12px",
                            background: "#fef2f2",
                            border: "1px solid #fecaca",
                            color: "#b91c1c",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* =================================
                        EMAIL
                    ================================== */}

                    <label style={labelStyle}>
                        Email Address
                    </label>

                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        autoComplete="email"
                        style={inputStyle}
                        disabled={loading}
                    />

                    {/* =================================
                        PASSWORD
                    ================================== */}

                    <label style={labelStyle}>
                        Password
                    </label>

                    <div
                        style={{
                            position: "relative",
                        }}
                    >
                        <input
                            type={
                                showPassword
                                    ? "text"
                                    : "password"
                            }
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            style={{
                                ...inputStyle,
                                paddingRight: "75px",
                            }}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword(
                                    (previous) =>
                                        !previous
                                )
                            }
                            style={toggleStyle}
                            disabled={loading}
                        >
                            {showPassword
                                ? "Hide"
                                : "Show"}
                        </button>
                    </div>

                    {/* =================================
                        SECURITY CODE
                    ================================== */}

                    <label style={labelStyle}>
                        Security Code
                    </label>

                    <div
                        style={{
                            position: "relative",
                        }}
                    >
                        <input
                            type={
                                showSecurityCode
                                    ? "text"
                                    : "password"
                            }
                            name="securityCode"
                            value={formData.securityCode}
                            onChange={handleChange}
                            placeholder="Enter your security code"
                            autoComplete="off"
                            spellCheck="false"
                            style={{
                                ...inputStyle,
                                paddingRight: "75px",
                            }}
                            disabled={loading}
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowSecurityCode(
                                    (previous) =>
                                        !previous
                                )
                            }
                            style={toggleStyle}
                            disabled={loading}
                        >
                            {showSecurityCode
                                ? "Hide"
                                : "Show"}
                        </button>
                    </div>

                    <div
                        style={{
                            marginTop: "8px",
                            marginBottom: "20px",
                            fontSize: "12px",
                            color: "#64748b",
                            lineHeight: 1.5,
                        }}
                    >
                        The system automatically identifies
                        whether you are an Admin or Electoral
                        Board member.
                    </div>

                    {/* =================================
                        LOGIN
                    ================================== */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...primaryButtonStyle,
                            width: "100%",
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading
                            ? "Signing In..."
                            : "Login"}
                    </button>
                </form>

                {/* =====================================
                    ADMIN REGISTRATION
                ====================================== */}

                <div
                    style={{
                        marginTop: "22px",
                        textAlign: "center",
                        fontSize: "14px",
                        color: "#64748b",
                    }}
                >
                    Initial Admin?{" "}
                    <Link
                        to="/admin/register"
                        style={{
                            color: "#2563eb",
                            fontWeight: "700",
                            textDecoration: "none",
                        }}
                    >
                        Create Admin Account
                    </Link>
                </div>

                {/* =====================================
                    BACK
                ====================================== */}

                <div
                    style={{
                        marginTop: "12px",
                        textAlign: "center",
                    }}
                >
                    <Link
                        to="/account-selection"
                        style={{
                            color: "#64748b",
                            fontSize: "13px",
                            textDecoration: "none",
                        }}
                    >
                        ← Back to Account Selection
                    </Link>
                </div>
            </div>
        </div>
    );
};

// =====================================================
// STYLES
// =====================================================

const labelStyle = {
    display: "block",
    marginTop: "17px",
    marginBottom: "7px",
    color: "#334155",
    fontSize: "14px",
    fontWeight: "700",
};

const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "11px",
    outline: "none",
    fontSize: "14px",
    color: "#0f172a",
    background: "#ffffff",
};

const toggleStyle = {
    position: "absolute",
    right: "8px",
    top: "7px",
    border: "none",
    borderRadius: "8px",
    padding: "7px 10px",
    background: "#f1f5f9",
    color: "#334155",
    fontWeight: "600",
    cursor: "pointer",
};

const primaryButtonStyle = {
    border: "none",
    borderRadius: "11px",
    padding: "14px 18px",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
};

export default StaffLogin;