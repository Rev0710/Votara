import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiArrowRight, FiArrowUpRight, FiBarChart2, FiCheck, FiChevronDown, FiChevronLeft, FiChevronRight, FiLock, FiMenu, FiShield, FiUser, FiUsers, FiX } from "react-icons/fi";
import votaraLogo from "../../assets/images/votara-logo.png";
import votaraSymbol from "../../assets/images/votara-symbol.svg";
import registrationPreview from "../../assets/landing/registration.png";
import votingPreview from "../../assets/landing/voting.png";
import resultsPreview from "../../assets/landing/results.png";
import "./LandingPage.css";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
    { title: "Sign up", text: "Create your Votara account and verify your student ID.", detail: "Start with your student details, verify your email, and complete the account setup steps.", image: registrationPreview, alt: "VOTARA registration interface with student ID and email fields", action: "Get started", to: "/register" },
    { title: "Vote", text: "Review candidates, choose your preferred options and submit securely.", detail: "When an election is open, sign in to review the candidates and make your choices.", image: votingPreview, alt: "VOTARA ballot interface showing candidates grouped by position", action: "Login to Votara", to: "/login" },
    { title: "View results", text: "Track election outcomes and candidate scores as results become available.", detail: "See published results and follow the outcome of your campus election from your dashboard.", image: resultsPreview, alt: "VOTARA dashboard preview with election results and voting progress", action: "Login to view results", to: "/login" },
];
const FAQS = [
    { question: "Who can vote in VOTARA?", answer: "Eligible students in the IT Department can vote when an election is open and their account is verified and eligible for that election." },
    { question: "How do I register?", answer: "Start from the VOTARA registration page, provide the required student information, verify the registration OTP, and complete the account setup steps required by the system." },
    { question: "Is my vote private?", answer: "VOTARA is designed to verify voter eligibility while keeping the selected ballot separate from the student's identity in the voting record." },
    { question: "What happens if I am a late enrollee?", answer: "Late-enrollee requests can be reviewed by the Electoral Board. Approved students can continue through the applicable VOTARA registration and voting flow." },
];
const FEATURES = [
    { title: "Secure student voting", text: "Verified access and a focused voting experience, from reviewing candidates to submitting your ballot.", icon: FiShield, className: "lp-feature-voting" },
    { title: "Election management", text: "Positions, schedules, voter rules, and candidates in one workspace for election staff.", icon: FiCheck, className: "lp-feature-management" },
    { title: "Candidate profiles", text: "Get to know the people on your ballot and explore their platforms before you choose.", icon: FiUsers, className: "lp-feature-candidates" },
    { title: "Results & reporting", text: "Clear turnout summaries and published results help you follow the election outcome.", icon: FiBarChart2, className: "lp-feature-results" },
];

const ORBITS = [
    { name: "voter", icon: FiUser, angle: 90, duration: 22, direction: 1 },
    { name: "results", icon: FiBarChart2, angle: 8, duration: 32, direction: -1 },
    { name: "ballot", icon: FiCheck, angle: 155, duration: 42, direction: 1 },
];

