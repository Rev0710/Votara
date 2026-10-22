import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FiArrowDown, FiArrowRight, FiArrowUpRight, FiCheck, FiChevronDown, FiLifeBuoy, FiMail, FiMenu, FiShield, FiX } from "react-icons/fi";
import votaraLogo from "../../assets/images/votara-logo.png";
import votaraSymbol from "../../assets/images/votara-symbol.svg";
import "./LandingPage.css";
import "./Contact.css";

gsap.registerPlugin(ScrollTrigger);

const DEPARTMENTS = [
    { name: "Technical support", email: "support@votara.app", icon: FiLifeBuoy, description: "A hand with account access, registration, or a page that isn’t working as expected.", detail: "Tell us what you were trying to do and what happened instead." },
    { name: "Privacy & security", email: "privacy@votara.app", icon: FiShield, description: "Questions about your personal information, account security, or a privacy concern.", detail: "Keep passwords, verification codes, and ballot choices out of your message." },
    { name: "Legal & compliance", email: "legal@votara.app", icon: FiMail, description: "The right place for questions about terms, institutional requirements, and official requests.", detail: "Include your institution and the policy or request you’d like us to review." },
];
const GUIDANCE = [
    { title: "Start with what happened.", text: "A short description helps the right team understand your question." },
    { title: "Add a little context.", text: "Include the page, any error message, and the steps you already tried." },
    { title: "Keep your vote yours.", text: "Never share your password, OTP, or the candidates you voted for." },
];
const QUESTIONS = [
    { title: "I can’t sign in. Where should I start?", text: "Try resetting your password using the email you registered with. If you still can’t get in, contact technical support.", label: "Reset your password", to: "/forgot-password" },
    { title: "Who can help with my campus election?", text: "Your Electoral Board handles election schedules, voter eligibility, and candidate questions. Use the official contact channel in your campus election instructions.", label: "Sign in to your account", to: "/login" },
    { title: "Can I report an issue from my account?", text: "Yes. Sign in, open Settings, then choose Report an Issue. You can describe the problem and follow any updates associated with your report.", label: "Go to login", to: "/login" },
    { title: "I enrolled late. Can I still register?", text: "Submit a late-enrollee request for review by your Electoral Board. Approval depends on your campus election’s eligibility rules.", label: "Submit a late-enrollee request", to: "/late-enrollee" },
];

