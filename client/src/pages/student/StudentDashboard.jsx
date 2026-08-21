// StudentDashboard.jsx

import { useEffect, useState } from "react";
import "./StudentDashboard.css";

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
import qrCodeIcon from "/src/images/Qr-code.png";

import dashboardActiveIcon from "/src/images/home.png";
import voteActiveIcon from "/src/images/review.png";
import guidelinesActiveIcon from "/src/images/guidelines.png";
import settingsActiveIcon from "/src/images/setting.png";
import qrCodeActiveIcon from "/src/images/Qrcodealt.png";

// =====================================================
// COMPONENT
// =====================================================

function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchValue, setSearchValue] = useState("");
  const [calendarTab, setCalendarTab] = useState("Today");
  const [selectedFaq, setSelectedFaq] = useState(null);

  // Vote states
  const [selectedVotes, setSelectedVotes] = useState({
    president: null,
    vicePresident: null,
  });

  // Settings states
  const [settingsModal, setSettingsModal] = useState(null);

  // =====================================================
  // FETCH STUDENT
  // =====================================================

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("votaraToken");

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
        console.error("Unable to load student:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, []);

  // =====================================================
  // SIDEBAR ITEMS
  // =====================================================

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
    {
      id: "qr",
      label: "QR Code",
      icon: qrCodeIcon,
      activeIcon: qrCodeActiveIcon,
    },
  ];

  // =====================================================
  // STUDENT INFORMATION
  // =====================================================

  const fullName = student?.fullName || "Arthur Morgan";

  const firstName = fullName.split(" ")[0] || "Arthur";

  const initials = fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profilePicture = student?.profilePicture;

  // =====================================================
  // MENU CHANGE
  // =====================================================

  const handleMenuClick = (id) => {
    if (id === activeMenu) return;

    setActiveMenu(id);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // FAQ
  // =====================================================

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

  // =====================================================
  // CANDIDATES
  // =====================================================

  const candidates = {
    president: [
      {
        id: "president-felisha",
        name: "Felisha",
        image: "/src/images/candidate.png",
      },
      {
        id: "president-roberto",
        name: "Roberto",
        image: "/src/images/candidate.png",
      },
      {
        id: "president-mary",
        name: "Mary",
        image: "/src/images/candidate.png",
      },
    ],

    vicePresident: [
      {
        id: "vice-felisha",
        name: "Felisha",
        image: "/src/images/candidate.png",
      },
      {
        id: "vice-roberto",
        name: "Roberto",
        image: "/src/images/candidate.png",
      },
      {
        id: "vice-mary",
        name: "Mary",
        image: "/src/images/candidate.png",
      },
    ],
  };

  // =====================================================
  // VOTE FUNCTIONS
  // =====================================================

  const handleVoteSelect = (position, candidateId) => {
    setSelectedVotes((previous) => ({
      ...previous,
      [position]: candidateId,
    }));
  };

  const handleViewDetails = (candidate) => {
    alert(`Candidate: ${candidate.name}`);
  };

  const handleSubmitVotes = () => {
    if (
      !selectedVotes.president ||
      !selectedVotes.vicePresident
    ) {
      alert(
        "Please select one candidate for President and Vice President."
      );

      return;
    }

    alert(
      "Your votes have been selected successfully. You can now connect this button to your vote submission API."
    );

    console.log("Selected votes:", selectedVotes);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("votaraToken");
    localStorage.removeItem("student");

    window.location.href = "/";
  };

  // =====================================================
  // SETTINGS
  // =====================================================

  const settingsItems = [
    "Edit profile",
    "Change password",
    "Report an Issue",
    "About us",
    "Terms of Service",
    "Privacy Policy",
    "Contact us",
  ];

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = () => {
    if (!searchValue.trim()) return;

    const query = searchValue.toLowerCase();

    if (query.includes("vote")) {
      handleMenuClick("vote");
    } else if (
      query.includes("guideline") ||
      query.includes("voter")
    ) {
      handleMenuClick("guidelines");
    } else if (query.includes("setting")) {
      handleMenuClick("settings");
    } else if (query.includes("qr")) {
      handleMenuClick("qr");
    } else if (query.includes("dashboard")) {
      handleMenuClick("dashboard");
    } else {
      alert(`No page found for "${searchValue}"`);
    }

    setSearchValue("");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading...
      </div>
    );
  }

  // =====================================================
  // RENDER VOTE CARDS
  // =====================================================

  const renderCandidateCards = (
    position,
    candidateList
  ) =>
    candidateList.map((candidate) => {
      const isSelected =
        selectedVotes[position] === candidate.id;

      return (
        <article
          className={`candidate-card ${
            isSelected ? "candidate-selected" : ""
          }`}
          key={candidate.id}
        >
          <div className="candidate-card-top">
            <h3>{candidate.name}</h3>

            <div className="candidate-image-container">
              <img
                src={candidate.image}
                alt={candidate.name}
                className="candidate-image"
              />
            </div>
          </div>

          <div className="candidate-card-bottom">
            <button
              type="button"
              className="candidate-vote-button"
              onClick={() =>
                handleVoteSelect(
                  position,
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
                handleViewDetails(candidate)
              }
            >
              View Details
            </button>
          </div>
        </article>
      );
    });

  // =====================================================
  // MAIN PAGE CONTENT
  // =====================================================

  const renderMainContent = () => {
    // =================================================
    // DASHBOARD
    // =================================================

    if (activeMenu === "dashboard") {
      return (
        <main
          className="dashboard-main content-page-animation"
        >
          <section className="welcome-section">
            <h1>
              Hello <strong>{firstName}!</strong>
            </h1>

            <p>Welcome to Votara</p>
          </section>

          <div className="dashboard-grid">
            {/* LEFT COLUMN */}

            <div className="left-column">
              <section className="election-card main-hover-card">
                <h2>Ongoing Elections</h2>

                <h3>
                  President Student
                  <br />
                  Council
                </h3>

                <button
                  type="button"
                  className="vote-button"
                  onClick={() =>
                    handleMenuClick("vote")
                  }
                >
                  Vote
                </button>
              </section>

              <section className="results-card main-hover-card">
                <div className="results-header">
                  <h3>Live Results</h3>
                </div>

                <div className="position-title">
                  <button
                    type="button"
                    className="chart-arrow"
                  >
                    ‹
                  </button>

                  <h2>
                    President Student Council
                  </h2>

                  <button
                    type="button"
                    className="chart-arrow"
                  >
                    ›
                  </button>
                </div>

                <div className="chart">
                  <div className="chart-row">
                    <span className="candidate-name">
                      Ryan
                    </span>

                    <div className="bar-area">
                      <div
                        className="bar ryan"
                        style={{
                          width: "35%",
                        }}
                      />
                    </div>

                    <span className="vote-count">
                      16
                    </span>
                  </div>

                  <div className="chart-row">
                    <span className="candidate-name">
                      Rev
                    </span>

                    <div className="bar-area">
                      <div
                        className="bar rev"
                        style={{
                          width: "88%",
                        }}
                      />
                    </div>

                    <span className="vote-count">
                      45
                    </span>
                  </div>

                  <div className="chart-row">
                    <span className="candidate-name">
                      Mathew
                    </span>

                    <div className="bar-area">
                      <div
                        className="bar mathew"
                        style={{
                          width: "52%",
                        }}
                      />
                    </div>

                    <span className="vote-count">
                      27
                    </span>
                  </div>

                  <div className="chart-row">
                    <span className="candidate-name">
                      Mark
                    </span>

                    <div className="bar-area">
                      <div
                        className="bar mark"
                        style={{
                          width: "74%",
                        }}
                      />
                    </div>

                    <span className="vote-count">
                      38
                    </span>
                  </div>
                </div>
              </section>

              <section className="announcement-card main-hover-card">
                <h3>Announcements</h3>

                <p>
                  Polls close in before 4pm
                </p>

                <div className="announcement-line" />

                <button type="button">
                  See all ›
                </button>
              </section>

              <section className="faq-section">
                <h3>FAQs</h3>

                <div className="faq-list">
                  {faqs.map(
                    (faq, index) => (
                      <div
                        className="faq-item"
                        key={index}
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
                          {faq.question}
                        </button>

                        {selectedFaq ===
                          index && (
                          <div className="faq-answer">
                            {faq.answer}
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
                <h3>Calendar</h3>

                <div className="calendar-tabs">
                  {[
                    "Today",
                    "Next week",
                    "This Month",
                  ].map((tab) => (
                    <button
                      type="button"
                      key={tab}
                      className={
                        calendarTab === tab
                          ? "selected-tab"
                          : ""
                      }
                      onClick={() =>
                        setCalendarTab(tab)
                      }
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="time-row">
                  <span>7:00</span>
                  <span>8:00</span>
                  <span>9:00</span>
                  <span>10:00</span>
                  <span>11:00</span>
                </div>

                <div className="calendar-line" />

                <div className="election-time">
                  <div className="date">
                    <strong>September</strong>
                    <span>10</span>
                  </div>

                  <div className="countdown">
                    <small>
                      President Student Council
                    </small>

                    <div className="countdown-values">
                      <span>
                        <strong>00</strong>
                        DAYS
                      </span>

                      <span>
                        <strong>07</strong>
                        HOURS
                      </span>

                      <span>
                        <strong>42</strong>
                        MINS
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="process-card main-hover-card">
                <h3>Voting Process</h3>

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
                    [
                      "5",
                      "Present QR",
                      "",
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
                          index === 4
                            ? "last"
                            : ""
                        }`}
                        key={number}
                      >
                        <div
                          className={`process-number ${
                            index === 4
                              ? "inactive"
                              : ""
                          }`}
                        >
                          {number}
                        </div>

                        <div className="process-text">
                          <strong>
                            {title}
                          </strong>

                          {description && (
                            <span>
                              {description}
                            </span>
                          )}
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

    if (activeMenu === "vote") {
      return (
        <main
          className="vote-main content-page-animation"
        >
          <section className="vote-heading">
            <h1>
              You May Now Cast Your Votes!
            </h1>
          </section>

          <section className="vote-position-section">
            <div className="vote-position-heading">
              <h2>
                President Student Council
              </h2>

              <p>
                You can only vote for one
                Candidate
              </p>
            </div>

            <div className="candidate-grid">
              {renderCandidateCards(
                "president",
                candidates.president
              )}
            </div>
          </section>

          <section className="vote-position-section">
            <div className="vote-position-heading">
              <h2>
                Vice President Student Council
              </h2>

              <p>
                You can only vote for one
                Candidate
              </p>
            </div>

            <div className="candidate-grid">
              {renderCandidateCards(
                "vicePresident",
                candidates.vicePresident
              )}
            </div>
          </section>

          <section className="vote-submit-section">
            <p>
              Double check your choices before
              submitting your votes
            </p>

            <button
              type="button"
              className="submit-vote-button"
              onClick={handleSubmitVotes}
            >
              SUBMIT VOTE
            </button>
          </section>
        </main>
      );
    }

    // =================================================
    // GUIDELINES PAGE
    // =================================================

    if (activeMenu === "guidelines") {
      const guidelines = [
        "Before voting, take the time to research the candidates and issues on the ballot.",
        "Make sure you are eligible to vote in the election.",
        "Only currently enrolled students are eligible to participate.",
        "Each authenticated account or student ID is restricted to a single submission.",
        "Voters will only see candidates and positions relevant to their specific year level and department.",
        "Personal IDs are separated from cast ballots in the database to ensure anonymity.",
        "Cast your vote within the official voting schedule and portal availability hours.",
        "Ensure you have a stable internet connection before submitting your ballot.",
        "Cast your vote within the official voting schedule and portal availability hours.",
        "Review your chosen candidates carefully before finalizing your submission, as votes cannot be changed once submitted.",
        "Do not share your login credentials or authentication code with anyone.",
        "Report any technical glitches or voting issues to the election committee immediately.",
        "Log out of your account after successfully submitting your ballot to protect your privacy.",
      ];

      return (
        <main
          className="guidelines-main content-page-animation"
        >
          <section className="guidelines-container">
            <h1>
              Voters Guidelines
            </h1>

            <div className="guidelines-list">
              {guidelines.map(
                (guideline, index) => (
                  <button
                    type="button"
                    className="guideline-item"
                    key={index}
                    onClick={() =>
                      alert(guideline)
                    }
                  >
                    <span className="guideline-dot" />

                    <span>
                      {guideline}
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

    if (activeMenu === "settings") {
      return (
        <main
          className="settings-main content-page-animation"
        >
          <section className="settings-container">
            <h1>ACCOUNT</h1>

            <div className="settings-grid">
              <div className="settings-column">
                {settingsItems
                  .slice(0, 4)
                  .map((item) => (
                    <button
                      type="button"
                      className="settings-item"
                      key={item}
                      onClick={() =>
                        setSettingsModal(item)
                      }
                    >
                      <span className="settings-left">
                        <span className="settings-dot">
                          ●
                        </span>

                        {item}
                      </span>

                      <span>›</span>
                    </button>
                  ))}
              </div>

              <div className="settings-column">
                {settingsItems
                  .slice(4)
                  .map((item) => (
                    <button
                      type="button"
                      className="settings-item"
                      key={item}
                      onClick={() =>
                        setSettingsModal(item)
                      }
                    >
                      <span className="settings-left">
                        <span className="settings-dot">
                          ●
                        </span>

                        {item}
                      </span>

                      <span>›</span>
                    </button>
                  ))}
              </div>
            </div>
          </section>
        </main>
      );
    }

    // =================================================
    // QR PAGE
    // =================================================

    if (activeMenu === "qr") {
      return (
        <main
          className="qr-main content-page-animation"
        >
          <section className="qr-container">
            <div className="qr-image-wrapper">
              <img
                src={qrCodeIcon}
                alt="Voting QR Code"
                className="large-qr-code"
              />
            </div>

            <div className="qr-guide">
              <h2>Guide:</h2>

              <div>
                <p>
                  The student proceeds to their
                  designated precinct after casting
                  their online ballot.
                </p>

                <p>
                  The student presents a valid
                  Physical ID card alongside their
                  digital Voting Receipt featuring the
                  QR code.
                </p>

                <p>
                  The Electoral Board member opens
                  the Precinct Scanner Interface on
                  the official scanner device. Hold
                  the QR code approximately 4 to 8
                  inches away from the scanner
                  camera, ensuring full visibility and
                  proper lighting. Wait for the system
                  confirmation on the screen.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="qr-action-button"
              onClick={() =>
                alert(
                  "Your QR code is ready to present to the precinct scanner."
                )
              }
            >
              VIEW VOTING RECEIPT
            </button>
          </section>
        </main>
      );
    }

    return null;
  };

  // =====================================================
  // RETURN
  // =====================================================

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
                (previous) => !previous
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
              src={votaraLogoSrc}
              alt="Votara"
              className="votara-logo"
            />

            <span>Votara</span>
          </div>
        </div>

        {/* SEARCH */}

        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(event) =>
              setSearchValue(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
          />

          <button
            type="button"
            className="search-button"
            aria-label="Search"
            onClick={handleSearch}
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
              alert("You have no new notifications.")
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
              handleMenuClick("guidelines")
            }
          >
            ?
          </button>

          <div className="nav-profile">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={fullName}
                className="nav-profile-image"
              />
            ) : (
              <div className="nav-profile-placeholder">
                {initials}
              </div>
            )}

            <span>{firstName}</span>
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
                src={profilePicture}
                alt={fullName}
                className="profile-picture"
              />
            ) : (
              <div className="profile-placeholder">
                {initials}
              </div>
            )}

            <div className="profile-details">
              <h3>{fullName}</h3>

              <button
                type="button"
                onClick={() =>
                  setSettingsModal("Edit profile")
                }
              >
                Show Profile
              </button>
            </div>
          </div>

          <nav className="sidebar-menu">
            {sidebarItems.map((item) => {
              const isActive =
                activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-item ${
                    isActive ? "active" : ""
                  }`}
                  onClick={() =>
                    handleMenuClick(item.id)
                  }
                >
                  <span className="sidebar-icon-wrapper">
                    <img
                      src={item.icon}
                      alt=""
                      className={`sidebar-menu-icon normal-icon ${
                        isActive
                          ? "hide-icon"
                          : ""
                      }`}
                    />

                    <img
                      src={item.activeIcon}
                      alt=""
                      className={`sidebar-menu-icon active-icon ${
                        isActive
                          ? "show-icon"
                          : ""
                      }`}
                    />
                  </span>

                  <span className="sidebar-label">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="sidebar-bottom">
            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
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
            setSettingsModal(null)
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
                setSettingsModal(null)
              }
            >
              ×
            </button>

            <h2>{settingsModal}</h2>

            <p>
              This section is ready to be connected
              to its corresponding feature or API.
            </p>

            <button
              type="button"
              className="modal-confirm-button"
              onClick={() =>
                setSettingsModal(null)
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