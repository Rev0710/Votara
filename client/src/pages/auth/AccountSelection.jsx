import { Link, useNavigate } from "react-router-dom";
import "./AccountSelection.css";

const AccountSelection = () => {
    const navigate = useNavigate();

    return (
        <div className="account-selection-page">

            <div className="account-selection-card">

                {/* =========================
                    LOGO
                ========================= */}
                <Link to="/" className="account-selection-logo">

                    <span className="account-selection-logo-mark">

                        <span className="triangle triangle-top"></span>

                        <span className="circle"></span>

                        <span className="triangle triangle-bottom"></span>

                    </span>

                    <span>Votara</span>

                </Link>


                {/* =========================
                    CONTENT
                ========================= */}
                <div className="account-selection-content">

                    <div className="account-selection-heading">

                        <h1>Choose your account</h1>

                        <p>
                            Select the account type you want to log in to.
                        </p>

                    </div>


                    {/* =========================
                        ACCOUNT CARDS
                    ========================= */}
                    <div className="account-cards">

                        {/* ADMIN CARD */}
                        <div
                            className="account-card"
                            onClick={() => navigate("/admin/register")}
                        >

                            <div className="account-image-container">

                                <img
                                    src="/src/images/Admin.png"
                                    alt="Admin"
                                    className="account-image"
                                />

                            </div>

                            <div className="account-card-content">

                                <h2>Admin</h2>

                                <p>
                                    Manage the voting system, users,
                                    elections, and system settings.
                                </p>

                                <button
                                    type="button"
                                    className="account-card-button"
                                >
                                    Login as Admin →
                                </button>

                            </div>

                        </div>


                        {/* ELECTORAL BOARD CARD */}
                        <div
                            className="account-card"
                            onClick={() => navigate("/electoral-board/register")}
                        >

                            <div className="account-image-container">

                                <img
                                    src="/src/images/ElectoralBoard.png"
                                    alt="Electoral Board"
                                    className="account-image"
                                />

                            </div>

                            <div className="account-card-content">

                                <h2>Electoral Board</h2>

                                <p>
                                    Manage elections, candidates,
                                    voting activities, and results.
                                </p>

                                <button
                                    type="button"
                                    className="account-card-button"
                                >
                                    Login as Electoral Board →
                                </button>

                            </div>

                        </div>

                    </div>


                    {/* BACK TO HOME */}
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