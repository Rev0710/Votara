import React from "react";
import { useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiBookOpen,
    FiChevronRight,
    FiHelpCircle,
    FiLifeBuoy,
    FiMessageCircle,
    FiUsers,
    FiShield,
    FiTool,
} from "react-icons/fi";
import "./AdminSupport.css";

const AdminSupport = () => {
    const navigate = useNavigate();

    const cards = [
        {
            icon: FiTool,
            title: "System Issues",
            description:
                "Review common VOTARA operational issues and recommended checks.",
            action: "Open System Configuration",
            path: "/admin/settings",
        },
        {
            icon: FiUsers,
            title: "Electoral Board Assistance",
            description:
                "Open the EB management area for account and access assistance.",
            action: "Manage EB Accounts",
            path: "/admin/electoral-board",
        },
        {
            icon: FiShield,
            title: "Security & Access",
            description:
                "Review audit activity, failed logins, and administrative events.",
            action: "Open Monitoring & Logs",
            path: "/admin/audit-logs",
        },
        {
            icon: FiBookOpen,
            title: "Documentation",
            description:
                "Use the project documentation and operational guides when troubleshooting.",
            action: "Open Reports",
            path: "/admin/reports",
        },
    ];

    return (
        <div className="admin-support-page">
            <header className="admin-support-header">
                <button
                    type="button"
                    onClick={() => navigate("/admin-dashboard")}
                    className="admin-support-back"
                >
                    <FiArrowLeft />
                </button>

                <div>
                    <span>ADMIN • 06</span>
                    <h1>Support &amp; Troubleshooting</h1>
                    <p>
                        Resolve common VOTARA operational issues and
                        quickly reach the correct management module.
                    </p>
                </div>
            </header>

            <main className="admin-support-content">
                <section className="admin-support-hero">
                    <div className="admin-support-hero-icon">
                        <FiLifeBuoy size={28} />
                    </div>
                    <div>
                        <h2>How can we help?</h2>
                        <p>
                            Use the support shortcuts below. Administrative
                            actions remain protected by the existing Admin
                            authentication and audit logging system.
                        </p>
                    </div>
                </section>

                <section className="admin-support-grid">
                    {cards.map((card) => {
                        const Icon = card.icon;

                        return (
                            <button
                                type="button"
                                key={card.title}
                                className="admin-support-card"
                                onClick={() =>
                                    navigate(card.path)
                                }
                            >
                                <span className="admin-support-card-icon">
                                    <Icon />
                                </span>

                                <span className="admin-support-card-copy">
                                    <strong>{card.title}</strong>
                                    <small>
                                        {card.description}
                                    </small>
                                    <em>
                                        {card.action}
                                        <FiChevronRight />
                                    </em>
                                </span>
                            </button>
                        );
                    })}
                </section>

                <section className="admin-support-contact">
                    <FiMessageCircle />
                    <div>
                        <strong>Need deeper investigation?</strong>
                        <p>
                            Check Monitoring &amp; Logs first so the
                            relevant audit/security event is preserved
                            before changing system data.
                        </p>
                    </div>
                </section>

                <section className="admin-support-help">
                    <FiHelpCircle />
                    <div>
                        <strong>Recommended troubleshooting order</strong>
                        <ol>
                            <li>Check System Dashboard health.</li>
                            <li>Review Monitoring &amp; Logs.</li>
                            <li>Verify System Configuration.</li>
                            <li>Check User &amp; Access Management.</li>
                            <li>Review Reports &amp; Analytics.</li>
                        </ol>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdminSupport;
