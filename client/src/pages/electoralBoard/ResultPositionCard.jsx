import React, { useId, useLayoutEffect, useRef } from "react";
import { FiAlertCircle, FiCheckCircle, FiClock, FiUser } from "react-icons/fi";
import gsap from "gsap";
import "./ResultPositionCard.css";

const votesFor = candidate => Math.max(0, Number(candidate.voteCount) || 0);

export default function ResultPositionCard({ position }) {
    const titleId = useId();
    const cardRef = useRef(null);
    const candidates = position.candidates || [];
    const totalVotes = candidates.reduce((sum, candidate) => sum + votesFor(candidate), 0);
    const status = position.resultStatus;
    const state = status === "winner"
        ? { label: "Result available", Icon: FiCheckCircle }
        : status === "tie"
            ? { label: "Tie recorded", Icon: FiAlertCircle }
            : { label: "No votes recorded", Icon: FiClock };

    useLayoutEffect(() => {
        const motion = gsap.matchMedia();
        motion.add("(prefers-reduced-motion: no-preference)", () => {
            gsap.from(cardRef.current, {
                y: 8, opacity: 0, duration: 0.28,
                ease: "power2.out", clearProps: "transform,opacity",
            });
        });
        return () => motion.revert();
    }, [position.id]);

    return <section className="rp-card" ref={cardRef} aria-labelledby={titleId}>
        <header className="rp-header">
            <div className="rp-heading"><h3 id={titleId}>{position.name}</h3>{position.description && <p>{position.description}</p>}
                <div className="rp-summary"><span>{candidates.length} {candidates.length === 1 ? "candidate" : "candidates"}</span><span aria-hidden="true">·</span><span>{totalVotes.toLocaleString()} {totalVotes === 1 ? "vote" : "votes"} recorded</span></div>
            </div>
            <span className="rp-status" data-status={status}><state.Icon aria-hidden="true" />{state.label}</span>
        </header>

        {candidates.length ? <ol className="rp-ranking" aria-label={`${position.name} candidate results`}>
            {candidates.map((candidate, index) => {
                const votes = votesFor(candidate);
                const share = totalVotes > 0 ? votes / totalVotes * 100 : 0;
                const isLeader = status === "winner" && index === 0;
                return <li className="rp-candidate" data-leading={isLeader} key={candidate.id || index}>
                    <span className="rp-rank" aria-label={`Rank ${index + 1}`}>{String(index + 1).padStart(2, "0")}</span>
                    <CandidateAvatar src={candidate.profilePicture} />
                    <div className="rp-candidate-content"><strong>{candidate.fullName}</strong><span className="rp-party">{candidate.partyListName || "Independent"}</span>
                        <div className="rp-share-track" aria-hidden="true"><i style={{ width: `${share}%` }} /></div>
                    </div>
                    <div className="rp-total"><div><strong>{votes.toLocaleString()}</strong><span>{votes === 1 ? "vote" : "votes"}</span></div><span className="rp-share" title="Share of votes recorded for this position">{share.toFixed(1)}%</span></div>
                </li>;
            })}
        </ol> : <div className="rp-empty"><FiUser aria-hidden="true" /><p>No active candidates are configured for this position.</p></div>}

        {status === "tie" && <div className="rp-tie-note"><FiAlertCircle aria-hidden="true" /><p>Two or more candidates share the highest vote count. No winner has been automatically selected.</p></div>}
    </section>;
}

function CandidateAvatar({ src }) {
    const [failed, setFailed] = React.useState(false);
    React.useEffect(() => setFailed(false), [src]);
    return src && !failed
        ? <img className="rp-avatar" src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
        : <div className="rp-avatar rp-avatar-placeholder"><FiUser aria-hidden="true" /></div>;
}
