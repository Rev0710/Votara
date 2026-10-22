import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiAlertCircle, FiArrowUpRight, FiCheck, FiCheckCircle, FiClock, FiEye, FiFileText, FiInbox, FiRefreshCw, FiSearch, FiUser, FiX, FiXCircle } from "react-icons/fi";
import api from "../../services/api";
import "./AdminLateEnrolleesView.css";

const API = {
    applications: "/admin/late-enrollees",
    documents: (id) => `/admin/late-enrollees/${id}/documents`,
    approve: (id) => `/admin/late-enrollees/${id}/approve`,
    reject: (id) => `/admin/late-enrollees/${id}/reject`,
};
const getApplications = (response) => {
    const data = response?.data;
    return [data?.applications, data?.data, data].find(Array.isArray) || [];
};
const getApplicationId = (item) => item?.id || item?.application_id || "";
const getStudentId = (item) => item?.student_id || item?.student?.student_id || "";
const getStudentName = (item) => item?.full_name || item?.student?.full_name || "Unnamed student";
const getYearLevel = (item) => item?.year_level || item?.student?.year_level || "—";
const getEmail = (item) => item?.email || item?.student?.email || "";
const hasEmail = (item) => Boolean(String(getEmail(item)).trim());
const getStatus = (item) => String(item?.application_status || item?.status || "pending").trim().toLowerCase().replace(/\s+/g, "_");
const isInReview = (status) => ["pending", "pending_review", "submitted", "under_review"].includes(status);
const statusClass = (status) => isInReview(status) ? "pending" : ["approved", "rejected"].includes(status) ? status : "other";
const formatStatus = (status) => isInReview(status) ? "In review" : status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const getRejectionReason = (item) => item?.rejection_reason || item?.rejectionReason || item?.reason || item?.remarks || "";
const getEnrollmentStatus = (item) => item?.enrollment_status || item?.student?.enrollment_status || "Not verified";
const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
const getInitials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const getDocumentUrl = (doc) => doc?.signed_url || doc?.signedUrl || doc?.public_url || doc?.publicUrl || doc?.file_url || doc?.fileUrl || doc?.url || "";
const getDocumentName = (doc, index) => doc?.original_file_name || doc?.originalFileName || doc?.file_name || doc?.fileName || doc?.name || doc?.document_type || `Document ${index + 1}`;
const getDocumentType = (doc) => {
    const type = doc?.document_type || doc?.documentType || doc?.type || "Submitted document";
    return { student_id_front: "Student ID · front", student_id_back: "Student ID · back", enrollment_proof: "Proof of enrollment" }[type] || String(type).replace(/_/g, " ");
};
const getDocumentMimeType = (doc) => String(doc?.file_type || doc?.fileType || doc?.mime_type || doc?.mimeType || "").toLowerCase();
const errorMessage = (err, fallback) => err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

function Status({ status }) {
    return <span className={`le-status is-${statusClass(status)}`}><span aria-hidden="true" />{formatStatus(status)}</span>;
}

