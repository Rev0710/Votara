import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiAlertCircle,
    FiBarChart2,
    FiCalendar,
    FiCheckCircle,
    FiChevronDown,
    FiDownload,
    FiFileText,
    FiRefreshCw,
    FiTrendingUp,
    FiUsers,
} from "react-icons/fi";

import api from "../../services/api";
import AdminTopNav from "./AdminTopNav";
import "./Reports.css";

const EMPTY_STATS = {
    eligibleVoters: 0,
    votersWhoVoted: 0,
    remainingVoters: 0,
    turnoutPercentage: 0,
    submittedBallots: 0,
    totalPositions: 0,
    positionsWithResults: 0,
    tiedPositions: 0,
    positionsWithoutVotes: 0,
};

function formatNumber(value) {
    return Number(value || 0).toLocaleString();
}

function formatPercent(value) {
    const number = Number(value || 0);
    return `${number.toFixed(number % 1 === 0 ? 0 : 1)}%`;
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatDateTime(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

function getStatusLabel(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "closed") return "Closed";
    if (normalized === "active" || normalized === "open") return "Open";
    if (normalized === "scheduled") return "Scheduled";
    if (normalized === "cancelled") return "Cancelled";
    return "Draft";
}

function getStatusClass(status) {
    const normalized = String(status || "").toLowerCase();

    if (normalized === "closed") return "closed";
    if (normalized === "active" || normalized === "open") return "open";
    if (normalized === "scheduled") return "scheduled";
    if (normalized === "cancelled") return "cancelled";
    return "draft";
}

function getPositionTotalVotes(position) {
    return (position?.candidates || []).reduce(
        (total, candidate) => total + Number(candidate?.voteCount || 0),
        0
    );
}

function buildLinePath(points, width, height, padding, maxValue) {
    if (!points.length) return "";

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const denominator = Math.max(points.length - 1, 1);

    return points
        .map((point, index) => {
            const x =
                padding.left +
                (index / denominator) * chartWidth;

            const y =
                padding.top +
                chartHeight -
                (Number(point.value || 0) / Math.max(maxValue, 1)) *
                    chartHeight;

            return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(
                2
            )}`;
        })
        .join(" ");
}

function buildAreaPath(points, width, height, padding, maxValue) {
    if (!points.length) return "";

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const denominator = Math.max(points.length - 1, 1);

    const coordinates = points.map((point, index) => {
        const x =
            padding.left +
            (index / denominator) * chartWidth;

        const y =
            padding.top +
            chartHeight -
            (Number(point.value || 0) / Math.max(maxValue, 1)) *
                chartHeight;

        return { x, y };
    });

    const baselineY = padding.top + chartHeight;

    return [
        `M ${coordinates[0].x.toFixed(2)} ${baselineY.toFixed(2)}`,
        ...coordinates.map(
            (point) =>
                `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
        ),
        `L ${coordinates[coordinates.length - 1].x.toFixed(
            2
        )} ${baselineY.toFixed(2)}`,
        "Z",
    ].join(" ");
}

function DonutChart({ percentage }) {
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    const progress =
        Math.min(Math.max(Number(percentage || 0), 0), 100) / 100;
    const dash = circumference * progress;

    return (
        <div className="reports-donut-wrap">
            <svg
                className="reports-donut"
                viewBox="0 0 160 160"
                role="img"
                aria-label={`Voter turnout ${formatPercent(percentage)}`}
            >
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="rgba(148,163,184,0.16)"
                    strokeWidth="16"
                />
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="#286bff"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    transform="rotate(-90 80 80)"
                />
            </svg>

            <div className="reports-donut-label">
                <strong>{formatPercent(percentage)}</strong>
                <span>Turnout rate</span>
            </div>
        </div>
    );
}

