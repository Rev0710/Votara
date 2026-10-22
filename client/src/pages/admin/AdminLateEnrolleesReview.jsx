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

<<<<<<< HEAD
const getDocumentUrl = (document) =>
    document?.signed_url ||
    document?.signedUrl ||
    document?.public_url ||
    document?.publicUrl ||
    document?.file_url ||
    document?.fileUrl ||
    document?.url ||
    "";

const getDocumentName = (
    document,
    index
) =>
    document?.original_file_name ||
    document?.originalFileName ||
    document?.file_name ||
    document?.fileName ||
    document?.name ||
    document?.document_type ||
    `Document ${index + 1}`;

const getDocumentType = (document) =>
    document?.document_type ||
    document?.documentType ||
    document?.type ||
    "Submitted Document";

const getDocumentMimeType = (document) =>
    String(
        document?.file_type ||
        document?.fileType ||
        document?.mime_type ||
        document?.mimeType ||
        ""
    ).toLowerCase();

const getDocumentReviewStatus = (application) => {
    const status = getStatus(application);

    if (status === "approved") {
        return {
            label: "Submitted",
            className: "submitted",
        };
    }

    if (status === "rejected") {
        return {
            label: "Rejected",
            className: "rejected",
        };
    }

    return {
        label: "In Review",
        className: "in-review",
    };
};

// ============================================================
// COMPONENT
// ============================================================

