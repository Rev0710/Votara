import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Registrations from "./Registrations";

// =====================================================
// ELECTORAL BOARD DASHBOARD
// =====================================================

const EBDashboard = () => {
    const navigate = useNavigate();

    const [ebUser, setEbUser] = useState(null);
    const [activeSection, setActiveSection] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // =====================================================
    // LOAD EB USER
    // =====================================================

    useEffect(() => {
        const savedUser = localStorage.getItem("votaraEBUser");

        if (savedUser) {
            try {
                setEbUser(JSON.parse(savedUser));
            } catch (error) {
                console.error("Invalid EB user data.");
                localStorage.removeItem("votaraEBUser");
            }
        }
    }, []);

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
    // Remove current Staff/EB authentication
    localStorage.removeItem("votaraStaffToken");
    localStorage.removeItem("votaraStaffUser");

    // Remove old EB authentication if it still exists
    localStorage.removeItem("votaraEBToken");
    localStorage.removeItem("votaraEBUser");

    // Return to Account Selection
    navigate("/account-selection");
};

    // =====================================================
    // SIDEBAR NAVIGATION
    // =====================================================

    const handleNavigation = (section) => {
        setActiveSection(section);
        setSidebarOpen(false);
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

    // =====================================================
    // MENU
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
            id: "candidates",
            label: "Candidate Management",
            icon: "♙",
        },
        {
            id: "election",
            label: "Election Management",
            icon: "◉",
        },
        {
            id: "qr",
            label: "QR Verification",
            icon: "▣",
        },
        {
            id: "monitoring",
            label: "Voting Monitoring",
            icon: "◫",
        },
        {
            id: "results",
            label: "Election Results",
            icon: "▥",
        },
        {
            id: "logs",
            label: "Verification Logs",
            icon: "◌",
        },
    ];

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div style={styles.app}>

            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {sidebarOpen && (
                <div
                    style={styles.overlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
                style={{
                    ...styles.sidebar,
                    ...(sidebarOpen ? styles.sidebarMobileOpen : {}),
                }}
            >

                {/* LOGO */}

                <div style={styles.logoContainer}>
                    <div style={styles.logoIcon}>
                        V
                    </div>

                    <div>
                        <div style={styles.logoText}>
                            VOTARA
                        </div>

                        <div style={styles.logoSubtext}>
                            Electoral Board
                        </div>
                    </div>
                </div>

                {/* NAVIGATION */}

                <div style={styles.navContainer}>

                    <div style={styles.navTitle}>
                        MAIN MENU
                    </div>

                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigation(item.id)}
                            style={{
                                ...styles.navItem,
                                ...(activeSection === item.id
                                    ? styles.navItemActive
                                    : {}),
                            }}
                        >
                            <span style={styles.navIcon}>
                                {item.icon}
                            </span>

                            <span>
                                {item.label}
                            </span>
                        </button>
                    ))}

                </div>

                {/* SIDEBAR FOOTER */}

                <div style={styles.sidebarFooter}>

                    <button
                        onClick={() =>
                            handleNavigation("settings")
                        }
                        style={styles.footerButton}
                    >
                        <span>⚙</span>
                        Settings
                    </button>

                    <button
                        onClick={handleLogout}
                        style={styles.logoutButton}
                    >
                        <span>↪</span>
                        Logout
                    </button>

                </div>

            </aside>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main style={styles.main}>

                {/* =================================================
                    TOP BAR
                ================================================= */}

                <header style={styles.topbar}>

                    <div style={styles.topbarLeft}>

                        <button
                            style={styles.menuButton}
                            onClick={() =>
                                setSidebarOpen(!sidebarOpen)
                            }
                        >
                            ☰
                        </button>

                        <div>
                            <h1 style={styles.pageTitle}>
                                {activeSection === "dashboard"
                                    ? "Electoral Board Dashboard"
                                    : getSectionTitle(activeSection)}
                            </h1>

                            <p style={styles.pageSubtitle}>
                                Manage and monitor the VOTARA election process.
                            </p>
                        </div>

                    </div>

                    <div style={styles.profileArea}>

                        <div style={styles.profileText}>
                            <strong>
                                {displayName}
                            </strong>

                            <span>
                                {displayEmail}
                            </span>
                        </div>

                        <div style={styles.avatar}>
                            {getInitials(displayName)}
                        </div>

                    </div>

                </header>

                {/* =================================================
                    CONTENT
                ================================================= */}

                <section style={styles.content}>

                    {/* =================================================
                        DASHBOARD OVERVIEW
                    ================================================= */}

                    {activeSection === "dashboard" && (
                        <>
                            <div style={styles.welcomeCard}>

                                <div>
                                    <div style={styles.welcomeLabel}>
                                        ELECTORAL BOARD
                                    </div>

                                    <h2 style={styles.welcomeTitle}>
                                        Welcome, {getFirstName(displayName)}!
                                    </h2>

                                    <p style={styles.welcomeDescription}>
                                        This dashboard is your control center
                                        for student registration, candidate
                                        verification, election management,
                                        QR verification, voting monitoring,
                                        and election results.
                                    </p>
                                </div>

                                <div style={styles.welcomeIcon}>
                                    V
                                </div>

                            </div>

                            {/* =================================================
                                ELECTION STATUS
                            ================================================= */}

                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        Election Overview
                                    </h2>

                                    <p style={styles.sectionDescription}>
                                        Current status of the election process.
                                    </p>
                                </div>
                            </div>

                            <div style={styles.statsGrid}>

                                <StatCard
                                    title="Pending Registrations"
                                    value="0"
                                    description="Awaiting EB review"
                                    icon="▤"
                                    onClick={() =>
                                        handleNavigation("registrations")
                                    }
                                />

                                <StatCard
                                    title="Approved Students"
                                    value="0"
                                    description="Approved voters"
                                    icon="✓"
                                    onClick={() =>
                                        handleNavigation("registrations")
                                    }
                                />

                                <StatCard
                                    title="Approved Candidates"
                                    value="0"
                                    description="Eligible candidates"
                                    icon="♙"
                                    onClick={() =>
                                        handleNavigation("candidates")
                                    }
                                />

                                <StatCard
                                    title="Votes Cast"
                                    value="0"
                                    description="Recorded ballots"
                                    icon="◉"
                                    onClick={() =>
                                        handleNavigation("monitoring")
                                    }
                                />

                            </div>

                            {/* =================================================
                                IMPORTANT EB FUNCTIONS
                            ================================================= */}

                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        Electoral Board Operations
                                    </h2>

                                    <p style={styles.sectionDescription}>
                                        Important actions for the election process.
                                    </p>
                                </div>
                            </div>

                            <div style={styles.operationsGrid}>

                                <OperationCard
                                    icon="▤"
                                    title="Registration Management"
                                    description="Review student applications, verify requirements, and approve or reject registrations."
                                    buttonText="Manage Registrations"
                                    onClick={() =>
                                        handleNavigation("registrations")
                                    }
                                />

                                <OperationCard
                                    icon="♙"
                                    title="Candidate Management"
                                    description="Review candidate applications and manage candidate eligibility."
                                    buttonText="Manage Candidates"
                                    onClick={() =>
                                        handleNavigation("candidates")
                                    }
                                />

                                <OperationCard
                                    icon="◉"
                                    title="Election Management"
                                    description="Configure the election date, voting period, and election status."
                                    buttonText="Manage Election"
                                    onClick={() =>
                                        handleNavigation("election")
                                    }
                                />

                                <OperationCard
                                    icon="▣"
                                    title="QR Verification"
                                    description="Verify student identity and process QR codes during on-campus voting."
                                    buttonText="Open QR Verification"
                                    onClick={() =>
                                        handleNavigation("qr")
                                    }
                                />

                            </div>

                            {/* =================================================
                                SECURITY / INTEGRITY
                            ================================================= */}

                            <div style={styles.sectionHeader}>
                                <div>
                                    <h2 style={styles.sectionTitle}>
                                        Election Security
                                    </h2>

                                    <p style={styles.sectionDescription}>
                                        VOTARA election integrity and monitoring.
                                    </p>
                                </div>
                            </div>

                            <div style={styles.securityGrid}>

                                <SecurityCard
                                    title="Identity Verification"
                                    description="Student identity must be verified before voting."
                                    status="Active"
                                />

                                <SecurityCard
                                    title="Vote Integrity"
                                    description="Ballots are recorded using server-authoritative validation and integrity protection."
                                    status="Active"
                                />

                                <SecurityCard
                                    title="Audit Trail"
                                    description="Important election actions are recorded for review and accountability."
                                    status="Active"
                                />

                                <SecurityCard
                                    title="Role-Based Access"
                                    description="Electoral Board functions are protected by authenticated access."
                                    status="Active"
                                />

                            </div>
                        </>
                    )}

                    {/* =================================================
                        REGISTRATIONS
                    ================================================= */}

                    {activeSection === "registrations" && (
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
                        />
                    )}

                    {/* =================================================
                        CANDIDATES
                    ================================================= */}

                    {activeSection === "candidates" && (
                        <ModulePlaceholder
                            title="Candidate Management"
                            icon="♙"
                            description="Manage and verify candidates who will appear on the official ballot."
                            steps={[
                                "View candidate applications",
                                "Review candidate information",
                                "Review candidate requirements",
                                "Approve or reject candidates",
                                "Manage candidate status",
                                "Prepare approved candidates for election",
                            ]}
                        />
                    )}

                    {/* =================================================
                        ELECTION
                    ================================================= */}

                    {activeSection === "election" && (
                        <ModulePlaceholder
                            title="Election Management"
                            icon="◉"
                            description="Configure and monitor the election schedule and voting period."
                            steps={[
                                "Set election date",
                                "Set voting start and end time",
                                "Manage election status",
                                "Prepare ballot positions",
                                "Configure year-level representatives",
                                "Open and close voting",
                            ]}
                        />
                    )}

                    {/* =================================================
                        QR VERIFICATION
                    ================================================= */}

                    {activeSection === "qr" && (
                        <ModulePlaceholder
                            title="QR Verification"
                            icon="▣"
                            description="Verify students during on-campus voting using their VOTARA QR code and physical identification."
                            steps={[
                                "Select the year level being served",
                                "Scan student's VOTARA QR code",
                                "Check QR validity and expiration",
                                "Verify student's physical ID",
                                "Confirm identity",
                                "Record verification",
                                "Allow eligible student to proceed to kiosk voting",
                            ]}
                        />
                    )}

                    {/* =================================================
                        MONITORING
                    ================================================= */}

                    {activeSection === "monitoring" && (
                        <ModulePlaceholder
                            title="Voting Monitoring"
                            icon="◫"
                            description="Monitor election participation without exposing confidential ballot choices."
                            steps={[
                                "View total registered voters",
                                "View verified voters",
                                "View remote voting activity",
                                "View kiosk voting activity",
                                "Monitor voting progress",
                                "Monitor election status",
                            ]}
                        />
                    )}

                    {/* =================================================
                        RESULTS
                    ================================================= */}

                    {activeSection === "results" && (
                        <ModulePlaceholder
                            title="Election Results"
                            icon="▥"
                            description="View election results after voting has been properly closed."
                            steps={[
                                "Confirm voting period has ended",
                                "Verify election status",
                                "Process valid ballots",
                                "Calculate candidate totals",
                                "Display official results",
                                "Preserve election audit records",
                            ]}
                        />
                    )}

                    {/* =================================================
                        LOGS
                    ================================================= */}

                    {activeSection === "logs" && (
                        <ModulePlaceholder
                            title="Verification Logs"
                            icon="◌"
                            description="Review important Electoral Board verification and election activity."
                            steps={[
                                "View identity verification records",
                                "View QR verification activity",
                                "View registration review activity",
                                "View approval and rejection activity",
                                "Review election-related actions",
                                "Review tamper-evident audit records",
                            ]}
                        />
                    )}

                    {/* =================================================
                        SETTINGS
                    ================================================= */}

                    {activeSection === "settings" && (
                        <ModulePlaceholder
                            title="Electoral Board Settings"
                            icon="⚙"
                            description="Manage Electoral Board account and dashboard settings."
                            steps={[
                                "View account information",
                                "Review account role",
                                "Manage account security",
                                "Review login activity",
                            ]}
                        />
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
            onClick={onClick}
            style={styles.statCard}
        >
            <div style={styles.statTop}>

                <div style={styles.statIcon}>
                    {icon}
                </div>

                <span style={styles.statArrow}>
                    →
                </span>

            </div>

            <div style={styles.statValue}>
                {value}
            </div>

            <div style={styles.statTitle}>
                {title}
            </div>

            <div style={styles.statDescription}>
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
        <div style={styles.operationCard}>

            <div style={styles.operationIcon}>
                {icon}
            </div>

            <h3 style={styles.operationTitle}>
                {title}
            </h3>

            <p style={styles.operationDescription}>
                {description}
            </p>

            <button
                onClick={onClick}
                style={styles.operationButton}
            >
                {buttonText}
                <span>→</span>
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
        <div style={styles.securityCard}>

            <div style={styles.securityTop}>

                <div style={styles.securityIcon}>
                    ✓
                </div>

                <span style={styles.activeBadge}>
                    {status}
                </span>

            </div>

            <h3 style={styles.securityTitle}>
                {title}
            </h3>

            <p style={styles.securityDescription}>
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

                <div style={styles.moduleIcon}>
                    {icon}
                </div>

                <div>
                    <h2 style={styles.moduleTitle}>
                        {title}
                    </h2>

                    <p style={styles.moduleDescription}>
                        {description}
                    </p>
                </div>

            </div>

            <div style={styles.moduleNotice}>
                <div style={styles.noticeIcon}>
                    !
                </div>

                <div>
                    <strong>
                        Module ready for integration
                    </strong>

                    <p>
                        The dashboard section is prepared.
                        The next step is connecting this module
                        to the VOTARA backend and Supabase.
                    </p>
                </div>
            </div>

            <div style={styles.processCard}>

                <h3 style={styles.processTitle}>
                    Important Process
                </h3>

                <div style={styles.processList}>

                    {steps.map((step, index) => (
                        <div
                            key={index}
                            style={styles.processItem}
                        >

                            <div style={styles.processNumber}>
                                {index + 1}
                            </div>

                            <div style={styles.processText}>
                                {step}
                            </div>

                        </div>
                    ))}

                </div>

            </div>

        </div>
    );
};

