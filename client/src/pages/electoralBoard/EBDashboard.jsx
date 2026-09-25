import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./EBDashboard.css";

import api from "../../services/api";


import Registrations from "./Registrations";
import LateEnrolleeManagement from "./LateEnrolleeManagement";
import PartyListManagement from "./PartyListManagement";
import ElectionManagement from "./ElectionManagement";
import CandidateManagement from "./EBCandidateManagement";
import KioskManagement from "./KioskManagement";
import VotingMonitoring from "./VotingMonitoring";
import ResultsReports from "./ResultsReports";
import AuditLogs from "./AuditLogs";
import Settings from "./Settings";

// =====================================================
// ELECTORAL BOARD DASHBOARD
// =====================================================


// Use the JWT that actually belongs to the Electoral Board.
// Both staff and EB tokens may exist in localStorage, so do not
// blindly prefer the staff token.
const getEBAuthToken = () => {
    const candidates = [
        localStorage.getItem("votaraEBToken"),
        localStorage.getItem("votaraStaffToken"),
    ].filter(Boolean);

    for (const token of candidates) {
        try {
            const payload = JSON.parse(
                atob(
                    token
                        .split(".")[1]
                        .replace(/-/g, "+")
                        .replace(/_/g, "/")
                )
            );

            if (payload?.role === "electoral_board") {
                return token;
            }
        } catch {
            // Ignore malformed tokens and try the next token.
        }
    }

    return null;
};


