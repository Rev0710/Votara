import React, { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { FiCheckCircle, FiEdit2, FiX } from "react-icons/fi";
import gsap from "gsap";
import "./CandidateDetailsDialog.css";

export default function CandidateDetailsDialog({ name, studentId, yearLevel, position, partyList, election, platform, profilePicture, isActive, onClose, onEdit }) {
    const dialogRef = useRef(null);
    const closeRef = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    const closeHandler = useRef(onClose);
    closeHandler.current = onClose;

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeRef.current?.focus();

        const context = gsap.context(() => {
            if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                gsap.from(dialogRef.current, {
                    y: 12, opacity: 0, duration: .24,
                    ease: "power2.out", clearProps: "transform,opacity",
                });
            }
        }, dialogRef);

        return () => {
            context.revert();
            document.body.style.overflow = previousOverflow;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, []);

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            event.stopPropagation();
            closeHandler.current();
        }
        if (event.key !== "Tab") return;
        const buttons = [...dialogRef.current.querySelectorAll("button:not(:disabled)")];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
    };

    const details = [
        ["Student ID", studentId],
        ["Year level", yearLevel],
        ["Position", position],
        ["Party list", partyList],
        ["Election", election],
    ];

    return createPortal(
        <div className="eb-candidate-details-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
            <section
                className="eb-candidate-details-dialog"
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onKeyDown={handleKeyDown}
            >
                <header className="eb-candidate-details-header">
                    <div>
                        <h2 id={titleId}>Candidate information</h2>
                        <p id={descriptionId}>Review the candidate’s election information.</p>
                    </div>
                    <button type="button" ref={closeRef} className="eb-candidate-details-close" aria-label="Close candidate information" onClick={onClose}>
                        <FiX aria-hidden="true" />
                    </button>
                </header>

                <div className="eb-candidate-details-body">
                    <div className="eb-candidate-details-profile">
                        <div className="eb-candidate-details-avatar">
                            {profilePicture ? <img src={profilePicture} alt={name || "Candidate"} /> : (name?.trim().charAt(0).toUpperCase() || "C")}
                        </div>
                        <div className="eb-candidate-details-identity">
                            <h3>{name || "Candidate"}</h3>
                            <span className="eb-candidate-details-status" data-active={Boolean(isActive)}>
                                {isActive && <FiCheckCircle aria-hidden="true" />}
                                {isActive ? "Active candidate" : "Inactive candidate"}
                            </span>
                        </div>
                    </div>

                    <dl className="eb-candidate-details-list">
                        {details.map(([label, value]) => (
                            <div className="eb-candidate-details-row" key={label}>
                                <dt>{label}</dt>
                                <dd>{value || "Not provided"}</dd>
                            </div>
                        ))}
                    </dl>

                    <section className="eb-candidate-details-platform">
                        <h4>Platform / description</h4>
                        <p>{platform || "No platform or description provided."}</p>
                    </section>
                </div>

                <footer className="eb-candidate-details-footer">
                    <button type="button" className="eb-candidate-details-secondary" onClick={onClose}>Close</button>
                    <button type="button" className="eb-candidate-details-edit" onClick={onEdit}>
                        <FiEdit2 aria-hidden="true" /> Edit Candidate
                    </button>
                </footer>
            </section>
        </div>,
        document.querySelector(".eb-workspace") || document.body
    );
}
