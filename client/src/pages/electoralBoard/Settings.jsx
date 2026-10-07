import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiCheckCircle,
    FiClock,
    FiDatabase,
    FiLock,
    FiLogOut,
    FiMail,
    FiRefreshCw,
    FiShield,
    FiUser,
    FiAlertCircle,
} from "react-icons/fi";

import "./Settings.css";
import api from "../../services/api";

// =====================================================
// ELECTORAL BOARD SETTINGS
// =====================================================
// This page is the EB Settings component expected by
// EBDashboard.jsx:
//
//     import Settings from "./Settings";
//
// The backend already exposes:
//     /api/electoral-board/settings
//
// api.js supplies the votaraEBToken automatically.
// =====================================================

const Settings = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [settings, setSettings] = useState(null);

    const loadSettings = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get(
                "/electoral-board/settings"
            );

            const data = response?.data || {};

            if (!data.success) {
                throw new Error(
                    data.message ||
                    "Unable to load Electoral Board settings."
                );
            }

            setSettings(data);
        } catch (err) {
            console.error(
                "❌ Electoral Board Settings error:",
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
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleBack = () => {
        // Return to the EB dashboard without changing
        // EBDashboard.jsx.
        navigate("/electoral-board/dashboard");
    };

    const handleLogout = () => {
        localStorage.removeItem("votaraEBToken");
        localStorage.removeItem("votaraEBUser");
        localStorage.removeItem("votaraStaffToken");
        localStorage.removeItem("votaraStaffUser");

        navigate("/electoral-board/login", {
            replace: true,
        });
    };

    const account = settings?.account || {};
    const security = settings?.security || {};
    const system = settings?.system || {};

    if (loading) {
        return (
            <div className="eb-settings-page eb-settings-loading">
                <div className="eb-settings-loading-card">
                    <FiRefreshCw className="eb-settings-spinner" />
                    <h2>Loading settings</h2>
                    <p>
                        Retrieving your Electoral Board
                        account information...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="eb-settings-page">
            <div className="eb-settings-container">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header className="eb-settings-header">
                    <button
                        type="button"
                        className="eb-settings-back"
                        onClick={handleBack}
                    >
                        <FiArrowLeft />
                        Back to Dashboard
                    </button>

                    <div className="eb-settings-heading">
                        <div className="eb-settings-badge">
                            ELECTORAL BOARD
                        </div>

                        <h1>Settings</h1>

                        <p>
                            View your Electoral Board account,
                            security, and VOTARA system information.
                        </p>
                    </div>

                    <div className="eb-settings-header-actions">
                        <button
                            type="button"
                            className="eb-settings-refresh"
                            onClick={() => loadSettings(true)}
                            disabled={refreshing}
                        >
                            <FiRefreshCw
                                className={
                                    refreshing
                                        ? "eb-settings-spin"
                                        : ""
                                }
                            />
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        <button
                            type="button"
                            className="eb-settings-logout"
                            onClick={handleLogout}
                        >
                            <FiLogOut />
                            Logout
                        </button>
                    </div>
                </header>

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div className="eb-settings-error">
                        <FiAlertCircle />
                        <div>
                            <strong>
                                Unable to load settings
                            </strong>
                            <span>{error}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadSettings()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {/* =================================================
                    CONTENT
                ================================================= */}

                {!error && (
                    <main className="eb-settings-grid">

                        {/* ACCOUNT */}

                        <section className="eb-settings-card">
                            <div className="eb-settings-card-header">
                                <div className="eb-settings-icon blue">
                                    <FiUser />
                                </div>

                                <div>
                                    <h2>Account</h2>
                                    <p>
                                        Your Electoral Board account
                                        information.
                                    </p>
                                </div>
                            </div>

                            <div className="eb-settings-list">
                                <div className="eb-settings-row">
                                    <div>
                                        <strong>Full name</strong>
                                        <span>
                                            Name registered to the
                                            Electoral Board account.
                                        </span>
                                    </div>
                                    <b>
                                        {account.fullName || "Not available"}
                                    </b>
                                </div>

                                <div className="eb-settings-row">
                                    <div>
                                        <strong>Email</strong>
                                        <span>
                                            Email associated with
                                            this account.
                                        </span>
                                    </div>
                                    <b>
                                        {account.email || "Not available"}
                                    </b>
                                </div>

                                <div className="eb-settings-row">
                                    <div>
                                        <strong>Role</strong>
                                        <span>
                                            Access role for this account.
                                        </span>
                                    </div>
                                    <b>
                                        Electoral Board
                                    </b>
                                </div>

                                <div className="eb-settings-row last">
                                    <div>
                                        <strong>Account status</strong>
                                        <span>
                                            Current account availability.
                                        </span>
                                    </div>

                                    <span className="eb-settings-status active">
                                        <FiCheckCircle />
                                        {account.isActive
                                            ? "Active"
                                            : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* SECURITY */}

                        <section className="eb-settings-card">
                            <div className="eb-settings-card-header">
                                <div className="eb-settings-icon green">
                                    <FiShield />
                                </div>

                                <div>
                                    <h2>Security</h2>
                                    <p>
                                        Authentication and access
                                        information for this session.
                                    </p>
                                </div>
                            </div>

                            <div className="eb-settings-list">
                                <div className="eb-settings-row">
                                    <div>
                                        <strong>Authentication</strong>
                                        <span>
                                            Authentication method used
                                            by the Electoral Board API.
                                        </span>
                                    </div>
                                    <b>
                                        {security.authentication || "JWT"}
                                    </b>
                                </div>

                                <div className="eb-settings-row">
                                    <div>
                                        <strong>Session duration</strong>
                                        <span>
                                            Maximum session duration
                                            provided by the EB settings API.
                                        </span>
                                    </div>
                                    <b>
                                        {security.sessionDuration ||
                                            "Not available"}
                                    </b>
                                </div>

                                <div className="eb-settings-row last">
                                    <div>
                                        <strong>Access level</strong>
                                        <span>
                                            Permission level returned
                                            for the authenticated account.
                                        </span>
                                    </div>
                                    <b>
                                        {security.accessLevel ||
                                            "Electoral Board"}
                                    </b>
                                </div>
                            </div>
                        </section>

                        {/* SYSTEM */}

                        <section className="eb-settings-card">
                            <div className="eb-settings-card-header">
                                <div className="eb-settings-icon purple">
                                    <FiDatabase />
                                </div>

                                <div>
                                    <h2>System information</h2>
                                    <p>
                                        Information about the VOTARA
                                        environment used by EB.
                                    </p>
                                </div>
                            </div>

                            <div className="eb-settings-list">
                                <div className="eb-settings-row">
                                    <div>
                                        <strong>System</strong>
                                        <span>
                                            Election system name.
                                        </span>
                                    </div>
                                    <b>
                                        {system.systemName || "VOTARA"}
                                    </b>
                                </div>

                                <div className="eb-settings-row">
                                    <div>
                                        <strong>Module</strong>
                                        <span>
                                            Current application module.
                                        </span>
                                    </div>
                                    <b>
                                        {system.module ||
                                            "Electoral Board"}
                                    </b>
                                </div>

                                <div className="eb-settings-row">
                                    <div>
                                        <strong>Database</strong>
                                        <span>
                                            Database service used by
                                            the application.
                                        </span>
                                    </div>
                                    <b>
                                        {system.database ||
                                            "Supabase"}
                                    </b>
                                </div>

                                <div className="eb-settings-row last">
                                    <div>
                                        <strong>Ballot secrecy</strong>
                                        <span>
                                            Indicates whether ballot
                                            secrecy is enabled.
                                        </span>
                                    </div>

                                    <span className="eb-settings-status secure">
                                        <FiLock />
                                        {system.ballotSecrecy
                                            ? "Protected"
                                            : "Not reported"}
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* SESSION STATUS */}

                        <section className="eb-settings-card eb-settings-session-card">
                            <div className="eb-settings-card-header">
                                <div className="eb-settings-icon amber">
                                    <FiClock />
                                </div>

                                <div>
                                    <h2>Session status</h2>
                                    <p>
                                        Current authenticated Electoral
                                        Board session.
                                    </p>
                                </div>
                            </div>

                            <div className="eb-settings-session-content">
                                <div className="eb-settings-session-status">
                                    <span className="eb-settings-live-dot" />
                                    <div>
                                        <strong>
                                            Electoral Board session active
                                        </strong>
                                        <span>
                                            Your account is currently
                                            authenticated for EB operations.
                                        </span>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="eb-settings-secondary-button"
                                    onClick={handleBack}
                                >
                                    <FiArrowLeft />
                                    Return to Dashboard
                                </button>
                            </div>
                        </section>

                    </main>
                )}

                <footer className="eb-settings-footer">
                    <FiMail />
                    <span>
                        VOTARA Electoral Board Settings
                    </span>
                    {settings?.generatedAt && (
                        <span>
                            Last checked:{" "}
                            {new Date(
                                settings.generatedAt
                            ).toLocaleString()}
                        </span>
                    )}
                </footer>
            </div>
        </div>
    );
};

export default Settings;
