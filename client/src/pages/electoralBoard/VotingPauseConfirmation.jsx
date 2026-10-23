import {useEffect, useRef} from "react";

export default function VotingPauseConfirmation({election,busy,error,onConfirm,onCancel}) {
    const ref=useRef(null);
    const paused=election.voting_paused === true;
    useEffect(()=>{
        const dialog=ref.current;
        dialog.showModal();
        return()=>{if(dialog.open) dialog.close();};
    },[]);
    return <dialog ref={ref} className="election-pause-confirmation"
        aria-labelledby="voting-pause-title" aria-describedby="voting-pause-description"
        onCancel={event=>{event.preventDefault();if(!busy)onCancel();}}
        onClick={event=>{if(event.target===event.currentTarget&&!busy)onCancel();}}>
        <section className="election-pause-confirmation-card" aria-busy={busy}>
            <span className="election-pause-eyebrow">VOTING CONTROL</span>
            <h2 id="voting-pause-title">{paused?"Resume voting?":"Pause voting?"}</h2>
            <p className="election-pause-election">{election.name || election.title}</p>
            <p id="voting-pause-description">{paused
                ? "Students and kiosk users may submit ballots again during the election’s configured voting hours, between 8 AM and 5 PM Manila time."
                : "This will block new ballot submissions from both student accounts and kiosks. Ballots already recorded will be kept. Voting will resume automatically tomorrow at 8:00 AM Manila time."}</p>
            <p>Students will receive a notification after the change is saved.</p>
            {error && <div className="election-feedback election-feedback-error" role="alert">{error}</div>}
            <footer>
                <button type="button" className="election-pause-cancel" disabled={busy} autoFocus onClick={onCancel}>Cancel</button>
                <button type="button" className="election-pause-confirm" disabled={busy} onClick={onConfirm}>
                    {busy?"Saving…":paused?"Confirm resume":"Confirm pause"}
                </button>
            </footer>
        </section>
    </dialog>;
}
