import React, { useEffect, useRef, useState } from "react";



import { useNavigate } from "react-router-dom";



import { FiArrowRight, FiBarChart2, FiCheck, FiChevronDown, FiChevronLeft, FiChevronRight, FiLock, FiMenu, FiShield, FiUser, FiX } from "react-icons/fi";



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



                            <div className="result-stat-card"><span>Total votes</span><strong>400+</strong><small>+12.8% turnout</small></div>



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



    const heroRef = useRef(null);



    const [heroScroll, setHeroScroll] = useState(0);



    const [mobileOpen, setMobileOpen] = useState(false);



    const [faqOpen, setFaqOpen] = useState(null);




    const scrollTo = (id) => {



        setMobileOpen(false);



        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });



    };







    // Scroll-linked hero: the arch rises, expands, and reveals the product preview.



    // Updates are requestAnimationFrame-throttled and reverse naturally on scroll up.



    useEffect(() => {



        let frame = 0;



        const updateHero = () => {



            frame = 0;



            if (!heroRef.current) return;



            const hero = heroRef.current;



            const top = hero.getBoundingClientRect().top;



            const range = Math.max(hero.offsetHeight * 0.75, 420);



            const next = Math.max(0, Math.min(1, -top / range));



            setHeroScroll(previous => Math.abs(previous - next) > 0.002 ? next : previous);



        };



        const onScroll = () => {



            if (!frame) frame = requestAnimationFrame(updateHero);



        };



        updateHero();



        window.addEventListener("scroll", onScroll, { passive: true });



        window.addEventListener("resize", onScroll);



        return () => {



            window.removeEventListener("scroll", onScroll);



            window.removeEventListener("resize", onScroll);



            if (frame) cancelAnimationFrame(frame);



        };



    }, []);







    const [howIndex, setHowIndex] = useState(0);



    const [howDirection, setHowDirection] = useState(1);



    const howProgress = ((howIndex + 1) / STEPS.length) * 100;







    const scrollHowTo = (index) => {



        const clampedIndex = Math.max(0, Math.min(STEPS.length - 1, index));



        if (clampedIndex === howIndex) return;



        setHowDirection(clampedIndex > howIndex ? 1 : -1);



        setHowIndex(clampedIndex);



    };







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



                <section id="home" ref={heroRef} className="landing-hero">



                    <div className="hero-grid" />



                    <div className="hero-content">



                        <div className="eyebrow reveal-up"><WordReveal>SECURE DIGITAL ELECTIONS FOR EVERY COMMUNITY</WordReveal></div>



                        <h1 className="reveal-up delay-1"><WordReveal>Transparent, secure and</WordReveal><br /><span><WordReveal>accessible voting.</WordReveal></span></h1>



                        <p className="hero-copy reveal-up delay-2"><WordReveal>Votara is a platform designed to help student communities exercise their right to — choose, together and without friction.</WordReveal></p>



                        <button className="hero-cta reveal-up delay-3" type="button" onClick={() => navigate("/register")}> <WordReveal>Register as a Voter</WordReveal> <FiArrowRight /></button>



                    </div>







                    <div className="hero-visual" style={{ "--hero-scroll": heroScroll }}>



                        <div



                            className="hero-glow"



                            draggable={false}

                            style={{



                                transform: `translate3d(-50%, ${-heroScroll * 220}px, 0) scale(${1 + heroScroll * 0.16})`,



                                '--hero-lift': Math.max(0, Math.min(1, (85 + heroScroll * 220) / 330)),



                            }}



                            role="img"



                            aria-label="VOTARA election visual, animated as you scroll."



                        />



                        <div className="hero-orbit-ring hero-orbit-ring-1" />



                        <div className="hero-orbit-ring hero-orbit-ring-2" />



                        <div className="hero-stat hero-stat-left"><span>Cast votes</span><strong>400+</strong><i><b /></i></div>



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



                            <button



                                type="button"



                                className="how-arrow how-arrow-left"



                                onClick={() => scrollHowTo(howIndex - 1)}



                                disabled={howIndex === 0}



                                aria-label="Previous How It Works step"



                            >



                                <FiChevronLeft />



                            </button>







                            <div className="how-stage" aria-live="polite">



                                <article



                                    key={STEPS[howIndex].number}



                                    className={`how-slide how-slide-${howIndex + 1} ${howDirection > 0 ? "slide-from-right" : "slide-from-left"}`}



                                >



                                    <div className="how-copy">



                                        <span className="step-number"><WordReveal>{STEPS[howIndex].number}</WordReveal></span>



                                        <h3><WordReveal>{STEPS[howIndex].title}</WordReveal></h3>



                                        <p><WordReveal>{STEPS[howIndex].text}</WordReveal></p>



                                        <button type="button" onClick={() => howIndex === 0 ? navigate("/register") : scrollTo("contact")}>Learn more <FiArrowRight /></button>



                                    </div>



                                    <div className="how-art">



                                        {howIndex === 0 && <div className="signup-art"><div className="signup-card"><span>Votara</span><strong>Welcome!</strong><small>Create your account and verify your student ID.</small><div className="fake-input" /><div className="fake-input" /><div className="fake-button">SIGN UP</div></div><div className="signup-orb">01</div></div>}



                                        {howIndex === 1 && <DashboardMockup />}



                                        {howIndex === 2 && <DashboardMockup variant="result" />}



                                    </div>



                                    <div className="step-progress" aria-hidden="true">



                                        <span className={howIndex === 0 ? "active" : ""}></span>



                                        <span className={howIndex === 1 ? "active" : ""}></span>



                                        <span className={howIndex === 2 ? "active" : ""}></span>



                                    </div>



                                </article>



                            </div>







                            <button



                                type="button"



                                className="how-arrow how-arrow-right"



                                onClick={() => scrollHowTo(howIndex + 1)}



                                disabled={howIndex === STEPS.length - 1}



                                aria-label="Next How It Works step"



                            >



                                <FiChevronRight />



                            </button>



                        </div>



                    </div>



                </section>







                <section className="privacy-section">



                    <div className="privacy-content">



                        <h2>



                            <WordReveal>Your vote stays private.</WordReveal>



                            <br />



                            <span><WordReveal>Your election stays transparent.</WordReveal></span>



                        </h2>



                        <p><WordReveal>Each ballot is confidential. Organizers can still verify results and keep the process accountable.</WordReveal></p>



                    </div>







                    <div className="privacy-rings privacy-rings-motion" aria-hidden="true">



                        <span className="privacy-ring privacy-ring-outer" />

                        <span className="privacy-ring privacy-ring-middle" />

                        <span className="privacy-ring privacy-ring-inner" />



                        <span className="privacy-orbit-motion privacy-orbit-motion-outer">

                            <span className="privacy-orbit-glyph"><FiCheck /></span>

                        </span>



                        <span className="privacy-orbit-motion privacy-orbit-motion-middle">

                            <span className="privacy-orbit-glyph"><FiBarChart2 /></span>

                        </span>



                        <span className="privacy-orbit-motion privacy-orbit-motion-inner">

                            <span className="privacy-orbit-glyph"><FiUser /></span>

                        </span>



                        <div className="privacy-core privacy-votara-core">

                            <svg viewBox="0 0 64 64" role="img" aria-label="Votara" className="privacy-votara-mark">

                                <path d="M8 10h20L18 26 8 10Z" fill="currentColor" />

                                <circle cx="44" cy="18" r="10" fill="currentColor" />

                                <path d="M8 38c0-6.1 4.9-11 11-11h9L18 42H8v-4Z" fill="currentColor" />

                                <path d="M28 42 41 25l15 21H35l-7-4Z" fill="currentColor" />

                            </svg>

                        </div>

                    </div>



                <style>{`

                    /* Privacy orbit positioning: centered behind the headline. */

                    .privacy-section {

                        position: relative !important;

                        min-height: 560px !important;

                        height: clamp(520px, 58vw, 640px) !important;

                        overflow: hidden !important;

                        isolation: isolate;

                    }

                    .privacy-content {

                        position: relative !important;

                        z-index: 5 !important;

                        width: min(1180px, 92vw) !important;

                        margin: 0 auto !important;

                        padding-top: clamp(78px, 8vw, 112px) !important;

                        text-align: center !important;

                    }

                    .privacy-content h2,

                    .privacy-content p {

                        position: relative !important;

                        z-index: 6 !important;

                    }

                    .privacy-content h2 {

                        max-width: 1050px !important;

                        margin: 0 auto !important;

                    }

                    .privacy-content p {

                        max-width: 850px !important;

                        margin: 24px auto 0 !important;

                    }

                    .privacy-rings-motion {

                        position: absolute !important;

                        left: 50% !important;

                        top: 61% !important;

                        width: min(430px, 48vw) !important;

                        height: min(430px, 48vw) !important;

                        margin: 0 !important;

                        transform: translate(-50%, -50%) !important;

                        overflow: visible !important;

                        z-index: 1 !important;

                        pointer-events: none !important;

                    }

                    .privacy-rings-motion .privacy-ring {

                        position: absolute !important;

                        left: 50% !important;

                        top: 50% !important;

                        transform: translate(-50%, -50%) !important;

                        box-sizing: border-box !important;

                        border: 1px solid rgba(21, 94, 239, 0.52) !important;

                        border-radius: 50% !important;

                        background: transparent !important;

                    }

                    .privacy-rings-motion .privacy-ring-outer {

                        width: 100% !important;

                        height: 100% !important;

                    }

                    .privacy-rings-motion .privacy-ring-middle {

                        width: 72% !important;

                        height: 72% !important;

                    }

                    .privacy-rings-motion .privacy-ring-inner {

                        width: 45% !important;

                        height: 45% !important;

                    }

                    .privacy-rings-motion .privacy-votara-core {

                        position: absolute !important;

                        left: 50% !important;

                        top: 50% !important;

                        width: clamp(72px, 7vw, 92px) !important;

                        height: clamp(72px, 7vw, 92px) !important;

                        transform: translate(-50%, -50%) !important;

                        z-index: 8 !important;

                        display: flex !important;

                        align-items: center;

                        justify-content: center;

                        color: #155eef;

                        border: 1px solid rgba(255,255,255,.16);

                        border-radius: 50%;

                        background: radial-gradient(circle at 35% 30%, rgba(91,113,161,.48), rgba(35,43,78,.78));

                        box-shadow: 0 0 0 1px rgba(21,94,239,.12), 0 14px 36px rgba(0,0,0,.22);

                    }

                    .privacy-rings-motion .privacy-votara-mark {

                        width: 48%;

                        height: 48%;

                        display: block;

                        filter: drop-shadow(0 0 10px rgba(21,94,239,.24));

                    }

                    .privacy-rings-motion .privacy-orbit-glyph {

                        z-index: 9 !important;

                        width: clamp(26px, 2.4vw, 34px) !important;

                        height: clamp(26px, 2.4vw, 34px) !important;

                        border-radius: 50%;

                        display: flex !important;

                        align-items: center;

                        justify-content: center;

                        color: #155eef !important;

                        filter: drop-shadow(0 0 8px rgba(21,94,239,.35));

                    }

                    @media (max-width: 700px) {

                        .privacy-section {

                            min-height: 500px !important;

                            height: 540px !important;

                        }

                        .privacy-content {

                            width: 92vw !important;

                            padding-top: 58px !important;

                        }

                        .privacy-content h2 {

                            font-size: clamp(32px, 8vw, 46px) !important;

                            line-height: 1.08 !important;

                        }

                        .privacy-content p {

                            font-size: 14px !important;

                            line-height: 1.5 !important;

                            margin-top: 18px !important;

                        }

                        .privacy-rings-motion {

                            top: 64% !important;

                            width: min(340px, 78vw) !important;

                            height: min(340px, 78vw) !important;

                        }

                    }

                    @media (max-width: 420px) {

                        .privacy-section {

                            min-height: 470px !important;

                            height: 500px !important;

                        }

                        .privacy-content { padding-top: 48px !important; }

                        .privacy-rings-motion { top: 66% !important; }

                    }

                    .privacy-rings-motion { overflow: visible !important; }

                    .privacy-rings-motion .privacy-votara-core {

                        display: flex !important;

                        align-items: center;

                        justify-content: center;

                        color: #155eef;

                    }

                    .privacy-rings-motion .privacy-votara-mark {

                        width: 48%;

                        height: 48%;

                        display: block;

                        filter: drop-shadow(0 0 10px rgba(21,94,239,.24));

                    }

                    .privacy-orbit-motion {

                        position: absolute !important;

                        left: 50% !important;

                        top: 50% !important;

                        width: 100% !important;

                        height: 100% !important;

                        margin: 0 !important;

                        border: 0 !important;

                        border-radius: 50%;

                        background: transparent !important;

                        display: block !important;

                        pointer-events: none;

                    }

                    .privacy-orbit-motion .privacy-orbit-glyph {

                        position: absolute;

                        left: 50%;

                        top: 0;

                        width: clamp(24px,2.2vw,34px);

                        height: clamp(24px,2.2vw,34px);

                        transform: translate(-50%,-50%);

                        display: flex;

                        align-items: center;

                        justify-content: center;

                        color: #155eef;

                        filter: drop-shadow(0 0 8px rgba(21,94,239,.22));

                    }

                    .privacy-orbit-motion .privacy-orbit-glyph svg {

                        width: 55%;

                        height: 55%;

                        stroke-width: 2.3;

                    }

                    .privacy-orbit-motion-outer { width:100% !important; height:100% !important; animation: privacyOrbitOuter 13s linear infinite; }

                    .privacy-orbit-motion-middle { width:78% !important; height:78% !important; animation: privacyOrbitMiddle 9s linear infinite reverse; }

                    .privacy-orbit-motion-inner { width:56% !important; height:56% !important; animation: privacyOrbitInner 6.5s linear infinite; }

                    .privacy-orbit-motion-outer .privacy-orbit-glyph { animation: privacyCounterOuter 13s linear infinite; }

                    .privacy-orbit-motion-middle .privacy-orbit-glyph { animation: privacyCounterMiddle 9s linear infinite reverse; }

                    .privacy-orbit-motion-inner .privacy-orbit-glyph { animation: privacyCounterInner 6.5s linear infinite; }

                    @keyframes privacyOrbitOuter { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(360deg); } }

                    @keyframes privacyOrbitMiddle { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(360deg); } }

                    @keyframes privacyOrbitInner { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(360deg); } }

                    @keyframes privacyCounterOuter { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(-360deg); } }

                    @keyframes privacyCounterMiddle { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(-360deg); } }

                    @keyframes privacyCounterInner { from { transform:translate(-50%,-50%) rotate(0deg); } to { transform:translate(-50%,-50%) rotate(-360deg); } }

                    @media (prefers-reduced-motion: reduce) {

                        .privacy-orbit-motion,

                        .privacy-orbit-motion .privacy-orbit-glyph { animation:none !important; }

                    }

                `}</style>



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
