import React, { useState } from "react";
import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    FiBell,
    FiChevronDown,
    FiLogOut,
    FiMenu,
    FiX,
} from "react-icons/fi";

import "./AdminTopNav.css";


// ============================================================
// VOTARA ADMIN TOP NAVIGATION
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
    const navigate = useNavigate();
    const location = useLocation();

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // ========================================================
    // ACTIVE NAVIGATION
    // ========================================================

    const isActive = (path) => {
        if (path === "/admin-dashboard") {
            return location.pathname === "/admin-dashboard";
        }

        return (
            location.pathname === path ||
            location.pathname.startsWith(`${path}/`)
        );
    };

    // ========================================================
    // NAVIGATE
    // ========================================================

    const handleNavigation = (path) => {
        if (location.pathname !== path) {
            navigate(path);
        }

        setMobileMenuOpen(false);
    };

    // ========================================================
    // LOGOUT
    // ========================================================

    const confirmLogout = () => {
        setShowLogoutConfirm(false);

        if (typeof onLogout === "function") {
            onLogout();
            return;
        }

        localStorage.removeItem("votaraAdminToken");
        localStorage.removeItem("votaraAdminUser");

        navigate("/admin-login", {
            replace: true,
        });
    };

    const requestLogout = () => {
        setMobileMenuOpen(false);
        setShowLogoutConfirm(true);
    };

    const currentPage =
        ADMIN_NAVIGATION.find((item) => isActive(item.path));

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <header className="votara-admin-topbar">

            {/* BRAND */}
            <button
                type="button"
                className="votara-admin-brand"
                onClick={() =>
                    handleNavigation("/admin-dashboard")
                }
                aria-label="VOTARA Admin Dashboard"
            >
                <span className="votara-admin-brand-mark">
                    <img
                        src="/src/images/Votara.png"
                        alt="Votara"
                        className="votara-admin-brand-logo"
                    />
                </span>

                <span className="votara-admin-brand-name">
                    Votara
                </span>
            </button>


            {/* DESKTOP NAVIGATION */}
            <nav
                className="votara-admin-topnav"
                aria-label="VOTARA Admin Navigation"
            >
                {ADMIN_NAVIGATION.map((item) => {
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={`votara-admin-topnav-link ${
                                active ? "active" : ""
                            }`}
                            onClick={() =>
                                handleNavigation(item.path)
                            }
                            aria-current={
                                active ? "page" : undefined
                            }
                        >
                            {item.label}
                        </button>
                    );
                })}
            </nav>


            {/* RIGHT SIDE */}
            <div className="votara-admin-topbar-actions">

                <button
                    type="button"
                    className="votara-topbar-environment"
                    title="Current environment"
                >
                    <span className="votara-env-dot" />
                    <span>Production</span>
                </button>

                <button
                    type="button"
                    className="votara-notification-button"
                    onClick={() =>
                        handleNavigation("/admin/audit-logs")
                    }
                    title="Monitoring & Logs"
                    aria-label="Monitoring & Logs"
                >
                    <span className="notification-dot" />
                    <FiBell size={16} />
                </button>

                <div className="votara-admin-user">
                    <span className="votara-admin-user-avatar">
                        {admin?.full_name
                            ?.charAt(0)
                            ?.toUpperCase() || "A"}
                    </span>

                    <span className="votara-admin-user-name">
                        {admin?.full_name || "Administrator"}
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


                {/* MOBILE / COMPACT MENU BUTTON */}
                <button
                    type="button"
                    className="votara-admin-menu-button"
                    onClick={() =>
                        setMobileMenuOpen((open) => !open)
                    }
                    aria-label={
                        mobileMenuOpen
                            ? "Close admin navigation"
                            : "Open admin navigation"
                    }
                    aria-expanded={mobileMenuOpen}
                >
                    {mobileMenuOpen ? (
                        <FiX size={20} />
                    ) : (
                        <FiMenu size={20} />
                    )}
                </button>
            </div>


            {/* COMPACT NAVIGATION */}
            {/* LOGOUT CONFIRMATION */}
            {showLogoutConfirm && (
                <div
                    className="votara-logout-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setShowLogoutConfirm(false);
                        }
                    }}
                >
                    <div
                        className="votara-logout-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="votara-logout-title"
                    >
                        <div className="votara-logout-modal-icon">
                            <FiLogOut size={20} />
                        </div>

                        <div className="votara-logout-modal-content">
                            <h2 id="votara-logout-title">Sign out?</h2>
                            <p>Are you sure you want to sign out of your VOTARA Admin account?</p>
                        </div>

                        <div className="votara-logout-modal-actions">
                            <button
                                type="button"
                                className="votara-logout-cancel"
                                onClick={() => setShowLogoutConfirm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="votara-logout-confirm"
                                onClick={confirmLogout}
                            >
                                <FiLogOut size={15} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`votara-admin-mobile-menu ${
                    mobileMenuOpen ? "open" : ""
                }`}
            >
                <div className="votara-admin-mobile-current">
                    <span className="votara-mobile-current-label">
                        Current page
                    </span>

                    <span className="votara-mobile-current-value">
                        {currentPage?.label || "Admin"}
                    </span>

                    <FiChevronDown size={16} />
                </div>

                <nav
                    className="votara-admin-mobile-nav"
                    aria-label="VOTARA Admin Navigation"
                >
                    {ADMIN_NAVIGATION.map((item) => {
                        const active = isActive(item.path);

                        return (
                            <button
                                key={item.key}
                                type="button"
                                className={`votara-admin-mobile-link ${
                                    active ? "active" : ""
                                }`}
                                onClick={() =>
                                    handleNavigation(item.path)
                                }
                            >
                                <span>{item.label}</span>

                                {active && (
                                    <span className="votara-mobile-active-dot" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
};

export default AdminTopNav;