const EBDashboard = () => {

    const navigate = useNavigate();

    const [ebUser, setEbUser] = useState(null);

    const [activeSection, setActiveSection] =
        useState("dashboard");

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [profileOpen, setProfileOpen] =
        useState(false);

    // =====================================================
    // DASHBOARD STATISTICS
    // =====================================================

    const [dashboardStats, setDashboardStats] = useState({
        registeredStudents: 0,
        pendingApplications: 0,
        approvedStudents: 0,
        activeCandidates: 0,
        votesCast: 0,
    });

    const [currentElection, setCurrentElection] = useState(null);

    const [dashboardLoading, setDashboardLoading] =
        useState(true);

    const [dashboardError, setDashboardError] =
        useState("");


    // =====================================================
    // LOAD EB USER
    // =====================================================

    useEffect(() => {

        const savedUser =
            localStorage.getItem("votaraEBUser");

        if (savedUser) {

            try {

                setEbUser(
                    JSON.parse(savedUser)
                );

            } catch (error) {

                console.error(
                    "Invalid EB user data."
                );

                localStorage.removeItem(
                    "votaraEBUser"
                );
            }
        }

    }, []);


    // =====================================================
    // LOAD DASHBOARD STATISTICS
    // =====================================================

    const loadDashboardStats = async () => {

        try {

            setDashboardLoading(true);
            setDashboardError("");

            const token = getEBAuthToken();

            if (!token) {
                setDashboardError(
                    "Electoral Board authentication is required. Please log in again as an Electoral Board account."
                );
                setDashboardLoading(false);
                return;
            }

            const response =
                await api.get(
                    "/registration/eb/dashboard-stats",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

            const data =
                response?.data || {};

            const statistics =
                data.statistics || {};

            setDashboardStats({

                registeredStudents:
                    Number(
                        statistics.registeredStudents
                    ) || 0,

                pendingApplications:
                    Number(
                        statistics.pendingApplications
                    ) || 0,

                approvedStudents:
                    Number(
                        statistics.approvedStudents
                    ) || 0,

                activeCandidates:
                    Number(
                        statistics.activeCandidates
                    ) || 0,

                votesCast:
                    Number(
                        statistics.votesCast
                    ) || 0,

            });

            setCurrentElection(
                data.currentElection || null
            );

        } catch (error) {

            console.error(
                "❌ Unable to load EB dashboard statistics:",
                error
            );

            setDashboardError(
                error?.response?.data?.message ||
                "Unable to load the latest dashboard statistics."
            );

        } finally {

            setDashboardLoading(false);

        }

    };


    useEffect(() => {

        if (
            activeSection !==
            "dashboard"
        ) {
            return;
        }

        loadDashboardStats();

        const refreshInterval =
            setInterval(
                loadDashboardStats,
                30000
            );

        return () =>
            clearInterval(
                refreshInterval
            );

    }, [activeSection]);


    // =====================================================
    // LOGOUT
    //=====================================================

    const handleLogout = () => {

        localStorage.removeItem(
            "votaraStaffToken"
        );

        localStorage.removeItem(
            "votaraStaffUser"
        );

        localStorage.removeItem(
            "votaraEBToken"
        );

        localStorage.removeItem(
            "votaraEBUser"
        );

        navigate(
            "/account-selection"
        );
    };


    // =====================================================
    // SIDEBAR NAVIGATION
    // =====================================================

    const handleNavigation = (section) => {

        setActiveSection(section);

        setSidebarOpen(false);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    // =====================================================
    // DISPLAY NAME
    // =====================================================

    const displayName =
        ebUser?.fullName ||
        ebUser?.full_name ||
        "Electoral Board Member";


    const displayEmail =
        ebUser?.email ||
        "Electoral Board Account";

    const profileImage =
        ebUser?.profilePicture ||
        ebUser?.profile_picture ||
        ebUser?.avatar ||
        ebUser?.avatarUrl ||
        ebUser?.photoURL ||
        ebUser?.image ||
        localStorage.getItem("votaraEBProfilePicture") ||
        "data:image/png;base64,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";

    const handleProfileToggle = () => {
        setProfileOpen((current) => !current);
    };

    const handleProfileAction = (action) => {
        setProfileOpen(false);

        if (action === "settings") {
            handleNavigation("settings");
        }
    };


    // =====================================================
    // EB MENU
    // =====================================================

    const menuItems = [

        {
            id: "dashboard",
            label: "Dashboard",
            icon: "▦",
        },

        {
            id: "registrations",
            label: "Registration Management",
            icon: "▤",
        },

        {
            id: "lateEnrollees",
            label: "Late Enrollee Management",
            icon: "◈",
        },

        {
            id: "partyLists",
            label: "Party List Management",
            icon: "▰",
        },

        {
            id: "candidates",
            label: "Candidate Management",
            icon: "♙",
        },

        {
            id: "election",
            label: "Election Management",
            icon: "◉",
        },

        // =================================================
        // KIOSK MANAGEMENT
        // =================================================

        {
            id: "kiosk",
            label: "Kiosk Management",
            icon: "▣",
        },

        {
            id: "monitoring",
            label: "Voting Monitoring",
            icon: "◫",
        },

        {
            id: "results",
            label: "Results & Reports",
            icon: "▥",
        },

        {
            id: "logs",
            label: "Audit Logs",
            icon: "◌",
        },

    ];


    // =====================================================
    // RENDER
    // =====================================================

    const turnoutPercent = dashboardStats.registeredStudents > 0
        ? Math.min(100, Math.round((dashboardStats.votesCast / dashboardStats.registeredStudents) * 1000) / 10)
        : 0;

    return (
        <div className="eb-dashboard-shell" style={styles.app}>

            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {sidebarOpen && (
                <div
                    className="eb-mobile-overlay"
                    style={styles.overlay}
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                />
            )}

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                className={`eb-sidebar ${sidebarOpen ? "eb-sidebar-open" : ""}`}
                style={{
                    ...styles.sidebar,
                    ...(sidebarOpen
                        ? styles.sidebarMobileOpen
                        : {}),
                }}
            >


                {/* =================================================
                    LOGO
                ================================================= */}

                <div
                    style={
                        styles.logoContainer
                    }
                >

                    <div
                        style={
                            styles.logoIcon
                        }
                    >
                        V
                    </div>


                    <div>

                        <div
                            style={
                                styles.logoText
                            }
                        >
                            VOTARA
                        </div>


                        <div
                            style={
                                styles.logoSubtext
                            }
                        >
                            Electoral Board
                        </div>

                    </div>

                </div>


                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <div
                    style={
                        styles.navContainer
                    }
                >

                    <div
                        style={
                            styles.navTitle
                        }
                    >
                        MAIN MENU
                    </div>


                    {menuItems.map(
                        (item) => (

                            <button
                                key={item.id}
                                type="button"
                                onClick={() =>
                                    handleNavigation(
                                        item.id
                                    )
                                }
                                style={{
                                    ...styles.navItem,

                                    ...(activeSection ===
                                    item.id
                                        ? styles.navItemActive
                                        : {}),
                                }}
                            >

                                <span
                                    style={
                                        styles.navIcon
                                    }
                                >
                                    {item.icon}
                                </span>


                                <span>
                                    {item.label}
                                </span>

                            </button>

                        )
                    )}

                </div>


                {/* =================================================
                    SIDEBAR FOOTER
                ================================================= */}

                <div
                    style={
                        styles.sidebarFooter
                    }
                >

                    <button
                        type="button"
                        onClick={() =>
                            handleNavigation(
                                "settings"
                            )
                        }
                        style={{
                            ...styles.navItem,

                            ...(activeSection ===
                            "settings"
                                ? styles.navItemActive
                                : {}),
                        }}
                    >

                        <span
                            style={
                                styles.navIcon
                            }
                        >
                            ⚙
                        </span>

                        <span>
                            Settings
                        </span>

                    </button>


                    <button
                        type="button"
                        onClick={
                            handleLogout
                        }
                        style={
                            styles.logoutButton
                        }
                    >

                        <span>
                            ↪
                        </span>

                        Logout

                    </button>

                </div>

            </aside>


            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main className="eb-main" style={styles.main}>

                {/* =================================================
                    TOP BAR
                ================================================= */}

                <header className="eb-topbar" style={styles.topbar}>
                    <div className="eb-brand">
                        <div><img src="/src/images/Votara.png" alt="eb-brand-mark" className="eb-brand-mark"/></div>
                        <div className="eb-brand-name">Votara</div>
                    </div>

                    <nav className="eb-top-nav" aria-label="Electoral Board navigation">
                        {menuItems
                            .filter((item) => !["partyLists", "monitoring", "results", "lateEnrollees"].includes(item.id))
                            .map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    className={`eb-top-nav-item ${activeSection === item.id ? "active" : ""}`}
                                    onClick={() => handleNavigation(item.id)}
                                >
                                    {item.label === "Dashboard" ? "Overview" : item.label.replace(" Management", "")}
                                </button>
                            ))}
                    </nav>

                    <div className="eb-top-actions">
                        <div className="eb-duty-badge">
                            <span className="eb-duty-dot" />
                            On duty
                        </div>
                        <button type="button" aria-label="Notifications">
                            <img src="/src/images/bell.png" alt="eb-icon-button" className="eb-icon-button"  />
                        </button>
                        <div className="eb-profile-wrapper">
                            <button
                                type="button"
                                className="eb-top-profile"
                                onClick={handleProfileToggle}
                                aria-label="Open profile menu"
                                aria-expanded={profileOpen}
                            >
                                <div className="eb-top-avatar">
                                    {profileImage ? (
                                        <img src={profileImage} alt="" />
                                    ) : (
                                        getInitials(displayName)
                                    )}
                                </div>
                                <div className="eb-top-profile-text">
                                    <strong>{displayName}</strong>
                                    <span>Electoral Board</span>
                                </div>
                            </button>

                            {profileOpen && (
                                <div className="eb-profile-dropdown">
                                    <div className="eb-profile-dropdown-header">
                                        <div className="eb-dropdown-avatar">
                                            {profileImage ? (
                                                <img src={profileImage} alt="" />
                                            ) : (
                                                getInitials(displayName)
                                            )}
                                        </div>
                                        <div className="eb-dropdown-user-info">
                                            <strong>{displayName}</strong>
                                            <span>{displayEmail}</span>
                                        </div>
                                        <span className="eb-dropdown-more">•••</span>
                                    </div>

                                    <button type="button" onClick={() => handleProfileAction("profile")}>
                                        <span className="eb-dropdown-icon">♙</span>
                                        Profile
                                    </button>

                                    <button type="button" onClick={() => handleProfileAction("notification")}>
                                        <span className="eb-dropdown-icon">♧</span>
                                        Notification
                                    </button>

                                    <button type="button" onClick={() => handleProfileAction("settings")}>
                                        <span className="eb-dropdown-icon">⚙</span>
                                        Settings
                                    </button>

                                    <div className="eb-dropdown-divider" />

                                    <button
                                        type="button"
                                        className="logout"
                                        onClick={() => {
                                            setProfileOpen(false);
                                            handleLogout();
                                        }}
                                    >
                                        <span className="eb-dropdown-icon">↪</span>
                                        Log out
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className="eb-mobile-menu-button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Open navigation"
                        >
                            ☰
                        </button>
                    </div>
                </header>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <section className="eb-content" style={styles.content}>

                    {/* =================================================
                        DASHBOARD OVERVIEW
                    ================================================= */}

                    {activeSection === "dashboard" && (
                        <div className="eb-dashboard-home">
                            <div className="eb-dashboard-heading">
                                <div>
                                    <h1>Election Operation Dashboard</h1>
                                    <p>Registration, verification, and election activity for the current VOTARA election.</p>
                                </div>
                                <button
                                    type="button"
                                    className="eb-create-election-button"
                                    onClick={() => handleNavigation("election")}
                                >
                                    Create Election
                                </button>
                            </div>

                            <div className="eb-dashboard-stats">
                                <StatCard title="Student Registered" value={dashboardLoading ? "..." : dashboardStats.registeredStudents} description="Registered students" icon="✓" onClick={() => handleNavigation("registrations")} />
                                <StatCard title="Pending Registration" value={dashboardLoading ? "..." : dashboardStats.pendingApplications} description="Awaiting review" icon="▤" onClick={() => handleNavigation("registrations")} />
                                <StatCard title="Active Candidates" value={dashboardLoading ? "..." : dashboardStats.activeCandidates} description="Currently active" icon="♙" onClick={() => handleNavigation("candidates")} />
                                <StatCard title="Votes Cast" value={dashboardLoading ? "..." : dashboardStats.votesCast} description="Recorded ballots" icon="◉" onClick={() => handleNavigation("monitoring")} />
                            </div>

                            <div className="eb-dashboard-main-grid">
                                <section className="eb-panel eb-monitor-panel">
                                    <div className="eb-panel-header">
                                        <div>
                                            <h2>Election Monitoring</h2>
                                            <p>Live turnout and current election activity.</p>
                                        </div>
                                        <button type="button" className="eb-live-chip" onClick={() => handleNavigation("monitoring")}>
                                            <span /> Live Monitoring
                                        </button>
                                    </div>

                                    <div className="eb-monitor-content">
                                        <div className="eb-turnout-block">
                                            <div className="eb-turnout-ring" style={{"--turnout": `${turnoutPercent * 3.6}deg`}}>
                                                <div className="eb-turnout-center">
                                                    <strong>{turnoutPercent}%</strong>
                                                    <span>Vote Turnout</span>
                                                </div>
                                            </div>
                                            <div className="eb-turnout-total">
                                                <strong>{dashboardStats.votesCast} / {dashboardStats.registeredStudents}</strong>
                                                <span>Total votes cast</span>
                                            </div>
                                        </div>

                                        <div className="eb-activity-chart">
                                            <div className="eb-chart-head">
                                                <div>Registered Student Votes</div>
                                                <strong>{dashboardStats.votesCast}</strong>
                                            </div>
                                            <div className="eb-chart-area">
                                                <div className="eb-chart-grid-line line-1" />
                                                <div className="eb-chart-grid-line line-2" />
                                                <div className="eb-chart-grid-line line-3" />
                                                <div className="eb-chart-bars">
                                                    <span style={{height: "28%"}} />
                                                    <span style={{height: "38%"}} />
                                                    <span style={{height: "45%"}} />
                                                    <span style={{height: "54%"}} />
                                                    <span style={{height: "63%"}} />
                                                    <span style={{height: "72%"}} />
                                                    <span style={{height: "82%"}} />
                                                    <span style={{height: `${Math.max(18, Math.min(94, turnoutPercent))}%`}} />
                                                </div>
                                            </div>
                                            <div className="eb-chart-caption">Election activity overview · values update automatically</div>
                                        </div>
                                    </div>
                                </section>

                                <aside className="eb-panel eb-quick-panel">
                                    <div className="eb-panel-header compact">
                                        <div>
                                            <h2>Quick Actions</h2>
                                            <p>Common Electoral Board tasks</p>
                                        </div>
                                    </div>
                                    <div className="eb-quick-actions">
                                        <button type="button" className="primary" onClick={() => handleNavigation("monitoring")}>Monitor Live Voting <span>→</span></button>
                                        <button type="button" onClick={() => handleNavigation("results")}>View Election Results <span>→</span></button>
                                        <button type="button" onClick={() => handleNavigation("partyLists")}>Manage Party List <span>→</span></button>
                                        <button type="button" onClick={() => handleNavigation("results")}>Generate Reports <span>→</span></button>
                                    </div>
                                </aside>
                            </div>

                            <div className="eb-dashboard-bottom-grid">
                                <section className="eb-panel eb-review-panel">
                                    <div className="eb-panel-header">
                                        <div>
                                            <h2>Registration Review Queue</h2>
                                            <p>Current registration status and Electoral Board workload.</p>
                                        </div>
                                        <button type="button" className="eb-view-all" onClick={() => handleNavigation("registrations")}>View All →</button>
                                    </div>
                                    <div className="eb-review-table">
                                        <div className="eb-review-row eb-review-head">
                                            <span>Metric</span><span>Count</span><span>Status</span><span>Action</span>
                                        </div>
                                        <div className="eb-review-row">
                                            <span>Pending registrations</span><strong>{dashboardStats.pendingApplications}</strong><em className="pending">Needs review</em><button type="button" onClick={() => handleNavigation("registrations")}>View</button>
                                        </div>
                                        <div className="eb-review-row">
                                            <span>Approved students</span><strong>{dashboardStats.approvedStudents}</strong><em className="approved">Approved</em><button type="button" onClick={() => handleNavigation("registrations")}>View</button>
                                        </div>
                                        <div className="eb-review-row">
                                            <span>Registered students</span><strong>{dashboardStats.registeredStudents}</strong><em className="active">Active</em><button type="button" onClick={() => handleNavigation("registrations")}>View</button>
                                        </div>
                                        <div className="eb-review-row">
                                            <span>Active candidates</span><strong>{dashboardStats.activeCandidates}</strong><em className="active">Active</em><button type="button" onClick={() => handleNavigation("candidates")}>View</button>
                                        </div>
                                    </div>
                                </section>

                                <section className="eb-panel eb-standing-panel">
                                    <div className="eb-panel-header">
                                        <div>
                                            <h2>Election Readiness</h2>
                                            <p>Key operational areas for the current election.</p>
                                        </div>
                                    </div>
                                    <div className="eb-readiness-list">
                                        <button type="button" onClick={() => handleNavigation("registrations")}>
                                            <span className="eb-readiness-icon">✓</span><div><strong>Student Registration</strong><small>{dashboardStats.registeredStudents} registered students</small></div><span className="eb-readiness-bar"><i style={{width: "86%"}} /></span>
                                        </button>
                                        <button type="button" onClick={() => handleNavigation("candidates")}>
                                            <span className="eb-readiness-icon">♙</span><div><strong>Candidate Management</strong><small>{dashboardStats.activeCandidates} active candidates</small></div><span className="eb-readiness-bar"><i style={{width: "72%"}} /></span>
                                        </button>
                                        <button type="button" onClick={() => handleNavigation("monitoring")}>
                                            <span className="eb-readiness-icon">◉</span><div><strong>Voting Monitoring</strong><small>{dashboardStats.votesCast} recorded votes</small></div><span className="eb-readiness-bar"><i style={{width: `${Math.max(8, Math.min(100, turnoutPercent))}%`}} /></span>
                                        </button>
                                        <button type="button" onClick={() => handleNavigation("election")}>
                                            <span className="eb-readiness-icon">◈</span><div><strong>Election Configuration</strong><small>{currentElection?.title || "No election configured"}</small></div><span className="eb-status-text">{formatElectionStatus(currentElection?.status)}</span>
                                        </button>
                                    </div>
                                </section>
                            </div>

                            {dashboardError && (
                                <div className="eb-dashboard-error">{dashboardError}</div>
                            )}
                        </div>
                    )}


                    {/* =================================================
                        REGISTRATIONS
                    ================================================= */}

                    {activeSection ===
                        "registrations" && (
                        <Registrations
                            title="Registration Management"
                            icon="▤"
                            description="Review, verify, approve, reject, or request corrections for student registration applications."
                            steps={[
                                "View pending registration applications",
                                "Check official Student ID and enrollment information",
                                "Review submitted requirements",
                                "Review identity verification and selfie",
                                "Approve, reject, or request correction",
                                "Generate temporary password after approval",
                            ]}
                            onNavigate={handleNavigation}
                        />
                    )}

                    {/* =================================================
                        LATE ENROLLEES
                    ================================================= */}

                    {activeSection === "lateEnrollees" && (
                        <LateEnrolleeManagement
                        onNavigate={handleNavigation}
                        />
                        )}


                    {/* =================================================
                        PARTY LIST MANAGEMENT
                    ================================================= */}

                    {activeSection === "partyLists" && (
                        <PartyListManagement />
                    )}


                    {/* =================================================
                        CANDIDATE MANAGEMENT
                    ================================================= */}

                    {activeSection ===
                        "candidates" && (

                        <CandidateManagement />

                    )}


                    {/* =================================================
                        ELECTION MANAGEMENT
                    ================================================= */}

                        {activeSection === "election" && (
                            <ElectionManagement />
                        )}


                    {/* =================================================
                        KIOSK MANAGEMENT
                    ================================================= */}

                    {activeSection ===
                        "kiosk" && (

                        <KioskManagement />

                    )}


                    {/* =================================================
                        VOTING MONITORING
                    ================================================= */}

                    {activeSection ===
                        "monitoring" && (

                        <VotingMonitoring />

                    )}


                    {/* =================================================
                        RESULTS & REPORTS
                    ================================================= */}

                    {activeSection ===
                        "results" && (

                        <ResultsReports />

                    )}


                    {/* =================================================
                        AUDIT LOGS
                    ================================================= */}

                    {activeSection ===
                        "logs" && (

                        <AuditLogs />

                    )}


                    {/* =================================================
                        SETTINGS
                    ================================================= */}

                    {activeSection ===
                        "settings" && (

                        <Settings />

                    )}

                </section>

            </main>

        </div>
    );
};


// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
    title,
    value,
    description,
    icon,
    onClick,
}) => {

    return (

        <button
            className="eb-stat-card"
            type="button"
            onClick={onClick}
            style={styles.statCard}
        >

            <div
                style={
                    styles.statTop
                }
            >

                <div
                    style={
                        styles.statIcon
                    }
                >
                    {icon}
                </div>


                <span
                    style={
                        styles.statArrow
                    }
                >
                    →
                </span>

            </div>


            <div
                style={
                    styles.statValue
                }
            >
                {value}
            </div>


            <div
                style={
                    styles.statTitle
                }
            >
                {title}
            </div>


            <div
                style={
                    styles.statDescription
                }
            >
                {description}
            </div>

        </button>

    );
};


