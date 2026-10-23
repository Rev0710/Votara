import React, { useEffect, useRef, useState } from "react";
import { FiActivity, FiBarChart2, FiCalendar, FiFileText, FiGrid, FiHelpCircle, FiLayers, FiLogOut, FiMenu, FiMonitor, FiMoon, FiSettings, FiSun, FiUser, FiX } from "react-icons/fi";
import PlatformNotifications from "../../components/PlatformNotifications";
import logo from "../../images/votara-board-logo.svg";
import bell from "../../images/votara-board-bell.svg";
import "./EBHeader.css";

const navigation = [
    { id: "elections", label: "Elections", items: [
        { id: "election", label: "Election workspace", Icon: FiCalendar },
        { id: "createElection", label: "Create election", Icon: FiFileText },
        { id: "partyLists", label: "Partylists", Icon: FiLayers },
        { id: "individualCandidacy", label: "Individual Candidacy", Icon: FiUser },
        { id: "results", label: "Results & Reports", Icon: FiBarChart2 },
    ] },
    { id: "voters", label: "Voters", items: [
        { id: "registrations", label: "Registration review", Icon: FiGrid },
        { id: "verification", label: "Verify voter", Icon: FiUser },
    ] },
    { id: "operations", label: "Operations", items: [
        { id: "kiosk", label: "Kiosk management", Icon: FiMonitor },
        { id: "logs", label: "Activity log", Icon: FiActivity },
    ] },
];

