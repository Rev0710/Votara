import React, { useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { FiActivity, FiAlertCircle, FiArrowUpRight, FiCheckCircle, FiClock, FiMonitor, FiPlus, FiPower, FiRefreshCw, FiUsers, FiX } from "react-icons/fi";
import "./KioskManagement.css";

const dateTime = value => value
    ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : "—";

function Status({ value = "unknown" }) {
    const status = String(value).toLowerCase();
    return <span className="km-status" data-status={status}><i aria-hidden="true" />{status}</span>;
}

export default function KioskManagementView({
    elections, sessions, activeSession, loading, starting, actionLoading,
    error, success, showStartModal, selectedElection, onSelectElection,
    onDismissError, onRefresh, onOpenKiosk, onCloseSession, onStartSession,
    onOpenStart, onDismissStart,
}) {
    const rootRef = useRef(null);
    const operations = Number(activeSession?.active_operations ?? activeSession?.active_operation_count ?? 0);

    useLayoutEffect(() => {
        if (loading) return undefined;
        const motion = gsap.matchMedia();
        motion.add("(prefers-reduced-motion: no-preference)", () => {
            gsap.from(rootRef.current.querySelectorAll(".km-session-panel, .km-history"), {
                y: 8, opacity: 0, duration: 0.3, stagger: 0.06, clearProps: "transform,opacity",
            });
        });
        return () => motion.revert();
    }, [loading]);

    return <div className="kiosk-page km-page" ref={rootRef}>
        <header className="km-header">
            <div><h1>Kiosk Management</h1><p>Manage assisted voting across your Electoral Board’s devices.</p></div>
            <div className="km-header-actions">
                <button className="km-button km-secondary" onClick={onRefresh} disabled={loading}>
                    <FiRefreshCw aria-hidden="true" />{loading ? "Refreshing…" : "Refresh"}
                </button>
                {!activeSession && <button className="km-button km-primary" onClick={onOpenStart} disabled={loading}>
                    <FiPlus aria-hidden="true" />Start session
                </button>}
            </div>
        </header>

        {success && <div className="km-notice km-success" role="status"><FiCheckCircle aria-hidden="true" /><span>{success}</span></div>}
        {error && <div className="km-notice km-error" role="alert"><FiAlertCircle aria-hidden="true" /><span>{error}</span><button className="km-icon-button" aria-label="Dismiss error" onClick={onDismissError}><FiX /></button></div>}

        {loading ? <div className="km-loading" role="status"><FiRefreshCw aria-hidden="true" /><span>Loading kiosk sessions…</span></div> : <>
            <section className="km-session-panel" aria-labelledby="km-current-session">
                <div className="km-session-header">
                    <div className="km-session-identity">
                        <div className="km-monitor"><FiMonitor aria-hidden="true" /></div>
                        <div><span className="km-overline" id="km-current-session">Current session</span>
                            <h2>{activeSession?.elections?.title || (activeSession ? "Election" : "Ready when you are")}</h2>
                        </div>
                    </div>
                    <Status value={activeSession ? "active" : "offline"} />
                </div>

                {activeSession ? <>
                    <dl className="km-metrics">
                        <div><dt><FiUsers aria-hidden="true" />Students served</dt><dd className="km-metric-number">{activeSession.students_served ?? 0}</dd></div>
                        <div><dt><FiActivity aria-hidden="true" />Students in progress</dt><dd className="km-metric-number">{operations}</dd></div>
                        <div><dt><FiClock aria-hidden="true" />Session started</dt><dd>{dateTime(activeSession.started_at)}</dd></div>
                        <div><dt><FiRefreshCw aria-hidden="true" />Last activity</dt><dd>{dateTime(activeSession.last_activity_at)}</dd></div>
                    </dl>
                    <div className="km-session-body">
                        <div className="km-shared-info"><FiUsers aria-hidden="true" /><div><h3>One session. Multiple devices.</h3><p>Open this session on each device to assist different students at the same time.</p></div></div>
                        {operations > 0 && <div className="km-notice km-warning"><FiActivity aria-hidden="true" /><div><h3>{operations} {operations === 1 ? "student is" : "students are"} being assisted or voting</h3><p>Other devices can continue assisting. Close the session after everyone has finished.</p></div></div>}
                        {activeSession.inactivity_warning && <div className="km-notice km-warning"><FiAlertCircle aria-hidden="true" /><div><h3>No recent activity</h3><p>Continue using the kiosk to keep this session active.</p></div></div>}
                    </div>
                    <footer className="km-session-footer">
                        <span className="km-footer-note"><FiMonitor aria-hidden="true" />Shared with your Electoral Board team</span>
                        <div className="km-session-actions">
                            <button className="km-button km-danger" onClick={onCloseSession} disabled={actionLoading || operations > 0} title={operations > 0 ? "Wait for all students to finish before closing." : "Close this shared session"}><FiPower aria-hidden="true" />{actionLoading ? "Closing…" : "Close session"}</button>
                            <button className="km-button km-primary" onClick={onOpenKiosk} disabled={actionLoading}>Open student kiosk<FiArrowUpRight aria-hidden="true" /></button>
                        </div>
                    </footer>
                </> : <div className="km-empty-session"><p>Start a shared session to register, verify, and assist students with voting at campus kiosks.</p><button className="km-button km-primary" onClick={onOpenStart}><FiPlus aria-hidden="true" />Start kiosk session</button><span>Your team can use the same session across multiple devices.</span></div>}
            </section>

            <section className="km-history" aria-labelledby="km-history-heading">
                <header className="km-history-heading"><div><h2 id="km-history-heading">Session history</h2><p>A record of your team’s kiosk sessions.</p></div><span className="km-history-count">{sessions.length} {sessions.length === 1 ? "session" : "sessions"}</span></header>
                {sessions.length ? <div className="km-table-scroll" tabIndex="0" role="region" aria-label="Kiosk session history">
                    <table className="km-history-table"><thead><tr><th scope="col">Election</th><th scope="col">Status</th><th scope="col">Started</th><th scope="col">Ended</th><th scope="col">Students served</th></tr></thead>
                        <tbody>{sessions.map(session => <tr key={session.id}>
                            <td><span className="km-election-name">{session.elections?.title || "Unknown election"}</span><small>{session.elections?.election_date || "—"}</small></td>
                            <td><Status value={session.session_status} /></td><td>{dateTime(session.started_at)}</td><td>{dateTime(session.ended_at)}</td><td className="km-history-total">{session.students_served ?? 0}</td>
                        </tr>)}</tbody>
                    </table>
                </div> : <div className="km-empty-history"><FiClock aria-hidden="true" /><h3>No sessions yet</h3><p>Your session history will appear here after you start a kiosk session.</p></div>}
            </section>
        </>}

        {showStartModal && <StartSessionDialog
            elections={elections} selectedElection={selectedElection} starting={starting} error={error}
            onSelect={onSelectElection} onClose={onDismissStart} onStart={onStartSession} host={rootRef.current}
        />}
    </div>;
}

function StartSessionDialog({ elections, selectedElection, starting, error, onSelect, onClose, onStart, host }) {
    const dialogRef = useRef(null);
    const selection = elections.find(item => String(item.id) === String(selectedElection));
    useLayoutEffect(() => {
        const previousFocus = document.activeElement;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current?.querySelector("select")?.focus();
        return () => { document.body.style.overflow = overflow; previousFocus?.focus(); };
    }, []);

    const onKeyDown = event => {
        if (event.key === "Escape" && !starting) { event.preventDefault(); onClose(); }
        if (event.key !== "Tab") return;
        const controls = [...dialogRef.current.querySelectorAll("button:not(:disabled), select:not(:disabled)")];
        if (!controls.length) { event.preventDefault(); return; }
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };

    return createPortal(<div className="km-dialog-overlay" onClick={event => { if (event.target === event.currentTarget && !starting) onClose(); }}>
        <section className="km-dialog" role="dialog" aria-modal="true" aria-labelledby="km-start-title" aria-describedby="km-start-description" ref={dialogRef} onKeyDown={onKeyDown} aria-busy={starting}>
            <header className="km-dialog-header"><div><h2 id="km-start-title">Start kiosk session</h2><p id="km-start-description">Choose the election your team will serve.</p></div><button className="km-icon-button" aria-label="Close start session dialog" disabled={starting} onClick={onClose}><FiX /></button></header>
            <div className="km-dialog-body">
                <label htmlFor="km-election">Election</label><select id="km-election" value={selectedElection} onChange={event => onSelect(event.target.value)} disabled={starting}><option value="">Select an election</option>{elections.map(election => <option key={election.id} value={election.id}>{election.title}</option>)}</select>
                {!elections.length && <p className="km-select-help">No elections are available for a kiosk session.</p>}
                {selection && <div className="km-election-selection"><FiMonitor aria-hidden="true" /><div><h3>{selection.title}</h3><p>{selection.election_date || "Date not set"} · {selection.status || "Status unavailable"}</p></div></div>}
                <div className="km-dialog-info"><FiUsers aria-hidden="true" /><p>This creates one shared session for your Electoral Board. Multiple devices can assist different students. The kiosk does not store student vote choices.</p></div>
                {error && <div className="km-notice km-error" role="alert"><FiAlertCircle aria-hidden="true" /><span>{error}</span></div>}
            </div>
            <footer className="km-dialog-actions"><button className="km-button km-secondary" onClick={onClose} disabled={starting}>Cancel</button><button className="km-button km-primary" onClick={onStart} disabled={starting || !selectedElection}><FiPlus aria-hidden="true" />{starting ? "Starting…" : "Start session"}</button></footer>
        </section>
    </div>, host?.closest(".eb-workspace") || document.body);
}