// =====================================================
// OPERATION CARD
// =====================================================

const OperationCard = ({
    icon,
    title,
    description,
    buttonText,
    onClick,
}) => {

    return (

        <div
            style={
                styles.operationCard
            }
        >

            <div
                style={
                    styles.operationIcon
                }
            >
                {icon}
            </div>


            <h3
                style={
                    styles.operationTitle
                }
            >
                {title}
            </h3>


            <p
                style={
                    styles.operationDescription
                }
            >
                {description}
            </p>


            <button
                type="button"
                onClick={onClick}
                style={
                    styles.operationButton
                }
            >

                {buttonText}

                <span>
                    →
                </span>

            </button>

        </div>

    );
};


// =====================================================
// SECURITY CARD
// =====================================================

const SecurityCard = ({
    title,
    description,
    status,
}) => {

    return (

        <div
            style={
                styles.securityCard
            }
        >

            <div
                style={
                    styles.securityTop
                }
            >

                <div
                    style={
                        styles.securityIcon
                    }
                >
                    ✓
                </div>


                <span
                    style={
                        styles.activeBadge
                    }
                >
                    {status}
                </span>

            </div>


            <h3
                style={
                    styles.securityTitle
                }
            >
                {title}
            </h3>


            <p
                style={
                    styles.securityDescription
                }
            >
                {description}
            </p>

        </div>

    );
};


