import { useEffect, useMemo, useState } from "react";
import "./StudentDashboard.css";

import {
    getActiveElection,
    getElectionConfiguration,
} from "../../services/electionService";

import {
    getApprovedCandidatesForElection,
} from "../../services/candidateService";

import {
    submitVote,
    checkVoteStatus,
} from "../../services/votingService";

// =====================================================
// LOGO
// =====================================================

const votaraLogoSrc = "/src/images/Votara.png";

// =====================================================
// SIDEBAR ICONS
// =====================================================

import dashboardIcon from "/src/images/homealt.png";
import voteIcon from "/src/images/votealt.png";
import guidelinesIcon from "/src/images/guidelinesalt.png";
import settingsIcon from "/src/images/settingalt.png";

import dashboardActiveIcon from "/src/images/home.png";
import voteActiveIcon from "/src/images/review.png";
import guidelinesActiveIcon from "/src/images/guidelines.png";
import settingsActiveIcon from "/src/images/setting.png";

// =====================================================
// HELPERS
// =====================================================

const normalizeYearLevel = (value) => {
    if (!value) return "";

    const text = String(value).trim().toLowerCase();

    if (text.includes("1st") || text === "1") return "1st Year";
    if (text.includes("2nd") || text === "2") return "2nd Year";
    if (text.includes("3rd") || text === "3") return "3rd Year";
    if (text.includes("4th") || text === "4") return "4th Year";

    return String(value).trim();
};

const extractArray = (response, key) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.data?.[key])) return response.data[key];

    return [];
};

const extractElection = (response) => {
    if (!response) return null;

    if (response.election) return response.election;
    if (response.data?.election) return response.data.election;

    if (response.data && !Array.isArray(response.data)) {
        return response.data;
    }

    return response;
};

const formatDate = (value) => {
    if (!value) return "Date to be announced";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
};

const formatTime = (value) => {
    if (!value) return "";

    const [hourText, minute = "00"] = String(value).split(":");
    const hour = Number(hourText);

    if (Number.isNaN(hour)) {
        return value;
    }

    return `${hour % 12 || 12}:${minute} ${
        hour >= 12 ? "PM" : "AM"
    }`;
};

// =====================================================
// COMPONENT
// =====================================================

