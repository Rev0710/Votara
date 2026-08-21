import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const NAV_ITEMS = [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "vote", label: "Vote", icon: "vote" },
    { key: "guidelines", label: "VOTERS GUIDELINES", icon: "info" },
    { key: "settings", label: "Settings", icon: "gear" },
    { key: "qrcode", label: "QR Code", icon: "qr" },
];

// Values read directly off the chart in the mockup (bar lengths / gridlines).
const CANDIDATES = [
    { name: "Ryan", votes: 15, color: "#1861FD" },
    { name: "Rex", votes: 45, color: "#70D1F7" },
    { name: "Mathew", votes: 27, color: "#FFE8D6" },
    { name: "Mark", votes: 38, color: "#000000" },
];
const CHART_MAX = 50;

const PROCESS_STEPS = ["Verify Identity", "Review candidates", "Cast your vote", "Submit and confirm", "Present QR"];

// Replace with a real value from your backend — mockup shows 00:07:42 remaining.
const ELECTION_DEADLINE = new Date(Date.now() + (0 * 3600 + 7 * 60 + 42) * 1000);

function useCountdown(target) {
    const [remaining, setRemaining] = useState(() => target - Date.now());
    useEffect(() => {
        const id = setInterval(() => setRemaining(target - Date.now()), 1000);
        return () => clearInterval(id);
    }, [target]);
    const clamped = Math.max(0, remaining);
    const hours = String(Math.floor(clamped / 3600000)).padStart(2, "0");
    const minutes = String(Math.floor((clamped % 3600000) / 60000)).padStart(2, "0");
    const seconds = String(Math.floor((clamped % 60000) / 1000)).padStart(2, "0");
    return { hours, minutes, seconds, expired: clamped === 0 };
}

const NavIcon = ({ type }) => {
    switch (type) {
        case "dashboard":
            return (
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                    <circle cx="4" cy="4" r="2" /><circle cx="10" cy="4" r="2" /><circle cx="16" cy="4" r="2" />
                    <circle cx="4" cy="10" r="2" /><circle cx="10" cy="10" r="2" /><circle cx="16" cy="10" r="2" />
                    <circle cx="4" cy="16" r="2" /><circle cx="10" cy="16" r="2" />
                </svg>
            );
        case "vote":
            return (
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                    <rect x="2" y="12" width="3" height="6" rx="1" />
                    <rect x="8.5" y="7" width="3" height="11" rx="1" />
                    <rect x="15" y="2" width="3" height="16" rx="1" />
                </svg>
            );
        case "info":
            return (
                <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="10" cy="10" r="8" />
                    <line x1="10" y1="9" x2="10" y2="14" strokeLinecap="round" />
                    <circle cx="10" cy="6.2" r="0.9" fill="currentColor" stroke="none" />
                </svg>
            );
        case "gear":
            return (
                <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
                    <path d="M10 6.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm7.4 3.5c0 .4 0 .8-.1 1.2l1.6 1.3-1.6 2.8-1.9-.6c-.6.5-1.3.9-2 1.2l-.3 2H8.9l-.3-2c-.7-.3-1.4-.7-2-1.2l-1.9.6-1.6-2.8 1.6-1.3a7 7 0 010-2.4L3.1 9.5l1.6-2.8 1.9.6c.6-.5 1.3-.9 2-1.2l.3-2h2.2l.3 2c.7.3 1.4.7 2 1.2l1.9-.6 1.6 2.8-1.6 1.3c.1.4.1.8.1 1.2z" />
                </svg>
            );
        case "qr":
            return (
                <svg viewBox="0 0 20 20" width="16" height="16">
                    <circle cx="10" cy="10" r="8" fill="currentColor" />
                    <path d="M10 2a8 8 0 000 16z" fill="#fff" opacity="0.85" />
                </svg>
            );
        default:
            return null;
    }
};

const VotaraLogo = () => (
    <svg viewBox="0 0 34 22" width="30" height="20">
        <path d="M2 2 L9 2 L5.5 9 Z" fill="#1861FD" />
        <circle cx="20" cy="6" r="4" fill="#1861FD" />
        <path d="M13 20c0-4.4 3.6-8 8-8s8 3.6 8 8z" fill="#1861FD" />
    </svg>
);

