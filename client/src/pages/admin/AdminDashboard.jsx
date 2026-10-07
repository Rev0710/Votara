import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import InviteTeamPopUp from "./InviteTeamPopUp";
import PageLoader from "/src/components/transitionloader/PageLoader";

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
    FiBell,
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
        const theme = settings.theme || "light";

root.setAttribute("data-theme", theme);

// =====================================================
// THEME COLORS
// =====================================================

if (theme === "light") {
    root.style.setProperty("--admin-bg", "#F6F8FC");
    root.style.setProperty("--admin-card", "#FFFFFF");
    root.style.setProperty("--admin-text", "#101828");
    root.style.setProperty("--admin-text-secondary", "#475467");
    root.style.setProperty("--admin-text-muted", "#667085");
    root.style.setProperty("--admin-border", "#E4E7EC");
    root.style.setProperty("--admin-hover", "#F2F4F7");
    root.style.setProperty("--admin-input-bg", "#FFFFFF");
} else {
    root.style.setProperty("--admin-bg", "#0B1020");
    root.style.setProperty("--admin-card", "#151B2E");
    root.style.setProperty("--admin-text", "#F8FAFC");
    root.style.setProperty("--admin-text-secondary", "#CBD5E1");
    root.style.setProperty("--admin-text-muted", "#94A3B8");
    root.style.setProperty("--admin-border", "rgba(255,255,255,0.10)");
    root.style.setProperty("--admin-hover", "rgba(255,255,255,0.06)");
    root.style.setProperty("--admin-input-bg", "#10172A");
}
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

    const [showInviteModal, setShowInviteModal] = useState(false);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const openInviteModal = () => {
    setShowInviteModal(true);
};

