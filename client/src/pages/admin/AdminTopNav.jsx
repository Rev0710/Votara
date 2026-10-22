import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiActivity, FiBarChart2, FiCalendar, FiClipboard, FiFileText, FiGrid, FiHelpCircle, FiLayers, FiLogOut, FiMenu, FiMonitor, FiMoon, FiSettings, FiSun, FiUser, FiUsers, FiX } from "react-icons/fi";
import PlatformNotifications from "../../components/PlatformNotifications";
import AdminProfileModal from "./AdminProfileModal";
import api from "../../services/api";
import logo from "../../images/Votara.png";
import { ADMIN_NAVIGATION, ADMIN_OVERVIEW, isAdminDestinationActive } from "./adminNavigation";
import "./AdminTopNav.css";

export default function AdminTopNav({ admin = null, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const headerRef = useRef(null);
    const triggerRefs = useRef({});
    const logoutRef = useRef(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [updatedAdmin, setUpdatedAdmin] = useState(null);
    const [storedAdmin] = useState(() => {
        try { return JSON.parse(localStorage.getItem("votaraAdminUser") || "null"); }
        catch { return null; }
    });
    const profileAdmin = updatedAdmin || admin || storedAdmin;
    const profileName = profileAdmin?.full_name || profileAdmin?.fullName || "Administrator";
    const profilePhoto = profileAdmin?.profile_photo_url || profileAdmin?.profilePhotoUrl;
    const [theme, setTheme] = useState(() => localStorage.getItem("votaraAdminTheme") || "dark");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const closeNavigation = () => { setOpenMenu(null); setMobileOpen(false); };
    useEffect(() => { setOpenMenu(null); setMobileOpen(false); }, [location.pathname, location.search]);

    useEffect(() => {
        let refreshInFlight = false;
        const refreshSession = async () => {
            if (document.visibilityState !== "visible" || refreshInFlight) return;
            const token = localStorage.getItem("votaraAdminToken");
            if (!token) return;

            refreshInFlight = true;
            try {
                const response = await api.post(
                    "/admin-auth/session/keepalive",
                    {},
                    { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
                );
                const renewedToken = response?.data?.token;
                if (renewedToken && localStorage.getItem("votaraAdminToken") === token) {
                    localStorage.setItem("votaraAdminToken", renewedToken);
                }
            } catch (error) {
                console.warn("Administrator session renewal was unsuccessful:", error?.message);
            } finally {
                refreshInFlight = false;
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") refreshSession();
        };
        const timer = window.setInterval(refreshSession, 5 * 60 * 1000);
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);

    useEffect(() => {
        if (!openMenu && !mobileOpen) return;
        const dismiss = (event) => {
            if (event.type === "keydown") {
                if (event.key !== "Escape") return;
                event.preventDefault();
                if (openMenu) {
                    triggerRefs.current[openMenu]?.focus();
                    setOpenMenu(null);
                } else {
                    triggerRefs.current.mobile?.focus();
                    setMobileOpen(false);
                }
            } else if (!headerRef.current?.contains(event.target)) {
                setOpenMenu(null);
                setMobileOpen(false);
            }
        };
        document.addEventListener("pointerdown", dismiss);
        document.addEventListener("focusin", dismiss);
        document.addEventListener("keydown", dismiss);
        return () => {
            document.removeEventListener("pointerdown", dismiss);
            document.removeEventListener("focusin", dismiss);
            document.removeEventListener("keydown", dismiss);
        };
    }, [openMenu, mobileOpen]);

    useEffect(() => {
        if (showLogoutConfirm) logoutRef.current?.showModal();
        else logoutRef.current?.close();
    }, [showLogoutConfirm]);

    const toggleTheme = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("votaraAdminTheme", next);
        window.dispatchEvent(new Event("votara-admin-theme"));
    };
    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        if (typeof onLogout === "function") return onLogout();
        localStorage.removeItem("votaraAdminToken");
        localStorage.removeItem("votaraAdminUser");
        navigate("/admin-login", { replace: true });
    };
    const handleListKeyDown = (event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = Array.from(event.currentTarget.querySelectorAll("a, button"));
        const index = items.indexOf(document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
            : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        event.preventDefault();
        items[next]?.focus();
    };
    const openWithKeyboard = (event, key) => {
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        setOpenMenu(key);
        requestAnimationFrame(() => document.getElementById(`admin-menu-${key}`)?.querySelector("a, button")?.focus());
    };
    const destination = (item, className = "admin-nav-destination") => (
        <Link key={item.path} to={item.path} className={className}
            aria-current={isAdminDestinationActive(item, location) ? "page" : undefined}
<<<<<<< HEAD
            onClick={closeNavigation}>{(() => {
                const label = item.label.toLowerCase();
                const Icon = label.includes("dashboard") || label.includes("overview") ? FiGrid
                    : label.includes("registration") || label.includes("enrol") ? FiClipboard
                    : label.includes("candidate") || label.includes("voter") || label.includes("user") ? FiUsers
                    : label.includes("party") ? FiLayers
                    : label.includes("election") ? FiCalendar
                    : label.includes("kiosk") || label.includes("monitor") ? FiMonitor
                    : label.includes("result") || label.includes("report") ? FiBarChart2
                    : label.includes("audit") || label.includes("log") ? FiActivity
                    : label.includes("issue") || label.includes("support") ? FiHelpCircle
                    : label.includes("setting") ? FiSettings : FiFileText;
                return <><Icon aria-hidden="true" />{item.label}</>;
            })()}</Link>
=======
            onClick={closeNavigation}><span key={theme} className="admin-nav-label">{item.label}</span></Link>
>>>>>>> e3c28d7b064dd8e06d0f4f70aaf6d2c0bff200a1
    );

    return (
        <>
            <header className="admin-shared-header" ref={headerRef} data-navigation-theme={theme}>
                <Link to={ADMIN_OVERVIEW.path} className="admin-shared-brand" aria-label="Votara admin dashboard" onClick={closeNavigation}>
                    <img src={logo} alt="" /><span>Votara</span>
                </Link>
                <nav className={`admin-shared-nav${mobileOpen ? " is-open" : ""}`} id="admin-primary-navigation" aria-label="Admin navigation">
                    <div className="admin-mobile-profile">
                        <div className="admin-mobile-profile-avatar">{profilePhoto ? <img src={profilePhoto} alt="" /> : profileName.charAt(0).toUpperCase()}</div>
                        <div><strong>{profileName}</strong><span>Administrator</span></div>
                    </div>
                    {destination(ADMIN_OVERVIEW, "admin-nav-tab admin-nav-overview")}
                    {ADMIN_NAVIGATION.map((group) => {
                        const active = group.key === "settings" ? location.pathname.startsWith("/admin/settings")
                            : group.items.some((item) => isAdminDestinationActive(item, location));
                        const expanded = openMenu === group.key;
                        return (
                            <div className={`admin-nav-group admin-nav-${group.key}`} key={group.key}>
                                <button type="button" className={`admin-nav-tab${active ? " is-active" : ""}`}
                                    ref={(node) => { triggerRefs.current[group.key] = node; }}
                                    aria-expanded={expanded} aria-controls={`admin-menu-${group.key}`}
                                    onKeyDown={(event) => openWithKeyboard(event, group.key)}
                                    onClick={() => setOpenMenu(expanded ? null : group.key)}>
                                    <span key={theme} className="admin-nav-label">{group.label}</span><span className="admin-nav-caret" aria-hidden="true">▾</span>
                                </button>
                                {expanded && <div className="admin-nav-dropdown" id={`admin-menu-${group.key}`} onKeyDown={handleListKeyDown}>
                                    {group.items.map((item) => destination(item))}
                                </div>}
                            </div>
                        );
                    })}
                </nav>
                <div className="admin-shared-actions">
                    <span className="admin-shared-role">Admin</span>
                    <div onClick={() => setOpenMenu(null)}><PlatformNotifications admin /></div>
                    <div className="admin-account">
                        <button type="button" className="admin-account-trigger" aria-label={`Account menu for ${profileName}`}
                            aria-expanded={openMenu === "account"} aria-controls="admin-menu-account"
                            ref={(node) => { triggerRefs.current.account = node; }}
                            onKeyDown={(event) => openWithKeyboard(event, "account")}
                            onClick={() => { setMobileOpen(false); setOpenMenu(openMenu === "account" ? null : "account"); }}>
                            {profilePhoto ? <img src={profilePhoto} alt="" /> : <span>{profileName.charAt(0).toUpperCase()}</span>}
                        </button>
                        {openMenu === "account" && <div className="admin-nav-dropdown admin-account-dropdown" id="admin-menu-account" onKeyDown={handleListKeyDown}>
                            <div className="admin-account-name">{profileName}</div>
                            <button type="button" onClick={() => { closeNavigation(); setProfileOpen(true); }}><FiUser />My profile</button>
                            <button type="button" onClick={toggleTheme}>{theme === "dark" ? <FiSun /> : <FiMoon />}{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</button>
                            <button type="button" onClick={() => { closeNavigation(); setShowLogoutConfirm(true); }}><FiLogOut />Sign out</button>
                        </div>}
                    </div>
                    <button type="button" className="admin-shared-menu-toggle" aria-label={mobileOpen ? "Close admin navigation" : "Open admin navigation"}
                        aria-expanded={mobileOpen} aria-controls="admin-primary-navigation"
                        ref={(node) => { triggerRefs.current.mobile = node; }}
                        onClick={() => { setOpenMenu(null); setMobileOpen(!mobileOpen); }}>
                        {mobileOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>
            </header>
            <dialog ref={logoutRef} className="admin-signout-dialog" aria-labelledby="admin-signout-title"
                onCancel={() => setShowLogoutConfirm(false)} onClick={(event) => { if (event.target === event.currentTarget) setShowLogoutConfirm(false); }}>
                <div className="admin-signout-content">
                    <FiLogOut size={24} /><h2 id="admin-signout-title">Sign out?</h2>
                    <p>Are you sure you want to sign out of your Votara Admin account?</p>
                    <div className="admin-signout-actions">
                        <button type="button" autoFocus onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                        <button type="button" className="admin-signout-confirm" onClick={confirmLogout}>Sign out</button>
                    </div>
                </div>
            </dialog>
            {profileOpen && <AdminProfileModal onClose={() => { setProfileOpen(false); triggerRefs.current.account?.focus(); }} onUpdated={setUpdatedAdmin} />}
        </>
    );
}
