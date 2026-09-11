import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiAward,
    FiBarChart2,
    FiCalendar,
    FiCheckCircle,
    FiDownload,
    FiFilter,
    FiPrinter,
    FiRefreshCw,
    FiSearch,
    FiShield,
    FiTrendingUp,
    FiUsers,
    FiClock,
} from "react-icons/fi";
import "./ElectionResults.css";

const ElectionResults = () => {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPosition, setSelectedPosition] =
        useState("All Positions");

    const [electionStatus] = useState("Completed");

    const [electionStats, setElectionStats] = useState({
        registered: 1250,
        votesCast: 1038,
        spoiledVotes: 12,
        positions: 8,
    });

    const [results] = useState([
        {
            position: "President",
            status: "Verified",
            candidates: [
                {
                    name: "Candidate A",
                    party: "Independent",
                    votes: 342,
                },
                {
                    name: "Candidate B",
                    party: "Student Alliance",
                    votes: 298,
                },
                {
                    name: "Candidate C",
                    party: "Progressive Students",
                    votes: 201,
                },
            ],
        },
        {
            position: "Vice President",
            status: "Verified",
            candidates: [
                {
                    name: "Candidate D",
                    party: "Student Alliance",
                    votes: 386,
                },
                {
                    name: "Candidate E",
                    party: "Independent",
                    votes: 311,
                },
                {
                    name: "Candidate F",
                    party: "Progressive Students",
                    votes: 144,
                },
            ],
        },
        {
            position: "Secretary",
            status: "Verified",
            candidates: [
                {
                    name: "Candidate G",
                    party: "Independent",
                    votes: 421,
                },
                {
                    name: "Candidate H",
                    party: "Student Alliance",
                    votes: 287,
                },
                {
                    name: "Candidate I",
                    party: "Progressive Students",
                    votes: 133,
                },
            ],
        },
        {
            position: "Treasurer",
            status: "Verified",
            candidates: [
                {
                    name: "Candidate J",
                    party: "Student Alliance",
                    votes: 354,
                },
                {
                    name: "Candidate K",
                    party: "Independent",
                    votes: 329,
                },
                {
                    name: "Candidate L",
                    party: "Progressive Students",
                    votes: 156,
                },
            ],
        },
        {
            position: "Auditor",
            status: "Pending Review",
            candidates: [
                {
                    name: "Candidate M",
                    party: "Independent",
                    votes: 301,
                },
                {
                    name: "Candidate N",
                    party: "Student Alliance",
                    votes: 277,
                },
                {
                    name: "Candidate O",
                    party: "Progressive Students",
                    votes: 189,
                },
            ],
        },
        {
            position: "Public Information Officer",
            status: "Verified",
            candidates: [
                {
                    name: "Candidate P",
                    party: "Student Alliance",
                    votes: 365,
                },
                {
                    name: "Candidate Q",
                    party: "Independent",
                    votes: 298,
                },
                {
                    name: "Candidate R",
                    party: "Progressive Students",
                    votes: 156,
                },
            ],
        },
    ]);

    const [recentActivities] = useState([
        {
            action: "Election results verified",
            user: "Electoral Board",
            time: "Today, 4:10 PM",
            type: "verified",
        },
        {
            action: "Vote count completed",
            user: "Electoral Board",
            time: "Today, 3:45 PM",
            type: "verified",
        },
        {
            action: "Election closed",
            user: "Administrator",
            time: "Today, 3:30 PM",
            type: "closed",
        },
        {
            action: "Final results generated",
            user: "Administrator",
            time: "Today, 3:25 PM",
            type: "generated",
        },
    ]);

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
                navigate("/results/dashboard", {
                    replace: true,
                });
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

    const turnout = useMemo(() => {
        if (!electionStats.registered) return 0;

        return Math.round(
            (electionStats.votesCast / electionStats.registered) * 100
        );
    }, [electionStats]);

    const totalPositions = results.length;

    const verifiedPositions = results.filter(
        (result) => result.status === "Verified"
    ).length;

    const pendingPositions = results.filter(
        (result) => result.status !== "Verified"
    ).length;

    const filteredResults = useMemo(() => {
        return results
            .filter((result) => {
                if (selectedPosition === "All Positions") {
                    return true;
                }

                return result.position === selectedPosition;
            })
            .map((result) => {
                const filteredCandidates = result.candidates.filter(
                    (candidate) =>
                        candidate.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                        candidate.party
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                );

                return {
                    ...result,
                    candidates: filteredCandidates,
                };
            })
            .filter((result) => result.candidates.length > 0);
    }, [results, selectedPosition, searchTerm]);

    const getWinner = (candidates) => {
        if (!candidates.length) return null;

        return [...candidates].sort(
            (a, b) => b.votes - a.votes
        )[0];
    };

    const getTotalVotes = (candidates) => {
        return candidates.reduce(
            (total, candidate) => total + candidate.votes,
            0
        );
    };

    const handleRefresh = () => {
        setElectionStats((current) => ({
            ...current,
        }));
    };

    const handleExport = () => {
        const rows = [
            ["VOTARA Election Results"],
            [],
            ["Election", "Student Council Election 2026"],
            ["Status", electionStatus],
            ["Registered Students", electionStats.registered],
            ["Votes Cast", electionStats.votesCast],
            ["Turnout", `${turnout}%`],
            [],
            ["Position", "Candidate", "Party", "Votes", "Percentage", "Status"],
        ];

        results.forEach((result) => {
            const totalVotes = getTotalVotes(result.candidates);

            result.candidates.forEach((candidate) => {
                const percentage =
                    totalVotes > 0
                        ? Math.round(
                              (candidate.votes / totalVotes) * 100
                          )
                        : 0;

                rows.push([
                    result.position,
                    candidate.name,
                    candidate.party,
                    candidate.votes,
                    `${percentage}%`,
                    result.status,
                ]);
            });
        });

        const csvContent = rows
            .map((row) =>
                row
                    .map((cell) =>
                        `"${String(cell).replace(/"/g, '""')}"`
                    )
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "VOTARA-Election-Results.csv";
        link.click();

        URL.revokeObjectURL(url);
    };

    const handlePrint = () => {
        window.print();
    };

    if (!admin) {
        return null;
    }

    return (
        <div className="election-results-page">

            {/* =====================================================
                HEADER
            ===================================================== */}

            <header className="election-results-header">

                <div className="election-results-header-left">

                    <button
                        className="results-back-button"
                        onClick={() =>
                            navigate("/admin-dashboard")
                        }
                    >
                        <FiArrowLeft />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="results-title-wrapper">

                        <div className="results-title-icon">
                            <FiBarChart2 />
                        </div>

                        <div>
                            <h1>Election Results</h1>

                            <p>
                                View and review the official election
                                results.
                            </p>
                        </div>

                    </div>

                </div>

                <div className="results-header-actions">

                    <button
                        className="results-secondary-button"
                        onClick={handleRefresh}
                    >
                        <FiRefreshCw />
                        Refresh
                    </button>

                    <button
                        className="results-secondary-button"
                        onClick={handlePrint}
                    >
                        <FiPrinter />
                        Print
                    </button>

                    <button
                        className="results-primary-button"
                        onClick={handleExport}
                    >
                        <FiDownload />
                        Export Results
                    </button>

                </div>

            </header>


            {/* =====================================================
                MAIN
            ===================================================== */}

            <main className="election-results-content">

                {/* =================================================
                    ELECTION OVERVIEW
                ================================================= */}

                <section className="election-overview">

                    <div className="election-overview-main">

                        <div className="election-status-badge">
                            <span></span>
                            {electionStatus}
                        </div>

                        <h2>
                            Student Council Election 2026
                        </h2>

                        <p>
                            Official election results and voting
                            statistics.
                        </p>

                        <div className="election-meta">

                            <div>
                                <FiCalendar />
                                <span>September 12, 2026</span>
                            </div>

                            <div>
                                <FiClock />
                                <span>8:00 AM – 3:30 PM</span>
                            </div>

                        </div>

                    </div>

                    <div className="election-verification">

                        <div className="verification-icon">
                            <FiShield />
                        </div>

                        <div>
                            <strong>
                                {verifiedPositions} of{" "}
                                {totalPositions} positions verified
                            </strong>

                            <span>
                                {pendingPositions > 0
                                    ? `${pendingPositions} position requires review`
                                    : "All election results verified"}
                            </span>
                        </div>

                    </div>

                </section>


                {/* =================================================
                    STATISTICS
                ================================================= */}

                <section className="results-stat-grid">

                    <div className="results-stat-card">

                        <div className="results-stat-icon">
                            <FiUsers />
                        </div>

                        <div>
                            <span>Registered Voters</span>
                            <strong>
                                {electionStats.registered.toLocaleString()}
                            </strong>
                            <small>
                                Eligible students
                            </small>
                        </div>

                    </div>


                    <div className="results-stat-card">

                        <div className="results-stat-icon">
                            <FiCheckCircle />
                        </div>

                        <div>
                            <span>Votes Cast</span>
                            <strong>
                                {electionStats.votesCast.toLocaleString()}
                            </strong>
                            <small>
                                Valid votes recorded
                            </small>
                        </div>

                    </div>


                    <div className="results-stat-card">

                        <div className="results-stat-icon">
                            <FiTrendingUp />
                        </div>

                        <div>
                            <span>Voter Turnout</span>
                            <strong>
                                {turnout}%
                            </strong>
                            <small>
                                Overall participation
                            </small>
                        </div>

                    </div>


                    <div className="results-stat-card">

                        <div className="results-stat-icon">
                            <FiAward />
                        </div>

                        <div>
                            <span>Positions</span>
                            <strong>
                                {totalPositions}
                            </strong>
                            <small>
                                Election positions
                            </small>
                        </div>

                    </div>

                </section>


                {/* =================================================
                    RESULT CONTROLS
                ================================================= */}

                <section className="results-controls">

                    <div className="results-search">

                        <FiSearch />

                        <input
                            type="text"
                            placeholder="Search candidate or party..."
                            value={searchTerm}
                            onChange={(e) =>
                                setSearchTerm(e.target.value)
                            }
                        />

                    </div>


                    <div className="results-position-filter">

                        <FiFilter />

                        <select
                            value={selectedPosition}
                            onChange={(e) =>
                                setSelectedPosition(e.target.value)
                            }
                        >
                            <option>
                                All Positions
                            </option>

                            {results.map((result) => (
                                <option
                                    key={result.position}
                                    value={result.position}
                                >
                                    {result.position}
                                </option>
                            ))}
                        </select>

                    </div>

                </section>


                {/* =================================================
                    RESULTS
                ================================================= */}

                <section className="results-section">

                    <div className="results-section-heading">

                        <div>
                            <h2>Official Results</h2>

                            <p>
                                Candidate rankings and vote counts
                                for each position.
                            </p>
                        </div>

                        <div className="results-verified-label">
                            <FiCheckCircle />
                            Verified results
                        </div>

                    </div>


                    <div className="position-results-list">

                        {filteredResults.length === 0 ? (

                            <div className="no-results">
                                <FiSearch />

                                <h3>
                                    No results found
                                </h3>

                                <p>
                                    Try searching for another
                                    candidate or position.
                                </p>
                            </div>

                        ) : (

                            filteredResults.map((result) => {

                                const winner = getWinner(
                                    result.candidates
                                );

                                const totalVotes =
                                    getTotalVotes(
                                        result.candidates
                                    );

                                return (
                                    <article
                                        className="position-result"
                                        key={result.position}
                                    >

                                        {/* POSITION HEADER */}

                                        <div className="position-result-top">

                                            <div className="position-heading">

                                                <div className="position-award-icon">
                                                    <FiAward />
                                                </div>

                                                <div>
                                                    <h3>
                                                        {result.position}
                                                    </h3>

                                                    <span>
                                                        {totalVotes.toLocaleString()}{" "}
                                                        total votes
                                                    </span>
                                                </div>

                                            </div>


                                            <div
                                                className={
                                                    result.status ===
                                                    "Verified"
                                                        ? "result-status verified"
                                                        : "result-status pending"
                                                }
                                            >
                                                {result.status ===
                                                "Verified" ? (
                                                    <FiCheckCircle />
                                                ) : (
                                                    <FiClock />
                                                )}

                                                {result.status}
                                            </div>

                                        </div>


                                        {/* WINNER */}

                                        {winner && (
                                            <div className="winner-banner">

                                                <div className="winner-icon">
                                                    <FiAward />
                                                </div>

                                                <div className="winner-info">

                                                    <span>
                                                        Leading Candidate
                                                    </span>

                                                    <strong>
                                                        {winner.name}
                                                    </strong>

                                                    <small>
                                                        {winner.party}
                                                    </small>

                                                </div>

                                                <div className="winner-votes">
                                                    <strong>
                                                        {winner.votes.toLocaleString()}
                                                    </strong>

                                                    <span>
                                                        votes
                                                    </span>
                                                </div>

                                            </div>
                                        )}


                                        {/* CANDIDATES */}

                                        <div className="candidate-table">

                                            <div className="candidate-table-header">

                                                <span>
                                                    Rank
                                                </span>

                                                <span>
                                                    Candidate
                                                </span>

                                                <span>
                                                    Party
                                                </span>

                                                <span>
                                                    Votes
                                                </span>

                                                <span>
                                                    Percentage
                                                </span>

                                            </div>


                                            {result.candidates
                                                .sort(
                                                    (a, b) =>
                                                        b.votes -
                                                        a.votes
                                                )
                                                .map(
                                                    (
                                                        candidate,
                                                        index
                                                    ) => {

                                                        const percentage =
                                                            totalVotes >
                                                            0
                                                                ? Math.round(
                                                                      (candidate.votes /
                                                                          totalVotes) *
                                                                          100
                                                                  )
                                                                : 0;

                                                        const isWinner =
                                                            winner?.name ===
                                                            candidate.name;

                                                        return (
                                                            <div
                                                                className={
                                                                    isWinner
                                                                        ? "candidate-row winner-row"
                                                                        : "candidate-row"
                                                                }
                                                                key={
                                                                    candidate.name
                                                                }
                                                            >

                                                                <div className="candidate-rank">
                                                                    {isWinner ? (
                                                                        <FiAward />
                                                                    ) : (
                                                                        index +
                                                                        1
                                                                    )}
                                                                </div>


                                                                <div className="candidate-name">

                                                                    <strong>
                                                                        {
                                                                            candidate.name
                                                                        }
                                                                    </strong>

                                                                    {isWinner && (
                                                                        <span>
                                                                            Winner
                                                                        </span>
                                                                    )}

                                                                </div>


                                                                <div className="candidate-party">
                                                                    {
                                                                        candidate.party
                                                                    }
                                                                </div>


                                                                <div className="candidate-votes">
                                                                    {
                                                                        candidate.votes.toLocaleString()
                                                                    }
                                                                </div>


                                                                <div className="candidate-percentage">

                                                                    <div className="percentage-wrapper">

                                                                        <div className="percentage-bar">

                                                                            <div
                                                                                className="percentage-fill"
                                                                                style={{
                                                                                    width: `${percentage}%`,
                                                                                }}
                                                                            ></div>

                                                                        </div>

                                                                        <strong>
                                                                            {
                                                                                percentage
                                                                            }
                                                                            %
                                                                        </strong>

                                                                    </div>

                                                                </div>

                                                            </div>
                                                        );
                                                    }
                                                )}

                                        </div>

                                    </article>
                                );
                            })
                        )}

                    </div>

                </section>


                {/* =================================================
                    SUMMARY
                ================================================= */}

                <section className="results-summary-grid">

                    <div className="results-summary-card">

                        <div className="summary-icon">
                            <FiCheckCircle />
                        </div>

                        <div>
                            <span>Valid Votes</span>

                            <strong>
                                {(
                                    electionStats.votesCast -
                                    electionStats.spoiledVotes
                                ).toLocaleString()}
                            </strong>

                            <small>
                                Successfully counted
                            </small>
                        </div>

                    </div>


                    <div className="results-summary-card">

                        <div className="summary-icon">
                            <FiFilter />
                        </div>

                        <div>
                            <span>Spoiled Votes</span>

                            <strong>
                                {electionStats.spoiledVotes}
                            </strong>

                            <small>
                                Excluded from results
                            </small>
                        </div>

                    </div>


                    <div className="results-summary-card">

                        <div className="summary-icon">
                            <FiShield />
                        </div>

                        <div>
                            <span>Verification</span>

                            <strong>
                                {Math.round(
                                    (verifiedPositions /
                                        totalPositions) *
                                        100
                                )}
                                %
                            </strong>

                            <small>
                                Positions verified
                            </small>
                        </div>

                    </div>

                </section>


                {/* =================================================
                    ACTIVITY
                ================================================= */}

                <section className="recent-results-activity">

                    <div className="results-section-heading">

                        <div>
                            <h2>Result Activity</h2>

                            <p>
                                Recent actions related to the election
                                results.
                            </p>
                        </div>

                    </div>


                    <div className="result-activity-list">

                        {recentActivities.map(
                            (activity, index) => (
                                <div
                                    className="result-activity-item"
                                    key={`${activity.action}-${index}`}
                                >

                                    <div className="result-activity-icon">
                                        {activity.type ===
                                        "verified" ? (
                                            <FiCheckCircle />
                                        ) : activity.type ===
                                          "closed" ? (
                                            <FiClock />
                                        ) : (
                                            <FiBarChart2 />
                                        )}
                                    </div>

                                    <div className="result-activity-info">

                                        <strong>
                                            {activity.action}
                                        </strong>

                                        <span>
                                            {activity.user} •{" "}
                                            {activity.time}
                                        </span>

                                    </div>

                                    <span className="activity-status">
                                        Completed
                                    </span>

                                </div>
                            )
                        )}

                    </div>

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="results-footer">

                    <div className="results-footer-icon">
                        <FiShield />
                    </div>

                    <div>

                        <strong>
                            Official Election Results
                        </strong>

                        <p>
                            Results shown on this page represent the
                            recorded election data. Only authorized
                            administrators can access and manage
                            election results.
                        </p>

                    </div>

                    <div className="results-generated">

                        <span>
                            Generated by
                        </span>

                        <strong>
                            {admin.name || "Administrator"}
                        </strong>

                    </div>

                </div>

            </main>
        </div>
    );
};

export default ElectionResults;