// =====================================================
// MODULE PLACEHOLDER
// =====================================================

const ModulePlaceholder = ({
    title,
    icon,
    description,
    steps,
}) => {

    return (

        <div>

            <div style={styles.moduleHeader}>

                <div
                    style={
                        styles.moduleIcon
                    }
                >
                    {icon}
                </div>


                <div>

                    <h2
                        style={
                            styles.moduleTitle
                        }
                    >
                        {title}
                    </h2>


                    <p
                        style={
                            styles.moduleDescription
                        }
                    >
                        {description}
                    </p>

                </div>

            </div>


            <div
                style={
                    styles.moduleNotice
                }
            >

                <div
                    style={
                        styles.noticeIcon
                    }
                >
                    !
                </div>


                <div>

                    <strong>
                        Module ready for integration
                    </strong>


                    <p>
                        The dashboard section is
                        prepared. The next step is
                        connecting this module to
                        the VOTARA backend and
                        Supabase.
                    </p>

                </div>

            </div>


            <div
                style={
                    styles.processCard
                }
            >

                <h3
                    style={
                        styles.processTitle
                    }
                >
                    Important Process
                </h3>


                <div
                    style={
                        styles.processList
                    }
                >

                    {steps.map(
                        (step, index) => (

                            <div
                                key={`${title}-step-${index}`}
                                style={
                                    styles.processItem
                                }
                            >

                                <div
                                    style={
                                        styles.processNumber
                                    }
                                >
                                    {index + 1}
                                </div>


                                <div
                                    style={
                                        styles.processText
                                    }
                                >
                                    {step}
                                </div>

                            </div>

                        )
                    )}

                </div>

            </div>

        </div>

    );
};


