import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheckCircle,
  FiClock,
  FiShield,
  FiBarChart2,
  FiMenu,
  FiX,
  FiUsers,
  FiLock,
} from "react-icons/fi";

import "./LandingPage.css";

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="landing-page">
      {/* =========================
          NAVIGATION
      ========================== */}
      <header className="landing-navbar">
        <div className="navbar-container">
          <Link to="/" className="brand" onClick={closeMenu}>
            <div className="brand-mark">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <span className="brand-name">Votara</span>
          </Link>

          <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
            <a href="#home" onClick={closeMenu}>
              Home
            </a>

            <a href="#about" onClick={closeMenu}>
              About
            </a>

            <a href="#features" onClick={closeMenu}>
              Features
            </a>

            <a href="#how-it-works" onClick={closeMenu}>
              How It Works
            </a>

            <a href="#contact" onClick={closeMenu}>
              Contact
            </a>

            <div className="mobile-auth-buttons">
              <Link to="/login" className="nav-login" onClick={closeMenu}>
                Login
              </Link>

              <Link to="/register" className="nav-register" onClick={closeMenu}>
                Register
              </Link>
            </div>
          </nav>

          <div className="navbar-actions">
            <Link to="/login" className="nav-login">
              Login
            </Link>

            <Link to="/register" className="nav-register">
              Register
            </Link>
          </div>

          <button
            className="mobile-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>

      {/* =========================
          HERO SECTION
      ========================== */}
      <main>
        <section className="hero-section" id="home">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot"></span>
                IT Department Student Election
              </div>

              <h1>
                Your Voice.
                <br />
                <span>Your Choice.</span>
              </h1>

              <p className="hero-description">
                Votara is a secure and accessible online voting platform
                designed to make IT Department student elections faster,
                easier, and more organized.
              </p>

              <div className="hero-buttons">
                <Link to="/register" className="primary-button">
                  Register Now
                  <FiArrowRight />
                </Link>

                <a href="#how-it-works" className="secondary-button">
                  Learn More
                </a>
              </div>

              <div className="hero-trust">
                <div className="trust-item">
                  <FiShield />
                  <span>Secure Voting</span>
                </div>

                <div className="trust-item">
                  <FiClock />
                  <span>Faster Process</span>
                </div>

                <div className="trust-item">
                  <FiCheckCircle />
                  <span>Verified Students</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-card">
                <div className="hero-card-top">
                  <div>
                    <span className="small-label">IT Department</span>
                    <h3>Student Election</h3>
                  </div>

                  <div className="live-indicator">
                    <span></span>
                    Secure
                  </div>
                </div>

                <div className="mock-dashboard">
                  <div className="mock-sidebar">
                    <div className="mock-logo"></div>

                    <div className="mock-nav active"></div>
                    <div className="mock-nav"></div>
                    <div className="mock-nav"></div>
                    <div className="mock-nav"></div>
                  </div>

                  <div className="mock-content">
                    <div className="mock-heading"></div>

                    <div className="mock-stats">
                      <div className="mock-stat">
                        <span></span>
                        <strong></strong>
                      </div>

                      <div className="mock-stat">
                        <span></span>
                        <strong></strong>
                      </div>

                      <div className="mock-stat">
                        <span></span>
                        <strong></strong>
                      </div>
                    </div>

                    <div className="mock-chart">
                      <div className="chart-bar bar-one"></div>
                      <div className="chart-bar bar-two"></div>
                      <div className="chart-bar bar-three"></div>
                      <div className="chart-bar bar-four"></div>
                      <div className="chart-bar bar-five"></div>
                    </div>
                  </div>
                </div>

                <div className="floating-card floating-card-one">
                  <FiCheckCircle />
                  <div>
                    <strong>Verified</strong>
                    <span>Student Account</span>
                  </div>
                </div>

                <div className="floating-card floating-card-two">
                  <FiBarChart2 />
                  <div>
                    <strong>Election</strong>
                    <span>Progress</span>
                  </div>
                </div>
              </div>

              <div className="hero-circle circle-one"></div>
              <div className="hero-circle circle-two"></div>
            </div>
          </div>
        </section>

        {/* =========================
            QUICK INFORMATION
        ========================== */}
        <section className="quick-section">
          <div className="section-container quick-grid">
            <div className="quick-card">
              <div className="quick-icon">
                <FiUsers />
              </div>

              <div>
                <h3>For IT Students</h3>
                <p>
                  A simple voting experience designed specifically for the
                  department.
                </p>
              </div>
            </div>

            <div className="quick-card">
              <div className="quick-icon">
                <FiShield />
              </div>

              <div>
                <h3>Verified Access</h3>
                <p>
                  Student registration is verified before voting access is
                  granted.
                </p>
              </div>
            </div>

            <div className="quick-card">
              <div className="quick-icon">
                <FiBarChart2 />
              </div>

              <div>
                <h3>Organized Elections</h3>
                <p>
                  Electoral Board members can manage and verify the voting
                  process.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            ABOUT
        ========================== */}
        <section className="about-section" id="about">
          <div className="section-container about-grid">
            <div className="about-content">
              <span className="section-label">ABOUT VOTARA</span>

              <h2>
                Making student elections
                <span> simpler and more organized.</span>
              </h2>

              <p>
                Votara is an online voting system proposed for the IT
                Department. It aims to reduce long lines, manual verification,
                paper ballots, and unnecessary waiting during student
                elections.
              </p>

              <p>
                Students can register before the election, verify their
                identity, receive their temporary credentials after Electoral
                Board approval, and securely access the voting system.
              </p>

              <div className="about-list">
                <div>
                  <FiCheckCircle />
                  <span>Department-focused voting</span>
                </div>

                <div>
                  <FiCheckCircle />
                  <span>Student identity verification</span>
                </div>

                <div>
                  <FiCheckCircle />
                  <span>Digital voting workflow</span>
                </div>

                <div>
                  <FiCheckCircle />
                  <span>Electoral Board verification</span>
                </div>
              </div>
            </div>

            <div className="about-visual">
              <div className="about-panel">
                <div className="about-panel-header">
                  <div className="panel-dot"></div>
                  <span>VOTARA SYSTEM</span>
                </div>

                <div className="about-panel-content">
                  <div className="security-icon">
                    <FiShield />
                  </div>

                  <h3>Secure Student Voting</h3>

                  <p>
                    Registration, verification, voting, and election
                    administration in one platform.
                  </p>

                  <div className="security-progress">
                    <span></span>
                  </div>

                  <div className="security-status">
                    <FiCheckCircle />
                    <span>System Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            FEATURES
        ========================== */}
        <section className="features-section" id="features">
          <div className="section-container">
            <div className="section-heading">
              <span className="section-label">OUR FEATURES</span>

              <h2>
                Everything needed for a
                <span> smoother election.</span>
              </h2>

              <p>
                Votara brings the important parts of the election process
                together into one organized system.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <FiLock />
                </div>

                <h3>Secure Access</h3>

                <p>
                  Students access the system using verified credentials
                  provided through the registration process.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FiCheckCircle />
                </div>

                <h3>Student Verification</h3>

                <p>
                  Student information is verified before their account can be
                  approved for election participation.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FiClock />
                </div>

                <h3>Efficient Voting</h3>

                <p>
                  Students can vote digitally instead of waiting in long lines
                  to complete a paper ballot.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FiUsers />
                </div>

                <h3>Electoral Board Control</h3>

                <p>
                  Electoral Board members can manage registrations, verify
                  students, and monitor election activity.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FiBarChart2 />
                </div>

                <h3>Election Monitoring</h3>

                <p>
                  Authorized election personnel can monitor important election
                  information through their dashboard.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <FiShield />
                </div>

                <h3>Controlled Voting</h3>

                <p>
                  Voting access is controlled according to election rules and
                  the student's eligibility.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            HOW IT WORKS
        ========================== */}
        <section className="process-section" id="how-it-works">
          <div className="section-container">
            <div className="section-heading">
              <span className="section-label">HOW IT WORKS</span>

              <h2>
                From registration to
                <span> verified voting.</span>
              </h2>

              <p>
                The proposed Votara process is designed to reduce unnecessary
                waiting while maintaining controlled election verification.
              </p>
            </div>

            <div className="process-grid">
              <div className="process-card">
                <span className="process-number">01</span>

                <div className="process-icon">
                  <FiUsers />
                </div>

                <h3>Register</h3>

                <p>
                  The student enters their Student ID and email address to
                  begin the registration process.
                </p>
              </div>

              <div className="process-card">
                <span className="process-number">02</span>

                <div className="process-icon">
                  <FiShield />
                </div>

                <h3>Verify OTP</h3>

                <p>
                  A verification code is sent to the student's registered
                  email address.
                </p>
              </div>

              <div className="process-card">
                <span className="process-number">03</span>

                <div className="process-icon">
                  <FiCheckCircle />
                </div>

                <h3>Get Approved</h3>

                <p>
                  The Electoral Board reviews the registration before granting
                  access to the student account.
                </p>
              </div>

              <div className="process-card">
                <span className="process-number">04</span>

                <div className="process-icon">
                  <FiLock />
                </div>

                <h3>Login & Activate</h3>

                <p>
                  The student uses the temporary password, creates a new
                  password, adds a profile picture, and accepts the disclaimer.
                </p>
              </div>

              <div className="process-card">
                <span className="process-number">05</span>

                <div className="process-icon">
                  <FiBarChart2 />
                </div>

                <h3>Vote</h3>

                <p>
                  Once the election is open, the eligible student can select
                  their candidates and submit their vote.
                </p>
              </div>

              <div className="process-card">
                <span className="process-number">06</span>

                <div className="process-icon">
                  <FiCheckCircle />
                </div>

                <h3>Verification</h3>

                <p>
                  The Electoral Board verifies the student's participation
                  according to the election procedure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            ELECTION CTA
        ========================== */}
        <section className="cta-section">
          <div className="section-container">
            <div className="cta-card">
              <div className="cta-content">
                <span className="section-label">READY TO PARTICIPATE?</span>

                <h2>
                  Your vote can help shape
                  <span> your department.</span>
                </h2>

                <p>
                  Register before the election and follow the verification
                  process to prepare your account.
                </p>

                <Link to="/register" className="primary-button">
                  Register Now
                  <FiArrowRight />
                </Link>
              </div>

              <div className="cta-decoration">
                <div className="cta-circle circle-large"></div>
                <div className="cta-circle circle-medium"></div>
                <div className="cta-circle circle-small"></div>

                <FiCheckCircle className="cta-check" />
              </div>
            </div>
          </div>
        </section>

        {/* =========================
            CONTACT
        ========================== */}
        <section className="contact-section" id="contact">
          <div className="section-container contact-container">
            <div>
              <span className="section-label">CONTACT</span>

              <h2>
                Have questions about
                <span> the election?</span>
              </h2>

              <p>
                Contact the Electoral Board for registration, election
                schedules, eligibility, or other election-related concerns.
              </p>
            </div>

            <Link to="/contact" className="secondary-button dark-button">
              Contact Electoral Board
              <FiArrowRight />
            </Link>
          </div>
        </section>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="landing-footer">
        <div className="section-container footer-container">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <div className="brand-mark">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <span className="brand-name">Votara</span>
            </Link>

            <p>
              Online Voting System for the IT Department Student Election.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <h4>Navigation</h4>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
            </div>

            <div>
              <h4>Account</h4>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </div>

            <div>
              <h4>Information</h4>
              <Link to="/election-info">Election Information</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="section-container">
            <p>
              © {new Date().getFullYear()} Votara. IT Department Online Voting
              System.
            </p>

            <span>Designed for a better student election experience.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;