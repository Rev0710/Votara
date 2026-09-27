import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../../services/api";
import "./LateEnrolleeManagement.css";

// ============================================================
// API
// ============================================================

const API = {
    applications:
        "/electoral-board/late-enrollees",

    documents: (id) =>
        `/electoral-board/late-enrollees/${id}/documents`,

    approve: (id) =>
        `/electoral-board/late-enrollees/${id}/approve`,

    reject: (id) =>
        `/electoral-board/late-enrollees/${id}/reject`,

};

// ============================================================
// HELPERS
// ============================================================

const getApplications = (response) => {
    const data = response?.data;

    if (Array.isArray(data?.applications)) {
        return data.applications;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    if (Array.isArray(data)) {
        return data;
    }

    return [];
};

const getApplicationId = (item) =>
    item?.id ||
    item?.application_id ||
    "";

const getStudentId = (item) =>
    item?.student_id ||
    item?.student?.student_id ||
    "";

const getStudentName = (item) =>
    item?.full_name ||
    item?.student?.full_name ||
    "Unnamed Student";

const getYearLevel = (item) =>
    item?.year_level ||
    item?.student?.year_level ||
    "—";

const getEmail = (item) =>
    item?.email ||
    item?.student?.email ||
    "";

const hasEmail = (item) =>
    Boolean(
        String(getEmail(item) || "").trim()
    );

const getStatus = (item) =>
    String(
        item?.application_status ||
        item?.status ||
        "pending"
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

const getRejectionReason = (item) =>
    item?.rejection_reason ||
    item?.rejectionReason ||
    item?.reason ||
    item?.remarks ||
    "";

const formatStatus = (status) => {
    const normalized = String(status || "pending")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

    if (
        normalized === "pending" ||
        normalized === "pending_review" ||
        normalized === "submitted" ||
        normalized === "under_review"
    ) {
        return "In Review";
    }

    if (normalized === "approved") {
        return "Approved";
    }

    if (normalized === "rejected") {
        return "Rejected";
    }

    const value = normalized.replace(/_/g, " ");

    return value.replace(
        /\b\w/g,
        (letter) => letter.toUpperCase()
    );
};

const getEnrollmentStatus = (item) =>
    item?.enrollment_status ||
    item?.student?.enrollment_status ||
    "Not verified";

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
        }
    );
};

const getInitials = (name) => {
    if (!name) return "LE";

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
};

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

                    <select
                        className="lrm-enrollment-select"
                        value="late_enrolled"
                        onChange={(event) => {
                            const value = event.target.value;

                            if (value === "enrolled") {
                                if (typeof onNavigate === "function") {
                                    onNavigate("registrations");
                                }
                            }
                        }}
                        aria-label="Enrollment type"
                    >
                        <option value="enrolled">Enrolled</option>
                        <option value="late_enrolled">Late Enrolled</option>
                    </select>
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

                    <div style={{
                        gridColumn: 2,
                        gridRow: 1,
                        minWidth: 0,
                        marginLeft: 16,
                        minHeight: 500,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(111,126,184,.25)",
                        borderRadius: 15,
                        background: "rgba(31,36,75,.72)",
                        color: "#7f89aa",
                        boxShadow: "0 14px 40px rgba(0,0,0,.12)",
                        padding: 30,
                        textAlign: "center",
                    }}>
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
                <div
                    className="lrm-overlay"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeDetails();
                    }}
                >
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
                                    const done = index < 3 ? true : Boolean(selfieUrl);
                                    return (
                                        <div key={item} style={{
                                            display:"flex",
                                            alignItems:"center",
                                            gap:12,
                                            minHeight:42,
                                            borderBottom:index === 3 ? "0" : "1px solid rgba(111,124,184,.12)",
                                            color:"#eef1fb",
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
}

export default LateEnrolleeManagement;
