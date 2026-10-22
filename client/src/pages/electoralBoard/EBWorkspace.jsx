import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../../services/api";

const getElectoralBoardSession = () => {
    for (const key of ["votaraEBToken", "votaraStaffToken"]) {
        const token = localStorage.getItem(key);
        if (!token) continue;
        try {
            const payloadPart = token.split(".")[1];
            if (!payloadPart) continue;
            const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
            const payload = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
            if (payload?.role !== "electoral_board") continue;
            if (payload?.exp && Number(payload.exp) * 1000 <= Date.now()) continue;
            return { key, token };
        } catch {
            // Ignore malformed tokens and try the other supported storage key.
        }
    }
    return null;
};

export default function EBWorkspace({ children }) {
    const { pathname } = useLocation();
    const [theme, setTheme] = useState(() => localStorage.getItem("votaraEBTheme") || "dark");
    const isEBPath = pathname.startsWith("/electoral-board/");
    const isEBPublicPath = ["/electoral-board/login", "/electoral-board/register"].includes(pathname);
    const currentSession = getElectoralBoardSession();
    const hasEBSession = Boolean(currentSession);
    const [validatedToken, setValidatedToken] = useState(null);

    useEffect(() => {
        const change = () => setTheme(localStorage.getItem("votaraEBTheme") || "dark");
        window.addEventListener("votara-eb-theme", change);
        return () => window.removeEventListener("votara-eb-theme", change);
    }, []);

    useEffect(() => {
        if (!isEBPath || isEBPublicPath || !hasEBSession) return undefined;

        let refreshInFlight = false;
        const refreshSession = async () => {
            if (document.visibilityState !== "visible" || refreshInFlight) return;
            const session = getElectoralBoardSession();
            if (!session) return;
            const { key: storageKey, token } = session;

            refreshInFlight = true;
            try {
                const response = await api.post(
                    "/eb-auth/session/keepalive",
                    {},
                    { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
                );
                const renewedToken = response?.data?.token;
                const latestStoredToken = localStorage.getItem(storageKey);
                if (renewedToken && latestStoredToken === token) {
                    localStorage.setItem(storageKey, renewedToken);
                    setValidatedToken(renewedToken);
                } else {
                    setValidatedToken(latestStoredToken || token);
                }
            } catch (error) {
                console.warn("Electoral Board session renewal was unsuccessful:", error?.message);
            } finally {
                refreshInFlight = false;
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") refreshSession();
        };
        refreshSession();
        const timer = window.setInterval(refreshSession, 5 * 60 * 1000);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [isEBPath, isEBPublicPath, hasEBSession]);

    if (isEBPath && !isEBPublicPath && !hasEBSession) {
        return <Navigate to="/electoral-board/login" replace state={{ sessionExpired: true }} />;
    }
    if (isEBPath && !isEBPublicPath && currentSession?.token !== validatedToken) {
        return <div className="route-loading" role="status">Checking Electoral Board session…</div>;
    }

    const themedPath = isEBPath || pathname.startsWith("/kiosk-voting");
    const lowPower = Boolean(
        navigator.connection?.saveData ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    );

    return themedPath ? (
        <div className="eb-workspace" data-eb-theme={theme} data-eb-low-power={lowPower}>
            {children}
        </div>
    ) : children;
}
