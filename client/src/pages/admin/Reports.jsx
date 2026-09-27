import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    FiActivity,
    FiArrowLeft,
    FiBarChart2,
    FiCalendar,
    FiDatabase,
    FiDownload,
    FiFileText,
    FiRefreshCw,
    FiShield,
    FiUsers,
} from "react-icons/fi";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import api from "../../services/api";

import "./Reports.css";

// =========================================================
// ADMIN REPORTS & ANALYTICS
// =========================================================
//
// Administrator-only reporting page.
//
// The backend gathers:
// - student and staff counts
// - Admin / EB accounts
// - registration activity
// - elections / candidates / party lists / positions
// - voting participation and aggregate results
// - kiosk sessions and operations
// - Electoral Board audit activity
//
// Individual student vote selections are NOT displayed here.
// =========================================================

const AdminReports = () => {

    const navigate = useNavigate();
    const location = useLocation();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const selectedReport = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("report") || "system";
    }, [location.search]);

    const selectedElectionId = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return params.get("election_id") || "";
    }, [location.search]);

    const loadReports = useCallback(async (isRefresh = false, electionId = selectedElectionId) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const token = localStorage.getItem("votaraStaffToken");

            if (!token) {
                navigate("/admin-login", { replace: true });
                return;
            }

            const query = electionId
                ? `?election_id=${encodeURIComponent(electionId)}`
                : "";

            const response = await api.get(
                `/admin/reports${query}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to load Admin Reports."
                );
            }

            setData(response.data);
        } catch (requestError) {
            console.error("Admin Reports error:", requestError);

            if (requestError?.response?.status === 401) {
                localStorage.removeItem("votaraStaffToken");
                localStorage.removeItem("votaraStaffUser");
                navigate("/admin-login", { replace: true });
                return;
            }

            setError(
                requestError?.response?.data?.message ||
                requestError?.message ||
                "Unable to load Admin Reports."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [navigate, selectedElectionId]);

    useEffect(() => {
        loadReports();
    }, [loadReports]);

    const overview = data?.overview || {};
    const users = overview.users || {};
    const registrations = overview.registrations || {};
    const electionsSummary = overview.elections || {};
    const candidates = overview.candidates || {};
    const voting = overview.voting || {};
    const kiosk = overview.kiosk || {};
    const audit = overview.audit || {};

    const electionResults = data?.electionResults || null;

    const selectedElection = electionResults?.election || null;

    const goToReport = (report) => {
        const suffix = selectedElectionId
            ? `&election_id=${encodeURIComponent(selectedElectionId)}`
            : "";

        navigate(`/admin/reports?report=${report}${suffix}`);
    };

    const handleElectionChange = (event) => {
        const electionId = event.target.value;
        const report = selectedReport || "election";

        const query = electionId
            ? `?report=${report}&election_id=${encodeURIComponent(electionId)}`
            : `?report=${report}`;

        navigate(`/admin/reports${query}`);
    };

    const formatDateTime = (value) => {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    const formatNumber = (value) =>
        Number(value || 0).toLocaleString();

    const exportReport = () => {
        if (!data) return;

        const rows = [
            ["VOTARA ADMIN REPORT"],
            ["Generated At", data.generatedAt || ""],
            ["Selected Election", selectedElection?.title || "Latest election"],
            [],
            ["SYSTEM SUMMARY"],
            ["Students", users.totalStudents || 0],
            ["Staff", users.totalStaff || 0],
            ["Administrators", users.totalAdmins || 0],
            ["Electoral Board", users.totalEB || 0],
            ["Active Staff", users.activeStaff || 0],
            [],
            ["REGISTRATION SUMMARY"],
            ["Total Applications", registrations.total || 0],
            ["Pending Applications", registrations.pending || 0],
            [],
            ["ELECTION SUMMARY"],
            ["Total Elections", electionsSummary.total || 0],
            ["Open Elections", electionsSummary.open || 0],
            ["Scheduled Elections", electionsSummary.scheduled || 0],
            ["Closed Elections", electionsSummary.closed || 0],
            ["Candidates", candidates.total || 0],
            ["Active Candidates", candidates.active || 0],
            ["Party Lists", overview.partyLists || 0],
            ["Positions", overview.positions || 0],
            [],
            ["VOTING SUMMARY"],
            ["Eligible Voters", voting.eligibleVoters || 0],
            ["Voters Who Voted", voting.votersWhoVoted || 0],
            ["Remaining Voters", voting.remainingVoters || 0],
            ["Turnout", `${Number(voting.turnoutPercentage || 0).toFixed(2)}%`],
            ["Submitted Ballots", voting.submittedBallots || 0],
            [],
            ["KIOSK SUMMARY"],
            ["Total Kiosk Sessions", kiosk.totalSessions || 0],
            ["Active Kiosk Sessions", kiosk.activeSessions || 0],
            ["Total Kiosk Operations", kiosk.totalOperations || 0],
            ["Active Kiosk Operations", kiosk.activeOperations || 0],
            [],
            ["AUDIT SUMMARY"],
            ["Total Audit Logs", audit.total || 0],
            ["Electoral Board Actions", audit.electoralBoard || 0],
            ["Administrator Actions", audit.administrators || 0],
            [],
            ["RECENT EB ACTIVITY"],
            ["Date", "EB Member", "Action", "Module", "Description"],
        ];

        (data.recentAuditLogs || [])
            .filter((log) => log.actor_role === "electoral_board")
            .forEach((log) => {
                rows.push([
                    formatDateTime(log.created_at),
                    log.actor_name || "Electoral Board",
                    log.action || "",
                    log.module || "",
                    log.description || "",
                ]);
            });

        rows.push([]);
        rows.push(["KIOSK ACTIVITY"]);
        rows.push(["Started", "EB Member", "Election", "Status", "Students Served"]);

        (data.recentKioskSessions || []).forEach((session) => {
            rows.push([
                formatDateTime(session.started_at),
                session.staff_users?.full_name || "Electoral Board",
                session.elections?.title || "—",
                session.session_status || "—",
                session.students_served || 0,
            ]);
        });

        const csv = rows
            .map((row) =>
                row
                    .map((cell) => {
                        const value = String(cell ?? "");
                        return `"${value.replace(/"/g, '""')}"`;
                    })
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `VOTARA_Admin_Report_${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="admin-reports-page admin-reports-centered">
                <FiRefreshCw className="admin-reports-spin" size={30} />
                <p>Gathering VOTARA administrative reports...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="admin-reports-page admin-reports-centered">
                <FiShield size={30} />
                <h2>Unable to load reports</h2>
                <p>{error}</p>
                <button onClick={() => loadReports(true)}>
                    <FiRefreshCw size={15} />
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="admin-reports-page">
            <header className="admin-reports-header">
                <div className="admin-reports-title-block">
                    <button
                        className="admin-reports-back"
                        onClick={() => navigate("/admin-dashboard")}
                    >
                        <FiArrowLeft size={15} />
                        Dashboard
                    </button>

                    <span>VOTARA ADMINISTRATION</span>
                    <h1>Reports &amp; Analytics</h1>
                    <p>
                        Centralized administrative information gathered from
                        students, Electoral Board operations, elections,
                        kiosks, voting participation, and audit records.
                    </p>
                </div>

                <div className="admin-reports-actions">
                    <button
                        onClick={() => loadReports(true)}
                        disabled={refreshing}
                    >
                        <FiRefreshCw size={15} />
                        {refreshing ? "Refreshing" : "Refresh"}
                    </button>

                    <button onClick={exportReport}>
                        <FiDownload size={15} />
                        Export Data
                    </button>
                </div>
            </header>

            <div className="admin-report-tabs">
                <button
                    className={selectedReport === "system" ? "active" : ""}
                    onClick={() => goToReport("system")}
                >
                    <FiBarChart2 size={15} />
                    System Usage
                </button>

                <button
                    className={selectedReport === "users" ? "active" : ""}
                    onClick={() => goToReport("users")}
                >
                    <FiUsers size={15} />
                    User Activity
                </button>

                <button
                    className={selectedReport === "election" ? "active" : ""}
                    onClick={() => goToReport("election")}
                >
                    <FiCalendar size={15} />
                    Election Summary
                </button>

                <button
                    className={selectedReport === "security" ? "active" : ""}
                    onClick={() => goToReport("security")}
                >
                    <FiShield size={15} />
                    Security &amp; Audit
                </button>

                <button
                    className={selectedReport === "export" ? "active" : ""}
                    onClick={() => goToReport("export")}
                >
                    <FiDownload size={15} />
                    Export Data
                </button>
            </div>

            <section className="admin-report-metrics">
                <ReportMetric icon={FiUsers} label="Students" value={users.totalStudents} />
                <ReportMetric icon={FiShield} label="EB Members" value={users.totalEB} />
                <ReportMetric icon={FiCalendar} label="Elections" value={electionsSummary.total} />
                <ReportMetric icon={FiActivity} label="Voters Who Voted" value={voting.votersWhoVoted} />
                <ReportMetric icon={FiDatabase} label="Kiosk Sessions" value={kiosk.totalSessions} />
                <ReportMetric icon={FiFileText} label="Audit Logs" value={audit.total} />
            </section>

            {selectedReport === "system" && (
                <ReportPanel
                    title="System Usage Report"
                    description="Live counts from the VOTARA database and operational modules."
                >
                    <div className="admin-report-grid">
                        <ReportRow label="Students" value={users.totalStudents} />
                        <ReportRow label="Staff Accounts" value={users.totalStaff} />
                        <ReportRow label="Administrator Accounts" value={users.totalAdmins} />
                        <ReportRow label="Electoral Board Accounts" value={users.totalEB} />
                        <ReportRow label="Active Staff" value={users.activeStaff} />
                        <ReportRow label="Registration Applications" value={registrations.total} />
                        <ReportRow label="Pending Registrations" value={registrations.pending} />
                        <ReportRow label="Candidates" value={candidates.total} />
                        <ReportRow label="Active Candidates" value={candidates.active} />
                        <ReportRow label="Party Lists" value={overview.partyLists} />
                        <ReportRow label="Positions" value={overview.positions} />
                        <ReportRow label="Audit Logs" value={audit.total} />
                    </div>
                </ReportPanel>
            )}

            {selectedReport === "users" && (
                <>
                    <ReportPanel
                        title="User & Registration Activity"
                        description="Account and registration activity gathered from the Admin and EB workflows."
                    >
                        <div className="admin-report-grid">
                            <ReportRow label="Students" value={users.totalStudents} />
                            <ReportRow label="Staff" value={users.totalStaff} />
                            <ReportRow label="Administrators" value={users.totalAdmins} />
                            <ReportRow label="Electoral Board" value={users.totalEB} />
                            <ReportRow label="Active Staff" value={users.activeStaff} />
                            <ReportRow label="Total Applications" value={registrations.total} />
                            <ReportRow label="Pending Applications" value={registrations.pending} />
                        </div>
                    </ReportPanel>

                    <AuditActivityPanel logs={data.recentAuditLogs || []} />
                </>
            )}

            {selectedReport === "election" && (
                <>
                    <ReportPanel
                        title="Election Summary"
                        description="Election configuration, turnout, candidates, and aggregate results."
                    >
                        <div className="admin-report-election-selector">
                            <label htmlFor="admin-report-election">
                                Election
                            </label>
                            <select
                                id="admin-report-election"
                                value={selectedElectionId}
                                onChange={handleElectionChange}
                            >
                                <option value="">
                                    Latest available election
                                </option>
                                {(data.elections || []).map((election) => (
                                    <option
                                        key={election.id}
                                        value={election.id}
                                    >
                                        {election.title} — {election.status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-report-grid">
                            <ReportRow label="Total Elections" value={electionsSummary.total} />
                            <ReportRow label="Open Elections" value={electionsSummary.open} />
                            <ReportRow label="Scheduled Elections" value={electionsSummary.scheduled} />
                            <ReportRow label="Closed Elections" value={electionsSummary.closed} />
                            <ReportRow label="Eligible Voters" value={voting.eligibleVoters} />
                            <ReportRow label="Voters Who Voted" value={voting.votersWhoVoted} />
                            <ReportRow label="Remaining Voters" value={voting.remainingVoters} />
                            <ReportRow label="Turnout" value={`${Number(voting.turnoutPercentage || 0).toFixed(2)}%`} />
                            <ReportRow label="Submitted Ballots" value={voting.submittedBallots} />
                        </div>
                    </ReportPanel>

                    {selectedElection && (
                        <ReportPanel
                            title={selectedElection.title || "Election Results"}
                            description={`Status: ${selectedElection.status || "—"} · Date: ${selectedElection.electionDate || selectedElection.election_date || "—"}`}
                        >
                            <div className="admin-result-list">
                                {(electionResults?.positions || []).map((position) => (
                                    <div
                                        className="admin-result-position"
                                        key={position.id}
                                    >
                                        <div className="admin-result-position-header">
                                            <strong>{position.name}</strong>
                                            <span>{position.resultStatus || "Pending"}</span>
                                        </div>

                                        <div className="admin-result-table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Candidate</th>
                                                        <th>Party List</th>
                                                        <th>Votes</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(position.candidates || []).map((candidate) => (
                                                        <tr key={candidate.id}>
                                                            <td>{candidate.fullName}</td>
                                                            <td>{candidate.partyListName || "Independent"}</td>
                                                            <td>{formatNumber(candidate.voteCount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ReportPanel>
                    )}
                </>
            )}

            {selectedReport === "security" && (
                <>
                    <ReportPanel
                        title="Security & Audit Report"
                        description="Administrative and Electoral Board actions recorded by VOTARA."
                    >
                        <div className="admin-report-grid">
                            <ReportRow label="Total Audit Logs" value={audit.total} />
                            <ReportRow label="Electoral Board Actions" value={audit.electoralBoard} />
                            <ReportRow label="Administrator Actions" value={audit.administrators} />
                            <ReportRow label="Kiosk Sessions" value={kiosk.totalSessions} />
                            <ReportRow label="Active Kiosk Sessions" value={kiosk.activeSessions} />
                            <ReportRow label="Kiosk Operations" value={kiosk.totalOperations} />
                            <ReportRow label="Active Kiosk Operations" value={kiosk.activeOperations} />
                        </div>
                    </ReportPanel>

                    <AuditActivityPanel
                        logs={data.recentAuditLogs || []}
                        ebOnly
                    />

                    <ReportPanel
                        title="Recent Kiosk Sessions"
                        description="Temporary kiosk sessions operated by Electoral Board members."
                    >
                        <div className="admin-kiosk-list">
                            {(data.recentKioskSessions || []).map((session) => (
                                <div
                                    className="admin-kiosk-item"
                                    key={session.id}
                                >
                                    <div>
                                        <strong>
                                            {session.elections?.title || "Election"}
                                        </strong>
                                        <span>
                                            EB: {session.staff_users?.full_name || "Electoral Board"}
                                        </span>
                                    </div>
                                    <div className="admin-kiosk-meta">
                                        <b>{session.session_status || "—"}</b>
                                        <small>
                                            {formatDateTime(session.started_at)}
                                        </small>
                                        <small>
                                            Students served: {session.students_served || 0}
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ReportPanel>
                </>
            )}

            {selectedReport === "export" && (
                <ReportPanel
                    title="Export Administrative Data"
                    description="Export the currently loaded aggregate administrative and Electoral Board activity report as CSV."
                >
                    <div className="admin-report-export">
                        <FiDownload size={34} />
                        <h2>VOTARA Administrative Export</h2>
                        <p>
                            The export includes system totals, election participation,
                            aggregate results, recent EB audit activity, and kiosk session data.
                            Individual student vote selections are not exported.
                        </p>
                        <button onClick={exportReport}>
                            <FiDownload size={15} />
                            Export CSV Report
                        </button>
                    </div>
                </ReportPanel>
            )}
        </div>
    );
};

const ReportMetric = ({ icon: Icon, label, value }) => (
    <div className="admin-report-metric">
        <div className="admin-report-metric-icon">
            <Icon size={18} />
        </div>
        <span>{label}</span>
        <strong>{Number(value || 0).toLocaleString()}</strong>
    </div>
);

const ReportRow = ({ label, value }) => (
    <div className="admin-report-row">
        <span>{label}</span>
        <strong>
            {typeof value === "number"
                ? value.toLocaleString()
                : value ?? "0"}
        </strong>
    </div>
);

const ReportPanel = ({ title, description, children }) => (
    <section className="admin-report-panel">
        <div className="admin-report-panel-header">
            <div>
                <h2>{title}</h2>
                <p>{description}</p>
            </div>
        </div>
        {children}
    </section>
);

const AuditActivityPanel = ({ logs, ebOnly = false }) => {
    const filteredLogs = (logs || []).filter((log) =>
        ebOnly ? log.actor_role === "electoral_board" : true
    );

    return (
        <ReportPanel
            title={ebOnly ? "Recent Electoral Board Activity" : "Recent User Activity"}
            description="Latest actions recorded in the VOTARA audit trail."
        >
            <div className="admin-audit-list">
                {filteredLogs.length === 0 && (
                    <div className="admin-empty-state">
                        No audit activity has been recorded yet.
                    </div>
                )}

                {filteredLogs.map((log) => (
                    <div className="admin-audit-item" key={log.id}>
                        <div>
                            <strong>{log.action || "Activity"}</strong>
                            <span>
                                {log.actor_name || "Unknown actor"}
                                {log.actor_role ? ` · ${log.actor_role}` : ""}
                            </span>
                            <small>
                                {log.description || log.module || "System activity"}
                            </small>
                        </div>
                        <time>{new Date(log.created_at).toLocaleString()}</time>
                    </div>
                ))}
            </div>
        </ReportPanel>
    );
};

export default AdminReports;
