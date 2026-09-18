import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./StaffLogin.css";

const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api";

// =====================================================
// SHARED ADMIN / ELECTORAL BOARD LOGIN
// =====================================================

const StaffLogin = () => {

    const navigate = useNavigate();

    const goToAdmin = () => {
        const changePage = () => navigate("/account-selection");

        if (document.startViewTransition) {
            document.startViewTransition(changePage);
        } else {
            changePage();
        }
    };

    const [formData, setFormData] =
        useState({
            email: "",
            password: "",
            securityCode: "",
        });

    const [showPassword, setShowPassword] =
        useState(false);

    const [showSecurityCode, setShowSecurityCode] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    // =================================================
    // HANDLE INPUT
    // =================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setFormData(previous => ({
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

        if (
            !formData.email.trim() ||
            !formData.password ||
            !formData.securityCode.trim()
        ) {

            setError(
                "Please enter your email, password, and security code."
            );

            return;
        }


        try {

            setLoading(true);

            const response =
                await fetch(
                    `${API_BASE_URL}/staff-auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                email:
                                    formData.email
                                        .trim()
                                        .toLowerCase(),

                                password:
                                    formData.password,

                                securityCode:
                                    formData.securityCode
                                        .trim(),
                            }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                setError(
                    data.message ||
                    "Unable to login."
                );

                return;
            }


            // =================================================
            // SAVE UNIFIED STAFF SESSION
            //
            // Password is NEVER stored.
            // =================================================

            localStorage.setItem(
                "votaraStaffToken",
                data.token
            );

            localStorage.setItem(
                "votaraStaffUser",
                JSON.stringify(
                    data.user
                )
            );
            navigate(
    "/electoral-board/dashboard",
    {
        replace: true,
    }
            );


            // =================================================
            // ROLE CHECK
            // =================================================

            if (
                data.user.mustChangePassword
            ) {

                navigate(
                    "/staff-change-password",
                    {
                        replace: true,
                    }
                );

                return;
            }


if (
    !data.user ||
    data.user.role !== "electoral_board"
) {
    setError(
        "This account is not an Electoral Board account. Please use the Admin login page."
    );

    return;
}


            if (
                data.user.role ===
                "electoral_board"
            ) {

                navigate(
                    "/electoral-board/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }


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

        <div className="staff-login-page">

            <div className="staff-login-container">


                {/* =================================================
                    LEFT SIDE
                ================================================= */}

                <section className="staff-login-form-side">

                    <div className="staff-login-form-wrapper">


                        {/* =========================================
                            BACK
                        ========================================= */}

                        <Link
                            to="/account-selection"
                            className="staff-login-back"
                        >
                            ← back
                        </Link>


                        {/* =========================================
                            HEADING
                        ========================================= */}

                        <div className="staff-login-heading">

                            <h1>
                                Electoral Board Login!
                            </h1>

                            <p>
                                Login as Admin or Electoral Board
                                on Western Institute of Technology
                                Votara platform.
                            </p>

                        </div>


                        {/* =========================================
                            ERROR
                        ========================================= */}

                        {error && (

                            <div className="staff-login-error">
                                {error}
                            </div>

                        )}


                        {/* =========================================
                            LOGIN FORM
                        ========================================= */}

                        <form
                            onSubmit={handleSubmit}
                            className="staff-login-form"
                            style={{ viewTransitionName: "staff-login-input-section" }}
                        >


                            {/* =================================
                                EMAIL
                            ================================== */}

                            <div className="staff-login-field">

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="EMAIL"
                                    autoComplete="email"
                                    disabled={loading}
                                />

                            </div>


                            {/* =================================
                                PASSWORD
                            ================================== */}

                            <div className="staff-login-field staff-login-password-field">

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Password"
                                    autoComplete="current-password"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    className="staff-login-toggle"
                                >
                                    {showPassword
                                        ? "Hide"
                                        : "Show"}
                                </button>

                            </div>


                            {/* =================================
                                SECURITY CODE
                            ================================== */}

                            <div className="staff-login-field staff-login-password-field">

                                <input
                                    type={
                                        showSecurityCode
                                            ? "text"
                                            : "password"
                                    }
                                    name="securityCode"
                                    value={
                                        formData.securityCode
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Login Code"
                                    autoComplete="off"
                                    disabled={loading}
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowSecurityCode(
                                            previous =>
                                                !previous
                                        )
                                    }
                                    className="staff-login-toggle"
                                >
                                    {showSecurityCode
                                        ? "Hide"
                                        : "Show"}
                                </button>

                            </div>


                            {/* =================================
                                INFORMATION
                            ================================== */}

                            <p className="staff-login-info">
                                The system automatically identifies
                                whether you are an Admin or Electoral
                                Board member.
                            </p>


                            {/* =================================
                                LOGIN BUTTON
                            ================================== */}

                            <button
                                type="submit"
                                disabled={loading}
                                className="staff-login-button"
                            >
                                {loading
                                    ? "Signing In..."
                                    : "Login"}
                            </button>

                        </form>


                        {/* =========================================
                            ADMIN REGISTRATION
                        ========================================= */}

                        <div className="staff-login-register">

                            <span>
                                Initial Admin?
                            </span>

                            <Link
                                to="/admin/register"
                            >
                                Create Admin Account
                            </Link>

                        </div>


                    </div>

                </section>


                {/* =================================================
                    RIGHT VOTARA PANEL
                ================================================= */}

                <section className="staff-login-brand-side">


                    {/* =========================================
                        DOT PATTERN
                    ========================================= */}

                    <div className="staff-login-dots"></div>


                    {/* =========================================
                        VOTARA LOGO
                    ========================================= */}

                    <Link
                        to="/"
                        className="staff-login-logo"
                    >

                        <span className="staff-login-logo-mark">

                            <span className="logo-shape logo-one"></span>

                            <span className="logo-shape logo-two"></span>

                            <span className="logo-shape logo-three"></span>

                            <span className="logo-shape logo-four"></span>

                        </span>

                        <span>
                            Votara
                        </span>

                    </Link>


                    {/* =========================================
                        BRAND MESSAGE
                    ========================================= */}

                    <div className="staff-login-brand-message">

                        <h2>
                            Secure, transparent elections
                        </h2>

                        <p>
                            for BSIT students at Western Institute
                            of Technology.
                        </p>

                        <span>
                            Every vote verified, every result trusted.
                        </span>

                    </div>


                    {/* =========================================
                        ACCOUNT SELECTION
                    ========================================= */}

                    <div className="staff-login-alternate">

                        <p>
                            Not a staff member?
                        </p>

                        <Link
                            to="/account-selection"
                            onClick={goToAdmin}
                        >
                            LOGIN AS ADMIN
                        </Link>

                    </div>


                </section>

            </div>

        </div>
    );
};

export default StaffLogin;