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
} from "react-icons/fi";
import "./SystemSettings.css";
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
    lockoutDuration: "15 minutes",
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
    emailNotifications: true,
    electionNotifications: true,
    securityNotifications: true,
    allowRegistration: true,
    allowVoting: true,
    autoBackup: true,
    backupFrequency: "Daily",
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

    const navAdminName = admin?.full_name || "Administrator";
    const navAdminInitial = navAdminName.charAt(0).toUpperCase() || "A";

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
        const token = localStorage.getItem("votaraStaffToken");
        const storedUser = localStorage.getItem("votaraStaffUser");
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
            localStorage.removeItem("votaraStaffToken");
            localStorage.removeItem("votaraStaffUser");
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

        localStorage.removeItem("votaraStaffToken");
        localStorage.removeItem("votaraStaffUser");

        setIsPageTransitioning(true);

        window.setTimeout(() => {
            navigate("/admin-login", { replace: true });
        }, 700);
    };

    if (!admin) return null;

    return (
        <div className="system-config-page">
            {isPageTransitioning && <PageLoader />}
            <header className="system-config-navbar">
                <button
                    className="system-config-brand"
                    type="button"
                    onClick={() => goTo("/admin-dashboard")}
                    aria-label="Go to VOTARA dashboard"
                >
                    <span className="system-config-brand-mark">
                        <img src="/src/images/Votara.png" alt="Votara Logo" />
                    </span>
                    <span>Votara</span>
                </button>

                <nav className="system-config-nav" aria-label="Admin navigation">
                    <button type="button" onClick={() => goTo("/admin-dashboard")}>
                        Overview
                    </button>
                    <button type="button" onClick={() => goTo("/admin/students")}>
                        User
                    </button>
                    <button type="button" onClick={() => goTo("/admin/election")}>
                        Elections
                    </button>
                    <button type="button" onClick={() => goTo("/admin/candidates")}>
                        Candidates
                    </button>
                    <button type="button" onClick={() => goTo("/admin/audit-logs")}>
                        Logs
                    </button>
                    <button
                        type="button"
                        className="active"
                        aria-current="page"
                        onClick={() => goTo("/admin/settings")}
                    >
                        Config &amp; Support
                    </button>
                </nav>

                <div className="system-config-nav-actions">
                    <span className="system-config-environment">
                        <i />
                        Production
                    </span>

                    <button
                        className="system-config-notification"
                        type="button"
                        onClick={() => goTo("/admin/audit-logs")}
                        aria-label="Notifications"
                    >
                        <FiBell size={17} />
                        <span className="system-config-notification-dot" />
                    </button>

                    <div className="system-config-user">
                        <span className="system-config-avatar">{navAdminInitial}</span>
                        <span className="system-config-user-name">{navAdminName}</span>
                    </div>

                    <button
                        className="system-config-logout"
                        type="button"
                        onClick={handleLogout}
                        aria-label="Logout"
                    >
                        <FiLogOut size={17} />
                    </button>
                </div>
            </header>

            <main className="system-config-main">
                <div className="system-config-hero">
                    <div>
                        <span className="system-config-badge"><i />Troubleshooting and Maintenance</span>
                        <h1>System Configuration</h1>
                        <p>Control how the election website behaves. Every change is saved to the audit trail.</p>
                    </div>
                    <div className="system-config-actions">
                        <button className="system-config-btn secondary" onClick={handleReset} disabled={saving || loadingSettings}><FiRefreshCw />{saving ? "Working..." : "Discard"}</button>
                        <button
                            className={`system-config-btn primary ${saved ? "saved" : ""}`}
                            onClick={handleSave}
                            disabled={saving || loadingSettings}
                        >
                            {saving
                                ? <FiRefreshCw />
                                : saved
                                    ? <FiCheck />
                                    : <FiSave />}
                            {saving
                                ? "Saving..."
                                : saved
                                    ? "Saved"
                                    : "Save Changes"}
                        </button>
                    </div>

                    <div className="system-config-save-status">
                        {loadingSettings && (
                            <span className="system-config-status loading">
                                <FiRefreshCw /> Loading saved settings...
                            </span>
                        )}

                        {!loadingSettings && saveError && (
                            <span className="system-config-status error">
                                <FiAlertTriangle /> {saveError}
                            </span>
                        )}

                        {!loadingSettings && !saveError && (
                            <span className="system-config-status connected">
                                <FiDatabase /> Settings connected to VOTARA server
                            </span>
                        )}
                    </div>
                </div>

                <div className="system-config-grid">
                    <ConfigCard icon={<FiSliders />} title="Parameters" description="General election and system settings">
                        <ConfigRow title="Election Name" description="Title shown on the landing page">
                            <input value={settings.systemName} onChange={(e) => handleChange("systemName", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Academic Year" description="Current school year">
                            <input value={settings.academicYear} onChange={(e) => handleChange("academicYear", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Registration Period" description="Start and end of registration">
                            <input value={settings.registrationPeriod} onChange={(e) => handleChange("registrationPeriod", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Voting Period" description="Start and end of voting">
                            <input value={settings.votingPeriod} onChange={(e) => handleChange("votingPeriod", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Remote Voting" description="Students vote from their own device">
                            <Toggle checked={settings.remoteVoting} onChange={() => handleChange("remoteVoting", !settings.remoteVoting)} label="Toggle remote voting" />
                        </ConfigRow>
                        <ConfigRow title="Campus Kiosk Voting" description="Students vote at the registration kiosk">
                            <Toggle checked={settings.campusKiosk} onChange={() => handleChange("campusKiosk", !settings.campusKiosk)} label="Toggle campus kiosk voting" />
                        </ConfigRow>
                        <ConfigRow title="Late Enrollee Window" description="Allow late registration" last>
                            <Toggle checked={settings.lateEnrolleeWindow} onChange={() => handleChange("lateEnrolleeWindow", !settings.lateEnrolleeWindow)} label="Toggle late enrollee window" />
                        </ConfigRow>
                    </ConfigCard>

                    <ConfigCard icon={<FiMail />} title="Email / SMS OTP" description="One-time passcodes used for verification">
                        <ConfigRow title="OTP Method" description="How codes are sent">
                            <SelectField value={settings.otpMethod} onChange={(e) => handleChange("otpMethod", e.target.value)} options={["Email + SMS", "Email only", "SMS only"]} />
                        </ConfigRow>
                        <ConfigRow title="OTP Length" description="Digits per code">
                            <SelectField value={settings.otpLength} onChange={(e) => handleChange("otpLength", e.target.value)} options={["4 digits", "6 digits", "8 digits"]} />
                        </ConfigRow>
                        <ConfigRow title="OTP Expiry" description="How long a code stays valid">
                            <SelectField value={settings.otpExpiry} onChange={(e) => handleChange("otpExpiry", e.target.value)} options={["2 minutes", "5 minutes", "10 minutes"]} />
                        </ConfigRow>
                        <ConfigRow title="Max OTP Attempts" description="Wrong entries before lockout">
                            <input value={settings.maxOtpAttempts} onChange={(e) => handleChange("maxOtpAttempts", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Resend Cooldown" description="Wait before requesting a new code">
                            <input value={settings.resendCooldown} onChange={(e) => handleChange("resendCooldown", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Sender Email" description="Address used for OTP emails" last>
                            <input value={settings.senderEmail} onChange={(e) => handleChange("senderEmail", e.target.value)} />
                        </ConfigRow>
                    </ConfigCard>

                    <ConfigCard icon={<FiClock />} title="Rate Limiting" description="Protects the site from spam and brute-force attacks">
                        <ConfigRow title="Login Attempts" description="Failed logins before a lockout">
                            <input value={settings.loginAttempts} onChange={(e) => handleChange("loginAttempts", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Lockout Duration" description="How long an account stays locked">
                            <input value={settings.lockoutDuration} onChange={(e) => handleChange("lockoutDuration", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="OTP Request Limit" description="Max OTP requests per hour">
                            <input value={settings.otpRequestLimit} onChange={(e) => handleChange("otpRequestLimit", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="Registration Submissions" description="Max form submissions per user">
                            <input value={settings.registrationSubmissions} onChange={(e) => handleChange("registrationSubmissions", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="IP Rate Limit" description="Max requests per IP address">
                            <input value={settings.ipRateLimit} onChange={(e) => handleChange("ipRateLimit", e.target.value)} />
                        </ConfigRow>
                        <ConfigRow title="IP Blocklist / Allowlist" description="Manually block or allow addresses" last>
                            <button className="system-config-manage" type="button">Manage</button>
                        </ConfigRow>
                    </ConfigCard>

                    <ConfigCard icon={<FiLock />} title="Security Settings" description="Rules for passwords, sessions, and access">
                        <ConfigRow title="Password Rules" description="Minimum length and characters">
                            <SelectField value={settings.passwordRules} onChange={(e) => handleChange("passwordRules", e.target.value)} options={["Min 8 chars + number", "Min 10 chars + number", "Min 12 chars + symbol"]} />
                        </ConfigRow>
                        <ConfigRow title="Force Password Change" description="Require a new password on first login">
                            <Toggle checked={settings.forcePasswordChange} onChange={() => handleChange("forcePasswordChange", !settings.forcePasswordChange)} label="Toggle force password change" />
                        </ConfigRow>
                        <ConfigRow title="Session Timeout" description="Auto logout after inactivity">
                            <SelectField value={settings.sessionTimeout} onChange={(e) => handleChange("sessionTimeout", e.target.value)} options={["15", "30", "60", "120"]} />
                        </ConfigRow>
                        <ConfigRow title="Single Session" description="One device per account">
                            <Toggle checked={settings.singleSession} onChange={() => handleChange("singleSession", !settings.singleSession)} label="Toggle single session" />
                        </ConfigRow>
                        <ConfigRow title="Two-Step Verification" description="OTP for Admin and EB logins">
                            <Toggle checked={settings.twoStepVerification} onChange={() => handleChange("twoStepVerification", !settings.twoStepVerification)} label="Toggle two-step verification" />
                        </ConfigRow>
                        <ConfigRow title="Kiosk Restrictions" description="Approved devices and IPs only">
                            <Toggle checked={settings.kioskRestrictions} onChange={() => handleChange("kioskRestrictions", !settings.kioskRestrictions)} label="Toggle kiosk restrictions" />
                        </ConfigRow>
                        <ConfigRow title="Ballot Encryption" description="Encrypt stored votes">
                            <span className="system-config-always">Always on</span>
                        </ConfigRow>
                        <ConfigRow title="Audit Logging" description="Record configuration changes" last>
                            <span className="system-config-always">Always on</span>
                        </ConfigRow>
                    </ConfigCard>
                </div>

                <ConfigCard icon={<FiTool />} title="Maintenance Mode" description="Temporarily close the website to students and other non-admin users" className="maintenance-card">
                    <div className="maintenance-grid">
                        <div>
                            <ConfigRow title="Maintenance Mode" description="Turn the site ON or OFF for students">
                                <Toggle checked={settings.maintenanceMode} onChange={() => handleChange("maintenanceMode", !settings.maintenanceMode)} label="Toggle maintenance mode" />
                            </ConfigRow>
                            <ConfigRow title="Scheduled Start" description="When maintenance begins">
                                <div className="system-config-date-input"><input value={settings.scheduledStart} onChange={(e) => handleChange("scheduledStart", e.target.value)} /><FiCalendar /></div>
                            </ConfigRow>
                            <ConfigRow title="Scheduled End" description="When maintenance ends">
                                <div className="system-config-date-input"><input value={settings.scheduledEnd} onChange={(e) => handleChange("scheduledEnd", e.target.value)} /><FiCalendar /></div>
                            </ConfigRow>
                            <ConfigRow title="Admin Access" description="Admins can still log in during maintenance">
                                <Toggle checked={settings.adminAccess} onChange={() => handleChange("adminAccess", !settings.adminAccess)} label="Toggle admin access" />
                            </ConfigRow>
                            <ConfigRow title="Voting Safeguard" description="Warn before enabling while voting is open" last>
                                <Toggle checked={settings.votingSafeguard} onChange={() => handleChange("votingSafeguard", !settings.votingSafeguard)} label="Toggle voting safeguard" />
                            </ConfigRow>
                        </div>
                        <div className="maintenance-preview">
                            <label>Maintenance Message</label>
                            <input value={settings.maintenanceMessage} onChange={(e) => handleChange("maintenanceMessage", e.target.value)} />
                            <span className="maintenance-preview-label">Visitor Preview</span>
                            <div className="maintenance-alert">
                                <FiTool />
                                <div><strong>Under maintenance</strong><span>{settings.maintenanceMessage}</span></div>
                            </div>
                        </div>
                    </div>
                </ConfigCard>

                <section className="system-config-extra">
                    <div className="system-config-extra-head"><FiSettings /><div><h2>System Preferences &amp; Backup</h2><p>Existing VOTARA preferences remain available from the same configuration page.</p></div></div>
                    <div className="system-config-extra-grid">
                        <div className="system-config-extra-item"><span><FiGlobe />Language</span><SelectField value={settings.language} onChange={(e) => handleChange("language", e.target.value)} options={["English", "Filipino"]} /></div>
                        <div className="system-config-extra-item"><span><FiGlobe />Time Zone</span><SelectField value={settings.timezone} onChange={(e) => handleChange("timezone", e.target.value)} options={["Asia/Manila", "Asia/Singapore", "Asia/Tokyo", "UTC"]} /></div>
                        <div className="system-config-extra-item"><span><FiCalendar />Date Format</span><SelectField value={settings.dateFormat} onChange={(e) => handleChange("dateFormat", e.target.value)} options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} /></div>
                        <div className="system-config-extra-item"><span><FiDatabase />Automatic Backup</span><Toggle checked={settings.autoBackup} onChange={() => handleChange("autoBackup", !settings.autoBackup)} label="Toggle automatic backup" /></div>
                        <div className="system-config-extra-item"><span><FiClock />Backup Frequency</span><SelectField value={settings.backupFrequency} onChange={(e) => handleChange("backupFrequency", e.target.value)} options={["Hourly", "Daily", "Weekly"]} /></div>
                        <div className="system-config-extra-item"><span><FiBell />Email Notifications</span><Toggle checked={settings.emailNotifications} onChange={() => handleChange("emailNotifications", !settings.emailNotifications)} label="Toggle email notifications" /></div>
                        <div className="system-config-extra-item"><span><FiCalendar />Election Notifications</span><Toggle checked={settings.electionNotifications} onChange={() => handleChange("electionNotifications", !settings.electionNotifications)} label="Toggle election notifications" /></div>
                        <div className="system-config-extra-item"><span><FiShield />Security Notifications</span><Toggle checked={settings.securityNotifications} onChange={() => handleChange("securityNotifications", !settings.securityNotifications)} label="Toggle security notifications" /></div>
                        <div className="system-config-extra-item"><span><FiUsers />Student Registration</span><Toggle checked={settings.allowRegistration} onChange={() => handleChange("allowRegistration", !settings.allowRegistration)} label="Toggle student registration" /></div>
                        <div className="system-config-extra-item"><span><FiCheck />Voting System</span><Toggle checked={settings.allowVoting} onChange={() => handleChange("allowVoting", !settings.allowVoting)} label="Toggle voting system" /></div>
                        <div className="system-config-extra-item system-config-color-item"><span><FiSliders />Primary Color</span><input type="color" value={settings.primaryColor} onChange={(e) => handleChange("primaryColor", e.target.value)} aria-label="Primary color" /></div>
                        <div className="system-config-extra-item"><span><FiSun />Display Mode</span><div className="system-config-theme-switch"><button type="button" className={settings.theme === "light" ? "active" : ""} onClick={() => { handleChange("theme", "light"); applyTheme("light"); }}><FiSun />Light</button><button type="button" className={settings.theme === "dark" ? "active" : ""} onClick={() => { handleChange("theme", "dark"); applyTheme("dark"); }}><FiMoon />Dark</button></div></div>
                    </div>
                </section>

                <div className="system-config-audit-note"><FiShield /><span>Every change is saved to the Audit Trail (who changed it, what changed, and when). Voting period and voting methods lock once voting starts.</span></div>
            </main>
        </div>
    );
};

export default SystemSettings;
