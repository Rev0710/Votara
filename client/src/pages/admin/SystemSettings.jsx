import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiBell,
    FiCheck,
    FiCalendar,
    FiDatabase,
    FiGlobe,
    FiLock,
    FiMonitor,
    FiDroplet,
    FiRefreshCw,
    FiSave,
    FiShield,
    FiSliders,
    FiUser,
    FiSun,
    FiMoon,
} from "react-icons/fi";
import "./SystemSettings.css";

const applyTheme = (theme) => {
    const root = document.documentElement;

    if (theme === "dark") {
        root.setAttribute("data-theme", "dark");
    } else {
        root.setAttribute("data-theme", "light");
    }
};

const SystemSettings = () => {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);

    const [activeSection, setActiveSection] = useState("appearance");

    const defaultSettings = {
    primaryColor: "#32129f",
    theme: "light",

    systemName: "VOTARA Election System",
    language: "English",
    timezone: "Asia/Manila",
    dateFormat: "MM/DD/YYYY",

    emailNotifications: true,
    electionNotifications: true,
    securityNotifications: true,

    maintenanceMode: false,
    allowRegistration: true,
    allowVoting: true,

    autoBackup: true,
    sessionTimeout: "30",
    backupFrequency: "Daily",
};

    const [settings, setSettings] = useState(defaultSettings);
    const [saved, setSaved] = useState(false);

    const colorPresets = [
        {
            name: "VOTARA Purple",
            color: "#32129f",
        },
        {
            name: "Royal Blue",
            color: "#2563eb",
        },
        {
            name: "Emerald",
            color: "#059669",
        },
        {
            name: "Rose",
            color: "#e11d48",
        },
        {
            name: "Orange",
            color: "#ea580c",
        },
        {
            name: "Indigo",
            color: "#4f46e5",
        },
    ];

    useEffect(() => {
    try {
        const savedSettings =
            localStorage.getItem("votaraSystemSettings");

        if (savedSettings) {
            const parsedSettings =
                JSON.parse(savedSettings);

            const mergedSettings = {
                ...defaultSettings,
                ...parsedSettings,
            };

            setSettings(mergedSettings);

            applyTheme(
                mergedSettings.theme || "light"
            );
        } else {
            applyTheme("light");
        }
    } catch (error) {
        console.error(
            "Unable to load system settings:",
            error
        );

        applyTheme("light");
    }
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
                navigate("/electoral-board/dashboard", {
                    replace: true,
                });
                return;
            }

            setAdmin(user);

            const storedSettings =
                localStorage.getItem("votaraSystemSettings");

            if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings);

                setSettings({
                    ...defaultSettings,
                    ...parsedSettings,
                });
            }
        } catch (error) {
            console.error("Invalid admin session:", error);

            localStorage.removeItem("votaraStaffToken");
            localStorage.removeItem("votaraStaffUser");

            navigate("/admin-login", { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        document.documentElement.style.setProperty(
            "--votara-primary",
            settings.primaryColor
        );

        document.documentElement.style.setProperty(
            "--votara-primary-light",
            `${settings.primaryColor}18`
        );

        document.documentElement.style.setProperty(
            "--votara-primary-medium",
            `${settings.primaryColor}30`
        );
    }, [settings.primaryColor]);

    const handleChange = (key, value) => {
        setSettings((current) => ({
            ...current,
            [key]: value,
        }));

        setSaved(false);
    };

    const handleSave = () => {
    localStorage.setItem(
        "votaraSystemSettings",
        JSON.stringify(settings)
    );
applyTheme(settings.theme);

    window.dispatchEvent(
        new Event("votaraSettingsChanged")
    );

    alert("System settings saved successfully.");

    // Apply theme immediately
    document.documentElement.style.setProperty(
        "--votara-primary",
        settings.primaryColor
    );

    document.documentElement.style.setProperty(
        "--votara-primary-light",
        hexToRgba(settings.primaryColor, 0.10)
    );

    document.documentElement.style.setProperty(
        "--votara-primary-medium",
        hexToRgba(settings.primaryColor, 0.18)
    );

    document.documentElement.style.setProperty(
        "--votara-primary-border",
        hexToRgba(settings.primaryColor, 0.25)
    );

    // Tell other VOTARA pages that settings changed
    window.dispatchEvent(
        new Event("votaraSettingsChanged")
    );

    alert("System settings saved successfully.");
};

const handleReset = () => {
    const defaultSettings = {
        primaryColor: "#32129f",
        systemName: "VOTARA Election System",
        language: "English",
        timezone: "Asia/Manila",
        dateFormat: "MM/DD/YYYY",
        emailNotifications: true,
        electionNotifications: true,
        securityNotifications: true,
        maintenanceMode: false,
        allowRegistration: true,
        allowVoting: true,
        autoBackup: true,
        sessionTimeout: "30",
        backupFrequency: "Daily",
    };

    setSettings(defaultSettings);

    localStorage.setItem(
        "votaraSystemSettings",
        JSON.stringify(defaultSettings)
    );

    window.dispatchEvent(
        new Event("votaraSettingsChanged")
    );
};
    const renderToggle = (key) => {
        return (
            <button
                type="button"
                className={`settings-toggle ${
                    settings[key] ? "active" : ""
                }`}
                onClick={() =>
                    handleChange(key, !settings[key])
                }
                aria-label={`Toggle ${key}`}
            >
                <span></span>
            </button>
        );
    };

    if (!admin) {
        return null;
    }

    return (
        <div className="system-settings-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="system-settings-header">

                <div className="system-settings-header-left">

                    <button
                        className="settings-back-button"
                        onClick={() =>
                            navigate("/admin-dashboard")
                        }
                    >
                        <FiArrowLeft />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="settings-title-wrapper">

                        <div className="settings-title-icon">
                            <FiSliders />
                        </div>

                        <div>
                            <h1>System Settings</h1>

                            <p>
                                Configure and manage VOTARA system
                                preferences.
                            </p>
                        </div>

                    </div>

                </div>

                <div className="settings-header-actions">

                    <button
                        className="settings-reset-button"
                        onClick={handleReset}
                    >
                        <FiRefreshCw />
                        Reset
                    </button>

                    <button
                        className={`settings-save-button ${
                            saved ? "saved" : ""
                        }`}
                        onClick={handleSave}
                    >
                        {saved ? <FiCheck /> : <FiSave />}

                        {saved
                            ? "Settings Saved"
                            : "Save Changes"}
                    </button>

                </div>

            </header>


            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="system-settings-content">

                {/* =================================================
                    SETTINGS NAVIGATION
                ================================================= */}

                <aside className="settings-sidebar">

                    <div className="settings-sidebar-heading">
                        Settings
                    </div>

                    <button
                        className={
                            activeSection === "appearance"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveSection("appearance")
                        }
                    >
                        <FiDroplet />
                        <span>Appearance</span>
                    </button>

                    <button
                        className={
                            activeSection === "general"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveSection("general")
                        }
                    >
                        <FiGlobe />
                        <span>General</span>
                    </button>

                    <button
                        className={
                            activeSection === "notifications"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveSection("notifications")
                        }
                    >
                        <FiBell />
                        <span>Notifications</span>
                    </button>

                    <button
                        className={
                            activeSection === "election"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveSection("election")
                        }
                    >
                        <FiMonitor />
                        <span>Election Controls</span>
                    </button>

                    <button
                        className={
                            activeSection === "security"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveSection("security")
                        }
                    >
                        <FiShield />
                        <span>Security</span>
                    </button>

                    <button
                        className={
                            activeSection === "backup"
                                ? "active"
                                : ""
                        }
                        onClick={() =>
                            setActiveSection("backup")
                        }
                    >
                        <FiDatabase />
                        <span>Backup & Storage</span>
                    </button>

                </aside>


                {/* =================================================
                    SETTINGS CONTENT
                ================================================= */}

                <section className="settings-main">


                    {/* =================================================
                        APPEARANCE
                    ================================================= */}

                    {activeSection === "appearance" && (
                        <div className="settings-section">

                            <div className="settings-section-header">

                                <div className="settings-section-icon">
                                    <FiDroplet />
                                </div>

                                <div>
                                    <h2>Appearance</h2>

                                    <p>
                                        Customize the appearance and
                                        visual identity of the VOTARA
                                        system.
                                    </p>
                                </div>

                            </div>


                            {/* COLOR CUSTOMIZATION */}

                            <div className="settings-card">

                                <div className="settings-card-heading">

                                    <div>
                                        <h3>
                                            Theme Color
                                        </h3>

                                        <p>
                                            Choose the primary color
                                            used throughout the
                                            system.
                                        </p>
                                    </div>

                                    <div
                                        className="current-color-preview"
                                        style={{
                                            background:
                                                settings.primaryColor,
                                        }}
                                    ></div>

                                </div>


                                <div className="color-picker-area">

                                    <div className="custom-color-wrapper">

                                        <label>
                                            Custom Color
                                        </label>

                                        <div className="custom-color-input">

                                            <input
                                                type="color"
                                                value={
                                                    settings.primaryColor
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        "primaryColor",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <input
                                                type="text"
                                                value={
                                                    settings.primaryColor
                                                }
                                                onChange={(e) =>
                                                    handleChange(
                                                        "primaryColor",
                                                        e.target.value
                                                    )
                                                }
                                                maxLength={7}
                                            />

                                        </div>

                                    </div>


                                    <div className="color-presets">

                                        <label>
                                            Preset Colors
                                        </label>

                                        <div className="color-options">

                                            {colorPresets.map(
                                                (preset) => (
                                                    <button
                                                        type="button"
                                                        key={
                                                            preset.color
                                                        }
                                                        className={`color-option ${
                                                            settings.primaryColor.toLowerCase() ===
                                                            preset.color.toLowerCase()
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                        onClick={() =>
                                                            handleChange(
                                                                "primaryColor",
                                                                preset.color
                                                            )
                                                        }
                                                        title={
                                                            preset.name
                                                        }
                                                    >
                                                        <span
                                                            style={{
                                                                background:
                                                                    preset.color,
                                                            }}
                                                        ></span>

                                                        {settings.primaryColor.toLowerCase() ===
                                                            preset.color.toLowerCase() && (
                                                            <FiCheck />
                                                        )}
                                                    </button>
                                                )
                                            )}

                                        </div>

                                    </div>

                                </div>


                                {/* COLOR PREVIEW */}

                                <div
                                    className="theme-preview"
                                    style={{
                                        "--preview-color":
                                            settings.primaryColor,
                                    }}
                                >

                                    <div className="preview-sidebar">

                                        <div className="preview-logo">
                                            <span></span>
                                            Votara
                                        </div>

                                        <div className="preview-nav active">
                                            <span></span>
                                            Dashboard
                                        </div>

                                        <div className="preview-nav">
                                            <span></span>
                                            Students
                                        </div>

                                        <div className="preview-nav">
                                            <span></span>
                                            Reports
                                        </div>

                                    </div>

                                    <div className="preview-content">

                                        <div className="preview-topbar"></div>

                                        <div className="preview-title">
                                            Dashboard
                                        </div>

                                        <div className="preview-cards">

                                            <div></div>
                                            <div></div>
                                            <div></div>

                                        </div>

                                        <div className="preview-large-card"></div>

                                    </div>

                                </div>

                            </div>

                            <div className="settings-option-group">

    <div className="settings-option-header">
        <div>
            <h3>Display Mode</h3>

            <p>
                Choose how the VOTARA system
                should appear.
            </p>
        </div>
    </div>

    <div className="theme-mode-options">

        <button
            type="button"
            className={`theme-mode-card ${
                settings.theme === "light"
                    ? "active"
                    : ""
            }`}
            onClick={() => {
                setSettings((prev) => ({
                    ...prev,
                    theme: "light",
                }));

                applyTheme("light");
            }}
        >
            <div className="theme-mode-icon">
                <FiSun size={22} />
            </div>

            <div className="theme-mode-content">
                <strong>Light Mode</strong>

                <span>
                    Use the standard light interface.
                </span>
            </div>

            {settings.theme === "light" && (
                <div className="theme-mode-check">
                    <FiCheck size={16} />
                </div>
            )}
        </button>


        <button
            type="button"
            className={`theme-mode-card ${
                settings.theme === "dark"
                    ? "active"
                    : ""
            }`}
            onClick={() => {
                setSettings((prev) => ({
                    ...prev,
                    theme: "dark",
                }));

                applyTheme("dark");
            }}
        >
            <div className="theme-mode-icon">
                <FiMoon size={22} />
            </div>

            <div className="theme-mode-content">
                <strong>Dark Mode</strong>

                <span>
                    Use a darker interface for reduced
                    brightness.
                </span>
            </div>

            {settings.theme === "dark" && (
                <div className="theme-mode-check">
                    <FiCheck size={16} />
                </div>
            )}
        </button>

    </div>

</div>


                            {/* SYSTEM BRAND */}

                            <div className="settings-card">

                                <div className="settings-card-heading">

                                    <div>
                                        <h3>
                                            System Branding
                                        </h3>

                                        <p>
                                            Configure the name displayed
                                            throughout the system.
                                        </p>
                                    </div>

                                </div>

                                <div className="settings-form-grid">

                                    <div className="settings-field">

                                        <label>
                                            System Name
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                settings.systemName
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "systemName",
                                                    e.target.value
                                                )
                                            }
                                        />

                                    </div>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        GENERAL
                    ================================================= */}

                    {activeSection === "general" && (
                        <div className="settings-section">

                            <div className="settings-section-header">

                                <div className="settings-section-icon">
                                    <FiGlobe />
                                </div>

                                <div>
                                    <h2>General Settings</h2>

                                    <p>
                                        Configure basic system and
                                        regional preferences.
                                    </p>
                                </div>

                            </div>


                            <div className="settings-card">

                                <div className="settings-form-grid">

                                    <div className="settings-field">

                                        <label>
                                            System Language
                                        </label>

                                        <select
                                            value={
                                                settings.language
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "language",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option>
                                                English
                                            </option>

                                            <option>
                                                Filipino
                                            </option>
                                        </select>

                                    </div>


                                    <div className="settings-field">

                                        <label>
                                            Time Zone
                                        </label>

                                        <select
                                            value={
                                                settings.timezone
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "timezone",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option>
                                                Asia/Manila
                                            </option>

                                            <option>
                                                Asia/Singapore
                                            </option>

                                            <option>
                                                Asia/Tokyo
                                            </option>

                                            <option>
                                                UTC
                                            </option>
                                        </select>

                                    </div>


                                    <div className="settings-field">

                                        <label>
                                            Date Format
                                        </label>

                                        <select
                                            value={
                                                settings.dateFormat
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "dateFormat",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option>
                                                MM/DD/YYYY
                                            </option>

                                            <option>
                                                DD/MM/YYYY
                                            </option>

                                            <option>
                                                YYYY-MM-DD
                                            </option>
                                        </select>

                                    </div>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}

                    {activeSection === "notifications" && (
                        <div className="settings-section">

                            <div className="settings-section-header">

                                <div className="settings-section-icon">
                                    <FiBell />
                                </div>

                                <div>
                                    <h2>Notifications</h2>

                                    <p>
                                        Control system notifications
                                        and alerts.
                                    </p>
                                </div>

                            </div>


                            <div className="settings-card">

                                <div className="setting-toggle-row">

                                    <div className="setting-toggle-icon">
                                        <FiBell />
                                    </div>

                                    <div className="setting-toggle-info">

                                        <strong>
                                            Email Notifications
                                        </strong>

                                        <span>
                                            Receive important system
                                            notifications by email.
                                        </span>

                                    </div>

                                    {renderToggle(
                                        "emailNotifications"
                                    )}

                                </div>


                                <div className="setting-toggle-row">

                                    <div className="setting-toggle-icon">
                                        <FiCalendar />
                                    </div>

                                    <div className="setting-toggle-info">

                                        <strong>
                                            Election Notifications
                                        </strong>

                                        <span>
                                            Receive alerts about
                                            election activities and
                                            status changes.
                                        </span>

                                    </div>

                                    {renderToggle(
                                        "electionNotifications"
                                    )}

                                </div>


                                <div className="setting-toggle-row">

                                    <div className="setting-toggle-icon">
                                        <FiShield />
                                    </div>

                                    <div className="setting-toggle-info">

                                        <strong>
                                            Security Notifications
                                        </strong>

                                        <span>
                                            Receive alerts about
                                            security and account
                                            activities.
                                        </span>

                                    </div>

                                    {renderToggle(
                                        "securityNotifications"
                                    )}

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        ELECTION CONTROLS
                    ================================================= */}

                    {activeSection === "election" && (
                        <div className="settings-section">

                            <div className="settings-section-header">

                                <div className="settings-section-icon">
                                    <FiMonitor />
                                </div>

                                <div>
                                    <h2>Election Controls</h2>

                                    <p>
                                        Control important election
                                        system functions.
                                    </p>
                                </div>

                            </div>


                            <div className="settings-card">

                                <div className="setting-toggle-row">

                                    <div className="setting-toggle-icon">
                                        <FiUser />
                                    </div>

                                    <div className="setting-toggle-info">

                                        <strong>
                                            Student Registration
                                        </strong>

                                        <span>
                                            Allow students to register
                                            for the election.
                                        </span>

                                    </div>

                                    {renderToggle(
                                        "allowRegistration"
                                    )}

                                </div>


                                <div className="setting-toggle-row">

                                    <div className="setting-toggle-icon">
                                        <FiCheck />
                                    </div>

                                    <div className="setting-toggle-info">

                                        <strong>
                                            Voting System
                                        </strong>

                                        <span>
                                            Allow eligible students to
                                            cast their votes.
                                        </span>

                                    </div>

                                    {renderToggle(
                                        "allowVoting"
                                    )}

                                </div>


                                <div className="setting-toggle-row danger-setting">

                                    <div className="setting-toggle-icon">
                                        <FiMonitor />
                                    </div>

                                    <div className="setting-toggle-info">

                                        <strong>
                                            Maintenance Mode
                                        </strong>

                                        <span>
                                            Temporarily disable access
                                            while system maintenance is
                                            being performed.
                                        </span>

                                    </div>

                                    {renderToggle(
                                        "maintenanceMode"
                                    )}

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        SECURITY
                    ================================================= */}

                    {activeSection === "security" && (
                        <div className="settings-section">

                            <div className="settings-section-header">

                                <div className="settings-section-icon">
                                    <FiShield />
                                </div>

                                <div>
                                    <h2>Security Settings</h2>

                                    <p>
                                        Configure account sessions and
                                        system security preferences.
                                    </p>
                                </div>

                            </div>


                            <div className="settings-card">

                                <div className="settings-form-grid">

                                    <div className="settings-field">

                                        <label>
                                            Session Timeout
                                        </label>

                                        <select
                                            value={
                                                settings.sessionTimeout
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "sessionTimeout",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option value="15">
                                                15 minutes
                                            </option>

                                            <option value="30">
                                                30 minutes
                                            </option>

                                            <option value="60">
                                                1 hour
                                            </option>

                                            <option value="120">
                                                2 hours
                                            </option>
                                        </select>

                                    </div>

                                </div>


                                <div className="security-notice">

                                    <FiLock />

                                    <div>

                                        <strong>
                                            Security recommendation
                                        </strong>

                                        <p>
                                            Use a shorter session timeout
                                            on shared or public
                                            computers.
                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>
                    )}


                    {/* =================================================
                        BACKUP
                    ================================================= */}

                    {activeSection === "backup" && (
                        <div className="settings-section">

                            <div className="settings-section-header">

                                <div className="settings-section-icon">
                                    <FiDatabase />
                                </div>

                                <div>
                                    <h2>Backup & Storage</h2>

                                    <p>
                                        Manage system backup preferences
                                        and data protection.
                                    </p>
                                </div>

                            </div>


                            <div className="settings-card">

                                <div className="setting-toggle-row">

                                    <div className="setting-toggle-icon">
                                        <FiDatabase />
                                    </div>

                                    <div className="setting-toggle-info">

                                        <strong>
                                            Automatic Backup
                                        </strong>

                                        <span>
                                            Automatically create backups
                                            of important election data.
                                        </span>

                                    </div>

                                    {renderToggle(
                                        "autoBackup"
                                    )}

                                </div>


                                <div className="settings-form-grid">

                                    <div className="settings-field">

                                        <label>
                                            Backup Frequency
                                        </label>

                                        <select
                                            value={
                                                settings.backupFrequency
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "backupFrequency",
                                                    e.target.value
                                                )
                                            }
                                        >
                                            <option>
                                                Hourly
                                            </option>

                                            <option>
                                                Daily
                                            </option>

                                            <option>
                                                Weekly
                                            </option>
                                        </select>

                                    </div>

                                </div>


                                <div className="backup-info">

                                    <div className="backup-info-icon">
                                        <FiDatabase />
                                    </div>

                                    <div>

                                        <strong>
                                            Backup status
                                        </strong>

                                        <span>
                                            Last backup: Today at
                                            12:00 AM
                                        </span>

                                    </div>

                                    <span className="backup-status">
                                        Protected
                                    </span>

                                </div>

                            </div>

                        </div>
                    )}

                </section>

            </main>

        </div>
    );
};

export default SystemSettings;