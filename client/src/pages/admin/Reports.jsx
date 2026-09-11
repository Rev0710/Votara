import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiBarChart2,
    FiCalendar,
    FiCheckCircle,
    FiDownload,
    FiPrinter,
    FiRefreshCw,
    FiTrendingUp,
    FiUsers,
    FiUserCheck,
    FiAward,
} from "react-icons/fi";
import "./Reports.css";

const Reports = () => {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState("This Election");
    const [selectedPosition, setSelectedPosition] = useState("All Positions");

    const [reportData, setReportData] = useState({
        registeredStudents: 1250,
        votesCast: 1038,
        candidates: 24,
        positions: 8,
    });

    const [activityData] = useState([
        { time: "8:00 AM", votes: 82 },
        { time: "9:00 AM", votes: 126 },
        { time: "10:00 AM", votes: 174 },
        { time: "11:00 AM", votes: 218 },
        { time: "12:00 PM", votes: 145 },
        { time: "1:00 PM", votes: 112 },
        { time: "2:00 PM", votes: 96 },
        { time: "3:00 PM", votes: 85 },
    ]);

    const [positionData] = useState([
        {
            position: "President",
            candidates: [
                { name: "Candidate A", votes: 342 },
                { name: "Candidate B", votes: 298 },
                { name: "Candidate C", votes: 201 },
            ],
        },
        {
            position: "Vice President",
            candidates: [
                { name: "Candidate D", votes: 386 },
                { name: "Candidate E", votes: 311 },
                { name: "Candidate F", votes: 144 },
            ],
        },
        {
            position: "Secretary",
            candidates: [
                { name: "Candidate G", votes: 421 },
                { name: "Candidate H", votes: 287 },
                { name: "Candidate I", votes: 133 },
            ],
        },
        {
            position: "Treasurer",
            candidates: [
                { name: "Candidate J", votes: 354 },
                { name: "Candidate K", votes: 329 },
                { name: "Candidate L", votes: 156 },
            ],
        },
    ]);

    const [departmentData] = useState([
        { department: "BSIT", voters: 312, total: 350 },
        { department: "BSCS", voters: 241, total: 280 },
        { department: "BSBA", voters: 198, total: 240 },
        { department: "BSED", voters: 164, total: 210 },
        { department: "BEED", voters: 123, total: 170 },
    ]);

    const [recentActivities] = useState([
        {
            action: "Election report generated",
            user: "Admin",
            time: "Today, 3:42 PM",
            status: "Completed",
        },
        {
            action: "Election results updated",
            user: "Electoral Board",
            time: "Today, 2:18 PM",
            status: "Completed",
        },
        {
            action: "Candidate results verified",
            user: "Electoral Board",
            time: "Today, 1:45 PM",
            status: "Completed",
        },
        {
            action: "Voting statistics refreshed",
            user: "Admin",
            time: "Today, 12:30 PM",
            status: "Completed",
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
                navigate("/reports/dashboard", { replace: true });
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
        if (!reportData.registeredStudents) return 0;

        return Math.round(
            (reportData.votesCast / reportData.registeredStudents) * 100
        );
    }, [reportData]);

    const highestActivity = useMemo(() => {
        return Math.max(...activityData.map((item) => item.votes));
    }, [activityData]);

    const filteredPositions = useMemo(() => {
        if (selectedPosition === "All Positions") {
            return positionData;
        }

        return positionData.filter(
            (item) => item.position === selectedPosition
        );
    }, [selectedPosition, positionData]);

    const handleRefresh = () => {
        setReportData((current) => ({
            ...current,
        }));
    };

    const handleExport = () => {
        const rows = [
            ["VOTARA Election Report"],
            [],
            ["Election Period", selectedPeriod],
            ["Generated By", admin?.name || "Admin"],
            [],
            ["Election Overview"],
            ["Registered Students", reportData.registeredStudents],
            ["Votes Cast", reportData.votesCast],
            ["Voter Turnout", `${turnout}%`],
            ["Candidates", reportData.candidates],
            ["Positions", reportData.positions],
            [],
            ["Candidate Results"],
            ["Position", "Candidate", "Votes"],
        ];

        positionData.forEach((position) => {
            position.candidates.forEach((candidate) => {
                rows.push([
                    position.position,
                    candidate.name,
                    candidate.votes,
                ]);
            });
        });

        const csvContent = rows
            .map((row) =>
                row
                    .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "VOTARA-Election-Report.csv";
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
        <div className="reports-page">

            {/* HEADER */}
            <header className="reports-header">
                <div className="reports-header-left">
                    <button
                        className="reports-back-button"
                        onClick={() => navigate("/admin-dashboard")}
                    >
                        <FiArrowLeft />
                        <span>Back to Dashboard</span>
                    </button>

                    <div className="reports-title-section">
                        <div className="reports-title-icon">
                            <FiBarChart2 />
                        </div>

                        <div>
                            <h1>Reports</h1>
                            <p>
                                View election statistics, voter turnout, and
                                election results.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="reports-header-actions">
                    <button
                        className="reports-secondary-button"
                        onClick={handleRefresh}
                    >
                        <FiRefreshCw />
                        Refresh
                    </button>

                    <button
                        className="reports-secondary-button"
                        onClick={handlePrint}
                    >
                        <FiPrinter />
                        Print
                    </button>

                    <button
                        className="reports-primary-button"
                        onClick={handleExport}
                    >
                        <FiDownload />
                        Export Report
                    </button>
                </div>
            </header>

            <main className="reports-content">

                {/* FILTER BAR */}
                <section className="reports-filter-bar">
                    <div className="reports-filter-group">
                        <label>Report Period</label>

                        <div className="reports-select-wrapper">
                            <FiCalendar />

                            <select
                                value={selectedPeriod}
                                onChange={(e) =>
                                    setSelectedPeriod(e.target.value)
                                }
                            >
                                <option>This Election</option>
                                <option>Today</option>
                                <option>This Week</option>
                                <option>This Month</option>
                                <option>All Time</option>
                            </select>
                        </div>
                    </div>

                    <div className="reports-filter-group">
                        <label>Position</label>

                        <div className="reports-select-wrapper">
                            <FiAward />

                            <select
                                value={selectedPosition}
                                onChange={(e) =>
                                    setSelectedPosition(e.target.value)
                                }
                            >
                                <option>All Positions</option>
                                {positionData.map((item) => (
                                    <option
                                        key={item.position}
                                        value={item.position}
                                    >
                                        {item.position}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="reports-filter-info">
                        <span>Current Election</span>
                        <strong>Student Council Election 2026</strong>
                    </div>
                </section>

                {/* STATISTICS */}
                <section className="reports-stat-grid">

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <FiUsers />
                        </div>

                        <div className="report-stat-content">
                            <span>Registered Students</span>
                            <strong>
                                {reportData.registeredStudents.toLocaleString()}
                            </strong>
                            <small>Eligible voters</small>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <FiCheckCircle />
                        </div>

                        <div className="report-stat-content">
                            <span>Total Votes Cast</span>
                            <strong>
                                {reportData.votesCast.toLocaleString()}
                            </strong>
                            <small>Votes recorded</small>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <FiTrendingUp />
                        </div>

                        <div className="report-stat-content">
                            <span>Voter Turnout</span>
                            <strong>{turnout}%</strong>
                            <small>
                                {turnout >= 75
                                    ? "Excellent participation"
                                    : "Participation rate"}
                            </small>
                        </div>
                    </div>

                    <div className="report-stat-card">
                        <div className="report-stat-icon">
                            <FiUserCheck />
                        </div>

                        <div className="report-stat-content">
                            <span>Candidates</span>
                            <strong>{reportData.candidates}</strong>
                            <small>
                                Across {reportData.positions} positions
                            </small>
                        </div>
                    </div>

                </section>

                {/* MAIN REPORT GRID */}
                <section className="reports-main-grid">

                    {/* VOTING ACTIVITY */}
                    <div className="reports-card voting-activity-card">
                        <div className="reports-card-header">
                            <div>
                                <h2>Voting Activity</h2>
                                <p>
                                    Number of votes recorded throughout the
                                    election day.
                                </p>
                            </div>

                            <div className="reports-card-badge">
                                <FiTrendingUp />
                                Live Statistics
                            </div>
                        </div>

                        <div className="activity-chart">

                            <div className="chart-y-axis">
                                <span>250</span>
                                <span>200</span>
                                <span>150</span>
                                <span>100</span>
                                <span>50</span>
                                <span>0</span>
                            </div>

                            <div className="chart-area">
                                <div className="chart-grid-lines">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>

                                <div className="chart-bars">
                                    {activityData.map((item) => {
                                        const height =
                                            (item.votes / highestActivity) *
                                            100;

                                        return (
                                            <div
                                                className="chart-column"
                                                key={item.time}
                                            >
                                                <div className="chart-value">
                                                    {item.votes}
                                                </div>

                                                <div
                                                    className="chart-bar"
                                                    style={{
                                                        height: `${height}%`,
                                                    }}
                                                ></div>

                                                <span>{item.time}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TURNOUT */}
                    <div className="reports-card turnout-card">
                        <div className="reports-card-header">
                            <div>
                                <h2>Voter Turnout</h2>
                                <p>Overall participation rate</p>
                            </div>
                        </div>

                        <div className="turnout-circle-container">
                            <div
                                className="turnout-circle"
                                style={{
                                    background: `conic-gradient(
                                        #32129f ${turnout * 3.6}deg,
                                        #ececf3 ${turnout * 3.6}deg
                                    )`,
                                }}
                            >
                                <div className="turnout-circle-inner">
                                    <strong>{turnout}%</strong>
                                    <span>Turnout</span>
                                </div>
                            </div>
                        </div>

                        <div className="turnout-details">
                            <div>
                                <span className="turnout-dot registered"></span>
                                <p>Registered</p>
                                <strong>
                                    {reportData.registeredStudents.toLocaleString()}
                                </strong>
                            </div>

                            <div>
                                <span className="turnout-dot voted"></span>
                                <p>Voted</p>
                                <strong>
                                    {reportData.votesCast.toLocaleString()}
                                </strong>
                            </div>

                            <div>
                                <span className="turnout-dot remaining"></span>
                                <p>Did Not Vote</p>
                                <strong>
                                    {(
                                        reportData.registeredStudents -
                                        reportData.votesCast
                                    ).toLocaleString()}
                                </strong>
                            </div>
                        </div>
                    </div>

                </section>

                {/* RESULTS */}
                <section className="reports-card results-card">

                    <div className="reports-card-header">
                        <div>
                            <h2>Election Results</h2>
                            <p>
                                Candidate vote totals based on the selected
                                position.
                            </p>
                        </div>

                        <div className="results-total">
                            {filteredPositions.length} Position
                            {filteredPositions.length !== 1 ? "s" : ""}
                        </div>
                    </div>

                    <div className="results-grid">

                        {filteredPositions.map((position) => {
                            const totalVotes = position.candidates.reduce(
                                (sum, candidate) => sum + candidate.votes,
                                0
                            );

                            return (
                                <div
                                    className="position-result-card"
                                    key={position.position}
                                >
                                    <div className="position-result-header">
                                        <div className="position-icon">
                                            <FiAward />
                                        </div>

                                        <div>
                                            <h3>{position.position}</h3>
                                            <span>
                                                {totalVotes.toLocaleString()}{" "}
                                                total votes
                                            </span>
                                        </div>
                                    </div>

                                    <div className="candidate-results">
                                        {position.candidates.map(
                                            (candidate, index) => {
                                                const percentage =
                                                    totalVotes > 0
                                                        ? Math.round(
                                                              (candidate.votes /
                                                                  totalVotes) *
                                                                  100
                                                          )
                                                        : 0;

                                                return (
                                                    <div
                                                        className="candidate-result"
                                                        key={candidate.name}
                                                    >
                                                        <div className="candidate-result-info">
                                                            <div>
                                                                <span className="candidate-rank">
                                                                    {index + 1}
                                                                </span>

                                                                <strong>
                                                                    {
                                                                        candidate.name
                                                                    }
                                                                </strong>
                                                            </div>

                                                            <span>
                                                                {candidate.votes.toLocaleString()}{" "}
                                                                votes
                                                            </span>
                                                        </div>

                                                        <div className="result-progress">
                                                            <div
                                                                className="result-progress-fill"
                                                                style={{
                                                                    width: `${percentage}%`,
                                                                }}
                                                            ></div>
                                                        </div>

                                                        <small>
                                                            {percentage}%
                                                        </small>
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                </section>

                {/* DEPARTMENT + ACTIVITY */}
                <section className="reports-bottom-grid">

                    {/* DEPARTMENT */}
                    <div className="reports-card department-card">

                        <div className="reports-card-header">
                            <div>
                                <h2>Turnout by Department</h2>
                                <p>
                                    Participation rate across departments.
                                </p>
                            </div>
                        </div>

                        <div className="department-list">
                            {departmentData.map((item) => {
                                const percentage = Math.round(
                                    (item.voters / item.total) * 100
                                );

                                return (
                                    <div
                                        className="department-row"
                                        key={item.department}
                                    >
                                        <div className="department-info">
                                            <strong>{item.department}</strong>

                                            <span>
                                                {item.voters} / {item.total}
                                            </span>
                                        </div>

                                        <div className="department-progress">
                                            <div
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            ></div>
                                        </div>

                                        <strong className="department-percentage">
                                            {percentage}%
                                        </strong>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RECENT ACTIVITY */}
                    <div className="reports-card recent-activity-card">

                        <div className="reports-card-header">
                            <div>
                                <h2>Recent Activity</h2>
                                <p>Latest reporting activities.</p>
                            </div>
                        </div>

                        <div className="recent-activity-list">
                            {recentActivities.map((activity, index) => (
                                <div
                                    className="recent-activity-item"
                                    key={`${activity.action}-${index}`}
                                >
                                    <div className="activity-status-icon">
                                        <FiCheckCircle />
                                    </div>

                                    <div className="recent-activity-info">
                                        <strong>{activity.action}</strong>

                                        <span>
                                            {activity.user} • {activity.time}
                                        </span>
                                    </div>

                                    <span className="activity-completed">
                                        {activity.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                </section>

                {/* FOOTER INFO */}
                <section className="reports-footer-card">
                    <div className="reports-footer-icon">
                        <FiBarChart2 />
                    </div>

                    <div>
                        <strong>Report information</strong>
                        <p>
                            This report provides an overview of voter
                            participation and election activity for the
                            selected election period.
                        </p>
                    </div>

                    <div className="reports-generated">
                        <span>Generated by</span>
                        <strong>{admin.name || "Administrator"}</strong>
                    </div>
                </section>

            </main>
        </div>
    );
};

export default Reports;