import {notificationStorageKey,unreadNotifications,markNotificationsRead} from "./notificationReadState";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiBell, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PlatformNotifications.css";
import NotificationPanel from "./NotificationPanel";

export default function PlatformNotifications({ admin = false, audience = "student", onStatus, onAction, iconSrc }) {
    const role=admin?"admin":audience;
    let account={};try{account=JSON.parse(localStorage.getItem(admin?"votaraAdminUser":audience==="eb"?"votaraEBUser":"votaraStudent")||"{}");}catch{}
    const storageKey=notificationStorageKey(role,account);
    const [read,setRead]=useState(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||"{}");}catch{return {};}});
    useEffect(()=>{try{setRead(JSON.parse(localStorage.getItem(storageKey)||"{}"));}catch{setRead({});}},[storageKey]);
    const markRead=entries=>{const next=markNotificationsRead(read,entries);try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}setRead(next);};
    const [open, setOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const themeStorageKey = admin ? "votaraAdminTheme" : audience === "eb" ? "votaraEBTheme" : "votaraStudentTheme";
    const themeEvent = admin ? "votara-admin-theme" : audience === "eb" ? "votara-eb-theme" : "votara-student-theme";
    const [notificationTheme, setNotificationTheme] = useState(() => {
        try { return localStorage.getItem(themeStorageKey) || (audience === "student" ? "light" : "dark"); }
        catch { return audience === "student" ? "light" : "dark"; }
    });
    useEffect(() => {
        const syncTheme = () => {
            try { setNotificationTheme(localStorage.getItem(themeStorageKey) || (audience === "student" ? "light" : "dark")); }
            catch { setNotificationTheme(audience === "student" ? "light" : "dark"); }
        };
        syncTheme();
        window.addEventListener(themeEvent, syncTheme);
        window.addEventListener("storage", syncTheme);
        return () => {
            window.removeEventListener(themeEvent, syncTheme);
            window.removeEventListener("storage", syncTheme);
        };
    }, [audience, themeEvent, themeStorageKey]);
    useEffect(()=>{if(audience!=='eb')return;const show=()=>setOpen(true);window.addEventListener('votara-eb-open-notifications',show);return()=>window.removeEventListener('votara-eb-open-notifications',show);},[audience]);
    const [items, setItems] = useState([]);
    const [error, setError] = useState("");
    const container = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        let live = true;
        let pending = false;
        async function load() {
            if (document.hidden || pending) return;
            pending = true;
            const next = [];
            const failures = [];
            const capture = async (operation) => {
                try { await operation(); } catch { failures.push(true); }
            };
            await Promise.allSettled([
                capture(async () => {
                    if (admin || audience !== "student") return;
                    const response = await api.get("/voting/notices");
                    for (const notice of response.data.notices || []) {
                        next.push({id:"voting-notice-"+notice.id,text:notice.message,action:"vote"});
                    }
                }),

                capture(async () => {
                    const response = await api.get("/system/maintenance-status");
                    const status = response.data.maintenance || {};
                    if (live) onStatus?.(status);
                    if (status.enabled) next.push({ id: "maintenance", text: `Under maintenance: ${status.message}`, action: "maintenance" });
                    else if (status.upcoming) next.push({ id: "scheduled", text: `Maintenance starts ${new Date(status.startsAt).toLocaleString()}. ${status.message}`, action: "maintenance" });
                    if (status.notice) next.push({ id: "notice", text: status.notice, action: "announcement" });
                }),
                capture(async () => {
                    if (admin) {
                        const response = await api.get("/admin/student-issue-reports");
                        for (const report of (response.data.reports || []).slice(0, 20)) next.push({id:`student-${report.id}`,text:`Student · ${report.reference}: ${report.subject} — ${String(report.status).replaceAll("_"," ")}`,path:`/admin/settings?section=student-reports&report=${encodeURIComponent(report.id)}`});
                    } else if (audience === "student") {
                        const response = await api.get("/students/issues");
                        for (const report of (response.data.reports || []).slice(0, 10)) {
                            const status = String(report.status || "submitted").replaceAll("_", " ");
                            next.push({ id: `report-${report.id}`, text: `${report.reference}: ${report.subject} — ${status}.${report.admin_response ? ` Administrator: ${report.admin_response}` : ""}`, action: "reports" });
                        }
                    }
                }),
                capture(async () => {
                    if (admin || audience === "eb") {
                        const response=await api.get(admin?"/admin/staff-issue-reports":"/electoral-board/issues");
                        for(const report of (response.data.reports||[]).slice(0,20)) next.push({id:`eb-${report.id}`,text:`Electoral Board · ${report.reference}: ${report.subject} — ${String(report.status).replaceAll("_"," ")}${report.admin_response?`. Administrator: ${report.admin_response}`:""}`, ...(admin?{path:`/admin/settings?section=student-reports&report=${encodeURIComponent(report.id)}`}:{action:"reports"})});
                    }
                }),
                capture(async () => {
                    if (admin) return;
                    let response;
                    try {
                        response = await api.get("/elections/active");
                    } catch (requestError) {
                        // No active election is a normal state between elections.
                        // The endpoint now returns an empty result, but keep this
                        // guard for older backend instances during local updates.
                        if (requestError?.response?.status === 404 && /no active election/i.test(requestError?.response?.data?.message || "")) return;
                        throw requestError;
                    }
                    const election = response.data.election;
                    if (!election?.id) return;
                    const label = election.title || election.name || "Current election";
                    next.push({ id: `election-${election.id}`, text: `${label}: ${String(election.status || "scheduled").replaceAll("_", " ")}.`, action: "election" });
                    if (audience === "student") {
                        const vote = await api.get(`/voting/status/${election.id}`);
                        if (vote.data.hasVoted) next.push({ id: `ballot-${election.id}`, text: `Your ballot for ${label} has been recorded.`, action: "vote" });
                    }
                }),
                capture(async () => {
                    if (admin || audience !== "student") return;
                    const response = await api.get("/students/results");
                    const result = response.data;
                    if (!result?.published || !result?.election?.id) return;
                    const label = result.election.title || "Election";
                    const releasedAt = result.election.results_released_at || "released";
                    next.push({
                        id: `results-released-${result.election.id}-${releasedAt}`,
                        text: `Electoral Board released the official results for ${label}. Open Results to view the final tally.`,
                        action: "results",
                    });
                }),
            ]);
            if (live) {
                setItems(next.sort((a, b) => a.id.localeCompare(b.id)));
                setError(failures.length ? "Some updates could not be refreshed. Please try again later." : "");
            }
            pending = false;
        }
        load();
        const timer = window.setInterval(load, 60000);
        document.addEventListener("visibilitychange", load);
        window.addEventListener("votara-student-activity", load);
        window.addEventListener("votara-platform-update", load);
        return () => {
            live = false;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", load);
            window.removeEventListener("votara-student-activity", load);
            window.removeEventListener("votara-platform-update", load);
        };
    }, [admin, audience, onStatus]);

    useEffect(() => {
        if (!open) return;
        const dismiss = event => {
            if (event.key === "Escape") {
                if (selectedNotification) setSelectedNotification(null);
                else setOpen(false);
            }
            const clickedDialog = event.target.closest?.(".platform-notification-overlay");
            if (event.type === "pointerdown" && !container.current?.contains(event.target) && !clickedDialog) {
                setOpen(false);
                setSelectedNotification(null);
            }
        };
        document.addEventListener("keydown", dismiss);
        document.addEventListener("pointerdown", dismiss);
        return () => {
            document.removeEventListener("keydown", dismiss);
            document.removeEventListener("pointerdown", dismiss);
        };
    }, [open, selectedNotification]);

    const unread=unreadNotifications(items,read);
    return <div className="platform-notifications" ref={container}>
        <button type="button" className="platform-bell" aria-label="Notifications" aria-expanded={open} onClick={() => setOpen(value => !value)}>
            {iconSrc ? <img src={iconSrc} alt="" width="24" height="24" /> : <FiBell aria-hidden="true" />}{unread.length > 0 && <span aria-label={`${unread.length} unread notifications`}>{unread.length}</span>}
        </button>
        {open && <NotificationPanel
            items={items}
            read={read}
            unreadCount={unread.length}
            error={error}
            theme={notificationTheme}
            onClose={() => setOpen(false)}
            onMarkAllRead={() => markRead(items)}
            onSelect={item => {
                markRead([item]);
                setSelectedNotification(item);
            }}
        />}
        {selectedNotification && createPortal(<div className="platform-notification-overlay" data-theme={notificationTheme === "light" ? "light" : "dark"} data-audience={role} onMouseDown={event => { if (event.target === event.currentTarget) setSelectedNotification(null); }}>
            <section className="platform-notification-dialog" role="dialog" aria-modal="true" aria-labelledby="platform-notification-title">
                <header><h2 id="platform-notification-title">Notification details</h2><button type="button" aria-label="Close notification" onClick={() => setSelectedNotification(null)}><FiX /></button></header>
                <div className="platform-notification-message">{selectedNotification.text}</div>
                <footer>
                    <button type="button" className="platform-notification-close" onClick={() => setSelectedNotification(null)}>Close</button>
                    {(selectedNotification.path || selectedNotification.action) && <button type="button" className="platform-notification-open" onClick={() => {
                        const item = selectedNotification;
                        setSelectedNotification(null);
                        setOpen(false);
                        if (item.path) navigate(item.path);
                        else if (onAction) onAction(item.action);
                        else if (admin) navigate("/admin/settings?section=" + (item.action === "announcement" ? "platform-notices" : "configuration"));
                        else navigate(audience === "eb" ? "/electoral-board/dashboard" : "/student-dashboard");
                    }}>Open related page</button>}
                </footer>
            </section>
        </div>, document.body)}
    </div>;
}
