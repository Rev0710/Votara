import React, {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import "./StaffLogin.css";


// =====================================================
// API BASE URL
// =====================================================
// Use the same environment variable as services/api.js.
// This prevents production Vercel builds from falling
// back to localhost when VITE_API_URL is not defined.
//
// Local:      http://localhost:5000/api
// Production: Vercel VITE_API_BASE_URL, or the Render fallback
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (
        import.meta.env.PROD
            ? "https://votara-api-oliq.onrender.com/api"
            : "http://localhost:5000/api"
    );

console.log(
    "🌐 Staff Login API BASE URL:",
    API_BASE_URL
);


// =====================================================
// SHARED ADMIN / ELECTORAL BOARD LOGIN
// =====================================================

const StaffLogin = () => {

    const navigate =
        useNavigate();


    // =================================================
    // FORM
    // =================================================

    const [formData, setFormData] =
        useState({

            email: "",

            password: "",

            securityCode: "",

        });


    // =================================================
    // UI STATE
    // =================================================

    const [showPassword, setShowPassword] =
        useState(false);


    const [showSecurityCode, setShowSecurityCode] =
        useState(false);


    const [loading, setLoading] =
        useState(false);


    const [error, setError] =
        useState("");


    // =================================================
    // LOCK COUNTDOWN
    // =================================================

    const [lockSeconds, setLockSeconds] =
        useState(0);


    // =================================================
    // COUNTDOWN TIMER
    // =================================================
    //
    // This is only the visual countdown.
    //
    // The server remains the real security authority.
    // =================================================

    useEffect(() => {

        if (
            lockSeconds <= 0
        ) {

            return;
        }


        const timer =
            window.setInterval(() => {

                setLockSeconds(
                    previous => {

                        if (
                            previous <= 1
                        ) {

                            window.clearInterval(
                                timer
                            );

                            return 0;
                        }


                        return previous - 1;
                    }
                );

            }, 1000);


        return () => {

            window.clearInterval(
                timer
            );

        };

    }, [lockSeconds]);


    // =================================================
    // WHEN TIMER REACHES ZERO
    // =================================================

    useEffect(() => {

        if (
            lockSeconds === 0
        ) {

            // Only clear the lock message if it was
            // the temporary-lock message.
            setError(
                previous => {

                    if (
                        previous &&
                        (
                            previous.includes(
                                "temporarily locked"
                            ) ||
                            previous.includes(
                                "Try again in"
                            )
                        )
                    ) {

                        return "";
                    }


                    return previous;
                }
            );
        }

    }, [lockSeconds]);


    // =================================================
    // GO TO ADMIN
    // =================================================

    const goToAdmin = () => {

        const changePage =
            () => navigate(
                "/account-selection"
            );


        if (
            document.startViewTransition
        ) {

            document.startViewTransition(
                changePage
            );

        } else {

            changePage();

        }
    };


    // =================================================
    // HANDLE INPUT
    // =================================================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setFormData(
            previous => ({

                ...previous,

                [name]:
                    value,

            })
        );


        // Don't clear the lock message while
        // the account is still locked.
        if (
            lockSeconds <= 0
        ) {

            setError("");
        }
    };


    // =================================================
    // FORMAT LOCK MESSAGE
    // =================================================

    const getLockMessage = () => {

        if (
            lockSeconds <= 0
        ) {

            return "";
        }


        return (
            `Too many failed login attempts. ` +
            `This account is temporarily locked. ` +
            `Try again in ${lockSeconds} ` +
            `second${lockSeconds === 1 ? "" : "s"}.`
        );
    };


    // =================================================
    // SUBMIT LOGIN
    // =================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        // -------------------------------------------------
        // FRONTEND LOCK GUARD
        // -------------------------------------------------

        if (
            lockSeconds > 0
        ) {

            setError(
                getLockMessage()
            );

            return;
        }


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
            // LOGIN REQUEST
            // =================================================

            const response =
                await fetch(
                    `${API_BASE_URL}/staff-auth/login`,
                    {

                        method:
                            "POST",

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


            // =================================================
            // TEMPORARY LOCK
            // =================================================

            if (
                response.status === 423
            ) {

                const serverRemaining =
                    Number(
                        data.lockRemainingSeconds ||
                        data.lockDurationSeconds ||
                        30
                    );


                // -------------------------------------------------
                // USE SERVER'S ACTUAL REMAINING TIME
                // -------------------------------------------------

                setLockSeconds(
                    Math.max(
                        0,
                        serverRemaining
                    )
                );


                setError(
                    `Too many failed login attempts. ` +
                    `This account is temporarily locked. ` +
                    `Try again in ${Math.max(
                        0,
                        serverRemaining
                    )} seconds.`
                );


                setLoading(false);

                return;
            }


            // =================================================
            // OTHER LOGIN ERRORS
            // =================================================

            if (
                !response.ok
            ) {

                setError(
                    data.message ||
                    "Unable to login."
                );


                setLoading(false);

                return;
            }


            // =================================================
            // VERIFY RESPONSE
            // =================================================

            if (
                !data.user ||
                !data.token
            ) {

                setError(
                    "The server returned an invalid login response."
                );


                setLoading(false);

                return;
            }


            // =================================================
            // ROLE CHECK
            // =================================================
            //
            // This page is specifically the Electoral Board
            // login page.
            //
            // Admin remains separate.
            // =================================================

            if (
                data.user.role !==
                "electoral_board"
            ) {

                setError(
                    "This account is not an Electoral Board account. Please use the Admin login page."
                );


                setLoading(false);

                return;
            }


            // =================================================
            // SUCCESSFUL LOGIN
            // =================================================
            //
            // Successful login means:
            //
            // failed attempts reset server-side
            // lock removed server-side
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


            // Reset frontend lock state.
            setLockSeconds(0);

            setError("");


            // =================================================
            // PASSWORD CHANGE REQUIRED
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
            // ELECTORAL BOARD DASHBOARD
            // =================================================

            navigate(
                "/electoral-board/dashboard",
                {
                    replace: true,
                }
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


    // =================================================
    // DISPLAYED ERROR
    // =================================================

    const displayedError =
        lockSeconds > 0
            ? getLockMessage()
            : error;


    // =================================================
    // RENDER
    // =================================================

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
                                Login as Electoral Board on
                                Western Institute of Technology
                                Votara platform.
                            </p>

                        </div>


                        {/* =========================================
                            ERROR / LOCK MESSAGE
                        ========================================= */}

                        {displayedError && (

                            <div
                                className="staff-login-error"
                                style={{
                                    position:
                                        "relative",
                                }}
                            >

                                {displayedError}


                                {/* =================================
                                    LIVE COUNTDOWN
                                ================================= */}

                                {lockSeconds > 0 && (

                                    <div
                                        style={{
                                            marginTop:
                                                "8px",

                                            fontWeight:
                                                700,

                                            fontSize:
                                                "13px",

                                            color:
                                                "#b42318",

                                            textAlign:
                                                "center",
                                        }}
                                    >

                                        Try again in{" "}

                                        <span
                                            style={{
                                                fontVariantNumeric:
                                                    "tabular-nums",

                                                fontWeight:
                                                    800,
                                            }}
                                        >
                                            {lockSeconds}
                                        </span>{" "}

                                        second
                                        {lockSeconds === 1
                                            ? ""
                                            : "s"}

                                    </div>

                                )}

                            </div>

                        )}


                        {/* =========================================
                            LOGIN FORM
                        ========================================= */}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="staff-login-form"
                            style={{
                                viewTransitionName:
                                    "staff-login-input-section",
                            }}
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
                                    placeholder="Email"
                                    autoComplete="email"
                                    disabled={
                                        loading ||
                                        lockSeconds > 0
                                    }
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
                                    disabled={
                                        loading ||
                                        lockSeconds > 0
                                    }
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
                                    disabled={
                                        lockSeconds > 0
                                    }
                                >

                                    {showPassword
                                        ? "ꗃ"
                                        : "🔒︎"}

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
                                    disabled={
                                        loading ||
                                        lockSeconds > 0
                                    }
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
                                    disabled={
                                        lockSeconds > 0
                                    }
                                >

                                    {showSecurityCode
                                        ? "ꗃ"
                                        : "🔒︎"}

                                </button>

                            </div>


                            {/* =================================
                                INFORMATION
                            ================================== */}

                            <p className="staff-login-info">

                                The system automatically
                                identifies you as an
                                Electoral Board member.

                            </p>


                            {/* =================================
                                LOGIN BUTTON
                            ================================== */}

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    lockSeconds > 0
                                }
                                className="staff-login-button"
                                style={{
                                    opacity:
                                        lockSeconds > 0
                                            ? 0.55
                                            : 1,

                                    cursor:
                                        lockSeconds > 0
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            >

                                {lockSeconds > 0

                                    ? `Locked — ${lockSeconds}s`

                                    : loading

                                        ? "Signing In..."

                                        : "Login"}

                            </button>


                            {/* =================================
                                LOCK STATUS
                            ================================== */}

                            {lockSeconds > 0 && (

                                <div
                                    style={{
                                        marginTop:
                                            "10px",

                                        textAlign:
                                            "center",

                                        fontSize:
                                            "11px",

                                        color:
                                            "#777",

                                        lineHeight:
                                            "1.5",
                                    }}
                                >

                                    Login will be available
                                    automatically when the
                                    30-second security lock
                                    expires.

                                </div>

                            )}

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

                            <span
                                className="logo-shape logo-one"
                            ></span>

                            <span
                                className="logo-shape logo-two"
                            ></span>

                            <span
                                className="logo-shape logo-three"
                            ></span>

                            <span
                                className="logo-shape logo-four"
                            ></span>

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
                            for BSIT students at Western
                            Institute of Technology.
                        </p>

                        <span>
                            Every vote verified, every
                            result trusted.
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
                            onClick={
                                goToAdmin
                            }
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