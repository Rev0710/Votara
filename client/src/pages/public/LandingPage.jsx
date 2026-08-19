import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const LandingPage = () => {
    const navigate = useNavigate();

    const scrollToSection = (id) => {
        const section = document.getElementById(id);

        if (section) {
            section.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    // =========================
    // NAVIGATION
    // =========================

    const handleLogin = () => {
        navigate("/login");
    };

    const handleRegister = () => {
        navigate("/register");
    };

    const handleLogoClick = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <div className="votara-page">

            {/* =========================
                NAVIGATION
            ========================= */}
            <header className="votara-navbar">
                <div className="votara-container navbar-inner">

                    {/* LOGO */}
                    <button
                        className="votara-logo"
                        onClick={handleLogoClick}
                        type="button"
                    >
                        <span className="logo-mark">
                            ✓
                        </span>

                        <span>Votara</span>
                    </button>

                    {/* DESKTOP NAVIGATION */}
                    <nav
                        className="desktop-nav"
                        aria-label="Main navigation"
                    >
                        <button
                            type="button"
                            onClick={() => scrollToSection("home")}
                        >
                            Home
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollToSection("about")}
                        >
                            About
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollToSection("election")}
                        >
                            Election
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollToSection("faq")}
                        >
                            FAQ
                        </button>
                    </nav>

                    {/* ACCOUNT NAVIGATION */}
                    <div className="navbar-actions">

                        <button
                            className="nav-login"
                            onClick={handleLogin}
                            type="button"
                        >
                            Login
                        </button>

                        <button
                            className="nav-register"
                            onClick={handleRegister}
                            type="button"
                        >
                            Register Now
                        </button>

                    </div>

                </div>
            </header>


            {/* =========================
                HERO
            ========================= */}
            <main>

                <section
                    id="home"
                    className="hero-section"
                >

                    <div className="hero-decoration hero-circle-one"></div>
                    <div className="hero-decoration hero-circle-two"></div>

                    <div className="votara-container hero-grid">

                        <div className="hero-content">

                            <div className="hero-badge">
                                <span>●</span>
                                Secure digital voting for students
                            </div>

                            <h1>
                                Transparent,
                                <br />
                                secure and
                                <br />
                                <span>accessible voting.</span>
                            </h1>

                            <p>
                                VOTARA helps students participate in
                                department elections quickly, securely,
                                and conveniently without the long lines
                                and paper-based voting process.
                            </p>

                            <div className="hero-buttons">

                                <button
                                    className="primary-button"
                                    onClick={handleRegister}
                                    type="button"
                                >
                                    Register Now
                                    <span>→</span>
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={handleLogin}
                                    type="button"
                                >
                                    Login
                                </button>

                            </div>

                            <div className="hero-trust">
                                <span>✓</span>
                                Student-focused

                                <span>✓</span>
                                Secure process

                                <span>✓</span>
                                Faster verification
                            </div>

                        </div>


                        {/* =========================
                            DASHBOARD ILLUSTRATION
                        ========================= */}
                        <div className="hero-dashboard-wrapper">

                            <div className="hero-floating-circle circle-a"></div>
                            <div className="hero-floating-circle circle-b"></div>
                            <div className="hero-floating-circle circle-c"></div>

                            <div className="dashboard-card">

                                <div className="dashboard-header">

                                    <div>
                                        <span className="small-label">
                                            Election overview
                                        </span>

                                        <h3>
                                            IT Department Election
                                        </h3>
                                    </div>

                                    <span className="live-badge">
                                        ● Live
                                    </span>

                                </div>

                                <div className="dashboard-stats">

                                    <div>
                                        <strong>600</strong>
                                        <span>Registered</span>
                                    </div>

                                    <div>
                                        <strong>267</strong>
                                        <span>Voted</span>
                                    </div>

                                    <div>
                                        <strong>15</strong>
                                        <span>Hours left</span>
                                    </div>

                                </div>

                                <div className="chart-card">

                                    <div className="chart-title">
                                        <span>
                                            Election Statistics
                                        </span>

                                        <span>
                                            Today
                                        </span>
                                    </div>

                                    <div className="bar-chart">

                                        <div className="bar bar-1"></div>
                                        <div className="bar bar-2"></div>
                                        <div className="bar bar-3"></div>
                                        <div className="bar bar-4"></div>
                                        <div className="bar bar-5"></div>
                                        <div className="bar bar-6"></div>

                                    </div>

                                    <div className="chart-labels">
                                        <span>8AM</span>
                                        <span>10AM</span>
                                        <span>12PM</span>
                                        <span>2PM</span>
                                        <span>4PM</span>
                                        <span>5PM</span>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =========================
                        QUICK ACTIONS
                    ========================= */}
                    <div className="votara-container quick-actions">

                        <button
                            className="quick-card"
                            onClick={handleRegister}
                            type="button"
                        >

                            <span className="quick-number">
                                01
                            </span>

                            <div>
                                <h3>
                                    Sign up
                                </h3>

                                <p>
                                    Register your student account
                                    before election day.
                                </p>

                                <span className="quick-link">
                                    Register now →
                                </span>
                            </div>

                        </button>


                        <button
                            className="quick-card"
                            onClick={handleLogin}
                            type="button"
                        >

                            <span className="quick-number">
                                02
                            </span>

                            <div>
                                <h3>
                                    Vote
                                </h3>

                                <p>
                                    Cast your vote securely
                                    through your account.
                                </p>

                                <span className="quick-link">
                                    Login to vote →
                                </span>
                            </div>

                        </button>


                        <button
                            className="quick-card"
                            onClick={() => scrollToSection("election")}
                            type="button"
                        >

                            <span className="quick-number">
                                03
                            </span>

                            <div>
                                <h3>
                                    View results
                                </h3>

                                <p>
                                    Follow election progress and
                                    official results.
                                </p>

                                <span className="quick-link">
                                    View results →
                                </span>
                            </div>

                        </button>

                    </div>

                </section>


                {/* =========================
                    FEATURES
                ========================= */}
                <section
                    id="about"
                    className="features-section"
                >

                    <div className="votara-container">

                        <div className="section-heading">

                            <span className="section-label">
                                OUR FEATURES
                            </span>

                            <h2>
                                Everything you need
                                <br />
                                for a better election.
                            </h2>

                            <p>
                                VOTARA provides a simpler and more
                                organized way for students and the
                                Electoral Board to manage elections.
                            </p>

                        </div>


                        <div className="feature-grid">

                            <article className="feature-card">

                                <div className="feature-icon">
                                    🔒
                                </div>

                                <h3>
                                    Secured platform
                                </h3>

                                <p>
                                    Student accounts are protected
                                    through authentication and
                                    controlled access.
                                </p>

                            </article>


                            <article className="feature-card">

                                <div className="feature-icon">
                                    ✓
                                </div>

                                <h3>
                                    Vote online
                                </h3>

                                <p>
                                    Students can vote through their
                                    account without relying on paper
                                    ballots.
                                </p>

                            </article>


                            <article className="feature-card">

                                <div className="feature-icon">
                                    ▥
                                </div>

                                <h3>
                                    Real-time results
                                </h3>

                                <p>
                                    Election progress and authorized
                                    results can be monitored through
                                    the system.
                                </p>

                            </article>

                        </div>

                    </div>

                </section>


                {/* =========================
                    RESULTS SECTION
                ========================= */}
                <section
                    id="election"
                    className="results-section"
                >

                    <div className="votara-container results-grid">

                        <div className="results-chart">

                            <div className="result-chart-header">
                                <span>
                                    Live election
                                </span>

                                <span>
                                    Overview
                                </span>
                            </div>

                            <div className="large-bars">

                                <div className="large-bar height-1"></div>
                                <div className="large-bar height-2"></div>
                                <div className="large-bar height-3"></div>
                                <div className="large-bar height-4"></div>
                                <div className="large-bar height-5"></div>
                                <div className="large-bar height-6"></div>

                            </div>

                        </div>


                        <div className="results-content">

                            <span className="section-label">
                                ELECTION RESULTS
                            </span>

                            <h2>
                                View live results with
                                confidence.
                            </h2>

                            <p>
                                Monitor authorized election information
                                and voting progress through a clear and
                                organized interface.
                            </p>

                            <ul className="check-list">

                                <li>
                                    <span>✓</span>
                                    Organized election data
                                </li>

                                <li>
                                    <span>✓</span>
                                    Faster vote verification
                                </li>

                                <li>
                                    <span>✓</span>
                                    Transparent reporting
                                </li>

                            </ul>

                            <button
                                className="primary-button"
                                onClick={() => scrollToSection("election")}
                                type="button"
                            >
                                Learn more
                                <span>→</span>
                            </button>

                        </div>

                    </div>

                </section>


                {/* =========================
                    MONITORING SECTION
                ========================= */}
                <section className="monitor-section">

                    <div className="votara-container monitor-grid">

                        <div className="donut-wrapper">

                            <div className="donut-chart">

                                <div className="donut-center">
                                    <strong>68%</strong>
                                    <span>Turnout</span>
                                </div>

                            </div>

                            <div className="donut-legend">

                                <div>
                                    <span className="legend-dot blue"></span>
                                    Voted
                                </div>

                                <div>
                                    <span className="legend-dot purple"></span>
                                    Not yet voted
                                </div>

                                <div>
                                    <span className="legend-dot gray"></span>
                                    Pending
                                </div>

                            </div>

                        </div>


                        <div className="monitor-content">

                            <span className="section-label">
                                MONITOR THE VOTING PROCESS
                            </span>

                            <h2>
                                Track election progress
                                <br />
                                with clarity.
                            </h2>

                            <p>
                                The system can provide authorized users
                                with important election statistics while
                                keeping student voting information
                                protected.
                            </p>

                            <div className="mini-stat-grid">

                                <div>
                                    <strong>68%</strong>
                                    <span>Turnout</span>
                                </div>

                                <div>
                                    <strong>267</strong>
                                    <span>Votes</span>
                                </div>

                                <div>
                                    <strong>15</strong>
                                    <span>Hours</span>
                                </div>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =========================
                    FAQ
                ========================= */}
                <section
                    id="faq"
                    className="faq-section"
                >

                    <div className="votara-container">

                        <div className="section-heading">

                            <span className="section-label">
                                FAQ
                            </span>

                            <h2>
                                Frequently asked questions
                            </h2>

                            <p>
                                Learn more about the VOTARA voting
                                process.
                            </p>

                        </div>


                        <div className="faq-list">

                            <details>

                                <summary>
                                    How does VOTARA work?
                                    <span>+</span>
                                </summary>

                                <p>
                                    Students register using their official
                                    student information, verify their
                                    account, receive approval from the
                                    Electoral Board, and use their account
                                    to participate in the election.
                                </p>

                            </details>


                            <details>

                                <summary>
                                    Who can use VOTARA?
                                    <span>+</span>
                                </summary>

                                <p>
                                    VOTARA is designed for authorized
                                    students and election personnel within
                                    the department.
                                </p>

                            </details>


                            <details>

                                <summary>
                                    Is the voting process secure?
                                    <span>+</span>
                                </summary>

                                <p>
                                    The system will use authenticated
                                    student accounts and controlled
                                    Electoral Board verification.
                                </p>

                            </details>


                            <details>

                                <summary>
                                    How does registration work?
                                    <span>+</span>
                                </summary>

                                <p>
                                    Students submit their Student ID and
                                    email address, verify the OTP sent to
                                    them, and wait for Electoral Board
                                    approval and temporary password
                                    generation.
                                </p>

                            </details>


                            <details>

                                <summary>
                                    Can students vote more than once?
                                    <span>+</span>
                                </summary>

                                <p>
                                    The system is designed to record the
                                    student's voting status and prevent
                                    another voting attempt after the
                                    election process has been completed.
                                </p>

                            </details>

                        </div>

                    </div>

                </section>

            </main>


            {/* =========================
                FOOTER
            ========================= */}
            <footer className="votara-footer">

                <div className="votara-container footer-grid">

                    <div className="footer-brand">

                        <div className="votara-logo footer-logo">

                            <span className="logo-mark">
                                ✓
                            </span>

                            <span>
                                Votara
                            </span>

                        </div>

                        <p>
                            A student-focused voting platform
                            designed to make department elections
                            simpler, faster, and more organized.
                        </p>

                    </div>


                    <div className="footer-column">

                        <h4>
                            Product
                        </h4>

                        <button
                            type="button"
                            onClick={() => scrollToSection("home")}
                        >
                            Home
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollToSection("about")}
                        >
                            Features
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollToSection("election")}
                        >
                            Election
                        </button>

                    </div>


                    <div className="footer-column">

                        <h4>
                            Resources
                        </h4>

                        <button
                            type="button"
                            onClick={() => scrollToSection("faq")}
                        >
                            FAQ
                        </button>

                        <button
                            type="button"
                        >
                            Privacy
                        </button>

                        <button
                            type="button"
                        >
                            Terms
                        </button>

                    </div>


                    <div className="footer-column">

                        <h4>
                            Account
                        </h4>

                        <button
                            onClick={handleLogin}
                            type="button"
                        >
                            Login
                        </button>

                        <button
                            onClick={handleRegister}
                            type="button"
                        >
                            Register
                        </button>

                    </div>

                </div>


                <div className="votara-container footer-bottom">

                    <span>
                        © 2026 VOTARA. Department Student Election System.
                    </span>

                    <span>
                        Built for a better voting experience.
                    </span>

                </div>

            </footer>

        </div>
    );
};

export default LandingPage;