// =====================================================
// HELPERS
// =====================================================

const getInitials = (name) => {
    if (!name) return "EB";

    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
};

const getFirstName = (name) => {
    if (!name) return "Member";

    return name.trim().split(/\s+/)[0];
};

const getSectionTitle = (section) => {
    const titles = {
        registrations: "Registration Management",
        candidates: "Candidate Management",
        election: "Election Management",
        qr: "QR Verification",
        monitoring: "Voting Monitoring",
        results: "Election Results",
        logs: "Verification Logs",
        settings: "Settings",
    };

    return titles[section] || "Electoral Board Dashboard";
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
        background: "rgba(0, 0, 0, 0.45)",
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
    },

    sidebarMobileOpen: {
        transform: "translateX(0)",
    },

    logoContainer: {
        height: "90px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "0 24px",
        borderBottom:
            "1px solid rgba(255,255,255,0.08)",
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
        fontWeight: "700",
        color: "#71809a",
        letterSpacing: "1.4px",
        padding: "0 12px",
        marginBottom: "12px",
    },

    navItem: {
        width: "100%",
        border: "none",
        background: "transparent",
        color: "#aeb9cb",
        padding: "13px 12px",
        marginBottom: "5px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "13px",
        fontWeight: "500",
        transition: "all 0.2s ease",
    },

    navItemActive: {
        background: "#266EFF",
        color: "#ffffff",
        fontWeight: "700",
        boxShadow:
            "0 7px 18px rgba(38,110,255,0.22)",
    },

    navIcon: {
        width: "22px",
        textAlign: "center",
        fontSize: "18px",
    },

    sidebarFooter: {
        padding: "15px",
        borderTop:
            "1px solid rgba(255,255,255,0.08)",
    },

    footerButton: {
        width: "100%",
        border: "none",
        background: "transparent",
        color: "#9eabbd",
        padding: "12px",
        display: "flex",
        gap: "12px",
        alignItems: "center",
        cursor: "pointer",
        borderRadius: "9px",
        textAlign: "left",
        fontSize: "13px",
    },

    logoutButton: {
        width: "100%",
        border: "none",
        background: "rgba(255,255,255,0.05)",
        color: "#ffb0b0",
        padding: "12px",
        display: "flex",
        gap: "12px",
        alignItems: "center",
        cursor: "pointer",
        borderRadius: "9px",
        textAlign: "left",
        fontSize: "13px",
        marginTop: "4px",
    },

    main: {
        marginLeft: "270px",
        width: "calc(100% - 270px)",
        minHeight: "100vh",
    },

    topbar: {
        height: "90px",
        background: "#ffffff",
        borderBottom: "1px solid #e7ebf2",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 34px",
        position: "sticky",
        top: 0,
        zIndex: 50,
    },

    topbarLeft: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
    },

    menuButton: {
        display: "none",
        border: "none",
        background: "#f0f3f8",
        width: "40px",
        height: "40px",
        borderRadius: "9px",
        cursor: "pointer",
        fontSize: "20px",
    },

    pageTitle: {
        margin: 0,
        fontSize: "22px",
        fontWeight: "800",
        color: "#111827",
    },

    pageSubtitle: {
        margin: "4px 0 0",
        color: "#7a8699",
        fontSize: "12px",
    },

    profileArea: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    profileText: {
        display: "flex",
        flexDirection: "column",
        textAlign: "right",
        gap: "2px",
    },

    profileTextStrong: {
        fontSize: "13px",
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
        fontSize: "13px",
        fontWeight: "800",
    },

    content: {
        padding: "30px 34px 50px",
        maxWidth: "1500px",
        margin: "0 auto",
    },

    welcomeCard: {
        background:
            "linear-gradient(135deg, #071426 0%, #102a51 100%)",
        borderRadius: "18px",
        padding: "32px",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        overflow: "hidden",
        position: "relative",
        marginBottom: "32px",
    },

    welcomeLabel: {
        color: "#8db4ff",
        fontSize: "11px",
        fontWeight: "800",
        letterSpacing: "1.5px",
        marginBottom: "8px",
    },

    welcomeTitle: {
        margin: 0,
        fontSize: "28px",
        fontWeight: "800",
    },

    welcomeDescription: {
        maxWidth: "720px",
        color: "#c5d0e1",
        fontSize: "13px",
        lineHeight: 1.7,
        margin: "10px 0 0",
    },

    welcomeIcon: {
        width: "110px",
        height: "110px",
        borderRadius: "28px",
        background: "rgba(255,255,255,0.08)",
        border:
            "1px solid rgba(255,255,255,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "48px",
        fontWeight: "900",
        marginLeft: "25px",
    },

    sectionHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "17px",
    },

    sectionTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: "800",
        color: "#172033",
    },

    sectionDescription: {
        margin: "5px 0 0",
        fontSize: "12px",
        color: "#8490a3",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "34px",
    },

    statCard: {
        border: "1px solid #e7ebf2",
        background: "#ffffff",
        borderRadius: "15px",
        padding: "20px",
        textAlign: "left",
        cursor: "pointer",
        transition: "transform 0.2s ease",
        boxShadow:
            "0 5px 18px rgba(24, 39, 75, 0.04)",
    },

    statTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },

    statIcon: {
        width: "42px",
        height: "42px",
        borderRadius: "11px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        fontWeight: "700",
    },

    statArrow: {
        color: "#a2adbd",
        fontSize: "18px",
    },

    statValue: {
        marginTop: "18px",
        fontSize: "27px",
        fontWeight: "800",
        color: "#172033",
    },

    statTitle: {
        marginTop: "2px",
        fontSize: "13px",
        fontWeight: "700",
        color: "#333d4f",
    },

    statDescription: {
        marginTop: "5px",
        fontSize: "11px",
        color: "#8a95a6",
    },

    operationsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "16px",
        marginBottom: "34px",
    },

    operationCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "15px",
        padding: "21px",
        boxShadow:
            "0 5px 18px rgba(24,39,75,0.04)",
    },

    operationIcon: {
        width: "45px",
        height: "45px",
        borderRadius: "12px",
        background: "#f0f4ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        fontWeight: "700",
    },

    operationTitle: {
        margin: "16px 0 6px",
        fontSize: "15px",
        fontWeight: "800",
    },

    operationDescription: {
        margin: 0,
        color: "#7c8798",
        fontSize: "11px",
        lineHeight: 1.65,
        minHeight: "58px",
    },

    operationButton: {
        marginTop: "17px",
        width: "100%",
        border: "none",
        borderRadius: "9px",
        background: "#266EFF",
        color: "#ffffff",
        padding: "11px 13px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },

    securityGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "16px",
    },

    securityCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "15px",
        padding: "19px",
    },

    securityTop: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },

    securityIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        background: "#eaf9f1",
        color: "#159957",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
    },

    activeBadge: {
        fontSize: "10px",
        color: "#159957",
        background: "#eaf9f1",
        padding: "5px 9px",
        borderRadius: "20px",
        fontWeight: "700",
    },

    securityTitle: {
        fontSize: "14px",
        margin: "15px 0 6px",
        fontWeight: "800",
    },

    securityDescription: {
        margin: 0,
        fontSize: "11px",
        color: "#7c8798",
        lineHeight: 1.6,
    },

    moduleHeader: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "17px",
        padding: "25px",
        display: "flex",
        alignItems: "center",
        gap: "17px",
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

if (typeof document !== "undefined") {
    const styleId = "votara-eb-dashboard-responsive";

    if (!document.getElementById(styleId)) {
        const style = document.createElement("style");

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
                /* Dashboard adapts naturally through the browser width */
            }

            @media (max-width: 768px) {

                .votara-eb-dashboard-mobile {
                    display: block;
                }

            }
        `;

        document.head.appendChild(style);
    }
}

export default EBDashboard;