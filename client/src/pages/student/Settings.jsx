import React, {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    getStudentProfile,
    updateStudentProfile,
} from "../../services/authService";

import api, { getStudentToken } from "../../services/api";
import "./Settings.css";


const Settings = () => {

    const navigate = useNavigate();

    const token = getStudentToken();


    // =====================================================
    // PROFILE STATE
    // =====================================================

    const [profile, setProfile] =
        useState({
            firstName: "",
            middleName: "",
            lastName: "",
            birthday: "",
            contactNumber: "",
            email: "",
            province: "",
            barangay: "",
            city: "",
            profilePicture: null,
        });


    const [editing, setEditing] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [reportView, setReportView] = useState("");
    const [reportDraft, setReportDraft] = useState({ category: "", subject: "", description: "", contactEmail: "", attachment: null });
    const [reportHistory, setReportHistory] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportHistoryTimeline, setReportHistoryTimeline] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [submittedReport, setSubmittedReport] = useState(null);



    // =====================================================
    // LOAD PROFILE
    // =====================================================

    useEffect(() => {

        const loadProfile = async () => {

            if (!token) {
                navigate("/student-login");
                return;
            }

            try {

                const data =
                    await getStudentProfile(
                        token
                    );

                if (data.student) {

                    setProfile({
                        firstName:
                            data.student.firstName ||
                            "",

                        middleName:
                            data.student.middleName ||
                            "",

                        lastName:
                            data.student.lastName ||
                            "",

                        birthday:
                            data.student.birthday ||
                            "",

                        contactNumber:
                            data.student.contactNumber ||
                            "",

                        email:
                            data.student.email ||
                            "",

                        province:
                            data.student.province ||
                            "",

                        barangay:
                            data.student.barangay ||
                            "",

                        city:
                            data.student.city ||
                            "",

                        profilePicture:
                            data.student.profilePicture ||
                            null,
                    });

                }

            } catch (err) {

                console.error(
                    "❌ Profile loading error:",
                    err
                );

                setError(
                    err.message ||
                    "Unable to load profile."
                );

            } finally {

                setLoading(false);

            }
        };


        loadProfile();

    }, [token, navigate]);


    // =====================================================
    // INPUT CHANGE
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;

        setProfile(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );

    };


    // =====================================================
    // EDIT BUTTON
    // =====================================================

    const handleEdit = () => {

        setEditing(true);

        setMessage("");

        setError("");

    };


    // =====================================================
    // DONE BUTTON
    // =====================================================

    const handleDone = async () => {

        if (!token) {
            navigate("/student-login");
            return;
        }

        setSaving(true);

        setMessage("");

        setError("");

        try {

            const data =
                await updateStudentProfile(
                    token,
                    {
                        firstName:
                            profile.firstName,

                        middleName:
                            profile.middleName,

                        lastName:
                            profile.lastName,

                        birthday:
                            profile.birthday,

                        contactNumber:
                            profile.contactNumber,

                        email:
                            profile.email,

                        province:
                            profile.province,

                        barangay:
                            profile.barangay,

                        city:
                            profile.city,
                    }
                );


            if (data.student) {

                setProfile(
                    (previous) => ({
                        ...previous,

                        ...data.student,
                    })
                );

            }


            setEditing(false);

            setMessage(
                "Profile updated successfully."
            );

        } catch (err) {

            console.error(
                "❌ Profile update error:",
                err
            );

            setError(
                err.message ||
                "Unable to update profile."
            );

        } finally {

            setSaving(false);

        }
    };


    // =====================================================
    // CANCEL EDIT
    // =====================================================

    const handleCancel = async () => {

        setEditing(false);

        setMessage("");

        setError("");

        try {

            const data =
                await getStudentProfile(
                    token
                );

            if (data.student) {

                setProfile({
                    firstName:
                        data.student.firstName ||
                        "",

                    middleName:
                        data.student.middleName ||
                        "",

                    lastName:
                        data.student.lastName ||
                        "",

                    birthday:
                        data.student.birthday ||
                        "",

                    contactNumber:
                        data.student.contactNumber ||
                        "",

                    email:
                        data.student.email ||
                        "",

                    province:
                        data.student.province ||
                        "",

                    barangay:
                        data.student.barangay ||
                        "",

                    city:
                        data.student.city ||
                        "",

                    profilePicture:
                        data.student.profilePicture ||
                        null,
                });

            }

        } catch (err) {

            console.error(
                "❌ Reload profile error:",
                err
            );

        }
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="settings-loading">
                Loading profile...
            </div>
        );

    }


    // =====================================================
    // PAGE
    // =====================================================
    const reportCategories = [
        "Voting issue",
        "Account or profile",
        "Candidate information",
        "Election results",
        "Other",
    ];

    const openReportCategory = () => {
        setReportDraft((current) => ({ ...current, contactEmail: current.contactEmail || profile.email || "" }));
        setReportError("");
        setReportView("category");
    };

    const loadReportHistory = async () => {
        setReportLoading(true);
        setReportError("");
        try {
            const response = await api.get("/students/issues");
            setReportHistory(response.data?.reports || []);
            setReportView("history");
        } catch (err) {
            setReportError(err.response?.data?.message || err.message || "Unable to load report history.");
            setReportView("history");
        } finally {
            setReportLoading(false);
        }
    };

    const openReportHistoryDetail = async (report) => {
        setSelectedReport(report);
        setReportHistoryTimeline([]);
        setReportError("");
        setReportView("history-detail");
        try {
            const response = await api.get(`/students/issues/${report.id}/history`);
            setReportHistoryTimeline(response.data?.history || []);
        } catch (err) {
            setReportError(err.response?.data?.message || "Unable to load report updates.");
        }
    };

    const handleReportAttachment = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(file.type)) {
            setReportError("Choose a JPG, PNG, WEBP, or PDF file.");
            event.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setReportError("Attachment must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setReportDraft((current) => ({ ...current, attachment: { name: file.name, type: file.type, data: reader.result } }));
            setReportError("");
        };
        reader.onerror = () => setReportError("Unable to read the selected attachment.");
        reader.readAsDataURL(file);
    };

    const submitIssueReport = async (event) => {
        event.preventDefault();
        setReportSubmitting(true);
        setReportError("");
        try {
            const response = await api.post("/students/issues", reportDraft);
            const report = response.data?.report;
            if (!response.data?.success || !report) throw new Error(response.data?.message || "The report was not saved.");
            setSubmittedReport(report);
            setReportView("submitted");
        } catch (err) {
            setReportError(err.response?.data?.message || err.message || "Unable to submit your report.");
        } finally {
            setReportSubmitting(false);
        }
    };

    const closeReportFlow = () => {
        setReportView("");
        setReportError("");
        setSubmittedReport(null);
        setSelectedReport(null);
        setReportDraft({ category: "", subject: "", description: "", contactEmail: profile.email || "", attachment: null });
    };



    return (
        <div className="settings-page">

            {/* ==========================================
                TOP BAR
            ========================================== */}

            <header className="settings-topbar">

                <div
                    className="settings-logo"
                    onClick={() =>
                        navigate(
                            "/student-dashboard"
                        )
                    }
                >
                    <span className="logo-icon">
                        ✦
                    </span>

                    Votara
                </div>


                <div className="settings-search">
                    Search
                    <span>⌕</span>
                </div>


                <div className="settings-top-right">

                    <span className="top-icon">
                        ♧
                    </span>

                    <span className="top-icon">
                        ?
                    </span>

                    <span className="top-user">
                        Student
                    </span>

                </div>

            </header>


            {/* ==========================================
                MAIN AREA
            ========================================== */}

            <div className="settings-content">


                {/* ======================================
                    LEFT MENU
                ====================================== */}

                <aside className="settings-sidebar">

                    <h2>
                        Account and Settings
                    </h2>


                    <button
                        className="settings-menu active"
                        onClick={() => {}}
                    >
                        <span>●</span>
                        Edit profile
                        <b>›</b>
                    </button>


                    <button
                        className="settings-menu"
                        onClick={() =>
                            navigate(
                                "/change-password"
                            )
                        }
                    >
                        <span>▣</span>
                        Change password
                        <b>›</b>
                    </button>


                    <button className="settings-menu" onClick={openReportCategory}>
                        <span>●</span>
                        Report an Issue
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>!</span>
                        About us
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>◉</span>
                        Terms of Service
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>◉</span>
                        Privacy Policy
                        <b>›</b>
                    </button>


                    <button className="settings-menu">
                        <span>✉</span>
                        Contact us
                        <b>›</b>
                    </button>


                    <button
                        className="settings-logout"
                        onClick={() => {

                            localStorage.removeItem(
                                "votaraToken"
                            );

                            localStorage.removeItem(
                                "votaraStudent"
                            );

                            navigate(
                                "/student-login"
                            );

                        }}
                    >
                        ←
                        <span>
                            Log out
                        </span>
                    </button>

                </aside>


                {/* ======================================
                    PROFILE PANEL
                ====================================== */}

                <main className="profile-panel">


                    {/* ==================================
                        PROFILE PICTURE
                    ================================== */}

                    <section className="profile-picture-section">

                        <div className="profile-picture-wrapper">

                            {profile.profilePicture ? (

                                <img
                                    src={
                                        profile.profilePicture
                                    }
                                    alt="Student"
                                    className="profile-picture"
                                />

                            ) : (

                                <div className="profile-placeholder">
                                    👤
                                </div>

                            )}

                        </div>


                        <div className="profile-picture-buttons">

                            <button
                                className="upload-button"
                                disabled={!editing}
                            >
                                Upload
                            </button>


                            <button
                                className="remove-button"
                                disabled={!editing}
                            >
                                Remove
                            </button>

                        </div>

                    </section>


                    {/* ==================================
                        FORM
                    ================================== */}

                    <section className="profile-form">


                        {/* FIRST NAME */}

                        <div className="form-group">

                            <label>
                                First name
                            </label>

                            <input
                                type="text"
                                name="firstName"
                                value={
                                    profile.firstName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* MIDDLE NAME */}

                        <div className="form-group">

                            <label>
                                Middle name
                            </label>

                            <input
                                type="text"
                                name="middleName"
                                value={
                                    profile.middleName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* LAST NAME */}

                        <div className="form-group">

                            <label>
                                Last name
                            </label>

                            <input
                                type="text"
                                name="lastName"
                                value={
                                    profile.lastName
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* BIRTHDAY */}

                        <div className="form-group right-field">

                            <label>
                                Birthday
                            </label>

                            <input
                                type="date"
                                name="birthday"
                                value={
                                    profile.birthday
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* CONTACT NUMBER */}

                        <div className="form-group right-field">

                            <label>
                                Contact Number
                            </label>

                            <input
                                type="text"
                                name="contactNumber"
                                value={
                                    profile.contactNumber
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                                placeholder="+63..."
                            />

                        </div>


                        {/* EMAIL */}

                        <div className="form-group right-field">

                            <label>
                                Email
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={
                                    profile.email
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        <h3>
                            Current Address
                        </h3>


                        {/* PROVINCE */}

                        <div className="form-group right-field">

                            <label>
                                Province
                            </label>

                            <input
                                type="text"
                                name="province"
                                value={
                                    profile.province
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* BARANGAY */}

                        <div className="form-group right-field">

                            <label>
                                Barangay
                            </label>

                            <input
                                type="text"
                                name="barangay"
                                value={
                                    profile.barangay
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>


                        {/* CITY */}

                        <div className="form-group right-field">

                            <label>
                                City
                            </label>

                            <input
                                type="text"
                                name="city"
                                value={
                                    profile.city
                                }
                                onChange={
                                    handleChange
                                }
                                disabled={!editing}
                            />

                        </div>

                    </section>


                    {/* ==================================
                        ACTIONS
                    ================================== */}

                    <div className="profile-actions">

                        {message && (
                            <div className="success-message">
                                {message}
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}


                        {!editing ? (

                            <button
                                className="edit-button"
                                onClick={
                                    handleEdit
                                }
                            >
                                ✎ Edit
                            </button>

                        ) : (

                            <div className="editing-buttons">

                                <button
                                    className="cancel-button"
                                    onClick={
                                        handleCancel
                                    }
                                    disabled={saving}
                                >
                                    Cancel
                                </button>


                                <button
                                    className="done-button"
                                    onClick={
                                        handleDone
                                    }
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "✓ Done"}
                                </button>

                            </div>

                        )}

                    </div>

                </main>

            </div>

            {reportView && (
                <div className="student-report-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !reportSubmitting) closeReportFlow(); }}>
                    <section className="student-report-modal" role="dialog" aria-modal="true" aria-labelledby="student-report-title">
                        {reportView === "category" && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS · REPORT AN ISSUE</div>
                            <h2 id="student-report-title">Issue category</h2>
                            <p className="student-report-intro">Choose the category that best describes your issue.</p>
                            <div className="student-report-category-list">{reportCategories.map((category) => <button type="button" key={category} onClick={() => { setReportDraft((current) => ({ ...current, category, contactEmail: current.contactEmail || profile.email || "" })); setReportError(""); setReportView("form"); }}>{category}<span>›</span></button>)}</div>
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={loadReportHistory} disabled={reportLoading}>{reportLoading ? "Loading history…" : "View report history"}</button><button type="button" className="student-report-quiet" onClick={closeReportFlow}>Cancel</button></div>
                        </>}

                        {reportView === "form" && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS · NEW REPORT</div>
                            <h2 id="student-report-title">Report an issue</h2>
                            <p className="student-report-intro">Provide the details below. Your report will be sent to the VOTARA administrator.</p>
                            <div className="student-report-selected-category"><span>Issue category</span><strong>{reportDraft.category}</strong><button type="button" onClick={() => setReportView("category")}>Change</button></div>
                            <form className="student-report-form" onSubmit={submitIssueReport}>
                                <label>Subject <span>*</span><input required minLength={4} maxLength={160} value={reportDraft.subject} onChange={(event) => setReportDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Briefly describe the issue" /></label>
                                <label>Description <span>*</span><textarea required minLength={10} maxLength={5000} rows={5} value={reportDraft.description} onChange={(event) => setReportDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Explain what happened and include any useful details." /></label>
                                <label>Contact email <span>*</span><input type="email" required value={reportDraft.contactEmail} onChange={(event) => setReportDraft((current) => ({ ...current, contactEmail: event.target.value }))} placeholder="name@example.com" /></label>
                                <label>Attachment <small>Optional · JPG, PNG, WEBP, or PDF · Max 5 MB</small><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleReportAttachment} /></label>
                                {reportDraft.attachment && <div className="student-report-attachment-name">Attached: {reportDraft.attachment.name}<button type="button" onClick={() => setReportDraft((current) => ({ ...current, attachment: null }))}>Remove</button></div>}
                                {reportError && <div className="student-report-error" role="alert">{reportError}</div>}
                                <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={() => setReportView("category")} disabled={reportSubmitting}>Back</button><button type="submit" className="student-report-primary" disabled={reportSubmitting}>{reportSubmitting ? "Submitting…" : "Submit report"}</button></div>
                            </form>
                        </>}

                        {reportView === "submitted" && submittedReport && <div className="student-report-submitted">
                            <div className="student-report-success-icon">✓</div><div className="student-report-kicker">STUDENT / SETTINGS · REPORT SUBMITTED</div><h2 id="student-report-title">Report submitted</h2><p>Your issue has been recorded. You can review its status in your report history.</p>
                            <div className="student-report-reference"><span>Report reference</span><strong>{submittedReport.reference}</strong></div><p className="student-report-contact">Updates will be associated with {submittedReport.contact_email || reportDraft.contactEmail}.</p>
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={loadReportHistory}>View report history</button><button type="button" className="student-report-primary" onClick={closeReportFlow}>Done</button></div>
                        </div>}

                        {reportView === "history" && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS</div><h2 id="student-report-title">My report history</h2><p className="student-report-intro">Review the reports you have submitted and their latest status.</p>
                            {reportError && <div className="student-report-error" role="alert">{reportError}</div>}
                            {reportLoading ? <div className="student-report-empty">Loading your reports…</div> : reportHistory.length ? <div className="student-report-history-list">{reportHistory.map((report) => <button type="button" className="student-report-history-item" key={report.id} onClick={() => openReportHistoryDetail(report)}><span className="student-report-history-copy"><strong>{report.subject}</strong><small>{report.reference} · {report.category} · {new Date(report.created_at).toLocaleDateString()}</small></span><span className={`student-report-status status-${report.status}`}>{String(report.status).replace("_", " ")}</span><b>›</b></button>)}</div> : <div className="student-report-empty">You have not submitted any reports yet.</div>}
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={openReportCategory}>New report</button><button type="button" className="student-report-primary" onClick={closeReportFlow}>Done</button></div>
                        </>}

                        {reportView === "history-detail" && selectedReport && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS · REPORT DETAILS</div><h2 id="student-report-title">{selectedReport.reference}</h2>
                            <div className="student-report-detail-card"><div><span>Status</span><strong className={`student-report-status status-${selectedReport.status}`}>{String(selectedReport.status).replace("_", " ")}</strong></div><div><span>Category</span><strong>{selectedReport.category}</strong></div><div><span>Subject</span><strong>{selectedReport.subject}</strong></div><div><span>Description</span><p>{selectedReport.description}</p></div>{selectedReport.admin_response && <div><span>Administrator response</span><p>{selectedReport.admin_response}</p></div>}{selectedReport.attachment_url && <div><span>Attachment</span><a href={selectedReport.attachment_url} target="_blank" rel="noreferrer">View attachment</a></div>}</div>
                            <h3 className="student-report-timeline-title">Report updates</h3>{reportHistoryTimeline.length ? <div className="student-report-timeline">{reportHistoryTimeline.map((item) => <div key={item.id}><strong>{String(item.status).replace("_", " ")}</strong><span>{item.note || "Status updated"}</span><small>{new Date(item.created_at).toLocaleString()}</small></div>)}</div> : <div className="student-report-empty">No status updates are available yet.</div>}
                            {reportError && <div className="student-report-error" role="alert">{reportError}</div>}
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={loadReportHistory}>Back to history</button><button type="button" className="student-report-primary" onClick={closeReportFlow}>Done</button></div>
                        </>}
                    </section>
                </div>
            )}

        </div>
    );
};


export default Settings;