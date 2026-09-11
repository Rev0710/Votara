import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import {
    FiUsers,
    FiUserCheck,
    FiClock,
    FiActivity,
    FiSettings,
    FiFileText,
    FiBarChart2,
    FiShield,
    FiLogOut,
    FiRefreshCw,
    FiCheckCircle,
    FiAlertCircle,
    FiCalendar,
    FiDatabase,
    FiUserPlus,
    FiChevronRight,
} from "react-icons/fi";

import api from "../../services/api";

// =========================================================
// SYSTEM THEME
// =========================================================

const DEFAULT_PRIMARY = "#266EFF";

const hexToRgba = (hex, alpha) => {
    if (!hex) {
        return `rgba(38, 110, 255, ${alpha})`;
    }

    let cleanHex = hex.replace("#", "");

    if (cleanHex.length === 3) {
        cleanHex = cleanHex
            .split("")
            .map((char) => char + char)
            .join("");
    }

    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    if (
        Number.isNaN(r) ||
        Number.isNaN(g) ||
        Number.isNaN(b)
    ) {
        return `rgba(38, 110, 255, ${alpha})`;
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applySystemTheme = () => {
    try {
        const savedSettings =
            localStorage.getItem("votaraSystemSettings");

        const settings = savedSettings
            ? JSON.parse(savedSettings)
            : {};

        const primaryColor =
            settings.primaryColor || DEFAULT_PRIMARY;

        const root = document.documentElement;

        // Primary color
        root.style.setProperty(
            "--votara-primary",
            primaryColor
        );

        root.style.setProperty(
            "--votara-primary-light",
            hexToRgba(primaryColor, 0.10)
        );

        root.style.setProperty(
            "--votara-primary-medium",
            hexToRgba(primaryColor, 0.18)
        );

        root.style.setProperty(
            "--votara-primary-border",
            hexToRgba(primaryColor, 0.25)
        );

        // Theme
        root.setAttribute(
            "data-theme",
            settings.theme || "light"
        );
    } catch (error) {
        console.error(
            "Unable to apply system theme:",
            error
        );

        document.documentElement.setAttribute(
            "data-theme",
            "light"
        );
    }
}; 



// =========================================================
// ADMIN DASHBOARD
// =========================================================

function AdminDashboard() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);

    // =====================================================
// APPLY SYSTEM SETTINGS THEME
// =====================================================

useEffect(() => {
    // Apply saved color when dashboard loads
    applySystemTheme();

    // Update if settings are changed
    const handleSettingsChanged = () => {
        applySystemTheme();
    };

    window.addEventListener(
        "votaraSettingsChanged",
        handleSettingsChanged
    );

    // Also listen for changes from another browser tab
    window.addEventListener(
        "storage",
        handleSettingsChanged
    );

    return () => {
        window.removeEventListener(
            "votaraSettingsChanged",
            handleSettingsChanged
        );

        window.removeEventListener(
            "storage",
            handleSettingsChanged
        );
    };
}, []);

    const [loading, setLoading] = useState(true);

    const [dashboardLoading, setDashboardLoading] =
        useState(true);

    const [dashboardError, setDashboardError] =
        useState("");

    const [lastUpdated, setLastUpdated] =
        useState(null);

    const [stats, setStats] = useState({
        totalStudents: null,
        totalStaff: null,
        pendingRegistrations: null,
        activeUsers: null,
    });

    const [systemStatus, setSystemStatus] =
        useState({
            api: "Checking",
            database: "Checking",
        });

    // =====================================================
    // LOAD ADMIN SESSION
    // =====================================================

    useEffect(() => {
        const storedUser =
            localStorage.getItem(
                "votaraStaffUser"
            );

        const token =
            localStorage.getItem(
                "votaraStaffToken"
            );

        if (!token || !storedUser) {
            navigate("/admin-login", {
                replace: true,
            });

            return;
        }

        try {
            const user = JSON.parse(
                storedUser
            );

            if (user.role !== "admin") {
                navigate(
                    "/electoral-board/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            setAdmin(user);

            // Load system health
            checkSystem();

            // Load actual dashboard data
            loadDashboardData();

        } catch (error) {
            console.error(
                "Invalid staff session:",
                error
            );

            localStorage.removeItem(
                "votaraStaffToken"
            );

            localStorage.removeItem(
                "votaraStaffUser"
            );

            navigate("/admin-login", {
                replace: true,
            });
        }
    }, [navigate]);

    // =====================================================
// CHECK SYSTEM HEALTH
// =====================================================

const checkSystem = async () => {
    try {
        const response = await api.get(
            "/health"
        );

        if (response.data?.success) {
            setSystemStatus({
                api: "Online",

                database:
                    response.data.database ===
                    "Supabase"
                        ? "Connected"
                        : "Disconnected",
            });
        } else {
            setSystemStatus({
                api: "Unavailable",
                database: "Unknown",
            });
        }
    } catch (error) {
        console.error(
            "System health check failed:",
            error
        );

        setSystemStatus({
            api: "Offline",
            database: "Unavailable",
        });
    }
};

    // =====================================================
    // LOAD ADMIN DASHBOARD DATA
    // =====================================================

    const loadDashboardData = async () => {
        setDashboardLoading(true);
        setDashboardError("");

        try {
            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                );

            if (!token) {
                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            const response = await api.get(
                "/admin/dashboard",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                        "Unable to load dashboard data."
                );
            }

            const statistics =
                response.data.statistics || {};

            setStats({
                totalStudents:
                    statistics.totalStudents ??
                    0,

                totalStaff:
                    statistics.totalStaff ??
                    0,

                pendingRegistrations:
                    statistics.pendingRegistrations ??
                    0,

                activeUsers:
                    statistics.activeStaff ??
                    0,
            });

            setLastUpdated(
                response.data.generatedAt
                    ? new Date(
                          response.data.generatedAt
                      )
                    : new Date()
            );

        } catch (error) {
            console.error(
                "❌ Admin dashboard data error:",
                error
            );

            if (
                error.response?.status === 401
            ) {
                localStorage.removeItem(
                    "votaraStaffToken"
                );

                localStorage.removeItem(
                    "votaraStaffUser"
                );

                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            setDashboardError(
                error.response?.data?.message ||
                    error.message ||
                    "Unable to load Admin Dashboard data."
            );

        } finally {
            setDashboardLoading(false);
            setLoading(false);
        }
    };

    // =====================================================
    // REFRESH EVERYTHING
    // =====================================================

    const handleRefresh = async () => {
        await Promise.all([
            checkSystem(),
            loadDashboardData(),
        ]);
    };

    // =====================================================
    // LOGOUT
    // =====================================================

    const handleLogout = () => {
        localStorage.removeItem(
            "votaraStaffToken"
        );

        localStorage.removeItem(
            "votaraStaffUser"
        );

        navigate("/admin-login", {
            replace: true,
        });
    };

    // =====================================================
    // NAVIGATION
    // =====================================================

    const goTo = (path) => {
        navigate(path);
    };

    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatDate = (date) => {
        if (!date) {
            return "Not available";
        }

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // =====================================================
    // MENU ITEMS
    // =====================================================

    const managementItems = [
        {
            title: "Student Management",
            description:
                "View and manage registered students.",
            icon: FiUsers,
            path: "/admin/students",
        },

        {
            title: "Electoral Board",
            description:
                "Manage Electoral Board staff accounts.",
            icon: FiUserCheck,
            path: "/admin/electoral-board",
        },

        {
            title: "Admin Accounts",
            description:
                "Create and manage administrator accounts.",
            icon: FiShield,
            path: "/admin/admin-accounts",
        },

        {
            title: "Candidate Management",
            description:
                "Review and manage election candidates.",
            icon: FiUserPlus,
            path: "/admin/candidates",
        },

        {
            title: "Election Management",
            description:
                "Configure election settings and status.",
            icon: FiCalendar,
            path: "/admin/election",
        },

        {
        title: "System Settings",
        description:
            "Configure system preferences and appearance.",
        icon: FiSettings,
        path: "/admin/settings",
    },
    ];

    const monitoringItems = [
        {
            title: "Audit Logs",
            description:
                "Review important system activities.",
            icon: FiActivity,
            path: "/admin/audit-logs",
        },

        {
            title: "Reports",
            description:
                "View system and election reports.",
            icon: FiBarChart2,
            path: "/admin/reports",
        },

        {
            title: "Election Results",
            description:
                "View election result information.",
            icon: FiFileText,
            path: "/admin/results",
        },
    ];

    // =====================================================
    // LOADING
    // =====================================================

    if (!admin) {
        return (
            <div style={styles.loadingPage}>
                <div style={styles.loadingSpinner}>
                    <FiRefreshCw size={28} />
                </div>

                <p>
                    Loading Admin Dashboard...
                </p>
            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div style={styles.page}>
            {/* =================================================
                SIDEBAR
            ================================================= */}

            <aside
    className="votara-admin-sidebar"
    style={styles.sidebar}
>
                <div style={styles.logoArea}>
                    <div style={styles.logoIcon}>
                        <FiShield size={25} />
                    </div>

                    <div>
                        <h2 style={styles.logoText}>
                            VOTARA
                        </h2>

                        <span
                            style={
                                styles.logoSubtitle
                            }
                        >
                            ADMIN PANEL
                        </span>
                    </div>
                </div>

                {/* ADMIN PROFILE */}

                <div
                    style={styles.adminProfile}
                >
                    <div style={styles.avatar}>
                        {admin.full_name
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "A"}
                    </div>

                    <div
                        style={
                            styles.profileInfo
                        }
                    >
                        <strong>
                            {admin.full_name ||
                                "Administrator"}
                        </strong>

                        <span>
                            Administrator
                        </span>
                    </div>
                </div>

                {/* NAVIGATION */}

                <nav style={styles.navigation}>
                    <div
                        style={
                            styles.navSection
                        }
                    >
                        <span
                            style={
                                styles.navSectionTitle
                            }
                        >
                            MAIN
                        </span>

                        <button
                            style={{
                                ...styles.navItem,
                                ...styles.navItemActive,
                            }}
                        >
                            <FiBarChart2
                                size={18}
                            />

                            <span>
                                Dashboard
                            </span>
                        </button>
                    </div>

                    <div
                        style={
                            styles.navSection
                        }
                    >
                        <span
                            style={
                                styles.navSectionTitle
                            }
                        >
                            MANAGEMENT
                        </span>

                        <button
                            style={styles.navItem}
                            onClick={() =>
                                goTo(
                                    "/admin/students"
                                )
                            }
                        >
                            <FiUsers size={18} />
                            <span>
                                Students
                            </span>
                        </button>

                        <button
                            style={styles.navItem}
                            onClick={() =>
                                goTo(
                                    "/admin/electoral-board"
                                )
                            }
                        >
                            <FiUserCheck
                                size={18}
                            />

                            <span>
                                Electoral Board
                            </span>
                        </button>

                        <button
                            style={styles.navItem}
                            onClick={() =>
                                goTo(
                                    "/admin/candidates"
                                )
                            }
                        >
                            <FiUserPlus
                                size={18}
                            />

                            <span>
                                Candidates
                            </span>
                        </button>

                        <button
                            style={styles.navItem}
                            onClick={() =>
                                goTo(
                                    "/admin/election"
                                )
                            }
                        >
                            <FiCalendar
                                size={18}
                            />

                            <span>
                                Election
                            </span>
                        </button>
                    </div>

                    <div
                        style={
                            styles.navSection
                        }
                    >
                        <span
                            style={
                                styles.navSectionTitle
                            }
                        >
                            MONITORING
                        </span>

                        <button
                            style={styles.navItem}
                            onClick={() =>
                                goTo(
                                    "/admin/audit-logs"
                                )
                            }
                        >
                            <FiActivity
                                size={18}
                            />

                            <span>
                                Audit Logs
                            </span>
                        </button>

                        <button
                            style={styles.navItem}
                            onClick={() =>
                                goTo(
                                    "/admin/reports"
                                )
                            }
                        >
                            <FiBarChart2
                                size={18}
                            />

                            <span>
                                Reports
                            </span>
                        </button>

                        <button
                            style={styles.navItem}
                            onClick={() =>
                                goTo(
                                    "/admin/results"
                                )
                            }
                        >
                            <FiFileText
                                size={18}
                            />

                            <span>
                                Election Results
                            </span>
                        </button>
                    </div>
                </nav>

                {/* SIDEBAR BOTTOM */}

                <div
                    style={
                        styles.sidebarBottom
                    }
                >
                <button
                    style={styles.settingsButton}
                    onClick={() => goTo("/admin/settings")}
                    >
                    <FiSettings size={18} />

                    <span>
                    System Settings
                    </span>
                </button>

                    <button
                        style={
                            styles.logoutButton
                        }
                        onClick={handleLogout}
                    >
                        <FiLogOut size={18} />

                        <span>
                            Logout
                        </span>
                    </button>
                </div>
            </aside>

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main
                className="votara-admin-main"
                style={styles.main}
            >
                {/* HEADER */}

                <header
                    className="votara-admin-header"
                    style={styles.header}
                >
                    <div>
                        <span
                            style={
                                styles.pageLabel
                            }
                        >
                            VOTARA ADMINISTRATION
                        </span>

                        <h1
                            style={styles.title}
                        >
                            Admin Dashboard
                        </h1>

                        <p
                            style={
                                styles.subtitle
                            }
                        >
                            Monitor and manage the
                            VOTARA voting system.
                        </p>
                    </div>

                    <div
                        style={
                            styles.headerActions
                        }
                    >
                        <div
                            style={
                                styles.systemOnlineBadge
                            }
                        >
                            <span
                                style={
                                    styles.onlineDot
                                }
                            />

                            System{" "}
                            {systemStatus.api ===
                            "Online"
                                ? "Online"
                                : "Status"}
                        </div>

                        <button
                            style={
                                styles.refreshButton
                            }
                            onClick={
                                handleRefresh
                            }
                            disabled={
                                dashboardLoading
                            }
                        >
                            <FiRefreshCw
                                size={17}
                                style={{
                                    animation:
                                        dashboardLoading
                                            ? "spin 1s linear infinite"
                                            : "none",
                                }}
                            />

                            Refresh
                        </button>
                    </div>
                </header>

                {/* =================================================
                    ERROR MESSAGE
                ================================================= */}

                {dashboardError && (
                    <div
                        style={
                            styles.errorBanner
                        }
                    >
                        <FiAlertCircle
                            size={20}
                        />

                        <div>
                            <strong>
                                Dashboard data could
                                not be loaded
                            </strong>

                            <p>
                                {dashboardError}
                            </p>
                        </div>
                    </div>
                )}

                {/* =================================================
                    SYSTEM OVERVIEW
                ================================================= */}

                <section>
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
                                System Overview
                            </h2>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                Current VOTARA system
                                status and statistics.
                            </p>
                        </div>
                    </div>

                    <div
                        className="votara-admin-stats"
                        style={
                            styles.statsGrid
                        }
                    >
                        <StatCard
                            title="Total Students"
                            value={
                                stats.totalStudents ??
                                "—"
                            }
                            icon={FiUsers}
                            description="Registered students"
                            loading={
                                dashboardLoading
                            }
                        />

                        <StatCard
                            title="Staff Accounts"
                            value={
                                stats.totalStaff ??
                                "—"
                            }
                            icon={FiUserCheck}
                            description="Admin and EB accounts"
                            loading={
                                dashboardLoading
                            }
                        />

                        <StatCard
                            title="Pending Registrations"
                            value={
                                stats.pendingRegistrations ??
                                "—"
                            }
                            icon={FiClock}
                            description="Awaiting review"
                            loading={
                                dashboardLoading
                            }
                        />

                        <StatCard
                            title="Active Users"
                            value={
                                stats.activeUsers ??
                                "—"
                            }
                            icon={FiActivity}
                            description="Currently active staff accounts"
                            loading={
                                dashboardLoading
                            }
                        />
                    </div>
                </section>

                {/* =================================================
                    SYSTEM HEALTH
                ================================================= */}

                <section
                    style={styles.section}
                >
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
                                System Health
                            </h2>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                Monitor the availability
                                of core VOTARA services.
                            </p>
                        </div>
                    </div>

                    <div
                        className="votara-admin-health"
                        style={
                            styles.healthGrid
                        }
                    >
                        <HealthCard
                            title="API Server"
                            status={
                                systemStatus.api
                            }
                            icon={FiActivity}
                        />

                        <HealthCard
                            title="Database"
                            status={
                                systemStatus.database
                            }
                            icon={FiDatabase}
                        />

                        <HealthCard
                            title="Authentication"
                            status="Protected"
                            icon={FiShield}
                        />

                        <HealthCard
                            title="Access Control"
                            status="RBAC Enabled"
                            icon={FiUserCheck}
                        />
                    </div>
                </section>

                {/* =================================================
                    USER & SYSTEM MANAGEMENT
                ================================================= */}

                <section
                    style={styles.section}
                >
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
                                User & System Management
                            </h2>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                Access the main administrative
                                functions of VOTARA.
                            </p>
                        </div>
                    </div>

                    <div
                        className="votara-admin-management"
                        style={
                            styles.managementGrid
                        }
                    >
                        {managementItems.map(
                            (item) => (
                                <ManagementCard
                                    key={
                                        item.title
                                    }
                                    item={item}
                                    onClick={() =>
                                        goTo(
                                            item.path
                                        )
                                    }
                                />
                            )
                        )}
                    </div>
                </section>

                {/* =================================================
                    MONITORING & REPORTS
                ================================================= */}

                <section
                    style={styles.section}
                >
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
                                Monitoring & Reports
                            </h2>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                Review activity, reports,
                                and election information.
                            </p>
                        </div>
                    </div>

                    <div
                        className="votara-admin-management"
                        style={
                            styles.managementGrid
                        }
                    >
                        {monitoringItems.map(
                            (item) => (
                                <ManagementCard
                                    key={
                                        item.title
                                    }
                                    item={item}
                                    onClick={() =>
                                        goTo(
                                            item.path
                                        )
                                    }
                                />
                            )
                        )}
                    </div>
                </section>

                {/* =================================================
                    ADMIN ACCESS
                ================================================= */}

                <section
                    style={styles.section}
                >
                    <div
                        style={
                            styles.infoPanel
                        }
                    >
                        <div
                            style={
                                styles.infoIcon
                            }
                        >
                            <FiCheckCircle
                                size={24}
                            />
                        </div>

                        <div
                            style={
                                styles.infoContent
                            }
                        >
                            <h3>
                                Administrator Access
                            </h3>

                            <p>
                                You are currently
                                signed in as an
                                administrator. Access
                                to administrative
                                functions is protected
                                by VOTARA role-based
                                access control.
                            </p>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}

                <footer
                    style={styles.footer}
                >
                    <span>
                        VOTARA Online Voting System
                    </span>

                    <span>
                        Last checked:{" "}
                        {formatDate(
                            lastUpdated
                        )}
                    </span>
                </footer>
            </main>

            {/* =================================================
                RESPONSIVE CSS
            ================================================= */}

            <style>
                {`
                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    * {
                        box-sizing: border-box;
                    }

                    button {
                        font-family: inherit;
                    }

                    @media (max-width: 1100px) {
                        .votara-admin-main {
                            padding: 28px !important;
                        }
                    }

                    @media (max-width: 850px) {
                        .votara-admin-sidebar {
                            display: none;
                        }

                        .votara-admin-main {
                            margin-left: 0 !important;
                        }
                    }

                    @media (max-width: 650px) {
                        .votara-admin-main {
                            padding: 20px !important;
                        }

                        .votara-admin-header {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                        }

                        .votara-admin-stats {
                            grid-template-columns: 1fr !important;
                        }

                        .votara-admin-health {
                            grid-template-columns: 1fr !important;
                        }

                        .votara-admin-management {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}
            </style>
        </div>
    );
}

// =========================================================
// STAT CARD
// =========================================================

function StatCard({
    title,
    value,
    icon: Icon,
    description,
    loading,
}) {
    return (
        <div style={styles.statCard}>
            <div style={styles.statTop}>
                <div style={styles.statIcon}>
                    <Icon size={21} />
                </div>

                <span style={styles.statLabel}>
                    {title}
                </span>
            </div>

            <div style={styles.statValue}>
                {loading ? "..." : value}
            </div>

            <span
                style={
                    styles.statDescription
                }
            >
                {description}
            </span>
        </div>
    );
}

// =========================================================
// HEALTH CARD
// =========================================================

function HealthCard({
    title,
    status,
    icon: Icon,
}) {
    const isGood =
        status === "Online" ||
        status === "Connected" ||
        status === "Protected" ||
        status === "RBAC Enabled";

    return (
        <div style={styles.healthCard}>
            <div style={styles.healthIcon}>
                <Icon size={20} />
            </div>

            <div
                style={
                    styles.healthContent
                }
            >
                <strong>{title}</strong>

                <span
                    style={{
                        ...styles.healthStatus,
                        ...(isGood
                            ? styles.healthGood
                            : styles.healthWarning),
                    }}
                >
                    {isGood ? (
                        <FiCheckCircle
                            size={14}
                        />
                    ) : (
                        <FiAlertCircle
                            size={14}
                        />
                    )}

                    {status}
                </span>
            </div>
        </div>
    );
}

// =========================================================
// MANAGEMENT CARD
// =========================================================

function ManagementCard({
    item,
    onClick,
}) {
    const Icon = item.icon;

    return (
        <button
            style={
                styles.managementCard
            }
            onClick={onClick}
        >
            <div
                style={
                    styles.managementIcon
                }
            >
                <Icon size={22} />
            </div>

            <div
                style={
                    styles.managementContent
                }
            >
                <h3>{item.title}</h3>

                <p>{item.description}</p>
            </div>

            <FiChevronRight
                size={20}
                style={styles.chevron}
            />
        </button>
    );
}

// =========================================================
// STYLES
// =========================================================

const styles = {
    page: {
        minHeight: "100vh",
        background: "var(--admin-bg)",
        color: "var(--admin-text)",
        fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    sidebar: {
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "260px",
        background: "#101828",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        zIndex: 100,
        boxShadow:
            "4px 0 20px rgba(16, 24, 40, 0.08)",
    },

    logoArea: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "25px 22px",
        borderBottom:
            "1px solid rgba(255,255,255,0.08)",
    },

    logoIcon: {
        width: "43px",
        height: "43px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--votara-primary, #266EFF)",
    },

    logoText: {
        margin: 0,
        fontSize: "21px",
        fontWeight: 800,
        letterSpacing: "1px",
    },

    logoSubtitle: {
        display: "block",
        marginTop: "2px",
        fontSize: "9px",
        letterSpacing: "1.5px",
        color: "#98A2B3",
        fontWeight: 600,
    },

    adminProfile: {
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: "20px",
        borderBottom:
            "1px solid rgba(255,255,255,0.08)",
    },

    avatar: {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        background: "var(--votara-primary, #266EFF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "17px",
        fontWeight: 700,
    },

    profileInfo: {
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
    },

    navigation: {
        flex: 1,
        overflowY: "auto",
        padding: "18px 12px",
    },

    navSection: {
        marginBottom: "22px",
    },

    navSectionTitle: {
        display: "block",
        padding:
            "0 12px 8px",
        fontSize: "9px",
        fontWeight: 700,
        letterSpacing: "1.3px",
        color: "#667085",
    },

    navItem: {
        width: "100%",
        border: "none",
        background: "transparent",
        color: "#98A2B3",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 12px",
        borderRadius: "9px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "13px",
        marginBottom: "3px",
    },

    navItemActive: {
        background: "var(--votara-primary, #266EFF)",
        color: "#ffffff",
        fontWeight: 600,
    },

    sidebarBottom: {
        padding: "14px 12px",
        borderTop:
            "1px solid rgba(255,255,255,0.08)",
    },

    settingsButton: {
        width: "100%",
        border: "none",
        background: "transparent",
        color: "#98A2B3",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 12px",
        borderRadius: "9px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "13px",
    },

    logoutButton: {
        width: "100%",
        border: "none",
        background:
            "rgba(255,255,255,0.05)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 12px",
        borderRadius: "9px",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "13px",
        marginTop: "4px",
    },

    main: {
        marginLeft: "260px",
        minHeight: "100vh",
        padding: "34px 42px",
    },

    header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "25px",
        marginBottom: "34px",
    },

    pageLabel: {
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "1.5px",
        color: "var(--votara-primary, #266EFF)",
    },

    title: {
        margin: "7px 0 5px",
        fontSize: "30px",
        fontWeight: 800,
        letterSpacing: "-0.7px",
    },

    subtitle: {
        margin: 0,
        color: "#667085",
        fontSize: "14px",
    },

    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },

    systemOnlineBadge: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding: "9px 13px",
        background: "var(--admin-card)",
border: "1px solid var(--admin-border)",
        borderRadius: "9px",
        fontSize: "12px",
        fontWeight: 600,
    },

    onlineDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#2ED171",
    },

    refreshButton: {
        border:
            "1px solid #D0D5DD",
        background: "var(--admin-card)",
        color: "var(--admin-text)",
        borderRadius: "9px",
        padding: "9px 13px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
    },

    errorBanner: {
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "15px 17px",
        marginBottom: "25px",
        bbackground: "var(--admin-bg)",
border: "1px solid var(--admin-border)",
        borderRadius: "12px",
        color: "#B42318",
    },

    section: {
        marginTop: "34px",
    },

    sectionHeader: {
        marginBottom: "15px",
    },

    sectionTitle: {
        margin: 0,
        fontSize: "18px",
        fontWeight: 750,
    },

    sectionDescription: {
        margin: "4px 0 0",
        color: "#667085",
        fontSize: "12px",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px",
    },

    statCard: {
        background: "var(--admin-card)",
        border:
            "1px solid var(--admin-border)",
        borderRadius: "14px",
        padding: "19px",
        boxShadow:
            "0 2px 5px rgba(16,24,40,0.03)",
    },

    statTop: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },

    statIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "var(--votara-primary-light, #EEF4FF)",
        color: "var(--votara-primary, #266EFF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    statLabel: {
        color: "#667085",
        fontSize: "12px",
        fontWeight: 600,
    },

    statValue: {
        marginTop: "15px",
        fontSize: "27px",
        fontWeight: 800,
    },

    statDescription: {
        display: "block",
        marginTop: "4px",
        color: "#98A2B3",
        fontSize: "11px",
    },

    healthGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px",
    },

    healthCard: {
        background: "var(--admin-card)",
        border:
            "1px solid var(--admin-border)",
        borderRadius: "14px",
        padding: "17px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    healthIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "var(--admin-card)",
        color: "var(--admin-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    healthContent: {
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        minWidth: 0,
    },

    healthStatus: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        fontWeight: 600,
    },

    healthGood: {
        color: "#039855",
    },

    healthWarning: {
        color: "#D92D20",
    },

    managementGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "15px",
    },

    managementCard: {
        width: "100%",
        border:
            "1px solid var(--admin-border)",
        background: "var(--admin-card)",
        borderRadius: "14px",
        padding: "18px",
        display: "flex",
        alignItems: "center",
        gap: "13px",
        cursor: "pointer",
        textAlign: "left",
        boxShadow:
            "0 2px 5px rgba(16,24,40,0.03)",
    },

    managementIcon: {
        width: "43px",
        height: "43px",
        borderRadius: "11px",
        background: "var(--votara-primary-light, #EEF4FF)",
        color: "var(--votara-primary, #266EFF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    managementContent: {
        flex: 1,
    },

    chevron: {
        color: "#98A2B3",
        flexShrink: 0,
    },

    infoPanel: {
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "18px",
        background: "var(--votara-primary-light, #EEF4FF)",
border: "1px solid var(--admin-border)",
        borderRadius: "14px",
    },

    infoIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "var(--admin-card)",
        color: "var(--votara-primary, #266EFF)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    infoContent: {
        flex: 1,
    },

    footer: {
        marginTop: "40px",
        padding:
            "20px 0 5px",
        borderTop:
            "1px solid var(--admin-border)",
        display: "flex",
        justifyContent: "space-between",
        gap: "20px",
        color: "#98A2B3",
        fontSize: "11px",
    },

    loadingPage: {
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--admin-bg)",
        color: "var(--admin-text)",
    },

    loadingSpinner: {
        color: "var(--votara-primary, #266EFF)",
        marginBottom: "10px",
    },
};

export default AdminDashboard;