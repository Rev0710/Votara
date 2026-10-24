import React,{useId} from "react";
export const KIOSK_ABSTAIN = "__abstain__";
export default function KioskBallotPosition({position,value,onSelect,disabled}) {
    const id=useId();
    const candidates=position.candidates || [];
    const options=[...candidates.map(candidate=>({id:candidate.id,name:candidate.full_name || candidate.fullName || candidate.name,description:candidate.platform})),
        {id:KIOSK_ABSTAIN,name:"Abstain",description:"I choose not to vote for any candidate for this position."}];
    return <fieldset className="kiosk-position-card" aria-describedby={`${id}-help`}>
        <legend>{position.name}</legend>
        {position.description && <p>{position.description}</p>}
        <p id={`${id}-help`} className="kiosk-position-help">Choose a candidate or select Abstain. You may change your choice before submitting.</p>
        {!candidates.length && <p className="kiosk-empty-candidates">No active candidates are available. You may abstain from this position.</p>}
        <div className="kiosk-candidate-grid">{options.map(option=><label key={option.id} className={`kiosk-candidate ${value===option.id ? "selected" : ""}`}>
            <input type="radio" name={`position-${position.id}`} value={option.id} checked={value===option.id} disabled={disabled} onChange={()=>onSelect(position.id,option.id)} />
            <span><strong>{option.name}</strong>{option.description && <small>{option.description}</small>}</span>
        </label>)}</div>
    </fieldset>;
}