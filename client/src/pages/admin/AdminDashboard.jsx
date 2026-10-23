import AdminTopNav from './AdminTopNav';
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import "./AdminDashboardView.css";
import "./AdminDashboardLight.css";
import PageLoader from "/src/components/transitionloader/PageLoader";

import {
    FiUsers,
    FiUserCheck,
    FiClock,
    FiActivity,
    FiSettings,
    FiFileText,
    FiShield,
    FiRefreshCw,
    FiAlertCircle,
    FiCalendar,
    FiDatabase,
    FiUserPlus,
    FiChevronRight,
} from "react-icons/fi";

import api, { clearAccountSession } from "../../services/api";
import { getAdminConnectionError, isAdminSessionRejection } from "../../services/adminSession";

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
    const [systemSettings, setSystemSettings] = useState(null);

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

            if (isAdminSessionRejection(error)) {
                localStorage.removeItem(
                    "votaraAdminToken"
                );

                localStorage.removeItem(
                    "votaraAdminUser"
                );

                localStorage.removeItem("votaraStaffToken");
                localStorage.removeItem("votaraStaffUser");

                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            setDashboardError(
                getAdminConnectionError(error)
            );

        } finally {
            setDashboardLoading(false);
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
        clearAccountSession("admin");
        navigate("/admin-login", { replace: true });
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

    const hasData = stats.totalStudents !== null;
    const displayCount = (value) => hasData ? Number(value ?? 0).toLocaleString() : "—";
    const health = systemDashboard.systemHealth;
    const usage = systemDashboard.serverUsage;
    const election = systemDashboard.electionStatus;
    const isOnline = hasData && !dashboardError && health.status === "Online";
    const memoryPercent = hasData ? usage.memoryPercent : null;
    const pending = stats.pendingRegistrations ?? 0;
    const recentLogs = systemDashboard.activityLogs.recent || [];
    const overviewMetrics = [
        { label: "Registered students", value: stats.totalStudents, detail: "Student and voter accounts", icon: FiUsers, path: "/admin/data-management" },
        { label: "Staff accounts", value: stats.totalStaff, detail: hasData ? `${displayCount(stats.activeUsers)} active accounts` : "Electoral board and administrators", icon: FiUserCheck, path: "/admin/users" },
        { label: "Pending reviews", value: stats.pendingRegistrations, detail: "Late enrollee applications", icon: FiClock, path: "/admin/late-enrollees", attention: pending > 0 },
        { label: "Total elections", value: stats.totalElections, detail: "Recorded in the platform", icon: FiCalendar, path: "/admin/reports" },
    ];

    if (!admin) {
        return <div className="admin-overview-dashboard admin-overview-session-loading" role="status"><FiRefreshCw className="admin-overview-spinning" size={24} /><p>Loading your dashboard…</p></div>;
    }

    return (
        <div className="admin-overview-dashboard admin-polished-page">
            {isPageTransitioning && <PageLoader />}
            <a className="admin-overview-skip-link" href="#admin-dashboard-content">Skip to dashboard</a>
            <AdminTopNav admin={admin} onLogout={confirmLogout} />
            <main className="admin-overview-main" id="admin-dashboard-content" tabIndex={-1}>
                <header className="admin-overview-page-heading">
                    <div>
                        <div className="admin-overview-eyebrow">Administration <span>/</span> Overview</div>
                        <h1>Admin dashboard</h1>
                        <p>Your accounts, elections, and platform activity in one place.</p>
                    </div>
                    <div className="admin-overview-heading-actions">
                        <button type="button" className="admin-overview-button admin-overview-button-secondary" onClick={handleRefresh} disabled={dashboardLoading}>
                            <FiRefreshCw className={dashboardLoading ? "admin-overview-spinning" : undefined} aria-hidden="true" />
                            {dashboardLoading ? "Refreshing…" : "Refresh"}
                        </button>
                        <button type="button" className="admin-overview-button admin-overview-button-primary" onClick={() => goTo("/admin/users")}>
                            <FiUserPlus aria-hidden="true" />Invite user
                        </button>
                    </div>
                </header>

                {dashboardError && (
                    <div className="admin-overview-error" role="alert">
                        <FiAlertCircle size={20} aria-hidden="true" />
                        <div><strong>Unable to refresh dashboard data</strong><p>{dashboardError}{hasData ? " Showing the last available data." : ""}</p></div>
                        <button type="button" onClick={handleRefresh} disabled={dashboardLoading}>Try again <FiRefreshCw aria-hidden="true" /></button>
                    </div>
                )}

                <section className="admin-overview-metrics" aria-label="Account and election overview" aria-busy={dashboardLoading}>
                    {overviewMetrics.map(({ label, value, detail, icon: Icon, path, attention }) => (
                        <button type="button" className={`admin-overview-metric${attention ? " admin-overview-metric-attention" : ""}`} key={label} onClick={() => goTo(path)}>
                            <span className="admin-overview-metric-top"><span className="admin-overview-icon"><Icon size={18} aria-hidden="true" /></span><FiChevronRight size={16} className="admin-overview-metric-arrow" aria-hidden="true" /></span>
                            <span className="admin-overview-metric-label">{label}</span>
                            {dashboardLoading && !hasData ? <span className="admin-overview-skeleton admin-overview-number-skeleton" aria-label="Loading" /> : <strong className="admin-overview-metric-number">{displayCount(value)}</strong>}
                            <span className="admin-overview-metric-detail">{detail}{attention && <span className="admin-overview-attention-dot" aria-label="Needs review" />}</span>
                        </button>
                    ))}
                </section>

                <div className="admin-overview-content-grid">
                    <section className="admin-overview-panel admin-overview-election-panel" aria-labelledby="admin-overview-election-title">
                        <div className="admin-overview-panel-heading"><h2 id="admin-overview-election-title">Election overview</h2><button className="admin-overview-text-button" onClick={() => goTo("/admin/reports")}>View reports <FiChevronRight aria-hidden="true" /></button></div>
                        <div className="admin-overview-election-current">
                            <span className="admin-overview-election-icon"><FiCalendar size={24} aria-hidden="true" /></span>
                            <div><span className="admin-overview-label">Current election</span><h3>{dashboardLoading && !hasData ? "Loading election…" : election.election?.title || "No current election"}</h3></div>
                            <span className="admin-overview-badge">{hasData ? election.status : "Checking"}</span>
                        </div>
                        <p className="admin-overview-election-description">Review election schedules, participation, and results from the latest platform data.</p>
                        <div className="admin-overview-review-callout">
                            <span className="admin-overview-callout-icon"><FiUserCheck size={20} aria-hidden="true" /></span>
                            <div><strong>{!hasData ? "Registration review" : pending > 0 ? `${displayCount(pending)} application${pending === 1 ? "" : "s"} awaiting review` : "Your review queue is clear"}</strong><p>Check eligibility before approving late enrollees.</p></div>
                            <button type="button" className="admin-overview-button admin-overview-button-secondary" onClick={() => goTo("/admin/late-enrollees")}>Open queue <FiChevronRight aria-hidden="true" /></button>
                        </div>
                        <div className="admin-overview-election-footer"><span><FiShield aria-hidden="true" />Administrative actions are recorded in the audit log.</span><button type="button" className="admin-overview-text-button" onClick={() => goTo("/admin/audit-logs")}>View log</button></div>
                    </section>

                    <section className="admin-overview-panel admin-overview-health-panel" aria-labelledby="admin-overview-health-title">
                        <div className="admin-overview-panel-heading"><h2 id="admin-overview-health-title">Platform health</h2><span className={`admin-overview-status${isOnline ? " admin-overview-status-online" : ""}`}><i aria-hidden="true" />{dashboardLoading && !hasData ? "Checking" : isOnline ? "Operational" : "Needs attention"}</span></div>
                        <dl className="admin-overview-health-list">
                            <div><dt><FiActivity aria-hidden="true" />API connection</dt><dd>{systemStatus.api}</dd></div>
                            <div><dt><FiDatabase aria-hidden="true" />Database</dt><dd>{hasData && !dashboardError ? health.database : dashboardLoading ? "Checking" : "Unverified"}</dd></div>
                            <div><dt><FiClock aria-hidden="true" />Server uptime</dt><dd>{!hasData || usage.uptimeSeconds == null ? "—" : usage.uptimeSeconds < 3600 ? `${Math.floor(usage.uptimeSeconds / 60)}m` : `${Math.floor(usage.uptimeSeconds / 3600)}h ${Math.floor((usage.uptimeSeconds % 3600) / 60)}m`}</dd></div>
                        </dl>
                        <div className="admin-overview-memory"><div><span>Server memory</span><strong>{memoryPercent == null ? "—" : `${memoryPercent}%`}</strong></div><progress value={Math.max(0, Math.min(100, Number(memoryPercent) || 0))} max="100" aria-label="Server memory usage" /><span>Node.js heap utilization</span></div>
                        <button type="button" className="admin-overview-panel-footer-link" onClick={() => goTo("/admin/settings")}>System configuration <FiChevronRight aria-hidden="true" /></button>
                    </section>

                    <section className="admin-overview-panel admin-overview-activity-panel" aria-labelledby="admin-overview-activity-title" aria-busy={dashboardLoading}>
                        <div className="admin-overview-panel-heading"><div><h2 id="admin-overview-activity-title">Recent activity</h2><p>The latest actions across your platform.</p></div><button type="button" className="admin-overview-text-button" onClick={() => goTo("/admin/audit-logs")}>View all <FiChevronRight aria-hidden="true" /></button></div>
                        {dashboardLoading && !hasData ? <div className="admin-overview-activity-loading" role="status" aria-label="Loading recent activity">{[0, 1, 2].map((item) => <div className="admin-overview-skeleton admin-overview-line-skeleton" key={item} />)}</div> : recentLogs.length ? (
                            <ul className="admin-overview-activity-list">{recentLogs.slice(0, 5).map((log, index) => (
                                <li key={log.id || `${log.action}-${index}`}><button type="button" onClick={() => goTo("/admin/audit-logs")}><span className="admin-overview-activity-icon"><FiActivity size={16} aria-hidden="true" /></span><span className="admin-overview-activity-copy">{log.description || log.action || "System activity"}</span><time dateTime={log.created_at || undefined}>{log.created_at ? formatRelativeTime(log.created_at) : "—"}</time><FiChevronRight size={14} className="admin-overview-activity-arrow" aria-hidden="true" /></button></li>
                            ))}</ul>
                        ) : <div className="admin-overview-empty"><FiFileText size={26} aria-hidden="true" /><strong>{dashboardError ? "Activity unavailable" : "No activity yet"}</strong><p>{dashboardError ? "Try refreshing to load platform activity." : "Administrative actions will appear here as your team uses VOTARA."}</p></div>}
                        <div className="admin-overview-activity-total"><FiFileText aria-hidden="true" /><span>{displayCount(systemDashboard.activityLogs.total)} recorded audit activities</span></div>
                    </section>

                    <section className="admin-overview-panel admin-overview-access-panel" aria-labelledby="admin-overview-access-title">
                        <div className="admin-overview-panel-heading"><h2 id="admin-overview-access-title">Account overview</h2><span className="admin-overview-muted">{displayCount(stats.totalUsers)} total</span></div>
                        <div className="admin-overview-account-bar" aria-hidden="true"><span style={{ width: `${stats.totalUsers ? Math.min(100, (stats.totalStudents / stats.totalUsers) * 100) : 0}%` }} /></div>
                        <dl className="admin-overview-account-list"><div><dt><i className="admin-overview-student-dot" />Students / voters</dt><dd>{displayCount(stats.totalStudents)}</dd></div><div><dt><i className="admin-overview-staff-dot" />Staff accounts</dt><dd>{displayCount(stats.totalStaff)}</dd></div></dl>
                        <button type="button" className="admin-overview-account-action" onClick={() => goTo("/admin/data-management")}><span className="admin-overview-icon"><FiUsers size={18} aria-hidden="true" /></span><span><strong>Student management</strong><span>View and manage registered students</span></span><FiChevronRight aria-hidden="true" /></button>
                        <button type="button" className="admin-overview-account-action" onClick={() => goTo("/admin/users")}><span className="admin-overview-icon"><FiShield size={18} aria-hidden="true" /></span><span><strong>Staff and access</strong><span>Manage accounts and permissions</span></span><FiChevronRight aria-hidden="true" /></button>
                    </section>
                </div>

                <section className="admin-overview-panel admin-overview-configuration" aria-labelledby="admin-overview-configuration-title">
                    <div className="admin-overview-panel-heading"><div><h2 id="admin-overview-configuration-title">Configuration snapshot</h2><p>Your current platform settings.</p></div><button type="button" className="admin-overview-text-button" onClick={() => goTo("/admin/settings")}>Manage settings <FiChevronRight aria-hidden="true" /></button></div>
                    <dl className="admin-overview-config-grid">{[
                        ["Voting window", systemSettings?.votingPeriod || "Not configured", FiCalendar],
                        ["Session timeout", systemSettings?.sessionTimeout ? `${systemSettings?.sessionTimeout} minutes` : "Not configured", FiClock],
                        ["Automatic backup", systemSettings?.autoBackup ? `Enabled · ${systemSettings.backupFrequency || "Scheduled"}` : "Disabled", FiDatabase],
                        ["Maintenance mode", systemSettings?.maintenanceMode ? "Enabled" : "Disabled", FiSettings],
                    ].map(([label, value, Icon]) => <div key={label}><dt><Icon aria-hidden="true" />{label}</dt><dd>{dashboardLoading && !hasData ? "Loading…" : systemSettings ? value : "Unavailable"}</dd></div>)}</dl>
                    <div className="admin-overview-security-note"><FiShield size={16} aria-hidden="true" /><span>{!systemSettings ? "Security settings unavailable" : systemSettings?.twoStepVerification ? "Two-step verification is enabled" : "Review your security settings"}</span><button type="button" className="admin-overview-text-button" onClick={() => goTo("/admin/settings?section=security")}>Security settings <FiChevronRight aria-hidden="true" /></button></div>
                </section>
                <footer className="admin-overview-footer"><span>VOTARA <span>Administration workspace</span></span><span aria-live="polite">{dashboardLoading ? "Updating dashboard…" : lastUpdated ? `Last updated at ${formatDate(lastUpdated)}` : "Waiting for dashboard data"}</span></footer>
            </main>
        </div>
    );
}

export default AdminDashboard;