function LateEnrolleeManagement({ onNavigate }) {

    const [
        applications,
        setApplications,
    ] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [
        statusFilter,
        setStatusFilter,
    ] = useState("all");

    const [
        selectedApplication,
        setSelectedApplication,
    ] = useState(null);

    const [
        detailsOpen,
        setDetailsOpen,
    ] = useState(false);

    const [documents, setDocuments] =
        useState([]);

    const [
        documentsLoading,
        setDocumentsLoading,
    ] = useState(false);

    const [
        documentsError,
        setDocumentsError,
    ] = useState("");

    const [selfieUrl, setSelfieUrl] =
        useState("");

    const [
        documentPreview,
        setDocumentPreview,
    ] = useState(null);

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const [actionError, setActionError] =
        useState("");

    const [
        actionSuccess,
        setActionSuccess,
    ] = useState("");

    const [
        approveModalOpen,
        setApproveModalOpen,
    ] = useState(false);

    const [
        rejectModalOpen,
        setRejectModalOpen,
    ] = useState(false);

    const [rejectReason, setRejectReason] =
        useState("");

    // ========================================================
    // LOAD APPLICATIONS
    // ========================================================

    const loadApplications = useCallback(
        async (isRefresh = false) => {
            try {
                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response =
                    await api.get(
                        API.applications
                    );

                setApplications(
                    getApplications(response)
                );
            } catch (err) {
                console.error(
                    "Late enrollee loading error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    "Unable to load late enrollee applications."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    // ========================================================
    // FILTER
    // ========================================================

    const filteredApplications =
        useMemo(() => {

            const searchValue =
                search.trim().toLowerCase();

            return applications.filter(
                (item) => {

                    const name =
                        getStudentName(
                            item
                        ).toLowerCase();

                    const studentId =
                        String(
                            getStudentId(item)
                        ).toLowerCase();

                    const yearLevel =
                        String(
                            getYearLevel(item)
                        ).toLowerCase();

                    const status =
                        getStatus(item);

                    const matchesSearch =
                        !searchValue ||
                        name.includes(
                            searchValue
                        ) ||
                        studentId.includes(
                            searchValue
                        ) ||
                        yearLevel.includes(
                            searchValue
                        ) ||
                        status.includes(
                            searchValue
                        );

                    const matchesStatus =
                        statusFilter ===
                            "all" ||
                        status ===
                            statusFilter;

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );
        }, [
            applications,
            search,
            statusFilter,
        ]);

    // ========================================================
    // STATISTICS
    // ========================================================

    const statistics =
        useMemo(() => {

            const total =
                applications.length;

            const pending =
                applications.filter(
                    (item) =>
                        [
                            "pending",
                            "submitted",
                            "under_review",
                        ].includes(
                            getStatus(item)
                        )
                ).length;

            const approved =
                applications.filter(
                    (item) =>
                        getStatus(item) ===
                        "approved"
                ).length;

            const rejected =
                applications.filter(
                    (item) =>
                        getStatus(item) ===
                        "rejected"
                ).length;

            return {
                total,
                pending,
                approved,
                rejected,
            };

        }, [applications]);

    // ========================================================
    // OPEN REVIEW
    // ========================================================

    const openDetails = async (
        application
    ) => {

        setSelectedApplication(
            application
        );

        setDetailsOpen(true);

        setDocuments([]);
        setSelfieUrl("");
        setDocumentsError("");
        setActionError("");
        setActionSuccess("");

        const id =
            getApplicationId(
                application
            );

        if (!id) {
            setDocumentsError(
                "Application ID is missing."
            );
            return;
        }

        try {

            setDocumentsLoading(true);

            const response =
                await api.get(
                    API.documents(id)
                );

            const body =
                response?.data || {};

            const loadedDocuments =
                Array.isArray(
                    body.documents
                )
                    ? body.documents
                    : Array.isArray(
                          body.registration_documents
                      )
                    ? body.registration_documents
                    : Array.isArray(
                          body.registrationDocuments
                      )
                    ? body.registrationDocuments
                    : Array.isArray(
                          body.data
                      )
                    ? body.data
                    : [];

            setDocuments(
                loadedDocuments
            );

            const identity =
                body.identity_verification ||
                application?.identity_verification ||
                null;

            const selfie =
                body.selfie_url ||
                body.selfie_signed_url ||
                identity?.selfie_url ||
                identity?.selfie_signed_url ||
                identity?.signed_url ||
                "";

            if (selfie) {
                setSelfieUrl(selfie);
            }

        } catch (err) {

            console.error(
                "Late enrollee documents error:",
                err
            );

            setDocumentsError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Unable to load submitted documents."
            );

        } finally {
            setDocumentsLoading(false);
        }
    };

    // ========================================================
    // CLOSE REVIEW
    // ========================================================

    const closeDetails = () => {

        if (actionLoading) return;

        setDetailsOpen(false);

        setSelectedApplication(null);

        setDocuments([]);

        setSelfieUrl("");

        setDocumentPreview(null);

        setDocumentsError("");

        setActionError("");

        setActionSuccess("");

        setApproveModalOpen(false);

        setRejectModalOpen(false);

        setRejectReason("");
    };

    // ========================================================
    // APPROVE
    // ========================================================

    const approveApplication =
        async () => {

            if (!selectedApplication)
                return;

            const id =
                getApplicationId(
                    selectedApplication
                );

            if (!id) {
                setActionError(
                    "Application ID is missing."
                );
                return;
            }

            try {

                setActionLoading(true);

                setActionError("");

                setActionSuccess("");

                const response =
                    await api.patch(
                        API.approve(id)
                    );

                setApplications(
                    (current) =>
                        current.map(
                            (item) =>
                                getApplicationId(
                                    item
                                ) === id
                                    ? {
                                          ...item,
                                          application_status:
                                              "approved",
                                      }
                                    : item
                        )
                );

                setSelectedApplication(
                    (current) =>
                        current
                            ? {
                                  ...current,
                                  application_status:
                                      "approved",
                              }
                            : current
                );

                setApproveModalOpen(
                    false
                );

                setActionSuccess(
                    hasEmail(selectedApplication)
                        ? "Late enrollee approved successfully. The student's account has been activated and the temporary password has been sent to the registered email address."
                        : "Late enrollee approved successfully. The student account has been activated. Since no email address was provided, account activation will continue on the current kiosk device."
                );

                await loadApplications(
                    true
                );

            } catch (err) {

                console.error(
                    "Approve late enrollee error:",
                    err
                );

                setActionError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    "Unable to approve this application."
                );

            } finally {
                setActionLoading(false);
            }
        };

    // ========================================================
    // REJECT
    // ========================================================

    const rejectApplication =
        async () => {

            if (!selectedApplication)
                return;

            const id =
                getApplicationId(
                    selectedApplication
                );

            const reason =
                rejectReason.trim();

            if (!reason) {
                setActionError(
                    "A lrm-rejection reason is required."
                );
                return;
            }

            try {

                setActionLoading(true);

                setActionError("");

                setActionSuccess("");

                await api.patch(
                    API.reject(id),
                    {
                        reason,
                        remarks: reason,
                        rejection_reason:
                            reason,
                    }
                );

                setApplications(
                    (current) =>
                        current.map(
                            (item) =>
                                getApplicationId(
                                    item
                                ) === id
                                    ? {
                                          ...item,
                                          application_status:
                                              "rejected",
                                          rejection_reason:
                                              reason,
                                      }
                                    : item
                        )
                );

                setSelectedApplication(
                    (current) =>
                        current
                            ? {
                                  ...current,
                                  application_status:
                                      "rejected",
                                  rejection_reason:
                                      reason,
                              }
                            : current
                );

                setRejectModalOpen(
                    false
                );

                setRejectReason("");

                setActionSuccess(
                    "Late enrollee application rejected successfully."
                );

                await loadApplications(
                    true
                );

            } catch (err) {

                console.error(
                    "Reject late enrollee error:",
                    err
                );

                setActionError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    "Unable to reject this application."
                );

            } finally {
                setActionLoading(false);
            }
        };

    // ========================================================
    // STATUS CLASS
    // ========================================================

    const statusClass = (status) => {

        const value =
            getStatus({
                application_status:
                    status,
            });

        if (value === "approved") {
            return "approved";
        }

        if (value === "rejected") {
            return "rejected";
        }

        if (
            value ===
            "needs_correction"
        ) {
            return "lrm-correction";
        }

        return "pending";
    };

    // ========================================================
    // RENDER
    // ========================================================


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="lrm-page">


            <div className="lrm-shell">
                <div className="lrm-heading">
                    <div className="lrm-heading-copy">
                        <div className="lrm-eyebrow">Online Registration Management</div>
                        <h1 className="lrm-title">Late Enrollee Management</h1>
                        <p className="lrm-subtitle">
                            Check submitted documents and selfie, then approve or reject the registration.
                        </p>
                    </div>

                    <span className="admin-enrollee-sources">Online and kiosk applications</span>
                </div>

                {error && (
                    <div className="lrm-error">
                        <strong>!</strong>{" "}{error}
                    </div>
                )}

                <div className="lrm-layout">
                    <div className="lrm-list-panel">
                        <div className="lrm-list-heading">
                            <h2 className="lrm-list-title">Applications</h2>
                            <p className="lrm-list-caption">
                                Submitted late enrollee registrations
                            </p>
                        </div>

                        <div className="lrm-controls">
                            <input
                                className="lrm-search"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name or student ID"
                            />

                            <div className="lrm-filter-tabs">
                                <button
                                    className={`lrm-filter-tab ${statusFilter === "pending" || statusFilter === "all" ? "lrm-active" : ""}`}
                                    onClick={() => setStatusFilter("pending")}
                                >
                                    Pending
                                </button>
                                <button
                                    className={`lrm-filter-tab ${statusFilter === "approved" ? "lrm-active" : ""}`}
                                    onClick={() => setStatusFilter("approved")}
                                >
                                    Approved
                                </button>
                                <button
                                    className={`lrm-filter-tab ${statusFilter === "rejected" ? "lrm-active" : ""}`}
                                    onClick={() => setStatusFilter("rejected")}
                                >
                                    Rejected
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="lrm-list-loading">
                                <div className="lrm-spinner" />
                                Loading applications...
                            </div>
                        ) : filteredApplications.length === 0 ? (
                            <div className="lrm-empty-list">
                                <div style={{fontSize: 28, marginBottom: 8}}>📝</div>
                                <strong style={{fontSize: 14}}>
                                    No Late Enrollee Applications
                                </strong>
                                <div style={{marginTop: 6}}>
                                    {search || statusFilter !== "all"
                                        ? "No applications match your current lrm-controls."
                                        : "There are currently no late enrollee applications."}
                                </div>
                            </div>
                        ) : (
                            filteredApplications.map((application) => {
                                const id = getApplicationId(application);
                                const name = getStudentName(application);
                                const status = getStatus(application);

                                return (
                                    <div
                                        className="lrm-row"
                                        key={id}
                                        onClick={() => openDetails(application)}
                                    >
                                        <div className="lrm-student">
                                            <div className="lrm-avatar">
                                                {getInitials(name)}
                                            </div>
                                            <div style={{minWidth: 0}}>
                                                <div className="lrm-name">{name}</div>
                                                <div className="lrm-id">
                                                    ID {getStudentId(application) || "—"}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="lrm-row-action">
                                            <span className={`lrm-status ${statusClass(status)}`}>
                                                <span className="lrm-dot" />
                                                {formatStatus(status)}
                                            </span>
                                        </div>

                                        <div className="lrm-row-action">
                                            <button
                                                className="lrm-review"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDetails(application);
                                                }}
                                            >
                                                Review
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="lrm-empty-detail">
                        <div>
                            <div style={{
                                width: 52,
                                height: 52,
                                margin: "0 auto 14px",
                                borderRadius: 15,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(37,99,235,.14)",
                                border: "1px solid rgba(74,126,255,.3)",
                                color: "#70a2ff",
                                fontSize: 22,
                            }}>✓</div>
                            <div style={{color:"#eef1ff", fontSize:15, fontWeight:800}}>
                                Select an application to review
                            </div>
                            <div style={{marginTop:6, fontSize:11}}>
                                Choose a late enrollee from the list to inspect submitted documents.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {detailsOpen && selectedApplication && (
                <div className="lrm-review-inline">
                    <div className="lrm-review-modal">
                        <div className="lrm-modal-head">
                            <div style={{display:"flex", alignItems:"center", gap:13}}>
                                <div className="lrm-profile-avatar">
                                    {getInitials(getStudentName(selectedApplication))}
                                </div>
                                <div>
                                    <div className="lrm-profile-name">
                                        {getStudentName(selectedApplication)}
                                    </div>
                                    <div className="lrm-profile-meta">
                                        Late enrollee · Student ID {getStudentId(selectedApplication) || "—"} · {getYearLevel(selectedApplication)}
                                    </div>
                                </div>
                            </div>

                            <button className="lrm-close" onClick={closeDetails}>×</button>
                        </div>

                        <div className="lrm-modal-body">
                            <div className="lrm-info-grid">
                                <div className="lrm-info-box">
                                    <div className="lrm-info-label">Student ID</div>
                                    <div className="lrm-info-value">{getStudentId(selectedApplication) || "—"}</div>
                                </div>

                                <div className="lrm-info-box">
                                    <div className="lrm-info-label">Year & Section</div>
                                    <div className="lrm-info-value">{getYearLevel(selectedApplication)}</div>
                                </div>

                                <div className="lrm-info-box">
                                    <div className="lrm-info-label">School Email</div>
                                    <div className="lrm-info-value">
                                        {hasEmail(selectedApplication)
                                            ? getEmail(selectedApplication)
                                            : "No email provided"}
                                    </div>
                                </div>

                                <div className="lrm-info-box">
                                    <div className="lrm-info-label">Enrollment Status</div>
                                    <div className="lrm-info-value">{getEnrollmentStatus(selectedApplication)}</div>
                                </div>

                                <div className="lrm-info-box">
                                    <div className="lrm-info-label">Application Status</div>
                                    <div className="lrm-info-value">
                                        <span className={`lrm-status ${statusClass(getStatus(selectedApplication))}`}>
                                            <span className="lrm-dot" />
                                            {formatStatus(getStatus(selectedApplication))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="lrm-section-heading">
                                <span>Submitted documents</span>
                                <span style={{fontSize:10, color:"#7f89aa", fontWeight:600}}>
                                    {documents.length + (selfieUrl ? 1 : 0)} files
                                </span>
                            </div>

                            {documentsLoading ? (
                                <div className="lrm-list-loading">
                                    <div className="lrm-spinner" />
                                    Loading submitted documents...
                                </div>
                            ) : documentsError ? (
                                <div className="lrm-error">{documentsError}</div>
                            ) : (
                                <div className="lrm-documents">
                                    {documents.slice(0, 2).map((document, index) => {
                                        const url = getDocumentUrl(document);
                                        const mimeType = getDocumentMimeType(document);
                                        const name = getDocumentName(document, index);
                                        const isImage =
                                            mimeType.startsWith("image/") ||
                                            /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(name);
                                        const isPdf =
                                            mimeType === "application/pdf" ||
                                            /\.pdf$/i.test(name);

                                        return (
                                            <div className="lrm-document" key={document?.id || index}>
                                                <div>
                                                    <div className="lrm-document-preview">
                                                        {url && isImage ? (
                                                            <img src={url} alt={name} />
                                                        ) : (
                                                            <div className="lrm-file-icon">
                                                                {isPdf ? "📑" : "📄"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="lrm-document-name">{name}</div>
                                                    <div className="lrm-document-type">
                                                        {getDocumentType(document)}
                                                    </div>
                                                </div>

                                                <div className="lrm-document-actions">
                                                    <button
                                                        type="button"
                                                        className="lrm-document-view"
                                                        disabled={!url}
                                                        onClick={() => {
                                                            if (!url) return;
                                                            setDocumentPreview({
                                                                url,
                                                                name,
                                                                type: getDocumentType(document),
                                                                mimeType,
                                                                isImage,
                                                                isPdf,
                                                            });
                                                        }}
                                                    >
                                                        ◉ View
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div className="lrm-document">
                                        <div>
                                            <div className="lrm-document-preview">
                                                {selfieUrl ? (
                                                    <img src={selfieUrl} alt="Student registration selfie" />
                                                ) : (
                                                    <div className="lrm-file-icon">◯</div>
                                                )}
                                            </div>
                                            <div className="lrm-document-name">Real-time selfie</div>
                                            <div className="lrm-document-type">
                                                {selfieUrl ? "selfie_live.jpg" : "Not available"}
                                            </div>
                                        </div>

                                        <div className="lrm-document-actions">
                                            {selfieUrl ? (
                                                <button
                                                    type="button"
                                                    className="lrm-document-view"
                                                    onClick={() => setDocumentPreview({
                                                        url: selfieUrl,
                                                        name: "Real-time selfie",
                                                        type: "Registration Selfie",
                                                        mimeType: "image/jpeg",
                                                        isImage: true,
                                                        isPdf: false,
                                                    })}
                                                >
                                                    ◉ View
                                                </button>
                                            ) : (
                                                <button type="button" className="lrm-document-view" disabled>
                                                    Unavailable
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="lrm-section-heading">
                                <span>Verification checklist</span>
                                <span style={{fontSize:10, color:"#7f89aa", fontWeight:600}}>
                                    Review before decision
                                </span>
                            </div>

                            <div style={{
                                borderTop:"1px solid rgba(111,124,184,.14)",
                                borderBottom:"1px solid rgba(111,124,184,.14)"
                            }}>
                                {[
                                    "Name matches the submitted student ID",
                                    "Student ID information is available",
                                    "Submitted documents are clear and readable",
                                    "Selfie is available for comparison",
                                ].map((item, index) => {
                                    const done = index === 3 && Boolean(selfieUrl);
                                    return (
                                        <div key={item} style={{
                                            display:"flex",
                                            alignItems:"center",
                                            gap:12,
                                            minHeight:42,
                                            borderBottom:index === 3 ? "0" : "1px solid rgba(111,124,184,.12)",
                                            color:"var(--aw-text)",
                                            fontSize:11,
                                        }}>
                                            <span style={{
                                                width:21,
                                                height:21,
                                                flexShrink:0,
                                                display:"flex",
                                                alignItems:"center",
                                                justifyContent:"center",
                                                borderRadius:6,
                                                border: done ? "0" : "1px solid #6d789e",
                                                background: done ? "#22c55e" : "transparent",
                                                color: done ? "#fff" : "transparent",
                                                fontWeight:900,
                                            }}>✓</span>
                                            <span>{item}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {getRejectionReason(selectedApplication) && (
                                <div className="lrm-message lrm-rejection">
                                    <div className="lrm-message-title">Rejection Reason</div>
                                    <div>{getRejectionReason(selectedApplication)}</div>
                                </div>
                            )}

                            {selectedApplication?.correction_message && (
                                <div className="lrm-message lrm-correction">
                                    <div className="lrm-message-title">Correction Required</div>
                                    {selectedApplication.correction_message}
                                </div>
                            )}

                            {actionError && <div className="lrm-error">{actionError}</div>}
                            {actionSuccess && <div className="lrm-success">✓ {actionSuccess}</div>}

                            <div className="lrm-decision">
                                {getStatus(selectedApplication) === "approved" ? (
                                    <div className="lrm-final-state approved">✓ Approved</div>
                                ) : getStatus(selectedApplication) === "rejected" ? (
                                    <div className="lrm-final-state rejected">✕ Rejected</div>
                                ) : (
                                    <>
                                        <button
                                            className="lrm-decision-btn reject"
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setActionError("");
                                                setRejectReason("");
                                                setRejectModalOpen(true);
                                            }}
                                        >
                                            ✕ Reject
                                        </button>

                                        <button
                                            className="lrm-decision-btn approve"
                                            disabled={actionLoading}
                                            onClick={() => {
                                                setActionError("");
                                                setApproveModalOpen(true);
                                            }}
                                        >
                                            ✓ Approve
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {documentPreview && (
                <div
                    className="lrm-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setDocumentPreview(null);
                    }}
                >
                    <div className="lrm-file-modal">
                        <div className="lrm-file-head">
                            <div className="lrm-file-title">
                                <div className="lrm-file-name">{documentPreview.name}</div>
                                <div className="lrm-file-type">{documentPreview.type}</div>
                            </div>
                            <div style={{display:"flex", alignItems:"center", gap:14}}>
                                <a
                                    href={documentPreview.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="lrm-open-link"
                                >
                                    Open in New Tab ↗
                                </a>
                                <button
                                    type="button"
                                    className="lrm-close"
                                    onClick={() => setDocumentPreview(null)}
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="lrm-file-body">
                            {documentPreview.isImage ? (
                                <img src={documentPreview.url} alt={documentPreview.name} />
                            ) : documentPreview.isPdf ? (
                                <iframe src={documentPreview.url} title={documentPreview.name} />
                            ) : (
                                <div className="lrm-file-fallback">
                                    This document format cannot be previewed directly here.
                                    <br />
                                    Use <strong>Open in New Tab</strong> to review the submitted file.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {approveModalOpen && (
                <div className="lrm-overlay">
                    <div className="lrm-confirm">
                        <div className="lrm-confirm-icon">✓</div>
                        <h3 className="lrm-confirm-title">Approve Late Enrollee?</h3>
                        <p className="lrm-confirm-text">
                            Approving <strong>{getStudentName(selectedApplication)}</strong> will create or activate the student's VOTARA account.
                            <br /><br />
                            {hasEmail(selectedApplication) ? (
                                <>
                                    A temporary password will be generated and sent directly to:
                                    <br /><br />
                                    <strong>{getEmail(selectedApplication)}</strong>
                                    <br /><br />
                                    The student will be required to create a personal password and complete their profile photo before accessing the dashboard.
                                </>
                            ) : (
                                <>
                                    No email address was provided. The account will be activated without sending an email, and activation will continue on the current kiosk device.
                                    <br /><br />
                                    The student will create their personal 8-character password on the kiosk before accessing the dashboard.
                                </>
                            )}
                        </p>

                        <div className="lrm-confirm-actions">
                            <button
                                className="lrm-confirm-btn"
                                onClick={() => setApproveModalOpen(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="lrm-confirm-btn approve"
                                onClick={approveApplication}
                                disabled={actionLoading}
                            >
                                {actionLoading ? "Approving..." : "Confirm Approval"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rejectModalOpen && (
                <div className="lrm-overlay">
                    <div className="lrm-confirm">
                        <div className="lrm-confirm-icon reject">!</div>
                        <h3 className="lrm-confirm-title">Reject Application</h3>
                        <p className="lrm-confirm-text">
                            Enter the reason that will be associated with this lrm-rejection.
                        </p>

                        <textarea
                            className="lrm-reason"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter lrm-rejection reason..."
                            disabled={actionLoading}
                        />

                        <div className="lrm-confirm-actions">
                            <button
                                className="lrm-confirm-btn"
                                onClick={() => {
                                    setRejectModalOpen(false);
                                    setRejectReason("");
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="lrm-confirm-btn reject"
                                onClick={rejectApplication}
                                disabled={actionLoading || !rejectReason.trim()}
                            >
                                {actionLoading ? "Rejecting..." : "Reject Application"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
=======
function Status({ status }) {
    return <span className={`le-status is-${statusClass(status)}`}><span aria-hidden="true" />{formatStatus(status)}</span>;
>>>>>>> e3c28d7b064dd8e06d0f4f70aaf6d2c0bff200a1
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
