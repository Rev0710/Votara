import React,{useEffect,useId,useRef,useState} from "react";
import api from "../../services/api";
import "./OnlineAccessIssuer.css";

export default function OnlineAccessIssuer({studentId,studentName,disabled}) {
    const dialogRef=useRef(null);
    const codeRef=useRef(null);
    const id=useId();
    const [checked,setChecked]=useState(false);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState("");
    const [result,setResult]=useState(null);
    useEffect(()=>{if(result) {codeRef.current?.focus();codeRef.current?.select();}},[result]);
    const open=()=>{setChecked(false);setError("");setResult(null);dialogRef.current?.showModal();};
    const issue=async event=>{
        event.preventDefault(); if (busy || !checked) return;
        setBusy(true); setError("");
        try {
            const {data}=await api.post(`/electoral-board/in-person-verification/${studentId}/online-access`,{physicalIdChecked:checked});
            setResult(data);
        } catch(err) {setError(err.response?.data?.message || "Unable to issue online activation. Please try again.");}
        finally {setBusy(false);}
    };
    return <>
        <button type="button" className="secondary-button" disabled={disabled} onClick={open}>Activate Online Access</button>
        <dialog ref={dialogRef} className="online-access-issuer" aria-labelledby={`${id}-title`} aria-describedby={`${id}-intro`} aria-busy={busy}
            onCancel={event=>{if(busy)event.preventDefault();}} onClose={()=>setResult(null)}>
            <h2 id={`${id}-title`}>Activate online access</h2>
            <p id={`${id}-intro`}>For {studentName || "this student"}'s existing approved account. Their recorded vote will remain unchanged.</p>
            {error && <p className="online-access-issuer-error" role="alert">{error}</p>}
            {!result ? <form onSubmit={issue}>
                <label className="online-access-issuer-check"><input type="checkbox" checked={checked} onChange={event=>setChecked(event.target.checked)} disabled={busy} required autoFocus />
                    <span>I checked this student's physical ID for this activation request.</span></label>
                <p>For approved students without email who have not created a personal password. Activate their account first if needed.</p>
                <div className="online-access-issuer-actions"><button type="button" disabled={busy} onClick={()=>dialogRef.current?.close()}>Cancel</button>
                    <button type="submit" disabled={busy || !checked}>{busy ? "Generating…" : "Generate activation code"}</button></div>
            </form> : <div>
                <label htmlFor={`${id}-code`}>One-time activation code</label>
                <input ref={codeRef} id={`${id}-code`} value={result.activationCode} readOnly onFocus={event=>event.target.select()} autoComplete="off" spellCheck={false} />
                <p role="status">{result.message}</p>
                <p>Expires: {new Date(result.expiresAt).toLocaleString("en-PH",{timeZone:"Asia/Manila",dateStyle:"medium",timeStyle:"short"})} (Asia/Manila).</p>
                <p>Ask the student to open Student Login → “Already registered at the kiosk? Activate your account.” Give the code only to that student. It is shown here only for this session.</p>
                <div className="online-access-issuer-actions"><button type="button" onClick={()=>{dialogRef.current?.close();setResult(null);}}>Close</button></div>
            </div>}
        </dialog>
    </>;
}