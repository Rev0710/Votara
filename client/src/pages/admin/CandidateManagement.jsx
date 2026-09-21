import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiBell,
    FiChevronDown,
    FiChevronRight,
    FiLogOut,
    FiSearch,
    FiUploadCloud,
    FiUsers,
    FiCheck,
    FiClock,
    FiX,
    FiArrowRight,
} from "react-icons/fi";
import "./CandidateManagement.css";
import PageLoader from "/src/components/transitionloader/PageLoader";

const INITIAL_CANDIDATES = [
    {
        id: "CAN-001",
        name: "Juan Dela Cruz",
        studentId: "2024-0001",
        position: "President",
        party: "Independent",
        election: "Student Council Election 2026",
        status: "Approved",
        submitted: "Sep 10, 2026",
        gradeSection: "4-A",
        platform: "Student leadership and campus development.",
        photoName: "",
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
        gradeSection: "4-B",
        platform: "Unity, service, and student welfare.",
        photoName: "",
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
        gradeSection: "3-A",
        platform: "Transparent student organization.",
        photoName: "",
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
        gradeSection: "4-A",
        platform: "Responsible and transparent budgeting.",
        photoName: "",
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
        gradeSection: "3-B",
        platform: "Accountability for every student.",
        photoName: "",
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
        gradeSection: "2-A",
        platform: "Better communication across campuses.",
        photoName: "",
    },
];

const POSITIONS = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Auditor",
    "Public Information Officer",
];

const PARTIES = ["Independent", "Unity Party", "Student First"];

const EMPTY_FORM = {
    name: "",
    studentId: "",
    position: "President",
    party: "",
    gradeSection: "",
    platform: "",
    photoName: "",
    confirmation: false,
};

