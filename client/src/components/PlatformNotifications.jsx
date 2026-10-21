import {notificationStorageKey,unreadNotifications,markNotificationsRead,notificationVersion} from "./notificationReadState";
import React, { useEffect, useRef, useState } from "react";
import { FiBell, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./PlatformNotifications.css";

export default function PlatformNotifications({ admin = false, audience = "student", onStatus, onAction, iconSrc }) {
    const role=admin?"admin":audience;
    let account={};try{account=JSON.parse(localStorage.getItem(admin?"votaraAdminUser":audience==="eb"?"votaraEBUser":"votaraStudent")||"{}");}catch{}
    const storageKey=notificationStorageKey(role,account);
    const [read,setRead]=useState(()=>{try{return JSON.parse(localStorage.getItem(storageKey)||"{}");}catch{return {};}});
    useEffect(()=>{try{setRead(JSON.parse(localStorage.getItem(storageKey)||"{}"));}catch{setRead({});}},[storageKey]);
    const markRead=entries=>{const next=markNotificationsRead(read,entries);try{localStorage.setItem(storageKey,JSON.stringify(next));}catch{}setRead(next);};
    const [open, setOpen] = useState(false);
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
                    const response = await api.get("/elections/active");
                    const election = response.data.election;
                    if (!election?.id) return;
                    const label = election.title || election.name || "Current election";
                    next.push({ id: `election-${election.id}`, text: `${label}: ${String(election.status || "scheduled").replaceAll("_", " ")}.`, action: "election" });
                    if (audience === "student") {
                        const vote = await api.get(`/voting/status/${election.id}`);
                        if (vote.data.hasVoted) next.push({ id: `ballot-${election.id}`, text: `Your ballot for ${label} has been recorded.`, action: "vote" });
                    }
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
            if (event.key === "Escape" || (event.type === "pointerdown" && !container.current?.contains(event.target))) setOpen(false);
        };
        document.addEventListener("keydown", dismiss);
        document.addEventListener("pointerdown", dismiss);
        return () => {
            document.removeEventListener("keydown", dismiss);
            document.removeEventListener("pointerdown", dismiss);
        };
    }, [open]);

    const unread=unreadNotifications(items,read);
    return <div className="platform-notifications" ref={container}>
        <button type="button" className="platform-bell" aria-label="Notifications" aria-expanded={open} onClick={() => setOpen(value => !value)}>
            {iconSrc ? <img src={iconSrc} alt="" width="24" height="24" /> : <FiBell aria-hidden="true" />}{unread.length > 0 && <span aria-label={`${unread.length} unread notifications`}>{unread.length}</span>}
        </button>
        {open && <section className="platform-notification-panel" aria-label="Platform notifications">
            <header><strong>Notifications</strong><button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}><FiX /></button></header>
            <div className="platform-read-controls"><span role="status">{unread.length ? `${unread.length} unread` : "All caught up"}</span>{unread.length>0 && <button type="button" onClick={()=>markRead(items)}>Mark all as read</button>}</div>
            {error && <p role="status">{error}</p>}
            {!items.length && !error && <p>No current updates.</p>}
            {items.map(item => <div key={item.id} className={read?.[item.id]===notificationVersion(item)?"notification-read":"notification-unread"}>{item.path || item.action ? <button type="button" onClick={() => {
                markRead([item]);
                setOpen(false);
                if (item.path) navigate(item.path);
                else if (onAction) onAction(item.action);
                else if (admin) navigate("/admin/settings?section=" + (item.action === "announcement" ? "platform-notices" : "configuration"));
                else navigate(audience === "eb" ? "/electoral-board/dashboard" : "/student-dashboard");
            }}>{item.text}</button> : <p>{item.text}</p>}</div>)}
        </section>}
    </div>;
}
