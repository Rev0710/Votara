import React, { useEffect, useMemo, useState } from "react";
import {
    FiSearch,
    FiUser,
    FiCheckCircle,
    FiClock,
    FiXCircle,
    FiShield,
    FiCreditCard,
    FiFileText,
    FiRefreshCw,
    FiAlertCircle,
    FiChevronRight,
} from "react-icons/fi";

import api from "../../services/api";
import "./InPersonVerification.css";

// =========================================================
// IN-PERSON VERIFICATION
// Electoral Board Module
// =========================================================

const InPersonVerification = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [student, setStudent] = useState(null);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [physicalIdVerified, setPhysicalIdVerified] = useState(false);
    const [registrationConfirmed, setRegistrationConfirmed] =
        useState(false);

    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showActivateModal, setShowActivateModal] = useState(false);

    // ---------------------------------------------------------
    // Load students available for verification
    // ---------------------------------------------------------

    const loadStudents = async () => {
        try {
            setLoading(true);
            setError("");

            /*
             * The backend endpoint will be connected here.
             *
             * We intentionally do not assume any database column
             * structure beyond the existing VOTARA student concept.
             */
            const response = await api.get(
                "/electoral-board/in-person-verification"
            );

            const data = response?.data;

            const studentList =
                data?.students ||
                data?.data ||
                [];

            setStudents(Array.isArray(studentList) ? studentList : []);
        } catch (err) {
            console.error(
                "In-Person Verification load error:",
                err
            );

            /*
             * The page can still be displayed even while the
             * backend endpoint is being connected.
             */
            setStudents([]);

            if (err?.response?.status !== 404) {
                setError(
                    err?.response?.data?.message ||
                        "Unable to load students for verification."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    // ---------------------------------------------------------
    // Search
    // ---------------------------------------------------------

    const filteredStudents = useMemo(() => {
        const value = searchTerm.trim().toLowerCase();

        if (!value) {
            return students;
        }

        return students.filter((item) => {
            const studentId = String(
                item?.student_id ||
                    item?.studentId ||
                    ""
            ).toLowerCase();

            const fullName = String(
                item?.full_name ||
                    item?.fullName ||
                    item?.name ||
                    ""
            ).toLowerCase();

            return (
                studentId.includes(value) ||
                fullName.includes(value)
            );
        });
    }, [students, searchTerm]);

    const handleSearch = () => {
        setError("");
        setSuccess("");

        const value = searchTerm.trim();

        if (!value) {
            setError(
                "Please enter a Student ID or student name."
            );
            return;
        }

        setSearching(true);

        setTimeout(() => {
            setSearching(false);

            if (filteredStudents.length === 0) {
                setStudent(null);
                setError(
                    "No matching student was found."
                );
                return;
            }

            if (filteredStudents.length === 1) {
                selectStudent(filteredStudents[0]);
            }
        }, 250);
    };

    // ---------------------------------------------------------
    // Select Student
    // ---------------------------------------------------------

    const selectStudent = (item) => {
        setStudent(item);

        setPhysicalIdVerified(
            Boolean(
                item?.physical_id_verified ||
                    item?.physicalIdVerified
            )
        );

        setRegistrationConfirmed(
            Boolean(
                item?.registration_confirmed ||
                    item?.registrationConfirmed
            )
        );

        setError("");
        setSuccess("");
    };

    // ---------------------------------------------------------
    // Reset
    // ---------------------------------------------------------

    const resetVerification = () => {
        setStudent(null);
        setSearchTerm("");
        setPhysicalIdVerified(false);
        setRegistrationConfirmed(false);
        setError("");
        setSuccess("");
    };

    // ---------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------

    const getStudentId = () =>
        student?.student_id ||
        student?.studentId ||
        "—";

    const getFullName = () =>
        student?.full_name ||
        student?.fullName ||
        student?.name ||
        "—";

    const getYearLevel = () =>
        student?.year_level ||
        student?.yearLevel ||
        "—";

    const getRegistrationStatus = () =>
        student?.registration_status ||
        student?.registrationStatus ||
        "Pending";

    const getEnrollmentStatus = () =>
        student?.enrollment_status ||
        student?.enrollmentStatus ||
        "Unknown";

    const getVerificationStatus = () =>
        student?.verification_status ||
        student?.verificationStatus ||
        "Pending";

    const isFirstYear =
        String(getYearLevel()).toLowerCase().includes("1st") ||
        String(getYearLevel()).toLowerCase() === "1";

    const isVerified =
        String(getVerificationStatus()).toLowerCase() ===
            "verified" ||
        Boolean(
            student?.is_verified ||
                student?.isVerified
        );

    const isRegistrationApproved =
        String(getRegistrationStatus()).toLowerCase() ===
        "approved";

    const isEnrolled =
        String(getEnrollmentStatus()).toLowerCase() ===
        "enrolled";

    const canVerify =
        Boolean(student) &&
        physicalIdVerified &&
        registrationConfirmed &&
        !isVerified;

    const canActivate =
        Boolean(student) &&
        isVerified &&
        !isFirstYear;

    // ---------------------------------------------------------
    // Verify Student
    // ---------------------------------------------------------

    const handleVerifyStudent = async () => {
        if (!student) return;

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const studentId =
                student?.id ||
                student?.student_id ||
                student?.studentId;

            /*
             * Backend integration endpoint.
             *
             * The backend will validate:
             * - student exists
             * - registration status
             * - enrollment status
             * - physical identity verification
             * - duplicate verification
             */
            await api.patch(
                `/electoral-board/in-person-verification/${studentId}/verify`,
                {
                    physical_id_verified: physicalIdVerified,
                    registration_confirmed:
                        registrationConfirmed,
                }
            );

            setSuccess(
                "Student identity has been successfully verified."
            );

            setShowVerifyModal(false);

            setStudent((previous) => ({
                ...previous,
                verification_status: "verified",
                is_verified: true,
            }));
        } catch (err) {
            console.error(
                "Student verification error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to verify this student."
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // Activate Student Account
    // ---------------------------------------------------------

    const handleActivateStudent = async () => {
        if (!student) return;

        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const studentId =
                student?.id ||
                student?.student_id ||
                student?.studentId;

            await api.patch(
                `/electoral-board/in-person-verification/${studentId}/activate`,
                {}
            );

            setSuccess(
                "Student account has been successfully activated."
            );

            setShowActivateModal(false);

            setStudent((previous) => ({
                ...previous,
                account_status: "active",
                accountStatus: "active",
                is_active: true,
            }));
        } catch (err) {
            console.error(
                "Student account activation error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to activate the student account."
            );
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------------------------------------
    // Status Badge
    // ---------------------------------------------------------

    const StatusBadge = ({
        status,
        type = "default",
    }) => {
        const normalized = String(
            status || ""
        ).toLowerCase();

        let className = "status-badge status-pending";
        let icon = <FiClock />;

        if (
            normalized === "approved" ||
            normalized === "verified" ||
            normalized === "enrolled" ||
            normalized === "active"
        ) {
            className =
                "status-badge status-approved";
            icon = <FiCheckCircle />;
        }

        if (
            normalized === "rejected" ||
            normalized === "inactive" ||
            normalized === "failed"
        ) {
            className =
                "status-badge status-rejected";
            icon = <FiXCircle />;
        }

        return (
            <span className={className}>
                {icon}
                {status || "Pending"}
            </span>
        );
    };

    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------

    return (
        <div className="in-person-verification">
            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="verification-page-header">
                <div>
                    <h1>In-Person Verification</h1>
                    <p>
                        Verify the identity of students who
                        completed the online registration process.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={loadStudents}
                    disabled={loading}
                    title="Refresh students"
                >
                    <FiRefreshCw
                        className={
                            loading
                                ? "refresh-spinning"
                                : ""
                        }
                    />
                    Refresh
                </button>
            </div>

            {/* =================================================
                ALERTS
            ================================================= */}

            {success && (
                <div className="verification-alert success">
                    <FiCheckCircle />
                    <span>{success}</span>

                    <button
                        onClick={() => setSuccess("")}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
            )}

            {error && (
                <div className="verification-alert error">
                    <FiAlertCircle />
                    <span>{error}</span>

                    <button
                        onClick={() => setError("")}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* =================================================
                SEARCH CARD
            ================================================= */}

            <div className="verification-card search-card">
                <div className="card-title">
                    <div className="title-icon">
                        <FiSearch />
                    </div>

                    <div>
                        <h2>Find Student</h2>
                        <p>
                            Search using the Student ID or full
                            name.
                        </p>
                    </div>
                </div>

                <div className="student-search">
                    <div className="search-input-wrapper">
                        <FiSearch />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key === "Enter"
                                ) {
                                    handleSearch();
                                }
                            }}
                            placeholder="Enter Student ID or full name..."
                        />

                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() =>
                                    setSearchTerm("")
                                }
                            >
                                ×
                            </button>
                        )}
                    </div>

                    <button
                        className="primary-button search-button"
                        onClick={handleSearch}
                        disabled={
                            searching ||
                            !searchTerm.trim()
                        }
                    >
                        <FiSearch />

                        {searching
                            ? "Searching..."
                            : "Search Student"}
                    </button>
                </div>
            </div>

            {/* =================================================
                SEARCH RESULTS
            ================================================= */}

            {searchTerm.trim() &&
                filteredStudents.length > 1 &&
                !student && (
                    <div className="verification-card results-card">
                        <div className="results-header">
                            <div>
                                <h2>Search Results</h2>
                                <p>
                                    Select the student you want
                                    to verify.
                                </p>
                            </div>

                            <span className="result-count">
                                {filteredStudents.length}{" "}
                                result
                                {filteredStudents.length !==
                                1
                                    ? "s"
                                    : ""}
                            </span>
                        </div>

                        <div className="student-results">
                            {filteredStudents.map(
                                (item, index) => {
                                    const itemId =
                                        item?.id ||
                                        item?.student_id ||
                                        item?.studentId ||
                                        index;

                                    return (
                                        <button
                                            key={itemId}
                                            className="student-result"
                                            onClick={() =>
                                                selectStudent(
                                                    item
                                                )
                                            }
                                        >
                                            <div className="student-result-avatar">
                                                <FiUser />
                                            </div>

                                            <div className="student-result-info">
                                                <strong>
                                                    {item?.full_name ||
                                                        item?.fullName ||
                                                        item?.name ||
                                                        "Unnamed Student"}
                                                </strong>

                                                <span>
                                                    Student ID:{" "}
                                                    {item?.student_id ||
                                                        item?.studentId ||
                                                        "—"}
                                                </span>
                                            </div>

                                            <div className="student-result-year">
                                                {item?.year_level ||
                                                    item?.yearLevel ||
                                                    "—"}
                                            </div>

                                            <FiChevronRight />
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>
                )}

            {/* =================================================
                STUDENT DETAILS
            ================================================= */}

            {student && (
                <>
                    <div className="verification-card student-details-card">
                        <div className="student-details-header">
                            <div className="large-student-avatar">
                                {student?.profile_picture ||
                                student?.profilePicture ? (
                                    <img
                                        src={
                                            student?.profile_picture ||
                                            student?.profilePicture
                                        }
                                        alt={getFullName()}
                                    />
                                ) : (
                                    <FiUser />
                                )}
                            </div>

                            <div className="student-main-info">
                                <span className="small-label">
                                    STUDENT
                                </span>

                                <h2>
                                    {getFullName()}
                                </h2>

                                <p>
                                    Student ID:{" "}
                                    <strong>
                                        {getStudentId()}
                                    </strong>
                                </p>
                            </div>

                            <div className="student-header-status">
                                <StatusBadge
                                    status={
                                        isVerified
                                            ? "Verified"
                                            : getVerificationStatus()
                                    }
                                />
                            </div>
                        </div>

                        {/* Student information */}

                        <div className="student-information-grid">
                            <div className="information-item">
                                <span>
                                    <FiCreditCard />
                                    Student ID
                                </span>

                                <strong>
                                    {getStudentId()}
                                </strong>
                            </div>

                            <div className="information-item">
                                <span>
                                    <FiUser />
                                    Full Name
                                </span>

                                <strong>
                                    {getFullName()}
                                </strong>
                            </div>

                            <div className="information-item">
                                <span>
                                    <FiFileText />
                                    Year Level
                                </span>

                                <strong>
                                    {getYearLevel()}
                                </strong>
                            </div>

                            <div className="information-item">
                                <span>
                                    <FiShield />
                                    Enrollment
                                </span>

                                <StatusBadge
                                    status={getEnrollmentStatus()}
                                />
                            </div>

                            <div className="information-item">
                                <span>
                                    <FiFileText />
                                    Registration
                                </span>

                                <StatusBadge
                                    status={getRegistrationStatus()}
                                />
                            </div>

                            <div className="information-item">
                                <span>
                                    <FiShield />
                                    Verification
                                </span>

                                <StatusBadge
                                    status={
                                        isVerified
                                            ? "Verified"
                                            : getVerificationStatus()
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* =================================================
                        VERIFICATION CHECKLIST
                    ================================================= */}

                    <div className="verification-card checklist-card">
                        <div className="section-heading">
                            <div>
                                <h2>
                                    Verification Checklist
                                </h2>

                                <p>
                                    Complete each required
                                    physical verification step
                                    before marking the student
                                    as verified.
                                </p>
                            </div>
                        </div>

                        <div className="checklist">
                            {/* Physical ID */}

                            <label
                                className={`checklist-item ${
                                    physicalIdVerified
                                        ? "completed"
                                        : ""
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        physicalIdVerified
                                    }
                                    onChange={(event) =>
                                        setPhysicalIdVerified(
                                            event.target.checked
                                        )
                                    }
                                    disabled={isVerified}
                                />

                                <span className="custom-checkbox">
                                    {physicalIdVerified && (
                                        <FiCheckCircle />
                                    )}
                                </span>

                                <div className="checklist-content">
                                    <strong>
                                        Verify Physical
                                        Student ID
                                    </strong>

                                    <span>
                                        Confirm that the
                                        physical school ID
                                        presented by the student
                                        matches the registered
                                        student information.
                                    </span>
                                </div>
                            </label>

                            {/* Registration */}

                            <label
                                className={`checklist-item ${
                                    registrationConfirmed
                                        ? "completed"
                                        : ""
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        registrationConfirmed
                                    }
                                    onChange={(event) =>
                                        setRegistrationConfirmed(
                                            event.target.checked
                                        )
                                    }
                                    disabled={isVerified}
                                />

                                <span className="custom-checkbox">
                                    {registrationConfirmed && (
                                        <FiCheckCircle />
                                    )}
                                </span>

                                <div className="checklist-content">
                                    <strong>
                                        Confirm Registration
                                        Information
                                    </strong>

                                    <span>
                                        Confirm that the
                                        student's submitted
                                        registration information
                                        corresponds to the
                                        presented identification.
                                    </span>
                                </div>
                            </label>

                            {/* Enrollment */}

                            <div className="checklist-item readonly">
                                <span className="custom-checkbox verified-static">
                                    {isEnrolled ? (
                                        <FiCheckCircle />
                                    ) : (
                                        <FiClock />
                                    )}
                                </span>

                                <div className="checklist-content">
                                    <strong>
                                        Confirm Enrollment
                                        Status
                                    </strong>

                                    <span>
                                        Student must have an
                                        enrolled status in the
                                        VOTARA student records.
                                    </span>
                                </div>

                                <StatusBadge
                                    status={
                                        isEnrolled
                                            ? "Enrolled"
                                            : getEnrollmentStatus()
                                    }
                                />
                            </div>
                        </div>

                        {/* =================================================
                            ACTION AREA
                        ================================================= */}

                        <div className="verification-actions">
                            <button
                                className="secondary-button"
                                onClick={resetVerification}
                            >
                                Clear Student
                            </button>

                            {!isVerified ? (
                                <button
                                    className="primary-button"
                                    disabled={!canVerify || loading}
                                    onClick={() =>
                                        setShowVerifyModal(
                                            true
                                        )
                                    }
                                >
                                    <FiCheckCircle />
                                    Mark as Verified
                                </button>
                            ) : (
                                <div className="verified-message">
                                    <FiCheckCircle />
                                    Student Already Verified
                                </div>
                            )}
                        </div>

                        {!isVerified &&
                            !canVerify && (
                                <div className="action-hint">
                                    <FiAlertCircle />

                                    <span>
                                        Complete the physical ID
                                        and registration
                                        confirmation checks before
                                        verifying the student.
                                    </span>
                                </div>
                            )}
                    </div>

                    {/* =================================================
                        ACCOUNT ACTIVATION
                    ================================================= */}

                    {isVerified && (
                        <div className="verification-card activation-card">
                            <div className="activation-icon">
                                <FiShield />
                            </div>

                            <div className="activation-content">
                                <h2>
                                    Student Verification
                                    Complete
                                </h2>

                                <p>
                                    The student's identity has
                                    been verified successfully.
                                    The account may now proceed to
                                    the appropriate activation
                                    process.
                                </p>

                                {isFirstYear ? (
                                    <div className="first-year-warning">
                                        <FiAlertCircle />

                                        <div>
                                            <strong>
                                                1st Year Student
                                            </strong>

                                            <span>
                                                1st Year students
                                                are not eligible
                                                to vote in the
                                                VOTARA election.
                                                No 1st Year
                                                Representative
                                                position is
                                                available.
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="activation-actions">
                                        <button
                                            className="primary-button activation-button"
                                            disabled={
                                                !canActivate ||
                                                loading ||
                                                String(
                                                    student?.account_status ||
                                                        student?.accountStatus ||
                                                        ""
                                                ).toLowerCase() ===
                                                    "active"
                                            }
                                            onClick={() =>
                                                setShowActivateModal(
                                                    true
                                                )
                                            }
                                        >
                                            <FiShield />
                                            Activate Student
                                            Account
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* =================================================
                EMPTY STATE
            ================================================= */}

            {!student &&
                !searchTerm.trim() &&
                !loading && (
                    <div className="verification-card empty-state">
                        <div className="empty-state-icon">
                            <FiSearch />
                        </div>

                        <h2>
                            Search for a Student
                        </h2>

                        <p>
                            Enter a Student ID or full name
                            above to begin the in-person
                            verification process.
                        </p>
                    </div>
                )}

            {/* =================================================
                VERIFY CONFIRMATION MODAL
            ================================================= */}

            {showVerifyModal && (
                <div
                    className="verification-modal-overlay"
                    onClick={() =>
                        setShowVerifyModal(false)
                    }
                >
                    <div
                        className="verification-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-icon verify">
                            <FiCheckCircle />
                        </div>

                        <h2>
                            Verify Student?
                        </h2>

                        <p>
                            You are about to mark{" "}
                            <strong>
                                {getFullName()}
                            </strong>{" "}
                            as physically verified.
                        </p>

                        <div className="modal-summary">
                            <div>
                                <span>
                                    Student ID
                                </span>

                                <strong>
                                    {getStudentId()}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Year Level
                                </span>

                                <strong>
                                    {getYearLevel()}
                                </strong>
                            </div>
                        </div>

                        <p className="modal-warning">
                            Make sure you have physically
                            checked the student's school ID
                            before continuing.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setShowVerifyModal(
                                        false
                                    )
                                }
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                className="primary-button"
                                onClick={
                                    handleVerifyStudent
                                }
                                disabled={loading}
                            >
                                <FiCheckCircle />

                                {loading
                                    ? "Verifying..."
                                    : "Confirm Verification"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                ACTIVATION CONFIRMATION MODAL
            ================================================= */}

            {showActivateModal && (
                <div
                    className="verification-modal-overlay"
                    onClick={() =>
                        setShowActivateModal(false)
                    }
                >
                    <div
                        className="verification-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="modal-icon activate">
                            <FiShield />
                        </div>

                        <h2>
                            Activate Student Account?
                        </h2>

                        <p>
                            You are about to activate the
                            VOTARA account for{" "}
                            <strong>
                                {getFullName()}
                            </strong>
                            .
                        </p>

                        <div className="modal-summary">
                            <div>
                                <span>
                                    Student ID
                                </span>

                                <strong>
                                    {getStudentId()}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Year Level
                                </span>

                                <strong>
                                    {getYearLevel()}
                                </strong>
                            </div>
                        </div>

                        <p className="modal-warning">
                            Only activate the account after
                            completing the required physical
                            verification.
                        </p>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setShowActivateModal(
                                        false
                                    )
                                }
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                className="primary-button"
                                onClick={
                                    handleActivateStudent
                                }
                                disabled={loading}
                            >
                                <FiShield />

                                {loading
                                    ? "Activating..."
                                    : "Confirm Activation"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InPersonVerification;