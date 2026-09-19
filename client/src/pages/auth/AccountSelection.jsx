import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./AccountSelection.css";

import api from "../../services/api";


// =====================================================
// ADMIN LOGIN
// =====================================================

const AccountSelection = () => {

    const navigate = useNavigate();


    // =================================================
    // NAVIGATION
    // =================================================

    const goToElectoralBoard = () => {

        const changePage = () =>
            navigate("/admin-login");


        if (document.startViewTransition) {

            document.startViewTransition(
                changePage
            );

        } else {

            changePage();

        }

    };


    // =================================================
    // FORM STATE
    // =================================================

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
    // INPUT CHANGE
    // =================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));


        setError("");

    };


    // =================================================
    // ADMIN LOGIN
    // =================================================

    const handleAdminLogin = async (event) => {

        event.preventDefault();

        setError("");


        // =================================================
        // REQUIRED FIELDS
        // =================================================

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


            // =================================================
            // STAFF AUTHENTICATION
            // =================================================
            //
            // Uses centralized api.js.
            //
            // Production:
            // https://votara-api-olij.onrender.com/api
            //
            // Endpoint:
            // /staff-auth/login
            // =================================================

            const response =
                await api.post(
                    "/staff-auth/login",
                    {
                        email:
                            formData.email
                                .trim()
                                .toLowerCase(),

                        password:
                            formData.password,

                        securityCode:
                            formData.securityCode
                                .trim(),
                    }
                );


            const data =
                response.data;


            // =================================================
            // RESPONSE VALIDATION
            // =================================================

            if (
                !data ||
                !data.user ||
                !data.token
            ) {

                setError(
                    "Invalid login response from the VOTARA server."
                );

                return;

            }


            // =================================================
            // ADMIN ONLY
            // =================================================

            if (
                data.user.role !==
                "admin"
            ) {

                setError(
                    "This account is not an Administrator account. Please use the Electoral Board login page."
                );

                return;

            }


            // =================================================
            // SAVE ADMIN SESSION
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


            // =================================================
            // PASSWORD CHANGE
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


            // =================================================
            // ADMIN DASHBOARD
            // =================================================

            navigate(
                "/admin-dashboard",
                {
                    replace: true,
                }
            );


        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );


            // =================================================
            // SERVER ERROR
            // =================================================

            if (
                error.response
            ) {

                setError(
                    error.response.data?.message ||
                    "Unable to login."
                );

            } else {

                setError(
                    "Unable to connect to the VOTARA server. Please check your internet connection or try again."
                );

            }

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="account-selection-page">

            <div className="account-selection-card">


                {/* =================================================
                    LEFT VOTARA PANEL
                ================================================= */}

                <div className="account-selection-left">


                    {/* =================================================
                        LOGO
                    ================================================= */}

                    <Link
                        to="/"
                        className="account-selection-logo"
                    >

                        <span className="account-selection-logo-mark">

                            <span className="logo-shape logo-one"></span>

                            <span className="logo-shape logo-two"></span>

                            <span className="logo-shape logo-three"></span>

                            <span className="logo-shape logo-four"></span>

                        </span>

                        <span>
                            Votara
                        </span>

                    </Link>


                    {/* =================================================
                        LEFT MESSAGE
                    ================================================= */}

                    <div className="account-selection-message">

                        <h2>
                            Secure, transparent elections
                        </h2>

                        <p>
                            for BSIT students at Western Institute
                            of Technology.
                        </p>

                        <p>
                            Every vote verified, every result trusted.
                        </p>

                    </div>


                    {/* =================================================
                        ELECTORAL BOARD LOGIN
                    ================================================= */}

                    <div className="account-selection-electoral-box">

                        <p>
                            Not a Admin member?
                        </p>

                        <button
                            type="button"
                            onClick={
                                goToElectoralBoard
                            }
                        >
                            LOGIN AS ELECTORAL BOARD
                        </button>

                    </div>

                </div>


                {/* =================================================
                    RIGHT ADMIN LOGIN
                ================================================= */}

                <div className="account-selection-right">


                    {/* =================================================
                        BACK
                    ================================================= */}

                    <Link
                        to="/register"
                        className="account-selection-back"
                    >
                        ← back
                    </Link>


                    {/* =================================================
                        CONTENT
                    ================================================= */}

                    <div className="account-selection-form-container">

                        <h1>
                            Admin Login!
                        </h1>


                        <p className="account-selection-subtitle">
                            Login as Admin on Western Institute
                            of Technology Votara platform.
                        </p>


                        {/* =================================================
                            ERROR
                        ================================================= */}

                        {error && (

                            <div className="account-selection-error">
                                {error}
                            </div>

                        )}


                        {/* =================================================
                            FORM
                        ================================================= */}

                        <form
                            onSubmit={
                                handleAdminLogin
                            }
                            className="account-selection-form"
                            style={{
                                viewTransitionName:
                                    "admin-login-input-section",
                            }}
                        >


                            {/* EMAIL */}

                            <div className="account-selection-field">

                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        formData.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Email"
                                    autoComplete="email"
                                    disabled={loading}
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="account-selection-field">

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
                                    className="account-selection-show"
                                    onClick={() =>
                                        setShowPassword(
                                            (previous) =>
                                                !previous
                                        )
                                    }
                                >
                                    {showPassword
                                        ? "ꗃ"
                                        : "🔒︎"}
                                </button>

                            </div>


                            {/* LOGIN CODE */}

                            <div className="account-selection-field">

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
                                    className="account-selection-show"
                                    onClick={() =>
                                        setShowSecurityCode(
                                            (previous) =>
                                                !previous
                                        )
                                    }
                                >
                                    {showSecurityCode
                                        ? "ꗃ"
                                        : "🔒︎"}
                                </button>

                            </div>


                            {/* =================================================
                                INFORMATION
                            ================================================= */}

                            <p className="admin-login-info">
                                The system automatically identifies
                                you are Admin
                                member.
                            </p>


                            {/* =================================================
                                LOGIN BUTTON
                            ================================================= */}

                            <button
                                type="submit"
                                className="account-selection-login-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Logging in..."
                                    : "Login"}
                            </button>

                        </form>


                        {/* =================================================
                            REGISTER
                        ================================================= */}

                        <div className="account-selection-register">

                            <span>
                                Need to create an Admin account?
                            </span>

                            <Link
                                to="/admin/register"
                            >
                                Register as Admin
                            </Link>

                        </div>


                    </div>

                </div>

            </div>

        </div>

    );

};


export default AccountSelection;