// =====================================================
// HELPERS
// =====================================================

const getInitials = (name) => {

    if (!name) {
        return "EB";
    }


    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

};


const getFirstName = (name) => {

    if (!name) {
        return "Member";
    }


    return name
        .trim()
        .split(/\s+/)[0];

};


const formatElectionStatus = (status) => {

    const labels = {

        draft: "DRAFT",
        scheduled: "SCHEDULED",
        open: "OPEN",
        closed: "COMPLETED",
        cancelled: "CANCELLED",

    };

    return (
        labels[String(status || "").toLowerCase()] ||
        "NO ELECTION"
    );

};


const getElectionStatusStyle = (status) => {

    const normalizedStatus =
        String(status || "").toLowerCase();

    if (
        normalizedStatus === "open"
    ) {

        return {
            background: "#eaf9f0",
            color: "#16a34a",
        };

    }

    if (
        normalizedStatus === "cancelled"
    ) {

        return {
            background: "#fff1f1",
            color: "#dc2626",
        };

    }

    if (
        normalizedStatus === "closed"
    ) {

        return {
            background: "#f1f5f9",
            color: "#475569",
        };

    }

    return {};

};


const getSectionTitle = (section) => {

    const titles = {

        registrations:
            "Registration Management",

        lateEnrollees:
            "Late Enrollee Management",

        partyLists:
            "Party List Management",

        candidates:
            "Candidate Management",

        election:
            "Election Management",

        kiosk:
            "Kiosk Management",

        monitoring:
            "Voting Monitoring",

        results:
            "Results & Reports",

        logs:
            "Audit Logs",

        settings:
            "Settings",

    };


    return (
        titles[section] ||
        "Electoral Board Dashboard"
    );

};


