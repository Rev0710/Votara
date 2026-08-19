import { Link } from "react-router-dom";
import {
    FiArrowRight,
    FiCheckCircle,
    FiShield,
    FiBarChart2,
    FiClock,
    FiUsers,
    FiLock,
    FiSmartphone,
} from "react-icons/fi";

import "./LandingPage.css";

const LandingPage = () => {
    return (
        <div className="votara-page">

            {/* ================= NAVBAR ================= */}
            <header className="navbar">
                <div className="navbar-container">

                    <Link to="/" className="brand">
                        <div className="brand-icon">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>

                        <span className="brand-name">Votara</span>
                    </Link>

                    <nav className="nav-links">
                        <a href="#home">Home</a>
                        <a href="#about">About</a>
                        <a href="#features">Features</a>
                        <a href="#how-it-works">How It Works</a>
                        <a href="#faq">FAQ</a>
                    </nav>

                    <div className="nav-actions">
                        <Link to="/login" className="login-btn">
                            Login
                        </Link>

                        <Link to="/register" className="register-btn">
                            Register
                        </Link>
                    </div>

                </div>
            </header>


            {/* ================= HERO ================= */}
            <main>

                <section id="home" className="hero-section">
                    <div className="hero-container">

                        <div className="hero-content">

                            <div className="hero-badge">
                                <FiCheckCircle />
                                IT Department Online Election
                            </div>

                            <h1>
                                Transparent,
                                <br />
                                secure and
                                <br />
                                <span>accessible voting.</span>
                            </h1>

                            <p className="hero-description">
                                Votara is an online voting platform designed
                                to make IT Department elections more
                                organized, convenient, secure, and accessible
                                for every eligible student.
                            </p>

                            <div className="hero-buttons">

                                <Link
                                    to="/register"
                                    className="primary-btn"
                                >
                                    Get Started
                                    <FiArrowRight />
                                </Link>

                                <a
                                    href="#how-it-works"
                                    className="secondary-btn"
                                >
                                    Learn More
                                </a>

                            </div>

                            <div className="hero-note">
                                <FiShield />
                                Designed for secure and organized department
                                elections.
                            </div>

                        </div>


                        {/* HERO DASHBOARD PREVIEW */}
                        <div className="hero-visual">

                            <div className="dashboard-window">

                                <div className="window-header">
                                    <div className="window-dots">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>

                                    <span>Votara Dashboard</span>

                                    <div className="window-status">
                                        ● Secure
                                    </div>
                                </div>


                                <div className="dashboard-preview">

                                    <div className="preview-header">
                                        <div>
                                            <small>Student Dashboard</small>
                                            <h3>Welcome, Student!</h3>
                                        </div>

                                        <div className="profile-circle">
                                            S
                                        </div>
                                    </div>


                                    <div className="preview-cards">

                                        <div className="preview-card">
                                            <small>Election Status</small>
                                            <strong className="green">
                                                Upcoming
                                            </strong>
                                        </div>

                                        <div className="preview-card">
                                            <small>Voting Status</small>
                                            <strong>Not Voted</strong>
                                        </div>

                                        <div className="preview-card">
                                            <small>Account</small>
                                            <strong>Verified</strong>
                                        </div>

                                    </div>


                                    <div className="election-preview">

                                        <div>
                                            <small>Active Election</small>

                                            <h4>
                                                IT Department Student Election
                                            </h4>

                                            <p>
                                                Secure online voting for
                                                eligible IT students.
                                            </p>
                                        </div>

                                        <div className="mini-chart">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>

                                    </div>

                                    <div className="preview-vote-btn">
                                        Voting Access
                                    </div>

                                </div>

                            </div>


                            <div className="floating-card floating-secure">
                                <FiShield />
                                <div>
                                    <strong>Secure</strong>
                                    <small>Protected access</small>
                                </div>
                            </div>

                            <div className="floating-card floating-users">
                                <FiUsers />
                                <div>
                                    <strong>Students</strong>
                                    <small>IT Department</small>
                                </div>
                            </div>

                        </div>

                    </div>
                </section>


                {/* ================= QUICK BENEFITS ================= */}
                <section className="benefits-section">

                    <div className="benefits-container">

                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <FiClock />
                            </div>

                            <div>
                                <h3>Easy to Use</h3>
                                <p>
                                    Simple and intuitive voting process
                                    designed for students.
                                </p>
                            </div>
                        </div>


                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <FiLock />
                            </div>

                            <div>
                                <h3>Secure Access</h3>
                                <p>
                                    Student registration and login are
                                    verified before accessing the system.
                                </p>
                            </div>
                        </div>


                        <div className="benefit-card">
                            <div className="benefit-icon">
                                <FiBarChart2 />
                            </div>

                            <div>
                                <h3>Organized Elections</h3>
                                <p>
                                    Reduce long lines and improve the
                                    overall election process.
                                </p>
                            </div>
                        </div>

                    </div>

                </section>


                {/* ================= ABOUT ================= */}
                <section id="about" className="content-section">

                    <div className="section-container two-column">

                        <div className="section-text">

                            <span className="section-label">
                                ABOUT VOTARA
                            </span>

                            <h2>
                                A better way to conduct
                                <span> department elections.</span>
                            </h2>

                            <p>
                                Votara is designed specifically for the
                                Information Technology Department's student
                                elections. It aims to reduce the time students
                                spend waiting in line for manual verification
                                and paper-based voting.
                            </p>

                            <p>
                                Instead of completing the entire voting
                                process manually, students can register,
                                verify their account, receive their approved
                                login credentials, and access the election
                                through one platform.
                            </p>

                            <div className="check-list">

                                <div>
                                    <FiCheckCircle />
                                    <span>Student identity verification</span>
                                </div>

                                <div>
                                    <FiCheckCircle />
                                    <span>Electoral Board approval</span>
                                </div>

                                <div>
                                    <FiCheckCircle />
                                    <span>Secure student account access</span>
                                </div>

                                <div>
                                    <FiCheckCircle />
                                    <span>Organized digital election process</span>
                                </div>

                            </div>

                        </div>


                        <div className="about-panel">

                            <div className="panel-header">
                                <FiShield />
                                <span>Votara Security Flow</span>
                            </div>

                            <div className="security-flow">

                                <div className="flow-item">
                                    <div className="flow-number">01</div>

                                    <div>
                                        <strong>Student Registration</strong>
                                        <p>
                                            Student ID and email verification
                                        </p>
                                    </div>
                                </div>


                                <div className="flow-line"></div>


                                <div className="flow-item">
                                    <div className="flow-number">02</div>

                                    <div>
                                        <strong>OTP Verification</strong>
                                        <p>
                                            Verify the student's email
                                        </p>
                                    </div>
                                </div>


                                <div className="flow-line"></div>


                                <div className="flow-item">
                                    <div className="flow-number">03</div>

                                    <div>
                                        <strong>EB Approval</strong>
                                        <p>
                                            Electoral Board reviews registration
                                        </p>
                                    </div>
                                </div>


                                <div className="flow-line"></div>


                                <div className="flow-item">
                                    <div className="flow-number">04</div>

                                    <div>
                                        <strong>Default Password</strong>
                                        <p>
                                            System-generated account credential
                                        </p>
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ================= FEATURES ================= */}
                <section id="features" className="features-section">

                    <div className="section-container">

                        <div className="section-heading">

                            <span className="section-label">
                                OUR FEATURES
                            </span>

                            <h2>
                                Everything students need for
                                <span> a smoother election.</span>
                            </h2>

                            <p>
                                Votara focuses on making the election process
                                easier while maintaining controlled access
                                and verification.
                            </p>

                        </div>


                        <div className="features-grid">

                            <div className="feature-card">
                                <div className="feature-icon">
                                    <FiShield />
                                </div>

                                <h3>Verified Students</h3>

                                <p>
                                    Students register using their official
                                    Student ID and email address before
                                    receiving access.
                                </p>
                            </div>


                            <div className="feature-card">
                                <div className="feature-icon">
                                    <FiLock />
                                </div>

                                <h3>Controlled Login</h3>

                                <p>
                                    Only approved students can proceed to
                                    account login using their generated
                                    default password.
                                </p>
                            </div>


                            <div className="feature-card">
                                <div className="feature-icon">
                                    <FiSmartphone />
                                </div>

                                <h3>OTP Verification</h3>

                                <p>
                                    A verification code is used during
                                    registration to confirm the student's
                                    provided email.
                                </p>
                            </div>


                            <div className="feature-card">
                                <div className="feature-icon">
                                    <FiUsers />
                                </div>

                                <h3>Electoral Board Approval</h3>

                                <p>
                                    Registration requests remain pending
                                    until reviewed and approved by the
                                    Electoral Board.
                                </p>
                            </div>


                            <div className="feature-card">
                                <div className="feature-icon">
                                    <FiCheckCircle />
                                </div>

                                <h3>Profile Verification</h3>

                                <p>
                                    Students complete their profile by
                                    setting a new password and providing a
                                    profile photo.
                                </p>
                            </div>


                            <div className="feature-card">
                                <div className="feature-icon">
                                    <FiBarChart2 />
                                </div>

                                <h3>Organized Voting</h3>

                                <p>
                                    Eligible students can access the
                                    election from their student dashboard.
                                </p>
                            </div>

                        </div>

                    </div>

                </section>


                {/* ================= HOW IT WORKS ================= */}
                <section id="how-it-works" className="how-section">

                    <div className="section-container">

                        <div className="section-heading">

                            <span className="section-label">
                                HOW IT WORKS
                            </span>

                            <h2>
                                From registration to
                                <span> dashboard access.</span>
                            </h2>

                            <p>
                                Students complete a controlled verification
                                process before receiving access to their
                                Votara account.
                            </p>

                        </div>


                        <div className="timeline">

                            <div className="timeline-item">

                                <div className="timeline-number">1</div>

                                <div>
                                    <h3>Register</h3>
                                    <p>
                                        Enter your official Student ID and
                                        email address.
                                    </p>
                                </div>

                            </div>


                            <div className="timeline-item">

                                <div className="timeline-number">2</div>

                                <div>
                                    <h3>Verify OTP</h3>
                                    <p>
                                        Enter the OTP sent to your registered
                                        email address.
                                    </p>
                                </div>

                            </div>


                            <div className="timeline-item">

                                <div className="timeline-number">3</div>

                                <div>
                                    <h3>Wait for Approval</h3>
                                    <p>
                                        Your registration is reviewed by the
                                        Electoral Board.
                                    </p>
                                </div>

                            </div>


                            <div className="timeline-item">

                                <div className="timeline-number">4</div>

                                <div>
                                    <h3>Receive Default Password</h3>
                                    <p>
                                        After approval, the system generates
                                        the student's default password.
                                    </p>
                                </div>

                            </div>


                            <div className="timeline-item">

                                <div className="timeline-number">5</div>

                                <div>
                                    <h3>Login</h3>
                                    <p>
                                        Login using your Student ID and
                                        default password.
                                    </p>
                                </div>

                            </div>


                            <div className="timeline-item">

                                <div className="timeline-number">6</div>

                                <div>
                                    <h3>Complete Your Account</h3>
                                    <p>
                                        Create a new password, take or upload
                                        your profile photo, and agree to the
                                        system disclaimer.
                                    </p>
                                </div>

                            </div>


                            <div className="timeline-item">

                                <div className="timeline-number">7</div>

                                <div>
                                    <h3>Access Dashboard</h3>
                                    <p>
                                        Once all requirements are completed,
                                        the student can proceed to the
                                        dashboard.
                                    </p>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* ================= CTA ================= */}
                <section className="cta-section">

                    <div className="cta-container">

                        <div>
                            <span className="section-label">
                                READY TO START?
                            </span>

                            <h2>
                                Begin your Votara
                                registration.
                            </h2>

                            <p>
                                Register your Student ID and email to begin
                                the verification process.
                            </p>
                        </div>

                        <Link
                            to="/register"
                            className="cta-button"
                        >
                            Register Now
                            <FiArrowRight />
                        </Link>

                    </div>

                </section>


                {/* ================= FAQ ================= */}
                <section id="faq" className="faq-section">

                    <div className="section-container">

                        <div className="section-heading">

                            <span className="section-label">
                                FAQ
                            </span>

                            <h2>
                                Frequently asked
                                <span> questions.</span>
                            </h2>

                        </div>


                        <div className="faq-grid">

                            <div className="faq-card">
                                <h3>
                                    Who can register?
                                </h3>

                                <p>
                                    Eligible IT Department students whose
                                    information exists in the official
                                    student database can register.
                                </p>
                            </div>


                            <div className="faq-card">
                                <h3>
                                    Can I immediately login after registering?
                                </h3>

                                <p>
                                    No. Your registration must first be
                                    reviewed and approved by the Electoral
                                    Board.
                                </p>
                            </div>


                            <div className="faq-card">
                                <h3>
                                    How do I get my default password?
                                </h3>

                                <p>
                                    After Electoral Board approval, the
                                    system generates the student's default
                                    password according to the election
                                    system's credential process.
                                </p>
                            </div>


                            <div className="faq-card">
                                <h3>
                                    What happens after my first login?
                                </h3>

                                <p>
                                    You will be required to change your
                                    default password, provide a profile
                                    photo, and agree to the system
                                    disclaimer before accessing the
                                    dashboard.
                                </p>
                            </div>

                        </div>

                    </div>

                </section>

            </main>


            {/* ================= FOOTER ================= */}
            <footer className="footer">

                <div className="footer-container">

                    <div className="footer-brand">

                        <Link to="/" className="brand">
                            <div className="brand-icon">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>

                            <span className="brand-name">
                                Votara
                            </span>
                        </Link>

                        <p>
                            A secure and organized online voting platform
                            designed for IT Department student elections.
                        </p>

                    </div>


                    <div className="footer-links">

                        <div>
                            <h4>Platform</h4>
                            <a href="#features">Features</a>
                            <a href="#how-it-works">How It Works</a>
                            <a href="#faq">FAQ</a>
                        </div>

                        <div>
                            <h4>Account</h4>
                            <Link to="/login">Login</Link>
                            <Link to="/register">Register</Link>
                        </div>

                        <div>
                            <h4>System</h4>
                            <span>IT Department</span>
                            <span>Votara Election System</span>
                        </div>

                    </div>

                </div>


                <div className="footer-bottom">
                    <p>
                        © {new Date().getFullYear()} Votara. All rights reserved.
                    </p>

                    <p>
                        IT Department Online Voting System
                    </p>
                </div>

            </footer>

        </div>
    );
};

export default LandingPage;