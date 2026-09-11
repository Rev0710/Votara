import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuditLogs.css";

function AuditLogs() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("All");
    const [roleFilter, setRoleFilter] = useState("All");
    const [selectedLog, setSelectedLog] = useState(null);

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
    // CLEAR FILTERS
    // =====================================================

    const clearFilters = () => {
        setSearch("");
        setActionFilter("All");
        setRoleFilter("All");
    };

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

    return (
        <div className="audit-logs-page">

            {/* =================================================
                BACK TO DASHBOARD
            ================================================= */}

            <button
                type="button"
                className="audit-back-button"
                onClick={() =>
                    navigate("/admin-dashboard")
                }
            >
                <span>←</span>
                Back to Dashboard
            </button>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="audit-page-header">

                <div>

                    <span className="audit-page-label">
                        SYSTEM MONITORING
                    </span>

                    <h1>
                        Audit Logs
                    </h1>

                    <p>
                        Monitor and review important
                        activities performed within
                        the VOTARA system.
                    </p>

                </div>


                <button
                    type="button"
                    className="audit-export-button"
                    onClick={exportLogs}
                    disabled={
                        filteredLogs.length === 0
                    }
                >
                    <span>↓</span>
                    Export Logs
                </button>

            </div>


            {/* =================================================
                SECURITY NOTICE
            ================================================= */}

            <div className="audit-security-banner">

                <div className="audit-security-icon">
                    ✓
                </div>

                <div>

                    <strong>
                        Audit monitoring is active
                    </strong>

                    <p>
                        Administrative and electoral
                        activities are recorded for
                        security and accountability.
                    </p>

                </div>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="audit-stat-grid">

                <div className="audit-stat-card">

                    <div className="audit-stat-icon blue">
                        ≡
                    </div>

                    <div>

                        <span>
                            Total Activities
                        </span>

                        <strong>
                            {totalLogs}
                        </strong>

                        <small>
                            Recorded activities
                        </small>

                    </div>

                </div>


                <div className="audit-stat-card">

                    <div className="audit-stat-icon green">
                        ✓
                    </div>

                    <div>

                        <span>
                            Successful
                        </span>

                        <strong>
                            {successfulActions}
                        </strong>

                        <small>
                            Completed actions
                        </small>

                    </div>

                </div>


                <div className="audit-stat-card">

                    <div className="audit-stat-icon red">
                        !
                    </div>

                    <div>

                        <span>
                            Failed
                        </span>

                        <strong>
                            {failedActions}
                        </strong>

                        <small>
                            Security events
                        </small>

                    </div>

                </div>


                <div className="audit-stat-card">

                    <div className="audit-stat-icon purple">
                        ⇥
                    </div>

                    <div>

                        <span>
                            Login Activities
                        </span>

                        <strong>
                            {loginActions}
                        </strong>

                        <small>
                            Authentication events
                        </small>

                    </div>

                </div>

            </div>


            {/* =================================================
                LOG TABLE
            ================================================= */}

            <div className="audit-table-card">

                {/* TABLE HEADER */}

                <div className="audit-table-header">

                    <div>

                        <h2>
                            Activity History
                        </h2>

                        <p>
                            A chronological record of
                            important system activities.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="audit-refresh-button"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        ↻ Refresh
                    </button>

                </div>


                {/* =================================================
                    FILTER BAR
                ================================================= */}

                <div className="audit-filter-bar">

                    <div className="audit-search">

                        <span>⌕</span>

                        <input
                            type="text"
                            placeholder="Search user, action, module or log ID..."
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
                            All Actions
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


                    <select
                        className="audit-filter"
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Roles
                        </option>

                        <option value="Admin">
                            Admin
                        </option>

                        <option value="Electoral Board">
                            Electoral Board
                        </option>

                        <option value="Unknown">
                            Unknown
                        </option>

                    </select>


                    {(search ||
                        actionFilter !== "All" ||
                        roleFilter !== "All") && (

                        <button
                            type="button"
                            className="audit-clear-filter"
                            onClick={clearFilters}
                        >
                            Clear
                        </button>

                    )}

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="audit-table-wrapper">

                    <table className="audit-table">

                        <thead>

                            <tr>

                                <th>
                                    Activity
                                </th>

                                <th>
                                    User
                                </th>

                                <th>
                                    Module
                                </th>

                                <th>
                                    Date & Time
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredLogs.length >
                            0 ? (

                                filteredLogs.map(
                                    (log) => (

                                        <tr
                                            key={
                                                log.id
                                            }
                                        >

                                            {/* ACTIVITY */}

                                            <td>

                                                <div className="audit-activity-cell">

                                                    <div
                                                        className={`audit-activity-icon ${
                                                            log.status ===
                                                            "Failed"
                                                                ? "failed"
                                                                : "success"
                                                        }`}
                                                    >
                                                        {log.status ===
                                                        "Failed"
                                                            ? "!"
                                                            : "✓"}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                log.action
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                log.id
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* USER */}

                                            <td>

                                                <div className="audit-user-cell">

                                                    <div className="audit-user-avatar">
                                                        {log.user
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                log.user
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                log.email
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* MODULE */}

                                            <td>

                                                <span className="audit-module">
                                                    {
                                                        log.module
                                                    }
                                                </span>

                                            </td>


                                            {/* DATE */}

                                            <td>

                                                <div className="audit-date-cell">

                                                    <strong>
                                                        {
                                                            log.date
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            log.time
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`audit-status ${
                                                        log.status.toLowerCase()
                                                    }`}
                                                >

                                                    <span className="audit-status-dot"></span>

                                                    {
                                                        log.status
                                                    }

                                                </span>

                                            </td>


                                            {/* ACTION */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="audit-view-button"
                                                    onClick={() =>
                                                        setSelectedLog(
                                                            log
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td colSpan="6">

                                        <div className="audit-empty">

                                            <div className="audit-empty-icon">
                                                ≡
                                            </div>

                                            <strong>
                                                No audit logs found
                                            </strong>

                                            <span>
                                                Try changing
                                                your search
                                                or filters.
                                            </span>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="audit-table-footer">

                    <span>
                        Showing{" "}
                        <strong>
                            {
                                filteredLogs.length
                            }
                        </strong>
                        {" "}of{" "}
                        <strong>
                            {auditLogs.length}
                        </strong>
                        {" "}activities
                    </span>


                    {auditLogs.length > 0 && (

                        <button
                            type="button"
                            className="audit-clear-all"
                            onClick={
                                clearAuditLogs
                            }
                        >
                            Clear Logs
                        </button>

                    )}

                </div>

            </div>


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

                                <label>
                                    Log ID
                                </label>

                                <strong>
                                    {
                                        selectedLog.id
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Module
                                </label>

                                <strong>
                                    {
                                        selectedLog.module
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    User
                                </label>

                                <strong>
                                    {
                                        selectedLog.user
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Role
                                </label>

                                <strong>
                                    {
                                        selectedLog.role
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Email
                                </label>

                                <strong>
                                    {
                                        selectedLog.email
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    IP Address
                                </label>

                                <strong>
                                    {
                                        selectedLog.ip
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Date
                                </label>

                                <strong>
                                    {
                                        selectedLog.date
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Time
                                </label>

                                <strong>
                                    {
                                        selectedLog.time
                                    }
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