// =====================================================
// STYLES
// =====================================================

const styles = {

    app: {
        minHeight: "100vh",
        background: "#f4f7fb",
        display: "flex",
        fontFamily:
            "'Poppins', 'Inter', Arial, sans-serif",
        color: "#172033",
    },


    overlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(0, 0, 0, 0.45)",
        zIndex: 90,
    },


    sidebar: {
        width: "270px",
        minWidth: "270px",
        minHeight: "100vh",
        background: "#071426",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow:
            "8px 0 30px rgba(0, 0, 0, 0.08)",
        transition:
            "transform 0.25s ease",
    },


    sidebarMobileOpen: {
        transform:
            "translateX(0)",
    },


    logoContainer: {
        height: "90px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "0 24px",
        borderBottom:
            "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
    },


    logoIcon: {
        width: "44px",
        height: "44px",
        borderRadius: "12px",
        background: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        fontWeight: "800",
        boxShadow:
            "0 8px 20px rgba(38,110,255,0.30)",
    },


    logoText: {
        fontSize: "20px",
        fontWeight: "800",
        letterSpacing: "1px",
    },


    logoSubtext: {
        fontSize: "11px",
        color: "#9daac0",
        marginTop: "2px",
    },


    navContainer: {
        flex: 1,
        padding: "24px 14px",
        overflowY: "auto",
    },


    navTitle: {
        fontSize: "10px",
        fontWeight: "800",
        color: "#71809a",
        letterSpacing: "1.4px",
        marginBottom: "12px",
        padding: "0 12px",
    },


    navItem: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        border: "none",
        background: "transparent",
        color: "#aeb9cb",
        padding: "12px 13px",
        borderRadius: "10px",
        marginBottom: "5px",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        fontSize: "12px",
        fontWeight: "600",
        transition:
            "all 0.2s ease",
    },


    navItemActive: {
        background: "#266EFF",
        color: "#ffffff",
        boxShadow:
            "0 8px 18px rgba(38,110,255,0.20)",
    },


    navIcon: {
        width: "18px",
        minWidth: "18px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "14px",
    },


    sidebarFooter: {
        padding: "14px",
        borderTop:
            "1px solid rgba(255,255,255,0.08)",
    },


    logoutButton: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        border: "none",
        background:
            "rgba(220,38,38,0.10)",
        color: "#ff8b8b",
        padding: "12px 13px",
        borderRadius: "10px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "12px",
        fontWeight: "700",
        marginTop: "5px",
        textAlign: "left",
    },


    main: {
        marginLeft: "270px",
        width: "calc(100% - 270px)",
        minHeight: "100vh",
        background: "#f4f7fb",
    },


    topbar: {
        height: "84px",
        background: "#ffffff",
        borderBottom:
            "1px solid #e7ebf2",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 50,
    },


    topbarLeft: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
    },


    menuButton: {
        display: "none",
        border: "none",
        background: "#f4f7fb",
        borderRadius: "8px",
        width: "38px",
        height: "38px",
        cursor: "pointer",
        fontSize: "18px",
    },


    pageTitle: {
        margin: 0,
        fontSize: "21px",
        fontWeight: "800",
        color: "#172033",
    },


    pageSubtitle: {
        margin: "4px 0 0",
        fontSize: "12px",
        color: "#7c8798",
    },


    profileArea: {
        display: "flex",
        alignItems: "center",
        gap: "13px",
    },


    profileText: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "2px",
    },


    profileTextStrong: {
        fontSize: "12px",
    },


    profileTextSpan: {
        fontSize: "11px",
        color: "#7c8798",
    },


    avatar: {
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        background: "#266EFF",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "800",
        boxShadow:
            "0 7px 18px rgba(38,110,255,0.20)",
    },


    content: {
        padding: "30px 32px 40px",
        maxWidth: "1500px",
        margin: "0 auto",
    },


    welcomeCard: {
        background:
            "linear-gradient(135deg, #1e3a8a, #266EFF)",
        color: "#ffffff",
        borderRadius: "18px",
        padding: "28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        marginBottom: "30px",
        overflow: "hidden",
    },


    welcomeLabel: {
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "1.5px",
        opacity: 0.8,
        marginBottom: "6px",
    },


    welcomeTitle: {
        margin: 0,
        fontSize: "26px",
        fontWeight: "800",
    },


    welcomeDescription: {
        margin: "10px 0 0",
        maxWidth: "700px",
        fontSize: "12px",
        lineHeight: 1.7,
        opacity: 0.88,
    },


    welcomeIcon: {
        width: "80px",
        height: "80px",
        minWidth: "80px",
        borderRadius: "22px",
        background:
            "rgba(255,255,255,0.13)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "38px",
        fontWeight: "800",
    },


    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: "16px",
    },


    sectionTitle: {
        margin: 0,
        fontSize: "17px",
        fontWeight: "800",
        color: "#172033",
    },


    sectionDescription: {
        margin: "4px 0 0",
        fontSize: "12px",
        color: "#7c8798",
    },


    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px",
        marginBottom: "32px",
    },


    statCard: {
        border: "1px solid #e7ebf2",
        background: "#ffffff",
        borderRadius: "15px",
        padding: "19px",
        textAlign: "left",
        cursor: "pointer",
        fontFamily: "inherit",
        transition:
            "transform 0.2s ease, box-shadow 0.2s ease",
    },


    statTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "12px",
    },


    statIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        fontWeight: "800",
    },


    statArrow: {
        color: "#a0a9b8",
        fontSize: "17px",
    },


    statValue: {
        fontSize: "25px",
        fontWeight: "800",
        color: "#172033",
    },


    statTitle: {
        marginTop: "3px",
        fontSize: "12px",
        fontWeight: "700",
        color: "#3e4859",
    },


    statDescription: {
        marginTop: "4px",
        fontSize: "10px",
        color: "#8b95a5",
    },


    currentElectionCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "15px",
        padding: "18px 20px",
        marginBottom: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "18px",
    },


    currentElectionLabel: {
        fontSize: "9px",
        fontWeight: "800",
        letterSpacing: "1.2px",
        color: "#8b95a5",
        marginBottom: "5px",
    },


    currentElectionTitle: {
        margin: 0,
        fontSize: "15px",
        fontWeight: "800",
        color: "#172033",
    },


    currentElectionDescription: {
        margin: "5px 0 0",
        fontSize: "11px",
        color: "#7c8798",
    },


    electionStatusBadge: {
        minWidth: "86px",
        padding: "8px 11px",
        borderRadius: "999px",
        background: "#edf3ff",
        color: "#266EFF",
        fontSize: "9px",
        fontWeight: "800",
        textAlign: "center",
    },


    dashboardError: {
        background: "#fff1f1",
        border: "1px solid #f2c7c7",
        color: "#b42318",
        borderRadius: "10px",
        padding: "10px 13px",
        marginTop: "-20px",
        marginBottom: "32px",
        fontSize: "11px",
        fontWeight: "600",
    },


    operationsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "32px",
    },


    operationCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "16px",
        padding: "21px",
    },


    operationIcon: {
        width: "43px",
        height: "43px",
        borderRadius: "11px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "19px",
        fontWeight: "800",
        marginBottom: "14px",
    },


    operationTitle: {
        margin: 0,
        fontSize: "14px",
        fontWeight: "800",
        color: "#172033",
    },


    operationDescription: {
        minHeight: "48px",
        margin: "8px 0 17px",
        fontSize: "11px",
        lineHeight: 1.6,
        color: "#7c8798",
    },


    operationButton: {
        border: "none",
        background: "#edf3ff",
        color: "#266EFF",
        borderRadius: "8px",
        padding: "9px 12px",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: "11px",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },


    securityGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px",
    },


    securityCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "15px",
        padding: "19px",
    },


    securityTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
    },


    securityIcon: {
        width: "34px",
        height: "34px",
        borderRadius: "9px",
        background: "#eaf9f0",
        color: "#16a34a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
    },


    activeBadge: {
        padding: "5px 8px",
        borderRadius: "999px",
        background: "#eaf9f0",
        color: "#16a34a",
        fontSize: "9px",
        fontWeight: "800",
    },


    securityTitle: {
        margin: 0,
        fontSize: "13px",
        fontWeight: "800",
    },


    securityDescription: {
        margin: "7px 0 0",
        fontSize: "10px",
        lineHeight: 1.6,
        color: "#7c8798",
    },


    moduleHeader: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "20px",
    },


    moduleIcon: {
        width: "55px",
        height: "55px",
        borderRadius: "14px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: "800",
    },


    moduleTitle: {
        margin: 0,
        fontSize: "21px",
        fontWeight: "800",
    },


    moduleDescription: {
        margin: "5px 0 0",
        fontSize: "12px",
        color: "#7c8798",
    },


    moduleNotice: {
        display: "flex",
        gap: "14px",
        alignItems: "flex-start",
        background: "#fff8e7",
        border: "1px solid #f4e0a8",
        borderRadius: "14px",
        padding: "18px",
        marginBottom: "20px",
    },


    noticeIcon: {
        width: "32px",
        height: "32px",
        minWidth: "32px",
        borderRadius: "50%",
        background: "#f2b632",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
    },


    processCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "17px",
        padding: "25px",
    },


    processTitle: {
        margin: "0 0 20px",
        fontSize: "16px",
        fontWeight: "800",
    },


    processList: {
        display: "flex",
        flexDirection: "column",
        gap: "13px",
    },


    processItem: {
        display: "flex",
        alignItems: "center",
        gap: "13px",
        padding: "13px",
        background: "#f8faff",
        borderRadius: "10px",
    },


    processNumber: {
        width: "30px",
        height: "30px",
        minWidth: "30px",
        borderRadius: "50%",
        background: "#266EFF",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: "800",
    },


    processText: {
        fontSize: "12px",
        color: "#3e4859",
    },

};


// =====================================================
// RESPONSIVE STYLE
// =====================================================

if (
    typeof document !== "undefined"
) {
    const styleId =
        "votara-eb-dashboard-responsive";

    if (
        !document.getElementById(
            styleId
        )
    ) {
        const style =
            document.createElement(
                "style"
            );

        style.id = styleId;

        style.innerHTML = `
            @media (max-width: 1200px) {
                .votara-eb-dashboard-placeholder {
                    display: block;
                }
            }

            @media (max-width: 1000px) {
                body {
                    overflow-x: hidden;
                }
            }

            @media (max-width: 900px) {
                /* Dashboard adapts naturally */
            }

            @media (max-width: 768px) {
                /* Mobile dashboard */
            }
        `;

        document.head.appendChild(
            style
        );
    }
}

export default EBDashboard;