export default function EBHeader({ activeSection, displayName, displayEmail, profileImage, theme, onToggleTheme, onNavigate, onLogout }) {
    const header = useRef(null);
    const logoutDialog = useRef(null);
    const triggers = useRef({});
    const [openMenu, setOpenMenu] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const initials = displayName.trim().split(/\s+/).filter(Boolean).map(part => part[0]).filter((_, index, parts) => index === 0 || index === parts.length - 1).join("").toUpperCase() || "EB";

    const close = () => { setOpenMenu(null); setMobileOpen(false); };
    const select = section => { close(); onNavigate(section); };

    useEffect(() => { setOpenMenu(null); setMobileOpen(false); }, [activeSection]);

    useEffect(() => {
        if (showLogoutConfirm) logoutDialog.current?.showModal();
        else logoutDialog.current?.close();
    }, [showLogoutConfirm]);

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        onLogout();
    };

    useEffect(() => {
        if (!openMenu && !mobileOpen) return;
        const dismiss = event => {
            if (event.type === "keydown") {
                if (event.key !== "Escape") return;
                event.preventDefault();
                triggers.current[openMenu || "mobile"]?.focus();
                if (openMenu) setOpenMenu(null);
                else setMobileOpen(false);
            } else if (!header.current?.contains(event.target)) {
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

    const openWithKeyboard = (event, id) => {
        if (event.key !== "ArrowDown") return;
        event.preventDefault();
        setOpenMenu(id);
        requestAnimationFrame(() => document.getElementById(`eb-header-menu-${id}`)?.querySelector("button")?.focus());
    };
    const moveFocus = event => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const items = Array.from(event.currentTarget.querySelectorAll("button"));
        const index = items.indexOf(document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1
            : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        event.preventDefault();
        items[next]?.focus();
    };

    return (
        <header className="eb-board-header" ref={header}>
            <button type="button" className="eb-board-brand" aria-label="Votara electoral board overview" onClick={() => select("dashboard")}>
                <img src={logo} alt="" width="166" height="34" />
            </button>
            <nav className={`eb-board-navigation${mobileOpen ? " is-open" : ""}`} id="eb-board-navigation" aria-label="Electoral Board navigation">
                <div className="eb-board-mobile-profile">
                    <div className="eb-board-mobile-avatar">{profileImage ? <img src={profileImage} alt="" /> : initials}</div>
                    <div><strong>{displayName}</strong><span>{displayEmail}</span><small>Electoral Board</small></div>
                </div>
                <button type="button" className="eb-board-tab eb-board-overview" aria-current={activeSection === "dashboard" ? "page" : undefined} onClick={() => select("dashboard")}>Overview</button>
                {navigation.map(group => {
                    const active = group.items.some(item => item.id === activeSection);
                    const expanded = openMenu === group.id;
                    return <div className={`eb-board-group eb-board-${group.id}`} key={group.id}>
                        <button type="button" className={`eb-board-tab${active ? " is-active" : ""}`}
                            ref={node => { triggers.current[group.id] = node; }}
                            aria-expanded={expanded} aria-controls={`eb-header-menu-${group.id}`}
                            onKeyDown={event => openWithKeyboard(event, group.id)}
                            onClick={() => setOpenMenu(expanded ? null : group.id)}>
                            {group.label}<span aria-hidden="true" className="eb-board-caret">▾</span>
                        </button>
                        {expanded && <div className="eb-board-dropdown" id={`eb-header-menu-${group.id}`} onKeyDown={moveFocus}>
                            {group.items.map(item => <button type="button" key={item.id} aria-current={activeSection === item.id ? "page" : undefined} onClick={() => select(item.id)}><item.Icon aria-hidden="true" />{item.label}</button>)}
                        </div>}
                    </div>;
                })}
            </nav>
            <div className="eb-board-actions">
                <span className="eb-board-duty">On duty</span>
                <div onClick={() => setOpenMenu(null)}>
                    <PlatformNotifications audience="eb" iconSrc={bell} onAction={target => select(target === "reports" ? "support" : "dashboard")} />
                </div>
                <div className="eb-board-account">
                    <button type="button" className="eb-board-avatar" aria-label={`Account menu for ${displayName}`}
                        aria-expanded={openMenu === "account"} aria-controls="eb-header-menu-account"
                        ref={node => { triggers.current.account = node; }}
                        onKeyDown={event => openWithKeyboard(event, "account")}
                        onClick={() => { setMobileOpen(false); setOpenMenu(openMenu === "account" ? null : "account"); }}>
                        {profileImage ? <img src={profileImage} alt="" /> : <span>{initials}</span>}
                    </button>
                    {openMenu === "account" && <div className="eb-board-dropdown eb-board-account-menu" id="eb-header-menu-account" onKeyDown={moveFocus}>
                        <div className="eb-board-account-details"><strong>{displayName}</strong><span>{displayEmail}</span></div>
                        <button type="button" onClick={() => select("profile")}><FiUser />My profile</button>
                        <button type="button" onClick={() => select("settings")}><FiSettings />Settings</button>
                        <button type="button" onClick={() => select("support")}><FiHelpCircle />Report an issue</button>
                        <button type="button" onClick={() => { close(); onToggleTheme(); }}>{theme === "dark" ? <FiSun /> : <FiMoon />}{theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}</button>
                        <button type="button" onClick={() => { close(); setShowLogoutConfirm(true); }}><FiLogOut />Sign out</button>
                    </div>}
                </div>
                <button type="button" className="eb-board-menu-toggle" aria-label={mobileOpen ? "Close board navigation" : "Open board navigation"}
                    aria-expanded={mobileOpen} aria-controls="eb-board-navigation"
                    ref={node => { triggers.current.mobile = node; }}
                    onClick={() => { setOpenMenu(null); setMobileOpen(!mobileOpen); }}>
                    {mobileOpen ? <FiX /> : <FiMenu />}
                </button>
            </div>
            <dialog ref={logoutDialog} className="eb-signout-dialog" aria-labelledby="eb-signout-title"
                onCancel={() => setShowLogoutConfirm(false)}
                onClick={event => { if (event.target === event.currentTarget) setShowLogoutConfirm(false); }}>
                <div className="eb-signout-content">
                    <FiLogOut aria-hidden="true" />
                    <h2 id="eb-signout-title">Sign out?</h2>
                    <p>Are you sure you want to sign out of your VOTARA Electoral Board account?</p>
                    <div className="eb-signout-actions">
                        <button type="button" autoFocus onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                        <button type="button" className="eb-signout-confirm" onClick={confirmLogout}>Sign out</button>
                    </div>
                </div>
            </dialog>
        </header>
    );
}
