import React, { useState } from "react";
import votaraLogo from "../../assets/images/votara-logo.png";
import votaraOrbit from "../../assets/images/votara-orbit.png";

import { Link, useNavigate } from "react-router-dom";

import "./AccountSelection.css";

import api from "../../services/api";




const AccountSelection = () => {

    const navigate = useNavigate();



    // admin | eb | register

    const [activeView, setActiveView] = useState("admin");



    const [formData, setFormData] = useState({

        email: "",

        password: "",

        securityCode: "",

    });

    const [showPassword, setShowPassword] = useState(false);

    const [showSecurityCode, setShowSecurityCode] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const [success, setSuccess] = useState("");



    const [ebFormData, setEbFormData] = useState({

        email: "",

        password: "",

    });

    const [showEbPassword, setShowEbPassword] = useState(false);

    const [ebLoading, setEbLoading] = useState(false);

    const [ebError, setEbError] = useState("");

    const [ebSuccess, setEbSuccess] = useState("");



    const [registerForm, setRegisterForm] = useState({

        fullName: "",

        email: "",

        password: "",

        confirmPassword: "",

        registrationCode: "",

        profilePhoto: null,

    });

    const [showRegisterPassword, setShowRegisterPassword] = useState(false);

    const [showRegisterConfirm, setShowRegisterConfirm] = useState(false);

    const [registerLoading, setRegisterLoading] = useState(false);

    const [registerError, setRegisterError] = useState("");

    const [registerSuccess, setRegisterSuccess] = useState("");

    const [photoPreview, setPhotoPreview] = useState("");



    const clearMessages = () => {

        setError("");

        setSuccess("");

        setEbError("");

        setEbSuccess("");

        setRegisterError("");

        setRegisterSuccess("");

    };



    const goToElectoralBoard = () => {

        clearMessages();

        setActiveView("eb");

    };



    const goToAdminLogin = () => {

        clearMessages();

        setActiveView("admin");

    };



    const goToAdminRegister = () => {

        clearMessages();

        setActiveView("register");

    };



    const handleChange = (event) => {

        const { name, value } = event.target;

        setFormData((previous) => ({

            ...previous,

            [name]: value,

        }));

        setError("");

    };



    const handleEbChange = (event) => {

        const { name, value } = event.target;

        setEbFormData((previous) => ({

            ...previous,

            [name]: value,

        }));

        setEbError("");

        setEbSuccess("");

    };



    const handleRegisterChange = (event) => {

        const { name, value } = event.target;

        setRegisterForm((previous) => ({

            ...previous,

            [name]: value,

        }));

        setRegisterError("");

        setRegisterSuccess("");

    };



    const handlePhotoChange = (event) => {

        const file = event.target.files?.[0];

        if (!file) return;



        if (!file.type.startsWith("image/")) {

            setRegisterError("Please select a valid image file.");

            return;

        }



        if (file.size > 5 * 1024 * 1024) {

            setRegisterError("Profile photo must be 5 MB or smaller.");

            return;

        }



        setRegisterForm((previous) => ({

            ...previous,

            profilePhoto: file,

        }));

        setPhotoPreview(URL.createObjectURL(file));

        setRegisterError("");

    };
const handleAdminLogin = async (event) => {

        event.preventDefault();

        setError("");



        if (!formData.email.trim() || !formData.password || !formData.securityCode.trim()) {

            setError("Please enter your email, password, and security code.");

            return;

        }



        try {

            setLoading(true);



            const response = await api.post("/staff-auth/login", {

                email: formData.email.trim().toLowerCase(),

                password: formData.password,

                securityCode: formData.securityCode.trim(),

            });



            const data = response.data;



            if (!data?.user || !data?.token) {

                setError("Invalid login response from the VOTARA server.");

                return;

            }



            if (data.user.role !== "admin") {

                setError("This account is not an Administrator account. Please use the Electoral Board login panel.");

                return;

            }



            localStorage.setItem("votaraAdminToken", data.token);

            localStorage.setItem("votaraAdminUser", JSON.stringify(data.user));



            if (data.user.mustChangePassword) {

                navigate("/staff-change-password", { replace: true });

                return;

            }



            navigate("/admin-dashboard", { replace: true });

        } catch (requestError) {

            console.error("Admin login error:", requestError);

            setError(

                requestError.response?.data?.message ||

                "Unable to connect to the VOTARA server. Please check your internet connection or try again."

            );

        } finally {

            setLoading(false);

        }

    };



    const handleEbLogin = async (event) => {

        event.preventDefault();

        setEbError("");

        setEbSuccess("");



        if (!ebFormData.email.trim() || !ebFormData.password) {

            setEbError("Please enter your email and password.");

            return;

        }



        try {

            setEbLoading(true);



            const response = await api.post("/eb-auth/login", {

                email: ebFormData.email.trim().toLowerCase(),

                password: ebFormData.password,

            });



            const data = response.data;



            if (!data?.user || !data?.token) {

                setEbError("Invalid login response from the VOTARA server.");

                return;

            }



            if (data.user.role !== "electoral_board") {

                setEbError("This account is not an Electoral Board account. Please use the Admin login panel.");

                return;

            }



            localStorage.setItem("votaraEBToken", data.token);

            localStorage.setItem("votaraEBUser", JSON.stringify(data.user));



            setEbSuccess("Login successful. Redirecting to your dashboard...");



            window.setTimeout(() => {

                navigate("/electoral-board/dashboard", { replace: true });

            }, 500);

        } catch (requestError) {

            console.error("EB login error:", requestError);

            setEbError(

                requestError.response?.data?.message ||

                requestError.message ||

                "Unable to login. Please try again."

            );

        } finally {

            setEbLoading(false);

        }

    };



    const handleAdminRegister = async (event) => {

        event.preventDefault();

        setRegisterError("");

        setRegisterSuccess("");



        if (

            !registerForm.fullName.trim() ||

            !registerForm.email.trim() ||

            !registerForm.password ||

            !registerForm.confirmPassword ||

            !registerForm.registrationCode

        ) {

            setRegisterError("Please complete all required fields.");

            return;

        }



        if (registerForm.password !== registerForm.confirmPassword) {

            setRegisterError("Passwords do not match.");

            return;

        }



        if (registerForm.password.length < 8) {

            setRegisterError("Password must be at least 8 characters.");

            return;

        }



        if (!/[A-Z]/.test(registerForm.password)) {

            setRegisterError("Password must contain at least one uppercase letter.");

            return;

        }



        if (!/[a-z]/.test(registerForm.password)) {

            setRegisterError("Password must contain at least one lowercase letter.");

            return;

        }



        if (!/[0-9]/.test(registerForm.password)) {

            setRegisterError("Password must contain at least one number.");

            return;

        }



        if (!/[^A-Za-z0-9]/.test(registerForm.password)) {

            setRegisterError("Password must contain at least one special character.");

            return;

        }



        try {

            setRegisterLoading(true);



            // The current VOTARA admin registration endpoint accepts the

            // account fields below. Profile photo is kept as a UI preview

            // because the current endpoint does not accept a photo field.

            const response = await api.post("/admin/register", {

                fullName: registerForm.fullName.trim(),

                email: registerForm.email.trim().toLowerCase(),

                password: registerForm.password,

                confirmPassword: registerForm.confirmPassword,

                registrationCode: registerForm.registrationCode.trim(),

            });



            const data = response.data;



            setRegisterSuccess(

                data?.message || "Administrator account created successfully."

            );



            window.setTimeout(() => {

                setActiveView("admin");

                setRegisterSuccess("");

                setFormData({

                    email: registerForm.email.trim().toLowerCase(),

                    password: "",

                    securityCode: "",

                });

            }, 900);

        } catch (requestError) {

            console.error("Admin registration error:", requestError);

            setRegisterError(

                requestError.response?.data?.message ||

                requestError.message ||

                "Unable to create the administrator account. Please try again."

            );

        } finally {

            setRegisterLoading(false);

        }

    };



    const isEb = activeView === "eb";

    const isRegister = activeView === "register";



    return (

        <div className="account-selection-page">

            <div

                className={`account-selection-card ${

                    isEb ? "is-eb-active" : "is-admin-side"

                } ${isRegister ? "is-register-active" : ""}`}

            >

                {/* =====================================================

                    VOTARA BRANDING PANEL

                    This is the glass-door panel. For EB login it slides

                    from the left to the right side of the same card.

                ===================================================== */}

                <section className="account-selection-brand-panel">

                    <Link to="/" className="account-selection-logo" aria-label="Votara home">
                        <img
                            src={votaraLogo}
                            alt="Votara"
                            className="account-selection-logo-image"
                        />
                    </Link>



                    <div className="account-selection-message">
                        <span className="brand-eyebrow">VOTARA &nbsp;/&nbsp; {isEb ? "ELECTORAL BOARD ACCESS" : "ADMIN ACCESS"}</span>
                        <h2>
                            {isEb ? (
                                <>Every voter.<br />Verified.</>
                            ) : (
                                <>Run a trusted<br />election.</>
                            )}
                        </h2>
                        <p>
                            {isEb
                                ? "Review registration requests, verify identities, and monitor election activity."
                                : "Manage election settings, staff access, and results from one secure workspace."}
                        </p>

                        <div className="brand-feature-list">
                            <div><span>01</span>{isEb ? "Review registration requests" : "Manage elections and roles"}</div>
                            <div><span>02</span>{isEb ? "Verify students and voters" : "Review activity and results"}</div>
                        </div>
                    </div>



                    <div className="account-selection-brand-visual">
                        <img
                            src={votaraOrbit}
                            alt="Secure Votara election network"
                            className="account-selection-orbit"
                        />
                    </div>

                    <div className="account-selection-electoral-box">

                        <p>{isEb ? "Need to return to Admin?" : "Not an Admin member?"}</p>

                        <button

                            type="button"

                            onClick={isEb ? goToAdminLogin : goToElectoralBoard}

                        >

                            {isEb ? "BACK TO ADMIN LOGIN" : "LOGIN AS ELECTORAL BOARD"}

                        </button>

                    </div>

                </section>



                {/* =====================================================

                    ADMIN / EB / REGISTRATION CONTENT

                ===================================================== */}

                <section className="account-selection-content-stage">

                    {/* ADMIN LOGIN */}

                    <div

                        className={`account-login-panel account-login-panel-admin ${

                            activeView === "admin" ? "panel-active" : "panel-hidden"

                        }`}

                    >

                        <Link to="/register" className="account-selection-back">

                            ← back

                        </Link>



                        <div className="account-selection-form-container">

                            <h1>Admin Login!</h1>

                            <p className="account-selection-subtitle">

                                Login as Admin on Western Institute of Technology Votara platform.

                            </p>



                            {error && (

                                <div className="account-selection-error">{error}</div>

                            )}



                            <form onSubmit={handleAdminLogin} className="account-selection-form">

                                <div className="account-selection-field">

                                    <input

                                        type="email"

                                        name="email"

                                        value={formData.email}

                                        onChange={handleChange}

                                        placeholder="Email"

                                        autoComplete="email"

                                        disabled={loading}

                                    />

                                </div>



                                <div className="account-selection-field">

                                    <input

                                        type={showPassword ? "text" : "password"}

                                        name="password"

                                        value={formData.password}

                                        onChange={handleChange}

                                        placeholder="Password"

                                        autoComplete="current-password"

                                        disabled={loading}

                                    />

                                    <button

                                        type="button"

                                        className="account-selection-show"

                                        onClick={() => setShowPassword((previous) => !previous)}

                                        aria-label={showPassword ? "Hide password" : "Show password"}

                                    >

                                        {showPassword ? "◉" : "🔒"}

                                    </button>

                                </div>



                                <div className="account-selection-field">

                                    <input

                                        type={showSecurityCode ? "text" : "password"}

                                        name="securityCode"

                                        value={formData.securityCode}

                                        onChange={handleChange}

                                        placeholder="Login Code"

                                        autoComplete="off"

                                        disabled={loading}

                                    />

                                    <button

                                        type="button"

                                        className="account-selection-show"

                                        onClick={() => setShowSecurityCode((previous) => !previous)}

                                        aria-label={showSecurityCode ? "Hide login code" : "Show login code"}

                                    >

                                        {showSecurityCode ? "◉" : "🔒"}

                                    </button>

                                </div>



                                <p className="admin-login-info">

                                    The system automatically identifies you are Admin member.

                                </p>



                                <button

                                    type="submit"

                                    className="account-selection-login-button"

                                    disabled={loading}

                                >

                                    {loading ? "Logging in..." : "Login"}

                                </button>

                            </form>



                            <div className="account-selection-register">

                                <span>Need to create an Admin account?</span>{" "}

                                <button

                                    type="button"

                                    onClick={goToAdminRegister}

                                    className="account-selection-inline-link"

                                >

                                    Register as Admin

                                </button>

                            </div>

                        </div>

                    </div>



                    {/* EB LOGIN */}

                    <div

                        className={`account-login-panel account-login-panel-eb ${

                            activeView === "eb" ? "panel-active" : "panel-hidden"

                        }`}

                    >

                        <button

                            type="button"

                            className="account-selection-back account-selection-panel-back"

                            onClick={goToAdminLogin}

                        >

                            ← back to Admin Login

                        </button>



                        <div className="account-selection-form-container">

                            <h1>Electoral Board Login</h1>

                            <p className="account-selection-subtitle">

                                Sign in using the personal email and password associated with your EB account.

                            </p>



                            {ebError && (

                                <div className="account-selection-error">{ebError}</div>

                            )}



                            {ebSuccess && (

                                <div className="account-selection-success">{ebSuccess}</div>

                            )}



                            <form onSubmit={handleEbLogin} className="account-selection-form">

                                <div className="account-selection-field">

                                    <label className="account-selection-label" htmlFor="eb-email">

                                        Personal Email

                                    </label>

                                    <input

                                        id="eb-email"

                                        type="email"

                                        name="email"

                                        value={ebFormData.email}

                                        onChange={handleEbChange}

                                        placeholder="example@gmail.com"

                                        autoComplete="email"

                                        disabled={ebLoading}

                                    />

                                </div>



                                <div className="account-selection-field">

                                    <label className="account-selection-label" htmlFor="eb-password">

                                        Password

                                    </label>

                                    <div className="account-selection-password-wrap">

                                        <input

                                            id="eb-password"

                                            type={showEbPassword ? "text" : "password"}

                                            name="password"

                                            value={ebFormData.password}

                                            onChange={handleEbChange}

                                            placeholder="Enter your password"

                                            autoComplete="current-password"

                                            disabled={ebLoading}

                                        />

                                        <button

                                            type="button"

                                            className="account-selection-eb-show"

                                            onClick={() => setShowEbPassword((previous) => !previous)}

                                        >

                                            {showEbPassword ? "Hide" : "Show"}

                                        </button>

                                    </div>

                                </div>



                                <button

                                    type="submit"

                                    className="account-selection-login-button account-selection-eb-login-button"

                                    disabled={ebLoading}

                                >

                                    {ebLoading ? "Logging in..." : "Login as Electoral Board →"}

                                </button>

                            </form>

                        </div>

                    </div>



                    {/* ADMIN REGISTRATION */}

                    <div

                        className={`account-login-panel account-login-panel-register ${

                            activeView === "register" ? "panel-active" : "panel-hidden"

                        }`}

                    >

                        <button

                            type="button"

                            className="account-selection-back account-selection-panel-back"

                            onClick={goToAdminLogin}

                        >

                            ← Back to Account Selection

                        </button>



                        <div className="account-selection-form-container account-selection-register-container">

                            <div className="admin-register-icon" aria-hidden="true">⚙</div>

                            <h1>Admin Registration</h1>

                            <p className="account-selection-subtitle">

                                Create the initial VOTARA administrator account.

                            </p>



                            {registerError && (

                                <div className="account-selection-error">{registerError}</div>

                            )}



                            {registerSuccess && (

                                <div className="account-selection-success">{registerSuccess}</div>

                            )}



                            <form onSubmit={handleAdminRegister} className="account-selection-form account-register-form">

                                <div className="account-selection-field register-field">

                                    <label className="account-selection-label" htmlFor="admin-register-full-name">

                                        Full Name

                                    </label>

                                    <input

                                        id="admin-register-full-name"

                                        type="text"

                                        name="fullName"

                                        value={registerForm.fullName}

                                        onChange={handleRegisterChange}

                                        placeholder="Enter full name"

                                        autoComplete="name"

                                        disabled={registerLoading}

                                        required

                                    />

                                </div>



                                <div className="account-selection-field register-field">

                                    <label className="account-selection-label" htmlFor="admin-register-email">

                                        Email Address

                                    </label>

                                    <input

                                        id="admin-register-email"

                                        type="email"

                                        name="email"

                                        value={registerForm.email}

                                        onChange={handleRegisterChange}

                                        placeholder="Enter admin email"

                                        autoComplete="email"

                                        disabled={registerLoading}

                                        required

                                    />

                                </div>



                                <div className="account-selection-field register-field">

                                    <label className="account-selection-label" htmlFor="admin-register-password">

                                        Password

                                    </label>

                                    <div className="account-selection-password-wrap">

                                        <input

                                            id="admin-register-password"

                                            type={showRegisterPassword ? "text" : "password"}

                                            name="password"

                                            value={registerForm.password}

                                            onChange={handleRegisterChange}

                                            placeholder="Create password"

                                            autoComplete="new-password"

                                            disabled={registerLoading}

                                            required

                                        />

                                        <button

                                            type="button"

                                            className="account-selection-register-show"

                                            onClick={() => setShowRegisterPassword((previous) => !previous)}

                                        >

                                            {showRegisterPassword ? "Hide" : "Show"}

                                        </button>

                                    </div>

                                </div>



                                <div className="password-requirements">

                                    <strong>Password Requirements</strong>

                                    <span className={registerForm.password.length >= 8 ? "valid" : ""}>◌ At least 8 characters</span>

                                    <span className={/[A-Z]/.test(registerForm.password) ? "valid" : ""}>◌ One uppercase letter</span>

                                    <span className={/[a-z]/.test(registerForm.password) ? "valid" : ""}>◌ One lowercase letter</span>

                                    <span className={/[0-9]/.test(registerForm.password) ? "valid" : ""}>◌ One number</span>

                                    <span className={/[^A-Za-z0-9]/.test(registerForm.password) ? "valid" : ""}>◌ One special character</span>

                                </div>



                                <div className="account-selection-field register-field">

                                    <label className="account-selection-label" htmlFor="admin-register-confirm">

                                        Confirm Password

                                    </label>

                                    <div className="account-selection-password-wrap">

                                        <input

                                            id="admin-register-confirm"

                                            type={showRegisterConfirm ? "text" : "password"}

                                            name="confirmPassword"

                                            value={registerForm.confirmPassword}

                                            onChange={handleRegisterChange}

                                            placeholder="Confirm password"

                                            autoComplete="new-password"

                                            disabled={registerLoading}

                                            required

                                        />

                                        <button

                                            type="button"

                                            className="account-selection-register-show"

                                            onClick={() => setShowRegisterConfirm((previous) => !previous)}

                                        >

                                            {showRegisterConfirm ? "Hide" : "Show"}

                                        </button>

                                    </div>

                                </div>



                                <div className="account-selection-field register-field">

                                    <label className="account-selection-label">Profile Photo</label>

                                    <div className="profile-photo-actions">

<label className="profile-photo-upload-button">

                                            📁 Upload Photo

                                            <input

                                                type="file"

                                                accept="image/*"

                                                onChange={handlePhotoChange}

                                                disabled={registerLoading}

                                            />

                                        </label>

                                    </div>
{photoPreview && (

                                        <div className="profile-photo-preview-wrap">

                                            <img src={photoPreview} alt="Selected profile preview" />

                                            <span>Photo selected</span>

                                        </div>

                                    )}

                                </div>



                                <div className="account-selection-field register-field">

                                    <label className="account-selection-label" htmlFor="admin-register-code">

                                        Admin Registration Code

                                    </label>

                                    <input

                                        id="admin-register-code"

                                        type="password"

                                        name="registrationCode"

                                        value={registerForm.registrationCode}

                                        onChange={handleRegisterChange}

                                        placeholder="Enter Admin Registration Code"

                                        autoComplete="off"

                                        disabled={registerLoading}

                                        required

                                    />

                                    <p className="registration-code-note">

                                        This code is required to create the initial Admin account.

                                    </p>

                                </div>



                                <button

                                    type="submit"

                                    className="account-selection-login-button admin-register-submit"

                                    disabled={registerLoading}

                                >

                                    {registerLoading ? "Creating Admin Account..." : "Create Admin Account"}

                                </button>

                            </form>



                            <div className="account-selection-register admin-register-footer">

                                <span>Already have an Admin account?</span>{" "}

                                <button

                                    type="button"

                                    className="account-selection-inline-link"

                                    onClick={goToAdminLogin}

                                >

                                    Admin Login

                                </button>

                            </div>

                        </div>

                    </div>

                </section>

            </div>

        </div>

    );

};



export default AccountSelection;
