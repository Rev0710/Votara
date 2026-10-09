import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiBell,
    FiCheck,
    FiChevronDown,
    FiClock,
    FiDatabase,
    FiGlobe,
    FiLock,
    FiLogOut,
    FiMail,
    FiMonitor,
    FiSave,
    FiShield,
    FiSliders,
    FiTool,
    FiUser,
    FiUsers,
    FiRefreshCw,
    FiCalendar,
    FiSettings,
    FiAlertTriangle,
    FiMoon,
    FiSun,
    FiMenu,
    FiX,
} from "react-icons/fi";
import "./SystemSettings.css";
import AdminTopNav from "./AdminTopNav";
import "./SystemSettings.connection.css";
import PageLoader from "/src/components/transitionloader/PageLoader";
import api from "../../services/api";

const hexToRgba = (hex, alpha) => {
    if (!hex || !/^#([0-9a-f]{6})$/i.test(hex)) return `rgba(37, 99, 235, ${alpha})`;
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const defaultSettings = {
    primaryColor: "#2563eb",
    theme: "dark",
    systemName: "VOTARA Election System",
    language: "English",
    timezone: "Asia/Manila",
    dateFormat: "MM/DD/YYYY",
    academicYear: "2025–2026",
    registrationPeriod: "May 1 – May 20",
    votingPeriod: "May 31, 8:00 AM – 5:00 PM",
    remoteVoting: true,
    campusKiosk: true,
    lateEnrolleeWindow: true,
    otpMethod: "Email + SMS",
    otpLength: "6 digits",
    otpExpiry: "5 minutes",
    maxOtpAttempts: "3 attempts",
    resendCooldown: "60 seconds",
    senderEmail: "noreply@school.edu",
    loginAttempts: "5 attempts",
    lockoutDuration: "2 minutes",
    otpRequestLimit: "5 per hour",
    registrationSubmissions: "3 per day",
    ipRateLimit: "60 per minute",
    passwordRules: "Min 8 chars + number",
    forcePasswordChange: true,
    sessionTimeout: "30",
    singleSession: true,
    twoStepVerification: true,
    kioskRestrictions: true,
    maintenanceMode: false,
    scheduledStart: "Jun 1, 10:00 PM",
    scheduledEnd: "Jun 2, 6:00 AM",
    adminAccess: true,
    votingSafeguard: true,
    maintenanceMessage: "The system is under maintenance. Please check back later.",
    platformNotice: "Scheduled maintenance: Jun 1, 10:00 PM to Jun 2, 6:00 AM (Asia/Manila). Please return after maintenance ends.",
    emailNotifications: true,
    electionNotifications: true,
    securityNotifications: true,
    allowRegistration: true,
    allowVoting: true,
    autoBackup: true,
    backupFrequency: "Daily",
    backupEncryption: true,
    backupRetention: "30 days",
    lastBackupAt: "",
    lastBackupStatus: "",
};

const applyTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");
};

const Toggle = ({ checked, onChange, label }) => (
    <button
        type="button"
        className={`system-config-toggle ${checked ? "active" : ""}`}
        onClick={onChange}
        aria-label={label}
        aria-pressed={checked}
    >
        <span />
    </button>
);

const SelectField = ({ value, onChange, options }) => (
    <div className="system-config-select-wrap">
        <select value={value} onChange={onChange}>
            {options.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
        <FiChevronDown />
    </div>
);

const ConfigRow = ({ title, description, children, last = false }) => (
    <div className={`system-config-row ${last ? "last" : ""}`}>
        <div className="system-config-row-copy">
            <strong>{title}</strong>
            <span>{description}</span>
        </div>
        <div className="system-config-row-control">{children}</div>
    </div>
);

const ConfigCard = ({ icon, title, description, children, className = "" }) => (
    <section className={`system-config-card ${className}`}>
        <div className="system-config-card-head">
            <div className="system-config-card-icon">{icon}</div>
            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
        <div className="system-config-card-body">{children}</div>
    </section>
);

const SystemSettings = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [settings, setSettings] = useState(defaultSettings);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);
    const [saveError, setSaveError] = useState("");
    // Page transition loader used for navigation between admin pages.
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);
    const [configSection, setConfigSection] = useState("configuration");
    const [showNoticeReview, setShowNoticeReview] = useState(false);
    const [restoreReviewOpen, setRestoreReviewOpen] = useState(false);
    const [diagnosticNotice, setDiagnosticNotice] = useState("");
    const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [securityDraft, setSecurityDraft] = useState({ staffVerification: true, idleSessionTimeout: "20", failedSignInThreshold: "5", temporaryLockout: "30" });
    const [securityOriginal, setSecurityOriginal] = useState({ staffVerification: true, idleSessionTimeout: "20", failedSignInThreshold: "5", temporaryLockout: "30" });
    const [securityReviewOpen, setSecurityReviewOpen] = useState(false);
    const [securitySaving, setSecuritySaving] = useState(false);
    const [securityNotice, setSecurityNotice] = useState("");
    const [securityEvents, setSecurityEvents] = useState([]);
    const [securityEventsLoading, setSecurityEventsLoading] = useState(false);
    const [diagnosticSnapshot, setDiagnosticSnapshot] = useState({ database: "Checking", api: "Checking", kiosk: "Unknown" });

    const loadSecurityAndDiagnostics = async () => {
        setSecurityEventsLoading(true);
        try {
            const [auditResponse, healthResponse] = await Promise.allSettled([
                api.get("/admin/audit-logs", { params: { limit: 12 } }),
                api.get("/health"),
            ]);

            if (auditResponse.status === "fulfilled") {
                const logs = auditResponse.value?.data?.logs || [];
                const relevant = logs
                    .filter((log) => {
                        const text = `${log?.action || ""} ${log?.module || ""} ${log?.description || ""}`.toLowerCase();
                        return /login|logout|password|security|otp|failed|reject|lock|suspicious|kiosk|session/.test(text);
                    })
                    .slice(0, 6);
                setSecurityEvents(relevant);
            }

            setDiagnosticSnapshot((current) => ({
                ...current,
                database: healthResponse.status === "fulfilled" && healthResponse.value?.data?.success ? "Operational" : "Unavailable",
                api: healthResponse.status === "fulfilled" && healthResponse.value?.data?.success ? "Operational" : "Unavailable",
            }));
        } catch (error) {
            console.error("Unable to load configuration diagnostics:", error);
        } finally {
            setSecurityEventsLoading(false);
        }
    };

    const navAdminName = admin?.full_name || "Administrator";
    const navAdminInitial = navAdminName.charAt(0).toUpperCase() || "A";

    const getSecurityDraftFromSettings = (source) => ({
        staffVerification: Boolean(source?.twoStepVerification ?? true),
        idleSessionTimeout: String(source?.sessionTimeout || "20").replace(/[^0-9]/g, "") || "20",
        failedSignInThreshold: String(source?.loginAttempts || "5").replace(/[^0-9]/g, "") || "5",
        temporaryLockout: String(source?.lockoutDuration || "30").replace(/[^0-9]/g, "") || "30",
    });

    const updateSecurityDraft = (key, value) => {
        setSecurityDraft((current) => ({ ...current, [key]: value }));
        setSecurityNotice("");
    };

    const discardSecurityDraft = () => {
        setSecurityDraft(securityOriginal);
        setSecurityReviewOpen(false);
        setSecurityNotice("Security policy draft discarded. No security settings were changed.");
    };

    const saveSecurityChanges = async () => {
        if (securitySaving) return;
        try {
            setSecuritySaving(true);
            setSecurityNotice("");
            const nextSettings = {
                ...settings,
                twoStepVerification: securityDraft.staffVerification,
                sessionTimeout: securityDraft.idleSessionTimeout,
                loginAttempts: `${securityDraft.failedSignInThreshold} attempts`,
                lockoutDuration: `${securityDraft.temporaryLockout} seconds`,
            };
            const response = await api.put("/admin/settings", { settings: nextSettings });
            const data = response?.data || {};
            if (!data.success) throw new Error(data.message || "Unable to save security policy.");
            const savedSettings = { ...defaultSettings, ...(data.settings || nextSettings) };
            setSettings(savedSettings);
            const savedSecurity = getSecurityDraftFromSettings(savedSettings);
            setSecurityDraft(savedSecurity);
            setSecurityOriginal(savedSecurity);
            localStorage.setItem("votaraSystemSettings", JSON.stringify(savedSettings));
            window.dispatchEvent(new Event("votaraSettingsChanged"));
            setSecurityReviewOpen(false);
            setSecurityNotice("Security policy changes saved successfully.");
        } catch (error) {
            setSecurityNotice(error?.response?.data?.message || error?.message || "Unable to save security policy.");
        } finally {
            setSecuritySaving(false);
        }
    };

    useEffect(() => {

        let cancelled = false;

        const loadSettings = async () => {

            setLoadingSettings(true);
            setSaveError("");

            // -------------------------------------------------
            // LOCAL CACHE - instant UI while the API loads
            // -------------------------------------------------

            try {

                const storedSettings =
                    localStorage.getItem(
                        "votaraSystemSettings"
                    );

                const parsed =
                    storedSettings
                        ? JSON.parse(
                            storedSettings
                        )
                        : {};

                const cachedSettings = {
                    ...defaultSettings,
                    ...parsed,
                };

                if (!cancelled) {
                    setSettings(
                        cachedSettings
                    );
                    const cachedSecurity = getSecurityDraftFromSettings(cachedSettings);
                    setSecurityDraft(cachedSecurity);
                    setSecurityOriginal(cachedSecurity);

                    applyTheme(
                        cachedSettings.theme
                    );
                }

            } catch (error) {

                console.error(
                    "Unable to load local settings cache:",
                    error
                );

                applyTheme(
                    defaultSettings.theme
                );
            }


            // -------------------------------------------------
            // AUTHORITATIVE SERVER SETTINGS
            // -------------------------------------------------

            try {

                const response =
                    await api.get(
                        "/admin/settings"
                    );

                const data =
                    response?.data || {};

                if (
                    data.success &&
                    data.settings &&
                    !cancelled
                ) {

                    const serverSettings = {
                        ...defaultSettings,
                        ...data.settings,
                    };

                    setSettings(
                        serverSettings
                    );
                    const serverSecurity = getSecurityDraftFromSettings(serverSettings);
                    setSecurityDraft(serverSecurity);
                    setSecurityOriginal(serverSecurity);

                    localStorage.setItem(
                        "votaraSystemSettings",
                        JSON.stringify(
                            serverSettings
                        )
                    );

                    applyTheme(
                        serverSettings.theme
                    );
                }

            } catch (error) {

                console.error(
                    "Unable to load Admin System Settings:",
                    error
                );

                if (!cancelled) {

                    setSaveError(
                        error?.response?.data?.message ||
                        "Using locally cached settings because the Admin Settings API is unavailable."
                    );
                }

            } finally {

                if (!cancelled) {
                    setLoadingSettings(
                        false
                    );
                }
            }
        };

        loadSettings();

        return () => {
            cancelled = true;
        };

    }, []);

    useEffect(() => {
        loadSecurityAndDiagnostics();
    }, []);

    useEffect(() => {
        const token = localStorage.getItem("votaraAdminToken");
        const storedUser = localStorage.getItem("votaraAdminUser");
        if (!token || !storedUser) {
            navigate("/admin-login", { replace: true });
            return;
        }
        try {
            const user = JSON.parse(storedUser);
            if (user.role !== "admin") {
                navigate("/electoral-board/dashboard", { replace: true });
                return;
            }
            setAdmin(user);
        } catch (error) {
            console.error("Invalid admin session:", error);
            localStorage.removeItem("votaraAdminToken");
            localStorage.removeItem("votaraAdminUser");
            navigate("/admin-login", { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        document.documentElement.style.setProperty("--votara-primary", settings.primaryColor);
        document.documentElement.style.setProperty("--votara-primary-light", hexToRgba(settings.primaryColor, 0.10));
        document.documentElement.style.setProperty("--votara-primary-medium", hexToRgba(settings.primaryColor, 0.18));
        document.documentElement.style.setProperty("--votara-primary-border", hexToRgba(settings.primaryColor, 0.25));
    }, [settings.primaryColor]);

    const handleChange = (key, value) => {
        setSettings((current) => ({
            ...current,
            [key]: value,
        }));

        setSaved(false);
        setSaveError("");
    };

    const handleSave = async () => {

        if (saving) {
            return;
        }

        try {

            setSaving(true);
            setSaved(false);
            setSaveError("");

            const response =
                await api.put(
                    "/admin/settings",
                    {
                        settings,
                    }
                );

            const data =
                response?.data || {};

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to save system settings."
                );
            }

            const savedSettings = {
                ...defaultSettings,
                ...(data.settings || settings),
            };

            setSettings(
                savedSettings
            );

            localStorage.setItem(
                "votaraSystemSettings",
                JSON.stringify(
                    savedSettings
                )
            );

            applyTheme(
                savedSettings.theme
            );

            window.dispatchEvent(
                new Event(
                    "votaraSettingsChanged"
                )
            );

            setSaved(true);

            window.setTimeout(
                () => setSaved(false),
                2500
            );

        } catch (error) {

            console.error(
                "Unable to save Admin System Settings:",
                error
            );

            setSaveError(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to save system settings."
            );

        } finally {

            setSaving(false);
        }
    };


    const handleReset = async () => {

        if (saving) {
            return;
        }

        try {

            setSaving(true);
            setSaved(false);
            setSaveError("");

            const response =
                await api.put(
                    "/admin/settings",
                    {
                        settings:
                            defaultSettings,
                    }
                );

            const data =
                response?.data || {};

            if (!data.success) {

                throw new Error(
                    data.message ||
                    "Unable to reset system settings."
                );
            }

            const resetSettings = {
                ...defaultSettings,
                ...(data.settings || defaultSettings),
            };

            setSettings(
                resetSettings
            );

            localStorage.setItem(
                "votaraSystemSettings",
                JSON.stringify(
                    resetSettings
                )
            );

            applyTheme(
                resetSettings.theme
            );

            window.dispatchEvent(
                new Event(
                    "votaraSettingsChanged"
                )
            );

        } catch (error) {

            console.error(
                "Unable to reset Admin System Settings:",
                error
            );

            setSaveError(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to reset system settings."
            );

        } finally {

            setSaving(false);
        }
    };

    // =====================================================
    // PAGE NAVIGATION WITH VOTARA PAGE LOADER
    // =====================================================

    const goTo = (path) => {
        if (isPageTransitioning) {
            return;
        }

        setIsPageTransitioning(true);

        window.setTimeout(() => {
            navigate(path);
        }, 700);
    };

    const handleLogout = () => {
        if (isPageTransitioning) {
            return;
        }

        localStorage.removeItem("votaraAdminToken");
        localStorage.removeItem("votaraAdminUser");

        setIsPageTransitioning(true);

        window.setTimeout(() => {
            navigate("/admin-login", { replace: true });
        }, 700);
    };

    if (!admin) return null;

    return (
        <div className="system-config-page">
            {isPageTransitioning && <PageLoader />}

            <AdminTopNav admin={admin} onLogout={handleLogout} />

            <button
                type="button"
                className={`system-config-mobile-menu-toggle ${mobileSidebarOpen ? "open" : ""}`}
                onClick={() => setMobileSidebarOpen((open) => !open)}
                aria-label={mobileSidebarOpen ? "Close system configuration menu" : "Open system configuration menu"}
                aria-expanded={mobileSidebarOpen}
            >
                {mobileSidebarOpen ? <FiX size={21} /> : <FiMenu size={21} />}
            </button>

            {mobileSidebarOpen && (
                <button
                    type="button"
                    className="system-config-mobile-backdrop"
                    aria-label="Close system configuration menu"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            <aside className={`system-config-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`} aria-label="System configuration navigation">
                <div className="system-config-sidebar-title">SYSTEM</div>

                <nav className="system-config-sidebar-nav">
                    <button
                        type="button"
                        className={configSection === "configuration" ? "active" : ""}
                        aria-current={configSection === "configuration" ? "page" : undefined}
                        onClick={() => { setConfigSection("configuration"); setMobileSidebarOpen(false); }}
                    >
                        Maintenance
                    </button>
                    <button
                        type="button"
                        className={configSection === "platform-notices" ? "active" : ""}
                        aria-current={configSection === "platform-notices" ? "page" : undefined}
                        onClick={() => { setConfigSection("platform-notices"); setMobileSidebarOpen(false); }}
                    >
                        Platform notices
                    </button>
                    <button
                        type="button"
                        className={configSection === "backup" ? "active" : ""}
                        aria-current={configSection === "backup" ? "page" : undefined}
                        onClick={() => { setConfigSection("backup"); setMobileSidebarOpen(false); }}
                    >
                        Backup &amp; Restore
                    </button>
                    <button
                        type="button"
                        className={configSection === "troubleshooting" ? "active" : ""}
                        aria-current={configSection === "troubleshooting" ? "page" : undefined}
                        onClick={() => { setConfigSection("troubleshooting"); setMobileSidebarOpen(false); }}
                    >
                        Troubleshooting
                    </button>
                    <button
                        type="button"
                        className={configSection === "security" ? "active" : ""}
                        aria-current={configSection === "security" ? "page" : undefined}
                        onClick={() => { setConfigSection("security"); setMobileSidebarOpen(false); }}
                    >
                        Security
                    </button>
                </nav>

                <div className="system-config-sidebar-footer">
                    <div className="system-config-sidebar-user">
                        <span className="system-config-sidebar-avatar">{navAdminInitial}</span>
                        <div>
                            <strong>{navAdminName}</strong>
                            <span>Administrator</span>
                        </div>
                    </div>
                    <button
                        className="system-config-sidebar-logout"
                        type="button"
                        onClick={handleLogout}
                        aria-label="Logout"
                    >
                        <FiLogOut size={16} />
                    </button>
                </div>
            </aside>

            <main className="system-config-reference-main">
                {configSection === "platform-notices" ? (
                    <>
                        <div className="platform-notice-reference-header">
                            <div className="platform-notice-reference-title">
                                <span className="platform-notice-reference-breadcrumb"><i /> System messaging</span>
                                <h1>Platform notices</h1>
                                <p>Publish platform service messages and review exactly what users will see.</p>
                            </div>
                            <div className="platform-notice-reference-actions">
                                <button type="button" className="system-config-reference-discard" onClick={handleReset} disabled={saving || loadingSettings}>Discard draft</button>
                                <button type="button" className="system-config-reference-primary" onClick={handleSave} disabled={saving || loadingSettings}>{saving ? "Saving..." : "Save draft"}</button>
                            </div>
                        </div>

                        {saveError && <div className="system-config-reference-error platform-notice-reference-error"><FiAlertTriangle /> {saveError}</div>}

                        <section className="platform-notice-reference-card">
                            <div className="platform-notice-reference-card-header">
                                <div className="platform-notice-reference-icon"><FiTool size={15} /></div>
                                <div>
                                    <h2>Compose a platform notice</h2>
                                    <p>Website · All signed-in users</p>
                                    <span className="platform-notice-reference-draft-state">{settings.platformNotice?.trim() ? "Unsaved draft" : "No draft"}</span>
                                </div>
                            </div>
                            <div className="platform-notice-reference-body">
                                <label htmlFor="platform-notice-message">Notice message</label>
                                <textarea id="platform-notice-message" value={settings.platformNotice || ""} onChange={(e) => handleChange("platformNotice", e.target.value)} placeholder="Write the notice users should see..." rows={3} />
                                <div className="platform-notice-reference-template-row">
                                    <button type="button" onClick={() => handleChange("platformNotice", `Scheduled maintenance: ${settings.scheduledStart || "scheduled start"} to ${settings.scheduledEnd || "scheduled end"} (${settings.timezone || "Asia/Manila"}). Please return after maintenance ends.`)}>Choose notice template</button>
                                    <button type="button" className="platform-notice-reference-clear" onClick={() => handleChange("platformNotice", "")}>Clear</button>
                                </div>
                                <div className="platform-notice-reference-review-row">
                                    <button type="button" className="system-config-reference-discard" onClick={handleReset} disabled={saving || loadingSettings}>Discard draft</button>
                                    <button type="button" className="system-config-reference-primary" onClick={handleSave} disabled={saving || loadingSettings}>{saving ? "Saving..." : "Save draft"}</button>
                                </div>
                            </div>
                        </section>

                        <section className="platform-notice-reference-card platform-notice-preview-card">
                            <div className="platform-notice-reference-card-header">
                                <div><h2>Website preview</h2><p>Preview exactly what the platform notice will look like.</p></div>
                            </div>
                            <div className="platform-notice-reference-preview-box">
                                <strong>Service notice</strong>
                                <p>{settings.platformNotice || "No platform notice is currently configured."}</p>
                            </div>
                            <button type="button" className="platform-notice-reference-review" onClick={() => setShowNoticeReview(true)} disabled={!settings.platformNotice?.trim()}>Review &amp; publish</button>
                        </section>

                        <section className="platform-notice-reference-card platform-notice-published-card">
                            <div className="platform-notice-reference-card-header">
                                <div><h2>Published notice</h2><p>{settings.platformNotice?.trim() ? "Current platform notice" : "No notice published"}</p></div>
                            </div>
                            <div className="platform-notice-published-status">
                                {settings.platformNotice?.trim() ? <><span className="platform-notice-published-dot" /> Active platform notice</> : "No active platform notice"}
                            </div>
                            <small>Publishing and withdrawal are recorded in the audit log.</small>
                        </section>

                        {showNoticeReview && (
                            <div className="platform-notice-review-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNoticeReview(false); }}>
                                <section className="platform-notice-review-modal" role="dialog" aria-modal="true" aria-labelledby="platform-notice-review-title">
                                    <div className="platform-notice-review-header">
                                        <div><span>System messaging</span><h2 id="platform-notice-review-title">Review &amp; publish</h2><p>Confirm the notice before saving it as the current platform notice.</p></div>
                                        <button type="button" onClick={() => setShowNoticeReview(false)} aria-label="Close review">×</button>
                                    </div>
                                    <div className="platform-notice-review-preview"><strong>Service notice</strong><p>{settings.platformNotice}</p></div>
                                    <div className="platform-notice-review-actions">
                                        <button type="button" className="system-config-reference-discard" onClick={() => setShowNoticeReview(false)}>Cancel</button>
                                        <button type="button" className="system-config-reference-primary" onClick={async () => { setShowNoticeReview(false); await handleSave(); }} disabled={saving}>{saving ? "Publishing..." : "Confirm & publish"}</button>
                                    </div>
                                </section>
                            </div>
                        )}
                    </>
                ) : configSection === "configuration" ? (
                    <>
                        <div className="system-config-reference-header">
                            <div className="system-config-reference-title-row">
                                <div>
                                    <span className="system-config-reference-breadcrumb">
                                        <i /> Configuration / Maintenance
                                    </span>
                                    <div className="system-config-reference-eyebrow">
                                        SYSTEM CONFIGURATION
                                    </div>
                                    <h1>Maintenance</h1>
                                    <p>
                                        Schedule downtime with a clear audience, time zone and impact review.
                                    </p>
                                </div>

                                <div className="system-config-reference-actions">
                                    <button
                                        type="button"
                                        className="system-config-reference-discard"
                                        onClick={handleReset}
                                        disabled={saving || loadingSettings}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="button"
                                        className="system-config-reference-primary"
                                        onClick={handleSave}
                                        disabled={saving || loadingSettings}
                                    >
                                        {saving ? "Saving..." : saved ? "Changes saved" : "Review changes"}
                                    </button>
                                </div>
                            </div>

                            {saveError && (
                                <div className="system-config-reference-error">
                                    <FiAlertTriangle /> {saveError}
                                </div>
                            )}
                        </div>

                        <section className="maintenance-reference-card">
                            <div className="maintenance-reference-card-header">
                                <div className="maintenance-reference-icon">
                                    <FiTool size={17} />
                                </div>
                                <div>
                                    <h2>Maintenance schedule</h2>
                                    <p>
                                        Scheduled downtime · {settings.timezone || "Asia/Manila"} (UTC+08:00)
                                    </p>
                                </div>
                            </div>

                            <div className="maintenance-reference-body">
                                <div className="maintenance-reference-settings">
                                    <div className="maintenance-reference-row">
                                        <div className="maintenance-reference-copy">
                                            <strong>Enable schedule</strong>
                                            <span>
                                                {settings.maintenanceMode
                                                    ? "The maintenance schedule is enabled."
                                                    : "Off: the saved schedule will not run"}
                                            </span>
                                        </div>
                                        <Toggle
                                            checked={settings.maintenanceMode}
                                            onChange={() => handleChange("maintenanceMode", !settings.maintenanceMode)}
                                            label="Toggle maintenance schedule"
                                        />
                                    </div>

                                    <div className="maintenance-reference-row">
                                        <div className="maintenance-reference-copy">
                                            <strong>Scheduled Start</strong>
                                            <span>{settings.timezone || "Asia/Manila"} · UTC+08:00</span>
                                        </div>
                                        <div className="maintenance-reference-control">
                                            <input
                                                value={settings.scheduledStart}
                                                onChange={(e) => handleChange("scheduledStart", e.target.value)}
                                                aria-label="Scheduled start"
                                            />
                                            <FiCalendar size={14} />
                                        </div>
                                    </div>

                                    <div className="maintenance-reference-row">
                                        <div className="maintenance-reference-copy">
                                            <strong>Scheduled End</strong>
                                            <span>{settings.timezone || "Asia/Manila"} · UTC+08:00</span>
                                        </div>
                                        <div className="maintenance-reference-control">
                                            <input
                                                value={settings.scheduledEnd}
                                                onChange={(e) => handleChange("scheduledEnd", e.target.value)}
                                                aria-label="Scheduled end"
                                            />
                                            <FiCalendar size={14} />
                                        </div>
                                    </div>

                                    <div className="maintenance-reference-row">
                                        <div className="maintenance-reference-copy">
                                            <strong>Admin recovery access</strong>
                                            <span>Keep admin access available during downtime</span>
                                        </div>
                                        <Toggle
                                            checked={settings.adminAccess}
                                            onChange={() => handleChange("adminAccess", !settings.adminAccess)}
                                            label="Toggle admin recovery access"
                                        />
                                    </div>

                                    <div className="maintenance-reference-row last">
                                        <div className="maintenance-reference-copy">
                                            <strong>Active-election check</strong>
                                            <span>Review affected elections before confirming</span>
                                        </div>
                                        <Toggle
                                            checked={settings.votingSafeguard}
                                            onChange={() => handleChange("votingSafeguard", !settings.votingSafeguard)}
                                            label="Toggle active-election check"
                                        />
                                    </div>
                                </div>

                                <div className="maintenance-reference-preview">
                                    <label htmlFor="maintenance-message">Maintenance Message</label>
                                    <input
                                        id="maintenance-message"
                                        value={settings.maintenanceMessage}
                                        onChange={(e) => handleChange("maintenanceMessage", e.target.value)}
                                    />

                                    <span className="maintenance-reference-preview-label">Visitor Preview</span>

                                    <div className="maintenance-reference-alert">
                                        <FiTool size={15} />
                                        <div>
                                            <strong>Under maintenance</strong>
                                            <span>{settings.maintenanceMessage}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </>
                ) : configSection === "backup" ? (
                    <>
                        <div className="backup-reference-header">
                            <div className="backup-reference-title">
                                <span className="backup-reference-breadcrumb"><i /> Recovery controls</span>
                                <h1>Backup &amp; Restore</h1>
                                <p>Protect platform records and recover from a verified, encrypted point.</p>
                            </div>
                            <div className="backup-reference-actions">
                                <button type="button" className="system-config-reference-primary" onClick={handleSave} disabled={saving || loadingSettings}>{saving ? "Saving..." : "Save policy"}</button>
                            </div>
                        </div>
                        {saveError && <div className="system-config-reference-error backup-reference-error"><FiAlertTriangle /> {saveError}</div>}

                        <section className="backup-reference-card">
                            <div className="backup-reference-card-header"><div className="backup-reference-icon"><FiDatabase size={16} /></div><div><h2>Backup policy</h2><p>Saved · {settings.backupFrequency || "Daily"} at 2:00 AM · {settings.timezone || "Asia/Manila"}</p></div></div>
                            <div className="backup-reference-body">
                                <div className="backup-reference-policy">
                                    <div className="backup-reference-row"><div className="backup-reference-copy"><strong>Automatic backups</strong><span>{settings.backupFrequency || "Daily"} at 2:00 AM · {settings.timezone || "Asia/Manila"}</span></div><Toggle checked={Boolean(settings.autoBackup)} onChange={() => handleChange("autoBackup", !settings.autoBackup)} label="Toggle automatic backups" /></div>
                                    <div className="backup-reference-row"><div className="backup-reference-copy"><strong>Encryption</strong><span>Required for every recovery point</span></div><Toggle checked={settings.backupEncryption !== false} onChange={() => handleChange("backupEncryption", settings.backupEncryption === false)} label="Toggle backup encryption" /></div>
                                    <div className="backup-reference-row last"><div className="backup-reference-copy"><strong>Retention period</strong><span>How long recovery points are kept</span></div><SelectField value={settings.backupRetention || "30 days"} onChange={(e) => handleChange("backupRetention", e.target.value)} options={["7 days","14 days","30 days","60 days","90 days"]} /></div>
                                </div>
                            </div>
                            <div className="backup-reference-policy-actions"><button type="button" className="system-config-reference-discard" onClick={handleReset} disabled={saving || loadingSettings}>Discard draft</button><button type="button" className="system-config-reference-primary" onClick={handleSave} disabled={saving || loadingSettings}>{saving ? "Saving..." : "Review policy"}</button></div>
                        </section>

                        <section className="backup-reference-card backup-recovery-points-card">
                            <div className="backup-reference-card-header"><div><h2>Verified recovery points</h2><p>{settings.lastBackupAt || "No verified recovery point recorded"}</p></div></div>
                            {settings.lastBackupAt ? (
                                <div className="backup-reference-recovery-point"><div className="backup-reference-recovery-icon"><FiDatabase size={14} /></div><div className="backup-reference-recovery-copy"><strong>{settings.lastBackupAt}</strong><span>{settings.lastBackupStatus || "Verified · Encryption enabled · Integrity status available from the backup service."}</span></div><span className="backup-reference-status-good">Verified</span><button type="button" className="backup-reference-review-button" onClick={() => setRestoreReviewOpen(true)}>Review restore</button></div>
                            ) : (
                                <div className="backup-reference-empty"><FiDatabase size={18} /><strong>No restore point is recorded yet</strong><span>The current backend stores backup policy metadata, but it does not expose a database-backup job or recovery-point table. No fake recovery point is created.</span></div>
                            )}
                            <p className="backup-reference-review-note">Restore requires a scheduled maintenance window, impact acknowledgement and a verified safety backup.</p>
                        </section>

                        {restoreReviewOpen && (
                            <div className="backup-reference-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setRestoreReviewOpen(false); }}>
                                <section className="backup-reference-modal" role="dialog" aria-modal="true" aria-labelledby="restore-review-title">
                                    <div className="backup-reference-modal-header"><div><span>RESTORE REVIEW</span><h2 id="restore-review-title">Review restore point</h2></div><button type="button" onClick={() => setRestoreReviewOpen(false)} aria-label="Close restore review">×</button></div>
                                    <div className="backup-reference-modal-body"><div className="backup-reference-modal-status"><FiShield size={17} /><div><strong>Review only</strong><span>No restore action has been performed.</span></div></div><div className="backup-reference-modal-detail"><span>Recovery point</span><strong>{settings.lastBackupAt || "No verified recovery point"}</strong></div><div className="backup-reference-modal-detail"><span>Retention</span><strong>{settings.backupRetention || "30 days"}</strong></div><div className="backup-reference-modal-warning"><FiAlertTriangle size={15} /><span>The current backend does not expose a destructive restore operation. This review intentionally performs no restore.</span></div></div>
                                    <div className="backup-reference-modal-actions"><button type="button" className="system-config-reference-discard" onClick={() => setRestoreReviewOpen(false)}>Close review</button></div>
                                </section>
                            </div>
                        )}
                    </>
                ) : configSection === "troubleshooting" ? (
                    <>
                        <div className="troubleshooting-reference-header">
                            <div className="troubleshooting-reference-title">
                                <span className="troubleshooting-reference-breadcrumb"><i /> System diagnostics</span>
                                <h1>Troubleshooting</h1>
                                <p>Investigate availability, inspect incidents and review technical exports.</p>
                            </div>
                        </div>
                        {diagnosticNotice && <div className="troubleshooting-reference-notice"><FiCheck size={13} /> {diagnosticNotice}</div>}

                        <section className="troubleshooting-reference-card diagnostics-card">
                            <div className="troubleshooting-reference-card-header"><div><h2>System diagnostics</h2><p>Read-only checks · Last run {new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p></div><button type="button" className="troubleshooting-reference-refresh" onClick={loadSecurityAndDiagnostics} disabled={diagnosticsRunning}><FiRefreshCw size={14} /></button></div>
                            <div className="troubleshooting-reference-status-grid">
                                <div><span>Database</span><strong className={diagnosticSnapshot.database === "Operational" ? "status-operational" : "status-offline"}>{diagnosticSnapshot.database}</strong></div>
                                <div><span>Email / OTP</span><strong className="status-delayed">Configuration monitored</strong></div>
                                <div><span>Kiosk connection</span><strong className="status-offline">Check Monitoring &amp; Logs</strong></div>
                            </div>
                            <div className="troubleshooting-reference-incidents"><h3>Recent incidents</h3>
                                {(securityEvents.length ? securityEvents : []).map((log) => (
                                    <div className="troubleshooting-reference-incident" key={log.id}>
                                        <div><strong>{log.description || log.action || "System event"}</strong><span>{log.actor_role || "Staff"} · {log.created_at ? new Date(log.created_at).toLocaleString() : "Recent"}</span></div>
                                        <em className={/fail|reject|lock|suspicious|error/i.test(`${log.action} ${log.description}`) ? "incident-investigating" : "incident-resolved"}>{/fail|reject|lock|suspicious|error/i.test(`${log.action} ${log.description}`) ? "Needs review" : "Recorded"}</em>
                                    </div>
                                ))}
                                {!securityEvents.length && <div className="troubleshooting-reference-empty"><FiCheck size={16} /><span>{securityEventsLoading ? "Loading recent events..." : "No matching technical incidents were returned by the current audit log."}</span></div>}
                            </div>
                            <div className="troubleshooting-reference-card-actions"><button type="button" className="troubleshooting-reference-primary" disabled={diagnosticsRunning} onClick={async () => { setDiagnosticsRunning(true); setDiagnosticNotice(""); await loadSecurityAndDiagnostics(); setDiagnosticNotice("Diagnostic checks refreshed from the existing Admin API and audit-log services. No election or ballot data was changed."); setDiagnosticsRunning(false); }}> {diagnosticsRunning ? "Running..." : "Run diagnostics"}</button><button type="button" className="troubleshooting-reference-secondary" onClick={() => goTo("/admin/audit-logs")}>View incident history</button></div>
                        </section>

                        <section className="troubleshooting-reference-card otp-card">
                            <div className="troubleshooting-reference-card-header"><div><h2>Technical review</h2><p>Safe diagnostic workspace</p></div></div>
                            <div className="troubleshooting-reference-impact"><h3>What this page can inspect</h3><p>API availability, configuration health and recent audit activity. Diagnostic actions do not modify votes, eligibility or ballot selections.</p></div>
                            <div className="troubleshooting-reference-investigation"><h3>Recommended investigation</h3><ol><li>Check delivery queue and provider status for OTP delays.</li><li>Review recent failures in Monitoring &amp; Logs.</li><li>Confirm kiosk connectivity before election operations continue.</li></ol></div>
                            <div className="troubleshooting-reference-side-actions"><button type="button" onClick={() => goTo("/admin/audit-logs")}>Open technical logs</button><button type="button" onClick={() => setDiagnosticNotice("Diagnostic export preparation remains view-only; no file was generated.")}>Review diagnostic export</button></div>
                            <p className="troubleshooting-reference-footnote">Diagnostic exports exclude passwords, OTP values and ballot choices.</p>
                        </section>
                    </>
                ) : (
                    <>
                        <div className="security-reference-header">
                            <div className="security-reference-breadcrumb"><span /> Configuration / Security</div>
                            <h1>Security</h1>
                            <p>Review sign-in safeguards, session controls and security events.</p>
                        </div>
                        {securityNotice && <div className="security-reference-notice" role="status"><FiCheck size={14} /><span>{securityNotice}</span></div>}

                        <section className="security-reference-card security-policy-card">
                            <div className="security-reference-card-header"><div><h2>Sign-in &amp; session policy</h2><p>Saved policy · Review before applying changes</p></div></div>
                            <div className="security-policy-list">
                                <div className="security-policy-row"><div><strong>Staff verification</strong><span>Require a second verification step for Admin and Electoral Board.</span></div><select value={securityDraft.staffVerification ? "Required" : "Off"} onChange={(e) => updateSecurityDraft("staffVerification", e.target.value === "Required")}><option>Required</option><option>Off</option></select></div>
                                <div className="security-policy-row"><div><strong>Idle session timeout</strong><span>Sign users out after inactivity.</span></div><select value={securityDraft.idleSessionTimeout} onChange={(e) => updateSecurityDraft("idleSessionTimeout", e.target.value)}>{["10","15","20","30","60","120"].map((value) => <option key={value} value={value}>{value} minutes</option>)}</select></div>
                                <div className="security-policy-row"><div><strong>Failed sign-in threshold</strong><span>Count repeated unsuccessful sign-in attempts.</span></div><select value={securityDraft.failedSignInThreshold} onChange={(e) => updateSecurityDraft("failedSignInThreshold", e.target.value)}>{[3,5,7,10].map((value) => <option key={value} value={String(value)}>{value} attempts</option>)}</select></div>
                                <div className="security-policy-row last"><div><strong>Temporary lockout</strong><span>Show a countdown before the next sign-in attempt.</span></div><select value={securityDraft.temporaryLockout} onChange={(e) => updateSecurityDraft("temporaryLockout", e.target.value)}>{[15,30,60,120].map((value) => <option key={value} value={String(value)}>{value} seconds</option>)}</select></div>
                            </div>
                            <div className="security-policy-actions"><button type="button" className="security-secondary-button" onClick={discardSecurityDraft} disabled={securitySaving}>Discard draft</button><button type="button" className="security-primary-button" onClick={() => setSecurityReviewOpen(true)} disabled={securitySaving}>Review policy changes</button></div>
                            <p className="security-policy-footnote">Confirmation and an audit entry are required for policy changes.</p>
                        </section>

                        <section className="security-reference-card security-events-card">
                            <div className="security-reference-card-header"><div><h2>Security events</h2><p>Recent events from the Admin monitoring audit stream.</p></div><button type="button" className="security-log-button" onClick={() => goTo("/admin/audit-logs")}>Open security logs</button></div>
                            {securityEventsLoading ? <div className="security-event-empty">Loading security events...</div> : securityEvents.length ? securityEvents.map((log) => (
                                <div className="security-event" key={log.id}><div><strong>{log.description || log.action || "Security event"}</strong><span>{log.actor_role === "electoral_board" ? "Electoral Board" : "Administrator"} · {log.action || "Recorded"}</span><small>{log.created_at ? new Date(log.created_at).toLocaleString() : "Recent"}</small></div><em className={/fail|reject|lock|suspicious|error/i.test(`${log.action} ${log.description}`) ? "security-event-warning" : "security-event-success"}>{/fail|reject|lock|suspicious|error/i.test(`${log.action} ${log.description}`) ? "Review" : "Recorded"}</em></div>
                            )) : <div className="security-event-empty">No security-related audit events were returned.</div>}
                        </section>

                        <section className="security-reference-card security-sessions-card">
                            <div className="security-reference-card-header"><div><h2>Staff sessions</h2><p>Current administrator identity and recent staff access state.</p></div></div>
                            <div className="security-session-row"><div><strong>{navAdminName}</strong><span>Administrator · Current browser session</span></div><em className="security-session-active">Active</em><button type="button" onClick={() => handleLogout()}>End session</button></div>
                            <div className="security-session-row"><div><strong>Electoral Board access</strong><span>Session controls are governed by the same authentication policy.</span></div><em className="security-session-protected">Protected</em><button type="button" onClick={() => goTo("/admin/users")}>Manage access</button></div>
                            <div className="security-account-recovery"><strong>Account recovery</strong><p>Review identity before resetting access. Manage accounts in Users &amp; Access.</p><button type="button" onClick={() => goTo("/admin/users")}>View accounts and active sessions →</button></div>
                        </section>

                        {securityReviewOpen && (
                            <div className="security-review-overlay" role="dialog" aria-modal="true" aria-labelledby="security-review-title"><div className="security-review-modal"><div className="security-review-modal-head"><div><span className="security-modal-badge"><FiShield size={13} /> Security policy</span><h2 id="security-review-title">Review policy changes</h2><p>Confirm these changes before they are written to Admin System Settings.</p></div><button type="button" onClick={() => setSecurityReviewOpen(false)} aria-label="Close review"><FiX size={18} /></button></div><div className="security-review-changes"><div><span>Staff verification</span><strong>{securityDraft.staffVerification ? "Required" : "Off"}</strong></div><div><span>Idle session timeout</span><strong>{securityDraft.idleSessionTimeout} minutes</strong></div><div><span>Failed sign-in threshold</span><strong>{securityDraft.failedSignInThreshold} attempts</strong></div><div><span>Temporary lockout</span><strong>{securityDraft.temporaryLockout} seconds</strong></div></div><div className="security-review-modal-actions"><button type="button" className="security-secondary-button" onClick={() => setSecurityReviewOpen(false)} disabled={securitySaving}>Cancel</button><button type="button" className="security-primary-button" onClick={saveSecurityChanges} disabled={securitySaving}>{securitySaving ? "Saving..." : "Confirm & save"}</button></div></div></div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default SystemSettings;
