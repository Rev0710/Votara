import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ElectionManagement.css";

function ElectionManagement() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);

    const [elections, setElections] = useState([
        {
            id: "ELEC-001",
            name: "Student Council Election 2026",
            type: "Student Council",
            startDate: "September 15, 2026",
            endDate: "September 20, 2026",
            candidates: 6,
            voters: 699,
            votes: 0,
            status: "Active",
            created: "September 10, 2026",
        },
        {
            id: "ELEC-002",
            name: "Department Representative Election 2026",
            type: "Department",
            startDate: "October 5, 2026",
            endDate: "October 8, 2026",
            candidates: 18,
            voters: 699,
            votes: 0,
            status: "Scheduled",
            created: "September 9, 2026",
        },
        {
            id: "ELEC-003",
            name: "Student Council Election 2025",
            type: "Student Council",
            startDate: "September 15, 2025",
            endDate: "September 20, 2025",
            candidates: 12,
            voters: 674,
            votes: 581,
            status: "Completed",
            created: "September 5, 2025",
        },
        {
            id: "ELEC-004",
            name: "Department Representative Election 2025",
            type: "Department",
            startDate: "October 2, 2025",
            endDate: "October 5, 2025",
            candidates: 15,
            voters: 674,
            votes: 540,
            status: "Archived",
            created: "September 20, 2025",
        },
    ]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedElection, setSelectedElection] =
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
                    "/election/dashboard",
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
    // FILTER ELECTIONS
    // =====================================================

    const filteredElections = useMemo(() => {
        return elections.filter((election) => {
            const value =
                search.toLowerCase().trim();

            const matchesSearch =
                election.name
                    .toLowerCase()
                    .includes(value) ||
                election.type
                    .toLowerCase()
                    .includes(value) ||
                election.id
                    .toLowerCase()
                    .includes(value);

            const matchesStatus =
                statusFilter === "All" ||
                election.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        elections,
        search,
        statusFilter,
    ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalElections =
        elections.length;

    const activeElections =
        elections.filter(
            (election) =>
                election.status === "Active"
        ).length;

    const scheduledElections =
        elections.filter(
            (election) =>
                election.status === "Scheduled"
        ).length;

    const completedElections =
        elections.filter(
            (election) =>
                election.status === "Completed"
        ).length;

    // =====================================================
    // CHANGE ELECTION STATUS
    // =====================================================

    const updateElectionStatus = (
        id,
        newStatus
    ) => {
        setElections((current) =>
            current.map((election) =>
                election.id === id
                    ? {
                          ...election,
                          status: newStatus,
                      }
                    : election
            )
        );

        setSelectedElection((current) =>
            current &&
            current.id === id
                ? {
                      ...current,
                      status: newStatus,
                  }
                : current
        );
    };

    // =====================================================
    // DELETE / ARCHIVE ELECTION
    // =====================================================

    const archiveElection = (id) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to archive this election?"
            );

        if (!confirmed) {
            return;
        }

        updateElectionStatus(
            id,
            "Archived"
        );
    };

    // =====================================================
    // RESET FILTERS
    // =====================================================

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
    };

    // =====================================================
    // CLEAR CURRENT SELECTION
    // =====================================================

    const clearSelection = () => {
        setSelectedElection(null);
    };

    return (
        <div className="election-management">

            {/* =================================================
                BACK TO DASHBOARD
            ================================================= */}

            <button
                type="button"
                className="election-back-button"
                onClick={() =>
                    navigate("/admin-dashboard")
                }
            >
                <span>←</span>
                Back to Dashboard
            </button>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="election-page-header">

                <div>

                    <span className="election-page-label">
                        ELECTION MANAGEMENT
                    </span>

                    <h1>
                        Election Management
                    </h1>

                    <p>
                        Create, configure, monitor,
                        and manage VOTARA elections.
                    </p>

                </div>


                <button
                    type="button"
                    className="create-election-button"
                    onClick={() =>
                        alert(
                            "Election creation form can be connected here."
                        )
                    }
                >
                    <span>+</span>
                    Create Election
                </button>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="election-stat-grid">

                <div className="election-stat-card">

                    <div className="election-stat-icon blue">
                        ◫
                    </div>

                    <div>

                        <span>
                            Total Elections
                        </span>

                        <strong>
                            {totalElections}
                        </strong>

                        <small>
                            Elections in VOTARA
                        </small>

                    </div>

                </div>


                <div className="election-stat-card">

                    <div className="election-stat-icon green">
                        ✓
                    </div>

                    <div>

                        <span>
                            Active Elections
                        </span>

                        <strong>
                            {activeElections}
                        </strong>

                        <small>
                            Currently running
                        </small>

                    </div>

                </div>


                <div className="election-stat-card">

                    <div className="election-stat-icon orange">
                        ◷
                    </div>

                    <div>

                        <span>
                            Scheduled
                        </span>

                        <strong>
                            {scheduledElections}
                        </strong>

                        <small>
                            Upcoming elections
                        </small>

                    </div>

                </div>


                <div className="election-stat-card">

                    <div className="election-stat-icon purple">
                        ✓
                    </div>

                    <div>

                        <span>
                            Completed
                        </span>

                        <strong>
                            {completedElections}
                        </strong>

                        <small>
                            Finished elections
                        </small>

                    </div>

                </div>

            </div>


            {/* =================================================
                CURRENT ELECTION
            ================================================= */}

            <div className="current-election-card">

                <div className="current-election-icon">
                    ⚡
                </div>

                <div className="current-election-content">

                    <span>
                        CURRENT ELECTION
                    </span>

                    <h2>
                        Student Council Election 2026
                    </h2>

                    <p>
                        The current election is active
                        and available for eligible
                        students.
                    </p>

                </div>


                <div className="current-election-status">

                    <span></span>

                    Active

                </div>

            </div>


            {/* =================================================
                ELECTION TABLE
            ================================================= */}

            <div className="election-table-card">

                {/* TABLE HEADER */}

                <div className="election-table-header">

                    <div>

                        <h2>
                            Elections
                        </h2>

                        <p>
                            View and manage all VOTARA
                            elections.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="election-refresh-button"
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

                <div className="election-filter-bar">

                    <div className="election-search">

                        <span>⌕</span>

                        <input
                            type="text"
                            placeholder="Search election name, type or ID..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                        />

                    </div>


                    <select
                        className="election-status-filter"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="All">
                            All Status
                        </option>

                        <option value="Active">
                            Active
                        </option>

                        <option value="Scheduled">
                            Scheduled
                        </option>

                        <option value="Completed">
                            Completed
                        </option>

                        <option value="Archived">
                            Archived
                        </option>

                    </select>


                    {(search ||
                        statusFilter !== "All") && (

                        <button
                            type="button"
                            className="election-clear-button"
                            onClick={resetFilters}
                        >
                            Clear
                        </button>

                    )}

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="election-table-wrapper">

                    <table className="election-table">

                        <thead>

                            <tr>

                                <th>
                                    Election
                                </th>

                                <th>
                                    Schedule
                                </th>

                                <th>
                                    Candidates
                                </th>

                                <th>
                                    Voters
                                </th>

                                <th>
                                    Votes
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredElections.length >
                            0 ? (

                                filteredElections.map(
                                    (election) => (

                                        <tr
                                            key={
                                                election.id
                                            }
                                        >

                                            {/* ELECTION */}

                                            <td>

                                                <div className="election-name-cell">

                                                    <div className="election-avatar">
                                                        ◫
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                election.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                election.id
                                                            }
                                                            {" • "}
                                                            {
                                                                election.type
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* SCHEDULE */}

                                            <td>

                                                <div className="election-schedule">

                                                    <strong>
                                                        {
                                                            election.startDate
                                                        }
                                                    </strong>

                                                    <span>
                                                        to{" "}
                                                        {
                                                            election.endDate
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            {/* CANDIDATES */}

                                            <td>

                                                <span className="election-number">
                                                    {
                                                        election.candidates
                                                    }
                                                </span>

                                            </td>


                                            {/* VOTERS */}

                                            <td>

                                                <span className="election-number">
                                                    {
                                                        election.voters
                                                    }
                                                </span>

                                            </td>


                                            {/* VOTES */}

                                            <td>

                                                <div className="votes-cell">

                                                    <strong>
                                                        {
                                                            election.votes
                                                        }
                                                    </strong>

                                                    {election.voters >
                                                        0 && (

                                                        <span>
                                                            {Math.round(
                                                                (election.votes /
                                                                    election.voters) *
                                                                    100
                                                            )}
                                                            %
                                                        </span>

                                                    )}

                                                </div>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`election-status ${election.status.toLowerCase()}`}
                                                >

                                                    <span className="election-status-dot"></span>

                                                    {
                                                        election.status
                                                    }

                                                </span>

                                            </td>


                                            {/* ACTIONS */}

                                            <td>

                                                <div className="election-actions">

                                                    <button
                                                        type="button"
                                                        className="election-view-button"
                                                        onClick={() =>
                                                            setSelectedElection(
                                                                election
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td colSpan="7">

                                        <div className="no-elections">

                                            <div>
                                                ◫
                                            </div>

                                            <strong>
                                                No elections found
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
                    FOOTER
                ================================================= */}

                <div className="election-table-footer">

                    <span>
                        Showing{" "}
                        <strong>
                            {
                                filteredElections.length
                            }
                        </strong>
                        {" "}of{" "}
                        <strong>
                            {elections.length}
                        </strong>
                        {" "}elections
                    </span>

                </div>

            </div>


            {/* =================================================
                ELECTION DETAILS MODAL
            ================================================= */}

            {selectedElection && (

                <div
                    className="election-modal-overlay"
                    onClick={clearSelection}
                >

                    <div
                        className="election-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        {/* MODAL HEADER */}

                        <div className="election-modal-header">

                            <div>

                                <span>
                                    ELECTION DETAILS
                                </span>

                                <h2>
                                    {
                                        selectedElection.name
                                    }
                                </h2>

                            </div>


                            <button
                                type="button"
                                className="election-modal-close"
                                onClick={
                                    clearSelection
                                }
                            >
                                ×
                            </button>

                        </div>


                        {/* ELECTION STATUS */}

                        <div className="modal-election-status-box">

                            <div>

                                <span>
                                    CURRENT STATUS
                                </span>

                                <strong
                                    className={
                                        selectedElection.status.toLowerCase()
                                    }
                                >
                                    <span></span>
                                    {
                                        selectedElection.status
                                    }
                                </strong>

                            </div>

                            <span className="modal-election-id">
                                {
                                    selectedElection.id
                                }
                            </span>

                        </div>


                        {/* DETAILS */}

                        <div className="election-details-grid">

                            <div>

                                <label>
                                    Election Type
                                </label>

                                <strong>
                                    {
                                        selectedElection.type
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Candidates
                                </label>

                                <strong>
                                    {
                                        selectedElection.candidates
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Start Date
                                </label>

                                <strong>
                                    {
                                        selectedElection.startDate
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    End Date
                                </label>

                                <strong>
                                    {
                                        selectedElection.endDate
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Registered Voters
                                </label>

                                <strong>
                                    {
                                        selectedElection.voters
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Votes Cast
                                </label>

                                <strong>
                                    {
                                        selectedElection.votes
                                    }
                                </strong>

                            </div>

                        </div>


                        {/* PARTICIPATION */}

                        <div className="election-participation">

                            <div className="participation-header">

                                <span>
                                    VOTER PARTICIPATION
                                </span>

                                <strong>
                                    {
                                        selectedElection.voters >
                                        0
                                            ? Math.round(
                                                  (selectedElection.votes /
                                                      selectedElection.voters) *
                                                      100
                                              )
                                            : 0
                                    }
                                    %
                                </strong>

                            </div>


                            <div className="participation-bar">

                                <div
                                    style={{
                                        width: `${
                                            selectedElection.voters >
                                            0
                                                ? Math.min(
                                                      100,
                                                      (selectedElection.votes /
                                                          selectedElection.voters) *
                                                          100
                                                  )
                                                : 0
                                        }%`,
                                    }}
                                ></div>

                            </div>


                            <p>
                                {
                                    selectedElection.votes
                                }{" "}
                                votes from{" "}
                                {
                                    selectedElection.voters
                                }{" "}
                                registered voters.
                            </p>

                        </div>


                        {/* ACTIONS */}

                        <div className="election-modal-actions">

                            {selectedElection.status ===
                                "Scheduled" && (

                                <button
                                    type="button"
                                    className="modal-activate-button"
                                    onClick={() =>
                                        updateElectionStatus(
                                            selectedElection.id,
                                            "Active"
                                        )
                                    }
                                >
                                    ✓ Activate Election
                                </button>

                            )}


                            {selectedElection.status ===
                                "Active" && (

                                <button
                                    type="button"
                                    className="modal-complete-button"
                                    onClick={() =>
                                        updateElectionStatus(
                                            selectedElection.id,
                                            "Completed"
                                        )
                                    }
                                >
                                    ✓ End Election
                                </button>

                            )}


                            {selectedElection.status ===
                                "Completed" && (

                                <button
                                    type="button"
                                    className="modal-archive-button"
                                    onClick={() =>
                                        archiveElection(
                                            selectedElection.id
                                        )
                                    }
                                >
                                    Archive Election
                                </button>

                            )}


                            {selectedElection.status ===
                                "Archived" && (

                                <span className="archived-message">
                                    This election has been
                                    archived.
                                </span>

                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default ElectionManagement;