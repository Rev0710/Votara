import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import api, { getEBToken } from "../../services/api";
import "./ResultsReports.css";
import ResultPositionCard from "./ResultPositionCard";

// =========================================================
// RESULTS & REPORTS
// =========================================================

let resultsSnapshot = null;

const ResultsReports = () => {


    const sessionToken = getEBToken();
    const snapshot = resultsSnapshot?.token === sessionToken &&
        Date.now() - resultsSnapshot.at < 30000 ? resultsSnapshot.data : null;
    const [loading, setLoading] = useState(!snapshot);
    const [refreshing, setRefreshing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [releasing, setReleasing] = useState(false);
    const [error, setError] = useState("");
    const [data, setData] = useState(snapshot);
    const [selectedElectionId, setSelectedElectionId] = useState(snapshot?.election?.id || "");
    const activeRequest = useRef(null);
    const currentData = useRef(snapshot);
    const tokenRef = useRef(sessionToken);

    const loadResults = useCallback(async (electionId = "", isRefresh = false, silent = false) => {
        if (silent && activeRequest.current) return;
        activeRequest.current?.abort();
        const controller = new AbortController();
        activeRequest.current = controller;
        const keepVisible = currentData.current &&
            (!electionId || String(currentData.current.election?.id) === String(electionId));
        setLoading(!keepVisible);
        if (!silent) setRefreshing(Boolean(keepVisible) || isRefresh);
        setError("");
        try {
            const query = electionId ? "?election_id=" + encodeURIComponent(electionId) : "";
            const response = await api.get("/electoral-board/results-reports" + query,
                {signal: controller.signal, timeout: 30000});
            if (!response.data?.success) throw new Error(response.data?.message || "Unable to load election results.");
            if (controller.signal.aborted) return;
            currentData.current = response.data;
            resultsSnapshot = {token: tokenRef.current, data: response.data, at: Date.now()};
            setData(response.data);
            setSelectedElectionId(response.data.election?.id || "");
        } catch (err) {
            if (controller.signal.aborted) return;
            setSelectedElectionId(currentData.current?.election?.id || "");
            setError(err?.code === "ECONNABORTED"
                ? "The results request took too long. Please try Refresh again."
                : err?.response?.data?.message || err?.message || "Unable to load election results.");
        } finally {
            if (activeRequest.current === controller) {
                activeRequest.current = null;
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        loadResults(currentData.current?.election?.id || "");
        const timer = window.setInterval(() => {
            if (document.visibilityState === "visible")
                loadResults(currentData.current?.election?.id || "", false, true);
        }, 30000);
        return () => {
            window.clearInterval(timer);
            activeRequest.current?.abort();
        };
    }, [loadResults]);

    const handleElectionChange = event => {
        setSelectedElectionId(event.target.value);
        loadResults(event.target.value);
    };


    const handleExportResults = async () => {
        if (!election?.id || exporting) return;
        setExporting(true);
        setError("");
        try {
            const response = await api.get("/electoral-board/results-reports/export",
                {params: {election_id: election.id}, responseType: "blob", timeout: 60000});
            if (!String(response.headers["content-type"] || "").includes("application/pdf"))
                throw new Error("The server did not return a PDF. Please redeploy the updated backend.");
            if (await response.data.slice(0,5).text() !== "%PDF-")
                throw new Error("The downloaded report is not a valid PDF. Please try again.");
            const url = URL.createObjectURL(response.data);
            const link = document.createElement("a");
            link.href = url;
            link.download = (election.title || "Election").replace(/[^a-z0-9_-]/gi, "_") + "_Results.pdf";
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            let message = err?.code === "ECONNABORTED"
                ? "PDF export took too long. Please try again." : err?.message || "Unable to export results.";
            if (err?.response?.data instanceof Blob) {
                try { message = JSON.parse(await err.response.data.text()).message || message; } catch {}
            }
            setError(message);
        } finally { setExporting(false); }
    };

    const handleReleaseResults = async () => {
        if (!election?.id) return;
        if (!window.confirm(`Release the official results for "${election.title}" to all student accounts?`)) return;

        try {
            setReleasing(true);
            setError("");
            const response = await api.post("/electoral-board/results-reports/release", {
                election_id: election.id,
            });
            if (!response?.data?.success) {
                throw new Error(response?.data?.message || "Unable to release results.");
            }
            await loadResults(election.id, true);
        } catch (err) {
            setError(err?.response?.data?.message || err?.message || "Unable to release results.");
        } finally {
            setReleasing(false);
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

                <div className="rr-loading" role="status" aria-live="polite">

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

                    <h1 >
                        Results & Reports
                    </h1>

                    <p>
                        Review election participation
                        and aggregate voting results.
                    </p>

                </div>

                <div className="rr-header-actions">

                    {election?.results_released ? (
                        <span className="rr-release-status">Results released</span>
                    ) : (
                        <button
                            type="button"
                            className="rr-release-button"
                            onClick={handleReleaseResults}
                            disabled={
                                releasing ||
                                !election?.id ||
                                data?.resultsReleaseSupported === false ||
                                !["closed", "completed", "finished"].includes(String(election?.status || "").toLowerCase())
                            }
                            title={
                                data?.resultsReleaseSupported === false
                                    ? "Apply the results-release database update first."
                                    : !election?.id
                                        ? "Select an election first."
                                        : !["closed", "completed", "finished"].includes(String(election?.status || "").toLowerCase())
                                            ? "Close the election before releasing results."
                                            : "Release the official results to students."
                            }
                        >
                            {releasing ? "Releasing..." : "Release Results"}
                        </button>
                    )}

                    {data?.resultsReleaseSupported === false && !election?.results_released && (
                        <span className="rr-release-note" role="status">
                            Apply the results-release database update to enable student release.
                        </span>
                    )}

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
                            : "Export as PDF"}

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

                        {positions.map(position => (
                            <ResultPositionCard key={position.id} position={position} />
                        ))}

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