function PrivacyOrbit() {
    const rootRef = useRef(null);
    useLayoutEffect(() => {
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
            const root = rootRef.current;
            const copy = root.closest(".lp-privacy").querySelector(".lp-privacy-copy");
            const badges = Array.from(root.querySelectorAll(".lp-orbit-satellite"), (element) => ({ element, setOpacity: gsap.quickSetter(element, "opacity") }));
            const fadeNearCopy = () => {
                const textBottom = copy.getBoundingClientRect().bottom;
                // Measure the full moving badge against the actual text, including wrapped lines.
                const opacities = badges.map(({ element }) => gsap.utils.clamp(0, 1, (element.getBoundingClientRect().top - textBottom - 12) / 32));
                badges.forEach(({ setOpacity }, index) => setOpacity(opacities[index]));
            };
            const motion = gsap.timeline({ paused: true, onUpdate: fadeNearCopy });
            ORBITS.forEach(({ name, angle, duration, direction }) => {
                const carrier = root.querySelector(`.lp-orbit-${name} .lp-orbit-carrier`);
                const glyph = carrier.querySelector(".lp-orbit-glyph");
                motion.fromTo(carrier, { rotation: angle }, { rotation: angle + direction * 360, duration, repeat: -1, ease: "none" }, 0);
                // Counter-rotate each icon so it remains upright along its orbit.
                motion.fromTo(glyph, { rotation: -angle }, { rotation: -angle - direction * 360, duration, repeat: -1, ease: "none" }, 0);
            });
            let inView = false;
            const syncPlayback = () => {
                fadeNearCopy();
                motion.paused(!inView || document.hidden);
            };
            // Watch the actual viewport, independent of the pinned walkthrough's scroll range.
            const observer = new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting;
                syncPlayback();
            });
            observer.observe(root);
            document.addEventListener("visibilitychange", syncPlayback);
            return () => {
                observer.disconnect();
                document.removeEventListener("visibilitychange", syncPlayback);
                root.querySelectorAll(".lp-orbit-satellite").forEach((satellite) => satellite.style.removeProperty("opacity"));
            };
        }, rootRef);
        return () => media.revert();
    }, []);

    return <div ref={rootRef} className="lp-privacy-orbit" aria-hidden="true">
        <div className="lp-orbit-rings">{ORBITS.map(({ name, icon: Icon, angle }) => <div key={name} className={`lp-orbit-track lp-orbit-${name}`} style={{ "--orbit-start": `${angle}deg` }}><div className="lp-orbit-carrier"><span className="lp-orbit-satellite"><span className="lp-orbit-glyph"><Icon /></span></span></div></div>)}</div>
        <div className="lp-orbit-core"><img src={votaraSymbol} alt="" width="80" height="68" /></div>
    </div>;
}