const StudentDashboard = () => {
    const navigate = useNavigate();
    const studentData = localStorage.getItem("votaraStudent");
    const student = studentData ? JSON.parse(studentData) : null;

    const [collapsed, setCollapsed] = useState(false);
    const [activeNav, setActiveNav] = useState("dashboard");
    const [calendarTab, setCalendarTab] = useState("Today");
    const [hasVoted, setHasVoted] = useState(false);
    const [activeFaq, setActiveFaq] = useState(null);

    const countdown = useCountdown(ELECTION_DEADLINE);

    const handleLogout = () => {
        localStorage.removeItem("votaraToken");
        localStorage.removeItem("votaraStudent");
        navigate("/student-login");
    };

    const handleNavClick = (key) => {
        setActiveNav(key);
        if (key === "vote") navigate("/vote");
        if (key === "guidelines") navigate("/voter-guidelines");
        if (key === "settings") navigate("/settings");
        if (key === "qrcode") navigate("/qr-code");
    };

    const handleVoteNow = () => {
        setHasVoted(true);
        navigate("/vote");
    };

    const fullName = student?.fullName || "Arthur Morgan";
    const firstName = fullName.split(" ")[0];
    const initials = fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

    return (
        <div className={`votara-shell ${collapsed ? "is-collapsed" : ""}`}>
            <aside className="votara-sidebar">
                <div className="sidebar-top">
                    <button className="collapse-btn" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar">☰</button>
                    <div className="brand">
                        <VotaraLogo />
                        <span className="brand-name">Votara</span>
                    </div>
                </div>

                <div className="profile-block">
                    <div className="profile-avatar">{initials}</div>
                    <span className="profile-name">{fullName}</span>
                    <button className="profile-link">View Profile</button>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.key}
                            className={`nav-item ${activeNav === item.key ? "is-active" : ""}`}
                            onClick={() => handleNavClick(item.key)}
                        >
                            <span className="nav-icon"><NavIcon type={item.icon} /></span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-bottom">
                    <button className="collapse-btn ghost" onClick={() => setCollapsed((c) => !c)} aria-label="Collapse sidebar">←</button>
                    <button className="logout-link" onClick={handleLogout}>Logout</button>
                </div>
            </aside>

            <div className="votara-main">
                <header className="votara-topbar">
                    <div className="search-wrap">
                        <span className="search-icon">🔍</span>
                        <input className="search-input" type="text" placeholder="Search" />
                    </div>
                    <div className="topbar-actions">
                        <button className="icon-btn" aria-label="Notifications">🔔</button>
                        <button className="icon-btn" aria-label="Help">?</button>
                        <div className="topbar-user">
                            <div className="topbar-avatar">{initials}</div>
                            <span>{firstName}</span>
                        </div>
                    </div>
                </header>

                <main className="votara-content">
                    <h1 className="greeting-title">Hello <strong>{firstName}!</strong></h1>
                    <p className="greeting-sub">Welcome to Votara</p>

                    <div className="grid">
                        <section className="card election-card">
                            <span className="card-eyebrow">Ongoing Elections</span>
                            <h2>President Student Council</h2>
                            <button className="vote-btn" onClick={handleVoteNow} disabled={hasVoted || countdown.expired}>
                                {countdown.expired ? "Polls closed" : hasVoted ? "Voted" : "Vote"}
                            </button>
                        </section>

                        <section className="card calendar-card">
                            <div className="calendar-head">
                                <h3>Calendar</h3>
                                <div className="calendar-tabs">
                                    {["Today", "Next week", "This Month"].map((t) => (
                                        <button key={t} className={`tab ${calendarTab === t ? "is-active" : ""}`} onClick={() => setCalendarTab(t)}>
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="calendar-hours">
                                {["7:00", "8:00", "9:00", "10:00", "11:00", "11:00"].map((h, i) => (
                                    <span key={i}>{h}</span>
                                ))}
                            </div>
                            <div className="calendar-row">
                                <span className="calendar-date">September 19</span>
                                <div className="event-pill">
                                    <span className="event-pill-title">President Student Council</span>
                                    <div className="event-countdown">
                                        <div className="countdown-box">
                                            <span className="countdown-num">{countdown.hours}</span>
                                            <span className="countdown-label">hrs</span>
                                        </div>
                                        <div className="countdown-box">
                                            <span className="countdown-num">{countdown.minutes}</span>
                                            <span className="countdown-label">min</span>
                                        </div>
                                        <div className="countdown-box">
                                            <span className="countdown-num">{countdown.seconds}</span>
                                            <span className="countdown-label">sec</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="card results-card">
                            <h3 className="results-title">Live Results</h3>
                            <div className="results-head">
                                <button className="chevron">‹</button>
                                <span>President Student Council</span>
                                <button className="chevron">›</button>
                            </div>
                            <div className="bars">
                                {CANDIDATES.map((c) => {
                                    const pct = Math.round((c.votes / CHART_MAX) * 100);
                                    return (
                                        <div className="bar-row" key={c.name}>
                                            <span className="bar-name">{c.name}</span>
                                            <div className="bar-track">
                                                <div className="bar-fill" style={{ width: `${pct}%`, background: c.color }} />
                                            </div>
                                            <span className="bar-pct" style={{ color: c.color === "#FFE8D6" ? "#e5a97a" : c.color }}>
                                                {c.votes}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="card process-card">
                            <h3>Voting Process</h3>
                            <ol className="process-steps">
                                {PROCESS_STEPS.map((step, i) => (
                                    <li key={step} className={i === PROCESS_STEPS.length - 1 ? "is-pending" : ""}>
                                        <span className="step-num">{i + 1}</span>
                                        <span className="step-text">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </section>

                        <section className="card announce-card">
                            <h3>Announcements</h3>
                            <p>Polls close in before 4pm</p>
                            <button className="link-btn" onClick={() => handleNavClick("vote")}>See all ›</button>
                        </section>

                        <section className="faq-row">
                            <h3 className="faq-title">FAQs</h3>
                            <div className="faq-pills">
                                {["QUESTION 1", "QUESTION 2", "QUESTION 3"].map((label, i) => (
                                    <button
                                        key={label}
                                        className={`faq-pill ${activeFaq === i ? "is-active" : ""}`}
                                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentDashboard;