function CandidateManagement() {
    const navigate = useNavigate();
    const formRef = useRef(null);

    const [admin, setAdmin] = useState(null);
    const [candidates, setCandidates] = useState(INITIAL_CANDIDATES);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [positionFilter, setPositionFilter] = useState("All");
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitMessage, setSubmitMessage] = useState("");

    // Page transition loader used for navigation between admin pages.
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("votaraStaffToken");
        const storedUser = localStorage.getItem("votaraStaffUser");

        if (!token || !storedUser) {
            navigate("/admin-login", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            if (user.role !== "admin") {
                navigate("/candidates/dashboard", { replace: true });
                return;
            }

            setAdmin(user);
        } catch (error) {
            console.error("Invalid admin session:", error);
            localStorage.removeItem("votaraStaffToken");
            localStorage.removeItem("votaraStaffUser");
            navigate("/admin-login", { replace: true });
        }
    }, [navigate]);

    const navAdminName = admin?.full_name || "Administrator";
    const navAdminInitial = navAdminName.charAt(0)?.toUpperCase() || "A";

    // =====================================================
    // PAGE NAVIGATION WITH VOTARA PAGE LOADER
    // =====================================================

    const goTo = (path) => {
        if (isPageTransitioning) {
            return;
        }

        setIsPageTransitioning(true);

        window.setTimeout(() => {
            navigate(path);
        }, 700);
    };

    const handleNavLogout = () => {
        if (isPageTransitioning) {
            return;
        }

        localStorage.removeItem("votaraStaffToken");
        localStorage.removeItem("votaraStaffUser");

        setIsPageTransitioning(true);

        window.setTimeout(() => {
            navigate("/admin-login", { replace: true });
        }, 700);
    };

    const totalCandidates = candidates.length;
    const approvedCandidates = candidates.filter((candidate) => candidate.status === "Approved").length;
    const pendingCandidates = candidates.filter((candidate) => candidate.status === "Pending").length;
    const rejectedCandidates = candidates.filter((candidate) => candidate.status === "Rejected").length;

    const filteredCandidates = useMemo(() => {
        const value = search.toLowerCase().trim();

        return candidates.filter((candidate) => {
            const matchesSearch =
                candidate.name.toLowerCase().includes(value) ||
                candidate.studentId.toLowerCase().includes(value) ||
                candidate.position.toLowerCase().includes(value) ||
                candidate.party.toLowerCase().includes(value);

            const matchesStatus =
                statusFilter === "All" || candidate.status === statusFilter;

            const matchesPosition =
                positionFilter === "All" || candidate.position === positionFilter;

            return matchesSearch && matchesStatus && matchesPosition;
        });
    }, [candidates, search, statusFilter, positionFilter]);

    const recentCandidates = candidates.slice(-5).reverse();

    const scrollToForm = () => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const handleFormChange = (event) => {
        const { name, value, type, checked, files } = event.target;

        setForm((current) => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "file"
                        ? files?.[0]?.name || ""
                        : value,
        }));

        if (submitMessage) setSubmitMessage("");
    };

    const submitCandidate = (event) => {
        event.preventDefault();

        if (!form.name.trim() || !form.studentId.trim() || !form.party || !form.gradeSection.trim()) {
            setSubmitMessage("Complete the required candidate details first.");
            return;
        }

        if (!form.confirmation) {
            setSubmitMessage("Please confirm that this student is enrolled and eligible to run.");
            return;
        }

        const nextNumber = candidates.length + 1;
        const newCandidate = {
            id: `CAN-${String(nextNumber).padStart(3, "0")}`,
            name: form.name.trim(),
            studentId: form.studentId.trim(),
            position: form.position,
            party: form.party,
            election: "Student Council Election 2026",
            status: "Pending",
            submitted: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            }),
            gradeSection: form.gradeSection.trim(),
            platform: form.platform.trim(),
            photoName: form.photoName,
        };

        setCandidates((current) => [...current, newCandidate]);
        setForm(EMPTY_FORM);
        setSubmitMessage("Candidate submitted for two-person approval.");
        setTimeout(() => setSubmitMessage(""), 3500);
    };

    const approveCandidate = (id) => {
        setCandidates((current) =>
            current.map((candidate) =>
                candidate.id === id ? { ...candidate, status: "Approved" } : candidate
            )
        );

        setSelectedCandidate((current) =>
            current?.id === id ? { ...current, status: "Approved" } : current
        );
    };

    const rejectCandidate = (id) => {
        setCandidates((current) =>
            current.map((candidate) =>
                candidate.id === id ? { ...candidate, status: "Rejected" } : candidate
            )
        );

        setSelectedCandidate((current) =>
            current?.id === id ? { ...current, status: "Rejected" } : current
        );
    };

    const deleteCandidate = (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to remove this candidate?"
        );

        if (!confirmed) return;

        setCandidates((current) => current.filter((candidate) => candidate.id !== id));
        setSelectedCandidate(null);
    };

    const resetFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setPositionFilter("All");
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setSubmitMessage("");
    };

    return (
        <div className="candidate-redesign-page">
            {isPageTransitioning && <PageLoader />}

            <header className="candidate-nav-topbar">
                <div
                    className="candidate-nav-brand"
                    onClick={() => goTo("/admin-dashboard")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") goTo("/admin-dashboard");
                    }}
                >
                    <span className="candidate-nav-brand-mark">
                        <img
                            src="/src/images/Votara.png"
                            alt="Votara Logo"
                            className="candidate-nav-brand-logo"
                        />
                    </span>
                    <span className="candidate-nav-brand-name">Votara</span>
                </div>

                <nav className="candidate-nav-menu" aria-label="Admin navigation">
                    <button
                        className="candidate-nav-link"
                        onClick={() => goTo("/admin-dashboard")}
                    >
                        Overview
                    </button>
                    <button
                        className="candidate-nav-link"
                        onClick={() => goTo("/admin/students")}
                    >
                        User
                    </button>
                    <button
                        className="candidate-nav-link"
                        onClick={() => goTo("/admin/election")}
                    >
                        Elections
                    </button>
                    <button className="candidate-nav-link active" aria-current="page">
                        Candidates
                    </button>
                    <button
                        className="candidate-nav-link"
                        onClick={() => goTo("/admin/audit-logs")}
                    >
                        Logs
                    </button>
                    <button
                        className="candidate-nav-link"
                        onClick={() => goTo("/admin/settings")}
                    >
                        Config &amp; Support
                    </button>
                </nav>

                <div className="candidate-nav-actions">
                    <span className="candidate-nav-environment">
                        <span className="candidate-nav-env-dot" />
                        Production
                    </span>

                    <button
                        className="candidate-nav-notification"
                        type="button"
                        onClick={() => goTo("/admin/audit-logs")}
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <span className="candidate-nav-notification-dot" />
                        <FiBell size={16} />
                    </button>

                    <div className="candidate-nav-user">
                        <span className="candidate-nav-avatar">{navAdminInitial}</span>
                        <span className="candidate-nav-user-name">{navAdminName}</span>
                    </div>

                    <button
                        className="candidate-nav-logout"
                        type="button"
                        onClick={handleNavLogout}
                        aria-label="Logout"
                        title="Logout"
                    >
                        <FiLogOut size={17} />
                    </button>
                </div>
            </header>

            <main className="candidate-redesign-main">
                <section className="candidate-redesign-hero">
                    <div>
                        <span className="candidate-redesign-kicker">
                            <span className="candidate-redesign-kicker-dot" />
                            Candidates · Management
                        </span>
                        <h1>Add a candidate</h1>
                        <p>
                            Add a candidate, assign a position, and send it for two-person approval.
                        </p>
                        <p>
                            Candidates appear on the ballot only after both approvers sign off.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="candidate-redesign-hero-action"
                        onClick={scrollToForm}
                    >
                        <span>+</span>
                        Add Candidate
                    </button>
                </section>

                <section className="candidate-redesign-workspace">
                    <div className="candidate-redesign-left">
                        <form
                            className="candidate-form-card"
                            ref={formRef}
                            onSubmit={submitCandidate}
                        >
                            <div className="candidate-card-heading">
                                <div>
                                    <h2>New Candidate</h2>
                                    <p>Submit a student for the current election.</p>
                                </div>
                            </div>

                            <div className="candidate-form-section">
                                <label className="candidate-form-label">Assign Position</label>
                                <div className="candidate-position-grid">
                                    {POSITIONS.slice(0, 5).map((position) => (
                                        <button
                                            key={position}
                                            type="button"
                                            className={`candidate-position-option ${
                                                form.position === position ? "selected" : ""
                                            }`}
                                            onClick={() =>
                                                setForm((current) => ({ ...current, position }))
                                            }
                                        >
                                            {form.position === position && <FiCheck size={15} />}
                                            <span>{position}</span>
                                        </button>
                                    ))}
                                </div>
                                <p className="candidate-field-help">
                                    One position per candidate. Positions come from the election setup.
                                </p>
                            </div>

                            <div className="candidate-approval-notice">
                                <div className="candidate-notice-icon">△</div>
                                <div>
                                    <strong>Two-person approval required</strong>
                                    <p>
                                        Two Electoral Board members must approve every candidate.
                                        The person who adds a candidate cannot be one of the approvers.
                                    </p>
                                </div>
                                <label className="candidate-confirm-row">
                                    <input
                                        type="checkbox"
                                        name="confirmation"
                                        checked={form.confirmation}
                                        onChange={handleFormChange}
                                    />
                                    <span>
                                        I confirm this student is enrolled and eligible to run
                                    </span>
                                </label>
                            </div>

                            <div className="candidate-form-grid">
                                <label className="candidate-input-group">
                                    <span>Full Name</span>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleFormChange}
                                        placeholder="Enter candidate full name"
                                    />
                                </label>

                                <label className="candidate-input-group">
                                    <span>Student ID</span>
                                    <input
                                        name="studentId"
                                        value={form.studentId}
                                        onChange={handleFormChange}
                                        placeholder="e.g. 2025-0142"
                                    />
                                </label>

                                <label className="candidate-input-group">
                                    <span>Party List</span>
                                    <div className="candidate-select-wrap">
                                        <select
                                            name="party"
                                            value={form.party}
                                            onChange={handleFormChange}
                                        >
                                            <option value="">Select party list</option>
                                            {PARTIES.map((party) => (
                                                <option key={party} value={party}>
                                                    {party}
                                                </option>
                                            ))}
                                        </select>
                                        <FiChevronDown />
                                    </div>
                                </label>

                                <label className="candidate-input-group">
                                    <span>Grade &amp; Section</span>
                                    <input
                                        name="gradeSection"
                                        value={form.gradeSection}
                                        onChange={handleFormChange}
                                        placeholder="Select grade and section"
                                    />
                                </label>
                            </div>

                            <label className="candidate-input-group candidate-platform-field">
                                <span>Platform (Optional)</span>
                                <textarea
                                    name="platform"
                                    value={form.platform}
                                    onChange={handleFormChange}
                                    placeholder="Short platform or motto shown on the ballot page"
                                    rows={3}
                                />
                            </label>

                            <label className="candidate-upload-field">
                                <span>Candidate Photo (Optional)</span>
                                <span className="candidate-upload-box">
                                    <span className="candidate-upload-icon">
                                        <FiUploadCloud size={21} />
                                    </span>
                                    <strong>
                                        {form.photoName || "Upload candidate photo"}
                                    </strong>
                                    <small>Square PNG or JPG, shown on the ballot</small>
                                    <input
                                        type="file"
                                        name="photoName"
                                        accept=".png,.jpg,.jpeg"
                                        onChange={handleFormChange}
                                    />
                                </span>
                            </label>

                            {submitMessage && (
                                <div
                                    className={`candidate-form-message ${
                                        submitMessage.includes("submitted") ? "success" : "error"
                                    }`}
                                >
                                    {submitMessage}
                                </div>
                            )}

                            <div className="candidate-form-actions">
                                <button
                                    type="button"
                                    className="candidate-clear-btn"
                                    onClick={resetForm}
                                >
                                    Clear
                                </button>
                                <button type="submit" className="candidate-submit-btn">
                                    Submit for Approval
                                    <span><FiArrowRight size={15} /></span>
                                </button>
                            </div>
                        </form>

                        <section className="candidate-all-card">
                            <div className="candidate-all-heading">
                                <div>
                                    <h2>All Registered Candidates</h2>
                                    <p>Review, approve, reject, and remove candidates.</p>
                                </div>
                                <span className="candidate-total-pill">
                                    {filteredCandidates.length} shown
                                </span>
                            </div>

                            <div className="candidate-filter-bar">
                                <div className="candidate-search-box">
                                    <FiSearch size={16} />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search by name, ID, position or party..."
                                    />
                                </div>

                                <select
                                    value={positionFilter}
                                    onChange={(event) => setPositionFilter(event.target.value)}
                                >
                                    <option value="All">All Positions</option>
                                    {POSITIONS.map((position) => (
                                        <option key={position} value={position}>
                                            {position}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                >
                                    <option value="All">All Status</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Rejected">Rejected</option>
                                </select>

                                {(search || statusFilter !== "All" || positionFilter !== "All") && (
                                    <button
                                        type="button"
                                        className="candidate-reset-filter"
                                        onClick={resetFilters}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div className="candidate-table-scroll">
                                <table className="candidate-redesign-table">
                                    <thead>
                                        <tr>
                                            <th>Candidate</th>
                                            <th>Position</th>
                                            <th>Party</th>
                                            <th>Status</th>
                                            <th>Submitted</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCandidates.length > 0 ? (
                                            filteredCandidates.map((candidate) => (
                                                <tr key={candidate.id}>
                                                    <td>
                                                        <div className="candidate-table-person">
                                                            <span className="candidate-table-avatar">
                                                                {candidate.name.charAt(0)}
                                                            </span>
                                                            <span>
                                                                <strong>{candidate.name}</strong>
                                                                <small>{candidate.studentId}</small>
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="candidate-position-pill">
                                                            {candidate.position}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className="candidate-party-cell">
                                                            <i />
                                                            {candidate.party}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`candidate-status-pill ${candidate.status.toLowerCase()}`}>
                                                            <i />
                                                            {candidate.status}
                                                        </span>
                                                    </td>
                                                    <td>{candidate.submitted}</td>
                                                    <td>
                                                        <div className="candidate-row-actions">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedCandidate(candidate)}
                                                            >
                                                                View
                                                            </button>
                                                            {candidate.status === "Pending" && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        className="approve"
                                                                        onClick={() => approveCandidate(candidate.id)}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="reject"
                                                                        onClick={() => rejectCandidate(candidate.id)}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6">
                                                    <div className="candidate-empty-state">
                                                        <FiSearch size={22} />
                                                        <strong>No candidates found</strong>
                                                        <span>Try changing your search or filters.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="candidate-table-footer">
                                <span>
                                    Showing <strong>{filteredCandidates.length}</strong> of{" "}
                                    <strong>{totalCandidates}</strong> candidates
                                </span>
                                <div className="candidate-pagination">
                                    <button type="button" disabled>‹</button>
                                    <button type="button" className="active">1</button>
                                    <button type="button">2</button>
                                    <button type="button">3</button>
                                    <button type="button">›</button>
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="candidate-redesign-right">
                        <section className="candidate-flow-card">
                            <div className="candidate-side-heading">
                                <div>
                                    <h2>Approval Flow</h2>
                                </div>
                                <span>Draft</span>
                            </div>

                            <div className="candidate-flow-list">
                                <div className="candidate-flow-step">
                                    <div className="candidate-flow-number">1</div>
                                    <div className="candidate-flow-content">
                                        <strong>Add candidate</strong>
                                        <small>Enter the student&apos;s details, party list, and photo.</small>
                                    </div>
                                    <em>Waiting</em>
                                </div>

                                <div className="candidate-flow-step">
                                    <div className="candidate-flow-number">2</div>
                                    <div className="candidate-flow-content">
                                        <strong>Assign position</strong>
                                        <small>Choose the one position the candidate is running for.</small>
                                    </div>
                                    <em>Waiting</em>
                                </div>

                                <div className="candidate-flow-step">
                                    <div className="candidate-flow-number">3</div>
                                    <div className="candidate-flow-content">
                                        <strong>Two-person approval</strong>
                                        <small>
                                            Two Electoral Board members must approve. The person who added
                                            the candidate cannot approve.
                                        </small>
                                        <div className="candidate-approver-pills">
                                            <span>Approver 1 · Pending</span>
                                            <span>Approver 2 · Pending</span>
                                        </div>
                                    </div>
                                    <em>Waiting</em>
                                </div>

                                <div className="candidate-flow-step">
                                    <div className="candidate-flow-number">4</div>
                                    <div className="candidate-flow-content">
                                        <strong>Monitor election status</strong>
                                        <small>Approved candidates appear on the ballot and are tracked during voting.</small>
                                    </div>
                                    <em>Waiting</em>
                                </div>
                            </div>
                        </section>

                        <section className="candidate-recent-card">
                            <div className="candidate-side-heading">
                                <div>
                                    <h2>Recent Candidates</h2>
                                    <small>{totalCandidates} total</small>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("All");
                                        setPositionFilter("All");
                                        document
                                            .querySelector(".candidate-all-card")
                                            ?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                >
                                    View all
                                </button>
                            </div>

                            <div className="candidate-recent-list">
                                {recentCandidates.map((candidate) => (
                                    <button
                                        type="button"
                                        className="candidate-recent-item"
                                        key={candidate.id}
                                        onClick={() => setSelectedCandidate(candidate)}
                                    >
                                        <span className="candidate-recent-avatar">
                                            {candidate.name
                                                .split(" ")
                                                .map((part) => part.charAt(0))
                                                .slice(0, 2)
                                                .join("")}
                                        </span>
                                        <span className="candidate-recent-info">
                                            <strong>{candidate.name}</strong>
                                            <small>{candidate.position}</small>
                                        </span>
                                        <span className={`candidate-status-pill ${candidate.status.toLowerCase()}`}>
                                            <i />
                                            {candidate.status}
                                        </span>
                                        <FiChevronRight size={16} />
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="candidate-summary-card">
                            <div>
                                <FiUsers size={18} />
                                <span>Total Candidates<strong>{totalCandidates}</strong></span>
                            </div>
                            <div>
                                <FiCheck size={18} />
                                <span>Approved<strong>{approvedCandidates}</strong></span>
                            </div>
                            <div>
                                <FiClock size={18} />
                                <span>Pending<strong>{pendingCandidates}</strong></span>
                            </div>
                            <div>
                                <FiX size={18} />
                                <span>Rejected<strong>{rejectedCandidates}</strong></span>
                            </div>
                        </section>
                    </aside>
                </section>
            </main>

            {selectedCandidate && (
                <div
                    className="candidate-detail-overlay"
                    onClick={() => setSelectedCandidate(null)}
                >
                    <div
                        className="candidate-detail-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="candidate-detail-header">
                            <div>
                                <span>Candidate Profile</span>
                                <h2>Candidate Details</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCandidate(null)}
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <div className="candidate-detail-profile">
                            <span>{selectedCandidate.name.charAt(0)}</span>
                            <div>
                                <h3>{selectedCandidate.name}</h3>
                                <p>
                                    Student ID: {selectedCandidate.studentId} ·{" "}
                                    {selectedCandidate.gradeSection || "Grade & Section not provided"}
                                </p>
                                <span className={`candidate-status-pill ${selectedCandidate.status.toLowerCase()}`}>
                                    <i />
                                    {selectedCandidate.status}
                                </span>
                            </div>
                        </div>

                        <div className="candidate-detail-grid">
                            <div><label>Candidate ID</label><strong>{selectedCandidate.id}</strong></div>
                            <div><label>Position</label><strong>{selectedCandidate.position}</strong></div>
                            <div><label>Political Party</label><strong>{selectedCandidate.party}</strong></div>
                            <div><label>Election</label><strong>{selectedCandidate.election}</strong></div>
                            <div><label>Submitted</label><strong>{selectedCandidate.submitted}</strong></div>
                            <div><label>Photo</label><strong>{selectedCandidate.photoName || "Not provided"}</strong></div>
                            <div className="full"><label>Platform</label><strong>{selectedCandidate.platform || "No platform provided."}</strong></div>
                        </div>

                        <div className="candidate-detail-actions">
                            {selectedCandidate.status === "Pending" && (
                                <>
                                    <button
                                        type="button"
                                        className="approve"
                                        onClick={() => approveCandidate(selectedCandidate.id)}
                                    >
                                        ✓ Approve Candidate
                                    </button>
                                    <button
                                        type="button"
                                        className="reject"
                                        onClick={() => rejectCandidate(selectedCandidate.id)}
                                    >
                                        × Reject
                                    </button>
                                </>
                            )}
                            <button
                                type="button"
                                className="delete"
                                onClick={() => deleteCandidate(selectedCandidate.id)}
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