function Walkthrough() {
    const [index, setIndex] = useState(0);
    const sectionRef = useRef(null);
    const stageRef = useRef(null);
    const bubbleRef = useRef(null);
    const burstRef = useRef(null);
    const cardsRef = useRef(null);
    const viewportRef = useRef(null);
    const trackRef = useRef(null);
    const tabsRef = useRef([]);
    const scrollRef = useRef(null);

    useLayoutEffect(() => {
        const media = gsap.matchMedia();
        media.add({
            desktop: "(min-width: 941px) and (min-height: 650px)",
            motion: "(prefers-reduced-motion: no-preference)",
        }, ({ conditions }) => {
            if (!conditions.motion) return;
            const section = sectionRef.current;
            const stage = stageRef.current;
            const viewport = viewportRef.current;
            const track = trackRef.current;
            const slides = Array.from(track.children);
            const firstImage = slides[0].querySelector(".lp-step-image");
            const incoming = [stage.querySelector(".lp-section-heading"), slides[0].querySelector(".lp-step-copy"), stage.querySelector(".lp-step-navigation")];
            const bubble = bubbleRef.current;
            const fill = bubble.querySelector(".lp-bubble-fill");
            const burst = burstRef.current;
            const ring = burst.querySelector(".lp-bubble-ring");
            const drops = Array.from(burst.querySelectorAll(".lp-bubble-drop"));
            const cards = Array.from(cardsRef.current.children);
            const initialScale = conditions.desktop ? .78 : .82;
            const imageCenterY = () => {
                const imageBounds = firstImage.getBoundingClientRect();
                return imageBounds.top + imageBounds.height / 2 - stage.getBoundingClientRect().top;
            };
            // Start the same bubble just below the hero buttons, then carry it into the steps.
            const bubbleStartY = () => bubble.offsetWidth * initialScale / 2 + 12 - imageCenterY();
            section.classList.add("has-bubble-motion", "is-bubble-intro");
            if (conditions.desktop) section.classList.add("is-scroll-driven");
            viewport.scrollLeft = 0;
            gsap.set(bubble, { xPercent: -50, yPercent: -50, x: 0, y: 0 });
            gsap.set(incoming, { autoAlpha: 0, y: 24 });
            gsap.set(firstImage, { autoAlpha: 0, clipPath: "circle(44% at 50% 50%)" });
            gsap.set(burst, { xPercent: -50, yPercent: -50, x: 0, y: 0, autoAlpha: 0 });
            // Keep the burst on the same scroll clock so reversing the scroll restores it.
            const addPop = (timeline, at, duration) => {
                const radial = (i, radius, axis) => Math[axis]((i / drops.length) * Math.PI * 2) * bubble.offsetWidth * radius;
                timeline.set(burst, { top: imageCenterY, scale: 1.35, autoAlpha: 1 }, at);
                timeline.to(fill, { scale: 1.55, autoAlpha: 0, duration: duration * .28, ease: "power3.in" }, at);
                timeline.to(cards, { autoAlpha: 0, duration: duration * .7, ease: "power2.out" }, at);
                timeline.fromTo(ring, { scale: 1, autoAlpha: .8 }, { scale: 1.35, autoAlpha: 0, duration, ease: "power2.out", immediateRender: false }, at);
                timeline.fromTo(drops,
                    { x: (i) => radial(i, .44, "cos"), y: (i) => radial(i, .44, "sin"), scale: .8, autoAlpha: .9 },
                    { x: (i) => radial(i, .68, "cos"), y: (i) => radial(i, .68, "sin"), scale: 0, autoAlpha: 0, duration, ease: "power2.out", immediateRender: false }, at);
            };

            if (conditions.desktop) {
                // The first step's own image is the reveal; there is no duplicate hero preview.
                const distance = () => slides.at(-1).offsetLeft - slides[0].offsetLeft;
                const centeredImageX = () => stage.clientWidth / 2 - firstImage.offsetLeft - firstImage.offsetWidth / 2;
                gsap.set(firstImage, { x: centeredImageX, scale: .88 });
                const approach = gsap.timeline({
                    scrollTrigger: { trigger: section, start: "clamp(top 95%)", end: "top top", scrub: .6, invalidateOnRefresh: true },
                });
                approach.fromTo(bubble, { top: imageCenterY, y: bubbleStartY, scale: initialScale }, { top: imageCenterY, y: 0, scale: 1, duration: 1, ease: "none" }, 0);
                approach.fromTo(cards, { y: 0 }, { y: (i) => i === 0 ? -36 : -60, duration: 1, ease: "none" }, 0);

                const introEnd = .34;
                const sequence = gsap.timeline({
                    scrollTrigger: {
                        trigger: section,
                        pin: stage,
                        start: "top top",
                        end: () => `+=${distance() + stage.clientHeight * 1.15}`,
                        scrub: .65,
                        anticipatePin: 1,
                        invalidateOnRefresh: true,
                    },
                    onUpdate() {
                        section.classList.toggle("is-bubble-intro", this.progress() < introEnd);
                        const progress = Math.max(0, (this.progress() - introEnd) / (1 - introEnd));
                        setIndex(Math.round(progress * (STEPS.length - 1)));
                    },
                });
                sequence.fromTo(fill, { scale: 1 }, { scale: 1.35, duration: .1, ease: "none", immediateRender: false }, 0);
                addPop(sequence, .1, .09);
                sequence.fromTo(firstImage, { x: centeredImageX, scale: .88, autoAlpha: 0, clipPath: "circle(44% at 50% 50%)" }, { x: 0, scale: 1, autoAlpha: 1, clipPath: "circle(75% at 50% 50%)", duration: .18, ease: "power2.out", immediateRender: false }, .115);
                sequence.to(incoming, { autoAlpha: 1, y: 0, duration: .08, stagger: .015, ease: "power2.out" }, .2);
                sequence.addLabel("steps", introEnd);
                sequence.to(track, { x: () => -distance(), duration: 1 - introEnd, ease: "none" }, "steps");
                scrollRef.current = { trigger: sequence.scrollTrigger, introEnd };
            } else {
                const reveal = gsap.timeline({
                    scrollTrigger: { trigger: section, start: "clamp(top 95%)", end: "top 15%", scrub: .5, invalidateOnRefresh: true },
                    onUpdate() { section.classList.toggle("is-bubble-intro", this.progress() < 1); },
                });
                reveal.fromTo(bubble, { top: imageCenterY, y: bubbleStartY, scale: initialScale }, { top: imageCenterY, y: 0, scale: 1, duration: .65, ease: "none" }, 0);
                reveal.fromTo(cards, { y: 0 }, { y: (i) => i === 0 ? -20 : -36, duration: .65, ease: "none" }, 0);
                reveal.fromTo(fill, { scale: 1 }, { scale: 1.35, duration: .65, ease: "none" }, 0);
                addPop(reveal, .65, .14);
                reveal.fromTo(firstImage, { scale: .9, clipPath: "circle(44% at 50% 50%)" }, { autoAlpha: 1, scale: 1, clipPath: "circle(75% at 50% 50%)", duration: .3, ease: "power1.out" }, .68);
                reveal.to(incoming, { autoAlpha: 1, y: 0, duration: .2, stagger: .015, ease: "power2.out" }, .8);
            }
            // Refresh measurements once fonts have settled; ignore completion after unmount.
            let active = true;
            document.fonts.ready.then(() => { if (active) ScrollTrigger.refresh(); });
            return () => {
                active = false;
                scrollRef.current = null;
                section.classList.remove("is-scroll-driven", "has-bubble-motion", "is-bubble-intro");
            };
        }, sectionRef);
        return () => media.revert();
    }, []);

    const selectStep = (next) => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const sequence = scrollRef.current;
        if (sequence) {
            const { trigger, introEnd } = sequence;
            const progress = introEnd + (1 - introEnd) * next / (STEPS.length - 1);
            window.scrollTo({ top: trigger.start + (trigger.end - trigger.start) * progress, behavior: "smooth" });
        } else {
            const slides = trackRef.current.children;
            viewportRef.current.scrollTo({ left: slides[next].offsetLeft - slides[0].offsetLeft, behavior: reduceMotion ? "instant" : "smooth" });
        }
    };
    const handleTabKey = (event, current) => {
        const next = event.key === "ArrowRight" ? (current + 1) % STEPS.length : event.key === "ArrowLeft" ? (current + STEPS.length - 1) % STEPS.length : event.key === "Home" ? 0 : event.key === "End" ? STEPS.length - 1 : null;
        if (next === null) return;
        event.preventDefault();
        selectStep(next);
        tabsRef.current[next]?.focus({ preventScroll: true });
    };
    const handleSwipe = () => {
        if (scrollRef.current) return;
        const slides = trackRef.current.children;
        const width = slides[1].offsetLeft - slides[0].offsetLeft;
        setIndex(Math.max(0, Math.min(STEPS.length - 1, Math.round(viewportRef.current.scrollLeft / width))));
    };

    return <section ref={sectionRef} id="how-it-works" className="lp-walkthrough" aria-labelledby="lp-how-title">
        <div ref={stageRef} className="lp-walkthrough-stage">
            <div ref={bubbleRef} className="lp-walkthrough-bubble" aria-hidden="true"><span className="lp-bubble-fill" /></div>
            <div ref={burstRef} className="lp-bubble-burst" aria-hidden="true"><span className="lp-bubble-ring" />{Array.from({ length: 8 }, (_, i) => <span key={i} className="lp-bubble-drop" />)}</div>
            <div ref={cardsRef} className="lp-bubble-cards" aria-hidden="true">{["left", "right"].map((side) => <div key={side} className={`lp-vote-preview lp-vote-preview-${side}`}><span className="lp-vote-preview-arrow"><FiArrowUpRight /></span><span className="lp-vote-preview-label">Cast votes</span><span className="lp-vote-preview-value">1 207</span><span className="lp-vote-preview-progress"><span /></span></div>)}</div>
            <div className="lp-section-heading"><h2 id="lp-how-title">Your vote, in three steps.</h2><p>A clear path from joining Votara to following the results.</p></div>
            <div ref={viewportRef} className="lp-step-viewport" onScroll={handleSwipe}>
                <div ref={trackRef} className="lp-step-track">
                    {STEPS.map((step, i) => <article key={step.title} id={`lp-step-panel-${i}`} role="tabpanel" aria-labelledby={`lp-step-${i}`} inert={i !== index} className="lp-step-slide">
                        <div className="lp-step-copy"><span className="lp-step-number" aria-hidden="true">0{i + 1}</span><h3>{step.title}</h3><p className="lp-step-intro">{step.text}</p><p className="lp-step-detail">{step.detail}</p><Link className="lp-button lp-button-primary" to={step.to}>{step.action}<FiArrowRight aria-hidden="true" /></Link></div>
                        <figure className={`lp-step-image lp-step-image-${i}`}><img src={step.image} alt={step.alt} width={i === 2 ? 622 : 1440} height={i === 0 ? 1024 : i === 1 ? 1238 : 534} loading="lazy" /><figcaption className="lp-sr-only">Votara interface preview</figcaption></figure>
                    </article>)}
                </div>
            </div>
            <div className="lp-step-navigation lp-container">
                <div className="lp-step-tabs" role="tablist" aria-label="How VOTARA works">{STEPS.map((step, i) => <button key={step.title} type="button" role="tab" id={`lp-step-${i}`} aria-selected={i === index} aria-controls={`lp-step-panel-${i}`} tabIndex={i === index ? 0 : -1} ref={(el) => { tabsRef.current[i] = el; }} onKeyDown={(event) => handleTabKey(event, i)} onClick={() => selectStep(i)}><span aria-hidden="true">0{i + 1}</span>{step.title}</button>)}</div>
                <div className="lp-step-controls"><span className="lp-sr-only" aria-live="polite">Step {index + 1} of {STEPS.length}</span><button type="button" disabled={index === 0} onClick={() => selectStep(index - 1)} aria-label="Previous step"><FiChevronLeft /></button><button type="button" disabled={index === STEPS.length - 1} onClick={() => selectStep(index + 1)} aria-label="Next step"><FiChevronRight /></button></div>
            </div>
        </div>
    </section>;
}

