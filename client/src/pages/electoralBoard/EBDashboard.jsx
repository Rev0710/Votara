import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import Registrations from "./Registrations";
import LateEnrolleeManagement from "./LateEnrolleeManagement";
import PartyListManagement from "./PartyListManagement";
import ElectionManagement from "./ElectionManagement";
import CandidateManagement from "./CandidateManagement";
import KioskManagement from "./KioskManagement";
import VotingMonitoring from "./VotingMonitoring";
import ResultsReports from "./ResultsReports";
import AuditLogs from "./AuditLogs";
import Settings from "./Settings";

// =====================================================
// ELECTORAL BOARD DASHBOARD
// =====================================================

const EBDashboard = () => {

    const navigate = useNavigate();

    const [ebUser, setEbUser] = useState(null);

    const [activeSection, setActiveSection] =
        useState("dashboard");

    const [sidebarOpen, setSidebarOpen] =
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

    return (

        <div style={styles.app}>


            {/* =================================================
                MOBILE OVERLAY
            ================================================= */}

            {sidebarOpen && (

                <div
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

            <main
                style={
                    styles.main
                }
            >


                {/* =================================================
                    TOP BAR
                ================================================= */}

                <header
                    style={
                        styles.topbar
                    }
                >

                    <div
                        style={
                            styles.topbarLeft
                        }
                    >

                        <button
                            type="button"
                            style={
                                styles.menuButton
                            }
                            onClick={() =>
                                setSidebarOpen(
                                    !sidebarOpen
                                )
                            }
                        >
                            ☰
                        </button>


                        <div>

                            <h1
                                style={
                                    styles.pageTitle
                                }
                            >

                                {
                                    activeSection ===
                                    "dashboard"
                                        ? "Electoral Board Dashboard"
                                        : getSectionTitle(
                                              activeSection
                                          )
                                }

                            </h1>


                            <p
                                style={
                                    styles.pageSubtitle
                                }
                            >
                                Manage and monitor the
                                VOTARA election process.
                            </p>

                        </div>

                    </div>


                    {/* =================================================
                        PROFILE
                    ================================================= */}

                    <div
                        style={
                            styles.profileArea
                        }
                    >

                        <div
                            style={
                                styles.profileText
                            }
                        >

                            <strong>
                                {displayName}
                            </strong>

                            <span>
                                {displayEmail}
                            </span>

                        </div>


                        <div
                            style={
                                styles.avatar
                            }
                        >

                            {getInitials(
                                displayName
                            )}

                        </div>

                    </div>

                </header>


                {/* =================================================
                    CONTENT
                ================================================= */}

                <section
                    style={
                        styles.content
                    }
                >


                    {/* =================================================
                        DASHBOARD OVERVIEW
                    ================================================= */}

                    {activeSection ===
                        "dashboard" && (

                        <>

                            {/* =================================================
                                WELCOME CARD
                            ================================================= */}

                            <div
                                style={
                                    styles.welcomeCard
                                }
                            >

                                <div>

                                    <div
                                        style={
                                            styles.welcomeLabel
                                        }
                                    >
                                        ELECTORAL BOARD
                                    </div>


                                    <h2
                                        style={
                                            styles.welcomeTitle
                                        }
                                    >

                                        Welcome,{" "}

                                        {getFirstName(
                                            displayName
                                        )}

                                        !

                                    </h2>


                                    <p
                                        style={
                                            styles.welcomeDescription
                                        }
                                    >
                                        This dashboard is
                                        your control center
                                        for student
                                        registration,
                                        late enrollee
                                        management,
                                        party lists,
                                        candidates,
                                        election management,
                                        kiosk operations,
                                        voting monitoring,
                                        results, and audit
                                        logs.
                                    </p>

                                </div>


                                <div
                                    style={
                                        styles.welcomeIcon
                                    }
                                >
                                    V
                                </div>

                            </div>


                            {/* =================================================
                                ELECTION OVERVIEW
                            ================================================= */}

                            <div
                                style={
                                    styles.sectionHeader
                                }
                            >

                                <div>

                                    <h2
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        Election Overview
                                    </h2>


                                    <p
                                        style={
                                            styles.sectionDescription
                                        }
                                    >
                                        Current status of
                                        the election process.
                                    </p>

                                </div>

                            </div>


                            <div
                                style={
                                    styles.statsGrid
                                }
                            >

                                <StatCard
                                    title="Pending Registrations"
                                    value={
                                        dashboardLoading
                                            ? "..."
                                            : dashboardStats.pendingApplications
                                    }
                                    description="Awaiting EB review"
                                    icon="▤"
                                    onClick={() =>
                                        handleNavigation(
                                            "registrations"
                                        )
                                    }
                                />


                                <StatCard
                                    title="Approved Students"
                                    value={
                                        dashboardLoading
                                            ? "..."
                                            : dashboardStats.approvedStudents
                                    }
                                    description="Approved voters"
                                    icon="✓"
                                    onClick={() =>
                                        handleNavigation(
                                            "registrations"
                                        )
                                    }
                                />


                                <StatCard
                                    title="Active Candidates"
                                    value={
                                        dashboardLoading
                                            ? "..."
                                            : dashboardStats.activeCandidates
                                    }
                                    description="Currently active candidates"
                                    icon="♙"
                                    onClick={() =>
                                        handleNavigation(
                                            "candidates"
                                        )
                                    }
                                />


                                <StatCard
                                    title="Votes Cast"
                                    value={
                                        dashboardLoading
                                            ? "..."
                                            : dashboardStats.votesCast
                                    }
                                    description="Recorded ballots"
                                    icon="◉"
                                    onClick={() =>
                                        handleNavigation(
                                            "monitoring"
                                        )
                                    }
                                />

                            </div>


                            {/* =================================================
                                CURRENT ELECTION STATUS
                            ================================================= */}

                            <div
                                style={
                                    styles.currentElectionCard
                                }
                            >

                                <div>

                                    <div
                                        style={
                                            styles.currentElectionLabel
                                        }
                                    >
                                        CURRENT ELECTION
                                    </div>

                                    <h3
                                        style={
                                            styles.currentElectionTitle
                                        }
                                    >
                                        {
                                            dashboardLoading
                                                ? "Loading election..."
                                                : currentElection?.title ||
                                                  "No election configured"
                                        }
                                    </h3>

                                    <p
                                        style={
                                            styles.currentElectionDescription
                                        }
                                    >
                                        {
                                            currentElection
                                                ? `Election status: ${formatElectionStatus(
                                                      currentElection.status
                                                  )}`
                                                : dashboardError
                                                  ? "The dashboard could not retrieve the current election."
                                                  : "No current election is available."
                                        }
                                    </p>

                                </div>

                                <div
                                    style={{
                                        ...styles.electionStatusBadge,
                                        ...(getElectionStatusStyle(
                                            currentElection?.status
                                        )),
                                    }}
                                >
                                    {
                                        dashboardLoading
                                            ? "LOADING"
                                            : formatElectionStatus(
                                                  currentElection?.status
                                              )
                                    }
                                </div>

                            </div>


                            {
                                dashboardError && (

                                    <div
                                        style={
                                            styles.dashboardError
                                        }
                                    >
                                        {dashboardError}
                                    </div>

                                )
                            }


                            {/* =================================================
                                IMPORTANT EB FUNCTIONS
                            ================================================= */}

                            <div
                                style={
                                    styles.sectionHeader
                                }
                            >

                                <div>

                                    <h2
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        Electoral Board Operations
                                    </h2>


                                    <p
                                        style={
                                            styles.sectionDescription
                                        }
                                    >
                                        Important actions
                                        for managing the
                                        election process.
                                    </p>

                                </div>

                            </div>


                            <div
                                style={
                                    styles.operationsGrid
                                }
                            >

                                <OperationCard
                                    icon="▤"
                                    title="Registration Management"
                                    description="Review student applications, verify requirements, and approve or reject registrations."
                                    buttonText="Manage Registrations"
                                    onClick={() =>
                                        handleNavigation(
                                            "registrations"
                                        )
                                    }
                                />


                                <OperationCard
                                    icon="◈"
                                    title="Late Enrollee Management"
                                    description="Review late enrollee applications, submitted requirements, enrollment information, and eligibility."
                                    buttonText="Manage Late Enrollees"
                                    onClick={() =>
                                        handleNavigation(
                                            "lateEnrollees"
                                        )
                                    }
                                />


                                <OperationCard
                                    icon="▰"
                                    title="Party List Management"
                                    description="Create, edit, review, approve, reject, activate, and deactivate party lists."
                                    buttonText="Manage Party Lists"
                                    onClick={() =>
                                        handleNavigation(
                                            "partyLists"
                                        )
                                    }
                                />


                                <OperationCard
                                    icon="♙"
                                    title="Candidate Management"
                                    description="Add candidates, assign positions, manage candidate information, and control candidate status."
                                    buttonText="Manage Candidates"
                                    onClick={() =>
                                        handleNavigation(
                                            "candidates"
                                        )
                                    }
                                />


                                <OperationCard
                                    icon="◉"
                                    title="Election Management"
                                    description="Configure the election date, voting period, positions, year-level access, and election status."
                                    buttonText="Manage Election"
                                    onClick={() =>
                                        handleNavigation(
                                            "election"
                                        )
                                    }
                                />


                                {/* =================================================
                                    KIOSK OPERATION
                                ================================================= */}

                                <OperationCard
                                    icon="▣"
                                    title="Kiosk Management"
                                    description="Start and manage temporary Electoral Board kiosk sessions used to assist students during the election."
                                    buttonText="Manage Kiosk"
                                    onClick={() =>
                                        handleNavigation(
                                            "kiosk"
                                        )
                                    }
                                />

                            </div>


                            {/* =================================================
                                SECURITY / INTEGRITY
                            ================================================= */}

                            <div
                                style={
                                    styles.sectionHeader
                                }
                            >

                                <div>

                                    <h2
                                        style={
                                            styles.sectionTitle
                                        }
                                    >
                                        Election Security
                                    </h2>


                                    <p
                                        style={
                                            styles.sectionDescription
                                        }
                                    >
                                        VOTARA election
                                        integrity and
                                        accountability.
                                    </p>

                                </div>

                            </div>


                            <div
                                style={
                                    styles.securityGrid
                                }
                            >

                                <SecurityCard
                                    title="Identity Verification"
                                    description="Student identity must be verified before the student becomes eligible for the election process."
                                    status="Active"
                                />


                                <SecurityCard
                                    title="Vote Integrity"
                                    description="Ballots are protected using server-authoritative validation and database integrity controls."
                                    status="Active"
                                />


                                <SecurityCard
                                    title="Audit Trail"
                                    description="Important registration, election, kiosk, and administrative actions can be recorded for accountability."
                                    status="Active"
                                />


                                <SecurityCard
                                    title="Role-Based Access"
                                    description="Electoral Board functions are protected by authenticated role-based access."
                                    status="Active"
                                />

                            </div>

                        </>
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
                        />

                    )}


                    {/* =================================================
                        LATE ENROLLEES
                    ================================================= */}

                    {activeSection ===
                        "lateEnrollees" && (

                        <LateEnrolleeManagement />

                    )}


                    {/* =================================================
                        PARTY LIST MANAGEMENT
                    ================================================= */}

                    {activeSection ===
                        "partyLists" && (

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

                    {activeSection ===
                        "election" && (

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

            <div
                style={
                    styles.moduleHeader
                }
            >

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


        style.id =
            styleId;


        style.innerHTML = `

            @media (max-width: 1200px) {

                .votara-eb-dashboard-placeholder {
                    display: block;
                }

                .votara-eb-dashboard-mobile {
                    display: block;
                }

            }


            @media (max-width: 1100px) {

                .votara-eb-dashboard-stats {
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                }

            }


            @media (max-width: 900px) {

                .votara-eb-dashboard-operations {
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                }

                .votara-eb-dashboard-security {
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                }

            }


            @media (max-width: 768px) {

                body {
                    overflow-x: hidden;
                }

                .votara-eb-dashboard-mobile {
                    display: block;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }

}


export default EBDashboard;