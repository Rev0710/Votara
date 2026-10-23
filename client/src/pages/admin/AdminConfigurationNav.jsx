import { Link, useLocation } from "react-router-dom";
import { ADMIN_CONFIGURATION, isAdminDestinationActive } from "./adminNavigation";

export default function AdminConfigurationNav() {
    const location = useLocation();
    return (
        <aside className="admin-config-navigation" aria-label="System configuration navigation">

            <nav aria-label="Configuration">
                {ADMIN_CONFIGURATION.map((item) => (
                    <Link
                        key={item.section}
                        to={item.path}
                        aria-current={isAdminDestinationActive(item, location) ? "page" : undefined}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
            <Link
                className="admin-config-issues"
                to="/admin/settings?section=student-reports"
                aria-current={new URLSearchParams(location.search).get("section") === "student-reports" ? "page" : undefined}
            >
                Issue reports
            </Link>
        </aside>
    );
}