function TurnoutChart({ points = [], percentage = 0 }) {
    const width = 760;
    const height = 290;
    const padding = {
        top: 24,
        right: 18,
        bottom: 42,
        left: 48,
    };

    const safePoints =
        points.length > 0
            ? points
            : [
                  { label: "Start", value: 0 },
                  { label: "End", value: Number(percentage || 0) },
              ];

    const maxValue = Math.max(
        100,
        ...safePoints.map((point) => Number(point.value || 0))
    );

    const linePath = buildLinePath(
        safePoints,
        width,
        height,
        padding,
        maxValue
    );

    const areaPath = buildAreaPath(
        safePoints,
        width,
        height,
        padding,
        maxValue
    );

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const denominator = Math.max(safePoints.length - 1, 1);

    const labelIndexes =
        safePoints.length <= 6
            ? safePoints.map((_, index) => index)
            : [0, Math.floor(safePoints.length / 2), safePoints.length - 1];

    return (
        <div className="reports-turnout-chart">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="reports-line-chart"
                role="img"
                aria-label="Cumulative voter turnout over time"
            >
                {[0, 25, 50, 75, 100].map((value) => {
                    const y =
                        padding.top +
                        chartHeight -
                        (value / maxValue) * chartHeight;

                    return (
                        <g key={value}>
                            <line
                                x1={padding.left}
                                x2={width - padding.right}
                                y1={y}
                                y2={y}
                                stroke="rgba(148,163,184,0.13)"
                                strokeWidth="1"
                            />
                            <text
                                x={padding.left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fill="#94a3b8"
                                fontSize="11"
                            >
                                {value}%
                            </text>
                        </g>
                    );
                })}

                <path
                    d={areaPath}
                    fill="rgba(40,107,255,0.16)"
                />

                <path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {safePoints.map((point, index) => {
                    if (!labelIndexes.includes(index)) return null;

                    const x =
                        padding.left +
                        (index / denominator) * chartWidth;

                    const y =
                        padding.top +
                        chartHeight -
                        (Number(point.value || 0) / Math.max(maxValue, 1)) *
                            chartHeight;

                    return (
                        <g key={`${point.label}-${index}`}>
                            <circle
                                cx={x}
                                cy={y}
                                r="4.5"
                                fill="#3b82f6"
                                stroke="#e5edff"
                                strokeWidth="2"
                            />
                            <text
                                x={x}
                                y={height - 17}
                                textAnchor="middle"
                                fill="#94a3b8"
                                fontSize="10"
                            >
                                {point.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

function ReportStatCard({ icon: Icon, label, value, caption }) {
    return (
        <article className="reports-stat-card">
            <div className="reports-stat-icon">
                <Icon size={18} />
            </div>

            <span className="reports-stat-label">{label}</span>
            <strong className="reports-stat-value">{value}</strong>
            <span className="reports-stat-caption">{caption}</span>
        </article>
    );
}

export default function Reports() {
    const navigate = useNavigate();

    const [report, setReport] = useState(null);
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    const selectedElection =
        report?.election || null;

    const statistics = {
        ...EMPTY_STATS,
        ...(report?.statistics || {}),
    };

    const positions = Array.isArray(report?.positions)
        ? report.positions
        : [];

    const electionOptions = Array.isArray(report?.elections)
        ? report.elections
        : [];

    const turnoutPoints = Array.isArray(report?.turnoutOverTime)
        ? report.turnoutOverTime
        : [];

    const candidateCount = useMemo(
        () =>
            positions.reduce(
                (total, position) =>
                    total + (position?.candidates?.length || 0),
                0
            ),
        [positions]
    );

    const loadReport = useCallback(
        async (electionId = "") => {
            try {
                setError("");

                const response = await api.get("/admin/reports", {
                    params: electionId
                        ? { election_id: electionId }
                        : undefined,
                });

                const data = response?.data || {};

                if (!data.success) {
                    throw new Error(
                        data.message || "Unable to load reports."
                    );
                }

                setReport(data);

                if (data.election?.id) {
                    setSelectedElectionId(data.election.id);
                }
            } catch (err) {
                console.error("VOTARA Reports loading error:", err);

                if (err?.response?.status === 401) {
                    localStorage.removeItem("votaraAdminToken");
                    localStorage.removeItem("votaraAdminUser");

                    navigate("/admin-login", {
                        replace: true,
                    });

                    return;
                }

                setError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Unable to load Reports & Analytics."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [navigate]
    );

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleElectionChange = async (event) => {
        const nextId = event.target.value;

        setSelectedElectionId(nextId);
        setLoading(true);

        await loadReport(nextId);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadReport(selectedElectionId);
    };

    const handleExport = async () => {
        if (exporting) return;

        try {
            setExporting(true);
            setError("");

            const token =
                localStorage.getItem("votaraAdminToken");

            const baseURL =
                api?.defaults?.baseURL || "/api";

            const query = selectedElectionId
                ? `?election_id=${encodeURIComponent(selectedElectionId)}`
                : "";

            const response = await fetch(
                `${String(baseURL).replace(/\/$/, "")}/admin/reports/export${query}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                let message =
                    "Unable to export the report.";

                try {
                    const data = await response.json();
                    message = data?.message || message;
                } catch {
                    // Response was not JSON.
                }

                throw new Error(message);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const contentDisposition =
                response.headers.get("content-disposition") || "";

            const filenameMatch =
                contentDisposition.match(
                    /filename="?([^"]+)"?/i
                );

            const filename =
                filenameMatch?.[1] ||
                "VOTARA_Election_Report.xlsx";

            const anchor =
                document.createElement("a");

            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Report export error:", err);

            setError(
                err?.message ||
                    "Unable to export the report."
            );
        } finally {
            setExporting(false);
        }
    };

    const status = selectedElection?.status || "draft";
    const turnout = Number(
        statistics.turnoutPercentage || 0
    );

    return (
        <div className="reports-page">
            <AdminTopNav />

            <main className="reports-main">
                <div className="reports-breadcrumb">
                    <span>Admin</span>
                    <span>/</span>
                    <strong>Reports</strong>
                </div>

                <section className="reports-header">
                    <div>
                        <span className="reports-kicker">
                            VOTARA ADMINISTRATION
                        </span>
                        <h1>Reports</h1>
                        <p>
                            Review completed-election participation and
                            read-only system summaries.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="reports-refresh-button"
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                    >
                        <FiRefreshCw
                            className={
                                refreshing
                                    ? "reports-spin"
                                    : ""
                            }
                        />
                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </section>

                {error && (
                    <div className="reports-alert">
                        <FiAlertCircle />
                        <div>
                            <strong>Unable to load report</strong>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <section className="reports-toolbar">
                    <div className="reports-toolbar-left">
                        <label
                            htmlFor="reports-election"
                            className="reports-field-label"
                        >
                            Selected election
                        </label>

                        <div className="reports-select-wrap">
                            <select
                                id="reports-election"
                                value={selectedElectionId}
                                onChange={handleElectionChange}
                                disabled={
                                    loading ||
                                    electionOptions.length === 0
                                }
                            >
                                {electionOptions.length === 0 ? (
                                    <option value="">
                                        No elections available
                                    </option>
                                ) : (
                                    electionOptions.map((election) => (
                                        <option
                                            key={election.id}
                                            value={election.id}
                                        >
                                            {election.title} ·{" "}
                                            {formatDate(
                                                election.election_date
                                            )}{" "}
                                            ·{" "}
                                            {getStatusLabel(
                                                election.status
                                            )}
                                        </option>
                                    ))
                                )}
                            </select>

                            <FiChevronDown />
                        </div>
                    </div>

                    <div className="reports-toolbar-actions">
                        <button
                            type="button"
                            className="reports-secondary-button"
                            onClick={() =>
                                navigate("/admin-dashboard")
                            }
                        >
                            Back to overview
                        </button>

                        <button
                            type="button"
                            className="reports-primary-button"
                            onClick={handleExport}
                            disabled={
                                exporting ||
                                loading ||
                                !selectedElection
                            }
                        >
                            <FiDownload />
                            {exporting
                                ? "Preparing..."
                                : "Review report export"}
                        </button>
                    </div>
                </section>

                {loading && !report ? (
                    <section className="reports-loading">
                        <div className="reports-loader">
                            <FiRefreshCw className="reports-spin" />
                        </div>
                        <strong>Loading election report...</strong>
                        <span>
                            Preparing participation and result summaries.
                        </span>
                    </section>
                ) : !selectedElection ? (
                    <section className="reports-empty">
                        <FiFileText />
                        <h2>No election report available</h2>
                        <p>
                            Reports will appear here once VOTARA has an
                            election configured.
                        </p>
                    </section>
                ) : (
                    <>
                        <section className="reports-election-banner">
                            <div className="reports-election-icon">
                                <FiCalendar />
                            </div>

                            <div className="reports-election-info">
                                <span>REPORTING PERIOD</span>
                                <strong>
                                    {selectedElection.title}
                                </strong>
                                <p>
                                    {formatDate(
                                        selectedElection.election_date
                                    )}{" "}
                                    ·{" "}
                                    {selectedElection.start_time || "Start time not set"}{" "}
                                    –{" "}
                                    {selectedElection.end_time || "End time not set"}
                                </p>
                            </div>

                            <span
                                className={`reports-status-badge ${getStatusClass(
                                    status
                                )}`}
                            >
                                {getStatusLabel(status)}
                            </span>
                        </section>

                        <section className="reports-stat-grid">
                            <ReportStatCard
                                icon={FiUsers}
                                label="Eligible voters"
                                value={formatNumber(
                                    statistics.eligibleVoters
                                )}
                                caption="Eligible students in configured year levels"
                            />

                            <ReportStatCard
                                icon={FiCheckCircle}
                                label="Ballots cast"
                                value={formatNumber(
                                    statistics.submittedBallots
                                )}
                                caption={`${formatNumber(
                                    statistics.votersWhoVoted
                                )} voters completed voting`}
                            />

                            <ReportStatCard
                                icon={FiTrendingUp}
                                label="Turnout"
                                value={formatPercent(turnout)}
                                caption={`${formatNumber(
                                    statistics.remainingVoters
                                )} eligible voters did not vote`}
                            />

                            <ReportStatCard
                                icon={FiBarChart2}
                                label="Election status"
                                value={getStatusLabel(status)}
                                caption={
                                    selectedElection.closed_at
                                        ? `Closed ${formatDate(
                                              selectedElection.closed_at
                                          )}`
                                        : `Generated ${formatDateTime(
                                              report.generatedAt
                                          )}`
                                }
                            />
                        </section>

                        <section className="reports-analysis-grid">
                            <article className="reports-panel reports-donut-panel">
                                <div className="reports-panel-heading">
                                    <div>
                                        <span>PARTICIPATION</span>
                                        <h2>Voter turnout</h2>
                                        <p>
                                            Participation in this election.
                                        </p>
                                    </div>

                                    <div className="reports-panel-icon">
                                        <FiUsers />
                                    </div>
                                </div>

                                <DonutChart percentage={turnout} />

                                <div className="reports-legend">
                                    <div>
                                        <span className="reports-legend-dot voted" />
                                        <span>Voted</span>
                                        <strong>
                                            {formatNumber(
                                                statistics.votersWhoVoted
                                            )}
                                        </strong>
                                        <em>
                                            {formatPercent(turnout)}
                                        </em>
                                    </div>

                                    <div>
                                        <span className="reports-legend-dot not-voted" />
                                        <span>Did not vote</span>
                                        <strong>
                                            {formatNumber(
                                                statistics.remainingVoters
                                            )}
                                        </strong>
                                        <em>
                                            {formatPercent(
                                                statistics.eligibleVoters
                                                    ? (statistics.remainingVoters /
                                                          statistics.eligibleVoters) *
                                                          100
                                                    : 0
                                            )}
                                        </em>
                                    </div>

                                    <div>
                                        <span className="reports-legend-dot total" />
                                        <span>Registered voters</span>
                                        <strong>
                                            {formatNumber(
                                                statistics.eligibleVoters
                                            )}
                                        </strong>
                                        <em>100%</em>
                                    </div>
                                </div>
                            </article>

                            <article className="reports-panel reports-trend-panel">
                                <div className="reports-panel-heading">
                                    <div>
                                        <span>TURNOUT TREND</span>
                                        <h2>Turnout over time</h2>
                                        <p>
                                            Cumulative participation during
                                            the election period.
                                        </p>
                                    </div>

                                    <div className="reports-panel-icon">
                                        <FiTrendingUp />
                                    </div>
                                </div>

                                <TurnoutChart
                                    points={turnoutPoints}
                                    percentage={turnout}
                                />

                                <div className="reports-chart-note">
                                    <span>
                                        Final turnout
                                    </span>
                                    <strong>
                                        {formatPercent(turnout)}
                                    </strong>
                                </div>
                            </article>
                        </section>

                        <section className="reports-results-panel">
                            <div className="reports-results-heading">
                                <div>
                                    <span>CANDIDATE RESULTS</span>
                                    <h2>Candidate results</h2>
                                    <p>
                                        Certified candidate results are
                                        read-only in Reports &amp; Analytics.
                                        Results are calculated from submitted
                                        ballots without exposing student
                                        identities or ballot selections.
                                    </p>
                                </div>

                                <div className="reports-results-summary">
                                    <span>
                                        {formatNumber(candidateCount)} candidates
                                    </span>
                                    <span>
                                        {formatNumber(
                                            statistics.totalPositions
                                        )}{" "}
                                        positions
                                    </span>
                                </div>
                            </div>

                            {positions.length === 0 ? (
                                <div className="reports-results-empty">
                                    <FiFileText />
                                    <strong>
                                        No candidate results available
                                    </strong>
                                    <span>
                                        No active election positions or
                                        candidates were returned for this
                                        election.
                                    </span>
                                </div>
                            ) : (
                                <div className="reports-position-list">
                                    {positions.map((position) => {
                                        const totalVotes =
                                            getPositionTotalVotes(position);

                                        return (
                                            <article
                                                className="reports-position-card"
                                                key={position.id}
                                            >
                                                <div className="reports-position-header">
                                                    <div>
                                                        <span>
                                                            POSITION
                                                        </span>
                                                        <h3>
                                                            {position.name}
                                                        </h3>
                                                    </div>

                                                    <span
                                                        className={`reports-result-status ${String(
                                                            position.resultStatus ||
                                                                ""
                                                        ).toLowerCase()}`}
                                                    >
                                                        {position.resultStatus ===
                                                        "winner"
                                                            ? "Result available"
                                                            : position.resultStatus ===
                                                              "tie"
                                                            ? "Tie"
                                                            : "No votes"}
                                                    </span>
                                                </div>

                                                <div className="reports-candidate-list">
                                                    {(
                                                        position.candidates ||
                                                        []
                                                    ).map((candidate) => {
                                                        const votes =
                                                            Number(
                                                                candidate.voteCount ||
                                                                    0
                                                            );

                                                        const percentage =
                                                            totalVotes > 0
                                                                ? (votes /
                                                                      totalVotes) *
                                                                  100
                                                                : 0;

                                                        const isWinner =
                                                            position.winner
                                                                ?.id ===
                                                            candidate.id;

                                                        return (
                                                            <div
                                                                className={`reports-candidate-row ${
                                                                    isWinner
                                                                        ? "winner"
                                                                        : ""
                                                                }`}
                                                                key={
                                                                    candidate.id
                                                                }
                                                            >
                                                                <div className="reports-candidate-main">
                                                                    <div className="reports-candidate-avatar">
                                                                        {candidate.profilePicture ? (
                                                                            <img
                                                                                src={
                                                                                    candidate.profilePicture
                                                                                }
                                                                                alt=""
                                                                            />
                                                                        ) : (
                                                                            String(
                                                                                candidate.fullName ||
                                                                                    "C"
                                                                            )
                                                                                .trim()
                                                                                .charAt(
                                                                                    0
                                                                                )
                                                                                .toUpperCase()
                                                                        )}
                                                                    </div>

                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                candidate.fullName
                                                                            }
                                                                        </strong>
                                                                        <span>
                                                                            {
                                                                                candidate.partyListName
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="reports-candidate-bar-wrap">
                                                                    <div className="reports-candidate-bar">
                                                                        <span
                                                                            style={{
                                                                                width: `${Math.min(
                                                                                    100,
                                                                                    Math.max(
                                                                                        0,
                                                                                        percentage
                                                                                    )
                                                                                )}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <small>
                                                                        {formatPercent(
                                                                            percentage
                                                                        )}
                                                                    </small>
                                                                </div>

                                                                <div className="reports-candidate-votes">
                                                                    <strong>
                                                                        {formatNumber(
                                                                            votes
                                                                        )}
                                                                    </strong>
                                                                    <span>
                                                                        votes
                                                                    </span>
                                                                    {isWinner && (
                                                                        <em>
                                                                            Winner
                                                                        </em>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        <section className="reports-footer-actions">
                            <button
                                type="button"
                                className="reports-secondary-button"
                                onClick={() => navigate("/admin/reports")}
                            >
                                Browse reports
                            </button>

                            <button
                                type="button"
                                className="reports-secondary-button"
                                onClick={() =>
                                    navigate("/admin-dashboard")
                                }
                            >
                                View system report
                            </button>
                        </section>

                        <footer className="reports-footer">
                            <span>
                                VOTARA Online Voting System · Read-only
                                administrative reporting
                            </span>
                            <span>
                                Generated:{" "}
                                {formatDateTime(report.generatedAt)}
                            </span>
                        </footer>
                    </>
                )}
            </main>
        </div>
    );
}
