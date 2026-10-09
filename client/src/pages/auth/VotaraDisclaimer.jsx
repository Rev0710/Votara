import React from "react";
import { useNavigate } from "react-router-dom";
import votaraLogo from "../../assets/images/votara-logo.png";
import "./VotaraDisclaimer.css";

const VotaraDisclaimer = () => {
    const navigate = useNavigate();

    const handleAgree = () => {
        sessionStorage.setItem("votara_disclaimer_agreed", "true");

        navigate("/registration-requirements", {
            replace: true,
        });
    };

    const handleBack = () => {
        navigate("/otp-verification");
    };

    return (
        <div className="disclaimer-page">
            <div className="disclaimer-shell">
                <header className="disclaimer-hero">
                    <button
                        type="button"
                        className="disclaimer-logo-button"
                        onClick={() => navigate("/")}
                        aria-label="Go to VOTARA home"
                    >
                        <img
                            src={votaraLogo}
                            alt="Votara"
                        />
                    </button>

                    <div className="disclaimer-hero-content">
                        <span className="disclaimer-kicker">
                            VOTARA / PLEASE REVIEW
                        </span>

                        <h1>Before you continue</h1>

                        <p>
                            Please review how this capstone voting prototype may be used.
                        </p>
                    </div>

                    <div
                        className="disclaimer-orbit"
                        aria-hidden="true"
                    >
                        <div className="disclaimer-orbit-ring ring-one"></div>
                        <div className="disclaimer-orbit-ring ring-two"></div>
                        <div className="disclaimer-orbit-ring ring-three"></div>

                        <div className="disclaimer-orbit-core">
                            <img
                                src={votaraLogo}
                                alt=""
                            />
                        </div>

                        <span className="disclaimer-orbit-dot dot-one">
                            ✓
                        </span>

                        <span className="disclaimer-orbit-dot dot-two">
                            ▣
                        </span>
                    </div>
                </header>

                <main className="disclaimer-card">
                    <span className="disclaimer-card-kicker">
                        ACADEMIC PROTOTYPE / DISCLAIMER
                    </span>

                    <h2>Votara app disclaimer</h2>

                    <p className="disclaimer-intro">
                        Votara is a student-developed app as part of an academic
                        capstone project for the Bachelor of Science in Information
                        Technology (BSIT) program at Western Institute of Technology
                        (WIT). It is intended for educational and demonstration
                        purposes.
                    </p>

                    <section className="disclaimer-list">
                        <article className="disclaimer-item">
                            <span className="disclaimer-number">01</span>
                            <div>
                                <h3>Not an Official Institutional System</h3>
                                <p>
                                    Votara is a student-developed prototype and is not
                                    an officially sanctioned voting system of Western
                                    Institute of Technology unless formally adopted and
                                    authorized by the school administration or Student
                                    Supreme Council. Any election conducted using this
                                    app is subject to the approval and oversight of the
                                    relevant student organization or department.
                                </p>
                            </div>
                        </article>

                        <article className="disclaimer-item">
                            <span className="disclaimer-number">02</span>
                            <div>
                                <h3>Data Privacy</h3>
                                <p>
                                    Votara uses your student ID, registration details,
                                    and ballot to run and verify the election. Your
                                    individual selections are private from other
                                    students. Election officials verify the process,
                                    and results are shared according to election rules.
                                    This prototype is for academic use.
                                </p>
                            </div>
                        </article>

                        <article className="disclaimer-item">
                            <span className="disclaimer-number">03</span>
                            <div>
                                <h3>No Guarantee of Uninterrupted Service</h3>
                                <p>
                                    As a student-built application, Votara may
                                    experience bugs, downtime, or technical
                                    limitations. The developers do not guarantee
                                    uninterrupted or error-free operation and are not
                                    liable for any loss, damage, or inconvenience
                                    resulting from technical issues.
                                </p>
                            </div>
                        </article>

                        <article className="disclaimer-item">
                            <span className="disclaimer-number">04</span>
                            <div>
                                <h3>Election Integrity</h3>
                                <p>
                                    While Votara is designed with security and fairness
                                    in mind, it has not undergone the level of security
                                    auditing required for legally binding official or
                                    government-recognized elections. Results generated
                                    through this app should be treated as advisory
                                    unless independently verified by the organization
                                    conducting the election.
                                </p>
                            </div>
                        </article>

                        <article className="disclaimer-item">
                            <span className="disclaimer-number">05</span>
                            <div>
                                <h3>Limitation of Liability</h3>
                                <p>
                                    The developers of Votara (the student project team)
                                    shall not be held liable for any disputes, damages,
                                    or consequences arising from the use of this
                                    application, including but not limited to election
                                    outcomes, data loss, or misuse of the platform.
                                </p>
                            </div>
                        </article>

                        <article className="disclaimer-item">
                            <span className="disclaimer-number">06</span>
                            <div>
                                <h3>Intended Use</h3>
                                <p>
                                    This application is intended solely for use within
                                    the BSIT department/WIT student community for the
                                    purposes outlined by its developers as part of a
                                    capstone requirement, and is not licensed or
                                    intended for commercial deployment.
                                </p>
                            </div>
                        </article>
                    </section>

                    <p className="disclaimer-confirmation">
                        By selecting "I agree", you confirm that you have read this
                        disclaimer.
                    </p>

                    <div className="disclaimer-actions">
                        <button
                            type="button"
                            className="disclaimer-back-button"
                            onClick={handleBack}
                        >
                            Go back
                        </button>

                        <button
                            type="button"
                            className="disclaimer-agree-button"
                            onClick={handleAgree}
                        >
                            I agree and continue
                        </button>
                    </div>
                </main>

                <footer className="disclaimer-footer">
                    © 2026 Q&A Team · Votara
                </footer>
            </div>
        </div>
    );
};

export default VotaraDisclaimer;
