import React, {useEffect,useId,useRef,useState} from "react";
import {Link} from "react-router-dom";
import api from "../../services/api";
import "./ActivateKioskAccount.css";

export default function ActivateKioskAccount() {
    const id = useId();
    const heading = useRef(null);
    const [step,setStep] = useState("request");
    const [form,setForm] = useState({activationCode:"",email:"",otp:"",password:"",confirmPassword:"",contactNumber:""});
    const [challengeId,setChallengeId] = useState("");
    const [busy,setBusy] = useState(false);
    const [seconds,setSeconds] = useState(0);
    const [error,setError] = useState("");
    const [message,setMessage] = useState("");
    const [studentId,setStudentId] = useState("");
    useEffect(() => { if (!seconds) return; const timer=setTimeout(()=>setSeconds(value=>Math.max(0,value-1)),1000); return ()=>clearTimeout(timer); },[seconds]);
    useEffect(() => { heading.current?.focus(); },[step]);
    const change = event => setForm(current=>({...current,[event.target.name]:event.target.value}));
    const requestCode = async event => {
        event.preventDefault();
        if (busy || seconds>0) return;
        setBusy(true); setError(""); setMessage(""); setChallengeId("");
        try {
            const {data} = await api.post("/auth/kiosk-online-access/request-code",{activationCode:form.activationCode,email:form.email});
            setChallengeId(data.challengeId); setSeconds(data.retryAfter || 30);
            setForm(current=>({...current,otp:""})); setMessage(data.message); setStep("verify");
        } catch (err) {
            setError(err.response?.data?.message || "Unable to send the email code. Please try again.");
            setSeconds(Math.max(0,Number(err.response?.data?.retryAfter || err.response?.headers?.["retry-after"]) || 0));
        } finally { setBusy(false); }
    };
    const complete = async event => {
        event.preventDefault();
        if (busy || !challengeId) return;
        if (form.password!==form.confirmPassword) { setError("Your passwords do not match."); return; }
        setBusy(true); setError(""); setMessage("");
        try {
            const {data} = await api.post("/auth/kiosk-online-access/complete",{...form,challengeId});
            setStudentId(data.studentId); setMessage(data.message);
            setForm({activationCode:"",email:"",otp:"",password:"",confirmPassword:"",contactNumber:""});
            setChallengeId(""); setStep("done");
        } catch (err) { setError(err.response?.data?.message || "Unable to activate online access. Please try again."); }
        finally { setBusy(false); }
    };
    return <main className="kiosk-account-page">
        <section className="kiosk-account-card" aria-labelledby={`${id}-title`} aria-busy={busy}>
            <Link className="kiosk-account-back" to="/student-login">← Back to student login</Link>
            <p className="kiosk-account-kicker">VOTARA · STUDENT ACCOUNT</p>
            <h1 id={`${id}-title`} ref={heading} tabIndex={-1}>{step==="done" ? "Your online access is ready" : "Activate your kiosk account"}</h1>
            <p className="kiosk-account-intro">Use your existing approved account. Your registration and previous vote stay recorded.</p>
            {step!=="done" && <ol className="kiosk-account-steps" aria-label="Activation progress"><li aria-current={step==="request" ? "step" : undefined}>1. Activation code</li><li aria-current={step==="verify" ? "step" : undefined}>2. Email and password</li></ol>}
            {error && <p className="kiosk-account-error" role="alert">{error}</p>}
            {message && <p className="kiosk-account-status" role="status">{message}</p>}
            {step==="request" && <form onSubmit={requestCode}>
                <p>Ask the Electoral Board to check your ID and issue an online activation code. The code is valid for 30 minutes and can be used once.</p>
                <label htmlFor={`${id}-activation`}>Activation code from EB</label>
                <input id={`${id}-activation`} name="activationCode" value={form.activationCode} onChange={change} required maxLength={48} autoComplete="off" spellCheck={false} disabled={busy} aria-describedby={`${id}-code-help`} />
                <small id={`${id}-code-help`}>Enter or paste the full 32-character code. Keep it private.</small>
                <label htmlFor={`${id}-email`}>Your email address</label>
                <input id={`${id}-email`} name="email" type="email" value={form.email} onChange={change} required maxLength={254} autoComplete="email" disabled={busy} />
                <button className="kiosk-account-primary" disabled={busy || seconds>0}>{busy ? "Sending code…" : seconds>0 ? `Try again in ${seconds}s` : "Send verification code"}</button>
            </form>}
            {step==="verify" && <form onSubmit={complete}>
                <p>A 6-digit code was sent to <strong>{form.email}</strong>. It expires in 5 minutes.</p>
                <label htmlFor={`${id}-otp`}>Email verification code</label>
                <input id={`${id}-otp`} name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={form.otp} onChange={event=>setForm(current=>({...current,otp:event.target.value.replace(/\D/g,"")}))} required disabled={busy} />
                <div className="kiosk-account-inline-actions">
                    <button type="button" onClick={requestCode} disabled={busy || seconds>0}>{seconds>0 ? `Resend in ${seconds}s` : "Resend code"}</button>
                    <button type="button" disabled={busy} onClick={()=>{setStep("request");setChallengeId("");setError("");setMessage("");setForm(current=>({...current,otp:"",password:"",confirmPassword:""}));}}>Change email or activation code</button>
                </div>
                <label htmlFor={`${id}-password`}>Create a personal password</label>
                <input id={`${id}-password`} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={8} value={form.password} onChange={change} required disabled={busy} aria-describedby={`${id}-password-help`} />
                <small id={`${id}-password-help`}>Use exactly 8 characters, including uppercase, lowercase, a number and a special character.</small>
                <label htmlFor={`${id}-confirm`}>Confirm password</label>
                <input id={`${id}-confirm`} name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={8} value={form.confirmPassword} onChange={change} required disabled={busy} />
                <label htmlFor={`${id}-phone`}>Contact number <span>(optional)</span></label>
                <input id={`${id}-phone`} name="contactNumber" type="tel" autoComplete="tel" maxLength={26} value={form.contactNumber} onChange={change} disabled={busy} />
                <small>This is a contact detail; it is not used to sign in.</small>
                <button className="kiosk-account-primary" disabled={busy || !challengeId}>{busy ? "Activating…" : "Verify email and activate account"}</button>
            </form>}
            {step==="done" && <div><p>Your Student ID is <strong>{studentId}</strong>. Sign in with this ID and the password you just created.</p><Link className="kiosk-account-primary" to="/student-login">Go to student login</Link></div>}
        </section>
    </main>;
}