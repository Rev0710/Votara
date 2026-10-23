import EBAccountPanel from './EBAccountPanel';
import IssueReports from "./IssueReports";
import EBHeader from "./EBHeader";
import InPersonVerification from "./InPersonVerification";
import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiBarChart2, FiClipboard, FiUserCheck, FiUsers } from "react-icons/fi";

import "./EBDashboard.css";

import api from "../../services/api";


import Registrations from "./Registrations";

import PartyListManagement from "./PartyListManagement";
import ManagePartyList from "./ManagePartyList";
import ElectionManagement from "./ElectionManagement";
import CreateElection from "./CreateElection";
import KioskManagement from "./KioskManagement";
import VotingMonitoring from "./VotingMonitoring";
import ResultsReports from "./ResultsReports";
import AuditLogs from "./AuditLogs";

// =====================================================
// ELECTORAL BOARD DASHBOARD
// =====================================================

const EBDashboard = () => {

    const navigate = useNavigate();
 const [theme,setTheme]=useState(()=>localStorage.getItem('votaraEBTheme')||'dark');
 const toggleTheme=()=>{const next=theme==='dark'?'light':'dark';setTheme(next);localStorage.setItem('votaraEBTheme',next);window.dispatchEvent(new Event('votara-eb-theme'));};
    const location = useLocation();

    const [ebUser, setEbUser] = useState(null);


    const [activeSection, setActiveSection] =
        useState("dashboard");
    const [partyListContext, setPartyListContext] = useState(null);
 useEffect(()=>{api.post('/electoral-board/activity',{section:activeSection}).catch(()=>{});},[activeSection]);

    // Restore the dashboard section when returning from a standalone
    // page such as ManagePartyList.jsx.
    useEffect(() => {
        const returnToSection = location.state?.returnToSection;

        if (!returnToSection) return;

        setActiveSection(returnToSection);
        if (location.state?.electionId) {
            setPartyListContext({ electionId: location.state.electionId });
        }
        window.scrollTo({ top: 0, behavior: "auto" });

        // Clear the navigation state so refreshing the dashboard does not
        // repeatedly force the same section.
        navigate(location.pathname, { replace: true, state: {} });
    }, [location, navigate]);


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
    const [dashboardUpdatedAt, setDashboardUpdatedAt] = useState(null);
    const statsRequestInFlight = useRef(false);
    const statsPollingErrorLogged = useRef(false);


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


    useEffect(() => {
        let mounted = true;
        api.get('/electoral-board/profile').then(({data}) => {
            if (!mounted || !data?.user) return;
            setEbUser(data.user);
            localStorage.setItem('votaraEBUser', JSON.stringify(data.user));
        }).catch(() => {});
        return () => { mounted = false; };
    }, []);
    // =====================================================
    // LOAD DASHBOARD STATISTICS
    // =====================================================

    const loadDashboardStats = async ({ silent = false } = {}) => {

        if (statsRequestInFlight.current) return;
        statsRequestInFlight.current = true;

        try {

            if (!silent) {
                setDashboardLoading(true);
                setDashboardError("");
            }

            const response =
                await api.get(
                    "/registration/eb/dashboard-stats"
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
            setDashboardUpdatedAt(new Date());
            setDashboardError("");
            statsPollingErrorLogged.current = false;

        } catch (error) {

            const message = error?.response?.data?.message ||
                "Unable to load the latest dashboard statistics.";
            setDashboardError(message);

            // Keep the first real error visible in the console, without repeating
            // the same failed background refresh every polling interval.
            if (!silent || !statsPollingErrorLogged.current) {
                console.error("Unable to load EB dashboard statistics:", error);
            }
            statsPollingErrorLogged.current = true;

        } finally {

            statsRequestInFlight.current = false;
            if (!silent) setDashboardLoading(false);

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

    }, [activeSection]);

    useEffect(() => {
        if (activeSection !== "dashboard") return undefined;

        const refreshSilently = () => {
            if (document.visibilityState === "visible") {
                loadDashboardStats({ silent: true });
            }
        };
        const intervalId = window.setInterval(refreshSilently, 20000);
        document.addEventListener("visibilitychange", refreshSilently);
        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener("visibilitychange", refreshSilently);
        };
    }, [activeSection]);


    // =====================================================
    // LOGOUT
    //=====================================================

    const handleLogout = async () => {
        try { await api.post('/electoral-board/activity',{section:'settings',event:'logout'},{timeout:2000}); } catch {} 

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
    // WORKSPACE NAVIGATION
    // =====================================================

    const handleNavigation = (section, context = null) => {

        if (section === "reports") section = "results";

        setActiveSection(section);
        if (["partyLists", "individualCandidacy"].includes(section)) {
            setPartyListContext(context || null);
        }


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
        "";


    // =====================================================
    // RENDER
    // =====================================================

    const turnoutPercent = dashboardStats.registeredStudents > 0
        ? Math.min(100, Math.round((dashboardStats.votesCast / dashboardStats.registeredStudents) * 1000) / 10)
        : 0;

    return (
        <div className="eb-dashboard-shell" style={styles.app}>

            <main className="eb-main" style={styles.main}>
                <EBHeader
                    activeSection={activeSection}
                    displayName={displayName}
                    displayEmail={displayEmail}
                    profileImage={profileImage}
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    onNavigate={handleNavigation}
                    onLogout={handleLogout}
                />

                {/* =================================================
                    CONTENT
                ================================================= */}

                <section className="eb-content" style={styles.content}>

                    {/* =================================================
                        DASHBOARD OVERVIEW
                    ================================================= */}

                    {activeSection === "dashboard" && (
                        <div className="eb-dashboard-home">
                            <div className="eb-dashboard-heading"><button type="button" className="eb-manual-refresh" onClick={() => loadDashboardStats()} disabled={dashboardLoading}>Refresh overview</button>
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
                                <StatCard title="Student Registered" value={dashboardLoading ? "..." : dashboardStats.registeredStudents} description="Registered students" icon={<FiUsers aria-hidden="true" />} onClick={() => handleNavigation("registrations")} />
                                <StatCard title="Pending Registration" value={dashboardLoading ? "..." : dashboardStats.pendingApplications} description="Awaiting review" icon={<FiClipboard aria-hidden="true" />} onClick={() => handleNavigation("registrations")} />
                                <StatCard title="Active Candidates" value={dashboardLoading ? "..." : dashboardStats.activeCandidates} description="Currently active" icon={<FiUserCheck aria-hidden="true" />} />
                                <StatCard title="Votes Cast" value={dashboardLoading ? "..." : dashboardStats.votesCast} description="Recorded ballots" icon={<FiBarChart2 aria-hidden="true" />} onClick={() => handleNavigation("monitoring")} />
                            </div>

                            <div className="eb-dashboard-main-grid">
                                <section className="eb-panel eb-monitor-panel">
                                    <div className="eb-panel-header">
                                        <div>
                                            <h2>Election Monitoring</h2>
                                            <p>Live turnout and current election activity.</p>
                                        </div>
                                        <button type="button" className="eb-live-chip" onClick={() => handleNavigation("monitoring")}>
                                            <span /> Open monitoring
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
                                                <div className="eb-chart-bars"><span title={`Recorded ballots: ${dashboardStats.votesCast}`} style={{height: `${turnoutPercent}%`, minHeight:dashboardStats.votesCast>0?2:0}} /></div>
                                            </div>
                                            <div className="eb-chart-caption">
                                                Updates automatically every 20 seconds
                                                {dashboardUpdatedAt && <> · Last updated {dashboardUpdatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}
                                            </div>
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

                    


                    {/* =================================================
                        PARTY LIST MANAGEMENT
                    ================================================= */}

                    {activeSection === "verification" && <InPersonVerification onNavigate={handleNavigation} />}

                    {activeSection === "partyLists" && (
                        <PartyListManagement
                            initialElectionId={partyListContext?.electionId}
                            positionContext={partyListContext?.positionId ? partyListContext : null}
                        />
                    )}

                    {activeSection === "individualCandidacy" && (
                        <ManagePartyList
                            individualCandidacy
                            electionId={partyListContext?.electionId || ""}
                            onBack={() => handleNavigation("election")}
                        />
                    )}


                    {/* =================================================
                        ELECTION MANAGEMENT
                    ================================================= */}

                        {activeSection === "election" && (
                            <ElectionManagement
                                onNavigate={handleNavigation}
                                onCreateElection={() =>
                                    handleNavigation("createElection")
                                }
                            />
                        )}


                    {/* =================================================
                        CREATE ELECTION
                    ================================================= */}

                    {activeSection === "createElection" && (
                        <CreateElection
                            onBack={() =>
                                handleNavigation("election")
                            }
                        />
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

                    {["results", "reports"].includes(activeSection) && (

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

                        <EBAccountPanel onBack={()=>handleNavigation("dashboard")} mode="settings" onUpdated={setEbUser} />

                    )}

                </section>

                {activeSection === "profile" && <EBAccountPanel onBack={()=>handleNavigation("dashboard")} mode="profile" onUpdated={setEbUser} />}
{activeSection === "support" && <IssueReports />}
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
