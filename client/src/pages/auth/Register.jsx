import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();

        // OTP functionality will be connected later.
        navigate("/otp");
    };

    return (
        <div className="register-page">

            <div className="register-card">

                {/* =========================
                    LEFT SIDE
                ========================= */}
                <section className="register-left">

                    <Link to="/" className="register-logo">
                        <span className="register-logo-mark">
                            <span className="triangle triangle-top"></span>
                            <span className="circle"></span>
                            <span className="triangle triangle-bottom"></span>
                        </span>

                        <span>Votara</span>
                    </Link>

                    <div className="register-visual">

                        <div className="visual-circle visual-circle-one"></div>
                        <div className="visual-circle visual-circle-two"></div>

                        <div className="visual-content">
                            <span className="visual-line"></span>
                            <span className="visual-line"></span>
                            <span className="visual-line"></span>
                        </div>

                    </div>

                </section>


                {/* =========================
                    RIGHT SIDE
                ========================= */}
                <section className="register-right">

                    <div className="register-content">

                        <div className="register-heading">

                            <h1>
                                Welcome!
                            </h1>

                            <p>
                                Register as a voter on the Western Institute
                                of Technology voting platform to vote in your
                                preferred candidate.
                            </p>

                        </div>


                        {/* =========================
                            REGISTRATION FORM
                        ========================= */}
                        <form
                            className="register-form"
                            onSubmit={handleSubmit}
                        >

                            <div className="form-group">

                                <label htmlFor="studentId">
                                    Student ID No.
                                </label>

                                <input
                                    id="studentId"
                                    type="text"
                                    placeholder="Enter your Student ID"
                                    required
                                />

                            </div>


                            <div className="form-group">

                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email address"
                                    required
                                />

                            </div>


                            <button
                                type="submit"
                                className="register-submit"
                            >
                                Sign up
                            </button>

                        </form>


                        <Link
                            to="/admin/register"
                            className="admin-link"
                        >
                            Sign up as Admin
                        </Link>


                        <Link
                            to="/"
                            className="back-link"
                        >
                            ← Back to Votara
                        </Link>

                    </div>

                </section>

            </div>

        </div>
    );
};

export default Register;