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
    });

    const [systemStatus, setSystemStatus] =
        useState({
            api: "Checking",
            database: "Checking",
        });

    const [environment, setEnvironment] = useState("Production");
    const [showEnvironmentMenu, setShowEnvironmentMenu] = useState(false);

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

    const handleExportResults = () => {
        const rows = [
            ["VOTARA Admin Dashboard Export", ""],
            ["Generated", new Date().toLocaleString()],
            ["Environment", environment],
            [],
            ["Metric", "Value"],
            ["Total Students / Voters", stats.totalStudents ?? 0],
            ["Staff Accounts", stats.totalStaff ?? 0],
            ["Pending Registrations", stats.pendingRegistrations ?? 0],
            ["Active Users", stats.activeUsers ?? 0],
            ["API Status", systemStatus.api],
            ["Database Status", systemStatus.database],
        ];

        const csv = rows
            .map((row) => row.map((cell) => {
                const value = String(cell ?? "");
                return `"${value.replace(/"/g, '""')}"`;
            }).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `votara-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
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
            {isPageTransitioning && <PageLoader />}

            <InviteTeamPopUp
    isOpen={showInviteModal}
    onClose={closeInviteModal}
/>
            {/* =================================================
                TOP NAVIGATION
                Design-only replacement for the old sidebar.
            ================================================= */}

            <header className="votara-admin-topbar">
                <div className="votara-admin-brand" onClick={() => goTo("/admin-dashboard")}>
                    <span className="votara-admin-brand-mark" aria-hidden="true">
                        <img
            src="/src/images/Votara.png"
            alt="Votara Logo"
            className="votara-admin-brand-logo"
        />
                    </span>
                    <span className="votara-admin-brand-name">Votara</span>
                </div>

                <nav className="votara-admin-topnav" aria-label="Admin navigation">
                    <button
                        className="votara-admin-topnav-link active"
                        onClick={() => goTo("/admin-dashboard")}
                    >
                        Overview
                    </button>

                    <button
                        className="votara-admin-topnav-link"
                        onClick={() => goTo("/admin/students")}
                    >
                        User
                    </button>

                    <button
                        className="votara-admin-topnav-link"
                        onClick={() => goTo("/admin/election")}
                    >
                        Elections
                    </button>

                    <button
                        className="votara-admin-topnav-link"
                        onClick={() => goTo("/admin/candidates")}
                    >
                        Candidates
                    </button>

                    <button
                        className="votara-admin-topnav-link"
                        onClick={() => goTo("/admin/audit-logs")}
                    >
                        Logs
                    </button>

                    <button
                        className="votara-admin-topnav-link"
                        onClick={() => goTo("/admin/settings")}
                    >
                        Config &amp; Support
                    </button>
                </nav>

                <div className="votara-admin-topbar-actions">
                    <button className="votara-topbar-environment" onClick={() => setShowEnvironmentMenu((value) => !value)}>
                        <span className="votara-env-dot"></span>{environment}
                    </button>
                    <button className="votara-notification-button" onClick={() => goTo("/admin/audit-logs")} title="Notifications" aria-label="Notifications">
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
                        className="votara-admin-logout"
                        onClick={handleLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <FiLogOut size={17} />
                    </button>
                </div>
            </header>

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
                        <div className="votara-env-picker">
                            <button
                                className="votara-env-button"
                                onClick={() => setShowEnvironmentMenu((value) => !value)}
                                aria-expanded={showEnvironmentMenu}
                            >
                                <span className="votara-env-dot"></span>
                                {environment}
                                <span className="votara-env-chevron">⌄</span>
                            </button>
                            {showEnvironmentMenu && (
                                <div className="votara-env-menu">
                                    {["Production", "Staging", "Development"].map((name) => (
                                        <button
                                            key={name}
                                            className={name === environment ? "selected" : ""}
                                            onClick={() => {
                                                setEnvironment(name);
                                                setShowEnvironmentMenu(false);
                                            }}
                                        >
                                            <span className="votara-env-dot"></span>{name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button className="votara-outline-action" onClick={handleExportResults}>
                            <FiFileText size={16} /> Export results
                        </button>

                        <button
                        className="votara-primary-action"
                        onClick={openInviteModal}
                        >
                        <FiUserPlus size={16} />
                        Invite Team
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
                            <strong>{systemStatus.api === "Online" && systemStatus.database === "Connected" ? "99.9" : "—"}<small>%</small></strong>
                            <span><b>{dashboardLoading ? "Checking" : stats.pendingRegistrations ?? 0}</b> pending registration{(stats.pendingRegistrations ?? 0) === 1 ? "" : "s"}</span>
                        </div>
                        <div className="capacity-track"><span style={{ width: "72%" }}></span></div>
                        <div className="capacity-labels"><span>Capacity used · 72%</span><span>alert at 80%</span></div>
                        <div className="mini-chart" aria-label="Registered voters trend">
                            <div className="chart-grid-lines"></div>
                            <svg viewBox="0 0 640 150" preserveAspectRatio="none">
                                <defs><linearGradient id="votaraArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--votara-primary)" stopOpacity="0.65"/><stop offset="100%" stopColor="var(--votara-primary)" stopOpacity="0"/></linearGradient></defs>
                                <path d="M0 145 L55 98 L110 75 L180 70 L245 62 L310 58 L380 45 L445 38 L510 18 L510 150 L0 150 Z" fill="url(#votaraArea)"/>
                                <path d="M0 145 L55 98 L110 75 L180 70 L245 62 L310 58 L380 45 L445 38 L510 18" fill="none" stroke="var(--votara-primary)" strokeWidth="3"/>
                            </svg>
                        </div>
                        <div className="chart-label">Registered student voters · Voting time (Polling stations close at 5:00 pm)</div>
                    </div>

                    <div className="votara-feature-card system-overview-card">
                        <div className="feature-card-title-row"><h2>System Overview</h2><button onClick={() => goTo("/admin/settings")}>Configure</button></div>
                        {[
                            [FiDatabase, "Database Status", systemStatus.database, "/admin/settings"],
                            [FiActivity, "Kiosk Devices", `${stats.activeUsers ?? 0} active`, "/admin/settings"],
                            [FiRefreshCw, "Backup Status", "Last backup available", "/admin/settings"],
                            [FiShield, "Security", "All systems secure", "/admin/settings"],
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
                            ["Student Council Election", "Management", "Live"],
                            ["Electoral Board", "Staff access", "Active"],
                            ["Candidate Review", "Approval queue", `${stats.pendingRegistrations ?? 0} pending`],
                        ].map(([name, detail, status]) => (
                            <button className="election-row" key={name} onClick={() => goTo("/admin/election")}>
                                <span className="election-dot"></span><span><b>{name}</b><small>{detail}</small></span><em>{status}</em>
                            </button>
                        ))}
                    </div>

                    <div className="votara-feature-card approval-card">
                        <div className="feature-card-title-row"><h2>Voters Approval</h2><button onClick={() => goTo("/admin/students")}>Open queue</button></div>
                        <div className="approval-stat"><span></span><strong>{stats.totalStudents ?? "—"}</strong><p>registered students / voters</p></div>
                        <div className="approval-stat"><span></span><strong>{stats.pendingRegistrations ?? "—"}</strong><p>awaiting eligibility review</p><button onClick={() => goTo("/admin/students")}>Review</button></div>
                        <div className="approval-stat"><span></span><strong>—</strong><p>disqualified / incomplete filing</p><button onClick={() => goTo("/admin/students")}>Details</button></div>
                    </div>

                    <div className="votara-feature-card monitor-card">
                        <div className="feature-card-title-row"><h2>Monitor &amp; logs</h2><button onClick={() => goTo("/admin/audit-logs")}>Full log</button></div>
                        {[
                            ["Failed login blocked", "6m"],
                            ["Backup completed", "1h"],
                            ["Admin role granted", "2h"],
                            ["Candidate bulk import", "5h"],
                            ["TLS certificate renewed", "1d"],
                        ].map(([event, time], index) => (
                            <button className="log-row" key={event} onClick={() => goTo("/admin/audit-logs")}><span className={`log-dot log-dot-${index}`}></span><span>{event}</span><em>{time}</em></button>
                        ))}
                    </div>
                </section>

                <section className="votara-feature-card account-role-card">
                    <div className="feature-card-title-row">
                        <h2>Account by role</h2>
                        <span>1,500 Total</span>
                    </div>
                    {[
                        [
                            "Students / Voter",
                            stats.totalStudents ?? 0,
                            Math.min(100, ((stats.totalStudents ?? 0) / 1012) * 100),
                            `${(stats.totalStudents ?? 0).toLocaleString()}/1,012`,
                        ],
                        [
                            "Electoral Board",
                            stats.totalStaff ?? 26,
                            Math.min(100, ((stats.totalStaff ?? 26) / 100) * 100),
                            `${(stats.totalStaff ?? 26).toLocaleString()}`,
                        ],
                        ["Admin", 7, 7],
                        ["Kiosk device", 10, 10],
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
                        <h2>Configuration &amp; support</h2>
                        <span>System configuration</span>
                        {[
                            ["Voting window", "8:00 AM – 5:00 PM", "/admin/settings"],
                            ["Default quorum", "40%", "/admin/settings"],
                            ["Session timeout", "20 min idle", "/admin/settings"],
                            ["Kiosk lockout", "3 failed scans", "/admin/settings"],
                        ].map(([label, value, path]) => (
                            <div className="config-row" key={label}><span>{label}</span><b>{value}</b><button onClick={() => goTo(path)}>Edit</button></div>
                        ))}
                    </div>
                    <div className="support-panel">
                        <h3>Open support tickets</h3>
                        {[
                            ["high", "#1024 Kiosk 07 offline", "Electoral board 1"],
                            ["medium", "#1039 Voter can't verify OTP", "Admin queue"],
                            ["low", "#1031 Export format request", "Admin 2"],
                        ].map(([level, title, owner]) => (
                            <button className="ticket-row" key={title} onClick={() => goTo("/admin/audit-logs")}><span className={`ticket-priority ${level}`}>{level}</span><span><b>{title}</b><small>{owner}</small></span><em>Open</em></button>
                        ))}
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