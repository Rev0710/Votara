import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { FiBarChart2, FiCheckCircle, FiChevronDown, FiSearch, FiX } from "react-icons/fi";
import "./CandidateResults.css";

const number = (value) => Number(value || 0).toLocaleString();
const percent = (value) => `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
const votesFor = (candidate) => Number(candidate?.voteCount || 0);
const resultState = (position) => {
    if (position.resultStatus === "winner") return { style: "winner", label: "Result available" };
    if (position.resultStatus === "tie") return { style: "tie", label: "Tied result" };
    return { style: "empty", label: "No votes" };
};

export default function CandidateResults({ positions = [], loading = false }) {
    const resultsRef = useRef(null);
    const [search, setSearch] = useState("");
    const [positionId, setPositionId] = useState("all");
    const candidateCount = positions.reduce((total, position) => total + (position.candidates?.length || 0), 0);
    const filteredPositions = useMemo(() => {
        const query = search.trim().toLowerCase();
        return positions.filter((position) => positionId === "all" || String(position.id) === positionId).map((position) => {
            const positionMatches = !query || String(position.name || "").toLowerCase().includes(query);
            const candidates = positionMatches ? position.candidates || [] : (position.candidates || []).filter((candidate) =>
                [candidate.fullName, candidate.partyListName].some((value) => String(value || "").toLowerCase().includes(query)));
            return { position, candidates, positionMatches };
        }).filter(({ candidates, positionMatches }) => positionMatches || candidates.length > 0);
    }, [positions, positionId, search]);
    const visibleCount = filteredPositions.reduce((total, group) => total + group.candidates.length, 0);
    const hasFilters = Boolean(search.trim() || positionId !== "all");
    const clearFilters = () => { setSearch(""); setPositionId("all"); };

    useLayoutEffect(() => {
        const motion = gsap.matchMedia();
        motion.add("(prefers-reduced-motion: no-preference)", () => {
            const cards = resultsRef.current?.querySelectorAll(".cr-position");
            if (cards?.length) gsap.from(cards, {
                y: 8, opacity: 0, duration: 0.28, stagger: 0.03,
                ease: "power2.out", clearProps: "transform,opacity",
            });
        });
        return () => motion.revert();
    }, [positions]);

    return (
        <section ref={resultsRef} className="candidate-results" aria-labelledby="candidate-results-title" aria-busy={loading}>
            <header className="cr-heading">
                <div><h2 id="candidate-results-title">Candidate results</h2><p>Vote totals and candidate standings for each position.</p></div>
                <div className="cr-totals"><span><strong>{number(candidateCount)}</strong> candidates</span><span><strong>{number(positions.length)}</strong> positions</span></div>
            </header>
            {positions.length > 0 && <div className="cr-toolbar">
                <label className="cr-position-filter" htmlFor="candidate-results-position"><span className="cr-sr-only">Position</span><select id="candidate-results-position" value={positionId} onChange={(event) => setPositionId(event.target.value)}><option value="all">All positions</option>{positions.map((position) => <option key={position.id} value={String(position.id)}>{position.name}</option>)}</select><FiChevronDown className="cr-select-caret" aria-hidden="true" /></label>
                <label className="cr-search"><FiSearch aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search candidates or parties" aria-label="Search candidate results" /></label>
                {hasFilters && <button className="cr-clear" onClick={clearFilters}><FiX aria-hidden="true" />Clear filters</button>}
            </div>}
            {!positions.length ? <div className="cr-empty"><FiBarChart2 aria-hidden="true" /><h3>No candidate results available</h3><p>Positions and candidates will appear here when available for this election.</p></div> : !filteredPositions.length ? <div className="cr-empty"><FiSearch aria-hidden="true" /><h3>No matching results</h3><p>Try another candidate name, party, or position.</p><button className="cr-reset" onClick={clearFilters}>Show all results</button></div> : <div className="cr-position-list">
                {filteredPositions.map(({ position, candidates }) => {
                    const allCandidates = position.candidates || [];
                    const totalVotes = allCandidates.reduce((total, candidate) => total + votesFor(candidate), 0);
                    const topVotes = Math.max(0, ...allCandidates.map(votesFor));
                    const result = resultState(position);
                    return <article className={`cr-position ${allCandidates.length > 1 || filteredPositions.length === 1 ? "is-wide" : ""}`} key={position.id} aria-labelledby={`cr-position-${position.id}`}>
                        <header className="cr-position-heading"><div><h3 id={`cr-position-${position.id}`}>{position.name}</h3><p>{number(allCandidates.length)} {allCandidates.length === 1 ? "candidate" : "candidates"}<span aria-hidden="true">·</span>{number(totalVotes)} {totalVotes === 1 ? "vote cast" : "votes cast"}</p></div><span className={`cr-result-status is-${result.style}`}>{result.style === "winner" && <FiCheckCircle aria-hidden="true" />}{result.label}</span></header>
                        {candidates.length ? <ol className={`cr-standings ${candidates.length > 1 ? "has-comparison" : ""}`} aria-label={`${position.name} candidate standings`}>
                            {candidates.map((candidate) => {
                                const votes = votesFor(candidate);
                                const share = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                                const isWinner = Boolean(position.winner && position.winner.id === candidate.id);
                                const isTied = position.resultStatus === "tie" && topVotes > 0 && votes === topVotes;
                                return <li className={`cr-standing ${isWinner ? "is-winner" : ""}`} key={candidate.id}>
                                    <span className="cr-avatar" aria-hidden="true">{candidate.profilePicture ? <img src={candidate.profilePicture} alt="" loading="lazy" /> : String(candidate.fullName || "C").trim().charAt(0).toUpperCase()}</span>
                                    <div className="cr-candidate-copy"><strong>{candidate.fullName || "Unnamed candidate"}</strong><span>{candidate.partyListName || "No party listed"}</span>{isWinner && <span className="cr-candidate-status is-winner"><FiCheckCircle aria-hidden="true" />Winner</span>}{isTied && <span className="cr-candidate-status is-tied">Tied for first</span>}</div>
                                    <div className="cr-votes"><strong>{number(votes)}</strong><span>{votes === 1 ? "vote" : "votes"}</span></div>
                                    <div className="cr-share"><div className="cr-share-track" aria-hidden="true"><span style={{ width: `${Math.min(100, Math.max(0, share))}%` }} /></div><span><span className="cr-sr-only">Vote share </span>{percent(share)}</span></div>
                                </li>;
                            })}
                        </ol> : <div className="cr-position-empty">No candidates are listed for this position.</div>}
                    </article>;
                })}
            </div>}
            <footer className="cr-footer"><span role="status">Showing {number(visibleCount)} of {number(candidateCount)} candidates</span><span>Read-only results from submitted ballots.</span></footer>
        </section>
    );
}
