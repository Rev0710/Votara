import React, {
    useCallback,
    useEffect,
    useState
} from "react";

import api from "../../services/api";

import "./Settings.css";


// =========================================================
// VOTARA ELECTORAL BOARD SETTINGS
// =========================================================

function Settings() {

    const [settings, setSettings] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [refreshing, setRefreshing] = useState(false);


    // =====================================================
    // LOAD SETTINGS
    // =====================================================

    const loadSettings = useCallback(
        async (showRefresh = false) => {

            try {

                if (showRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response =
                    await api.get(
                        "/electoral-board/settings"
                    );

                const data =
                    response?.data || {};

                if (!data.success) {
                    throw new Error(
                        data.message ||
                        "Unable to load settings."
                    );
                }

                setSettings(data);

            } catch (err) {

                console.error(
                    "Settings error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load Electoral Board settings."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);

            }

        },
        []
    );


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadSettings();

    }, [loadSettings]);


    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = () => {

        loadSettings(true);

    };


    // =====================================================
    // FORMAT ROLE
    // =====================================================

    const formatRole = (role) => {

        if (!role) {
            return "Electoral Board";
        }

        return String(role)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );

    };


    // =====================================================
    // GET INITIAL
    // =====================================================

    const getInitial = (name) => {

        if (!name) {
            return "E";
        }

        return String(name)
            .trim()
            .charAt(0)
            .toUpperCase();

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="settings-page">

                <div className="settings-loading">

                    <div className="settings-spinner">
                    </div>

                    <p>
                        Loading Electoral Board settings...
                    </p>

                </div>

            </div>
        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error && !settings) {

        return (
            <div className="settings-page">

                <div className="settings-header">

                    <div>

                        <div className="settings-eyebrow">
                            ELECTORAL BOARD
                        </div>

                        <h1>
                            Settings
                        </h1>

                        <p>
                            Manage your Electoral Board
                            account and system information.
                        </p>

                    </div>

                    <button
                        type="button"
                        className="settings-refresh-btn"
                        onClick={handleRefresh}
                    >
                        ↻ Refresh
                    </button>

                </div>


                <div className="settings-error">

                    <div className="settings-error-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            Unable to load settings
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            </div>
        );

    }


    const account =
        settings?.account || {};

    const security =
        settings?.security || {};

    const system =
        settings?.system || {};


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div className="settings-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="settings-header">

                <div>

                    <div className="settings-eyebrow">
                        ELECTORAL BOARD
                    </div>

                    <h1>
                        Settings
                    </h1>

                    <p>
                        Manage your Electoral Board
                        account and review system
                        security information.
                    </p>

                </div>


                <button
                    type="button"
                    className="settings-refresh-btn"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >

                    <span>
                        ↻
                    </span>

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}

                </button>

            </div>


            {/* =================================================
                ERROR AFTER REFRESH
            ================================================= */}

            {error && settings && (

                <div className="settings-error">

                    <div className="settings-error-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            Unable to refresh settings
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            )}


            {/* =================================================
                ACCOUNT PROFILE
            ================================================= */}

            <section className="settings-card settings-profile-card">

                <div className="settings-card-heading">

                    <div>

                        <div className="settings-card-eyebrow">
                            ACCOUNT
                        </div>

                        <h2>
                            Electoral Board Account
                        </h2>

                        <p>
                            Information associated with
                            your Electoral Board account.
                        </p>

                    </div>

                    <span
                        className={
                            account.isActive
                                ? "settings-status active"
                                : "settings-status inactive"
                        }
                    >
                        <span className="settings-status-dot">
                        </span>

                        {account.isActive
                            ? "Active"
                            : "Inactive"}
                    </span>

                </div>


                <div className="settings-profile">

                    <div className="settings-avatar">

                        {getInitial(
                            account.fullName
                        )}

                    </div>


                    <div className="settings-profile-main">

                        <h3>
                            {account.fullName ||
                                "Electoral Board Member"}
                        </h3>

                        <p>
                            {account.email ||
                                "No email available"}
                        </p>

                        <span className="settings-role-badge">
                            {formatRole(
                                account.role
                            )}
                        </span>

                    </div>

                </div>


                <div className="settings-info-grid">

                    <div className="settings-info-item">

                        <span>
                            Full Name
                        </span>

                        <strong>
                            {account.fullName ||
                                "—"}
                        </strong>

                    </div>


                    <div className="settings-info-item">

                        <span>
                            Email Address
                        </span>

                        <strong>
                            {account.email ||
                                "—"}
                        </strong>

                    </div>


                    <div className="settings-info-item">

                        <span>
                            Account Role
                        </span>

                        <strong>
                            {formatRole(
                                account.role
                            )}
                        </strong>

                    </div>


                    <div className="settings-info-item">

                        <span>
                            Account Status
                        </span>

                        <strong
                            className={
                                account.isActive
                                    ? "settings-value-success"
                                    : "settings-value-danger"
                            }
                        >
                            {account.isActive
                                ? "Active"
                                : "Inactive"}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =================================================
                SECURITY
            ================================================= */}

            <section className="settings-card">

                <div className="settings-card-heading">

                    <div>

                        <div className="settings-card-eyebrow">
                            SECURITY
                        </div>

                        <h2>
                            Authentication & Security
                        </h2>

                        <p>
                            Security information for
                            your current Electoral Board
                            session.
                        </p>

                    </div>

                    <div className="settings-security-icon">
                        ♢
                    </div>

                </div>


                <div className="settings-security-list">

                    <div className="settings-security-item">

                        <div className="settings-security-item-icon">
                            ✓
                        </div>

                        <div>

                            <strong>
                                JWT Authentication
                            </strong>

                            <p>
                                Your Electoral Board
                                session is authenticated
                                using a signed JSON Web
                                Token.
                            </p>

                        </div>

                        <span className="settings-security-badge">
                            Enabled
                        </span>

                    </div>


                    <div className="settings-security-item">

                        <div className="settings-security-item-icon">
                            ◷
                        </div>

                        <div>

                            <strong>
                                Session Duration
                            </strong>

                            <p>
                                Electoral Board sessions
                                expire after the configured
                                authentication period.
                            </p>

                        </div>

                        <span className="settings-security-badge neutral">
                            {security.sessionDuration ||
                                "8 hours"}
                        </span>

                    </div>


                    <div className="settings-security-item">

                        <div className="settings-security-item-icon">
                            ♢
                        </div>

                        <div>

                            <strong>
                                Access Level
                            </strong>

                            <p>
                                This account is restricted
                                to Electoral Board features.
                            </p>

                        </div>

                        <span className="settings-security-badge">
                            {security.accessLevel ||
                                "Electoral Board"}
                        </span>

                    </div>

                </div>

            </section>


            {/* =================================================
                SYSTEM INFORMATION
            ================================================= */}

            <section className="settings-card">

                <div className="settings-card-heading">

                    <div>

                        <div className="settings-card-eyebrow">
                            SYSTEM
                        </div>

                        <h2>
                            System Information
                        </h2>

                        <p>
                            General information about the
                            VOTARA Electoral Board system.
                        </p>

                    </div>

                    <div className="settings-system-icon">
                        V
                    </div>

                </div>


                <div className="settings-system-grid">

                    <div className="settings-system-item">

                        <span>
                            System Name
                        </span>

                        <strong>
                            {system.systemName ||
                                "VOTARA"}
                        </strong>

                    </div>


                    <div className="settings-system-item">

                        <span>
                            Current Module
                        </span>

                        <strong>
                            {system.module ||
                                "Electoral Board"}
                        </strong>

                    </div>


                    <div className="settings-system-item">

                        <span>
                            Database
                        </span>

                        <strong>
                            {system.database ||
                                "Supabase"}
                        </strong>

                    </div>


                    <div className="settings-system-item">

                        <span>
                            Ballot Secrecy
                        </span>

                        <strong className="settings-value-success">
                            {system.ballotSecrecy
                                ? "Protected"
                                : "Not Available"}
                        </strong>

                    </div>

                </div>

            </section>


            {/* =================================================
                SECURITY NOTICE
            ================================================= */}

            <section className="settings-notice">

                <div className="settings-notice-icon">
                    ♢
                </div>

                <div>

                    <strong>
                        Account & Election Security
                    </strong>

                    <p>
                        Account information is controlled
                        by the VOTARA authentication system.
                        Election dates, voting periods,
                        positions, year-level eligibility,
                        and election status are managed
                        through Election Management rather
                        than this Settings page.
                    </p>

                </div>

            </section>


            {/* =================================================
                FOOTER INFORMATION
            ================================================= */}

            <div className="settings-footer">

                <span>
                    VOTARA Electoral Board
                </span>

                <span>
                    Settings information is
                    read-only.
                </span>

                {settings?.generatedAt && (

                    <span>
                        Updated{" "}
                        {new Date(
                            settings.generatedAt
                        ).toLocaleString(
                            "en-PH",
                            {
                                dateStyle: "medium",
                                timeStyle: "short"
                            }
                        )}
                    </span>

                )}

            </div>

        </div>
    );
}

export default Settings;