const closeInviteModal = () => {
    setShowInviteModal(false);
};

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

    // Page transition loader
    const [isPageTransitioning, setIsPageTransitioning] =
        useState(false);

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
        totalUsers: null,
        totalElections: null,
    });

    // =====================================================
    // SYSTEM DASHBOARD DATA
    // =====================================================

    const [systemDashboard, setSystemDashboard] = useState({
        systemHealth: {
            status: "Checking",
            api: "Checking",
            database: "Checking",
        },

        totalUsers: 0,

        electionStatus: {
            status: "No Election",
            election: null,
        },

        serverUsage: {
            memoryPercent: 0,
            heapUsedMB: 0,
            heapTotalMB: 0,
            uptimeSeconds: 0,
            nodeVersion: "",
        },

        activityLogs: {
            total: 0,
            recent: [],
        },
    });

    const [systemStatus, setSystemStatus] =
        useState({
            api: "Checking",
            database: "Checking",
        });

    // Authoritative settings loaded from the Admin Settings API.
    // Dashboard display values should come from the server, not hardcoded UI values.
    const [systemSettings, setSystemSettings] = useState({});

    // =====================================================
    // LOAD ADMIN SESSION
    // =====================================================
    // Admin uses its own session keys so an Electoral Board login cannot overwrite it.

    useEffect(() => {
        const storedUser =
            localStorage.getItem(
                "votaraAdminUser"
            );

        const token =
            localStorage.getItem(
                "votaraAdminToken"
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
                navigate("/admin-login", {
                    replace: true,
                });

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
                "votaraAdminToken"
            );

            localStorage.removeItem(
                "votaraAdminUser"
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
                    "votaraAdminToken"
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

    totalUsers:
        statistics.totalUsers ??
        (
            Number(statistics.totalStudents || 0) +
            Number(statistics.totalStaff || 0)
        ),

    totalElections:
        statistics.totalElections ??
        0,
});

            // =====================================================
            // LOAD SYSTEM DASHBOARD
            // =====================================================

            const dashboardSystem =
                response.data.systemDashboard || {};

            setSystemDashboard({
                systemHealth:
                    dashboardSystem.systemHealth || {
                        status: "Unknown",
                        api: "Unknown",
                        database: "Unknown",
                    },

                totalUsers:
                    dashboardSystem.totalUsers ??
                    statistics.totalUsers ??
                    (
                        Number(statistics.totalStudents || 0) +
                        Number(statistics.totalStaff || 0)
                    ),

                electionStatus:
                    dashboardSystem.electionStatus || {
                        status: "No Election",
                        election: null,
                    },

                serverUsage:
                    dashboardSystem.serverUsage || {
                        memoryPercent: null,
                        heapUsedMB: null,
                        heapTotalMB: null,
                        uptimeSeconds: null,
                        nodeVersion: "",
                    },

                activityLogs:
                    dashboardSystem.activityLogs || {
                        total: 0,
                        recent: [],
                    },
            });

            // System settings are authoritative on the server/database.
            // A settings failure must not prevent the dashboard statistics from rendering.
            try {
                const settingsResponse = await api.get("/admin/settings", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (settingsResponse.data?.success) {
                    setSystemSettings(settingsResponse.data.settings || {});
                }
            } catch (settingsError) {
                console.warn(
                    "Unable to load Admin System Settings for dashboard:",
                    settingsError?.response?.data?.message || settingsError?.message
                );
            }

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
                error.response?.status === 401 ||
                error.response?.status === 403
            ) {
                localStorage.removeItem(
                    "votaraAdminToken"
                );

                localStorage.removeItem(
                    "votaraAdminUser"
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

    const confirmLogout = () => {
        localStorage.removeItem(
            "votaraAdminToken"
        );

        localStorage.removeItem(
            "votaraAdminUser"
        );

        navigate("/admin-login", {
            replace: true,
        });
    };

    const requestLogout = () => {
        setShowLogoutConfirm(true);
    };

    // =====================================================
    // NAVIGATION
    // =====================================================

    const goTo = (path) => {
        // Always show the page transition, including when returning
        // to the dashboard from another navigation page.
        if (isPageTransitioning) {
            return;
        }

        setIsPageTransitioning(true);

        // Start the transition first, then change the route.
        window.setTimeout(() => {
            navigate(path);
        }, 700);
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

    const formatRelativeTime = (value) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
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
            {isPageTransitioning && <PageLoader />}

            <InviteTeamPopUp
    isOpen={showInviteModal}
    onClose={closeInviteModal}
/>
            {/* =================================================
                TOP NAVIGATION
                Shared VOTARA Admin navigation.
            ================================================= */}

            <header className="votara-admin-topbar">
                <button
                    type="button"
                    className="votara-admin-brand"
                    onClick={() => goTo("/admin-dashboard")}
                    aria-label="Votara System Dashboard"
                >
                    <span className="votara-admin-brand-mark" aria-hidden="true">
                        <img
                            src="/src/images/Votara.png"
                            alt=""
                            className="votara-admin-brand-logo"
                        />
                    </span>
                    <span className="votara-admin-brand-name">Votara</span>
                </button>

                <nav className="votara-admin-topnav" aria-label="Admin navigation">
                    <button type="button" className="votara-admin-topnav-link active" onClick={() => goTo("/admin-dashboard")}>
                        System Dashboard
                    </button>
                    <button type="button" className="votara-admin-topnav-link" onClick={() => goTo("/admin/users")}>
                        User &amp; Access Management
                    </button>
                    <button type="button" className="votara-admin-topnav-link" onClick={() => goTo("/admin/data-management")}>
                        Data Management
                    </button>
                    <button type="button" className="votara-admin-topnav-link" onClick={() => goTo("/admin/settings")}>
                        System Configuration
                    </button>
                    <button type="button" className="votara-admin-topnav-link" onClick={() => goTo("/admin/audit-logs")}>
                        Monitoring &amp; Logs
                    </button>
                    <button type="button" className="votara-admin-topnav-link" onClick={() => goTo("/admin/reports")}>
                        Reports &amp; Analytics
                    </button>
                </nav>

                <div className="votara-admin-topbar-actions">
                    <button
                        type="button"
                        className="votara-notification-button"
                        onClick={() => goTo("/admin/audit-logs")}
                        title="Notifications"
                        aria-label="Notifications"
                    >
                        <span className="notification-dot"></span>
                        <FiBell size={16} />
                    </button>
                    <div className="votara-admin-user">
                        <span className="votara-admin-user-avatar">
                            {admin.full_name?.charAt(0)?.toUpperCase() || "A"}
                        </span>
                        <span className="votara-admin-user-name">
                            {admin.full_name || "Administrator"}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="votara-admin-logout"
                        onClick={requestLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <FiLogOut size={17} />
                    </button>
                </div>
            </header>

            {/* LOGOUT CONFIRMATION */}
            {showLogoutConfirm && (
                <div
                    className="votara-dashboard-logout-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowLogoutConfirm(false);
                        }
                    }}
                >
                    <div
                        className="votara-dashboard-logout-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="votara-dashboard-logout-title"
                    >
                        <div className="votara-dashboard-logout-icon">
                            <FiLogOut size={20} />
                        </div>

                        <div>
                            <h2 id="votara-dashboard-logout-title">Sign out?</h2>
                            <p>Are you sure you want to sign out of your VOTARA Admin account?</p>
                        </div>

                        <div className="votara-dashboard-logout-actions">
                            <button
                                type="button"
                                className="votara-dashboard-logout-cancel"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="votara-dashboard-logout-confirm"
                                onClick={confirmLogout}
                            >
                                <FiLogOut size={15} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                MAIN CONTENT
            ================================================= */}

            <main
                className="votara-admin-main"
                style={styles.main}
            >
                {/* HEADER */}

                <section className="votara-admin-hero">
                    <div className="votara-admin-hero-copy">
                        <span className="votara-admin-kicker">VOTARA ADMINISTRATION</span>
                        <h1>Admin Dashboard</h1>
                        <p>Manage accounts, elections, and platform health across every campus. Actions are written to the audit log.</p>
                    </div>

                    <div className="votara-admin-hero-actions">
                        <button
                        className="votara-primary-action"
                        onClick={() => goTo("/admin/users")}
                    >
                        <FiUserPlus size={16} />
                        Invite User
                    </button>
                    </div>
                </section>

                {/* =========================================================
    STEP 2 — SYSTEM DASHBOARD
========================================================= */}

<section
    style={{
        marginBottom: "24px",
    }}
>

    <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "14px",
        }}
    >

        <div>

            <span
                style={{
                    display: "block",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color:
                        "var(--votara-primary)",
                    marginBottom: "4px",
                }}
            >
                ADMIN SYSTEM MANAGEMENT
            </span>

            <h2
                style={{
                    margin: 0,
                    fontSize: "21px",
                    fontWeight: 800,
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                System Dashboard
            </h2>

            <p
                style={{
                    margin:
                        "5px 0 0",
                    fontSize: "13px",
                    color:
                        "var(--admin-text-secondary, #64748B)",
                }}
            >
                Live overview of VOTARA system operations.
            </p>

        </div>


        <button
            type="button"
            onClick={handleRefresh}
            disabled={dashboardLoading}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding:
                    "9px 13px",
                borderRadius: "9px",
                border:
                    "1px solid var(--admin-border, #E2E8F0)",
                background:
                    "var(--admin-card, #FFFFFF)",
                color:
                    "var(--admin-text, #172033)",
                cursor:
                    dashboardLoading
                        ? "wait"
                        : "pointer",
                fontSize: "12px",
                fontWeight: 700,
            }}
        >

            <FiRefreshCw
                size={14}
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


    <div
      className="admin-system-dashboard-grid"
        style={{
            display: "grid",
            gridTemplateColumns:
                "repeat(5, minmax(0, 1fr))",
            gap: "12px",
        }}
    >

        {/* =================================================
            SYSTEM HEALTH
        ================================================= */}

        <button
            type="button"
            onClick={() =>
                goTo("/admin/settings")
            }
            style={{
                textAlign: "left",
                border:
                    "1px solid var(--admin-border, #E2E8F0)",
                background:
                    "var(--admin-card, #FFFFFF)",
                borderRadius: "14px",
                padding: "17px",
                minHeight: "142px",
                cursor: "pointer",
                boxShadow:
                    "0 5px 18px rgba(15, 23, 42, 0.05)",
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent:
                        "space-between",
                    alignItems: "center",
                    marginBottom: "18px",
                }}
            >

                <span
                    style={{
                        width: "36px",
                        height: "36px",
                        display: "grid",
                        placeItems: "center",
                        borderRadius: "10px",
                        background:
                            "rgba(34, 197, 94, 0.10)",
                        color: "#16A34A",
                    }}
                >
                    <FiActivity
                        size={18}
                    />
                </span>

                <span
                    style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background:
                            systemDashboard.systemHealth.status ===
                            "Online"
                                ? "#16A34A"
                                : "#F59E0B",
                    }}
                />

            </div>

            <strong
                style={{
                    display: "block",
                    fontSize: "13px",
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                System Health
            </strong>

            <strong
                style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "19px",
                    color: "#16A34A",
                }}
            >
                {systemDashboard.systemHealth.status}
            </strong>

            <span
                style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "11px",
                    color:
                        "var(--admin-text-muted, #94A3B8)",
                }}
            >
                API:{" "}
                {systemDashboard.systemHealth.api}
                {" · "}
                DB:{" "}
                {systemDashboard.systemHealth.database}
            </span>

        </button>


        {/* =================================================
            TOTAL USERS
        ================================================= */}

        <button
            type="button"
            className="admin-total-users-card"
            onClick={() =>
                goTo("/admin/students")
            }
            style={{
                textAlign: "left",
                border:
                    "1px solid var(--admin-border, #E2E8F0)",
                background:
                    "var(--admin-card, #FFFFFF)",
                borderRadius: "14px",
                padding: "17px",
                minHeight: "142px",
                cursor: "pointer",
                boxShadow:
                    "0 5px 18px rgba(15, 23, 42, 0.05)",
            }}
        >

            <div
                style={{
                    width: "36px",
                    height: "36px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "10px",
                    background:
                        "rgba(38, 110, 255, 0.10)",
                    color:
                        "var(--votara-primary)",
                    marginBottom: "18px",
                }}
            >
                <FiUsers
                    size={18}
                />
            </div>

            <strong
                style={{
                    display: "block",
                    fontSize: "13px",
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                Total Users
            </strong>

            <div className="admin-total-users-split">
                <div className="admin-total-users-stat">
                    <strong>
                        {dashboardLoading
                            ? "..."
                            : (
                                stats.totalStudents ??
                                0
                            ).toLocaleString()}
                    </strong>
                    <span>Students</span>
                </div>

                <div
                    className="admin-total-users-divider"
                    aria-hidden="true"
                />

                <div className="admin-total-users-stat">
                    <strong>
                        {dashboardLoading
                            ? "..."
                            : (
                                stats.totalStaff ??
                                0
                            ).toLocaleString()}
                    </strong>
                    <span>Staff</span>
                </div>
            </div>

            <span
                style={{
                    display: "block",
                    marginTop: "8px",
                    fontSize: "11px",
                    color:
                        "var(--admin-text-muted, #94A3B8)",
                }}
            >
                Combined total:{" "}
                {dashboardLoading
                    ? "..."
                    : (
                        systemDashboard.totalUsers ??
                        0
                    ).toLocaleString()}
            </span>

        </button>


        {/* =================================================
            ELECTION STATUS
        ================================================= */}

        <button
            type="button"
            onClick={() =>
                goTo("/admin/election")
            }
            style={{
                textAlign: "left",
                border:
                    "1px solid var(--admin-border, #E2E8F0)",
                background:
                    "var(--admin-card, #FFFFFF)",
                borderRadius: "14px",
                padding: "17px",
                minHeight: "142px",
                cursor: "pointer",
                boxShadow:
                    "0 5px 18px rgba(15, 23, 42, 0.05)",
            }}
        >

            <div
                style={{
                    width: "36px",
                    height: "36px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "10px",
                    background:
                        "rgba(124, 58, 237, 0.10)",
                    color: "#7C3AED",
                    marginBottom: "18px",
                }}
            >
                <FiCalendar
                    size={18}
                />
            </div>

            <strong
                style={{
                    display: "block",
                    fontSize: "13px",
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                Election Status
            </strong>

            <strong
                style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "19px",
                    color: "#7C3AED",
                    textTransform:
                        "capitalize",
                }}
            >
                {
                    systemDashboard
                        .electionStatus
                        .status
                }
            </strong>

            <span
                style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "11px",
                    color:
                        "var(--admin-text-muted, #94A3B8)",
                    whiteSpace:
                        "nowrap",
                    overflow: "hidden",
                    textOverflow:
                        "ellipsis",
                }}
            >
                {
                    systemDashboard
                        .electionStatus
                        .election
                        ?.title ||
                    "No current election"
                }
            </span>

        </button>


        {/* =================================================
            SERVER USAGE
        ================================================= */}

        <button
            type="button"
            onClick={() =>
                goTo("/admin/settings")
            }
            style={{
                textAlign: "left",
                border:
                    "1px solid var(--admin-border, #E2E8F0)",
                background:
                    "var(--admin-card, #FFFFFF)",
                borderRadius: "14px",
                padding: "17px",
                minHeight: "142px",
                cursor: "pointer",
                boxShadow:
                    "0 5px 18px rgba(15, 23, 42, 0.05)",
            }}
        >

            <div
                style={{
                    width: "36px",
                    height: "36px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "10px",
                    background:
                        "rgba(245, 158, 11, 0.10)",
                    color: "#D97706",
                    marginBottom: "18px",
                }}
            >
                <FiActivity
                    size={18}
                />
            </div>

            <strong
                style={{
                    display: "block",
                    fontSize: "13px",
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                Server Usage
            </strong>

            <strong
                style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "24px",
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                {
                    systemDashboard
                        .serverUsage
                        .memoryPercent
                }%
            </strong>

            <div
                style={{
                    height: "6px",
                    marginTop: "8px",
                    borderRadius: "99px",
                    background:
                        "#E2E8F0",
                    overflow: "hidden",
                }}
            >

                <span
                    style={{
                        display: "block",
                        width:
                            `${Math.min(
                                100,
                                Math.max(
                                    0,
                                    systemDashboard
                                        .serverUsage
                                        .memoryPercent
                                )
                            )}%`,
                        height: "100%",
                        borderRadius: "99px",
                        background:
                            "var(--votara-primary)",
                    }}
                />

            </div>

            <span
                style={{
                    display: "block",
                    marginTop: "6px",
                    fontSize: "10px",
                    color:
                        "var(--admin-text-muted, #94A3B8)",
                }}
            >
                Node.js memory usage
            </span>

        </button>


        {/* =================================================
            ACTIVITY LOGS
        ================================================= */}

        <button
            type="button"
            onClick={() =>
                goTo("/admin/audit-logs")
            }
            style={{
                textAlign: "left",
                border:
                    "1px solid var(--admin-border, #E2E8F0)",
                background:
                    "var(--admin-card, #FFFFFF)",
                borderRadius: "14px",
                padding: "17px",
                minHeight: "142px",
                cursor: "pointer",
                boxShadow:
                    "0 5px 18px rgba(15, 23, 42, 0.05)",
            }}
        >

            <div
                style={{
                    width: "36px",
                    height: "36px",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: "10px",
                    background:
                        "rgba(6, 182, 212, 0.10)",
                    color: "#0891B2",
                    marginBottom: "18px",
                }}
            >
                <FiFileText
                    size={18}
                />
            </div>

            <strong
                style={{
                    display: "block",
                    fontSize: "13px",
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                Activity Logs
            </strong>

            <strong
                style={{
                    display: "block",
                    marginTop: "5px",
                    fontSize: "24px",
                    color:
                        "var(--admin-text, #172033)",
                }}
            >
                {
                    (
                        systemDashboard
                            .activityLogs
                            .total ??
                        0
                    ).toLocaleString()
                }
            </strong>

            <span
                style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "11px",
                    color:
                        "var(--admin-text-muted, #94A3B8)",
                }}
            >
                Recorded audit activities
            </span>

        </button>

    </div>

</section>

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

                <section className="votara-dashboard-grid top-feature-grid">
                    <div className="votara-feature-card platform-health-card">
                        <div className="feature-card-heading">
                            <div>
                                <h2>Platform health</h2>
                                <span className="status-pill success"><span></span> operational</span>
                            </div>
                            <span className="feature-time">{formatDate(lastUpdated)}</span>
                        </div>
                        <div className="health-score-row">
                            <strong>
                                {dashboardLoading
                                    ? "…"
                                    : systemDashboard.systemHealth.status}
                            </strong>
                            <span>
                                API <b>{systemDashboard.systemHealth.api}</b>
                                {" · "}
                                DB <b>{systemDashboard.systemHealth.database}</b>
                            </span>
                        </div>
                        <div className="capacity-track">
                            <span
                                style={{
                                    width: `${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            Number(systemDashboard.serverUsage.memoryPercent) || 0
                                        )
                                    )}%`,
                                }}
                            />
                        </div>
                        <div className="capacity-labels">
                            <span>
                                Server memory · {systemDashboard.serverUsage.memoryPercent == null
                                    ? "Unavailable"
                                    : `${systemDashboard.serverUsage.memoryPercent}%`}
                            </span>
                            <span>
                                {systemDashboard.serverUsage.uptimeSeconds == null
                                    ? "Uptime unavailable"
                                    : `Uptime ${Math.floor(systemDashboard.serverUsage.uptimeSeconds / 3600)}h`}
                            </span>
                        </div>
                        <div className="mini-chart" aria-label="Live dashboard database metrics">
                            <div className="chart-grid-lines"></div>
                            <div className="dashboard-live-metrics">
                                <div>
                                    <strong>{dashboardLoading ? "…" : (stats.totalStudents ?? 0).toLocaleString()}</strong>
                                    <span>Students</span>
                                </div>
                                <div>
                                    <strong>{dashboardLoading ? "…" : (stats.pendingRegistrations ?? 0).toLocaleString()}</strong>
                                    <span>Pending registrations</span>
                                </div>
                                <div>
                                    <strong>{dashboardLoading ? "…" : (stats.totalStaff ?? 0).toLocaleString()}</strong>
                                    <span>Staff accounts</span>
                                </div>
                            </div>
                        </div>
                        <div className="chart-label">Live values returned by the Admin Dashboard API</div>
                    </div>

                    <div className="votara-feature-card system-overview-card">
                        <div className="feature-card-title-row"><h2>System Overview</h2><button onClick={() => goTo("/admin/settings")}>Configure</button></div>
                        {[
                            [FiDatabase, "Database Status", systemStatus.database, "/admin/settings"],
                            [FiUsers, "Staff Accounts", `${(stats.totalStaff ?? 0).toLocaleString()} total · ${(stats.activeUsers ?? 0).toLocaleString()} active`, "/admin/users"],
                            [FiRefreshCw, "Automatic Backup", systemSettings.autoBackup ? `Enabled · ${systemSettings.backupFrequency || "scheduled"}` : "Disabled", "/admin/settings"],
                            [FiShield, "Security", systemSettings.twoStepVerification ? "Two-step verification enabled" : "Review security settings", "/admin/settings"],
                        ].map(([Icon, title, status, path]) => (
                            <button key={title} className="system-overview-row" onClick={() => goTo(path)}>
                                <span className="row-icon"><Icon size={17} /></span>
                                <span><b>{title}</b><small><i></i>{status}</small></span>
                                <FiChevronRight size={15} />
                            </button>
                        ))}
                    </div>
                </section>

                <section className="votara-dashboard-grid secondary-feature-grid">
                    <div className="votara-feature-card elections-card">
                        <div className="feature-card-title-row"><h2>Elections</h2><span>{stats.totalStaff ?? 0} staff</span></div>
                        <div className="election-alert">
                            <FiAlertCircle size={18} />
                            <div><strong>Election management</strong><p>Review election schedules, status, and configuration before opening the voting window.</p><button onClick={() => goTo("/admin/election")}>Open election settings</button></div>
                        </div>
                        {[
                            [
                                systemDashboard.electionStatus.election?.title || "No current election",
                                "Current election",
                                systemDashboard.electionStatus.status || "No Election",
                            ],
                            [
                                (stats.totalElections ?? 0).toLocaleString(),
                                "Total elections in database",
                                "Recorded",
                            ],
                            [
                                (stats.pendingRegistrations ?? 0).toLocaleString(),
                                "Registration applications",
                                "Pending review",
                            ],
                        ].map(([name, detail, status]) => (
                            <button className="election-row" key={`${name}-${detail}`} onClick={() => goTo("/admin/election")}>
                                <span className="election-dot"></span><span><b>{name}</b><small>{detail}</small></span><em>{status}</em>
                            </button>
                        ))}
                    </div>

                    <div className="votara-feature-card approval-card">
                        <div className="feature-card-title-row"><h2>Voters Approval</h2><button onClick={() => goTo("/admin/students")}>Open queue</button></div>
                        <div className="approval-stat"><span></span><strong>{stats.totalStudents ?? "—"}</strong><p>registered students / voters</p></div>
                        <div className="approval-stat"><span></span><strong>{stats.pendingRegistrations ?? "—"}</strong><p>awaiting eligibility review</p><button onClick={() => goTo("/admin/students")}>Review</button></div>
                        <div className="approval-stat"><span></span><strong>{stats.activeUsers ?? "—"}</strong><p>active staff accounts</p><button onClick={() => goTo("/admin/users")}>View</button></div>
                    </div>

                    <div className="votara-feature-card monitor-card">
                        <div className="feature-card-title-row"><h2>Monitor &amp; logs</h2><button onClick={() => goTo("/admin/audit-logs")}>Full log</button></div>
                        {(systemDashboard.activityLogs.recent || []).length > 0 ? (
                            systemDashboard.activityLogs.recent.map((log, index) => (
                                <button
                                    className="log-row"
                                    key={log.id || `${log.action}-${index}`}
                                    onClick={() => goTo("/admin/audit-logs")}
                                >
                                    <span className={`log-dot log-dot-${index % 5}`}></span>
                                    <span>{log.description || log.action || "System activity"}</span>
                                    <em>{log.created_at ? formatRelativeTime(log.created_at) : "—"}</em>
                                </button>
                            ))
                        ) : (
                            <div className="dashboard-empty-state">No audit activity has been recorded yet.</div>
                        )}
                    </div>
                </section>

                <section className="votara-feature-card account-role-card">
                    <div className="feature-card-title-row">
                        <h2>Account overview</h2>
                        <span>{(stats.totalUsers ?? 0).toLocaleString()} Total</span>
                    </div>
                    {[
                        [
                            "Students / Voters",
                            stats.totalStudents ?? 0,
                            stats.totalUsers ? Math.min(100, ((stats.totalStudents ?? 0) / stats.totalUsers) * 100) : 0,
                            `${(stats.totalStudents ?? 0).toLocaleString()}`,
                        ],
                        [
                            "Staff Accounts",
                            stats.totalStaff ?? 0,
                            stats.totalUsers ? Math.min(100, ((stats.totalStaff ?? 0) / stats.totalUsers) * 100) : 0,
                            `${(stats.totalStaff ?? 0).toLocaleString()}`,
                        ],
                    ].map(([label, value, percent, displayValue]) => (
                        <div className="role-row" key={label}>
                            <span>{label}</span>
                            <div className="role-track">
                                <i style={{ width: `${percent}%` }}></i>
                            </div>
                            <b>{displayValue ?? value}</b>
                        </div>
                    ))}
                </section>

                <section className="votara-feature-card config-support-card">
                    <div className="config-panel">
                        <h2>Configuration snapshot</h2>
                        <span>Current values returned by System Configuration</span>
                        {[
                            [
                                "Voting window",
                                systemSettings.votingPeriod || "Not configured",
                                "/admin/settings",
                            ],
                            [
                                "Session timeout",
                                systemSettings.sessionTimeout ? `${systemSettings.sessionTimeout} minutes` : "Not configured",
                                "/admin/settings",
                            ],
                            [
                                "Automatic backup",
                                systemSettings.autoBackup ? `Enabled · ${systemSettings.backupFrequency || "scheduled"}` : "Disabled",
                                "/admin/settings",
                            ],
                            [
                                "Maintenance mode",
                                systemSettings.maintenanceMode ? "Enabled" : "Disabled",
                                "/admin/settings",
                            ],
                        ].map(([label, value, path]) => (
                            <div className="config-row" key={label}>
                                <span>{label}</span>
                                <b>{value}</b>
                                <button onClick={() => goTo(path)}>Edit</button>
                            </div>
                        ))}
                    </div>
                    <div className="support-panel dashboard-system-summary">
                        <h3>Live system summary</h3>
                        <div className="dashboard-summary-item">
                            <span>Audit activities</span>
                            <strong>{(systemDashboard.activityLogs.total ?? 0).toLocaleString()}</strong>
                        </div>
                        <div className="dashboard-summary-item">
                            <span>Elections recorded</span>
                            <strong>{(stats.totalElections ?? 0).toLocaleString()}</strong>
                        </div>
                        <div className="dashboard-summary-item">
                            <span>Current election</span>
                            <strong>{systemDashboard.electionStatus.election?.title || "None"}</strong>
                        </div>
                        <button className="dashboard-summary-action" onClick={() => goTo("/admin/reports")}>Open Reports &amp; Analytics</button>
                    </div>
                </section>

                <section className="votara-quick-actions">
                    <button onClick={() => goTo("/admin/candidates")}><span><FiCheckCircle size={19} /></span>Review Candidates Approval</button>
                    <button onClick={() => goTo("/admin/electoral-board")}><span><FiUserCheck size={19} /></span>Grant or revoke access</button>
                    <button onClick={() => goTo("/admin/settings")}><span><FiSettings size={19} /></span>Open System Configuration</button>
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
                            @media (max-width: 1200px) {

                            .admin-system-dashboard-grid {
                                grid-template-columns:
                                    repeat(3, minmax(0, 1fr)) !important;
                            }

                        }

                        @media (max-width: 750px) {

                            .admin-system-dashboard-grid {
                                grid-template-columns:
                                    repeat(2, minmax(0, 1fr)) !important;
                            }

                        }

                        @media (max-width: 520px) {

                            .admin-system-dashboard-grid {
                                grid-template-columns:
                                    1fr !important;
                            }

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
        color: "var(--admin-text-secondary)",
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
        color: "var(--admin-text-secondary)",
        fontSize: "12px",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
        "repeat(5, minmax(0, 1fr))",
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
        color: "var(--admin-text-secondary)",
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
        color: "var(--admin-text-secondary)",
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
        color: "var(--admin-text-secondary)",
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
        color: "var(--admin-text-secondary)",
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

