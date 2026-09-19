import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

// =====================================================
// REGISTRATION MANAGEMENT
// ELECTORAL BOARD
// =====================================================

const Registrations = () => {
    const navigate = useNavigate();

    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("pending_review");

    const [selectedApplication, setSelectedApplication] =
        useState(null);

    const [showReviewModal, setShowReviewModal] =
        useState(false);

    const [reviewAction, setReviewAction] =
        useState(null);

    const [reviewMessage, setReviewMessage] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =====================================================
    // LOAD APPLICATIONS
    // =====================================================

    const loadApplications = async () => {
        try {
            setError("");

            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                ) ||
                localStorage.getItem(
                    "votaraEBToken"
                );

            if (!token) {
                navigate("/admin-login");
                return;
            }

            const response = await api.get(
                "/eb/registrations",
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;

            setApplications(
                data.applications ||
                data.registrations ||
                []
            );

        } catch (err) {
            console.error(
                "Registration loading error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load student registration applications."
            );

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadApplications();
    }, []);

    // =====================================================
    // REFRESH
    // =====================================================

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadApplications();
    };

    // =====================================================
    // FILTER APPLICATIONS
    // =====================================================

    const filteredApplications = useMemo(() => {
        return applications.filter(
            (application) => {

                const searchValue =
                    search
                        .trim()
                        .toLowerCase();

                const matchesSearch =
                    !searchValue ||
                    String(
                        application.student_id ||
                        ""
                    )
                        .toLowerCase()
                        .includes(searchValue) ||
                    String(
                        application.full_name ||
                        ""
                    )
                        .toLowerCase()
                        .includes(searchValue) ||
                    String(
                        application.email ||
                        ""
                    )
                        .toLowerCase()
                        .includes(searchValue);

                const applicationStatus =
                    String(
                        application.application_status ||
                        "pending_review"
                    ).toLowerCase();

                const matchesStatus =
                    statusFilter === "all" ||
                    applicationStatus ===
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

    // =====================================================
    // STATISTICS
    // =====================================================

    const statistics = useMemo(() => {

        const pending =
            applications.filter(
                (application) =>
                    application.application_status ===
                    "pending_review"
            ).length;

        const approved =
            applications.filter(
                (application) =>
                    application.application_status ===
                    "approved"
            ).length;

        const rejected =
            applications.filter(
                (application) =>
                    application.application_status ===
                    "rejected"
            ).length;

        const revision =
            applications.filter(
                (application) =>
                    application.application_status ===
                    "needs_correction"
            ).length;

        return {
            total: applications.length,
            pending,
            approved,
            rejected,
            revision,
        };

    }, [applications]);

    // =====================================================
    // OPEN REVIEW
    // =====================================================

    const openReview = async (
        application,
        action = "review"
    ) => {

        try {

            setError("");
            setSuccess("");

            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                ) ||
                localStorage.getItem(
                    "votaraEBToken"
                );

            if (!token) {
                navigate("/admin-login");
                return;
            }

            setSelectedApplication(
                application
            );

            setReviewAction(
                action
            );

            setReviewMessage("");

            setShowReviewModal(
                true
            );

            // -------------------------------------------------
            // GET COMPLETE APPLICATION
            // -------------------------------------------------

            const response =
                await api.get(
                    `/eb/registrations/${application.id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const completeApplication =
                response.data
                    ?.application;

            // -------------------------------------------------
            // DEBUG / NORMALIZE COMPLETE APPLICATION
            // -------------------------------------------------
            //
            // The backend returns the uploaded documents
            // under registration_documents and the selfie
            // under identity_verification.
            //
            // Keep compatibility with alternative property
            // names so the EB UI does not incorrectly show
            // "Not submitted" when the records exist.
            // -------------------------------------------------

            console.log(
                "🔎 EB COMPLETE APPLICATION RESPONSE:",
                response.data
            );

            console.log(
                "📄 EB REGISTRATION DOCUMENTS:",
                completeApplication?.registration_documents
            );

            console.log(
                "📸 EB IDENTITY VERIFICATION:",
                completeApplication?.identity_verification
            );

            if (
                completeApplication
            ) {

                const documents =
                    Array.isArray(
                        completeApplication.registration_documents
                    )
                        ? completeApplication.registration_documents
                        : Array.isArray(
                            completeApplication.registrationDocuments
                        )
                        ? completeApplication.registrationDocuments
                        : Array.isArray(
                            completeApplication.documents
                        )
                        ? completeApplication.documents
                        : [];

                const identity =
                    completeApplication.identity_verification ||
                    completeApplication.identityVerification ||
                    (
                        Array.isArray(
                            completeApplication.identity_verifications
                        )
                            ? completeApplication.identity_verifications[0] || null
                            : completeApplication.identity_verifications || null
                    );

                setSelectedApplication({

                    ...completeApplication,

                    registration_documents:
                        documents,

                    identity_verification:
                        identity,

                });

            }

        } catch (err) {

            console.error(
                "Student application loading error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load the complete student application."
            );

        }
    };

    // =====================================================
    // CLOSE REVIEW
    // =====================================================

    const closeReview = () => {

        if (actionLoading) {
            return;
        }

        setShowReviewModal(false);
        setSelectedApplication(null);
        setReviewAction(null);
        setReviewMessage("");
    };

    // =====================================================
    // SUBMIT REVIEW
    // =====================================================

    const submitReview = async () => {

        if (!selectedApplication) {
            return;
        }

        // -------------------------------------------------
        // VALIDATE REJECTION
        // -------------------------------------------------

        if (
            reviewAction ===
                "reject" &&
            !reviewMessage.trim()
        ) {

            setError(
                "Please provide a reason for rejecting the registration."
            );

            return;
        }

        // -------------------------------------------------
        // VALIDATE CORRECTION
        // -------------------------------------------------

        if (
            reviewAction ===
                "request_correction" &&
            !reviewMessage.trim()
        ) {

            setError(
                "Please provide a correction message for the student."
            );

            return;
        }

        try {

            setActionLoading(true);
            setError("");
            setSuccess("");

            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                ) ||
                localStorage.getItem(
                    "votaraEBToken"
                );

            if (!token) {
                navigate("/admin-login");
                return;
            }

            const response =
                await api.patch(
                    `/eb/registrations/${selectedApplication.id}/review`,
                    {
                        decision:
                            reviewAction,

                        reason:
                            reviewMessage.trim(),
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            const responseData =
                response.data;

            let defaultMessage =
                "Registration updated successfully.";

            if (
                reviewAction ===
                "approve"
            ) {
                defaultMessage =
                    "Student registration approved successfully.";
            }

            if (
                reviewAction ===
                "reject"
            ) {
                defaultMessage =
                    "Student registration rejected successfully.";
            }

            if (
                reviewAction ===
                "request_correction"
            ) {
                defaultMessage =
                    "Correction request sent successfully.";
            }

            setSuccess(
                responseData.message ||
                defaultMessage
            );

            setShowReviewModal(false);
            setSelectedApplication(null);
            setReviewAction(null);
            setReviewMessage("");

            await loadApplications();

        } catch (err) {

            console.error(
                "Registration review error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to process the registration."
            );

        } finally {

            setActionLoading(false);
        }
    };

    // =====================================================
    // STATUS DISPLAY
    // =====================================================

    const getStatusLabel = (status) => {

        const labels = {
            pending_review:
                "Pending Review",

            approved:
                "Approved",

            rejected:
                "Rejected",

            needs_correction:
                "Needs Revision",

            otp_verified:
                "OTP Verified",
        };

        return (
            labels[status] ||
            status ||
            "Pending Review"
        );
    };

    const getStatusStyle = (status) => {

        const stylesMap = {

            pending_review: {
                background:
                    "#fff7e6",
                color:
                    "#b7791f",
            },

            approved: {
                background:
                    "#eaf9f1",
                color:
                    "#16804a",
            },

            rejected: {
                background:
                    "#fff0f0",
                color:
                    "#d64545",
            },

            needs_correction: {
                background:
                    "#eef4ff",
                color:
                    "#266EFF",
            },

            otp_verified: {
                background:
                    "#eef4ff",
                color:
                    "#266EFF",
            },
        };

        return (
            stylesMap[status] ||
            stylesMap.pending_review
        );
    };

    // =====================================================
    // DOCUMENT HELPERS
    // =====================================================

    const normalizeDocumentType =
        (type) => {

            if (!type) {
                return "";
            }

            return String(type)
                .trim()
                .toLowerCase()
                .replace(/-/g, "_");
        };

    const getDocuments =
        (application) => {

            if (
                Array.isArray(
                    application?.registration_documents
                )
            ) {
                return application.registration_documents;
            }

            if (
                Array.isArray(
                    application?.registrationDocuments
                )
            ) {
                return application.registrationDocuments;
            }

            if (
                Array.isArray(
                    application?.documents
                )
            ) {
                return application.documents;
            }

            return [];
        };

    const getDocumentByType =
        (
            application,
            type
        ) => {

            const documents =
                getDocuments(
                    application
                );

            const normalizedTarget =
                normalizeDocumentType(
                    type
                );

            return (
                documents.find(
                    (document) =>
                        normalizeDocumentType(
                            document?.document_type ||
                            document?.documentType ||
                            document?.type
                        ) ===
                        normalizedTarget
                ) ||
                null
            );
        };

    const getDocumentLabel =
        (type) => {

            const labels = {
                student_id_front:
                    "Student ID Front",

                student_id_back:
                    "Student ID Back",

                enrollment_proof:
                    "Enrollment Proof",

                supporting_document:
                    "Supporting Document",
            };

            return (
                labels[type] ||
                "Document"
            );
        };

    const getDocumentUrl =
        (document) => {

            if (!document) {
                return "";
            }

            return (
                document.signed_url ||
                document.signedUrl ||
                document.public_url ||
                document.publicUrl ||
                document.url ||
                ""
            );
        };

    const getIdentityVerification =
        (application) => {

            if (
                application?.identity_verification
            ) {
                return application.identity_verification;
            }

            if (
                application?.identity_verifications
            ) {

                if (
                    Array.isArray(
                        application.identity_verifications
                    )
                ) {
                    return (
                        application.identity_verifications[0] ||
                        null
                    );
                }

                return application.identity_verifications;
            }

            return null;
        };

    const getSelfieUrl =
        (application) => {

            const verification =
                getIdentityVerification(
                    application
                );

            if (!verification) {
                return "";
            }

            return (
                verification.selfie_signed_url ||
                verification.selfieSignedUrl ||
                verification.selfie_url ||
                verification.selfieUrl ||
                verification.url ||
                ""
            );
        };

    // =====================================================
    // DOCUMENT CARD
    // =====================================================

    const DocumentCard = ({
        application,
        type,
    }) => {

        const document =
            getDocumentByType(
                application,
                type
            );

        const documentUrl =
            getDocumentUrl(
                document
            );

        return (
            <div
                style={
                    styles.documentCard
                }
            >

                <div
                    style={
                        styles.documentIcon
                    }
                >
                    {type ===
                    "student_id_front"
                        ? "ID"
                        : type ===
                          "student_id_back"
                        ? "ID"
                        : type ===
                          "enrollment_proof"
                        ? "E"
                        : "D"}
                </div>

                <div
                    style={
                        styles.documentInfo
                    }
                >

                    <strong
                        style={
                            styles.documentName
                        }
                    >
                        {getDocumentLabel(
                            type
                        )}
                    </strong>

                    {document ? (

                        <>
                            <span
                                style={
                                    styles.documentStatus
                                }
                            >
                                ✓ Uploaded
                            </span>

                            {document.original_file_name && (
                                <span
                                    style={
                                        styles.documentFileName
                                    }
                                >
                                    {
                                        document.original_file_name
                                    }
                                </span>
                            )}

                        </>

                    ) : (

                        <span
                            style={
                                styles.documentMissing
                            }
                        >
                            Not submitted
                        </span>

                    )}

                </div>

                {document &&
                    documentUrl && (

                        <a
                            href={
                                documentUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={
                                styles.viewDocumentButton
                            }
                        >
                            View
                        </a>

                    )}

            </div>
        );
    };

    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        try {

            return new Date(
                date
            ).toLocaleString(
                "en-PH",
                {
                    dateStyle:
                        "medium",
                    timeStyle:
                        "short",
                }
            );

        } catch {

            return "—";
        }
    };

    // =====================================================
    // CURRENT APPLICATION STATUS
    // =====================================================

    const selectedStatus =
        String(
            selectedApplication?.application_status ||
            "pending_review"
        ).toLowerCase();

    const canReview =
        selectedStatus ===
            "pending_review" ||
        selectedStatus ===
            "needs_correction";

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div style={styles.page}>

            {/* =================================================
                HEADER
            ================================================= */}

            <div style={styles.header}>

                <div>

                    <button
                        onClick={() =>
                            navigate(
                                "/electoral-board/dashboard"
                            )
                        }
                        style={styles.backButton}
                    >
                        ← Back to Dashboard
                    </button>

                    <div
                        style={
                            styles.eyebrow
                        }
                    >
                        ELECTORAL BOARD
                    </div>

                    <h1
                        style={
                            styles.title
                        }
                    >
                        Registration Management
                    </h1>

                    <p
                        style={
                            styles.subtitle
                        }
                    >
                        Review and process student
                        registration applications.
                    </p>

                </div>

                <button
                    onClick={
                        handleRefresh
                    }
                    disabled={
                        refreshing
                    }
                    style={
                        styles.refreshButton
                    }
                >
                    ↻{" "}
                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
                <div
                    style={
                        styles.successAlert
                    }
                >
                    <strong>
                        ✓
                    </strong>

                    <span>
                        {success}
                    </span>
                </div>
            )}

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div
                    style={
                        styles.errorAlert
                    }
                >
                    <strong>
                        !
                    </strong>

                    <span>
                        {error}
                    </span>
                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div
                style={
                    styles.statsGrid
                }
            >

                <StatCard
                    title="Total Applications"
                    value={
                        statistics.total
                    }
                    description="All submitted registrations"
                    icon="▤"
                />

                <StatCard
                    title="Pending Review"
                    value={
                        statistics.pending
                    }
                    description="Awaiting EB action"
                    icon="◷"
                    active
                />

                <StatCard
                    title="Approved"
                    value={
                        statistics.approved
                    }
                    description="Approved voters"
                    icon="✓"
                />

                <StatCard
                    title="Rejected"
                    value={
                        statistics.rejected
                    }
                    description="Rejected applications"
                    icon="×"
                />

            </div>

            {/* =================================================
                APPLICATIONS CARD
            ================================================= */}

            <div
                style={
                    styles.card
                }
            >

                <div
                    style={
                        styles.cardHeader
                    }
                >

                    <div>

                        <h2
                            style={
                                styles.cardTitle
                            }
                        >
                            Student Registration Applications
                        </h2>

                        <p
                            style={
                                styles.cardDescription
                            }
                        >
                            Verify submitted student
                            information before approving
                            the registration.
                        </p>

                    </div>

                </div>

                {/* =================================================
                    FILTERS
                ================================================= */}

                <div
                    style={
                        styles.filters
                    }
                >

                    <div
                        style={
                            styles.searchWrapper
                        }
                    >

                        <span
                            style={
                                styles.searchIcon
                            }
                        >
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search Student ID, name, or email..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            style={
                                styles.searchInput
                            }
                        />

                    </div>

                    <select
                        value={
                            statusFilter
                        }
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        style={
                            styles.select
                        }
                    >

                        <option value="pending_review">
                            Pending Review
                        </option>

                        <option value="approved">
                            Approved
                        </option>

                        <option value="rejected">
                            Rejected
                        </option>

                        <option value="needs_correction">
                            Needs Revision
                        </option>

                        <option value="all">
                            All Status
                        </option>

                    </select>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div
                    style={
                        styles.tableWrapper
                    }
                >

                    {loading ? (

                        <div
                            style={
                                styles.emptyState
                            }
                        >

                            <div
                                style={
                                    styles.loadingIcon
                                }
                            >
                                ◌
                            </div>

                            <h3>
                                Loading applications...
                            </h3>

                            <p>
                                Please wait while
                                registration data is loaded.
                            </p>

                        </div>

                    ) : filteredApplications.length ===
                      0 ? (

                        <div
                            style={
                                styles.emptyState
                            }
                        >

                            <div
                                style={
                                    styles.emptyIcon
                                }
                            >
                                ▤
                            </div>

                            <h3>
                                No applications found
                            </h3>

                            <p>
                                There are no student
                                registrations matching
                                your current filter.
                            </p>

                        </div>

                    ) : (

                        <table
                            style={
                                styles.table
                            }
                        >

                            <thead>

                                <tr>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Student
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Year Level
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Registration Type
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Submitted
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Status
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Action
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredApplications.map(
                                    (
                                        application
                                    ) => {

                                        const status =
                                            application.application_status ||
                                            "pending_review";

                                        return (
                                            <tr
                                                key={
                                                    application.id
                                                }
                                            >

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <div
                                                        style={
                                                            styles.studentCell
                                                        }
                                                    >

                                                        <div
                                                            style={
                                                                styles.avatar
                                                            }
                                                        >
                                                            {getInitials(
                                                                application.full_name
                                                            )}
                                                        </div>

                                                        <div>

                                                            <strong
                                                                style={
                                                                    styles.studentName
                                                                }
                                                            >
                                                                {
                                                                    application.full_name ||
                                                                    "Unknown Student"
                                                                }
                                                            </strong>

                                                            <div
                                                                style={
                                                                    styles.studentId
                                                                }
                                                            >
                                                                ID:{" "}
                                                                {
                                                                    application.student_id ||
                                                                    "—"
                                                                }
                                                            </div>

                                                        </div>

                                                    </div>

                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        application.year_level ||
                                                        "—"
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <span
                                                        style={
                                                            styles.typeBadge
                                                        }
                                                    >
                                                        {
                                                            application.registration_type ===
                                                            "in_person"
                                                                ? "In-Person"
                                                                : "Online"
                                                        }
                                                    </span>

                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >
                                                    {
                                                        formatDate(
                                                            application.submitted_at ||
                                                            application.created_at
                                                        )
                                                    }
                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <span
                                                        style={{
                                                            ...styles.statusBadge,
                                                            ...getStatusStyle(
                                                                status
                                                            ),
                                                        }}
                                                    >
                                                        {
                                                            getStatusLabel(
                                                                status
                                                            )
                                                        }
                                                    </span>

                                                </td>

                                                <td
                                                    style={
                                                        styles.td
                                                    }
                                                >

                                                    <button
                                                        onClick={() =>
                                                            openReview(
                                                                application,
                                                                "review"
                                                            )
                                                        }
                                                        style={
                                                            styles.reviewButton
                                                        }
                                                    >
                                                        Review →
                                                    </button>

                                                </td>

                                            </tr>
                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    )}

                </div>

                <div
                    style={
                        styles.cardFooter
                    }
                >
                    Showing{" "}
                    {
                        filteredApplications.length
                    }{" "}
                    of{" "}
                    {
                        applications.length
                    }{" "}
                    applications
                </div>

            </div>

            {/* =================================================
                REVIEW MODAL
            ================================================= */}

            {showReviewModal &&
                selectedApplication && (

                    <div
                        style={
                            styles.modalOverlay
                        }
                    >

                        <div
                            style={
                                styles.modal
                            }
                        >

                            <div
                                style={
                                    styles.modalHeader
                                }
                            >

                                <div>

                                    <div
                                        style={
                                            styles.modalEyebrow
                                        }
                                    >
                                        REGISTRATION REVIEW
                                    </div>

                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Student Application
                                    </h2>

                                </div>

                                <button
                                    onClick={
                                        closeReview
                                    }
                                    style={
                                        styles.closeButton
                                    }
                                >
                                    ×
                                </button>

                            </div>

                            {/* =================================================
                                STUDENT INFORMATION
                            ================================================= */}

                            <div
                                style={
                                    styles.detailSection
                                }
                            >

                                <h3
                                    style={
                                        styles.detailTitle
                                    }
                                >
                                    Student Information
                                </h3>

                                <div
                                style={
                                    styles.detailGrid
                                }
                            >

                                <DetailItem
                                    label="Student ID"
                                    value={
                                        selectedApplication.student_id
                                    }
                                />

                                <DetailItem
                                    label="Full Name"
                                    value={
                                        selectedApplication.full_name
                                    }
                                />

                                <DetailItem
                                    label="Year Level"
                                    value={
                                        selectedApplication.year_level
                                    }
                                />

                                <DetailItem
                                    label="Email"
                                    value={
                                        selectedApplication.email
                                    }
                                />

                                <DetailItem
                                    label="Registration Type"
                                    value={
                                        selectedApplication.registration_type ===
                                        "in_person"
                                            ? "In-Person"
                                            : "Online"
                                    }
                                />

                                <DetailItem
                                    label="Submitted"
                                    value={
                                        formatDate(
                                            selectedApplication.submitted_at
                                        )
                                    }
                                />

                                <DetailItem
                                    label="Current Status"
                                    value={
                                        getStatusLabel(
                                            selectedApplication.application_status
                                        )
                                    }
                                />

                            </div>
                            </div>

                            {/* =================================================
                                SUBMITTED REQUIREMENTS
                            ================================================= */}

                            <div
                                style={
                                    styles.detailSection
                                }
                            >

                                <h3
                                    style={
                                        styles.detailTitle
                                    }
                                >
                                    Submitted Requirements
                                </h3>

                                <p
                                    style={
                                        styles.sectionDescription
                                    }
                                >
                                    Review the documents submitted
                                    by the student before making a
                                    decision.
                                </p>

                                <div
                                    style={
                                        styles.documentsGrid
                                    }
                                >

                                    <DocumentCard
                                        application={
                                            selectedApplication
                                        }
                                        type="student_id_front"
                                    />

                                    <DocumentCard
                                        application={
                                            selectedApplication
                                        }
                                        type="student_id_back"
                                    />

                                    <DocumentCard
                                        application={
                                            selectedApplication
                                        }
                                        type="enrollment_proof"
                                    />

                                    <DocumentCard
                                        application={
                                            selectedApplication
                                        }
                                        type="supporting_document"
                                    />

                                </div>

                            </div>

                            {/* =================================================
                                IDENTITY VERIFICATION
                            ================================================= */}

                            <div
                                style={
                                    styles.detailSection
                                }
                            >

                                <h3
                                    style={
                                        styles.detailTitle
                                    }
                                >
                                    Identity Verification
                                </h3>

                                <p
                                    style={
                                        styles.sectionDescription
                                    }
                                >
                                    Review the real-time selfie
                                    submitted during registration.
                                </p>

                                {getSelfieUrl(
                                    selectedApplication
                                ) ? (

                                    <div
                                        style={
                                            styles.selfieContainer
                                        }
                                    >

                                        <img
                                            src={
                                                getSelfieUrl(
                                                    selectedApplication
                                                )
                                            }
                                            alt="Student real-time selfie"
                                            style={
                                                styles.selfieImage
                                            }
                                        />

                                        <div
                                            style={
                                                styles.selfieFooter
                                            }
                                        >
                                            <span>
                                                ✓ Selfie submitted
                                            </span>

                                            <a
                                                href={
                                                    getSelfieUrl(
                                                        selectedApplication
                                                    )
                                                }
                                                target="_blank"
                                                rel="noreferrer"
                                                style={
                                                    styles.viewDocumentButton
                                                }
                                            >
                                                Open
                                            </a>
                                        </div>

                                    </div>

                                ) : (

                                    <div
                                        style={
                                            styles.noFileBox
                                        }
                                    >
                                        No selfie preview URL
                                        was returned by the server.
                                    </div>

                                )}

                            </div>

                            {/* =================================================
                                VERIFICATION NOTICE
                            ================================================= */}

                            <div
                                style={
                                    styles.verificationNotice
                                }
                            >

                                <div
                                    style={
                                        styles.noticeIcon
                                    }
                                >
                                    !
                                </div>

                                <div>

                                    <strong>
                                        Verify before approving
                                    </strong>

                                    <p
                                        style={
                                            styles.noticeText
                                        }
                                    >
                                        Confirm that the submitted
                                        student information,
                                        requirements, and identity
                                        verification are valid before
                                        approving this registration.
                                    </p>

                                </div>

                            </div>

                            {/* =================================================
                                REVIEW MESSAGE
                            ================================================= */}

                            {canReview && (

                                <div
                                    style={
                                        styles.messageSection
                                    }
                                >

                                    <label
                                        style={
                                            styles.label
                                        }
                                    >

                                        {reviewAction ===
                                        "request_correction"
                                            ? "Correction Message"
                                            : "Review Message"}

                                        {(reviewAction ===
                                            "reject" ||
                                            reviewAction ===
                                                "request_correction") && (
                                            <span
                                                style={{
                                                    color:
                                                        "#d64545",
                                                }}
                                            >
                                                {" "}*
                                            </span>
                                        )}

                                    </label>

                                    <textarea
                                        value={
                                            reviewMessage
                                        }
                                        onChange={(event) =>
                                            setReviewMessage(
                                                event.target.value
                                            )
                                        }
                                        placeholder={
                                            reviewAction ===
                                            "reject"
                                                ? "Enter the reason for rejection..."
                                                : reviewAction ===
                                                  "request_correction"
                                                ? "Tell the student what needs to be corrected..."
                                                : "Optional note for this review..."
                                        }
                                        rows={4}
                                        style={
                                            styles.textarea
                                        }
                                    />

                                </div>

                            )}

                            {/* =================================================
                                ACTIONS
                            ================================================= */}

                            <div
                                style={
                                    styles.modalActions
                                }
                            >

                                <button
                                    onClick={
                                        closeReview
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    style={
                                        styles.cancelButton
                                    }
                                >
                                    Close
                                </button>

                                {canReview && (

                                    <>
                                        <button
                                            onClick={() => {
                                                setReviewAction(
                                                    "request_correction"
                                                );
                                                setReviewMessage(
                                                    ""
                                                );
                                                setError("");
                                            }}
                                            disabled={
                                                actionLoading
                                            }
                                            style={
                                                styles.correctionButton
                                            }
                                        >
                                            Request Correction
                                        </button>

                                        <button
                                            onClick={() => {
                                                setReviewAction(
                                                    "reject"
                                                );
                                                setReviewMessage(
                                                    ""
                                                );
                                                setError("");
                                            }}
                                            disabled={
                                                actionLoading
                                            }
                                            style={
                                                styles.rejectButton
                                            }
                                        >
                                            Reject
                                        </button>

                                        <button
                                            onClick={() => {
                                                setReviewAction(
                                                    "approve"
                                                );
                                                setReviewMessage(
                                                    ""
                                                );
                                                setError("");
                                            }}
                                            disabled={
                                                actionLoading
                                            }
                                            style={
                                                styles.approveButton
                                            }
                                        >
                                            Approve Student
                                        </button>
                                    </>

                                )}

                            </div>

                            {/* =================================================
                                CONFIRMATION
                            ================================================= */}

                            {reviewAction &&
                                reviewAction !==
                                    "review" &&
                                canReview && (

                                    <div
                                        style={
                                            styles.confirmBox
                                        }
                                    >

                                        <div>

                                            <strong>
                                                {reviewAction ===
                                                "approve"
                                                    ? "Approve this registration?"
                                                    : reviewAction ===
                                                      "reject"
                                                    ? "Reject this registration?"
                                                    : "Request correction?"}
                                            </strong>

                                            <p
                                                style={
                                                    styles.confirmText
                                                }
                                            >

                                                {reviewAction ===
                                                "approve"
                                                    ? "The student will be allowed to continue to the account activation/login process."
                                                    : reviewAction ===
                                                      "reject"
                                                    ? "The student registration will be marked as rejected."
                                                    : "The student will be notified that corrections are required before the registration can be approved."}

                                            </p>

                                        </div>

                                        <button
                                            onClick={
                                                submitReview
                                            }
                                            disabled={
                                                actionLoading
                                            }
                                            style={{
                                                ...styles.confirmButton,
                                                background:
                                                    reviewAction ===
                                                    "approve"
                                                        ? "#16804a"
                                                        : reviewAction ===
                                                          "reject"
                                                        ? "#d64545"
                                                        : "#266EFF",
                                            }}
                                        >
                                            {actionLoading
                                                ? "Processing..."
                                                : reviewAction ===
                                                  "approve"
                                                ? "Confirm Approval"
                                                : reviewAction ===
                                                  "reject"
                                                ? "Confirm Rejection"
                                                : "Send Correction"}
                                        </button>

                                    </div>

                                )}

                        </div>

                    </div>

                )}

        </div>
    );
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
    title,
    value,
    description,
    icon,
    active,
}) => {

    return (
        <div
            style={{
                ...styles.statCard,
                ...(active
                    ? styles.statCardActive
                    : {}),
            }}
        >

            <div
                style={
                    styles.statIcon
                }
            >
                {icon}
            </div>

            <div
                style={
                    styles.statContent
                }
            >

                <div
                    style={
                        styles.statValue
                    }
                >
                    {value}
                </div>

                <div
                    style={
                        styles.statTitle
                    }
                >
                    {title}
                </div>

                <div
                    style={
                        styles.statDescription
                    }
                >
                    {description}
                </div>

            </div>

        </div>
    );
};

// =====================================================
// DETAIL ITEM
// =====================================================

const DetailItem = ({
    label,
    value,
}) => {

    return (
        <div
            style={
                styles.detailItem
            }
        >

            <div
                style={
                    styles.detailLabel
                }
            >
                {label}
            </div>

            <div
                style={
                    styles.detailValue
                }
            >
                {value ||
                    "Not provided"}
            </div>

        </div>
    );
};

// =====================================================
// INITIALS
// =====================================================

const getInitials = (name) => {

    if (!name) {
        return "ST";
    }

    const parts =
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length ===
        1
    ) {
        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[
            parts.length - 1
        ][0]
    ).toUpperCase();
};

// =====================================================
// STYLES
// =====================================================

const styles = {

    page: {
        minHeight:
            "100vh",
        background:
            "#f4f7fb",
        padding:
            "30px 34px 50px",
        fontFamily:
            "'Poppins', 'Inter', Arial, sans-serif",
        color:
            "#172033",
    },

    header: {
        maxWidth:
            "1500px",
        margin:
            "0 auto 25px",
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "flex-start",
        gap:
            "20px",
    },

    backButton: {
        border:
            "none",
        background:
            "transparent",
        padding:
            "0",
        marginBottom:
            "22px",
        color:
            "#64748b",
        cursor:
            "pointer",
        fontSize:
            "12px",
        fontWeight:
            "600",
    },

    eyebrow: {
        fontSize:
            "10px",
        fontWeight:
            "800",
        letterSpacing:
            "1.5px",
        color:
            "#266EFF",
        marginBottom:
            "7px",
    },

    title: {
        margin:
            "0",
        fontSize:
            "28px",
        fontWeight:
            "800",
        color:
            "#111827",
    },

    subtitle: {
        margin:
            "7px 0 0",
        fontSize:
            "13px",
        color:
            "#7a8699",
    },

    refreshButton: {
        border:
            "1px solid #dbe2ec",
        background:
            "#ffffff",
        color:
            "#344054",
        borderRadius:
            "9px",
        padding:
            "11px 17px",
        cursor:
            "pointer",
        fontSize:
            "12px",
        fontWeight:
            "700",
    },

    successAlert: {
        maxWidth:
            "1500px",
        margin:
            "0 auto 18px",
        background:
            "#eaf9f1",
        border:
            "1px solid #b9e8cc",
        color:
            "#16804a",
        borderRadius:
            "10px",
        padding:
            "13px 16px",
        display:
            "flex",
        gap:
            "10px",
        alignItems:
            "center",
        fontSize:
            "12px",
    },

    errorAlert: {
        maxWidth:
            "1500px",
        margin:
            "0 auto 18px",
        background:
            "#fff0f0",
        border:
            "1px solid #ffcaca",
        color:
            "#c53030",
        borderRadius:
            "10px",
        padding:
            "13px 16px",
        display:
            "flex",
        gap:
            "10px",
        alignItems:
            "center",
        fontSize:
            "12px",
    },

    statsGrid: {
        maxWidth:
            "1500px",
        margin:
            "0 auto 24px",
        display:
            "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap:
            "16px",
    },

    statCard: {
        background:
            "#ffffff",
        border:
            "1px solid #e7ebf2",
        borderRadius:
            "15px",
        padding:
            "19px",
        display:
            "flex",
        gap:
            "14px",
        alignItems:
            "center",
        boxShadow:
            "0 5px 18px rgba(24,39,75,0.04)",
    },

    statCardActive: {
        border:
            "1px solid #bfd3ff",
        boxShadow:
            "0 7px 22px rgba(38,110,255,0.08)",
    },

    statIcon: {
        width:
            "43px",
        height:
            "43px",
        minWidth:
            "43px",
        borderRadius:
            "11px",
        background:
            "#edf3ff",
        color:
            "#266EFF",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "19px",
        fontWeight:
            "800",
    },

    statContent: {
        minWidth:
            "0",
    },

    statValue: {
        fontSize:
            "24px",
        fontWeight:
            "800",
        color:
            "#172033",
    },

    statTitle: {
        fontSize:
            "12px",
        fontWeight:
            "700",
        color:
            "#374151",
    },

    statDescription: {
        marginTop:
            "3px",
        fontSize:
            "10px",
        color:
            "#8a95a6",
    },

    card: {
        maxWidth:
            "1500px",
        margin:
            "0 auto",
        background:
            "#ffffff",
        border:
            "1px solid #e7ebf2",
        borderRadius:
            "17px",
        overflow:
            "hidden",
        boxShadow:
            "0 5px 18px rgba(24,39,75,0.04)",
    },

    cardHeader: {
        padding:
            "23px 24px",
        borderBottom:
            "1px solid #edf0f5",
    },

    cardTitle: {
        margin:
            "0",
        fontSize:
            "17px",
        fontWeight:
            "800",
        color:
            "#172033",
    },

    cardDescription: {
        margin:
            "5px 0 0",
        fontSize:
            "11px",
        color:
            "#8490a3",
    },

    filters: {
        padding:
            "15px 20px",
        borderBottom:
            "1px solid #edf0f5",
        display:
            "flex",
        gap:
            "10px",
        alignItems:
            "center",
    },

    searchWrapper: {
        flex:
            "1",
        position:
            "relative",
    },

    searchIcon: {
        position:
            "absolute",
        left:
            "13px",
        top:
            "50%",
        transform:
            "translateY(-50%)",
        color:
            "#94a3b8",
        fontSize:
            "18px",
    },

    searchInput: {
        width:
            "100%",
        border:
            "1px solid #d7dee8",
        borderRadius:
            "9px",
        padding:
            "11px 13px 11px 38px",
        outline:
            "none",
        fontSize:
            "12px",
        color:
            "#172033",
        boxSizing:
            "border-box",
    },

    select: {
        minWidth:
            "160px",
        border:
            "1px solid #d7dee8",
        borderRadius:
            "9px",
        padding:
            "11px 12px",
        background:
            "#ffffff",
        color:
            "#344054",
        fontSize:
            "12px",
        outline:
            "none",
        cursor:
            "pointer",
    },

    tableWrapper: {
        overflowX:
            "auto",
    },

    table: {
        width:
            "100%",
        borderCollapse:
            "collapse",
        minWidth:
            "950px",
    },

    th: {
        padding:
            "14px 18px",
        textAlign:
            "left",
        fontSize:
            "10px",
        fontWeight:
            "800",
        color:
            "#64748b",
        textTransform:
            "uppercase",
        letterSpacing:
            "0.5px",
        background:
            "#fafbfc",
        borderBottom:
            "1px solid #edf0f5",
        whiteSpace:
            "nowrap",
    },

    td: {
        padding:
            "15px 18px",
        fontSize:
            "12px",
        color:
            "#475467",
        borderBottom:
            "1px solid #f0f2f6",
        verticalAlign:
            "middle",
    },

    studentCell: {
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "11px",
    },

    avatar: {
        width:
            "38px",
        height:
            "38px",
        minWidth:
            "38px",
        borderRadius:
            "50%",
        background:
            "#edf3ff",
        color:
            "#266EFF",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "11px",
        fontWeight:
            "800",
    },

    studentName: {
        display:
            "block",
        color:
            "#172033",
        fontSize:
            "12px",
    },

    studentId: {
        marginTop:
            "3px",
        color:
            "#8a95a6",
        fontSize:
            "10px",
    },

    typeBadge: {
        display:
            "inline-block",
        background:
            "#f1f5f9",
        color:
            "#475569",
        padding:
            "5px 8px",
        borderRadius:
            "6px",
        fontSize:
            "10px",
        fontWeight:
            "700",
    },

    statusBadge: {
        display:
            "inline-block",
        padding:
            "5px 9px",
        borderRadius:
            "20px",
        fontSize:
            "10px",
        fontWeight:
            "700",
    },

    reviewButton: {
        border:
            "none",
        background:
            "#edf3ff",
        color:
            "#266EFF",
        borderRadius:
            "7px",
        padding:
            "8px 11px",
        cursor:
            "pointer",
        fontSize:
            "10px",
        fontWeight:
            "800",
    },

    emptyState: {
        padding:
            "70px 25px",
        textAlign:
            "center",
        color:
            "#7c8798",
    },

    emptyIcon: {
        fontSize:
            "42px",
        color:
            "#b6c1d2",
        marginBottom:
            "12px",
    },

    loadingIcon: {
        fontSize:
            "42px",
        color:
            "#266EFF",
        marginBottom:
            "12px",
    },

    cardFooter: {
        padding:
            "13px 18px",
        fontSize:
            "10px",
        color:
            "#7a8699",
        borderTop:
            "1px solid #edf0f5",
    },

    modalOverlay: {
        position:
            "fixed",
        inset:
            "0",
        background:
            "rgba(7,20,38,0.55)",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        padding:
            "20px",
        zIndex:
            "1000",
    },

    modal: {
        width:
            "100%",
        maxWidth:
            "900px",
        maxHeight:
            "92vh",
        overflowY:
            "auto",
        background:
            "#ffffff",
        borderRadius:
            "18px",
        boxShadow:
            "0 25px 70px rgba(0,0,0,0.20)",
    },

    modalHeader: {
        padding:
            "22px 25px",
        borderBottom:
            "1px solid #edf0f5",
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "flex-start",
    },

    modalEyebrow: {
        fontSize:
            "9px",
        fontWeight:
            "800",
        color:
            "#266EFF",
        letterSpacing:
            "1.3px",
        marginBottom:
            "6px",
    },

    modalTitle: {
        margin:
            "0",
        fontSize:
            "21px",
        fontWeight:
            "800",
        color:
            "#172033",
    },

    closeButton: {
        width:
            "34px",
        height:
            "34px",
        border:
            "none",
        borderRadius:
            "8px",
        background:
            "#f1f4f8",
        color:
            "#64748b",
        cursor:
            "pointer",
        fontSize:
            "20px",
    },

    detailSection: {
        padding:
            "22px 25px",
    },

    detailTitle: {
        margin:
            "0 0 15px",
        fontSize:
            "14px",
        fontWeight:
            "800",
        color:
            "#172033",
    },

    sectionDescription: {
        margin:
            "-7px 0 15px",
        fontSize:
            "11px",
        color:
            "#8490a3",
        lineHeight:
            "1.6",
    },

    detailGrid: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
        gap:
            "13px",
    },

    detailItem: {
        background:
            "#f8faff",
        borderRadius:
            "9px",
        padding:
            "12px",
        border:
            "1px solid #edf1f7",
    },

    detailLabel: {
        fontSize:
            "9px",
        color:
            "#8a95a6",
        fontWeight:
            "700",
        textTransform:
            "uppercase",
        letterSpacing:
            "0.4px",
        marginBottom:
            "4px",
    },

    detailValue: {
        fontSize:
            "11px",
        color:
            "#344054",
        fontWeight:
            "600",
        wordBreak:
            "break-word",
    },

    documentsGrid: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap:
            "10px",
    },

    documentCard: {
        border:
            "1px solid #e4eaf2",
        borderRadius:
            "11px",
        padding:
            "12px",
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "10px",
        background:
            "#fbfcfe",
    },

    documentIcon: {
        width:
            "38px",
        height:
            "38px",
        minWidth:
            "38px",
        borderRadius:
            "9px",
        background:
            "#edf3ff",
        color:
            "#266EFF",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "10px",
        fontWeight:
            "800",
    },

    documentInfo: {
        flex:
            "1",
        minWidth:
            "0",
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "2px",
    },

    documentName: {
        fontSize:
            "11px",
        color:
            "#172033",
        fontWeight:
            "800",
    },

    documentStatus: {
        fontSize:
            "9px",
        color:
            "#16804a",
        fontWeight:
            "700",
    },

    documentFileName: {
        fontSize:
            "9px",
        color:
            "#8a95a6",
        overflow:
            "hidden",
        textOverflow:
            "ellipsis",
        whiteSpace:
            "nowrap",
    },

    documentMissing: {
        fontSize:
            "9px",
        color:
            "#d64545",
        fontWeight:
            "700",
    },

    viewDocumentButton: {
        display:
            "inline-flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        textDecoration:
            "none",
        border:
            "none",
        background:
            "#edf3ff",
        color:
            "#266EFF",
        borderRadius:
            "7px",
        padding:
            "7px 10px",
        cursor:
            "pointer",
        fontSize:
            "9px",
        fontWeight:
            "800",
        whiteSpace:
            "nowrap",
    },

    selfieContainer: {
        width:
            "100%",
        maxWidth:
            "330px",
        border:
            "1px solid #e4eaf2",
        borderRadius:
            "12px",
        overflow:
            "hidden",
        background:
            "#fbfcfe",
    },

    selfieImage: {
        width:
            "100%",
        display:
            "block",
        maxHeight:
            "380px",
        objectFit:
            "cover",
    },

    selfieFooter: {
        padding:
            "10px 12px",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "space-between",
        gap:
            "10px",
        borderTop:
            "1px solid #e4eaf2",
        color:
            "#16804a",
        fontSize:
            "10px",
        fontWeight:
            "700",
    },

    noFileBox: {
        padding:
            "16px",
        border:
            "1px dashed #cbd5e1",
        borderRadius:
            "10px",
        background:
            "#f8fafc",
        color:
            "#64748b",
        fontSize:
            "10px",
    },

    verificationNotice: {
        margin:
            "0 25px 20px",
        padding:
            "14px",
        background:
            "#fff8e7",
        border:
            "1px solid #f4e0a8",
        borderRadius:
            "10px",
        display:
            "flex",
        gap:
            "11px",
        alignItems:
            "flex-start",
        fontSize:
            "11px",
    },

    noticeIcon: {
        width:
            "27px",
        height:
            "27px",
        minWidth:
            "27px",
        borderRadius:
            "50%",
        background:
            "#f2b632",
        color:
            "#ffffff",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            "800",
    },

    noticeText: {
        margin:
            "4px 0 0",
        lineHeight:
            "1.6",
    },

    messageSection: {
        padding:
            "0 25px 20px",
    },

    label: {
        display:
            "block",
        fontSize:
            "11px",
        fontWeight:
            "800",
        color:
            "#344054",
        marginBottom:
            "7px",
    },

    textarea: {
        width:
            "100%",
        boxSizing:
            "border-box",
        border:
            "1px solid #d7dee8",
        borderRadius:
            "9px",
        padding:
            "11px",
        resize:
            "vertical",
        minHeight:
            "90px",
        outline:
            "none",
        fontFamily:
            "inherit",
        fontSize:
            "11px",
        color:
            "#172033",
    },

    modalActions: {
        padding:
            "17px 25px",
        borderTop:
            "1px solid #edf0f5",
        display:
            "flex",
        justifyContent:
            "flex-end",
        gap:
            "9px",
        flexWrap:
            "wrap",
    },

    cancelButton: {
        border:
            "1px solid #d7dee8",
        background:
            "#ffffff",
        color:
            "#475467",
        borderRadius:
            "8px",
        padding:
            "10px 15px",
        cursor:
            "pointer",
        fontSize:
            "11px",
        fontWeight:
            "700",
    },

    correctionButton: {
        border:
            "none",
        background:
            "#eef4ff",
        color:
            "#266EFF",
        borderRadius:
            "8px",
        padding:
            "10px 15px",
        cursor:
            "pointer",
        fontSize:
            "11px",
        fontWeight:
            "800",
    },

    rejectButton: {
        border:
            "none",
        background:
            "#fff0f0",
        color:
            "#d64545",
        borderRadius:
            "8px",
        padding:
            "10px 15px",
        cursor:
            "pointer",
        fontSize:
            "11px",
        fontWeight:
            "800",
    },

    approveButton: {
        border:
            "none",
        background:
            "#16804a",
        color:
            "#ffffff",
        borderRadius:
            "8px",
        padding:
            "10px 17px",
        cursor:
            "pointer",
        fontSize:
            "11px",
        fontWeight:
            "800",
    },

    confirmBox: {
        margin:
            "0 25px 22px",
        padding:
            "15px",
        borderRadius:
            "10px",
        background:
            "#f8faff",
        border:
            "1px solid #dce6f8",
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "center",
        gap:
            "15px",
    },

    confirmText: {
        margin:
            "5px 0 0",
        fontSize:
            "10px",
        color:
            "#64748b",
        lineHeight:
            "1.5",
    },

    confirmButton: {
        border:
            "none",
        color:
            "#ffffff",
        borderRadius:
            "8px",
        padding:
            "10px 15px",
        cursor:
            "pointer",
        fontSize:
            "11px",
        fontWeight:
            "800",
        whiteSpace:
            "nowrap",
    },
};

// =====================================================
// RESPONSIVE
// =====================================================

if (
    typeof document !==
    "undefined"
) {

    const styleId =
        "votara-registration-management-responsive";

    if (
        !document.getElementById(
            styleId
        )
    ) {

        const style =
            document.createElement(
                "style"
            );

        style.id =
            styleId;

        style.innerHTML = `
            @media (max-width: 900px) {
                .votara-registration-management {
                    padding: 20px;
                }

                .votara-registration-management-documents {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 700px) {
                .votara-registration-management-stats {
                    grid-template-columns: 1fr 1fr;
                }
            }

            @media (max-width: 650px) {
                .votara-registration-management-detail-grid {
                    grid-template-columns: 1fr 1fr;
                }

                .votara-registration-management-documents {
                    grid-template-columns: 1fr;
                }
            }

            @media (max-width: 550px) {
                .votara-registration-management-stats {
                    grid-template-columns: 1fr;
                }

                .votara-registration-management-detail-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }
}

export default Registrations;