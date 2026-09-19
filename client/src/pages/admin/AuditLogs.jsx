import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuditLogs.css";
import PageLoader from "/src/components/transitionloader/PageLoader";

function AuditLogs() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");
    const [selectedLog, setSelectedLog] = useState(null);
    const [navigationLoading, setNavigationLoading] = useState(false);

    // Smooth page-to-page navigation loader.
    // The delay is intentional so the transition feels smooth rather than abrupt.
    const navigateWithLoading = (path) => {
        if (navigationLoading) return;

        setNavigationLoading(true);

        window.setTimeout(() => {
            navigate(path);
        }, 700);
    };

    // =====================================================
    // SAMPLE AUDIT LOG DATA
    // =====================================================

    const [auditLogs, setAuditLogs] = useState([
        {
            id: "LOG-1008",
            user: "Admin User",
            email: "admin@votara.edu",
            role: "Admin",
            action: "Election Activated",
            description:
                "Activated Student Council Election 2026.",
            module: "Election Management",
            date: "September 12, 2026",
            time: "10:42 PM",
            status: "Success",
            ip: "192.168.1.10",
        },
        {
            id: "LOG-1007",
            user: "Electoral Board",
            email: "board@votara.edu",
            role: "Electoral Board",
            action: "Candidate Approved",
            description:
                "Approved candidate application for Student Council Election 2026.",
            module: "Candidate Management",
            date: "September 12, 2026",
            time: "09:36 PM",
            status: "Success",
            ip: "192.168.1.14",
        },
        {
            id: "LOG-1006",
            user: "Admin User",
            email: "admin@votara.edu",
            role: "Admin",
            action: "Student Updated",
            description:
                "Updated student registration information.",
            module: "Student Management",
            date: "September 12, 2026",
            time: "08:54 PM",
            status: "Success",
            ip: "192.168.1.10",
        },
        {
            id: "LOG-1005",
            user: "Electoral Board",
            email: "board@votara.edu",
            role: "Electoral Board",
            action: "Login",
            description:
                "Electoral Board account successfully logged in.",
            module: "Authentication",
            date: "September 12, 2026",
            time: "08:15 PM",
            status: "Success",
            ip: "192.168.1.14",
        },
        {
            id: "LOG-1004",
            user: "Admin User",
            email: "admin@votara.edu",
            role: "Admin",
            action: "Admin Account Created",
            description:
                "Created a new administrator account.",
            module: "Admin Accounts",
            date: "September 12, 2026",
            time: "07:48 PM",
            status: "Success",
            ip: "192.168.1.10",
        },
        {
            id: "LOG-1003",
            user: "Unknown User",
            email: "unknown@votara.edu",
            role: "Unknown",
            action: "Login Failed",
            description:
                "Failed login attempt using an invalid password.",
            module: "Authentication",
            date: "September 12, 2026",
            time: "07:21 PM",
            status: "Failed",
            ip: "192.168.1.25",
        },
        {
            id: "LOG-1002",
            user: "Admin User",
            email: "admin@votara.edu",
            role: "Admin",
            action: "Election Updated",
            description:
                "Updated the election schedule and configuration.",
            module: "Election Management",
            date: "September 12, 2026",
            time: "06:44 PM",
            status: "Success",
            ip: "192.168.1.10",
        },
        {
            id: "LOG-1001",
            user: "Admin User",
            email: "admin@votara.edu",
            role: "Admin",
            action: "Login",
            description:
                "Admin account successfully logged in.",
            module: "Authentication",
            date: "September 12, 2026",
            time: "06:12 PM",
            status: "Success",
            ip: "192.168.1.10",
        },
    ]);

    // =====================================================
    // CHECK ADMIN SESSION
    // =====================================================

    useEffect(() => {
        const token =
            localStorage.getItem(
                "votaraStaffToken"
            );

        const storedUser =
            localStorage.getItem(
                "votaraStaffUser"
            );

        if (!token || !storedUser) {
            navigate("/admin-login", {
                replace: true,
            });

            return;
        }

        try {
            const user =
                JSON.parse(storedUser);

            if (user.role !== "admin") {
                navigate(
                    "/audit-logs/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            setAdmin(user);
        } catch (error) {
            console.error(
                "Invalid admin session:",
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
    // FILTER LOGS
    // =====================================================

    const filteredLogs = useMemo(() => {
        return auditLogs.filter((log) => {
            const value =
                search.toLowerCase().trim();

            const matchesSearch =
                log.user
                    .toLowerCase()
                    .includes(value) ||
                log.email
                    .toLowerCase()
                    .includes(value) ||
                log.action
                    .toLowerCase()
                    .includes(value) ||
                log.module
                    .toLowerCase()
                    .includes(value) ||
                log.id
                    .toLowerCase()
                    .includes(value);

            const matchesAction =
                actionFilter === "All" ||
                log.action === actionFilter;

            const matchesRole =
                roleFilter === "All" ||
                log.role === roleFilter;

            return (
                matchesSearch &&
                matchesAction &&
                matchesRole
            );
        });
    }, [
        auditLogs,
        search,
        actionFilter,
        roleFilter,
    ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalLogs = auditLogs.length;

    const successfulActions =
        auditLogs.filter(
            (log) =>
                log.status === "Success"
        ).length;

    const failedActions =
        auditLogs.filter(
            (log) =>
                log.status === "Failed"
        ).length;

    const loginActions =
        auditLogs.filter(
            (log) =>
                log.module === "Authentication"
        ).length;

    // =====================================================
    // EXPORT LOGS
    // =====================================================

    const exportLogs = () => {
        const headers = [
            "Log ID",
            "User",
            "Email",
            "Role",
            "Action",
            "Module",
            "Date",
            "Time",
            "Status",
            "IP Address",
        ];

        const rows = filteredLogs.map(
            (log) => [
                log.id,
                log.user,
                log.email,
                log.role,
                log.action,
                log.module,
                log.date,
                log.time,
                log.status,
                log.ip,
            ]
        );

        const csv = [
            headers,
            ...rows,
        ]
            .map((row) =>
                row
                    .map((value) =>
                        `"${String(value).replace(
                            /"/g,
                            '""'
                        )}"`
                    )
                    .join(",")
            )
            .join("\n");

        const blob = new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;",
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            "votara-audit-logs.csv";

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    // =====================================================
    // CLEAR AUDIT LOGS
    // =====================================================

    const clearAuditLogs = () => {
        const confirmed =
            window.confirm(
                "Are you sure you want to clear the audit logs? This action cannot be undone."
            );

        if (!confirmed) {
            return;
        }

        setAuditLogs([]);
        setSelectedLog(null);
    };

    // =====================================================
    // NEW AUDIT PAGE FILTERS
    // =====================================================

    const [categoryFilter, setCategoryFilter] = useState("All events");
    const [severityFilters, setSeverityFilters] = useState([]);
    const [liveMode, setLiveMode] = useState(true);

    const getLogCategory = (log) => {
        const action = log.action.toLowerCase();
        const module = log.module.toLowerCase();

        if (module.includes("authentication") || action.includes("login")) {
            return "Authentication";
        }

        if (module.includes("election")) {
            return "Elections";
        }

        if (module.includes("candidate")) {
            return "Candidates";
        }

        if (
            module.includes("account") ||
            action.includes("account") ||
            action.includes("student")
        ) {
            return "Accounts";
        }

        if (module.includes("kiosk")) {
            return "Kiosk";
        }

        if (
            action.includes("system") ||
            module.includes("system")
        ) {
            return "System";
        }

        return "Security";
    };

    const getLogSeverity = (log) =>
        log.status === "Failed" ? "Critical" : "Success";

    const categoryItems = [
        "All events",
        "Authentication",
        "Elections",
        "Candidates",
        "Accounts",
        "System",
        "Security",
        "Kiosk",
    ];

    const categoryCounts = useMemo(() => {
        const counts = {};

        categoryItems.forEach((category) => {
            counts[category] =
                category === "All events"
                    ? auditLogs.length
                    : auditLogs.filter(
                          (log) =>
                              getLogCategory(log) === category
                      ).length;
        });

        return counts;
    }, [auditLogs]);

    const visibleLogs = useMemo(() => {
        return filteredLogs.filter((log) => {
            const matchesCategory =
                categoryFilter === "All events" ||
                getLogCategory(log) === categoryFilter;

            const severity =
                getLogSeverity(log);

            const matchesSeverity =
                severityFilters.length === 0 ||
                severityFilters.includes(severity);

            return (
                matchesCategory &&
                matchesSeverity
            );
        });
    }, [
        filteredLogs,
        categoryFilter,
        severityFilters,
    ]);

    const toggleSeverity = (severity) => {
        setSeverityFilters((current) =>
            current.includes(severity)
                ? current.filter(
                      (item) => item !== severity
                  )
                : [...current, severity]
        );
    };

    const clearFilters = () => {
        setSearch("");
        setActionFilter("All");
        setRoleFilter("All");
        setCategoryFilter("All events");
        setSeverityFilters([]);
    };

    const severityCounts = {
        Info: 0,
        Success: successfulActions,
        Warning: 0,
        Critical: failedActions,
    };

    const securityCount = auditLogs.filter(
        (log) =>
            getLogCategory(log) === "Security" ||
            log.status === "Failed"
    ).length;

    return (
        <div className="audit-logs-page">

            {navigationLoading && <PageLoader />}

            {/* =================================================
                TOP NAVIGATION
            ================================================= */}

            <header className="audit-topbar">
                <button
                    type="button"
                    className="audit-brand"
                    onClick={() =>
                        navigateWithLoading("/admin-dashboard")
                    }
                    aria-label="Go to VOTARA dashboard"
                >
                    <span
                        className="audit-brand-mark"
                        aria-hidden="true"
                    >
                        <img
            src="/src/images/Votara.png"
            alt="Votara Logo"
            className="votara-admin-brand-logo"
        />
                    </span>
                    <span className="votara-audit-brand-name">Votara</span>
                </button>

                <nav
                    className="audit-topnav"
                    aria-label="Admin navigation"
                >
                    <button
                        type="button"
                        onClick={() =>
                            navigateWithLoading("/admin-dashboard")
                        }
                    >
                        Overview
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigateWithLoading("/admin/students")
                        }
                    >
                        User
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigateWithLoading("/admin/election")
                        }
                    >
                        Elections
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigateWithLoading("/admin/candidates")
                        }
                    >
                        Candidates
                    </button>

                    <button
                        type="button"
                        className="active"
                    >
                        Logs
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            navigateWithLoading("/admin/settings")
                        }
                    >
                        Config &amp; Support
                    </button>
                </nav>

                <div className="audit-topbar-right">
                    <span className="audit-production">
                        <i></i>
                        Production
                    </span>

                    <button
                        type="button"
                        className="audit-notification"
                        aria-label="Notifications"
                    >
                        ♧
                    </button>

                    <div className="audit-profile">
                        <span>
                            {admin?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() || "A"}
                        </span>
                    </div>
                </div>
            </header>

            {/* =================================================
                PAGE CONTENT
            ================================================= */}

            <main className="audit-content">

                <div className="audit-page-intro">
                    <div>
                        <span className="audit-page-label">
                            ● &nbsp;System &amp; security
                        </span>

                        <h1>Activity &amp; logs</h1>

                        <p>
                            Monitor important system activity,
                            authentication events, election actions,
                            and security events in one place.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="audit-export-button"
                        onClick={exportLogs}
                        disabled={
                            visibleLogs.length === 0
                        }
                    >
                        ↓
                        Export Logs
                    </button>
                </div>

                <div className="audit-layout">

                    {/* =================================================
                        CATEGORY SIDEBAR
                    ================================================= */}

                    <aside className="audit-category-card">

                        <h2>Category</h2>

                        <div className="audit-category-list">
                            {categoryItems.map(
                                (category) => (
                                    <button
                                        type="button"
                                        key={category}
                                        className={
                                            categoryFilter ===
                                            category
                                                ? "active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setCategoryFilter(
                                                category
                                            )
                                        }
                                    >
                                        <span>
                                            {category}
                                        </span>

                                        <strong>
                                            {
                                                categoryCounts[
                                                    category
                                                ]
                                            }
                                        </strong>
                                    </button>
                                )
                            )}
                        </div>

                        <div className="audit-separator"></div>

                        <h3>Severity</h3>

                        {[
                            "Info",
                            "Success",
                            "Warning",
                            "Critical",
                        ].map((severity) => (
                            <label
                                className="audit-check"
                                key={severity}
                            >
                                <input
                                    type="checkbox"
                                    checked={severityFilters.includes(
                                        severity
                                    )}
                                    onChange={() =>
                                        toggleSeverity(
                                            severity
                                        )
                                    }
                                />

                                <span className="audit-check-box"></span>

                                <span>
                                    {severity}
                                </span>
                            </label>
                        ))}

                        <div className="audit-retention">
                            Logs are retained for 180 days and
                            cannot be edited or deleted, per
                            election integrity policy.
                        </div>

                    </aside>

                    {/* =================================================
                        ACTIVITY PANEL
                    ================================================= */}

                    <section className="audit-activity-panel">

                        <div className="audit-activity-toolbar">

                            <div className="audit-toolbar-left">

                                <div className="audit-search">
                                    <span>⌕</span>

                                    <input
                                        type="text"
                                        placeholder="Search actions, details"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <select
                                    className="audit-filter"
                                    value={actionFilter}
                                    onChange={(e) =>
                                        setActionFilter(
                                            e.target.value
                                        )
                                    }
                                >
                                    <option value="All">
                                        All time
                                    </option>
                                    <option value="Login">
                                        Login
                                    </option>
                                    <option value="Login Failed">
                                        Login Failed
                                    </option>
                                    <option value="Student Updated">
                                        Student Updated
                                    </option>
                                    <option value="Candidate Approved">
                                        Candidate Approved
                                    </option>
                                    <option value="Election Activated">
                                        Election Activated
                                    </option>
                                    <option value="Election Updated">
                                        Election Updated
                                    </option>
                                    <option value="Admin Account Created">
                                        Admin Account Created
                                    </option>
                                </select>

                            </div>

                            <label className="audit-live">
                                <span>Live</span>

                                <input
                                    type="checkbox"
                                    checked={liveMode}
                                    onChange={(e) =>
                                        setLiveMode(
                                            e.target.checked
                                        )
                                    }
                                />

                                <span className="audit-live-switch">
                                    <i></i>
                                </span>
                            </label>

                        </div>

                        <div className="audit-summary">
                            <span>
                                <b>{visibleLogs.length}</b>
                                event
                                {visibleLogs.length === 1
                                    ? ""
                                    : "s"} shown
                            </span>

                            <span className="critical">
                                <b>
                                    {
                                        severityCounts.Critical
                                    }
                                </b>
                                critical
                            </span>

                            <span className="warning">
                                <b>
                                    {
                                        severityCounts.Warning
                                    }
                                </b>
                                warning
                            </span>

                            <span className="security">
                                <b>
                                    {securityCount}
                                </b>
                                security
                            </span>
                        </div>

                        <div className="audit-log-list">

                            {visibleLogs.length > 0 ? (
                                visibleLogs.map(
                                    (log) => (
                                        <button
                                            type="button"
                                            className={`audit-log-row ${
                                                log.status ===
                                                "Failed"
                                                    ? "failed"
                                                    : "success"
                                            }`}
                                            key={log.id}
                                            onClick={() =>
                                                setSelectedLog(
                                                    log
                                                )
                                            }
                                        >
                                            <span className="audit-row-accent"></span>

                                            <span className="audit-row-icon">
                                                {log.status ===
                                                "Failed"
                                                    ? "!"
                                                    : "✓"}
                                            </span>

                                            <span className="audit-row-content">
                                                <strong>
                                                    {
                                                        log.action
                                                    }
                                                </strong>

                                                <small>
                                                    {
                                                        log.description
                                                    }
                                                </small>
                                            </span>

                                            <span className="audit-row-user">
                                                {
                                                    log.user
                                                }
                                            </span>

                                            <span className="audit-row-time">
                                                {
                                                    log.time
                                                }
                                            </span>

                                            <span className="audit-row-arrow">
                                                ›
                                            </span>
                                        </button>
                                    )
                                )
                            ) : (
                                <div className="audit-empty">
                                    <div className="audit-empty-icon">
                                        ≡
                                    </div>

                                    <strong>
                                        No audit logs found
                                    </strong>

                                    <span>
                                        Try changing your
                                        search or filters.
                                    </span>
                                </div>
                            )}

                        </div>

                        <div className="audit-panel-footer">
                            <span>
                                Showing{" "}
                                <strong>
                                    {visibleLogs.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {auditLogs.length}
                                </strong>{" "}
                                activities
                            </span>

                            <div>
                                {(search ||
                                    actionFilter !== "All" ||
                                    roleFilter !== "All" ||
                                    categoryFilter !==
                                        "All events" ||
                                    severityFilters.length >
                                        0) && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                    >
                                        Clear filters
                                    </button>
                                )}

                                {auditLogs.length > 0 && (
                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={
                                            clearAuditLogs
                                        }
                                    >
                                        Clear Logs
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() =>
                                        window.location.reload()
                                    }
                                >
                                    ↻ Refresh
                                </button>
                            </div>
                        </div>

                    </section>

                </div>

            </main>

            {/* =================================================
                LOG DETAILS MODAL
            ================================================= */}

            {selectedLog && (
                <div
                    className="audit-modal-overlay"
                    onClick={() =>
                        setSelectedLog(null)
                    }
                >
                    <div
                        className="audit-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <div className="audit-modal-header">
                            <div>
                                <span>
                                    AUDIT LOG DETAILS
                                </span>

                                <h2>
                                    {
                                        selectedLog.action
                                    }
                                </h2>
                            </div>

                            <button
                                type="button"
                                className="audit-modal-close"
                                onClick={() =>
                                    setSelectedLog(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="audit-modal-status">
                            <div
                                className={`audit-modal-status-icon ${
                                    selectedLog.status ===
                                    "Failed"
                                        ? "failed"
                                        : "success"
                                }`}
                            >
                                {selectedLog.status ===
                                "Failed"
                                    ? "!"
                                    : "✓"}
                            </div>

                            <div>
                                <span>
                                    ACTIVITY STATUS
                                </span>

                                <strong>
                                    {
                                        selectedLog.status
                                    }
                                </strong>
                            </div>
                        </div>

                        <div className="audit-details-grid">
                            <div>
                                <label>Log ID</label>
                                <strong>
                                    {selectedLog.id}
                                </strong>
                            </div>

                            <div>
                                <label>Module</label>
                                <strong>
                                    {selectedLog.module}
                                </strong>
                            </div>

                            <div>
                                <label>User</label>
                                <strong>
                                    {selectedLog.user}
                                </strong>
                            </div>

                            <div>
                                <label>Role</label>
                                <strong>
                                    {selectedLog.role}
                                </strong>
                            </div>

                            <div>
                                <label>Email</label>
                                <strong>
                                    {selectedLog.email}
                                </strong>
                            </div>

                            <div>
                                <label>IP Address</label>
                                <strong>
                                    {selectedLog.ip}
                                </strong>
                            </div>

                            <div>
                                <label>Date</label>
                                <strong>
                                    {selectedLog.date}
                                </strong>
                            </div>

                            <div>
                                <label>Time</label>
                                <strong>
                                    {selectedLog.time}
                                </strong>
                            </div>
                        </div>

                        <div className="audit-description">
                            <label>
                                ACTIVITY DESCRIPTION
                            </label>

                            <p>
                                {
                                    selectedLog.description
                                }
                            </p>
                        </div>

                        <div className="audit-modal-footer">
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedLog(
                                        null
                                    )
                                }
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default AuditLogs;