function Dialog({ open, onClose, labelId, className = "", children }) {
    const ref = useRef(null);
    useEffect(() => {
        const dialog = ref.current;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);
    return <dialog ref={ref} className={`le-dialog ${className}`} aria-labelledby={labelId}
        onCancel={(event) => { event.preventDefault(); onClose(); }}
        onClick={(event) => { if (event.target === event.currentTarget) {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        } }}>
        {children}
    </dialog>;
}

export default function AdminLateEnrolleesReview() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [documentsError, setDocumentsError] = useState("");
    const [selfieUrl, setSelfieUrl] = useState("");
    const [documentPreview, setDocumentPreview] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [decision, setDecision] = useState(null);
    const [rejectReason, setRejectReason] = useState("");
    const documentRequest = useRef(0);
    useEffect(() => () => { documentRequest.current += 1; }, []);

    const loadApplications = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError("");
        try {
            const response = await api.get(API.applications);
            setApplications(getApplications(response));
        } catch (err) {
            setError(errorMessage(err, "Unable to load late enrollee applications."));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);
    useEffect(() => { loadApplications(); }, [loadApplications]);

    const statistics = useMemo(() => ({
        all: applications.length,
        pending: applications.filter((item) => isInReview(getStatus(item))).length,
        approved: applications.filter((item) => getStatus(item) === "approved").length,
        rejected: applications.filter((item) => getStatus(item) === "rejected").length,
    }), [applications]);
    const filteredApplications = useMemo(() => {
        const query = search.trim().toLowerCase();
        return applications.filter((item) => {
            const status = getStatus(item);
            const matchesStatus = statusFilter === "all" || (statusFilter === "pending" ? isInReview(status) : status === statusFilter);
            const matchesSearch = !query || [getStudentName(item), getStudentId(item), getYearLevel(item), getEmail(item), formatStatus(status)].some((value) => String(value).toLowerCase().includes(query));
            return matchesStatus && matchesSearch;
        });
    }, [applications, search, statusFilter]);

    const openDetails = async (application) => {
        const request = ++documentRequest.current;
        setSelectedApplication(application);
        setDocuments([]);
        setSelfieUrl("");
        setDocumentsError("");
        setActionError("");
        setActionSuccess("");
        setDocumentPreview(null);
        setDecision(null);
        const id = getApplicationId(application);
        if (!id) { setDocumentsError("Application ID is missing."); setDocumentsLoading(false); return; }
        setDocumentsLoading(true);
        try {
            const response = await api.get(API.documents(id));
            if (documentRequest.current !== request) return;
            const body = response?.data || {};
            setDocuments([body.documents, body.registration_documents, body.registrationDocuments, body.data].find(Array.isArray) || []);
            const identity = body.identity_verification || application?.identity_verification;
            setSelfieUrl(body.selfie_url || body.selfie_signed_url || identity?.selfie_url || identity?.selfie_signed_url || identity?.signed_url || "");
        } catch (err) {
            if (documentRequest.current === request) setDocumentsError(errorMessage(err, "Unable to load submitted documents."));
        } finally {
            if (documentRequest.current === request) setDocumentsLoading(false);
        }
    };
    const closeDetails = () => {
        if (actionLoading) return;
        documentRequest.current += 1;
        setSelectedApplication(null);
        setDocuments([]);
        setSelfieUrl("");
        setDocumentPreview(null);
        setDecision(null);
        setRejectReason("");
        setActionError("");
        setActionSuccess("");
    };
    const closeDecision = () => { if (!actionLoading) { setDecision(null); setActionError(""); setRejectReason(""); } };
    const submitDecision = async (event) => {
        event.preventDefault();
        if (!selectedApplication || actionLoading || !["approve", "reject"].includes(decision)) return;
        const id = getApplicationId(selectedApplication);
        const reason = rejectReason.trim();
        if (!id) { setActionError("Application ID is missing."); return; }
        if (decision === "reject" && !reason) { setActionError("A rejection reason is required."); return; }
        setActionLoading(true);
        setActionError("");
        setActionSuccess("");
        try {
            const status = decision === "approve" ? "approved" : "rejected";
            if (decision === "approve") await api.patch(API.approve(id));
            else await api.patch(API.reject(id), { reason, remarks: reason, rejection_reason: reason });
            const changes = { application_status: status, ...(status === "rejected" ? { rejection_reason: reason } : {}) };
            setApplications((current) => current.map((item) => getApplicationId(item) === id ? { ...item, ...changes } : item));
            setSelectedApplication((current) => current ? { ...current, ...changes } : current);
            setDecision(null);
            setRejectReason("");
            setActionSuccess(status === "rejected" ? "Application rejected successfully." : hasEmail(selectedApplication)
                ? "Application approved. The student account is active and a temporary password has been sent to the registered email address."
                : "Application approved. The student account is active. Activation will continue on the current kiosk device.");
            await loadApplications(true);
        } catch (err) {
            setActionError(errorMessage(err, "Unable to update this application."));
        } finally { setActionLoading(false); }
    };
    const previewDocument = (doc, index) => {
        const name = getDocumentName(doc, index);
        const mimeType = getDocumentMimeType(doc);
        return { name, url: getDocumentUrl(doc), type: getDocumentType(doc),
            isImage: mimeType.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(name),
            isPdf: mimeType === "application/pdf" || /\.pdf$/i.test(name) };
    };
    const filters = [["all", "All applications"], ["pending", "In review"], ["approved", "Approved"], ["rejected", "Rejected"]];
    const selectedStatus = selectedApplication ? getStatus(selectedApplication) : "";

    return (
        <main id="late-enrollees-content" className="le-main">
            <header className="le-heading">
                <div><div className="le-breadcrumb">Administration <span>/</span> People</div>
                    <h1>Late Enrollees</h1><p>Review online and kiosk applications, verify documents, and manage enrollment decisions.</p></div>
                <button className="le-button le-secondary" disabled={loading || refreshing} onClick={() => loadApplications(true)}><FiRefreshCw className={refreshing ? "le-spinning" : ""} />{refreshing ? "Refreshing…" : "Refresh applications"}</button>
            </header>
            <section className="le-summary" aria-label="Application summary">
                {[["all", "Total applications", FiInbox], ["pending", "In review", FiClock], ["approved", "Approved", FiCheckCircle], ["rejected", "Rejected", FiXCircle]].map(([key, label, Icon]) =>
                    <div key={key}><span>{label}</span><strong>{loading ? "—" : statistics[key]}</strong><Icon aria-hidden="true" /></div>)}
            </section>
            {error && <div className="le-alert le-error" role="alert"><FiAlertCircle /><span>{error}</span><button onClick={() => loadApplications(true)} disabled={refreshing}>Try again</button></div>}
            <section className="le-panel" aria-labelledby="le-applications-title">
                <div className="le-panel-heading"><div><h2 id="le-applications-title">Applications</h2><p>Open an application to review student details and submitted files.</p></div><span>Online &amp; kiosk</span></div>
                <div className="le-toolbar">
                    <div className="le-filters" role="group" aria-label="Filter applications by status">{filters.map(([key, label]) => <button key={key} aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{label}<span>{loading ? "—" : statistics[key]}</span></button>)}</div>
                    <label className="le-search"><FiSearch aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or student ID" aria-label="Search applications by name, student ID, or email" /></label>
                </div>
                <div className="le-table-scroll" role="region" aria-label="Late enrollee applications" tabIndex={0}>
                    <table className="le-table"><caption className="le-sr-only">Late enrollee students, year level, application status, and submission date.</caption>
                        <colgroup><col className="le-col-student" /><col className="le-col-year" /><col className="le-col-status" /><col className="le-col-date" /><col className="le-col-action" /></colgroup>
                        <thead><tr><th scope="col">Student</th><th scope="col">Year level</th><th scope="col">Status</th><th scope="col">Submitted</th><th scope="col"><span className="le-sr-only">Review</span></th></tr></thead>
                        <tbody>{loading ? Array.from({ length: 4 }, (_, i) => <tr className="le-loading-row" key={i}><td colSpan={5}><span className="le-skeleton" /></td></tr>) : filteredApplications.length ? filteredApplications.map((application) => {
                            const name = getStudentName(application);
                            return <tr key={getApplicationId(application)}>
                                <td><div className="le-student"><span className="le-avatar" aria-hidden="true">{getInitials(name)}</span><div><strong>{name}</strong><span>Student ID {getStudentId(application) || "—"}</span></div></div></td>
                                <td>{getYearLevel(application)}</td><td><Status status={getStatus(application)} /></td>
                                <td><time>{formatDate(application.submitted_at || application.created_at)}</time></td>
                                <td><button className="le-review-button" onClick={() => openDetails(application)} aria-label={`Review ${name} application`}><FiEye aria-hidden="true" />Review</button></td>
                            </tr>;
                        }) : <tr><td colSpan={5}><div className="le-empty"><FiInbox aria-hidden="true" /><h3>{error ? "Applications unavailable" : applications.length ? "No matching applications" : "No applications yet"}</h3><p>{error ? "Try refreshing to load the application list." : applications.length ? "Try a different search or view all application statuses." : "Online and kiosk submissions will appear here when received."}</p>{applications.length > 0 && <button className="le-button le-secondary" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear filters</button>}</div></td></tr>}</tbody>
                    </table>
                </div>
                <div className="le-panel-footer" role="status">{loading ? "Loading applications…" : `Showing ${filteredApplications.length} of ${applications.length} applications`}<span>Review documents before making a decision.</span></div>
            </section>

            <Dialog open={Boolean(selectedApplication)} onClose={closeDetails} labelId="le-review-title" className="le-review-dialog">
                {selectedApplication && <>
                    <div className="le-dialog-heading"><div><span>Application review</span><h2 id="le-review-title">{getStudentName(selectedApplication)}</h2><p>Student ID {getStudentId(selectedApplication) || "—"} <span aria-hidden="true">·</span> {getYearLevel(selectedApplication)}</p></div><button className="le-close" onClick={closeDetails} disabled={actionLoading} aria-label="Close application review"><FiX /></button></div>
                    <div className="le-review-body">
                        <div className="le-review-status"><Status status={selectedStatus} /><span>Submitted {formatDate(selectedApplication.submitted_at || selectedApplication.created_at)}</span></div>
                        <dl className="le-info-grid">{[["Student ID", getStudentId(selectedApplication) || "—"], ["Year level", getYearLevel(selectedApplication)], ["Email address", getEmail(selectedApplication) || "No email provided"], ["Enrollment status", getEnrollmentStatus(selectedApplication)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                        <div className="le-section-heading"><h3>Submitted documents</h3><span>{documentsLoading ? "Loading…" : `${documents.length + (selfieUrl ? 1 : 0)} files`}</span></div>
                        {documentsLoading ? <div className="le-document-loading" role="status"><FiRefreshCw className="le-spinning" />Loading submitted documents…</div> : documentsError ? <div className="le-alert le-error" role="alert"><FiAlertCircle /><span>{documentsError}</span><button onClick={() => openDetails(selectedApplication)}>Retry</button></div> : <div className="le-documents">
                            {documents.map((doc, index) => {
                                const preview = previewDocument(doc, index);
                                return <article className="le-document" key={doc?.id || index}><div className="le-thumbnail">{preview.url && preview.isImage ? <img src={preview.url} alt={preview.name} loading="lazy" /> : <FiFileText aria-hidden="true" />}</div><div className="le-document-copy"><h4>{preview.name}</h4><p>{preview.type}</p></div><button className="le-review-button" disabled={!preview.url} onClick={() => setDocumentPreview(preview)} aria-label={`View ${preview.name}`}><FiEye />{preview.url ? "View" : "Unavailable"}</button></article>;
                            })}
                            <article className="le-document"><div className="le-thumbnail">{selfieUrl ? <img src={selfieUrl} alt="Student registration selfie" /> : <FiUser aria-hidden="true" />}</div><div className="le-document-copy"><h4>Registration selfie</h4><p>{selfieUrl ? "Identity comparison" : "No selfie available"}</p></div><button className="le-review-button" disabled={!selfieUrl} onClick={() => setDocumentPreview({ url: selfieUrl, name: "Registration selfie", type: "Identity comparison", isImage: true })}><FiEye />{selfieUrl ? "View" : "Unavailable"}</button></article>
                            {documents.length === 0 && <p className="le-documents-note">No supporting documents were returned for this application.</p>}
                        </div>}
                        <div className="le-review-note"><FiEye aria-hidden="true" /><div><h3>Before making a decision</h3><p>Compare the student’s name and ID with the submitted documents. Check that the files are readable and compare the registration selfie with the student ID.</p></div></div>
                        {getRejectionReason(selectedApplication) && <div className="le-notice le-rejection"><h3>Rejection reason</h3><p>{getRejectionReason(selectedApplication)}</p></div>}
                        {selectedApplication.correction_message && <div className="le-notice"><h3>Correction required</h3><p>{selectedApplication.correction_message}</p></div>}
                        {actionSuccess && <div className="le-alert le-success" role="status"><FiCheckCircle /><span>{actionSuccess}</span></div>}
                    </div>
                    <footer className="le-dialog-actions"><button className="le-button le-secondary" disabled={actionLoading} onClick={closeDetails}>Close review</button>{["approved", "rejected"].includes(selectedStatus) ? <Status status={selectedStatus} /> : <div><button className="le-button le-danger" disabled={actionLoading} onClick={() => { setActionError(""); setRejectReason(""); setDecision("reject"); }}><FiX />Reject</button><button className="le-button le-primary" disabled={actionLoading} onClick={() => { setActionError(""); setDecision("approve"); }}><FiCheck />Approve</button></div>}</footer>
                </>}
            </Dialog>
            <Dialog open={Boolean(documentPreview)} onClose={() => setDocumentPreview(null)} labelId="le-preview-title" className="le-preview-dialog">
                {documentPreview && <><div className="le-dialog-heading"><div><h2 id="le-preview-title">{documentPreview.name}</h2><p>{documentPreview.type}</p></div><div className="le-preview-tools"><a className="le-review-button" href={documentPreview.url} target="_blank" rel="noreferrer">Open in new tab<FiArrowUpRight /></a><button className="le-close" onClick={() => setDocumentPreview(null)} aria-label="Close document preview"><FiX /></button></div></div><div className="le-preview-body">{documentPreview.isImage ? <img src={documentPreview.url} alt={documentPreview.name} /> : documentPreview.isPdf ? <iframe src={documentPreview.url} title={documentPreview.name} /> : <p>This file format cannot be previewed here. Use “Open in new tab” to review it.</p>}</div></>}
            </Dialog>
            <Dialog open={Boolean(decision)} onClose={closeDecision} labelId="le-decision-title" className="le-decision-dialog">
                {decision && <form onSubmit={submitDecision}><div className="le-dialog-heading"><div><span>Enrollment decision</span><h2 id="le-decision-title">{decision === "approve" ? "Approve application?" : "Reject application?"}</h2></div><button type="button" className="le-close" onClick={closeDecision} disabled={actionLoading} aria-label="Close decision"><FiX /></button></div><div className="le-decision-body"><p>{decision === "approve" ? <>Approving <strong>{getStudentName(selectedApplication)}</strong> will create or activate the student’s VOTARA account.</> : <>Record a reason for rejecting <strong>{getStudentName(selectedApplication)}</strong>’s application.</>}</p>{decision === "approve" ? <div className="le-notice"><p>{hasEmail(selectedApplication) ? <>A temporary password will be sent to <strong>{getEmail(selectedApplication)}</strong>. The student must set a personal password and complete their profile photo before accessing the dashboard.</> : "No email was provided. Activation will continue on the current kiosk device, where the student will set a personal 8-character password."}</p></div> : <label className="le-reason-label" htmlFor="le-reject-reason">Rejection reason<textarea id="le-reject-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Explain why this application is being rejected" required disabled={actionLoading} rows={4} /></label>}{actionError && <div className="le-alert le-error" role="alert"><FiAlertCircle /><span>{actionError}</span></div>}</div><footer className="le-dialog-actions"><button type="button" className="le-button le-secondary" onClick={closeDecision} disabled={actionLoading}>Cancel</button><button type="submit" className={`le-button ${decision === "approve" ? "le-primary" : "le-danger-solid"}`} disabled={actionLoading || (decision === "reject" && !rejectReason.trim())}>{actionLoading ? "Saving…" : decision === "approve" ? "Confirm approval" : "Confirm rejection"}</button></footer></form>}
            </Dialog>
        </main>
    );
}
