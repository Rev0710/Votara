import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck, FiChevronDown, FiLock, FiMenu, FiShield, FiX } from "react-icons/fi";
import votaraLogo from "../../assets/images/votara-logo.png";
import "./LandingPage.css";

const STEPS = [
    {
        number: "01",
        title: "Sign up",
        text: "Create your Votara account and verify your student ID.",
        tone: "blue",
    },
    {
        number: "02",
        title: "Vote",
        text: "Review candidates, choose your preferred options and submit securely.",
        tone: "navy",
    },
    {
        number: "03",
        title: "View result",
        text: "Track election outcomes and candidate scores as results become available.",
        tone: "blue",
    },
];

const FAQS = [
    {
        question: "Who can vote in VOTARA?",
        answer: "Eligible students in the IT Department can vote when an election is open and their account is verified and eligible for that election.",
    },
    {
        question: "How do I register?",
        answer: "Start from the VOTARA registration page, provide the required student information, verify the registration OTP, and complete the account setup steps required by the system.",
    },
    {
        question: "Is my vote private?",
        answer: "VOTARA is designed to verify voter eligibility while keeping the selected ballot separate from the student's identity in the voting record.",
    },
    {
        question: "What happens if I am a late enrollee?",
        answer: "Late-enrollee requests can be reviewed by the Electoral Board. Approved students can continue through the applicable VOTARA registration and voting flow.",
    },
];

