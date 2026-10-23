import React, { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { FiBell, FiCheck, FiCheckCircle, FiFileText, FiInfo, FiTool, FiX } from "react-icons/fi";
import { notificationVersion } from "./notificationReadState";
import "./NotificationPanel.css";

function notificationPreview(item) {
    const report = item.text.match(/^(Student|Electoral Board) · ([^:]+): ([\s\S]+)$/);
    if (report) return { label: report[1], reference: report[2], message: report[3], Icon: FiFileText };
    if (/^(maintenance|scheduled|notice)$/.test(item.id)) {
        return { label: item.id === "notice" ? "Platform notice" : "Maintenance", message: item.text, Icon: item.id === "notice" ? FiInfo : FiTool };
    }
    if (item.id.startsWith("report-")) return { label: "Your report", message: item.text, Icon: FiFileText };
    if (item.id.startsWith("ballot-")) return { label: "Ballot recorded", message: item.text, Icon: FiCheckCircle };
    return { label: item.id.startsWith("results-") ? "Election results" : "Election update", message: item.text, Icon: FiBell };
}

export default function NotificationPanel({ items, read, unreadCount, error, theme, onClose, onMarkAllRead, onSelect }) {
    const panel = useRef(null);
    useLayoutEffect(() => {
        const fitPanel = () => {
            const top = panel.current.getBoundingClientRect().top;
            panel.current.style.maxHeight = `${Math.min(570, Math.max(0, window.innerHeight - top - 16))}px`;
        };
        fitPanel();
        window.addEventListener("resize", fitPanel);
        const motion = gsap.matchMedia();
        motion.add("(prefers-reduced-motion: no-preference)", () => {
            gsap.from(panel.current, { opacity: 0, y: -6, duration: .2, ease: "power2.out", clearProps: "transform,opacity" });
        });
        return () => {
            window.removeEventListener("resize", fitPanel);
            motion.revert();
        };
    }, []);

    return <section ref={panel} className="platform-notification-panel" data-theme={theme === "light" ? "light" : "dark"} aria-label="Platform notifications">
        <header className="notification-panel-heading">
            <div className="notification-panel-title">Notifications <span className="notification-count">{unreadCount}</span></div>
            <button type="button" className="notification-close-button" aria-label="Close notifications" onClick={onClose}><FiX aria-hidden="true" /></button>
        </header>
        <div className="platform-read-controls">
            <span role="status">{unreadCount ? `${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}` : "You're all caught up"}</span>
            {unreadCount > 0 && <button type="button" onClick={onMarkAllRead}><FiCheck aria-hidden="true" /> Mark all as read</button>}
        </div>
        <div className="notification-scroll-list" tabIndex={0} aria-label="Notification list">
            {error && <div className="notification-refresh-message" role="status"><FiInfo aria-hidden="true" /><span>{error}</span></div>}
            {!items.length && !error && <div className="notification-empty"><FiBell aria-hidden="true" /><span>No updates yet</span><span>Your latest notifications will appear here.</span></div>}
            {items.length > 0 && <ul className="notification-items">{items.map(item => {
                const isUnread = read?.[item.id] !== notificationVersion(item);
                const { label, reference, message, Icon } = notificationPreview(item);
                return <li key={item.id} className={isUnread ? "notification-unread" : "notification-read"}>
                    <button type="button" className="platform-notification-item" aria-label={`${isUnread ? "Unread: " : ""}${item.text}`} onClick={() => onSelect(item)}>
                        <span className="notification-item-icon"><Icon aria-hidden="true" /></span>
                        <span className="notification-item-copy">
                            <span className="notification-item-category">{label}</span>
                            <span className="notification-item-message">{message}</span>
                            {reference && <span className="notification-item-reference">{reference}</span>}
                        </span>
                        <span className="notification-unread-dot" aria-hidden="true" />
                    </button>
                </li>;
            })}</ul>}
        </div>
        {items.length > 0 && <footer className="notification-panel-footer">Select a notification to view details</footer>}
    </section>;
}
