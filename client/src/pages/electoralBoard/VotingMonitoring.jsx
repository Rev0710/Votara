import React, {
    useCallback,
    useEffect,
    useState
} from "react";

import api from "../../services/api";
import "./VotingMonitoring.css";

// =========================================================
// VOTING MONITORING
// =========================================================

const VotingMonitoring = () => {

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [monitoringData, setMonitoringData] =
        useState(null);

    // =====================================================
    // LOAD MONITORING DATA
    // =====================================================

    const loadMonitoringData = useCallback(
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
                        "/electoral-board/voting-monitoring"
                    );

                if (
                    !response?.data?.success
                ) {
                    throw new Error(
                        response?.data?.message ||
                        "Unable to load voting monitoring data."
                    );
                }

                setMonitoringData(
                    response.data
                );

            } catch (err) {

                console.error(
                    "Voting Monitoring error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load voting monitoring data."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadMonitoringData();
    }, [loadMonitoringData]);

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (value) => {

        if (!value) {
            return "—";
        }

        try {

            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return String(value);
            }

            return date.toLocaleDateString(
                "en-US",
                {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            );

        } catch {
            return String(value);
        }
    };

    // =====================================================
    // FORMAT TIME
    // =====================================================

    const formatTime = (value) => {

        if (!value) {
            return "—";
        }

        try {

            const parts =
                String(value).split(":");

            if (parts.length < 2) {
                return String(value);
            }

            const hours =
                Number(parts[0]);

            const minutes =
                Number(parts[1]);

            if (
                Number.isNaN(hours) ||
                Number.isNaN(minutes)
            ) {
                return String(value);
            }

            const date =
                new Date();

            date.setHours(
                hours,
                minutes,
                0,
                0
            );

            return date.toLocaleTimeString(
                "en-US",
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );

        } catch {
            return String(value);
        }
    };

    // =====================================================
    // FORMAT TIMESTAMP
    // =====================================================

    const formatTimestamp = (value) => {

        if (!value) {
            return "—";
        }

        try {

            const date =
                new Date(value);

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                return String(value);
            }

            return date.toLocaleString(
                "en-US",
                {
                    dateStyle: "medium",
                    timeStyle: "short"
                }
            );

        } catch {
            return String(value);
        }
    };

    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {

        const normalized =
            String(status || "")
                .toLowerCase();

        if (
            normalized === "open" ||
            normalized === "active"
        ) {
            return "vm-status vm-status-open";
        }

        if (
            normalized === "scheduled"
        ) {
            return "vm-status vm-status-scheduled";
        }

        if (
            normalized === "closed"
        ) {
            return "vm-status vm-status-closed";
        }

        if (
            normalized === "cancelled" ||
            normalized === "canceled"
        ) {
            return "vm-status vm-status-cancelled";
        }

        return "vm-status vm-status-draft";
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="vm-page">

                <div className="vm-loading">

                    <div className="vm-spinner" />

                    <h3>
                        Loading Voting Monitoring
                    </h3>

                    <p>
                        Please wait while election
                        participation data is loaded.
                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // DATA
    // =====================================================

    const election =
        monitoringData?.election || null;

    const rawStatistics =
        monitoringData?.statistics || {};

    const rawYearLevels =
        monitoringData?.eligibleYearLevels || [];

    const rawRecentActivity =
        monitoringData?.recentActivity || [];

    // =====================================================
    // NORMALIZE STATISTICS
    //
    // Supports both backend naming styles:
    // - remainingVoters / votersRemaining
    // - submittedBallots / ballotsSubmitted
    // =====================================================

    const eligibleVoters =
        Number(
            rawStatistics.eligibleVoters ?? 0
        );

    const votersWhoVoted =
        Number(
            rawStatistics.votersWhoVoted ?? 0
        );

    const votersRemaining =
        Number(
            rawStatistics.votersRemaining ??
            rawStatistics.remainingVoters ??
            Math.max(
                eligibleVoters -
                votersWhoVoted,
                0
            )
        );

    const votingPercentage =
        Number(
            rawStatistics.votingPercentage ?? 0
        );

    const ballotsSubmitted =
        Number(
            rawStatistics.ballotsSubmitted ??
            rawStatistics.submittedBallots ??
            0
        );

    // =====================================================
    // NORMALIZE YEAR LEVELS
    //
    // Backend returns:
    // {
    //     id,
    //     year_level
    // }
    //
    // We convert them into simple display values.
    //
    // 1st Year is always excluded according to VOTARA rule.
    // =====================================================

    const eligibleYearLevels =
        rawYearLevels
            .map((item) => {

                if (
                    typeof item === "string"
                ) {
                    return {
                        id: item,
                        name: item
                    };
                }

                return {
                    id:
                        item?.id ||
                        item?.year_level ||
                        item?.yearLevel,
                    name:
                        item?.year_level ||
                        item?.yearLevel ||
                        ""
                };
            })
            .filter(
                (item) =>
                    item.name &&
                    item.name !== "1st Year"
            );

    // =====================================================
    // NORMALIZE RECENT ACTIVITY
    //
    // Backend returns:
    // {
    //     id,
    //     has_voted,
    //     voted_at
    // }
    //
    // We intentionally display NO student identity
    // and NO candidate selections.
    // =====================================================

    const recentActivity =
        rawRecentActivity.map(
            (activity, index) => ({
                id:
                    activity?.id ||
                    `activity-${index}`,
                sequence:
                    index + 1,
                votedAt:
                    activity?.voted_at ||
                    activity?.votedAt ||
                    null
            })
        );

    // =====================================================
    // MAIN UI
    // =====================================================

    return (
        <div className="vm-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="vm-header">

                <div>

                    <div className="vm-eyebrow">
                        ELECTORAL BOARD
                    </div>

                    <h1>
                        Voting Monitoring
                    </h1>

                    <p>
                        Monitor election participation
                        and voting progress in real time.
                    </p>

                </div>

                <button
                    type="button"
                    className="vm-refresh-button"
                    onClick={() =>
                        loadMonitoringData(true)
                    }
                    disabled={refreshing}
                >

                    <span>
                        {refreshing
                            ? "↻"
                            : "⟳"}
                    </span>

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}

                </button>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="vm-error">

                    <div className="vm-error-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            Unable to load monitoring data
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>
            )}

            {/* =================================================
                ELECTION INFORMATION
            ================================================= */}

            {election ? (

                <div className="vm-election-card">

                    <div className="vm-election-main">

                        <div className="vm-election-icon">
                            ✓
                        </div>

                        <div>

                            <span className="vm-card-label">
                                CURRENT ELECTION
                            </span>

                            <h2>
                                {election.title ||
                                    "Untitled Election"}
                            </h2>

                            {election.description && (
                                <p>
                                    {election.description}
                                </p>
                            )}

                        </div>

                    </div>

                    <div className="vm-election-meta">

                        <div>

                            <span>
                                Election Date
                            </span>

                            <strong>
                                {formatDate(
                                    election.election_date ??
                                    election.electionDate
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Voting Period
                            </span>

                            <strong>
                                {formatTime(
                                    election.start_time ??
                                    election.startTime
                                )}

                                {" – "}

                                {formatTime(
                                    election.end_time ??
                                    election.endTime
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Status
                            </span>

                            <strong
                                className={
                                    getStatusClass(
                                        election.status
                                    )
                                }
                            >
                                {String(
                                    election.status ||
                                    "draft"
                                ).toUpperCase()}
                            </strong>

                        </div>

                    </div>

                </div>

            ) : (

                <div className="vm-empty-election">

                    <div className="vm-empty-icon">
                        !
                    </div>

                    <h2>
                        No Election Available
                    </h2>

                    <p>
                        Configure an election in
                        Election Management before
                        monitoring voting activity.
                    </p>

                </div>
            )}

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="vm-stats-grid">

                <div className="vm-stat-card">

                    <div className="vm-stat-icon">
                        👥
                    </div>

                    <div>

                        <span>
                            Eligible Voters
                        </span>

                        <strong>
                            {eligibleVoters}
                        </strong>

                    </div>

                </div>

                <div className="vm-stat-card">

                    <div className="vm-stat-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            Voters Who Voted
                        </span>

                        <strong>
                            {votersWhoVoted}
                        </strong>

                    </div>

                </div>

                <div className="vm-stat-card">

                    <div className="vm-stat-icon">
                        ◷
                    </div>

                    <div>

                        <span>
                            Remaining
                        </span>

                        <strong>
                            {votersRemaining}
                        </strong>

                    </div>

                </div>

                <div className="vm-stat-card">

                    <div className="vm-stat-icon">
                        %
                    </div>

                    <div>

                        <span>
                            Voting Progress
                        </span>

                        <strong>
                            {votingPercentage}%
                        </strong>

                    </div>

                </div>

            </div>

            {/* =================================================
                PROGRESS
            ================================================= */}

            <div className="vm-panel">

                <div className="vm-panel-header">

                    <div>

                        <span className="vm-card-label">
                            PARTICIPATION
                        </span>

                        <h2>
                            Overall Voting Progress
                        </h2>

                    </div>

                    <strong className="vm-progress-number">
                        {votingPercentage}%
                    </strong>

                </div>

                <div className="vm-progress-track">

                    <div
                        className="vm-progress-fill"
                        style={{
                            width: `${Math.min(
                                Math.max(
                                    votingPercentage,
                                    0
                                ),
                                100
                            )}%`
                        }}
                    />

                </div>

                <div className="vm-progress-footer">

                    <span>
                        {votersWhoVoted} voters completed
                        their ballot
                    </span>

                    <span>
                        {votersRemaining} remaining
                    </span>

                </div>

            </div>

            {/* =================================================
                ELIGIBLE YEAR LEVELS
            ================================================= */}

            <div className="vm-panel">

                <div className="vm-panel-header">

                    <div>

                        <span className="vm-card-label">
                            ELIGIBILITY
                        </span>

                        <h2>
                            Participating Year Levels
                        </h2>

                    </div>

                </div>

                {eligibleYearLevels.length > 0 ? (

                    <div className="vm-year-levels">

                        {eligibleYearLevels.map(
                            (yearLevel) => (

                                <div
                                    key={
                                        yearLevel.id ||
                                        yearLevel.name
                                    }
                                    className="vm-year-level"
                                >

                                    <span>
                                        ✓
                                    </span>

                                    {yearLevel.name}

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <p className="vm-muted">
                        2nd Year, 3rd Year, and
                        4th Year students are
                        eligible under the current
                        VOTARA voting rule.
                    </p>
                )}

            </div>

            {/* =================================================
                BALLOT SUMMARY
            ================================================= */}

            <div className="vm-panel">

                <div className="vm-panel-header">

                    <div>

                        <span className="vm-card-label">
                            BALLOT ACTIVITY
                        </span>

                        <h2>
                            Submitted Ballots
                        </h2>

                    </div>

                    <strong className="vm-ballot-count">
                        {ballotsSubmitted}
                    </strong>

                </div>

                <p className="vm-muted">
                    This count represents submitted
                    ballots for the selected election.
                    Individual student choices are not
                    displayed in Voting Monitoring.
                </p>

            </div>

            {/* =================================================
                RECENT ACTIVITY
            ================================================= */}

            <div className="vm-panel">

                <div className="vm-panel-header">

                    <div>

                        <span className="vm-card-label">
                            RECENT ACTIVITY
                        </span>

                        <h2>
                            Latest Voting Activity
                        </h2>

                    </div>

                    <span className="vm-private-badge">
                        Ballot choices hidden
                    </span>

                </div>

                {recentActivity.length > 0 ? (

                    <div className="vm-activity-list">

                        {recentActivity.map(
                            (activity) => (

                                <div
                                    key={activity.id}
                                    className="vm-activity-row"
                                >

                                    <div className="vm-activity-number">
                                        {activity.sequence}
                                    </div>

                                    <div className="vm-activity-info">

                                        <strong>
                                            Ballot submitted
                                        </strong>

                                        <span>
                                            Voting participation
                                            recorded
                                        </span>

                                    </div>

                                    <time>
                                        {formatTimestamp(
                                            activity.votedAt
                                        )}
                                    </time>

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <div className="vm-no-activity">

                        <div className="vm-no-activity-icon">
                            ◷
                        </div>

                        <h3>
                            No voting activity yet
                        </h3>

                        <p>
                            Submitted ballots will
                            appear here as voting
                            activity begins.
                        </p>

                    </div>
                )}

            </div>

            {/* =================================================
                LAST UPDATED
            ================================================= */}

            <div className="vm-last-updated">

                Last updated:

                {" "}

                {monitoringData?.updatedAt
                    ? formatTimestamp(
                        monitoringData.updatedAt
                    )
                    : "—"}

            </div>

        </div>
    );
};

export default VotingMonitoring;