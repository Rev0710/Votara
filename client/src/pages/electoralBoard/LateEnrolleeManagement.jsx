import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../../services/api";

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

    correction: (id) =>
        `/electoral-board/late-enrollees/${id}/correction`,
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
    "—";

const getStatus = (item) =>
    String(
        item?.application_status ||
        item?.status ||
        "pending"
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

const formatStatus = (status) => {
    const value = String(status || "pending")
        .replace(/_/g, " ");

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

// ============================================================
// COMPONENT
// ============================================================

function LateEnrolleeManagement() {

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

    const [
        correctionModalOpen,
        setCorrectionModalOpen,
    ] = useState(false);

    const [rejectReason, setRejectReason] =
        useState("");

    const [
        correctionReason,
        setCorrectionReason,
    ] = useState("");

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

        setDocumentsError("");

        setActionError("");

        setActionSuccess("");

        setApproveModalOpen(false);

        setRejectModalOpen(false);

        setCorrectionModalOpen(false);

        setRejectReason("");

        setCorrectionReason("");
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

                const data =
                    response?.data || {};

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
                    data?.message ||
                    "Late enrollee approved successfully. The student account has been activated and the temporary password was sent to the registered email address."
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
                    "A rejection reason is required."
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
    // CORRECTION
    // ========================================================

    const requestCorrection =
        async () => {

            if (!selectedApplication)
                return;

            const id =
                getApplicationId(
                    selectedApplication
                );

            const reason =
                correctionReason.trim();

            if (!reason) {
                setActionError(
                    "A correction reason is required."
                );
                return;
            }

            try {

                setActionLoading(true);

                setActionError("");

                setActionSuccess("");

                await api.patch(
                    API.correction(id),
                    {
                        reason,
                        remarks: reason,
                        correction_message:
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
                                              "needs_correction",
                                          correction_message:
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
                                      "needs_correction",
                                  correction_message:
                                      reason,
                              }
                            : current
                );

                setCorrectionModalOpen(
                    false
                );

                setCorrectionReason("");

                setActionSuccess(
                    "Correction request sent successfully."
                );

                await loadApplications(
                    true
                );

            } catch (err) {

                console.error(
                    "Correction request error:",
                    err
                );

                setActionError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    "Unable to request correction."
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
            return "correction";
        }

        return "pending";
    };

    // ========================================================
    // RENDER
    // ========================================================

    return (

        <div className="late-page">

            <style>{`

                * {
                    box-sizing: border-box;
                }

                .late-page {
                    width: 100%;
                    color: #0f172a;
                }

                .late-container {
                    max-width: 1250px;
                    margin: 0 auto;
                    padding: 28px 22px 50px;
                }

                .late-header {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    padding: 25px 27px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 20px;
                    box-shadow:
                        0 8px 25px
                        rgba(15, 23, 42, 0.05);
                }

                .late-header-left {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }

                .late-icon {
                    width: 55px;
                    height: 55px;
                    border-radius: 15px;
                    background: #eff6ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 25px;
                }

                .eyebrow {
                    color: #2563eb;
                    font-size: 10px;
                    font-weight: 800;
                    letter-spacing: 1.1px;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }

                .late-title {
                    margin: 0;
                    font-size: 27px;
                    font-weight: 800;
                }

                .late-subtitle {
                    margin: 6px 0 0;
                    color: #64748b;
                    font-size: 13px;
                }

                .refresh-btn {
                    height: 42px;
                    padding: 0 17px;
                    border: 1px solid #dbe3ef;
                    background: #ffffff;
                    color: #1e3a8a;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 800;
                }

                .refresh-btn:hover {
                    background: #eff6ff;
                }

                .error-banner {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #b91c1c;
                    border-radius: 11px;
                    padding: 13px 15px;
                    margin-bottom: 17px;
                    font-size: 12px;
                }

                .success-banner {
                    background: #ecfdf5;
                    border: 1px solid #bbf7d0;
                    color: #166534;
                    border-radius: 11px;
                    padding: 13px 15px;
                    margin-top: 16px;
                    font-size: 12px;
                    line-height: 1.5;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .stat-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 15px;
                    padding: 18px;
                    display: flex;
                    align-items: center;
                    gap: 13px;
                }

                .stat-icon {
                    width: 43px;
                    height: 43px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }

                .blue {
                    background: #eff6ff;
                }

                .amber {
                    background: #fff7ed;
                }

                .green {
                    background: #ecfdf5;
                }

                .red {
                    background: #fef2f2;
                }

                .stat-label {
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 700;
                }

                .stat-value {
                    font-size: 24px;
                    font-weight: 800;
                }

                .applications-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    overflow: hidden;
                }

                .applications-top {
                    padding: 22px;
                    border-bottom: 1px solid #e2e8f0;
                }

                .title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                    margin-bottom: 17px;
                }

                .applications-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                }

                .applications-description {
                    margin: 4px 0 0;
                    color: #64748b;
                    font-size: 12px;
                }

                .filters {
                    display: grid;
                    grid-template-columns: 1fr 200px;
                    gap: 11px;
                }

                .search-box,
                .status-select {
                    height: 44px;
                    width: 100%;
                    border: 1px solid #d7e0ec;
                    border-radius: 10px;
                    background: #ffffff;
                    outline: none;
                    font-size: 12px;
                    padding: 0 14px;
                }

                .application-row {
                    display: grid;
                    grid-template-columns:
                        minmax(250px, 1.7fr)
                        1fr
                        1fr
                        145px
                        105px;
                    gap: 15px;
                    align-items: center;
                    padding: 17px 22px;
                    border-bottom: 1px solid #edf1f6;
                }

                .application-row:last-child {
                    border-bottom: 0;
                }

                .application-row:hover {
                    background: #f8fbff;
                }

                .application-header {
                    background: #f8fafc;
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: .6px;
                }

                .student-cell {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                }

                .student-avatar {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    background: #eff6ff;
                    color: #2563eb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    font-weight: 800;
                    flex-shrink: 0;
                }

                .student-name {
                    font-size: 13px;
                    font-weight: 800;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .student-id {
                    margin-top: 3px;
                    font-size: 10px;
                    color: #94a3b8;
                }

                .cell-main {
                    font-size: 12px;
                    font-weight: 700;
                }

                .cell-sub {
                    margin-top: 3px;
                    font-size: 10px;
                    color: #94a3b8;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    border-radius: 999px;
                    padding: 6px 10px;
                    font-size: 10px;
                    font-weight: 800;
                    white-space: nowrap;
                }

                .status-badge .dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: currentColor;
                }

                .status-badge.pending {
                    background: #fff7ed;
                    color: #c2410c;
                }

                .status-badge.approved {
                    background: #ecfdf5;
                    color: #15803d;
                }

                .status-badge.rejected {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .status-badge.correction {
                    background: #fff7ed;
                    color: #b45309;
                }

                .row-action {
                    display: flex;
                    justify-content: flex-end;
                }

                .review-btn {
                    height: 34px;
                    padding: 0 13px;
                    border-radius: 8px;
                    border: 1px solid #2563eb;
                    background: #2563eb;
                    color: white;
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: 800;
                }

                .loading-state,
                .empty-state {
                    padding: 60px 25px;
                    text-align: center;
                    color: #64748b;
                    font-size: 13px;
                }

                .spinner {
                    width: 28px;
                    height: 28px;
                    border: 3px solid #dbeafe;
                    border-top-color: #2563eb;
                    border-radius: 50%;
                    animation: spin .8s linear infinite;
                    margin: 0 auto 12px;
                }

                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1000;
                    background: rgba(15, 23, 42, .60);
                    backdrop-filter: blur(5px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .details-modal {
                    width: min(960px, 100%);
                    max-height: 92vh;
                    background: #ffffff;
                    border-radius: 18px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow:
                        0 25px 80px
                        rgba(15, 23, 42, .25);
                }

                .modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e2e8f0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .modal-title {
                    margin: 0;
                    font-size: 20px;
                    font-weight: 800;
                }

                .modal-close {
                    width: 35px;
                    height: 35px;
                    border: 0;
                    border-radius: 9px;
                    background: #f1f5f9;
                    cursor: pointer;
                    font-size: 18px;
                }

                .modal-content {
                    overflow-y: auto;
                    padding: 22px 24px 25px;
                }

                .student-profile {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 15px;
                    border: 1px solid #dbeafe;
                    background: #f8fbff;
                    border-radius: 13px;
                    margin-bottom: 20px;
                }

                .profile-avatar {
                    width: 64px;
                    height: 64px;
                    border-radius: 15px;
                    background: #2563eb;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: 800;
                }

                .profile-name {
                    font-size: 17px;
                    font-weight: 800;
                }

                .profile-meta {
                    margin-top: 5px;
                    font-size: 11px;
                    color: #64748b;
                }

                .section-title {
                    font-size: 14px;
                    font-weight: 800;
                    margin: 22px 0 10px;
                }

                .details-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(3, minmax(0, 1fr));
                    gap: 11px;
                }

                .detail-box {
                    border: 1px solid #e2e8f0;
                    border-radius: 11px;
                    padding: 13px;
                }

                .detail-label {
                    font-size: 9px;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: .7px;
                    font-weight: 800;
                }

                .detail-value {
                    margin-top: 5px;
                    font-size: 12px;
                    font-weight: 700;
                    word-break: break-word;
                }

                .selfie-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 13px;
                    padding: 14px;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }

                .selfie-preview {
                    width: 130px;
                    height: 160px;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #e2e8f0;
                    flex-shrink: 0;
                }

                .selfie-preview img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .selfie-title {
                    font-size: 14px;
                    font-weight: 800;
                    margin-bottom: 5px;
                }

                .selfie-info {
                    color: #475569;
                    font-size: 12px;
                    line-height: 1.6;
                }

                .open-link,
                .document-open {
                    display: inline-flex;
                    margin-top: 8px;
                    color: #2563eb;
                    font-size: 10px;
                    font-weight: 800;
                    text-decoration: none;
                }

                .document-list {
                    display: grid;
                    gap: 9px;
                }

                .document-item {
                    border: 1px solid #e2e8f0;
                    border-radius: 11px;
                    padding: 13px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 15px;
                }

                .document-name {
                    font-size: 12px;
                    font-weight: 800;
                }

                .document-type {
                    margin-top: 4px;
                    color: #94a3b8;
                    font-size: 10px;
                }

                .document-status {
                    background: #ecfdf5;
                    color: #15803d;
                    border-radius: 999px;
                    padding: 5px 9px;
                    font-size: 9px;
                    font-weight: 800;
                }

                .no-documents {
                    border: 1px dashed #cbd5e1;
                    border-radius: 10px;
                    padding: 20px;
                    text-align: center;
                    color: #64748b;
                    font-size: 11px;
                }

                .review-message {
                    margin-top: 15px;
                    border-radius: 11px;
                    padding: 13px;
                    font-size: 11px;
                    line-height: 1.55;
                }

                .review-message.rejection {
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                    color: #991b1b;
                }

                .review-message.correction {
                    background: #fff7ed;
                    border: 1px solid #fed7aa;
                    color: #9a3412;
                }

                .review-message-title {
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }

                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                    gap: 9px;
                    padding-top: 20px;
                    margin-top: 22px;
                    border-top: 1px solid #e2e8f0;
                }

                .modal-action {
                    height: 41px;
                    padding: 0 16px;
                    border-radius: 9px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 800;
                }

                .modal-action.approve {
                    background: #16a34a;
                    border: 1px solid #16a34a;
                    color: white;
                }

                .modal-action.reject {
                    background: white;
                    border: 1px solid #fecaca;
                    color: #dc2626;
                }

                .modal-action.correction {
                    background: white;
                    border: 1px solid #fed7aa;
                    color: #c2410c;
                }

                .small-modal {
                    width: min(480px, 100%);
                    background: white;
                    border-radius: 16px;
                    padding: 24px;
                    box-shadow:
                        0 25px 70px
                        rgba(15, 23, 42, .25);
                }

                .small-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 13px;
                    background: #eff6ff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    margin-bottom: 14px;
                }

                .small-icon.reject {
                    background: #fef2f2;
                }

                .small-icon.correction {
                    background: #fff7ed;
                }

                .small-title {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 800;
                }

                .small-text {
                    margin: 8px 0 0;
                    color: #64748b;
                    font-size: 12px;
                    line-height: 1.6;
                }

                .reason-textarea {
                    width: 100%;
                    min-height: 125px;
                    margin-top: 15px;
                    padding: 12px;
                    border: 1px solid #dbe3ef;
                    border-radius: 10px;
                    resize: vertical;
                    outline: none;
                    font-family: inherit;
                    font-size: 12px;
                }

                .small-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    margin-top: 20px;
                }

                .small-btn {
                    height: 39px;
                    padding: 0 15px;
                    border-radius: 9px;
                    border: 1px solid #dbe3ef;
                    background: white;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 800;
                }

                .small-btn.approve {
                    background: #16a34a;
                    border-color: #16a34a;
                    color: white;
                }

                .small-btn.reject {
                    background: #dc2626;
                    border-color: #dc2626;
                    color: white;
                }

                .small-btn.correction {
                    background: #ea580c;
                    border-color: #ea580c;
                    color: white;
                }

                @media (max-width: 900px) {

                    .stats-grid {
                        grid-template-columns:
                            repeat(2, 1fr);
                    }

                    .application-row {
                        grid-template-columns:
                            1.5fr
                            1fr
                            1fr
                            140px;
                    }

                    .application-row
                        > :last-child {
                        grid-column: 1 / -1;
                        justify-content: flex-start;
                    }
                }

                @media (max-width: 700px) {

                    .late-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .refresh-btn {
                        width: 100%;
                    }

                    .filters {
                        grid-template-columns: 1fr;
                    }

                    .application-header {
                        display: none;
                    }

                    .application-row {
                        grid-template-columns: 1fr;
                        gap: 10px;
                    }

                    .details-grid {
                        grid-template-columns: 1fr;
                    }

                    .selfie-card {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .modal-actions,
                    .small-actions {
                        flex-direction: column;
                    }

                    .modal-action,
                    .small-btn {
                        width: 100%;
                    }
                }

                @media (max-width: 500px) {

                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .late-container {
                        padding: 18px 12px 35px;
                    }

                    .modal-overlay {
                        padding: 10px;
                    }

                    .modal-content {
                        padding: 18px;
                    }
                }

            `}</style>

            <div className="late-container">

                {/* HEADER */}

                <div className="late-header">

                    <div className="late-header-left">

                        <div className="late-icon">
                            📝
                        </div>

                        <div>

                            <div className="eyebrow">
                                Electoral Board
                            </div>

                            <h1 className="late-title">
                                Late Enrollee Management
                            </h1>

                            <p className="late-subtitle">
                                Review and manage students who registered after the original enrollment roster.
                            </p>

                        </div>

                    </div>

                    <button
                        className="refresh-btn"
                        onClick={() =>
                            loadApplications(true)
                        }
                        disabled={
                            loading ||
                            refreshing
                        }
                    >
                        {refreshing
                            ? "Refreshing..."
                            : "↻ Refresh"}
                    </button>

                </div>

                {/* ERROR */}

                {error && (
                    <div className="error-banner">
                        <strong>!</strong>{" "}
                        {error}
                    </div>
                )}

                {/* STATISTICS */}

                <div className="stats-grid">

                    <div className="stat-card">

                        <div className="stat-icon blue">
                            📋
                        </div>

                        <div>
                            <div className="stat-label">
                                Total Applications
                            </div>

                            <div className="stat-value">
                                {
                                    statistics.total
                                }
                            </div>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon amber">
                            ⏳
                        </div>

                        <div>
                            <div className="stat-label">
                                For Review
                            </div>

                            <div className="stat-value">
                                {
                                    statistics.pending
                                }
                            </div>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon green">
                            ✓
                        </div>

                        <div>
                            <div className="stat-label">
                                Approved
                            </div>

                            <div className="stat-value">
                                {
                                    statistics.approved
                                }
                            </div>
                        </div>

                    </div>

                    <div className="stat-card">

                        <div className="stat-icon red">
                            !
                        </div>

                        <div>
                            <div className="stat-label">
                                Rejected
                            </div>

                            <div className="stat-value">
                                {
                                    statistics.rejected
                                }
                            </div>
                        </div>

                    </div>

                </div>

                {/* APPLICATIONS */}

                <div className="applications-card">

                    <div className="applications-top">

                        <div className="title-row">

                            <div>

                                <h2 className="applications-title">
                                    Late Enrollee Applications
                                </h2>

                                <p className="applications-description">
                                    Select Review to inspect the student's information, selfie, and submitted documents.
                                </p>

                            </div>

                            <strong
                                style={{
                                    fontSize: 11,
                                    color: "#64748b",
                                }}
                            >
                                {
                                    filteredApplications.length
                                }{" "}
                                shown
                            </strong>

                        </div>

                        <div className="filters">

                            <input
                                className="search-box"
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                placeholder="Search student name, Student ID, year level, or status..."
                            />

                            <select
                                className="status-select"
                                value={
                                    statusFilter
                                }
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                            >

                                <option value="all">
                                    All Status
                                </option>

                                <option value="pending">
                                    Pending
                                </option>

                                <option value="submitted">
                                    Submitted
                                </option>

                                <option value="under_review">
                                    Under Review
                                </option>

                                <option value="needs_correction">
                                    Correction Required
                                </option>

                                <option value="approved">
                                    Approved
                                </option>

                                <option value="rejected">
                                    Rejected
                                </option>

                            </select>

                        </div>

                    </div>

                    {loading ? (

                        <div className="loading-state">

                            <div className="spinner" />

                            Loading late enrollee applications...

                        </div>

                    ) : filteredApplications.length ===
                      0 ? (

                        <div className="empty-state">

                            <div
                                style={{
                                    fontSize: 30,
                                    marginBottom: 10,
                                }}
                            >
                                📝
                            </div>

                            <strong
                                style={{
                                    color: "#0f172a",
                                    fontSize: 16,
                                }}
                            >
                                No Late Enrollee Applications
                            </strong>

                            <div
                                style={{
                                    marginTop: 7,
                                    fontSize: 12,
                                }}
                            >
                                {search ||
                                statusFilter !==
                                    "all"
                                    ? "No applications match your current filters."
                                    : "There are currently no late enrollee applications."}
                            </div>

                        </div>

                    ) : (

                        <>

                            <div className="application-row application-header">

                                <div>
                                    Student
                                </div>

                                <div>
                                    Year Level
                                </div>

                                <div>
                                    Enrollment
                                </div>

                                <div>
                                    Status
                                </div>

                                <div>
                                    Action
                                </div>

                            </div>

                            {filteredApplications.map(
                                (application) => {

                                    const id =
                                        getApplicationId(
                                            application
                                        );

                                    const name =
                                        getStudentName(
                                            application
                                        );

                                    const status =
                                        getStatus(
                                            application
                                        );

                                    return (

                                        <div
                                            className="application-row"
                                            key={id}
                                        >

                                            <div className="student-cell">

                                                <div className="student-avatar">
                                                    {getInitials(
                                                        name
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        minWidth: 0,
                                                    }}
                                                >

                                                    <div className="student-name">
                                                        {
                                                            name
                                                        }
                                                    </div>

                                                    <div className="student-id">
                                                        Student ID:{" "}
                                                        {
                                                            getStudentId(
                                                                application
                                                            ) ||
                                                            "—"
                                                        }
                                                    </div>

                                                </div>

                                            </div>

                                            <div>

                                                <div className="cell-main">
                                                    {
                                                        getYearLevel(
                                                            application
                                                        )
                                                    }
                                                </div>

                                                <div className="cell-sub">
                                                    Year Level
                                                </div>

                                            </div>

                                            <div>

                                                <div className="cell-main">
                                                    {
                                                        getEnrollmentStatus(
                                                            application
                                                        )
                                                    }
                                                </div>

                                                <div className="cell-sub">
                                                    Enrollment
                                                </div>

                                            </div>

                                            <div>

                                                <span
                                                    className={`status-badge ${statusClass(
                                                        status
                                                    )}`}
                                                >

                                                    <span className="dot" />

                                                    {
                                                        formatStatus(
                                                            status
                                                        )
                                                    }

                                                </span>

                                            </div>

                                            <div className="row-action">

                                                <button
                                                    className="review-btn"
                                                    onClick={() =>
                                                        openDetails(
                                                            application
                                                        )
                                                    }
                                                >
                                                    Review
                                                </button>

                                            </div>

                                        </div>

                                    );
                                }
                            )}

                        </>

                    )}

                </div>

            </div>

            {/* ====================================================
                REVIEW MODAL
            ===================================================== */}

            {detailsOpen &&
                selectedApplication && (

                    <div
                        className="modal-overlay"
                        onMouseDown={(e) => {

                            if (
                                e.target ===
                                e.currentTarget
                            ) {
                                closeDetails();
                            }

                        }}
                    >

                        <div className="details-modal">

                            <div className="modal-header">

                                <div>

                                    <div className="eyebrow">
                                        Electoral Board
                                    </div>

                                    <h2 className="modal-title">
                                        Late Enrollee Review
                                    </h2>

                                </div>

                                <button
                                    className="modal-close"
                                    onClick={
                                        closeDetails
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            <div className="modal-content">

                                {/* PROFILE */}

                                <div className="student-profile">

                                    <div className="profile-avatar">
                                        {getInitials(
                                            getStudentName(
                                                selectedApplication
                                            )
                                        )}
                                    </div>

                                    <div>

                                        <div className="profile-name">
                                            {
                                                getStudentName(
                                                    selectedApplication
                                                )
                                            }
                                        </div>

                                        <div className="profile-meta">

                                            Student ID:{" "}
                                            {
                                                getStudentId(
                                                    selectedApplication
                                                )
                                            }

                                            {" • "}

                                            {
                                                getYearLevel(
                                                    selectedApplication
                                                )
                                            }

                                            {" • Late Enrollee"}

                                        </div>

                                    </div>

                                </div>

                                {/* STUDENT INFORMATION */}

                                <div className="section-title">
                                    Student Information
                                </div>

                                <div className="details-grid">

                                    <div className="detail-box">

                                        <div className="detail-label">
                                            Full Name
                                        </div>

                                        <div className="detail-value">
                                            {
                                                getStudentName(
                                                    selectedApplication
                                                )
                                            }
                                        </div>

                                    </div>

                                    <div className="detail-box">

                                        <div className="detail-label">
                                            Student ID
                                        </div>

                                        <div className="detail-value">
                                            {
                                                getStudentId(
                                                    selectedApplication
                                                ) ||
                                                "—"
                                            }
                                        </div>

                                    </div>

                                    <div className="detail-box">

                                        <div className="detail-label">
                                            Year Level
                                        </div>

                                        <div className="detail-value">
                                            {
                                                getYearLevel(
                                                    selectedApplication
                                                )
                                            }
                                        </div>

                                    </div>

                                    <div className="detail-box">

                                        <div className="detail-label">
                                            Email
                                        </div>

                                        <div className="detail-value">
                                            {
                                                getEmail(
                                                    selectedApplication
                                                )
                                            }
                                        </div>

                                    </div>

                                    <div className="detail-box">

                                        <div className="detail-label">
                                            Application Status
                                        </div>

                                        <div className="detail-value">

                                            <span
                                                className={`status-badge ${statusClass(
                                                    getStatus(
                                                        selectedApplication
                                                    )
                                                )}`}
                                            >

                                                <span className="dot" />

                                                {
                                                    formatStatus(
                                                        getStatus(
                                                            selectedApplication
                                                        )
                                                    )
                                                }

                                            </span>

                                        </div>

                                    </div>

                                    <div className="detail-box">

                                        <div className="detail-label">
                                            Enrollment Status
                                        </div>

                                        <div className="detail-value">
                                            {
                                                getEnrollmentStatus(
                                                    selectedApplication
                                                )
                                            }
                                        </div>

                                    </div>

                                    <div className="detail-box">

                                        <div className="detail-label">
                                            Submitted
                                        </div>

                                        <div className="detail-value">
                                            {
                                                formatDate(
                                                    selectedApplication?.submitted_at ||
                                                    selectedApplication?.created_at
                                                )
                                            }
                                        </div>

                                    </div>

                                </div>

                                {/* SELFIE */}

                                <div className="section-title">
                                    Registration Selfie
                                </div>

                                {selfieUrl ? (

                                    <div className="selfie-card">

                                        <div className="selfie-preview">

                                            <img
                                                src={
                                                    selfieUrl
                                                }
                                                alt="Student registration selfie"
                                            />

                                        </div>

                                        <div className="selfie-info">

                                            <div className="selfie-title">
                                                Selfie captured during registration
                                            </div>

                                            <div>
                                                This image was submitted during the late enrollee registration process.
                                            </div>

                                            <a
                                                href={
                                                    selfieUrl
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                className="open-link"
                                            >
                                                Open Selfie ↗
                                            </a>

                                        </div>

                                    </div>

                                ) : (

                                    <div className="no-documents">
                                        Registration selfie is not available.
                                    </div>

                                )}

                                {/* DOCUMENTS */}

                                <div className="section-title">
                                    Submitted Documents
                                </div>

                                {documentsLoading ? (

                                    <div className="loading-state">

                                        <div className="spinner" />

                                        Loading submitted documents...

                                    </div>

                                ) : documentsError ? (

                                    <div className="error-banner">
                                        {documentsError}
                                    </div>

                                ) : documents.length ===
                                  0 ? (

                                    <div className="no-documents">
                                        No submitted documents were found.
                                    </div>

                                ) : (

                                    <div className="document-list">

                                        {documents.map(
                                            (
                                                document,
                                                index
                                            ) => {

                                                const url =
                                                    getDocumentUrl(
                                                        document
                                                    );

                                                return (

                                                    <div
                                                        className="document-item"
                                                        key={
                                                            document?.id ||
                                                            index
                                                        }
                                                    >

                                                        <div>

                                                            <div className="document-name">
                                                                📄{" "}
                                                                {
                                                                    getDocumentName(
                                                                        document,
                                                                        index
                                                                    )
                                                                }
                                                            </div>

                                                            <div className="document-type">
                                                                Type:{" "}
                                                                {
                                                                    getDocumentType(
                                                                        document
                                                                    )
                                                                }
                                                            </div>

                                                            {url && (

                                                                <a
                                                                    href={
                                                                        url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="document-open"
                                                                >
                                                                    Open Document ↗
                                                                </a>

                                                            )}

                                                        </div>

                                                        <span className="document-status">
                                                            Submitted
                                                        </span>

                                                    </div>

                                                );
                                            }
                                        )}

                                    </div>

                                )}

                                {/* REJECTION */}

                                {selectedApplication?.rejection_reason && (

                                    <div className="review-message rejection">

                                        <div className="review-message-title">
                                            Rejection Reason
                                        </div>

                                        {
                                            selectedApplication.rejection_reason
                                        }

                                    </div>

                                )}

                                {/* CORRECTION */}

                                {selectedApplication?.correction_message && (

                                    <div className="review-message correction">

                                        <div className="review-message-title">
                                            Correction Required
                                        </div>

                                        {
                                            selectedApplication.correction_message
                                        }

                                    </div>

                                )}

                                {actionError && (

                                    <div className="error-banner">
                                        {actionError}
                                    </div>

                                )}

                                {actionSuccess && (

                                    <div className="success-banner">
                                        ✓{" "}
                                        {
                                            actionSuccess
                                        }
                                    </div>

                                )}

                                {/* EXACTLY THREE ACTIONS */}

                                <div className="modal-actions">

                                    <button
                                        className="modal-action approve"
                                        disabled={
                                            actionLoading ||
                                            getStatus(
                                                selectedApplication
                                            ) ===
                                                "approved"
                                        }
                                        onClick={() => {

                                            setActionError(
                                                ""
                                            );

                                            setApproveModalOpen(
                                                true
                                            );

                                        }}
                                    >
                                        ✓ Approve
                                    </button>

                                    <button
                                        className="modal-action reject"
                                        disabled={
                                            actionLoading ||
                                            getStatus(
                                                selectedApplication
                                            ) ===
                                                "approved"
                                        }
                                        onClick={() => {

                                            setActionError(
                                                ""
                                            );

                                            setRejectReason(
                                                ""
                                            );

                                            setRejectModalOpen(
                                                true
                                            );

                                        }}
                                    >
                                        ✕ Reject
                                    </button>

                                    <button
                                        className="modal-action correction"
                                        disabled={
                                            actionLoading ||
                                            getStatus(
                                                selectedApplication
                                            ) ===
                                                "approved"
                                        }
                                        onClick={() => {

                                            setActionError(
                                                ""
                                            );

                                            setCorrectionReason(
                                                ""
                                            );

                                            setCorrectionModalOpen(
                                                true
                                            );

                                        }}
                                    >
                                        ↻ Correction
                                    </button>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            {/* ====================================================
                APPROVE CONFIRMATION
            ===================================================== */}

            {approveModalOpen && (

                <div className="modal-overlay">

                    <div className="small-modal">

                        <div className="small-icon">
                            ✓
                        </div>

                        <h3 className="small-title">
                            Approve Late Enrollee?
                        </h3>

                        <p className="small-text">

                            Approving{" "}

                            <strong>
                                {
                                    getStudentName(
                                        selectedApplication
                                    )
                                }
                            </strong>

                            {" "}will create or activate
                            the student's VOTARA account.

                            <br />
                            <br />

                            A temporary password will be
                            generated and sent directly to:

                            <br />

                            <strong>
                                {
                                    getEmail(
                                        selectedApplication
                                    )
                                }
                            </strong>

                            <br />
                            <br />

                            The student will be required to
                            create a personal password and
                            complete their profile photo before
                            accessing the dashboard.

                        </p>

                        <div className="small-actions">

                            <button
                                className="small-btn"
                                onClick={() =>
                                    setApproveModalOpen(
                                        false
                                    )
                                    }
                                disabled={
                                    actionLoading
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="small-btn approve"
                                onClick={
                                    approveApplication
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                {actionLoading
                                    ? "Approving..."
                                    : "Confirm Approval"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ====================================================
                REJECT
            ===================================================== */}

            {rejectModalOpen && (

                <div className="modal-overlay">

                    <div className="small-modal">

                        <div className="small-icon reject">
                            !
                        </div>

                        <h3 className="small-title">
                            Reject Application
                        </h3>

                        <p className="small-text">
                            Enter the reason that will be
                            associated with this rejection.
                        </p>

                        <textarea
                            className="reason-textarea"
                            value={
                                rejectReason
                            }
                            onChange={(e) =>
                                setRejectReason(
                                    e.target.value
                                )
                            }
                            placeholder="Enter rejection reason..."
                            disabled={
                                actionLoading
                            }
                        />

                        <div className="small-actions">

                            <button
                                className="small-btn"
                                onClick={() => {

                                    setRejectModalOpen(
                                        false
                                    );

                                    setRejectReason(
                                        ""
                                    );

                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="small-btn reject"
                                onClick={
                                    rejectApplication
                                }
                                disabled={
                                    actionLoading ||
                                    !rejectReason.trim()
                                }
                            >
                                {actionLoading
                                    ? "Rejecting..."
                                    : "Reject Application"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ====================================================
                CORRECTION
            ===================================================== */}

            {correctionModalOpen && (

                <div className="modal-overlay">

                    <div className="small-modal">

                        <div className="small-icon correction">
                            ↻
                        </div>

                        <h3 className="small-title">
                            Request Correction
                        </h3>

                        <p className="small-text">
                            Enter exactly what the student
                            needs to correct before the
                            application can be reviewed again.
                        </p>

                        <textarea
                            className="reason-textarea"
                            value={
                                correctionReason
                            }
                            onChange={(e) =>
                                setCorrectionReason(
                                    e.target.value
                                )
                            }
                            placeholder="Example: Please upload a clearer image of the back of your School ID."
                            disabled={
                                actionLoading
                            }
                        />

                        <div className="small-actions">

                            <button
                                className="small-btn"
                                onClick={() => {

                                    setCorrectionModalOpen(
                                        false
                                    );

                                    setCorrectionReason(
                                        ""
                                    );

                                }}
                            >
                                Cancel
                            </button>

                            <button
                                className="small-btn correction"
                                onClick={
                                    requestCorrection
                                }
                                disabled={
                                    actionLoading ||
                                    !correctionReason.trim()
                                }
                            >
                                {actionLoading
                                    ? "Sending..."
                                    : "Request Correction"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default LateEnrolleeManagement;