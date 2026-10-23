import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import PageLoader from "../../components/transitionloader/PageLoader";

const AdminRoutePending = createContext(null);

export default function AdminWorkspace({ children }) {
    const { pathname, search } = useLocation();
    const isAdmin = pathname === "/admin-dashboard" || pathname.startsWith("/admin/");
    const [theme, setTheme] = useState(() => localStorage.getItem("votaraAdminTheme") || "dark");
    const [transitioning, setTransitioning] = useState(isAdmin);
    const [routePending, setRoutePending] = useState(false);

    useEffect(() => {
        const change = () => setTheme(localStorage.getItem("votaraAdminTheme") || "dark");
        window.addEventListener("votara-admin-theme", change);
        return () => window.removeEventListener("votara-admin-theme", change);
    }, []);

    useLayoutEffect(() => {
        if (!isAdmin) {
            setTransitioning(false);
            return undefined;
        }
        setTransitioning(true);
        const timer = window.setTimeout(() => setTransitioning(false), 500);
        return () => window.clearTimeout(timer);
    }, [isAdmin, pathname, search]);

    if (!isAdmin) return children;
    return <AdminRoutePending.Provider value={setRoutePending}>
        <div className="admin-workspace" data-admin-theme={theme}>
            {children}
            {(transitioning || routePending) && <PageLoader />}
        </div>
    </AdminRoutePending.Provider>;
}

// Keep the shared loader visible when a route's code takes longer to load.
export function AdminRouteFallback() {
    const setPending = useContext(AdminRoutePending);
    useLayoutEffect(() => {
        if (!setPending) return undefined;
        setPending(true);
        return () => setPending(false);
    }, [setPending]);
    return setPending ? null : <div className="route-loading" role="status">Loading VOTARA…</div>;
}
