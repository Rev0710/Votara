import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CandidateManagement.css";

function CandidateManagement() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);

    const [candidates, setCandidates] = useState([
        {
            id: "CAN-001",
            name: "Juan Dela Cruz",
            studentId: "2024-0001",
            position: "President",
            party: "Independent",
            election: "Student Council Election 2026",
            status: "Approved",
            submitted: "Sep 10, 2026",
        },
        {
            id: "CAN-002",
            name: "Maria Santos",
            studentId: "2024-0002",
            position: "Vice President",
            party: "Unity Party",
            election: "Student Council Election 2026",
            status: "Approved",
            submitted: "Sep 10, 2026",
        },
        {
            id: "CAN-003",
            name: "Carlos Mendoza",
            studentId: "2024-0005",
            position: "Secretary",
            party: "Student First",
            election: "Student Council Election 2026",
            status: "Pending",
            submitted: "Sep 11, 2026",
        },
        {
            id: "CAN-004",
            name: "Angela Garcia",
            studentId: "2024-0004",
            position: "Treasurer",
            party: "Unity Party",
            election: "Student Council Election 2026",
            status: "Approved",
            submitted: "Sep 9, 2026",
        },
        {
            id: "CAN-005",
            name: "Mark Reyes",
            studentId: "2024-0003",
            position: "Auditor",
            party: "Independent",
            election: "Student Council Election 2026",
            status: "Pending",
            submitted: "Sep 11, 2026",
        },
        {
            id: "CAN-006",
            name: "Sofia Ramirez",
            studentId: "2024-0012",
            position: "Public Information Officer",
            party: "Student First",
            election: "Student Council Election 2026",
            status: "Rejected",
            submitted: "Sep 8, 2026",
        },
    ]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [positionFilter, setPositionFilter] = useState("All");
    const [selectedCandidate, setSelectedCandidate] =
        useState(null);

    // =====================================================
    // CHECK ADMIN SESSION
    // =====================================================

    useEffect(() => {
        const token =
            localStorage.getItem(
                "votaraStaffToken"
            );

        const storedUser =
            localStorage.getItem(
                "votaraStaffUser"
            );

        if (!token || !storedUser) {
            navigate("/admin-login", {
                replace: true,
            });

            return;
        }

        try {
            const user =
                JSON.parse(storedUser);

            if (user.role !== "admin") {
                navigate(
                    "/candidates/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            setAdmin(user);
        } catch (error) {
            console.error(
                "Invalid admin session:",
                error
            );

            localStorage.removeItem(
                "votaraStaffToken"
            );

            localStorage.removeItem(
                "votaraStaffUser"
            );

            navigate("/admin-login", {
                replace: true,
            });
        }
    }, [navigate]);

    // =====================================================
    // FILTER CANDIDATES
    // =====================================================

    const filteredCandidates = useMemo(() => {
        return candidates.filter((candidate) => {
            const value =
                search.toLowerCase().trim();

            const matchesSearch =
                candidate.name
                    .toLowerCase()
                    .includes(value) ||
                candidate.studentId
                    .toLowerCase()
                    .includes(value) ||
                candidate.position
                    .toLowerCase()
                    .includes(value) ||
                candidate.party
                    .toLowerCase()
                    .includes(value);

            const matchesStatus =
                statusFilter === "All" ||
                candidate.status === statusFilter;

            const matchesPosition =
                positionFilter === "All" ||
                candidate.position === positionFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPosition
            );
        });
    }, [
        candidates,
        search,
        statusFilter,
        positionFilter,
    ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalCandidates =
        candidates.length;

    const approvedCandidates =
        candidates.filter(
            (candidate) =>
                candidate.status === "Approved"
        ).length;

    const pendingCandidates =
        candidates.filter(
            (candidate) =>
                candidate.status === "Pending"
        ).length;

    const rejectedCandidates =
        candidates.filter(
            (candidate) =>
                candidate.status === "Rejected"
        ).length;

    // =====================================================
    // APPROVE CANDIDATE
    // =====================================================

    const approveCandidate = (id) => {
        setCandidates((current) =>
            current.map((candidate) =>
                candidate.id === id
                    ? {
                          ...candidate,
                          status: "Approved",
                      }
                    : candidate
            )
        );
    };

    // =====================================================
    // REJECT CANDIDATE
    // =====================================================

    const rejectCandidate = (id) => {
        setCandidates((current) =>
            current.map((candidate) =>
                candidate.id === id
                    ? {
                          ...candidate,
                          status: "Rejected",
                      }
                    : candidate
            )
        );
    };

    // =====================================================
    // DELETE CANDIDATE
    // =====================================================

    const deleteCandidate = (id) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to remove this candidate?"
            );

        if (!confirmed) {
            return;
        }

        setCandidates((current) =>
            current.filter(
                (candidate) =>
                    candidate.id !== id
            )
        );

        setSelectedCandidate(null);
    };

    // =====================================================
    // RESET FILTERS
    // =====================================================

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setPositionFilter("All");
    };

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="candidate-management">

            {/* =================================================
                BACK TO DASHBOARD
            ================================================= */}

            <button
                type="button"
                className="back-to-dashboard"
                onClick={() =>
                    navigate("/admin-dashboard")
                }
            >
                <span>←</span>
                Back to Dashboard
            </button>


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="candidate-management-header">

                <div>

                    <span className="candidate-management-label">
                        CANDIDATE MANAGEMENT
                    </span>

                    <h1>
                        Candidate Management
                    </h1>

                    <p>
                        Review, approve, and manage
                        candidates participating in
                        VOTARA elections.
                    </p>

                </div>


                <button
                    type="button"
                    className="add-candidate-btn"
                >
                    <span>+</span>
                    Add Candidate
                </button>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="candidate-stat-grid">

                <div className="candidate-stat-card">

                    <div className="candidate-stat-icon blue">
                        <span>♙</span>
                    </div>

                    <div>

                        <span className="candidate-stat-label">
                            Total Candidates
                        </span>

                        <strong>
                            {totalCandidates}
                        </strong>

                        <small>
                            Registered candidates
                        </small>

                    </div>

                </div>


                <div className="candidate-stat-card">

                    <div className="candidate-stat-icon green">
                        <span>✓</span>
                    </div>

                    <div>

                        <span className="candidate-stat-label">
                            Approved
                        </span>

                        <strong>
                            {approvedCandidates}
                        </strong>

                        <small>
                            Eligible for election
                        </small>

                    </div>

                </div>


                <div className="candidate-stat-card">

                    <div className="candidate-stat-icon orange">
                        <span>◷</span>
                    </div>

                    <div>

                        <span className="candidate-stat-label">
                            Pending Review
                        </span>

                        <strong>
                            {pendingCandidates}
                        </strong>

                        <small>
                            Awaiting approval
                        </small>

                    </div>

                </div>


                <div className="candidate-stat-card">

                    <div className="candidate-stat-icon red">
                        <span>×</span>
                    </div>

                    <div>

                        <span className="candidate-stat-label">
                            Rejected
                        </span>

                        <strong>
                            {rejectedCandidates}
                        </strong>

                        <small>
                            Not approved
                        </small>

                    </div>

                </div>

            </div>


            {/* =================================================
                ELECTION OVERVIEW
            ================================================= */}

            <div className="candidate-election-card">

                <div className="candidate-election-icon">
                    ✓
                </div>

                <div className="candidate-election-info">

                    <span>
                        CURRENT ELECTION
                    </span>

                    <h2>
                        Student Council Election 2026
                    </h2>

                    <p>
                        Manage candidates and review
                        submitted candidacies for the
                        current election.
                    </p>

                </div>


                <div className="candidate-election-status">

                    <span className="live-dot"></span>

                    Election Active

                </div>

            </div>


            {/* =================================================
                CANDIDATE TABLE
            ================================================= */}

            <div className="candidate-table-card">

                {/* TABLE HEADER */}

                <div className="candidate-table-heading">

                    <div>

                        <h2>
                            Registered Candidates
                        </h2>

                        <p>
                            Review and manage candidates
                            registered for the election.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="refresh-btn"
                        onClick={() =>
                            window.location.reload()
                        }
                    >
                        ↻ Refresh
                    </button>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div className="candidate-filter-bar">

                    <div className="candidate-search">

                        <span>⌕</span>

                        <input
                            type="text"
                            placeholder="Search by name, ID, position or party..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <select
                        value={positionFilter}
                        onChange={(e) =>
                            setPositionFilter(
                                e.target.value
                            )
                        }
                        className="candidate-filter"
                    >

                        <option value="All">
                            All Positions
                        </option>

                        <option value="President">
                            President
                        </option>

                        <option value="Vice President">
                            Vice President
                        </option>

                        <option value="Secretary">
                            Secretary
                        </option>

                        <option value="Treasurer">
                            Treasurer
                        </option>

                        <option value="Auditor">
                            Auditor
                        </option>

                        <option value="Public Information Officer">
                            Public Information Officer
                        </option>

                    </select>


                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                        className="candidate-filter"
                    >

                        <option value="All">
                            All Status
                        </option>

                        <option value="Approved">
                            Approved
                        </option>

                        <option value="Pending">
                            Pending
                        </option>

                        <option value="Rejected">
                            Rejected
                        </option>

                    </select>


                    {(search ||
                        statusFilter !== "All" ||
                        positionFilter !== "All") && (

                        <button
                            type="button"
                            className="clear-filter-btn"
                            onClick={resetFilters}
                        >
                            Clear
                        </button>

                    )}

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="candidate-table-wrapper">

                    <table className="candidate-table">

                        <thead>

                            <tr>

                                <th>
                                    Candidate
                                </th>

                                <th>
                                    Position
                                </th>

                                <th>
                                    Party
                                </th>

                                <th>
                                    Election
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Submitted
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredCandidates.length >
                            0 ? (

                                filteredCandidates.map(
                                    (candidate) => (

                                        <tr
                                            key={
                                                candidate.id
                                            }
                                        >

                                            {/* CANDIDATE */}

                                            <td>

                                                <div className="candidate-name-cell">

                                                    <div className="candidate-avatar">
                                                        {candidate.name.charAt(
                                                            0
                                                        )}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                candidate.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                candidate.studentId
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* POSITION */}

                                            <td>

                                                <span className="position-badge">
                                                    {
                                                        candidate.position
                                                    }
                                                </span>

                                            </td>


                                            {/* PARTY */}

                                            <td>

                                                <div className="party-cell">

                                                    <span className="party-dot"></span>

                                                    {
                                                        candidate.party
                                                    }

                                                </div>

                                            </td>


                                            {/* ELECTION */}

                                            <td>

                                                <span className="election-name">
                                                    {
                                                        candidate.election
                                                    }
                                                </span>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`candidate-status ${candidate.status.toLowerCase()}`}
                                                >

                                                    <span className="status-dot"></span>

                                                    {
                                                        candidate.status
                                                    }

                                                </span>

                                            </td>


                                            {/* SUBMITTED */}

                                            <td>

                                                <span className="submitted-date">
                                                    {
                                                        candidate.submitted
                                                    }
                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="candidate-actions">

                                                    <button
                                                        type="button"
                                                        className="candidate-action view"
                                                        onClick={() =>
                                                            setSelectedCandidate(
                                                                candidate
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>


                                                    {candidate.status ===
                                                        "Pending" && (

                                                        <>
                                                            <button
                                                                type="button"
                                                                className="candidate-action approve"
                                                                onClick={() =>
                                                                    approveCandidate(
                                                                        candidate.id
                                                                    )
                                                                }
                                                            >
                                                                Approve
                                                            </button>

                                                            <button
                                                                type="button"
                                                                className="candidate-action reject"
                                                                onClick={() =>
                                                                    rejectCandidate(
                                                                        candidate.id
                                                                    )
                                                                }
                                                            >
                                                                Reject
                                                            </button>
                                                        </>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="7"
                                    >

                                        <div className="no-candidates">

                                            <div>
                                                ⌕
                                            </div>

                                            <strong>
                                                No candidates found
                                            </strong>

                                            <span>
                                                Try changing
                                                your search
                                                or filters.
                                            </span>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    TABLE FOOTER
                ================================================= */}

                <div className="candidate-table-footer">

                    <span>

                        Showing{" "}

                        <strong>
                            {
                                filteredCandidates.length
                            }
                        </strong>

                        {" "}of{" "}

                        <strong>
                            {candidates.length}
                        </strong>

                        {" "}candidates

                    </span>


                    <div className="candidate-pagination">

                        <button
                            type="button"
                            disabled
                        >
                            ‹
                        </button>

                        <button
                            type="button"
                            className="active"
                        >
                            1
                        </button>

                        <button type="button">
                            2
                        </button>

                        <button type="button">
                            3
                        </button>

                        <button type="button">
                            ›
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                CANDIDATE DETAILS MODAL
            ================================================= */}

            {selectedCandidate && (

                <div
                    className="candidate-modal-overlay"
                    onClick={() =>
                        setSelectedCandidate(null)
                    }
                >

                    <div
                        className="candidate-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="candidate-modal-header">

                            <div>

                                <span>
                                    CANDIDATE PROFILE
                                </span>

                                <h2>
                                    Candidate Details
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="candidate-modal-close"
                                onClick={() =>
                                    setSelectedCandidate(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        {/* PROFILE */}

                        <div className="candidate-profile">

                            <div className="candidate-profile-avatar">
                                {
                                    selectedCandidate.name.charAt(
                                        0
                                    )
                                }
                            </div>

                            <div>

                                <h3>
                                    {
                                        selectedCandidate.name
                                    }
                                </h3>

                                <p>
                                    Student ID:{" "}
                                    {
                                        selectedCandidate.studentId
                                    }
                                </p>

                                <span
                                    className={`candidate-status ${selectedCandidate.status.toLowerCase()}`}
                                >
                                    <span className="status-dot"></span>
                                    {
                                        selectedCandidate.status
                                    }
                                </span>

                            </div>

                        </div>


                        {/* DETAILS */}

                        <div className="candidate-details-grid">

                            <div>

                                <label>
                                    Candidate ID
                                </label>

                                <strong>
                                    {
                                        selectedCandidate.id
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Position
                                </label>

                                <strong>
                                    {
                                        selectedCandidate.position
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Political Party
                                </label>

                                <strong>
                                    {
                                        selectedCandidate.party
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Election
                                </label>

                                <strong>
                                    {
                                        selectedCandidate.election
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Submitted
                                </label>

                                <strong>
                                    {
                                        selectedCandidate.submitted
                                    }
                                </strong>

                            </div>

                        </div>


                        {/* MODAL ACTIONS */}

                        <div className="candidate-modal-actions">

                            {selectedCandidate.status ===
                                "Pending" && (

                                <>

                                    <button
                                        type="button"
                                        className="modal-approve-btn"
                                        onClick={() => {
                                            approveCandidate(
                                                selectedCandidate.id
                                            );

                                            setSelectedCandidate(
                                                {
                                                    ...selectedCandidate,
                                                    status: "Approved",
                                                }
                                            );
                                        }}
                                    >
                                        ✓ Approve Candidate
                                    </button>

                                    <button
                                        type="button"
                                        className="modal-reject-btn"
                                        onClick={() => {
                                            rejectCandidate(
                                                selectedCandidate.id
                                            );

                                            setSelectedCandidate(
                                                {
                                                    ...selectedCandidate,
                                                    status: "Rejected",
                                                }
                                            );
                                        }}
                                    >
                                        × Reject
                                    </button>

                                </>

                            )}


                            <button
                                type="button"
                                className="modal-delete-btn"
                                onClick={() =>
                                    deleteCandidate(
                                        selectedCandidate.id
                                    )
                                }
                            >
                                Delete Candidate
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default CandidateManagement;