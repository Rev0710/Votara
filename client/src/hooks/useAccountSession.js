
import { useEffect } from "react";
import { clearAccountSession, getEBToken, getSessionIdentity, getStudentToken } from "../services/api";

export default function useAccountSession(role) {
    useEffect(() => {
        const read = () => role === "student" ? getStudentToken()
            : role === "electoral_board" ? getEBToken() : localStorage.getItem("votaraAdminToken") || "";
        const destination = role === "student" ? "/student-login"
            : role === "electoral_board" ? "/admin-login?role=electoral_board" : "/admin-login";
        const initial = getSessionIdentity(read());
        let leaving = false;
        const check = () => {
            if (leaving) return;
            const token = read();
            const current = getSessionIdentity(token);
            if (!token || !current.id || current.expired || current.role !== role) {
                leaving = true;
                clearAccountSession(role);
                window.location.replace(destination);
            } else if (initial.id && current.id !== initial.id) {
                // A different account signed in in another tab: discard the previous profile and ballot state.
                leaving = true;
                window.location.reload();
            }
        };
        const visibility = () => { if (document.visibilityState === "visible") check(); };
        check();
        window.addEventListener("storage", check);
        window.addEventListener("pageshow", check);
        document.addEventListener("visibilitychange", visibility);
        return () => {
            window.removeEventListener("storage", check);
            window.removeEventListener("pageshow", check);
            document.removeEventListener("visibilitychange", visibility);
        };
    }, [role]);
}
