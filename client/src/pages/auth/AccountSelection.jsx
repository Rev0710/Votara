import { Link, useNavigate } from "react-router-dom";
import "./AccountSelection.css";

const AccountSelection = () => {
    const navigate = useNavigate();

    // =========================================================
    // GO TO SHARED STAFF LOGIN
    // =========================================================

    const handleStaffLogin = () => {
        navigate("/admin-login");
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <div className="account-selection-page">

            <div className="account-selection-container">

                {/* =================================================
                    VOTARA LOGO
                ================================================= */}

                <Link
                    to="/"
                    className="account-selection-logo"
                >
                    <span className="account-selection-logo-mark">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>

                    <span>
                        Votara
                    </span>
                </Link>


                {/* =================================================
                    ACCOUNT SELECTION
                ================================================= */}

                <div className="account-selection-content">

                    <div className="account-selection-heading">

                        <h1>
                            Staff Account Access
                        </h1>

                        <p>
                            Sign in using your staff account.
                            VOTARA will automatically identify
                            whether you are an Administrator or
                            Electoral Board member.
                        </p>

                    </div>


                    {/* =================================================
                        ADMIN / STAFF LOGIN CARD
                    ================================================= */}

                    <div
                        className="account-cards"
                        style={{
                            display: "flex",
                            justifyContent: "center"
                        }}
                    >

                        <div
                            className="account-card"
                            style={{
                                width: "100%",
                                maxWidth: "380px"
                            }}
                        >

                            <div className="account-image-container">

                                <img
                                    src="/src/images/Admin.png"
                                    alt="Administrator"
                                    className="account-image"
                                />

                            </div>


                            <div className="account-card-content">

                                <h2>
                                    Admin / Staff Login
                                </h2>

                                <p>
                                    Sign in using your personal
                                    email and password. Your login
                                    code determines whether your
                                    account is an Administrator or
                                    Electoral Board account.
                                </p>


                                {/* =================================================
                                    LOGIN BUTTON
                                ================================================= */}

                                <button
                                    type="button"
                                    onClick={
                                        handleStaffLogin
                                    }
                                    className="account-card-button"
                                >
                                    Login as Admin / Staff →
                                </button>


                                {/* =================================================
                                    ADMIN REGISTRATION
                                ================================================= */}

                                <div
                                    style={{
                                        marginTop: "18px",
                                        textAlign: "center",
                                        fontSize: "13px",
                                        color: "#667085"
                                    }}
                                >

                                    <span>
                                        Need to create an Admin
                                        account?{" "}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                "/admin/register"
                                            )
                                        }
                                        style={{
                                            border: "none",
                                            background:
                                                "transparent",
                                            color:
                                                "#1554d1",
                                            fontWeight:
                                                "700",
                                            cursor:
                                                "pointer",
                                            padding:
                                                "0",
                                            fontSize:
                                                "13px"
                                        }}
                                    >
                                        Register as Admin
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        LOGIN CODE INFORMATION
                    ================================================= */}

                    <div
                        style={{
                            maxWidth: "700px",
                            margin:
                                "24px auto 0",
                            padding:
                                "16px 20px",
                            background:
                                "#f5f8ff",
                            border:
                                "1px solid #dce7ff",
                            borderRadius:
                                "12px",
                            textAlign:
                                "center"
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    "12px",
                                fontWeight:
                                    "700",
                                color:
                                    "#266EFF",
                                marginBottom:
                                    "5px"
                            }}
                        >
                            Secure Staff Access
                        </div>

                        <p
                            style={{
                                margin:
                                    "0",
                                fontSize:
                                    "12px",
                                lineHeight:
                                    "1.6",
                                color:
                                    "#667085"
                            }}
                        >
                            VOTARA automatically identifies
                            your staff role from your account
                            and the login code you provide.
                            Electoral Board accounts are created
                            by an Administrator and cannot be
                            publicly registered.
                        </p>

                    </div>


                    {/* =================================================
                        BACK TO HOME
                    ================================================= */}

                    <Link
                        to="/"
                        className="account-selection-back"
                    >
                        ← Back to Votara
                    </Link>

                </div>

            </div>

        </div>
    );
};

export default AccountSelection;