export default function LandingPage() {
    const pageRef = useRef(null);
    const navRef = useRef(null);
    const menuRef = useRef(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(null);
    useEffect(() => {
        let active = true;
        document.fonts.ready.then(() => {
            if (!active) return;
            const target = document.getElementById(window.location.hash.slice(1));
            if (target) target.scrollIntoView({ behavior: "instant", block: "start" });
            else window.scrollTo({ top: 0, behavior: "instant" });
        });
        return () => { active = false; };
    }, []);
    useEffect(() => {
        if (!mobileOpen) return;
        const dismiss = (event) => {
            if (event.type === "keydown") {
                if (event.key !== "Escape") return;
                setMobileOpen(false);
                menuRef.current?.focus();
            } else if (!navRef.current?.contains(event.target)) setMobileOpen(false);
        };
        document.addEventListener("keydown", dismiss);
        document.addEventListener("pointerdown", dismiss);
        return () => { document.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", dismiss); };
    }, [mobileOpen]);
    useLayoutEffect(() => {
        const media = gsap.matchMedia();
        const context = gsap.context(() => {
            media.add("(prefers-reduced-motion: no-preference)", () => {
                gsap.from(".lp-hero-copy > *", { y: 24, autoAlpha: 0, duration: .8, stagger: .1, ease: "power3.out", clearProps: "transform,opacity,visibility" });
                gsap.utils.toArray("[data-reveal]").forEach((element) => {
                    gsap.from(element, { y: 24, autoAlpha: 0, duration: .7, ease: "power2.out", clearProps: "transform,opacity,visibility", scrollTrigger: { trigger: element, start: "top 90%", once: true } });
                });
            });
        }, pageRef);
        return () => { media.revert(); context.revert(); };
    }, []);
    const closeMenu = () => setMobileOpen(false);
    return <div ref={pageRef} className="votara-landing lp-reference">
        <a className="lp-skip" href="#lp-main">Skip to content</a>
        <header className="lp-nav-wrap"><nav ref={navRef} className="lp-nav" aria-label="Primary navigation">
            <a className="lp-logo" href="#home" onClick={closeMenu} aria-label="VOTARA home"><img src={votaraLogo} alt="Votara" width="128" height="38" /></a>
            <div id="lp-navigation" className={`lp-nav-links ${mobileOpen ? "is-open" : ""}`}><a href="#home" onClick={closeMenu}>Home</a><a href="#about" onClick={closeMenu}>About</a><Link to="/contact" onClick={closeMenu}>Contact Us</Link><a href="#faq" onClick={closeMenu}>FAQs</a><div className="lp-mobile-actions"><Link to="/login" onClick={closeMenu}>Login</Link><Link className="lp-button lp-button-primary" to="/register" onClick={closeMenu}>Register as a Voter</Link></div></div>
            <div className="lp-nav-actions"><Link className="lp-nav-login" to="/login">Login</Link><Link className="lp-button lp-button-primary" to="/register">Register as a Voter</Link></div>
            <button ref={menuRef} className="lp-menu" type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="lp-navigation" onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <FiX /> : <FiMenu />}</button>
        </nav></header>
        <main id="lp-main">
            <section id="home" className="lp-hero" aria-labelledby="lp-hero-title">
                <div className="lp-hero-copy"><p className="lp-eyebrow">Secure digital elections for every community</p><h1 id="lp-hero-title">Transparent, secure and<br className="lp-desktop-break" /> accessible voting.</h1><p className="lp-hero-description">Votara is a platform designed to help — student communities exercise<br className="lp-desktop-break" /> their right to — choose, together and without friction</p><div className="lp-hero-actions"><Link className="lp-button lp-button-primary" to="/register">Register as a Voter</Link></div></div>
            </section>
            <Walkthrough />
            <section id="about" className="lp-features" aria-labelledby="lp-features-title"><div className="lp-container lp-feature-layout">
                <div className="lp-feature-intro" data-reveal><p className="lp-eyebrow">Built for campus elections</p><h2 id="lp-features-title">Everything your <br />campus election needs.</h2><p>From the first voter registration to the final results, Votara keeps every step clear and easy to follow.</p><a className="lp-text-link" href="#how-it-works">Explore the platform<FiArrowUpRight aria-hidden="true" /></a></div>
                <div className="lp-feature-grid">{FEATURES.map(({ title, text, icon: Icon, className }) => <article className={`lp-feature ${className}`} key={title} data-reveal><span className="lp-feature-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>)}</div>
            </div></section>
            <section className="lp-principle lp-container" aria-labelledby="lp-principle-title" data-reveal><span className="lp-principle-icon" aria-hidden="true"><FiCheck /></span><div><h2 id="lp-principle-title">A clearer way to vote.</h2><p>Know the candidates. Review your choices. Submit with confidence.</p></div><a className="lp-text-link" href="#faq">Your questions, answered<FiArrowRight aria-hidden="true" /></a></section>
            <section id="privacy" className="lp-privacy" aria-labelledby="lp-privacy-title"><div className="lp-container"><div className="lp-privacy-copy" data-reveal><h2 id="lp-privacy-title">Your vote stays private.<br />Your election stays transparent.</h2><p>Votara is designed to verify voter eligibility while keeping ballot selections separate from the student’s identity.</p></div><PrivacyOrbit /><div className="lp-privacy-details"><span><FiShield aria-hidden="true" />Verified voter access</span><span><FiLock aria-hidden="true" />Private ballot selections</span><span><FiBarChart2 aria-hidden="true" />Clear election reporting</span></div></div></section>
            <section id="faq" className="lp-faq lp-container" aria-labelledby="lp-faq-title"><div className="lp-faq-intro" data-reveal><h2 id="lp-faq-title">Before you vote.</h2><p>Answers to common questions about joining Votara and taking part in an election.</p><Link className="lp-text-link" to="/late-enrollee">Late enrollee?<FiArrowUpRight aria-hidden="true" /></Link></div><div className="lp-faq-list">{FAQS.map((item, index) => <div className={`lp-faq-item ${faqOpen === index ? "is-open" : ""}`} key={item.question}><h3><button id={`lp-faq-button-${index}`} type="button" aria-expanded={faqOpen === index} aria-controls={`lp-faq-answer-${index}`} onClick={() => setFaqOpen(faqOpen === index ? null : index)}>{item.question}<FiChevronDown aria-hidden="true" /></button></h3><div id={`lp-faq-answer-${index}`} role="region" aria-labelledby={`lp-faq-button-${index}`} hidden={faqOpen !== index}><p>{item.answer}</p></div></div>)}</div></section>
            <section id="contact" className="lp-contact lp-container" aria-labelledby="lp-contact-title"><div data-reveal><h2 id="lp-contact-title">Your voice belongs here.</h2><p>Start with your Votara account. Be ready when your campus election opens.</p><div className="lp-contact-actions"><Link className="lp-button lp-button-primary" to="/register">Register as a Voter<FiArrowRight aria-hidden="true" /></Link><Link className="lp-text-link" to="/login">Already registered? Login<FiArrowRight aria-hidden="true" /></Link></div><a className="lp-help-link" href="#faq">Need help getting started? Read the FAQs.</a></div></section>
        </main>
        <footer className="lp-footer"><div className="lp-container lp-footer-inner"><a className="lp-logo" href="#home" aria-label="Back to VOTARA home"><img src={votaraLogo} alt="Votara" width="110" height="32" /></a><div><a href="#privacy">Privacy</a><a href="#faq">FAQs</a><Link to="/login">Login</Link></div><span>© {new Date().getFullYear()} VOTARA</span></div></footer>
    </div>;
}