function WordReveal({ children, className = "" }) {
    const ref = useRef(null);

    useEffect(() => {
        const element = ref.current;
        if (!element) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                element.classList.toggle("is-visible", entry.isIntersecting);
            },
            { threshold: 0.14, rootMargin: "-6% 0px -6% 0px" }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    const words = String(children).trim().split(/\s+/);

    return (
        <span ref={ref} className={`word-reveal ${className}`} aria-label={String(children)}>
            {words.map((word, index) => (
                <span className="word-reveal-word" key={`${word}-${index}`}>
                    <span>{word}</span>
                </span>
            ))}
        </span>
    );
}

function DashboardMockup({ variant = "vote" }) {
    if (variant === "result") {
        return (
            <div className="mock-window mock-result-window" aria-hidden="true">
                <div className="mock-topbar">
                    <span className="mock-brand"><span className="mock-brand-mark">✦</span> Votara</span>
                    <span className="mock-search" />
                    <span className="mock-dots">•••</span>
                </div>
                <div className="mock-body result-body">
                    <aside className="mock-sidebar">
                        <div className="mock-avatar">A</div>
                        <strong>Arthur Morgan</strong>
                        <span>Student</span>
                        <div className="mock-side-active">Results</div>
                        <div>Dashboard</div>
                        <div>My Vote</div>
                        <div>Settings</div>
                    </aside>
                    <main className="mock-main">
                        <div className="mock-kicker">ELECTION RESULTS</div>
                        <h4>Student Council Election</h4>
                        <div className="result-grid">
                            <div className="result-card">
                                <div className="result-card-head"><span>President</span><b>Live</b></div>
                                <div className="result-row"><span>Felisha</span><i><em style={{ width: "78%" }} /></i><strong>78%</strong></div>
                                <div className="result-row"><span>Roberto</span><i><em style={{ width: "54%" }} /></i><strong>54%</strong></div>
                                <div className="result-row"><span>Mary</span><i><em style={{ width: "38%" }} /></i><strong>38%</strong></div>
                            </div>
                            <div className="result-stat-card"><span>Total votes</span><strong>1,207</strong><small>+12.8% turnout</small></div>
                        </div>
                        <div className="mock-result-chart">
                            <span style={{ height: "42%" }} /><span style={{ height: "68%" }} /><span style={{ height: "54%" }} /><span style={{ height: "82%" }} /><span style={{ height: "62%" }} /><span style={{ height: "92%" }} />
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    return (
        <div className="mock-window" aria-hidden="true">
            <div className="mock-topbar">
                <span className="mock-brand"><span className="mock-brand-mark">✦</span> Votara</span>
                <span className="mock-search" />
                <span className="mock-dots">◌ ◌ ●</span>
            </div>
            <div className="mock-body">
                <aside className="mock-sidebar">
                    <div className="mock-avatar">A</div>
                    <strong>Arthur Morgan</strong>
                    <span>Student</span>
                    <div className="mock-side-active">Vote</div>
                    <div>Dashboard</div>
                    <div>Votes</div>
                    <div>Settings</div>
                    <div className="mock-logout">Log out</div>
                </aside>
                <main className="mock-main">
                    <div className="mock-kicker">YOU MAY NOW CAST YOUR VOTES!</div>
                    <h4>President Student Council</h4>
                    <p className="mock-subtitle">You can only vote once for each position.</p>
                    <div className="candidate-grid">
                        {["Felisha", "Roberto", "Mary"].map((name) => (
                            <div className="candidate-card" key={name}>
                                <strong>{name}</strong>
                                <div className="candidate-photo">{name.charAt(0)}</div>
                                <div className="candidate-actions"><button>VOTE</button><span>View details</span></div>
                            </div>
                        ))}
                    </div>
                    <h4 className="second-position">Vice President Student Council</h4>
                    <div className="candidate-grid">
                        {["Felisha", "Roberto", "Mary"].map((name) => (
                            <div className="candidate-card" key={`vp-${name}`}>
                                <strong>{name}</strong>
                                <div className="candidate-photo">{name.charAt(0)}</div>
                                <div className="candidate-actions"><button>VOTE</button><span>View details</span></div>
                            </div>
                        ))}
                    </div>
                    <div className="mock-submit">SUBMIT VOTE</div>
                </main>
            </div>
        </div>
    );
}

function LandingPage() {
    const navigate = useNavigate();
    const howRef = useRef(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(null);
    const [howProgress, setHowProgress] = useState(0);
    const [heroDrag, setHeroDrag] = useState({ x: 0, y: 0 });
    const heroDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

    const handleHeroPointerDown = (event) => {
        event.currentTarget.setPointerCapture?.(event.pointerId);
        heroDragRef.current = {
            active: true,
            startX: event.clientX,
            startY: event.clientY,
            originX: heroDrag.x,
            originY: heroDrag.y,
        };
        event.currentTarget.classList.add("is-dragging");
    };

    const handleHeroPointerMove = (event) => {
        if (!heroDragRef.current.active) return;

        const nextX = heroDragRef.current.originX + (event.clientX - heroDragRef.current.startX);
        const nextY = heroDragRef.current.originY + (event.clientY - heroDragRef.current.startY);

        setHeroDrag({
            x: Math.max(-190, Math.min(190, nextX)),
            y: Math.max(-55, Math.min(85, nextY)),
        });
    };

    const handleHeroPointerUp = (event) => {
        heroDragRef.current.active = false;
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        event.currentTarget.classList.remove("is-dragging");
    };

    const scrollTo = (id) => {
        setMobileOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    useEffect(() => {
        let frame = 0;
        const update = () => {
            if (!howRef.current) return;
            const rect = howRef.current.getBoundingClientRect();
            const travel = Math.max(howRef.current.offsetHeight - window.innerHeight, 1);
            const progress = Math.min(Math.max(-rect.top / travel, 0), 1);
            setHowProgress(progress);
            frame = requestAnimationFrame(update);
        };
        frame = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frame);
    }, []);

    const translateX = useMemo(() => `-${howProgress * 66.666667}%`, [howProgress]);

    return (
        <div className="votara-landing">
            <header className="landing-nav-wrap">
                <nav className="landing-nav" aria-label="Primary navigation">
                    <button className="landing-logo" type="button" onClick={() => scrollTo("home")} aria-label="VOTARA home">
                        <img src={votaraLogo} alt="Votara" />
                    </button>

                    <div className={`landing-nav-links ${mobileOpen ? "is-open" : ""}`}>
                        <button type="button" onClick={() => scrollTo("home")}>Home</button>
                        <button type="button" onClick={() => scrollTo("about")}>About</button>
                        <button type="button" onClick={() => scrollTo("contact")}>Contact Us</button>
                        <button type="button" onClick={() => scrollTo("faq")}>FAQs</button>
                        <div className="mobile-nav-actions">
                            <button className="nav-login" type="button" onClick={() => navigate("/login")}>Login</button>
                            <button className="nav-register" type="button" onClick={() => navigate("/register")}>Register as a Voter</button>
                        </div>
                    </div>

                    <div className="landing-nav-actions">
                        <button className="nav-login" type="button" onClick={() => navigate("/login")}>Login</button>
                        <button className="nav-register" type="button" onClick={() => navigate("/register")}>Register as a Voter</button>
                    </div>

                    <button className="mobile-menu" type="button" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
                        {mobileOpen ? <FiX /> : <FiMenu />}
                    </button>
                </nav>
            </header>

            <main>
                <section id="home" className="landing-hero">
                    <div className="hero-grid" />
                    <div className="hero-content">
                        <div className="eyebrow reveal-up"><WordReveal>SECURE DIGITAL ELECTIONS FOR EVERY COMMUNITY</WordReveal></div>
                        <h1 className="reveal-up delay-1"><WordReveal>Transparent, secure and</WordReveal><br /><span><WordReveal>accessible voting.</WordReveal></span></h1>
                        <p className="hero-copy reveal-up delay-2"><WordReveal>Votara is a platform designed to help student communities exercise their right to — choose, together and without friction.</WordReveal></p>
                        <button className="hero-cta reveal-up delay-3" type="button" onClick={() => navigate("/register")}> <WordReveal>Register as a Voter</WordReveal> <FiArrowRight /></button>
                    </div>

                    <div className="hero-visual" aria-hidden="true">
                        <div
                            className="hero-glow"
                            onPointerDown={handleHeroPointerDown}
                            onPointerMove={handleHeroPointerMove}
                            onPointerUp={handleHeroPointerUp}
                            onPointerCancel={handleHeroPointerUp}
                            style={{ transform: `translate3d(calc(-50% + ${heroDrag.x}px), ${heroDrag.y}px, 0)` }}
                            role="img"
                            aria-label="Draggable VOTARA election visual"
                        />
                        <div className="hero-orbit-ring hero-orbit-ring-1" />
                        <div className="hero-orbit-ring hero-orbit-ring-2" />
                        <div className="hero-stat hero-stat-left"><span>Cast votes</span><strong>1,207</strong><i><b /></i></div>
                        <div className="hero-stat hero-stat-right"><span>Verified voters</span><strong>96%</strong><i><b /></i></div>
                    </div>
                </section>

                <section id="about" className="about-section landing-container">
                    <div className="section-intro">
                        <span className="section-number">01</span>
                        <div>
                            <p className="section-label"><WordReveal>WHY VOTARA</WordReveal></p>
                            <h2><WordReveal>Everything your campus election needs.</WordReveal></h2>
                            <p><WordReveal>From verified registration to secure voting and clear results, Votara keeps the election experience understandable for students and manageable for the Electoral Board.</WordReveal></p>
                        </div>
                    </div>
                    <div className="feature-grid">
                        <article className="feature-card feature-card-blue"><span className="feature-icon"><FiShield /></span><small>01</small><h3><WordReveal>Secure</WordReveal></h3><p><WordReveal>Identity is verified before access while the ballot is protected from unnecessary exposure.</WordReveal></p></article>
                        <article className="feature-card"><span className="feature-icon"><FiCheck /></span><small>02</small><h3><WordReveal>Student voting</WordReveal></h3><p><WordReveal>A focused voting flow makes it easy to review candidates and submit the required choices.</WordReveal></p></article>
                        <article className="feature-card"><span className="feature-icon"><FiLock /></span><small>03</small><h3><WordReveal>Election management</WordReveal></h3><p><WordReveal>Election staff can manage registration, candidates, schedules, monitoring and results from one system.</WordReveal></p></article>
                        <article className="feature-card feature-card-wide"><div><span className="feature-icon"><FiArrowRight /></span><small>04</small><h3><WordReveal>Results & reporting</WordReveal></h3><p><WordReveal>Follow election outcomes with clear summaries and reporting designed for accountable decision-making.</WordReveal></p></div><div className="mini-bars"><i /><i /><i /><i /><i /></div></article>
                    </div>
                </section>

                <section className="quote-section landing-container">
                    <div className="quote-card">
                        <span className="quote-mark">“</span>
                        <p><WordReveal>Votara is built around a simple idea: verify who is allowed to vote, while protecting what that voter selected.</WordReveal></p>
                        <span className="quote-caption"><WordReveal>A clearer way to vote.</WordReveal></span>
                    </div>
                </section>

                <section ref={howRef} id="how-it-works" className="how-section">
                    <div className="how-sticky">
                        <div className="how-heading">
                            <h2><WordReveal>How it works</WordReveal></h2>
                            <p><WordReveal>It’s simple and easy to use with these 3 steps</WordReveal></p>
                        </div>
                        <div className="how-viewport">
                            <div className="how-track" style={{ transform: `translate3d(${translateX},0,0)` }}>
                                {STEPS.map((step, index) => (
                                    <article className={`how-slide how-slide-${index + 1}`} key={step.number}>
                                        <div className="how-copy">
                                            <div className="step-line" />
                                            <span className="step-number"><WordReveal>{step.number}</WordReveal></span>
                                            <h3><WordReveal>{step.title}</WordReveal></h3>
                                            <p><WordReveal>{step.text}</WordReveal></p>
                                            <button type="button" onClick={() => index === 0 ? navigate("/register") : scrollTo("contact")}>Learn more <FiArrowRight /></button>
                                        </div>
                                        <div className="how-art">
                                            {index === 0 && <div className="signup-art"><div className="signup-card"><span>Votara</span><strong>Welcome!</strong><small>Create your account and verify your student ID.</small><div className="fake-input" /><div className="fake-input" /><div className="fake-button">SIGN UP</div></div><div className="signup-orb">01</div></div>}
                                            {index === 1 && <DashboardMockup />}
                                            {index === 2 && <DashboardMockup variant="result" />}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </div>
                        <div className="how-progress"><span style={{ width: `${Math.max(12, howProgress * 100)}%` }} /></div>
                    </div>
                </section>

                <section className="privacy-section">
                    <div className="privacy-rings" aria-hidden="true"><span /><span /><span /><div><FiShield /></div></div>
                    <div><span className="privacy-label"><WordReveal>YOUR VOTE STAYS PRIVATE.</WordReveal></span><h2><WordReveal>Your election stays transparent.</WordReveal></h2><p><WordReveal>Ballots should be confidential. Organization-level results and activity can still be reviewed without exposing individual choices.</WordReveal></p></div>
                </section>

                <section id="faq" className="faq-section landing-container">
                    <div className="faq-heading"><span className="section-number">04</span><div><p className="section-label"><WordReveal>QUESTIONS</WordReveal></p><h2><WordReveal>Frequently asked questions.</WordReveal></h2><p><WordReveal>Everything you need to know before using Votara.</WordReveal></p></div></div>
                    <div className="faq-list">
                        {FAQS.map((item, index) => (
                            <div className={`faq-item ${faqOpen === index ? "open" : ""}`} key={item.question}>
                                <button type="button" onClick={() => setFaqOpen(faqOpen === index ? null : index)}><span><WordReveal>{item.question}</WordReveal></span><FiChevronDown /></button>
                                <div className="faq-answer"><p><WordReveal>{item.answer}</WordReveal></p></div>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="contact" className="contact-section landing-container">
                    <div className="contact-card">
                        <div><span className="section-label"><WordReveal>READY WHEN YOU ARE</WordReveal></span><h2><WordReveal>Start with your vote.</WordReveal></h2><p><WordReveal>Create your Votara account and take the first step toward a more accessible student election.</WordReveal></p></div>
                        <button type="button" onClick={() => navigate("/register")}>Register as a Voter <FiArrowRight /></button>
                    </div>
                </section>
            </main>

            <footer className="landing-footer">
                <div className="landing-container footer-inner">
                    <button className="footer-logo" type="button" onClick={() => scrollTo("home")}><img src={votaraLogo} alt="Votara" /></button>
                    <span>Secure • Transparent • Accessible • Accountable</span>
                    <span>© {new Date().getFullYear()} VOTARA</span>
                </div>
            </footer>
        </div>
    );
}

export default LandingPage;
