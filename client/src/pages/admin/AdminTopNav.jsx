import React from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    FiBell,
    FiLogOut,
} from "react-icons/fi";

import "./AdminTopNav.css";


// ============================================================
// ADMIN TOP NAVIGATION
// ============================================================
//
// This component is shared by ALL VOTARA Admin pages.
//
// The navigation remains visible while the page content changes.
//
// ============================================================

const ADMIN_NAVIGATION = [
    {
        key: "dashboard",
        label: "System Dashboard",
        path: "/admin-dashboard",
    },

    {
        key: "users",
        label: "User & Access Management",
        path: "/admin/users",
    },

    {
        key: "data",
        label: "Data Management",
        path: "/admin/data-management",
    },

    {
        key: "configuration",
        label: "System Configuration",
        path: "/admin/settings",
    },

    {
        key: "logs",
        label: "Monitoring & Logs",
        path: "/admin/audit-logs",
    },

    {
        key: "support",
        label: "Support & Troubleshooting",
        path: "/admin/support",
    },

    {
        key: "reports",
        label: "Reports & Analytics",
        path: "/admin/reports",
    },
];


// ============================================================
// COMPONENT
// ============================================================

const AdminTopNav = ({
    admin = null,
    onLogout,
}) => {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    // ========================================================
    // ACTIVE NAVIGATION
    // ========================================================

    const isActive = (path) => {

        if (
            path ===
            "/admin-dashboard"
        ) {
            return (
                location.pathname ===
                "/admin-dashboard"
            );
        }


        return (
            location.pathname === path ||
            location.pathname.startsWith(
                `${path}/`
            )
        );
    };


    // ========================================================
    // NAVIGATE
    // ========================================================

    const handleNavigation = (
        path
    ) => {

        if (
            location.pathname ===
            path
        ) {
            return;
        }

        navigate(path);
    };


    // ========================================================
    // LOGOUT
    // ========================================================

    const handleLogout = () => {

        if (
            typeof onLogout ===
            "function"
        ) {
            onLogout();
            return;
        }


        localStorage.removeItem(
            "votaraStaffToken"
        );

        localStorage.removeItem(
            "votaraStaffUser"
        );

        localStorage.removeItem(
            "adminToken"
        );

        localStorage.removeItem(
            "adminData"
        );

        navigate(
            "/admin-login",
            {
                replace: true,
            }
        );
    };


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <header
            className="votara-admin-topbar"
        >

            {/* ==================================================
                BRAND
            ================================================== */}

            <button
                type="button"
                className="votara-admin-brand"
                onClick={() =>
                    handleNavigation(
                        "/admin-dashboard"
                    )
                }
                aria-label="VOTARA Admin Dashboard"
            >

                <span
                    className="votara-admin-brand-mark"
                >
                    <img
                        src="/src/images/Votara.png"
                        alt="Votara"
                        className="votara-admin-brand-logo"
                    />
                </span>

                <span
                    className="votara-admin-brand-name"
                >
                    Votara
                </span>

            </button>


            {/* ==================================================
                MAIN NAVIGATION
            ================================================== */}

            <nav
                className="votara-admin-topnav"
                aria-label="VOTARA Admin Navigation"
            >

                {ADMIN_NAVIGATION.map(
                    (item) => {

                        const active =
                            isActive(
                                item.path
                            );

                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={
                                    `votara-admin-topnav-link ${
                                        active
                                            ? "active"
                                            : ""
                                    }`
                                }
                                onClick={() =>
                                    handleNavigation(
                                        item.path
                                    )
                                }
                                aria-current={
                                    active
                                        ? "page"
                                        : undefined
                                }
                            >
                                {item.label}
                            </button>
                        );
                    }
                )}

            </nav>


            {/* ==================================================
                RIGHT SIDE
            ================================================== */}

            <div
                className="votara-admin-topbar-actions"
            >

                <button
                    type="button"
                    className="votara-topbar-environment"
                    title="Current environment"
                >
                    <span
                        className="votara-env-dot"
                    />

                    Production
                </button>


                <button
                    type="button"
                    className="votara-notification-button"
                    onClick={() =>
                        handleNavigation(
                            "/admin/audit-logs"
                        )
                    }
                    title="Monitoring & Logs"
                    aria-label="Monitoring & Logs"
                >
                    <span
                        className="notification-dot"
                    />

                    <FiBell
                        size={16}
                    />
                </button>


                <div
                    className="votara-admin-user"
                >

                    <span
                        className="votara-admin-user-avatar"
                    >
                        {
                            admin?.full_name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                            "A"
                        }
                    </span>

                    <span
                        className="votara-admin-user-name"
                    >
                        {
                            admin?.full_name ||
                            "Administrator"
                        }
                    </span>

                </div>


                <button
                    type="button"
                    className="votara-admin-logout"
                    onClick={
                        handleLogout
                    }
                    title="Logout"
                    aria-label="Logout"
                >
                    <FiLogOut
                        size={17}
                    />
                </button>

            </div>

        </header>
    );
};


export default AdminTopNav;