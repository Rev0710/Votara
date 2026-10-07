import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FiTool, FiRefreshCw, FiShield } from "react-icons/fi";
import api from "../services/api";
import "./MaintenanceGate.css";

const ADMIN_ALLOWED_PATHS = [
    "/admin",
    "/admin-login",
];

const isAdminAllowedPath = (pathname) =>
    ADMIN_ALLOWED_PATHS.some(
        (path) =>
            pathname === path ||
            pathname.startsWith(`${path}/`)
    );

const MaintenanceGate = ({ children }) => {
    const location = useLocation();

    const [status, setStatus] = useState({
        loading: true,
        enabled: false,
        message: "The system is under maintenance. Please check back later.",
    });

    const loadMaintenanceStatus = async () => {
        try {
            const response = await api.get("/system/maintenance-status");
            const data = response?.data || {};

            setStatus({
                loading: false,
                enabled: Boolean(data.maintenance?.enabled),
                message:
                    data.maintenance?.message ||
                    "The system is under maintenance. Please check back later.",
            });
        } catch (error) {
            // Do not lock users out if the public status endpoint is temporarily
            // unavailable. Existing application routes remain usable.
            setStatus((current) => ({
                ...current,
                loading: false,
            }));
        }
    };

    useEffect(() => {
        loadMaintenanceStatus();

        const interval = window.setInterval(
            loadMaintenanceStatus,
            15000
        );

        return () => window.clearInterval(interval);
    }, []);

    if (
        isAdminAllowedPath(location.pathname) ||
        status.loading ||
        !status.enabled
    ) {
        return children;
    }

    return (
        <div className="maintenance-gate">
            <div className="maintenance-gate-card">
                <div className="maintenance-gate-brand">
                    <div className="maintenance-gate-brand-mark">
                        <FiShield size={19} />
                    </div>

                    <div>
                        <strong>VOTARA</strong>
                        <span>ELECTION SYSTEM</span>
                    </div>
                </div>

                <div className="maintenance-gate-icon">
                    <FiTool size={25} />
                </div>

                <span className="maintenance-gate-kicker">
                    SYSTEM MAINTENANCE
                </span>

                <h1>Under maintenance</h1>

                <p>{status.message}</p>

                <div className="maintenance-gate-status">
                    <span className="maintenance-gate-dot" />
                    Maintenance mode is currently active
                </div>

                <button
                    type="button"
                    className="maintenance-gate-refresh"
                    onClick={loadMaintenanceStatus}
                >
                    <FiRefreshCw size={14} />
                    Check again
                </button>
            </div>
        </div>
    );
};

export default MaintenanceGate;
