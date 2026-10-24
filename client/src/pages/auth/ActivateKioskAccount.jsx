import React, {useEffect,useId,useRef,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import api from "../../services/api";
import "./ActivateKioskAccount.css";

export default function ActivateKioskAccount() {
    const id = useId();
    const navigate = useNavigate();
    const submitInFlight = useRef(false);
    const heading = useRef(null);
    const [step,setStep] = useState("request");
    const [form,setForm] = useState({activationCode:"",email:"",otp:"",password:"",confirmPassword:"",contactNumber:""});
    const [challengeId,setChallengeId] = useState("");
    const [busy,setBusy] = useState(false);
    const [seconds,setSeconds] = useState(0);
    const [error,setError] = useState("");
    const [message,setMessage] = useState("");
    const [studentId,setStudentId] = useState("");
    const [showPassword,setShowPassword] = useState(false);
    const [showConfirmPassword,setShowConfirmPassword] = useState(false);
    const passwordRequirements = [
        ["Exactly 8 characters",form.password.length===8],
        ["At least one uppercase letter",/[A-Z]/.test(form.password)],
        ["At least one lowercase letter",/[a-z]/.test(form.password)],
        ["At least one number",/[0-9]/.test(form.password)],
        ["At least one special character",/[^A-Za-z0-9]/.test(form.password)],
    ];
    const passwordValid = passwordRequirements.every(([,met])=>met);
    const connectionMessage = (err,fallback) => err.response?.data?.message || (!err.response && (err.isAxiosError || err.code==="ERR_NETWORK")
        ? "We couldn't reach the VOTARA server. Check your connection and try again. Your details have not been cleared. If activation already completed, use Student Login with your new password."
        : fallback);
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
            setError(connectionMessage(err,"Unable to send the email code. Please try again."));
            setSeconds(Math.max(0,Number(err.response?.data?.retryAfter || err.response?.headers?.["retry-after"]) || 0));
        } finally { setBusy(false); }
    };
    const complete = async event => {
        event.preventDefault();
        if (busy || submitInFlight.current || !challengeId) return;
        if (!passwordValid) {setError("Complete all password requirements before activating your account.");return;}
        if (form.password!==form.confirmPassword) {setError("Your passwords do not match.");return;}
        submitInFlight.current=true;
        setBusy(true);setError("");setMessage("");
        try {
            const {data} = await api.post("/auth/kiosk-online-access/complete",{...form,challengeId});
            if (!data?.success || !data.studentId) throw new Error("Activation confirmation was not returned.");
            setStudentId(data.studentId);setChallengeId("");setStep("done");
            setMessage("Your account is activated. Signing you in…");
            try {
                // Use the normal endpoint: it claims the same database-backed student session as Student Login.
                const {data:login} = await api.post("/auth/student-login",{studentId:data.studentId,password:form.password});
                if (!login?.token || !login.student) throw new Error("Sign-in confirmation was not returned.");
                // Keep any separate EB/operator session intact; student routes choose their own token.
                localStorage.removeItem("votaraStudentToken");localStorage.removeItem("studentToken");
                localStorage.setItem("votaraStudent",JSON.stringify(login.student));
                localStorage.setItem("votaraToken",login.token);
                const mustChange=login.mustChangePassword===true || login.student.mustChangePassword===true;
                const needsPhoto=login.needsProfilePicture===true || login.student.needsProfilePicture===true;
                navigate(mustChange ? "/change-password" : needsPhoto ? "/upload-profile-picture" : "/student-dashboard",{replace:true});
            } catch (loginError) {
                setMessage("Your email and password were saved successfully. Your account is ready.");
                setError(loginError.response?.data?.message || "Automatic sign-in could not finish. Go to Student Login and use your Student ID and new VOTARA password. You do not need to activate again.");
            } finally {
                setForm({activationCode:"",email:"",otp:"",password:"",confirmPassword:"",contactNumber:""});
                setShowPassword(false);setShowConfirmPassword(false);
            }
        } catch (err) {setError(connectionMessage(err,"Unable to activate online access. Please try again."));}
        finally {setBusy(false);submitInFlight.current=false;}
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
                    <button type="button" disabled={busy} onClick={()=>{setStep("request");setShowPassword(false);setShowConfirmPassword(false);setChallengeId("");setError("");setMessage("");setForm(current=>({...current,otp:"",password:"",confirmPassword:""}));}}>Change email or activation code</button>
                </div>
                <label htmlFor={`${id}-password`}>Create your VOTARA password <span>(required)</span></label>
                <div className="kiosk-password-input">
                    <input id={`${id}-password`} name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={8} value={form.password} onChange={change} required disabled={busy} aria-describedby={`${id}-password-help ${id}-password-rules`} />
                    <button type="button" aria-controls={`${id}-password`} aria-pressed={showPassword} aria-label={showPassword ? "Hide VOTARA password" : "Show VOTARA password"} onClick={()=>setShowPassword(value=>!value)} disabled={busy}>{showPassword ? "Hide" : "Show"}</button>
                </div>
                <small id={`${id}-password-help`}>Create a password for VOTARA. This is not your email account password.</small>
                <div className="kiosk-password-requirements"><strong>Password requirements</strong>
                    <ul id={`${id}-password-rules`}>{passwordRequirements.map(([label,met])=><li key={label} data-met={met}><span aria-hidden="true">{met ? "✓" : "○"}</span><span>{label}<span className="kiosk-visually-hidden">{met ? ": met" : ": not yet met"}</span></span></li>)}</ul>
                </div>
                <label htmlFor={`${id}-confirm`}>Confirm your VOTARA password <span>(required)</span></label>
                <div className="kiosk-password-input">
                    <input id={`${id}-confirm`} name="confirmPassword" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" minLength={8} maxLength={8} value={form.confirmPassword} onChange={change} required disabled={busy} aria-describedby={`${id}-match`} />
                    <button type="button" aria-controls={`${id}-confirm`} aria-pressed={showConfirmPassword} aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"} onClick={()=>setShowConfirmPassword(value=>!value)} disabled={busy}>{showConfirmPassword ? "Hide" : "Show"}</button>
                </div>
                <small id={`${id}-match`}>{form.confirmPassword ? form.confirmPassword===form.password ? "Passwords match." : "Passwords do not match yet." : "Enter the same VOTARA password again."}</small>
                <label htmlFor={`${id}-phone`}>Contact number <span>(optional)</span></label>
                <input id={`${id}-phone`} name="contactNumber" type="tel" autoComplete="tel" maxLength={26} value={form.contactNumber} onChange={change} disabled={busy} />
                <small>This is a contact detail; it is not used to sign in.</small>
                <button className="kiosk-account-primary" disabled={busy || !challengeId || !passwordValid || form.password!==form.confirmPassword}>{busy ? "Activating…" : "Verify email and activate account"}</button>
            </form>}
            {step==="done" && <div><p>Your Student ID is <strong>{studentId}</strong>. Use this ID and the VOTARA password you just created if automatic sign-in could not finish.</p><Link className="kiosk-account-primary" to="/student-login">Go to student login</Link></div>}
            {step!=="done" && <p className="kiosk-account-signin">Already have online access? <Link to="/student-login">Sign in</Link></p>}
        </section>
    </main>;
}