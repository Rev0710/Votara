import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiEdit2, FiMoreVertical, FiPower, FiTrash2, FiUsers } from "react-icons/fi";
import "./PartyListActionMenu.css";

export default function PartyListActionMenu({ party, onEdit, onCandidates, onActivate, onDeactivate, onDelete, actionLoading }) {
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState(null);
    const triggerRef = useRef(null);
    const menuRef = useRef(null);
    const menuId = useId();

    useLayoutEffect(() => {
        if (!open) return;
        const anchor = triggerRef.current.getBoundingClientRect();
        const menu = menuRef.current.getBoundingClientRect();
        const viewportWidth = document.documentElement.clientWidth;
        const below = anchor.bottom + 7;
        const top = below + menu.height <= window.innerHeight - 8 ? below : anchor.top - menu.height - 7;
        setPosition({
            top: Math.max(8, Math.min(top, window.innerHeight - menu.height - 8)),
            left: Math.max(8, Math.min(anchor.right - menu.width, viewportWidth - menu.width - 8)),
        });
    }, [open]);

    useLayoutEffect(() => {
        if (open && position) menuRef.current.querySelector("button:not(:disabled)")?.focus({ preventScroll: true });
    }, [open, position]);

    useEffect(() => {
        if (!open) return;
        const outside = (event) => {
            if (!menuRef.current?.contains(event.target) && !triggerRef.current?.contains(event.target)) setOpen(false);
        };
        const scroll = (event) => { if (!menuRef.current?.contains(event.target)) setOpen(false); };
        const resize = () => setOpen(false);
        document.addEventListener("pointerdown", outside);
        document.addEventListener("focusin", outside);
        document.addEventListener("scroll", scroll, true);
        window.addEventListener("resize", resize);
        return () => {
            document.removeEventListener("pointerdown", outside);
            document.removeEventListener("focusin", outside);
            document.removeEventListener("scroll", scroll, true);
            window.removeEventListener("resize", resize);
        };
    }, [open]);

    const run = (callback) => { setOpen(false); callback?.(); };
    const handleKeys = (event) => {
        const items = [...menuRef.current.querySelectorAll("button:not(:disabled)")];
        const index = items.indexOf(document.activeElement);
        let next;
        if (event.key === "ArrowDown") next = (index + 1) % items.length;
        if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = items.length - 1;
        if (next !== undefined) { event.preventDefault(); items[next]?.focus(); }
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();
        }
    };

    const changing = actionLoading === `${party?.is_active ? "deactivate" : "activate"}-${party?.id}`;

    return (
        <>
            <button
                type="button"
                className="plm-party-menu-trigger"
                ref={triggerRef}
                aria-label={`Actions for ${party?.name || "party list"}`}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
                onClick={() => { setPosition(null); setOpen(value => !value); }}
                onKeyDown={(event) => { if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); } }}
            >
                <FiMoreVertical aria-hidden="true" />
            </button>
            {open && createPortal(
                <div
                    className="plm-party-action-menu"
                    role="menu"
                    aria-label={`Actions for ${party?.name || "party list"}`}
                    id={menuId}
                    ref={menuRef}
                    style={{ top: position?.top || 0, left: position?.left || 0, visibility: position ? "visible" : "hidden" }}
                    onKeyDown={handleKeys}
                >
                    <button type="button" role="menuitem" onClick={() => run(onCandidates)}><FiUsers aria-hidden="true" />Candidates</button>
                    <button type="button" role="menuitem" onClick={() => run(onEdit)}><FiEdit2 aria-hidden="true" />Edit Party List</button>
                    <button type="button" role="menuitem" disabled={changing} onClick={() => run(party?.is_active ? onDeactivate : onActivate)}>
                        <FiPower aria-hidden="true" />{changing ? (party?.is_active ? "Deactivating..." : "Activating...") : (party?.is_active ? "Deactivate" : "Activate")}
                    </button>
                    <div className="plm-party-menu-divider" role="separator" />
                    <button type="button" role="menuitem" className="plm-party-menu-delete" disabled={actionLoading === `delete-${party?.id}`} onClick={() => run(onDelete)}>
                        <FiTrash2 aria-hidden="true" />{actionLoading === `delete-${party?.id}` ? "Deleting..." : "Delete Party List"}
                    </button>
                </div>,
                document.querySelector(".eb-workspace") || document.body
            )}
        </>
    );
}