function ContactNav() {
    const [open, setOpen] = useState(false);
    const navRef = useRef(null);
    const menuRef = useRef(null);
    useEffect(() => {
        if (!open) return;
        const dismiss = (event) => {
            if (event.type === "keydown" && event.key === "Escape") { setOpen(false); menuRef.current?.focus(); }
            if (event.type === "pointerdown" && !navRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("keydown", dismiss);
        document.addEventListener("pointerdown", dismiss);
        return () => { document.removeEventListener("keydown", dismiss); document.removeEventListener("pointerdown", dismiss); };
    }, [open]);
    return <header className="lp-nav-wrap"><nav ref={navRef} className="lp-nav" aria-label="Primary navigation">
        <Link className="lp-logo" to="/" aria-label="VOTARA home"><img src={votaraLogo} alt="Votara" width="128" height="38" /></Link>
        <div id="contact-navigation" className={`lp-nav-links ${open ? "is-open" : ""}`}>
            <Link to="/">Home</Link><Link to="/#about">About</Link><Link to="/contact" aria-current="page" onClick={() => setOpen(false)}>Contact Us</Link><a href="#contact-faq" onClick={() => setOpen(false)}>FAQs</a>
            <div className="lp-mobile-actions"><Link to="/login">Login</Link><Link className="lp-button lp-button-primary" to="/register">Register as a Voter</Link></div>
        </div>
        <div className="lp-nav-actions"><Link className="lp-nav-login" to="/login">Login</Link><Link className="lp-button lp-button-primary" to="/register">Register as a Voter</Link></div>
        <button ref={menuRef} className="lp-menu" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="contact-navigation" onClick={() => setOpen(!open)}>{open ? <FiX /> : <FiMenu />}</button>
    </nav></header>;
}

export default function Contact() {
    const rootRef = useRef(null);
    const reviewRef = useRef(null);
    const [department, setDepartment] = useState(0);
    const [question, setQuestion] = useState(0);
    const [prepared, setPrepared] = useState(null);
    useEffect(() => {
        const title = document.title;
        document.title = "Contact Us | VOTARA";
        window.scrollTo({ top: 0, behavior: "instant" });
        return () => { document.title = title; };
    }, []);
    useEffect(() => { if (prepared) reviewRef.current?.focus(); }, [prepared]);
    useLayoutEffect(() => {
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
            gsap.from(".vc-hero-copy > *", { autoAlpha: 0, y: 22, duration: .8, stagger: .1, ease: "power3.out", clearProps: "all" });
            gsap.utils.toArray("[data-contact-reveal]").forEach((element) => {
                gsap.from(element, { autoAlpha: 0, y: 24, duration: .7, ease: "power2.out", clearProps: "all", scrollTrigger: { trigger: element, start: "top 92%", once: true } });
            });
            gsap.to(".vc-marquee-track", { xPercent: -50, repeat: -1, duration: 32, ease: "none", scrollTrigger: { trigger: ".vc-marquee", start: "top bottom", end: "bottom top", toggleActions: "play pause resume pause" } });
            gsap.fromTo(".vc-brand-media", { scale: .8, opacity: .2 }, { scale: 1, opacity: 1, ease: "none", scrollTrigger: { trigger: ".vc-compose", start: "top bottom", end: "top 35%", scrub: .5 } });
            gsap.to(".vc-brand-media", { opacity: .2, ease: "none", scrollTrigger: { trigger: ".vc-compose", start: "bottom 50%", end: "bottom top", scrub: .5 } });
        }, rootRef);
        media.add("(min-width: 941px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)", () => {
            const cards = gsap.utils.toArray(".vc-guidance-card");
            cards.slice(0, -1).forEach((card, i) => {
                gsap.to(card, { scale: .94, y: -8, ease: "none", scrollTrigger: { trigger: cards[i + 1], start: "top 85%", end: "top 55%", scrub: .6 } });
            });
        }, rootRef);
        return () => media.revert();
    }, []);
    const prepareEmail = (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const team = DEPARTMENTS[department];
        const name = String(data.get("name")).trim();
        const email = String(data.get("email")).trim();
        const subject = String(data.get("subject")).trim();
        const message = String(data.get("message")).trim();
        for (const [field, valid, hint] of [["name", name.length > 0, "Enter your name."], ["subject", subject.length >= 4, "Enter a subject of at least 4 characters."], ["message", message.length >= 10, "Add at least 10 characters describing your question."]]) {
            const input = event.currentTarget.elements.namedItem(field);
            input.setCustomValidity(valid ? "" : hint);
            if (!valid) { input.reportValidity(); return; }
        }
        const body = `Name: ${name}\nReply email: ${email}\nInstitution: ${String(data.get("institution")).trim() || "Not provided"}\n\n${message}`;
        setPrepared({ email: team.email, subject, body, href: `mailto:${team.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` });
    };
    return <div ref={rootRef} className="votara-landing lp-reference vc-contact">
        <a className="lp-skip" href="#contact-main">Skip to content</a><ContactNav />
        <main id="contact-main" className="vc-main overflow-x-hidden w-full max-w-full">
            <section className="vc-hero" aria-labelledby="vc-title"><div className="vc-hero-copy max-w-6xl">
                <p className="vc-eyebrow">We’re here to help</p><h1 id="vc-title">Let’s get you<br /><span>back to voting.</span></h1>
                <p className="vc-hero-description">A question, a hiccup, or something on your mind?<br className="vc-desktop-break" /> Find the right people to help you move forward.</p>
                <div className="vc-actions"><a className="lp-button lp-button-primary" href="#contact-message">Write to us<FiArrowUpRight aria-hidden="true" /></a><a className="lp-button vc-button-outline" href="#contact-faq">Find an answer<FiArrowDown aria-hidden="true" /></a></div>
            </div><div className="vc-hero-rule" aria-hidden="true"><span /></div></section>

            <section id="departments" className="vc-departments lp-container" aria-labelledby="vc-team-title">
                <div className="vc-section-intro" data-contact-reveal><h2 id="vc-team-title">The right conversation<br />starts here.</h2><p>Choose the team that fits your question.<br />We’ll help you find your next step.</p></div>
                <div className="vc-department-grid">{DEPARTMENTS.map(({ name, email, icon: Icon, description, detail }, i) => <article key={email} className={`vc-department ${department === i ? "is-active" : ""}`}>
                    <button type="button" aria-expanded={department === i} aria-controls={`vc-team-${i}`} onClick={() => { setDepartment(i); setPrepared(null); }}><span className="vc-department-icon"><Icon aria-hidden="true" /></span><span>{name}</span><FiArrowUpRight aria-hidden="true" /></button>
                    <div id={`vc-team-${i}`} className="vc-department-details"><p>{description}</p><p className="vc-team-detail" hidden={department !== i}>{detail}</p><a href={`mailto:${email}`}>{email}<FiArrowUpRight aria-hidden="true" /></a></div>
                </article>)}</div>
                <p className="vc-board-note"><FiLifeBuoy aria-hidden="true" /><span>Election schedules or voter eligibility? Your campus Electoral Board is the best place to start.</span><a href="#election-help">Learn more<FiArrowRight aria-hidden="true" /></a></p>
            </section>

            <section id="write-to-us" className="vc-compose" aria-labelledby="vc-compose-title">
                <div className="vc-marquee" aria-hidden="true"><div className="vc-marquee-track">{[0, 1].map((copy) => <span key={copy}>Here for your questions.<span className="vc-marquee-dot" />Here for your campus.<span className="vc-marquee-dot" /></span>)}</div></div>
                <div className="lp-container vc-compose-grid">
                    <div className="vc-compose-copy"><p className="vc-eyebrow">Let’s talk</p><h2 id="vc-compose-title">A little context.<br />A lot more clarity.</h2><p>Tell us what you need help with. We’ll prepare a message for the right team.</p>
                        <div className="vc-brand-media" aria-hidden="true"><span /><img src={votaraSymbol} alt="" width="80" height="68" /><span /></div>
                        <div className="vc-guidance">{GUIDANCE.map(({ title, text }, i) => <article className="vc-guidance-card" key={title} style={{ "--card-index": i }}><FiCheck aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
                    </div>
                    <form id="contact-message" className="vc-form" onSubmit={prepareEmail} onChange={(event) => { event.target.setCustomValidity?.(""); setPrepared(null); }}>
                        <h3>What can we help you with?</h3><p>Fields marked with an asterisk are required.</p>
                        <div className="vc-form-row"><label>Your name <span>*</span><input name="name" autoComplete="name" required maxLength="100" placeholder="Your full name" /></label><label>Email address <span>*</span><input name="email" type="email" autoComplete="email" required maxLength="254" placeholder="you@example.com" /></label></div>
                        <label>School or institution <span className="vc-optional">(optional)</span><input name="institution" autoComplete="organization" maxLength="160" placeholder="Your campus or organization" /></label>
                        <label>Who would you like to contact? <span>*</span><select name="department" value={department} onChange={(event) => setDepartment(Number(event.target.value))}>{DEPARTMENTS.map(({ name }, i) => <option value={i} key={name}>{name}</option>)}</select></label>
                        <label>Subject <span>*</span><input name="subject" required minLength="4" maxLength="160" placeholder="A short summary of your question" /></label>
                        <label>Your message <span>*</span><textarea name="message" required minLength="10" maxLength="3000" rows="5" placeholder="Tell us what happened and how we can help…" aria-describedby="vc-message-help" /></label>
                        <p id="vc-message-help" className="vc-form-hint"><FiShield aria-hidden="true" />Please don’t include passwords, OTPs, or ballot choices.</p>
                        <button className="lp-button lp-button-primary vc-submit" type="submit">Prepare email<FiArrowUpRight aria-hidden="true" /></button><p className="vc-email-note">Review your message, then open it in your email app to send.</p>
                        {prepared && <div ref={reviewRef} className="vc-email-review" role="status" tabIndex="-1"><h4>Your email is ready to review.</h4><p>To: <strong>{prepared.email}</strong></p><p>Subject: {prepared.subject}</p><pre>{prepared.body}</pre><a className="lp-button lp-button-primary" href={prepared.href}>Open email app<FiArrowUpRight aria-hidden="true" /></a><p>Your message hasn’t been sent yet. You’ll send it from your email app.</p></div>}
                    </form>
                </div>
            </section>

            <section id="contact-faq" className="vc-faq lp-container" aria-labelledby="vc-faq-title"><div data-contact-reveal><p className="vc-eyebrow">A little guidance</p><h2 id="vc-faq-title">One less<br />question mark.<span className="vc-inline-brand"><img src={votaraSymbol} alt="" width="40" height="34" /></span></h2><p>You might find what you need<br />before writing a message.</p><Link className="lp-text-link" to="/#faq">More about voting<FiArrowUpRight aria-hidden="true" /></Link></div>
                <div className="vc-faq-list">{QUESTIONS.map(({ title, text, label, to }, i) => <article key={title}><h3><button type="button" aria-expanded={question === i} aria-controls={`vc-answer-${i}`} onClick={() => setQuestion(question === i ? null : i)}>{title}<FiChevronDown aria-hidden="true" /></button></h3><div id={`vc-answer-${i}`} hidden={question !== i}><p>{text}</p><Link to={to}>{label}<FiArrowUpRight aria-hidden="true" /></Link></div></article>)}</div>
            </section>
            <section id="election-help" className="vc-election lp-container" aria-labelledby="vc-election-title"><div><FiShield aria-hidden="true" /><div><h2 id="vc-election-title">Your campus. Your election team.</h2><p>For election rules, eligibility, or candidate questions, follow your Electoral Board’s official channels. Already have an account? You can also report an issue from Settings.</p></div><Link className="lp-button lp-button-primary" to="/login">Go to your account<FiArrowUpRight aria-hidden="true" /></Link></div></section>
            <section className="vc-return" aria-labelledby="vc-return-title"><p className="vc-eyebrow">Whenever you’re ready</p><h2 id="vc-return-title">Your voice still<br />belongs here.</h2><Link className="lp-button lp-button-primary" to="/register">Register as a Voter<FiArrowRight aria-hidden="true" /></Link><Link className="vc-back-home" to="/">Back to home<FiArrowUpRight aria-hidden="true" /></Link></section>
        </main>
        <footer className="lp-footer"><div className="lp-container lp-footer-inner"><Link className="lp-logo" to="/" aria-label="Back to VOTARA home"><img src={votaraLogo} alt="Votara" width="110" height="32" /></Link><div><Link to="/#privacy">Privacy</Link><a href="#contact-faq">FAQs</a><Link to="/contact" aria-current="page">Contact Us</Link><Link to="/login">Login</Link></div><span>© {new Date().getFullYear()} VOTARA</span></div></footer>
    </div>;
}