function StudentDashboard() {
    // =================================================
    // GENERAL DASHBOARD STATE
    // =================================================

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeMenu, setActiveMenu] = useState("dashboard");

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    const [searchValue, setSearchValue] = useState("");
    const [calendarTab, setCalendarTab] = useState("Today");
    const [selectedFaq, setSelectedFaq] = useState(null);

    const [settingsModal, setSettingsModal] = useState(null);

    // =================================================
    // ELECTION / VOTING STATE
    // =================================================

    const [election, setElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [candidates, setCandidates] = useState([]);

    // Stores selections as:
    // { positionId: candidateId }
    const [selectedVotes, setSelectedVotes] = useState({});

    const [electionLoading, setElectionLoading] = useState(true);
    const [electionError, setElectionError] = useState("");

    const [voteLoading, setVoteLoading] = useState(false);
    const [hasVoted, setHasVoted] = useState(false);

    // =================================================
    // FETCH CURRENT STUDENT
    // =================================================

    useEffect(() => {
        const fetchStudent = async () => {
            try {
                const token = localStorage.getItem("votaraToken");

                if (!token) {
                    setStudent(null);
                    return;
                }

                const response = await fetch(
                    "http://localhost:5000/api/auth/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await response.json();

                if (data.success && data.student) {
                    setStudent(data.student);
                }
            } catch (error) {
                console.error(
                    "Unable to load student:",
                    error
                );
            } finally {
                setLoading(false);
            }
        };

        fetchStudent();
    }, []);

    // =================================================
    // LOAD ACTIVE ELECTION
    // =================================================

    useEffect(() => {
        let mounted = true;

        const loadElectionData = async () => {
            try {
                setElectionLoading(true);
                setElectionError("");

                const electionResponse =
                    await getActiveElection();

                if (!mounted) return;

                const activeElection =
                    extractElection(electionResponse);

                if (!activeElection?.id) {
                    setElection(null);
                    setPositions([]);
                    setCandidates([]);
                    setHasVoted(false);
                    return;
                }

                setElection(activeElection);

                const [
                    configurationResponse,
                    candidateResponse,
                ] = await Promise.all([
                    getElectionConfiguration(
                        activeElection.id
                    ),
                    getApprovedCandidatesForElection(
                        activeElection.id
                    ),
                ]);

                if (!mounted) return;

                setPositions(
                    extractArray(
                        configurationResponse,
                        "positions"
                    )
                );

                setCandidates(
                    extractArray(
                        candidateResponse,
                        "candidates"
                    )
                );

                // Check whether this student already voted.
                try {
                    const voteStatus =
                        await checkVoteStatus(
                            activeElection.id
                        );

                    if (!mounted) return;

                    setHasVoted(
                        Boolean(
                            voteStatus?.hasVoted ??
                            voteStatus?.data?.hasVoted
                        )
                    );
                } catch (statusError) {
                    console.warn(
                        "Unable to check vote status:",
                        statusError
                    );
                }
            } catch (error) {
                console.error(
                    "Unable to load election data:",
                    error
                );

                if (!mounted) return;

                setElection(null);
                setPositions([]);
                setCandidates([]);

                setElectionError(
                    error?.response?.data?.message ||
                    error?.message ||
                    "Unable to load the current election."
                );
            } finally {
                if (mounted) {
                    setElectionLoading(false);
                }
            }
        };

        loadElectionData();

        return () => {
            mounted = false;
        };
    }, []);

    // =================================================
    // STUDENT INFORMATION
    // =================================================

    const fullName =
        student?.fullName || "Student";

    const firstName =
        fullName.split(" ")[0] || "Student";

    const initials = fullName
        .split(" ")
        .filter(Boolean)
        .map((name) => name.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const profilePicture =
        student?.profilePicture;

    const studentYearLevel =
        normalizeYearLevel(
            student?.yearLevel
        );

    // =================================================
    // SIDEBAR ITEMS
    // =================================================

    const sidebarItems = [
        {
            id: "dashboard",
            label: "Dashboard",
            icon: dashboardIcon,
            activeIcon: dashboardActiveIcon,
        },
        {
            id: "vote",
            label: "Vote",
            icon: voteIcon,
            activeIcon: voteActiveIcon,
        },
        {
            id: "guidelines",
            label: "VOTERS GUIDELINES",
            icon: guidelinesIcon,
            activeIcon: guidelinesActiveIcon,
        },
        {
            id: "settings",
            label: "Settings",
            icon: settingsIcon,
            activeIcon: settingsActiveIcon,
        },
    ];

    // =================================================
    // ELIGIBLE POSITIONS
    // =================================================

    const eligiblePositions = useMemo(() => {
        return positions
            .filter(
                (position) =>
                    position?.is_active !== false
            )
            .filter((position) => {
                const access =
                    position?.position_year_levels ||
                    position?.positionYearLevels ||
                    position?.year_levels ||
                    position?.yearLevels ||
                    [];

                // No configured year-level access means
                // the position is available to everyone.
                if (
                    !Array.isArray(access) ||
                    access.length === 0
                ) {
                    return true;
                }

                return access.some((item) => {
                    const year =
                        typeof item === "string"
                            ? item
                            : item?.year_level ||
                              item?.yearLevel;

                    return (
                        normalizeYearLevel(
                            year
                        ) === studentYearLevel
                    );
                });
            })
            .sort(
                (a, b) =>
                    Number(
                        a.display_order || 0
                    ) -
                    Number(
                        b.display_order || 0
                    )
            );
    }, [
        positions,
        studentYearLevel,
    ]);

    // =================================================
    // GROUP APPROVED CANDIDATES BY POSITION
    // =================================================

    const candidatesByPosition = useMemo(() => {
        const grouped = {};

        eligiblePositions.forEach(
            (position) => {
                grouped[position.id] =
                    candidates.filter(
                        (candidate) =>
                            candidate.position_id ===
                                position.id &&
                            candidate.approval_status ===
                                "approved" &&
                            candidate.is_active !==
                                false
                    );
            }
        );

        return grouped;
    }, [
        candidates,
        eligiblePositions,
    ]);

    // =================================================
    // MENU CHANGE
    // =================================================

    const handleMenuClick = (id) => {
        if (id === activeMenu) return;

        setActiveMenu(id);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // =================================================
    // FAQ
    // =================================================

    const faqs = [
        {
            question: "QUESTION 1",
            answer:
                "You can participate in the election by selecting the Vote section from the sidebar.",
        },
        {
            question: "QUESTION 2",
            answer:
                "Review the available candidates and select your preferred candidate before submitting your vote.",
        },
        {
            question: "QUESTION 3",
            answer:
                "Once your vote is submitted and confirmed, your participation will be recorded.",
        },
    ];

    // =================================================
    // SETTINGS
    // =================================================

    const settingsItems = [
        "Edit profile",
        "Change password",
        "Report an Issue",
        "About us",
        "Terms of Service",
        "Privacy Policy",
        "Contact us",
    ];

    // =================================================
    // SELECT CANDIDATE
    // =================================================

    const handleVoteSelect = (
        positionId,
        candidateId
    ) => {
        if (hasVoted || voteLoading) {
            return;
        }

        setSelectedVotes((previous) => ({
            ...previous,
            [positionId]: candidateId,
        }));
    };

    // =================================================
    // VIEW CANDIDATE DETAILS
    // =================================================

    const handleViewDetails = (candidate) => {
        const name =
            candidate?.full_name ||
            candidate?.fullName ||
            candidate?.name ||
            "Candidate";

        alert(`Candidate: ${name}`);
    };

    // =================================================
    // SUBMIT VOTE
    // =================================================

    const handleSubmitVotes = async () => {
        if (!election?.id) {
            alert(
                "There is no active election available."
            );
            return;
        }

        if (hasVoted) {
            alert(
                "You have already submitted your vote for this election."
            );
            return;
        }

        // Required positions must have a selection.
        const requiredPositions =
            eligiblePositions.filter(
                (position) =>
                    position.is_required !== false
            );

        const missingPositions =
            requiredPositions.filter(
                (position) =>
                    !selectedVotes[
                        position.id
                    ]
            );

        if (missingPositions.length > 0) {
            const missingNames =
                missingPositions
                    .map(
                        (position) =>
                            position.name
                    )
                    .join(", ");

            alert(
                `Please select a candidate for: ${missingNames}`
            );

            return;
        }

        // Convert the UI state into the backend
        // format expected by /api/voting/submit.
        const selections =
            eligiblePositions
                .filter(
                    (position) =>
                        selectedVotes[
                            position.id
                        ]
                )
                .map((position) => ({
                    positionId:
                        position.id,
                    candidateId:
                        selectedVotes[
                            position.id
                        ],
                }));

        if (selections.length === 0) {
            alert(
                "Please select your candidates before submitting."
            );
            return;
        }

        try {
            setVoteLoading(true);

            const result =
                await submitVote(
                    election.id,
                    selections
                );

            if (!result?.success) {
                throw new Error(
                    result?.message ||
                    "Unable to submit your vote."
                );
            }

            setHasVoted(true);
            setSelectedVotes({});

            alert(
                result?.message ||
                "Your vote has been successfully recorded."
            );

            console.log(
                "Vote submission result:",
                result
            );
        } catch (error) {
            console.error(
                "Vote submission error:",
                error
            );

            alert(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to submit your vote. Please try again."
            );
        } finally {
            setVoteLoading(false);
        }
    };

    // =================================================
    // LOGOUT
    // =================================================

    const handleLogout = () => {
        localStorage.removeItem(
            "votaraToken"
        );

        localStorage.removeItem(
            "votaraStudent"
        );

        window.location.href = "/";
    };

    // =================================================
    // SEARCH
    // =================================================

    const handleSearch = () => {
        const query =
            searchValue.trim().toLowerCase();

        if (!query) return;

        if (query.includes("vote")) {
            handleMenuClick("vote");
        } else if (
            query.includes("guideline") ||
            query.includes("voter")
        ) {
            handleMenuClick(
                "guidelines"
            );
        } else if (
            query.includes("setting")
        ) {
            handleMenuClick(
                "settings"
            );
        } else if (
            query.includes("dashboard")
        ) {
            handleMenuClick(
                "dashboard"
            );
        } else {
            alert(
                `No page found for "${searchValue}"`
            );
        }

        setSearchValue("");
    };

    // =================================================
    // RENDER CANDIDATE CARDS
    // =================================================

    const renderCandidateCards = (
        position
    ) => {
        const candidateList =
            candidatesByPosition[
                position.id
            ] || [];

        if (
            candidateList.length ===
            0
        ) {
            return (
                <div className="candidate-empty">
                    No approved candidates are
                    currently available for this
                    position.
                </div>
            );
        }

        return candidateList.map(
            (candidate) => {
                const candidateName =
                    candidate.full_name ||
                    candidate.fullName ||
                    candidate.name ||
                    "Candidate";

                const candidateImage =
                    candidate.profile_picture ||
                    candidate.profilePicture ||
                    "/src/images/candidate.png";

                const isSelected =
                    selectedVotes[
                        position.id
                    ] === candidate.id;

                return (
                    <article
                        className={`candidate-card ${
                            isSelected
                                ? "candidate-selected"
                                : ""
                        }`}
                        key={candidate.id}
                    >
                        <div className="candidate-card-top">
                            <h3>
                                {candidateName}
                            </h3>

                            <div className="candidate-image-container">
                                <img
                                    src={
                                        candidateImage
                                    }
                                    alt={
                                        candidateName
                                    }
                                    className="candidate-image"
                                />
                            </div>
                        </div>

                        <div className="candidate-card-bottom">
                            <button
                                type="button"
                                className="candidate-vote-button"
                                disabled={
                                    hasVoted ||
                                    voteLoading
                                }
                                onClick={() =>
                                    handleVoteSelect(
                                        position.id,
                                        candidate.id
                                    )
                                }
                            >
                                {isSelected
                                    ? "SELECTED"
                                    : "VOTE"}
                            </button>

                            <button
                                type="button"
                                className="candidate-details-button"
                                onClick={() =>
                                    handleViewDetails(
                                        candidate
                                    )
                                }
                            >
                                View Details
                            </button>
                        </div>
                    </article>
                );
            }
        );
    };

    // =================================================
    // LOADING SCREEN
    // =================================================

    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading...
            </div>
        );
    }

    // =================================================
    // MAIN PAGE CONTENT
    // =================================================

    const renderMainContent = () => {
        // =================================================
        // DASHBOARD
        // =================================================

        if (
            activeMenu ===
            "dashboard"
        ) {
            return (
                <main className="dashboard-main content-page-animation">
                    <section className="welcome-section">
                        <h1>
                            Hello{" "}
                            <strong>
                                {firstName}!
                            </strong>
                        </h1>

                        <p>
                            Welcome to Votara
                        </p>
                    </section>

                    <div className="dashboard-grid">
                        {/* LEFT COLUMN */}

                        <div className="left-column">
                            <section className="election-card main-hover-card">
                                <h2>
                                    Ongoing Elections
                                </h2>

                                <h3>
                                    {election?.title ||
                                        "No active election"}
                                </h3>

                                {election && (
                                    <p>
                                        {formatDate(
                                            election.election_date
                                        )}

                                        <br />

                                        {formatTime(
                                            election.start_time
                                        )}

                                        {election.end_time
                                            ? ` - ${formatTime(
                                                  election.end_time
                                              )}`
                                            : ""}
                                    </p>
                                )}

                                <button
                                    type="button"
                                    className="vote-button"
                                    disabled={
                                        !election ||
                                        hasVoted
                                    }
                                    onClick={() =>
                                        handleMenuClick(
                                            "vote"
                                        )
                                    }
                                >
                                    {hasVoted
                                        ? "VOTE SUBMITTED"
                                        : "Vote"}
                                </button>
                            </section>

                            <section className="results-card main-hover-card">
                                <div className="results-header">
                                    <h3>
                                        Election Information
                                    </h3>
                                </div>

                                <div className="position-title">
                                    <h2>
                                        {election?.title ||
                                            "No active election"}
                                    </h2>
                                </div>

                                <div className="chart">
                                    <div className="chart-row">
                                        <span className="candidate-name">
                                            Election
                                        </span>

                                        <div className="bar-area">
                                            <div
                                                className="bar"
                                                style={{
                                                    width:
                                                        election
                                                            ? "100%"
                                                            : "0%",
                                                }}
                                            />
                                        </div>

                                        <span className="vote-count">
                                            {election?.status ||
                                                "Inactive"}
                                        </span>
                                    </div>

                                    <div className="chart-row">
                                        <span className="candidate-name">
                                            Your Status
                                        </span>

                                        <div className="bar-area">
                                            <div
                                                className="bar"
                                                style={{
                                                    width:
                                                        hasVoted
                                                            ? "100%"
                                                            : "50%",
                                                }}
                                            />
                                        </div>

                                        <span className="vote-count">
                                            {hasVoted
                                                ? "Voted"
                                                : "Not Voted"}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            <section className="announcement-card main-hover-card">
                                <h3>
                                    Announcements
                                </h3>

                                <p>
                                    {election
                                        ? `Voting schedule: ${formatDate(
                                              election.election_date
                                          )}`
                                        : "No active election announcement."}
                                </p>

                                <div className="announcement-line" />

                                <button type="button">
                                    See all ›
                                </button>
                            </section>

                            <section className="faq-section">
                                <h3>
                                    FAQs
                                </h3>

                                <div className="faq-list">
                                    {faqs.map(
                                        (
                                            faq,
                                            index
                                        ) => (
                                            <div
                                                className="faq-item"
                                                key={
                                                    index
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={`faq-button ${
                                                        selectedFaq ===
                                                        index
                                                            ? "faq-active"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedFaq(
                                                            selectedFaq ===
                                                                index
                                                                ? null
                                                                : index
                                                        )
                                                    }
                                                >
                                                    {
                                                        faq.question
                                                    }
                                                </button>

                                                {selectedFaq ===
                                                    index && (
                                                    <div className="faq-answer">
                                                        {
                                                            faq.answer
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* RIGHT COLUMN */}

                        <div className="right-column">
                            <section className="calendar-card main-hover-card">
                                <h3>
                                    Calendar
                                </h3>

                                <div className="calendar-tabs">
                                    {[
                                        "Today",
                                        "Next week",
                                        "This Month",
                                    ].map(
                                        (
                                            tab
                                        ) => (
                                            <button
                                                type="button"
                                                key={
                                                    tab
                                                }
                                                className={
                                                    calendarTab ===
                                                    tab
                                                        ? "selected-tab"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    setCalendarTab(
                                                        tab
                                                    )
                                                }
                                            >
                                                {
                                                    tab
                                                }
                                            </button>
                                        )
                                    )}
                                </div>

                                <div className="time-row">
                                    <span>
                                        7:00
                                    </span>
                                    <span>
                                        8:00
                                    </span>
                                    <span>
                                        9:00
                                    </span>
                                    <span>
                                        10:00
                                    </span>
                                    <span>
                                        11:00
                                    </span>
                                </div>

                                <div className="calendar-line" />

                                <div className="election-time">
                                    <div className="date">
                                        <strong>
                                            {election
                                                ? new Date(
                                                      election.election_date
                                                  ).toLocaleDateString(
                                                      "en-US",
                                                      {
                                                          month: "long",
                                                      }
                                                  )
                                                : "Election"}
                                        </strong>

                                        <span>
                                            {election
                                                ? new Date(
                                                      election.election_date
                                                  ).getDate()
                                                : "--"}
                                        </span>
                                    </div>

                                    <div className="countdown">
                                        <small>
                                            {election?.title ||
                                                "No active election"}
                                        </small>

                                        <div className="countdown-values">
                                            <span>
                                                <strong>
                                                    {election
                                                        ? "OPEN"
                                                        : "--"}
                                                </strong>
                                                STATUS
                                            </span>

                                            <span>
                                                <strong>
                                                    {studentYearLevel ||
                                                        "--"}
                                                </strong>
                                                YEAR
                                            </span>

                                            <span>
                                                <strong>
                                                    {
                                                        eligiblePositions.length
                                                    }
                                                </strong>
                                                POSITIONS
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="process-card main-hover-card">
                                <h3>
                                    Voting Process
                                </h3>

                                <div className="process-list">
                                    {[
                                        [
                                            "1",
                                            "Verify identity",
                                            "Confirm your student ID to unlock ballots",
                                        ],
                                        [
                                            "2",
                                            "Review candidates",
                                            "Check profiles and platforms before choosing",
                                        ],
                                        [
                                            "3",
                                            "Cast your vote",
                                            "Select one candidate per position",
                                        ],
                                        [
                                            "4",
                                            "Submit and confirm",
                                            "Get a confirmation once your vote is recorded",
                                        ],
                                    ].map(
                                        (
                                            [
                                                number,
                                                title,
                                                description,
                                            ],
                                            index
                                        ) => (
                                            <div
                                                className={`process-item ${
                                                    index ===
                                                    3
                                                        ? "last"
                                                        : ""
                                                }`}
                                                key={
                                                    number
                                                }
                                            >
                                                <div className="process-number">
                                                    {
                                                        number
                                                    }
                                                </div>

                                                <div className="process-text">
                                                    <strong>
                                                        {
                                                            title
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            description
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            );
        }

        // =================================================
        // VOTE PAGE
        // =================================================

        if (
            activeMenu ===
            "vote"
        ) {
            return (
                <main className="vote-main content-page-animation">
                    <section className="vote-heading">
                        <h1>
                            {hasVoted
                                ? "Your Vote Has Been Submitted"
                                : "You May Now Cast Your Votes!"}
                        </h1>

                        {election && (
                            <p>
                                {
                                    election.title
                                }
                            </p>
                        )}

                        {studentYearLevel && (
                            <p>
                                Year Level:{" "}
                                <strong>
                                    {
                                        studentYearLevel
                                    }
                                </strong>
                            </p>
                        )}
                    </section>

                    {electionLoading && (
                        <section className="vote-position-section">
                            <div className="vote-position-heading">
                                <h2>
                                    Loading election...
                                </h2>
                            </div>
                        </section>
                    )}

                    {!electionLoading &&
                        electionError && (
                            <section className="vote-position-section">
                                <div className="vote-position-heading">
                                    <h2>
                                        Unable to load election
                                    </h2>

                                    <p>
                                        {
                                            electionError
                                        }
                                    </p>
                                </div>
                            </section>
                        )}

                    {!electionLoading &&
                        !electionError &&
                        !election && (
                            <section className="vote-position-section">
                                <div className="vote-position-heading">
                                    <h2>
                                        No Active Election
                                    </h2>

                                    <p>
                                        There is currently
                                        no published active
                                        election available.
                                    </p>
                                </div>
                            </section>
                        )}

                    {election &&
                        eligiblePositions.length ===
                            0 && (
                            <section className="vote-position-section">
                                <div className="vote-position-heading">
                                    <h2>
                                        No Available Positions
                                    </h2>

                                    <p>
                                        There are currently
                                        no voting positions
                                        available for your
                                        year level.
                                    </p>
                                </div>
                            </section>
                        )}

                    {election &&
                        eligiblePositions.map(
                            (position) => (
                                <section
                                    className="vote-position-section"
                                    key={
                                        position.id
                                    }
                                >
                                    <div className="vote-position-heading">
                                        <h2>
                                            {
                                                position.name
                                            }
                                        </h2>

                                        <p>
                                            {position.is_required !==
                                            false
                                                ? "You must select one candidate for this position."
                                                : "This position is optional."}
                                        </p>

                                        {position.description && (
                                            <p>
                                                {
                                                    position.description
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="candidate-grid">
                                        {renderCandidateCards(
                                            position
                                        )}
                                    </div>
                                </section>
                            )
                        )}

                    {election &&
                        eligiblePositions.length >
                            0 && (
                            <section className="vote-submit-section">
                                <p>
                                    {hasVoted
                                        ? "Your vote for this election has already been recorded."
                                        : "Double check your choices before submitting your votes."}
                                </p>

                                <button
                                    type="button"
                                    className="submit-vote-button"
                                    disabled={
                                        hasVoted ||
                                        voteLoading
                                    }
                                    onClick={
                                        handleSubmitVotes
                                    }
                                >
                                    {voteLoading
                                        ? "SUBMITTING..."
                                        : hasVoted
                                        ? "VOTE SUBMITTED"
                                        : "SUBMIT VOTE"}
                                </button>
                            </section>
                        )}
                </main>
            );
        }

        // =================================================
        // GUIDELINES PAGE
        // =================================================

        if (
            activeMenu ===
            "guidelines"
        ) {
            const guidelines = [
                "Before voting, take the time to research the candidates and issues on the ballot.",
                "Make sure you are eligible to vote in the election.",
                "Only currently enrolled students are eligible to participate.",
                "Each authenticated account or student ID is restricted to a single submission.",
                "Voters will only see candidates and positions relevant to their specific year level and department.",
                "Personal IDs are separated from cast ballots in the database to ensure anonymity.",
                "Cast your vote within the official voting schedule and portal availability hours.",
                "Ensure you have a stable internet connection before submitting your ballot.",
                "Review your chosen candidates carefully before finalizing your submission, as votes cannot be changed once submitted.",
                "Do not share your login credentials or authentication code with anyone.",
                "Report any technical glitches or voting issues to the election committee immediately.",
                "Log out of your account after successfully submitting your ballot to protect your privacy.",
            ];

            return (
                <main className="guidelines-main content-page-animation">
                    <section className="guidelines-container">
                        <h1>
                            Voters Guidelines
                        </h1>

                        <div className="guidelines-list">
                            {guidelines.map(
                                (
                                    guideline,
                                    index
                                ) => (
                                    <button
                                        type="button"
                                        className="guideline-item"
                                        key={
                                            index
                                        }
                                        onClick={() =>
                                            alert(
                                                guideline
                                            )
                                        }
                                    >
                                        <span className="guideline-dot" />

                                        <span>
                                            {
                                                guideline
                                            }
                                        </span>
                                    </button>
                                )
                            )}
                        </div>
                    </section>
                </main>
            );
        }

        // =================================================
        // SETTINGS PAGE
        // =================================================

        if (
            activeMenu ===
            "settings"
        ) {
            return (
                <main className="settings-main content-page-animation">
                    <section className="settings-container">
                        <h1>
                            ACCOUNT
                        </h1>

                        <div className="settings-grid">
                            <div className="settings-column">
                                {settingsItems
                                    .slice(
                                        0,
                                        4
                                    )
                                    .map(
                                        (
                                            item
                                        ) => (
                                            <button
                                                type="button"
                                                className="settings-item"
                                                key={
                                                    item
                                                }
                                                onClick={() =>
                                                    setSettingsModal(
                                                        item
                                                    )
                                                }
                                            >
                                                <span className="settings-left">
                                                    <span className="settings-dot">
                                                        ●
                                                    </span>

                                                    {
                                                        item
                                                    }
                                                </span>

                                                <span>
                                                    ›
                                                </span>
                                            </button>
                                        )
                                    )}
                            </div>

                            <div className="settings-column">
                                {settingsItems
                                    .slice(
                                        4
                                    )
                                    .map(
                                        (
                                            item
                                        ) => (
                                            <button
                                                type="button"
                                                className="settings-item"
                                                key={
                                                    item
                                                }
                                                onClick={() =>
                                                    setSettingsModal(
                                                        item
                                                    )
                                                }
                                            >
                                                <span className="settings-left">
                                                    <span className="settings-dot">
                                                        ●
                                                    </span>

                                                    {
                                                        item
                                                    }
                                                </span>

                                                <span>
                                                    ›
                                                </span>
                                            </button>
                                        )
                                    )}
                            </div>
                        </div>
                    </section>
                </main>
            );
        }

        return null;
    };

    // =================================================
    // MAIN RETURN
    // =================================================

    return (
        <div className="student-dashboard">
            {/* ================= NAVBAR ================= */}

            <header className="top-navbar">
                <div className="nav-left">
                    <button
                        type="button"
                        className="menu-toggle"
                        onClick={() =>
                            setSidebarOpen(
                                (previous) =>
                                    !previous
                            )
                        }
                        aria-label="Toggle sidebar"
                    >
                        <span />
                        <span />
                        <span />
                    </button>

                    <div className="brand">
                        <img
                            src={
                                votaraLogoSrc
                            }
                            alt="Votara"
                            className="votara-logo"
                        />

                        <span>
                            Votara
                        </span>
                    </div>
                </div>

                {/* SEARCH */}

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search"
                        value={
                            searchValue
                        }
                        onChange={(
                            event
                        ) =>
                            setSearchValue(
                                event.target.value
                            )
                        }
                        onKeyDown={(
                            event
                        ) => {
                            if (
                                event.key ===
                                "Enter"
                            ) {
                                handleSearch();
                            }
                        }}
                    />

                    <button
                        type="button"
                        className="search-button"
                        aria-label="Search"
                        onClick={
                            handleSearch
                        }
                    >
                        ⌕
                    </button>
                </div>

                {/* RIGHT NAV */}

                <div className="nav-right">
                    <button
                        type="button"
                        className="nav-icon-button"
                        aria-label="Notifications"
                        onClick={() =>
                            alert(
                                "You have no new notifications."
                            )
                        }
                    >
                        <img
                            src="/src/images/bell.png"
                            alt="Notifications"
                            className="nav-icon-image"
                        />
                    </button>

                    <button
                        type="button"
                        className="help-button"
                        aria-label="Help"
                        onClick={() =>
                            handleMenuClick(
                                "guidelines"
                            )
                        }
                    >
                        ?
                    </button>

                    <div className="nav-profile">
                        {profilePicture ? (
                            <img
                                src={
                                    profilePicture
                                }
                                alt={
                                    fullName
                                }
                                className="nav-profile-image"
                            />
                        ) : (
                            <div className="nav-profile-placeholder">
                                {
                                    initials
                                }
                            </div>
                        )}

                        <span>
                            {
                                firstName
                            }
                        </span>
                    </div>
                </div>
            </header>

            <div className="dashboard-body">
                {/* ================= SIDEBAR ================= */}

                <aside
                    className={`sidebar ${
                        sidebarOpen
                            ? "sidebar-open"
                            : "sidebar-collapsed"
                    }`}
                >
                    <div className="sidebar-profile">
                        {profilePicture ? (
                            <img
                                src={
                                    profilePicture
                                }
                                alt={
                                    fullName
                                }
                                className="profile-picture"
                            />
                        ) : (
                            <div className="profile-placeholder">
                                {
                                    initials
                                }
                            </div>
                        )}

                        <div className="profile-details">
                            <h3>
                                {
                                    fullName
                                }
                            </h3>

                            <button
                                type="button"
                                onClick={() =>
                                    setSettingsModal(
                                        "Edit profile"
                                    )
                                }
                            >
                                Show Profile
                            </button>
                        </div>
                    </div>

                    <nav className="sidebar-menu">
                        {sidebarItems.map(
                            (item) => {
                                const isActive =
                                    activeMenu ===
                                    item.id;

                                return (
                                    <button
                                        key={
                                            item.id
                                        }
                                        type="button"
                                        className={`sidebar-item ${
                                            isActive
                                                ? "active"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            handleMenuClick(
                                                item.id
                                            )
                                        }
                                    >
                                        <span className="sidebar-icon-wrapper">
                                            <img
                                                src={
                                                    item.icon
                                                }
                                                alt=""
                                                className={`sidebar-menu-icon normal-icon ${
                                                    isActive
                                                        ? "hide-icon"
                                                        : ""
                                                }`}
                                            />

                                            <img
                                                src={
                                                    item.activeIcon
                                                }
                                                alt=""
                                                className={`sidebar-menu-icon active-icon ${
                                                    isActive
                                                        ? "show-icon"
                                                        : ""
                                                }`}
                                            />
                                        </span>

                                        <span className="sidebar-label">
                                            {
                                                item.label
                                            }
                                        </span>
                                    </button>
                                );
                            }
                        )}
                    </nav>

                    <div className="sidebar-bottom">
                        <button
                            type="button"
                            className="logout-button"
                            onClick={
                                handleLogout
                            }
                        >
                            <img
                                src="/src/images/logoutalt.png"
                                alt="Log out"
                                className="logout-image"
                            />

                            <span className="logout-text">
                                Log out
                            </span>
                        </button>
                    </div>
                </aside>

                {/* ================= CONTENT ================= */}

                {renderMainContent()}
            </div>

            {/* ================= SETTINGS MODAL ================= */}

            {settingsModal && (
                <div
                    className="settings-modal-overlay"
                    onClick={() =>
                        setSettingsModal(
                            null
                        )
                    }
                >
                    <div
                        className="settings-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            type="button"
                            className="modal-close"
                            onClick={() =>
                                setSettingsModal(
                                    null
                                )
                            }
                        >
                            ×
                        </button>

                        <h2>
                            {
                                settingsModal
                            }
                        </h2>

                        <p>
                            This section is ready
                            to be connected to its
                            corresponding feature
                            or API.
                        </p>

                        <button
                            type="button"
                            className="modal-confirm-button"
                            onClick={() =>
                                setSettingsModal(
                                    null
                                )
                            }
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentDashboard;