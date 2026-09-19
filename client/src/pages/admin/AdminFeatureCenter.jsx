import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FiActivity,
    FiUsers,
    FiUserCheck,
    FiShield,
    FiRefreshCw,
    FiDatabase,
    FiSettings,
    FiMail,
    FiLock,
    FiTool,
    FiFileText,
    FiBarChart2,
    FiAlertTriangle,
    FiServer,
    FiKey,
    FiUserPlus,
    FiClock,
    FiDownload,
    FiChevronRight,
    FiCheckCircle,
} from "react-icons/fi";

import "./AdminFeatureCenter.css";

// =========================================================
// ADMIN FEATURE CENTER
// =========================================================

const AdminFeatureCenter = () => {

    const navigate = useNavigate();

    const [
        selectedFeature,
        setSelectedFeature
    ] = useState(null);

    // =====================================================
    // FEATURE GROUPS
    // =====================================================

    const featureGroups = [

        // =================================================
        // 1. SYSTEM DASHBOARD
        // =================================================

        {
            number: "01",

            title: "System Dashboard",

            description:
                "Monitor the overall VOTARA platform, election status, users, server condition, and system activity.",

            icon: FiActivity,

            features: [

                {
                    title: "System Health",
                    description:
                        "Check API, database, and platform availability.",
                    icon: FiActivity,
                    path: null,
                    status: "Connected",
                },

                {
                    title: "Total Users",
                    description:
                        "View the number of registered students and staff accounts.",
                    icon: FiUsers,
                    path: "/admin/students",
                    status: "Connected",
                },

                {
                    title: "Election Status",
                    description:
                        "View the current election state and schedule.",
                    icon: FiClock,
                    path: "/admin/election",
                    status: "Connected",
                },

                {
                    title: "Server Usage",
                    description:
                        "Monitor server and application resource usage.",
                    icon: FiServer,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Activity Logs",
                    description:
                        "Review important activities recorded by the system.",
                    icon: FiActivity,
                    path: "/admin/audit-logs",
                    status: "Connected",
                },

            ],
        },

        // =================================================
        // 2. USER & ACCESS MANAGEMENT
        // =================================================

        {
            number: "02",

            title: "User & Access Management",

            description:
                "Manage administrator accounts, Electoral Board accounts, access permissions, and account security.",

            icon: FiShield,

            features: [

                {
                    title: "Manage Admin Accounts",
                    description:
                        "Create and manage administrator accounts.",
                    icon: FiShield,
                    path: "/admin/admin-accounts",
                    status: "Connected",
                },

                {
                    title: "Manage EB Accounts",
                    description:
                        "Create, activate, deactivate, and manage Electoral Board accounts.",
                    icon: FiUserCheck,
                    path: "/admin/electoral-board",
                    status: "Connected",
                },

                {
                    title: "Manage Poll Worker Accounts",
                    description:
                        "Prepare poll worker account management for future election operations.",
                    icon: FiUserPlus,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Set Roles & Permissions",
                    description:
                        "Configure role-based access permissions for system users.",
                    icon: FiLock,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Reset Accounts",
                    description:
                        "Reset staff account passwords and account security.",
                    icon: FiRefreshCw,
                    path: null,
                    status: "Ready",
                },

            ],
        },

        // =================================================
        // 3. DATA MANAGEMENT
        // =================================================

        {
            number: "03",

            title: "Data Management",

            description:
                "Manage student information, enrollment records, system collections, and data maintenance.",

            icon: FiDatabase,

            features: [

                {
                    title: "Manage Student Data",
                    description:
                        "View and manage registered student information.",
                    icon: FiUsers,
                    path: "/admin/students",
                    status: "Connected",
                },

                {
                    title: "Update Enrollment Status",
                    description:
                        "Review and maintain student enrollment information.",
                    icon: FiCheckCircle,
                    path: "/admin/students",
                    status: "Connected",
                },

                {
                    title: "Manage Collections",
                    description:
                        "Monitor important VOTARA database collections and records.",
                    icon: FiDatabase,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Data Cleanup",
                    description:
                        "Prepare tools for controlled cleanup and maintenance of obsolete records.",
                    icon: FiRefreshCw,
                    path: null,
                    status: "Ready",
                },

            ],
        },

        // =================================================
        // 4. SYSTEM CONFIGURATION
        // =================================================

        {
            number: "04",

            title: "System Configuration",

            description:
                "Manage system-wide configuration, security, communication, rate limits, and maintenance settings.",

            icon: FiSettings,

            features: [

                {
                    title: "System Parameters",
                    description:
                        "Manage general VOTARA system configuration.",
                    icon: FiSettings,
                    path: "/admin/settings",
                    status: "Connected",
                },

                {
                    title: "Email / SMS Settings",
                    description:
                        "Configure system communication services.",
                    icon: FiMail,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Rate Limiting Settings",
                    description:
                        "Prepare protection controls for excessive API requests.",
                    icon: FiActivity,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Security Settings",
                    description:
                        "Review authentication and system security controls.",
                    icon: FiLock,
                    path: "/admin/settings",
                    status: "Connected",
                },

                {
                    title: "Maintenance Mode",
                    description:
                        "Prepare controlled maintenance mode for system administration.",
                    icon: FiTool,
                    path: null,
                    status: "Ready",
                },

            ],
        },

        // =================================================
        // 5. MONITORING & LOGS
        // =================================================

        {
            number: "05",

            title: "Monitoring & Logs",

            description:
                "Monitor system events, authentication activity, security incidents, and operational logs.",

            icon: FiActivity,

            features: [

                {
                    title: "System Logs",
                    description:
                        "Review system and administrative activity logs.",
                    icon: FiFileText,
                    path: "/admin/audit-logs",
                    status: "Connected",
                },

                {
                    title: "Failed Login Attempts",
                    description:
                        "Monitor failed authentication attempts and account lock activity.",
                    icon: FiLock,
                    path: "/admin/audit-logs",
                    status: "Connected",
                },

                {
                    title: "OTP / PIN Activity",
                    description:
                        "Prepare monitoring for authentication verification activity.",
                    icon: FiKey,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Suspicious Activities",
                    description:
                        "Prepare security monitoring for unusual system activity.",
                    icon: FiAlertTriangle,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Export Logs",
                    description:
                        "Prepare secure export of administrative audit records.",
                    icon: FiDownload,
                    path: "/admin/audit-logs",
                    status: "Connected",
                },

            ],
        },

        // =================================================
        // 6. SUPPORT & TROUBLESHOOTING
        // =================================================

        {
            number: "06",

            title: "Support & Troubleshooting",

            description:
                "Provide administrators with tools for system troubleshooting, service monitoring, and technical support.",

            icon: FiTool,

            features: [

                {
                    title: "Handle User Issues",
                    description:
                        "Prepare administrative tools for resolving reported user issues.",
                    icon: FiUsers,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "API / DB Monitor",
                    description:
                        "Monitor API availability and database connectivity.",
                    icon: FiDatabase,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Fix System Errors",
                    description:
                        "Prepare tools for diagnosing and resolving application errors.",
                    icon: FiTool,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Manage Server Resources",
                    description:
                        "Prepare system resource monitoring and management.",
                    icon: FiServer,
                    path: null,
                    status: "Ready",
                },

                {
                    title: "Technical Support",
                    description:
                        "Provide technical support information and administrative assistance.",
                    icon: FiTool,
                    path: null,
                    status: "Ready",
                },

            ],
        },

        // =================================================
        // 7. REPORTS & ANALYTICS
        // =================================================

        {
            number: "07",

            title: "Reports & Analytics",

            description:
                "Review system activity, election information, security incidents, and administrative reports.",

            icon: FiBarChart2,

            features: [

                {
                    title: "System Usage Report",
                    description:
                        "Review overall system usage information.",
                    icon: FiBarChart2,
                    path: "/admin/reports",
                    status: "Connected",
                },

                {
                    title: "User Activity Report",
                    description:
                        "Review user and administrative activity.",
                    icon: FiUsers,
                    path: "/admin/reports",
                    status: "Connected",
                },

                {
                    title: "Election Summary",
                    description:
                        "Review election statistics and summary information.",
                    icon: FiFileText,
                    path: "/admin/results",
                    status: "Connected",
                },

                {
                    title: "Security Incident Report",
                    description:
                        "Review security-related events and administrative incidents.",
                    icon: FiAlertTriangle,
                    path: "/admin/audit-logs",
                    status: "Connected",
                },

                {
                    title: "Export Data",
                    description:
                        "Prepare secure system and reporting data export.",
                    icon: FiDownload,
                    path: "/admin/reports",
                    status: "Connected",
                },

            ],
        },

    ];

    // =====================================================
    // OPEN FEATURE
    // =====================================================

    const handleFeatureClick = (
        feature
    ) => {

        if (feature.path) {

            navigate(
                feature.path
            );

            return;
        }

        setSelectedFeature(
            feature
        );
    };

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <section className="admin-feature-center">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="admin-feature-header">

                <div>

                    <span className="admin-feature-eyebrow">
                        ADMINISTRATION
                    </span>

                    <h2>
                        System Control Center
                    </h2>

                    <p>
                        Manage VOTARA users, election
                        operations, system configuration,
                        security, monitoring, support,
                        and reports from one centralized
                        administration area.
                    </p>

                </div>

                <div className="admin-feature-header-badge">

                    <FiShield size={18} />

                    <div>
                        <strong>
                            Administrator
                        </strong>

                        <span>
                            Full system oversight
                        </span>
                    </div>

                </div>

            </div>

            {/* =================================================
                FEATURE GROUPS
            ================================================= */}

            <div className="admin-feature-groups">

                {featureGroups.map(
                    (group) => {

                        const GroupIcon =
                            group.icon;

                        return (
                            <section
                                className="admin-feature-group"
                                key={group.number}
                            >

                                {/* GROUP HEADER */}

                                <div className="admin-feature-group-header">

                                    <div className="admin-feature-number">
                                        {group.number}
                                    </div>

                                    <div className="admin-feature-group-icon">
                                        <GroupIcon
                                            size={21}
                                        />
                                    </div>

                                    <div className="admin-feature-group-heading">

                                        <h3>
                                            {group.title}
                                        </h3>

                                        <p>
                                            {
                                                group.description
                                            }
                                        </p>

                                    </div>

                                </div>

                                {/* FEATURE CARDS */}

                                <div className="admin-feature-grid">

                                    {group.features.map(
                                        (
                                            feature
                                        ) => {

                                            const FeatureIcon =
                                                feature.icon;

                                            return (
                                                <button
                                                    key={
                                                        feature.title
                                                    }
                                                    className="admin-feature-card"
                                                    onClick={() =>
                                                        handleFeatureClick(
                                                            feature
                                                        )
                                                    }
                                                >

                                                    <div className="admin-feature-card-top">

                                                        <div className="admin-feature-card-icon">
                                                            <FeatureIcon
                                                                size={
                                                                    19
                                                                }
                                                            />
                                                        </div>

                                                        <span
                                                            className={
                                                                feature.status ===
                                                                "Connected"
                                                                    ? "admin-feature-status connected"
                                                                    : "admin-feature-status ready"
                                                            }
                                                        >
                                                            {
                                                                feature.status
                                                            }
                                                        </span>

                                                    </div>

                                                    <div className="admin-feature-card-content">

                                                        <h4>
                                                            {
                                                                feature.title
                                                            }
                                                        </h4>

                                                        <p>
                                                            {
                                                                feature.description
                                                            }
                                                        </p>

                                                    </div>

                                                    <div className="admin-feature-card-footer">

                                                        <span>
                                                            {feature.status ===
                                                            "Connected"
                                                                ? "Open module"
                                                                : "View module plan"}
                                                        </span>

                                                        <FiChevronRight
                                                            size={
                                                                17
                                                            }
                                                        />

                                                    </div>

                                                </button>
                                            );

                                        }
                                    )}

                                </div>

                            </section>
                        );
                    }
                )}

            </div>

            {/* =================================================
                SECURITY NOTICE
            ================================================= */}

            <div className="admin-feature-security">

                <div className="admin-feature-security-icon">
                    <FiShield size={20} />
                </div>

                <div>

                    <strong>
                        Administrator Security
                    </strong>

                    <p>
                        Administrative actions should
                        remain authenticated, role-protected,
                        logged, and separated from student
                        ballot selections. Election data
                        and ballot secrecy must remain
                        protected throughout the system.
                    </p>

                </div>

            </div>

            {/* =================================================
                FUTURE MODULE MODAL
            ================================================= */}

            {selectedFeature && (

                <div
                    className="admin-feature-modal-overlay"
                    onClick={() =>
                        setSelectedFeature(
                            null
                        )
                    }
                >

                    <div
                        className="admin-feature-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <div className="admin-feature-modal-icon">
                            <FiSettings size={24} />
                        </div>

                        <span className="admin-feature-status ready">
                            READY FOR INTEGRATION
                        </span>

                        <h3>
                            {
                                selectedFeature.title
                            }
                        </h3>

                        <p>
                            {
                                selectedFeature.description
                            }
                        </p>

                        <div className="admin-feature-modal-note">

                            <FiTool size={18} />

                            <span>
                                This Admin feature is
                                prepared in the interface
                                and will be connected to
                                the VOTARA backend in the
                                next integration phase.
                            </span>

                        </div>

                        <button
                            className="admin-feature-modal-close"
                            onClick={() =>
                                setSelectedFeature(
                                    null
                                )
                            }
                        >
                            Close
                        </button>

                    </div>

                </div>
            )}

        </section>
    );
};

export default AdminFeatureCenter;