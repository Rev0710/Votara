import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import api from "../../services/api";
import "./ResultsReports.css";

// =========================================================
// RESULTS & REPORTS
// =========================================================

const ResultsReports = () => {

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [exporting, setExporting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [data, setData] =
        useState(null);

    const [selectedElectionId, setSelectedElectionId] =
        useState("");

    // =====================================================
    // LOAD RESULTS
    // =====================================================

    const loadResults = useCallback(
        async (
            electionId = "",
            isRefresh = false
        ) => {

            try {

                if (isRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const endpoint =
                    electionId
                        ? `/electoral-board/results-reports?election_id=${encodeURIComponent(
                            electionId
                        )}`
                        : "/electoral-board/results-reports";

                const response =
                    await api.get(endpoint);

                if (
                    !response?.data?.success
                ) {
                    throw new Error(
                        response?.data?.message ||
                        "Unable to load election results."
                    );
                }

                setData(
                    response.data
                );

                if (
                    !selectedElectionId &&
                    response.data?.election?.id
                ) {
                    setSelectedElectionId(
                        response.data.election.id
                    );
                }

            } catch (err) {

                console.error(
                    "Results & Reports error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load election results."
                );

            } finally {

                setLoading(false);
                setRefreshing(false);
            }
        },
        [selectedElectionId]
    );

    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {
        loadResults();
    }, []);

    // =====================================================
    // ELECTION CHANGE
    // =====================================================

    const handleElectionChange = (
        event
    ) => {

        const electionId =
            event.target.value;

        setSelectedElectionId(
            electionId
        );

        loadResults(
            electionId
        );
    };

    // =====================================================
    // EXPORT RESULTS
    // =====================================================

    const handleExportResults = async () => {

        if (!election?.id) {
            setError(
                "Please select an election before exporting results."
            );
            return;
        }

        try {

            setExporting(true);
            setError("");

            const endpoint =
                `/electoral-board/results-reports/export?election_id=${encodeURIComponent(
                    election.id
                )}`;

            const response =
                await api.get(
                    endpoint,
                    {
                        responseType: "blob"
                    }
                );

            const contentType =
                response?.headers?.["content-type"] ||
                "";

            if (
                contentType.includes(
                    "application/json"
                )
            ) {

                const text =
                    await response.data.text();

                let message =
                    "Unable to export election results.";

                try {
                    const parsed =
                        JSON.parse(text);

                    message =
                        parsed?.message ||
                        message;
                } catch {
                    // Use fallback message.
                }

                throw new Error(message);
            }

            const blob =
                new Blob(
                    [response.data],
                    {
                        type:
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }
                );

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement("a");

            link.href = url;

            const contentDisposition =
                response?.headers?.[
                    "content-disposition"
                ] || "";

            const filenameMatch =
                contentDisposition.match(
                    /filename="?([^"]+)"?/i
                );

            link.setAttribute(
                "download",
                filenameMatch?.[1] ||
                    "VOTARA_Results.xlsx"
            );

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);

        } catch (err) {

            console.error(
                "Results export error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Unable to export election results."
            );

        } finally {

            setExporting(false);
        }
    };

    // =====================================================
    // HELPERS
    // =====================================================

    const formatDate = (value) => {

        if (!value) {
            return "—";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
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
    };

    const formatTime = (value) => {

        if (!value) {
            return "—";
        }

        const parts =
            String(value).split(":");

        if (
            parts.length < 2
        ) {
            return String(value);
        }

        const date =
            new Date();

        date.setHours(
            Number(parts[0]),
            Number(parts[1]),
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
    };

    const getStatusClass = (
        status
    ) => {

        const normalized =
            String(
                status || ""
            ).toLowerCase();

        if (
            normalized === "closed"
        ) {
            return "rr-status rr-status-closed";
        }

        if (
            normalized === "active" ||
            normalized === "open"
        ) {
            return "rr-status rr-status-active";
        }

        if (
            normalized === "scheduled"
        ) {
            return "rr-status rr-status-scheduled";
        }

        if (
            normalized === "cancelled" ||
            normalized === "canceled"
        ) {
            return "rr-status rr-status-cancelled";
        }

        return "rr-status rr-status-draft";
    };

    const getResultClass = (
        resultStatus
    ) => {

        switch (
            resultStatus
        ) {

            case "winner":
                return "rr-result rr-result-winner";

            case "tie":
                return "rr-result rr-result-tie";

            default:
                return "rr-result rr-result-none";
        }
    };

    const getResultLabel = (
        resultStatus
    ) => {

        switch (
            resultStatus
        ) {

            case "winner":
                return "RESULT AVAILABLE";

            case "tie":
                return "TIE";

            default:
                return "NO VOTES";
        }
    };

    // =====================================================
    // SAFE DATA
    // =====================================================

    const election =
        data?.election || null;

    const elections =
        data?.elections || [];

    const statistics =
        data?.statistics || {};

    const positions =
        data?.positions || [];

    const eligibleYearLevels =
        data?.eligibleYearLevels || [];

    // =====================================================
    // POSITION TOTALS
    // =====================================================

    const totalCandidates =
        useMemo(() => {

            return positions.reduce(
                (
                    total,
                    position
                ) =>
                    total +
                    (
                        position.candidates?.length ||
                        0
                    ),
                0
            );

        }, [positions]);

    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (
            <div className="rr-page">

                <div className="rr-loading">

                    <div className="rr-spinner" />

                    <h3>
                        Loading Results & Reports
                    </h3>

                    <p>
                        Please wait while election
                        results are being prepared.
                    </p>

                </div>

            </div>
        );
    }

    // =====================================================
    // MAIN
    // =====================================================

    return (
        <div className="rr-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="rr-header">

                <div>

                    <div className="rr-eyebrow">
                        ELECTORAL BOARD
                    </div>

                    <h1>
                        Results & Reports
                    </h1>

                    <p>
                        Review election participation
                        and aggregate voting results.
                    </p>

                </div>

                <div className="rr-header-actions">

                    <button
                        type="button"
                        className="rr-export-button"
                        onClick={
                            handleExportResults
                        }
                        disabled={
                            exporting ||
                            !election?.id
                        }
                    >

                        <span>
                            {exporting
                                ? "↻"
                                : "⇩"}
                        </span>

                        {exporting
                            ? "Exporting..."
                            : "Export Excel"}

                    </button>

                    <button
                        type="button"
                        className="rr-refresh-button"
                        onClick={() =>
                            loadResults(
                                selectedElectionId,
                                true
                            )
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

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="rr-error">

                    <div className="rr-error-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            Unable to load results
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>
            )}

            {/* =================================================
                ELECTION SELECTOR
            ================================================= */}

            <div className="rr-selector-panel">

                <div>

                    <span className="rr-card-label">
                        ELECTION
                    </span>

                    <h2>
                        Select Election
                    </h2>

                    <p>
                        Choose an election to view
                        its aggregate results.
                    </p>

                </div>

                <select
                    value={
                        selectedElectionId ||
                        election?.id ||
                        ""
                    }
                    onChange={
                        handleElectionChange
                    }
                    disabled={
                        elections.length === 0
                    }
                >

                    {elections.length === 0 ? (

                        <option value="">
                            No elections available
                        </option>

                    ) : (

                        elections.map(
                            (item) => (

                                <option
                                    key={item.id}
                                    value={item.id}
                                >
                                    {item.title ||
                                        "Untitled Election"}
                                </option>

                            )
                        )

                    )}

                </select>

            </div>

            {/* =================================================
                ELECTION INFORMATION
            ================================================= */}

            {election ? (

                <div className="rr-election-card">

                    <div className="rr-election-main">

                        <div className="rr-election-icon">
                            ✓
                        </div>

                        <div>

                            <span className="rr-card-label">
                                SELECTED ELECTION
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

                    <div className="rr-election-meta">

                        <div>

                            <span>
                                Election Date
                            </span>

                            <strong>
                                {formatDate(
                                    election.election_date
                                )}
                            </strong>

                        </div>

                        <div>

                            <span>
                                Voting Period
                            </span>

                            <strong>
                                {formatTime(
                                    election.start_time
                                )}

                                {" – "}

                                {formatTime(
                                    election.end_time
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

                <div className="rr-empty">

                    <div className="rr-empty-icon">
                        !
                    </div>

                    <h2>
                        No Election Available
                    </h2>

                    <p>
                        Configure an election in
                        Election Management before
                        viewing results.
                    </p>

                </div>
            )}

            {/* =================================================
                SUMMARY STATISTICS
            ================================================= */}

            <div className="rr-stats-grid">

                <div className="rr-stat-card">

                    <div className="rr-stat-icon">
                        👥
                    </div>

                    <div>

                        <span>
                            Eligible Voters
                        </span>

                        <strong>
                            {
                                statistics.eligibleVoters ??
                                0
                            }
                        </strong>

                    </div>

                </div>

                <div className="rr-stat-card">

                    <div className="rr-stat-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            Voters Who Voted
                        </span>

                        <strong>
                            {
                                statistics.votersWhoVoted ??
                                0
                            }
                        </strong>

                    </div>

                </div>

                <div className="rr-stat-card">

                    <div className="rr-stat-icon">
                        %
                    </div>

                    <div>

                        <span>
                            Turnout
                        </span>

                        <strong>
                            {
                                statistics.turnoutPercentage ??
                                0
                            }%
                        </strong>

                    </div>

                </div>

                <div className="rr-stat-card">

                    <div className="rr-stat-icon">
                        ▣
                    </div>

                    <div>

                        <span>
                            Submitted Ballots
                        </span>

                        <strong>
                            {
                                statistics.submittedBallots ??
                                0
                            }
                        </strong>

                    </div>

                </div>

            </div>

            {/* =================================================
                RESULT SUMMARY
            ================================================= */}

            <div className="rr-summary-panel">

                <div>

                    <span className="rr-card-label">
                        RESULTS OVERVIEW
                    </span>

                    <h2>
                        Election Result Summary
                    </h2>

                </div>

                <div className="rr-summary-grid">

                    <div>
                        <span>
                            Positions
                        </span>

                        <strong>
                            {
                                statistics.totalPositions ??
                                positions.length
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Results Available
                        </span>

                        <strong>
                            {
                                statistics.positionsWithResults ??
                                0
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Tied Positions
                        </span>

                        <strong>
                            {
                                statistics.tiedPositions ??
                                0
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            No Votes
                        </span>

                        <strong>
                            {
                                statistics.positionsWithoutVotes ??
                                0
                            }
                        </strong>
                    </div>

                    <div>
                        <span>
                            Candidates
                        </span>

                        <strong>
                            {totalCandidates}
                        </strong>
                    </div>

                </div>

            </div>

            {/* =================================================
                YEAR LEVEL ELIGIBILITY
            ================================================= */}

            <div className="rr-panel">

                <div className="rr-panel-header">

                    <div>

                        <span className="rr-card-label">
                            ELIGIBILITY
                        </span>

                        <h2>
                            Participating Year Levels
                        </h2>

                    </div>

                </div>

                {eligibleYearLevels.length > 0 ? (

                    <div className="rr-year-levels">

                        {eligibleYearLevels
                            .filter(
                                (item) =>
                                    item?.year_level !==
                                    "1st Year"
                            )
                            .map(
                                (item) => (

                                    <div
                                        key={
                                            item.id ||
                                            item.year_level
                                        }
                                        className="rr-year-level"
                                    >

                                        <span>
                                            ✓
                                        </span>

                                        {
                                            item.year_level
                                        }

                                    </div>
                                )
                            )}

                    </div>

                ) : (

                    <p className="rr-muted">
                        2nd Year, 3rd Year, and
                        4th Year students are
                        eligible under the current
                        VOTARA voting rule.
                    </p>
                )}

            </div>

            {/* =================================================
                POSITION RESULTS
            ================================================= */}

            <div className="rr-results-section">

                <div className="rr-section-heading">

                    <div>

                        <span className="rr-card-label">
                            OFFICIAL RESULTS
                        </span>

                        <h2>
                            Results by Position
                        </h2>

                        <p>
                            Vote totals are aggregated
                            from submitted ballots.
                            Individual voter identities
                            and ballot selections are
                            not displayed.
                        </p>

                    </div>

                </div>

                {positions.length > 0 ? (

                    <div className="rr-position-list">

                        {positions.map(
                            (position) => (

                                <div
                                    key={
                                        position.id
                                    }
                                    className="rr-position-card"
                                >

                                    <div className="rr-position-header">

                                        <div>

                                            <span className="rr-position-number">
                                                Position{" "}
                                                {
                                                    position.displayOrder
                                                }
                                            </span>

                                            <h3>
                                                {
                                                    position.name
                                                }
                                            </h3>

                                            {position.description && (
                                                <p>
                                                    {
                                                        position.description
                                                    }
                                                </p>
                                            )}

                                        </div>

                                        <span
                                            className={
                                                getResultClass(
                                                    position.resultStatus
                                                )
                                            }
                                        >
                                            {
                                                getResultLabel(
                                                    position.resultStatus
                                                )
                                            }
                                        </span>

                                    </div>

                                    {position.candidates?.length >
                                    0 ? (

                                        <div className="rr-candidate-list">

                                            {position.candidates.map(
                                                (
                                                    candidate,
                                                    index
                                                ) => (

                                                    <div
                                                        key={
                                                            candidate.id
                                                        }
                                                        className={
                                                            `rr-candidate-row ${
                                                                index ===
                                                                    0 &&
                                                                position.resultStatus ===
                                                                    "winner"
                                                                    ? "rr-candidate-winner"
                                                                    : ""
                                                            }`
                                                        }
                                                    >

                                                        <div className="rr-candidate-rank">
                                                            {index +
                                                                1}
                                                        </div>

                                                        {candidate.profilePicture ? (

                                                            <img
                                                                src={
                                                                    candidate.profilePicture
                                                                }
                                                                alt=""
                                                                className="rr-candidate-photo"
                                                            />

                                                        ) : (

                                                            <div className="rr-candidate-photo rr-candidate-placeholder">
                                                                👤
                                                            </div>

                                                        )}

                                                        <div className="rr-candidate-info">

                                                            <strong>
                                                                {
                                                                    candidate.fullName
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    candidate.partyListName ||
                                                                    "Independent"
                                                                }
                                                            </span>

                                                        </div>

                                                        <div className="rr-vote-count">

                                                            <strong>
                                                                {
                                                                    candidate.voteCount ??
                                                                    0
                                                                }
                                                            </strong>

                                                            <span>
                                                                {
                                                                    (
                                                                        candidate.voteCount ??
                                                                        0
                                                                    ) ===
                                                                    1
                                                                        ? "vote"
                                                                        : "votes"
                                                                }
                                                            </span>

                                                        </div>

                                                    </div>

                                                )
                                            )}

                                        </div>

                                    ) : (

                                        <div className="rr-no-candidates">

                                            No active candidates
                                            are configured for
                                            this position.

                                        </div>
                                    )}

                                    {position.resultStatus ===
                                        "winner" &&
                                        position.winner && (

                                            <div className="rr-winner-banner">

                                                <span>
                                                    ✓
                                                </span>

                                                <div>

                                                    <strong>
                                                        Result
                                                        available
                                                    </strong>

                                                    <p>
                                                        {
                                                            position.winner.fullName
                                                        }{" "}
                                                        has the
                                                        highest
                                                        recorded
                                                        vote count
                                                        for this
                                                        position.
                                                    </p>

                                                </div>

                                            </div>
                                        )}

                                    {position.resultStatus ===
                                        "tie" && (

                                            <div className="rr-tie-banner">

                                                <span>
                                                    !
                                                </span>

                                                <div>

                                                    <strong>
                                                        Tie
                                                        recorded
                                                    </strong>

                                                    <p>
                                                        Two or more
                                                        candidates
                                                        have the same
                                                        highest vote
                                                        count. No
                                                        candidate is
                                                        automatically
                                                        selected as
                                                        the winner.
                                                    </p>

                                                </div>

                                            </div>
                                        )}

                                    {position.resultStatus ===
                                        "no_votes" && (

                                            <div className="rr-no-votes-banner">

                                                <span>
                                                    ◷
                                                </span>

                                                <div>

                                                    <strong>
                                                        No votes
                                                        recorded
                                                    </strong>

                                                    <p>
                                                        No submitted
                                                        ballot votes
                                                        are currently
                                                        recorded for
                                                        this position.
                                                    </p>

                                                </div>

                                            </div>
                                        )}

                                </div>

                            )
                        )}

                    </div>

                ) : (

                    <div className="rr-empty-results">

                        <div className="rr-empty-results-icon">
                            ▣
                        </div>

                        <h3>
                            No positions configured
                        </h3>

                        <p>
                            Add active election positions
                            through Election Management
                            before viewing results.
                        </p>

                    </div>
                )}

            </div>

            {/* =================================================
                PRIVACY NOTICE
            ================================================= */}

            <div className="rr-privacy-notice">

                <div className="rr-privacy-icon">
                    🔒
                </div>

                <div>

                    <strong>
                        Ballot secrecy protected
                    </strong>

                    <p>
                        Results & Reports displays
                        aggregate vote totals only.
                        Student identities and individual
                        ballot choices are not displayed
                        to the Electoral Board.
                    </p>

                </div>

            </div>

            {/* =================================================
                GENERATED
            ================================================= */}

            <div className="rr-generated">

                Report generated:

                {" "}

                {data?.generatedAt
                    ? new Date(
                        data.generatedAt
                    ).toLocaleString(
                        "en-US",
                        {
                            dateStyle: "medium",
                            timeStyle: "short"
                        }
                    )
                    : "—"}

            </div>

        </div>
    );
};

export default ResultsReports;