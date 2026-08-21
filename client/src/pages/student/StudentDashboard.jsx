// StudentDashboard.jsx

import { useEffect, useState } from "react";
import "./StudentDashboard.css";

// =====================================================
// LOGO SRC - CHANGE THIS PATH TO YOUR IMAGE
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

function StudentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [calendarTab, setCalendarTab] = useState("Today");
  const [selectedFaq, setSelectedFaq] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:5000/api/student/current",
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

  const handleMenuClick = (id) => {
    setActiveMenu(id);
  };

  const fullName = student?.fullName || "Arthur Morgan";
  const firstName = fullName.split(" ")[0] || "Arthur";

  const initials = fullName
    .split(" ")
    .map((name) => name.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const profilePicture = student?.profilePicture;

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

  if (loading) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="student-dashboard">
      {/* ================= NAVBAR ================= */}

      <header className="top-navbar">
        <div className="nav-left">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
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

        <div className="search-container">
          <input
            type="text"
            placeholder="Search"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />

          <button
            type="button"
            className="search-button"
            aria-label="Search"
          >
            ⌕
          </button>
        </div>

        <div className="nav-right">
          <button
          
            type="button"
            className="nav-icon-button"
            aria-label="Notifications"
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
            sidebarOpen ? "sidebar-open" : "sidebar-collapsed"
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
              <div className="profile-placeholder">{initials}</div>
            )}

            <div className="profile-details">
              <h3>{fullName}</h3>

              <button type="button">Show Profile</button>
            </div>
          </div>

          <nav className="sidebar-menu">
            {sidebarItems.map((item) => {
              const isActive = activeMenu === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  <span className="sidebar-icon-wrapper">
                    <img
                      src={item.icon}
                      alt=""
                      className={`sidebar-menu-icon normal-icon ${
                        isActive ? "hide-icon" : ""
                      }`}
                    />

                    <img
                      src={item.activeIcon}
                      alt=""
                      className={`sidebar-menu-icon active-icon ${
                        isActive ? "show-icon" : ""
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
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("student");
                window.location.href = "/";
              }}
            >
              <img
      src="/src/images/logoutalt.png"
      alt="Log out"
      className="logout-image"
    />
              <span className="logout-text">Log out</span>
            </button>
          </div>
        </aside>

        {/* ================= MAIN CONTENT ================= */}

        <main className="dashboard-main">
          <section className="welcome-section">
            <h1>
              Hello <strong>{firstName}!</strong>
            </h1>

            <p>Welcome to Votara</p>
          </section>

          <div className="dashboard-grid">
            {/* ================= LEFT COLUMN ================= */}

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
                  onClick={() => handleMenuClick("vote")}
                >
                  Vote
                </button>
              </section>

              <section className="results-card main-hover-card">
                <div className="results-header">
                  <h3>Live Results</h3>
                </div>

                <div className="position-title">
                  <button type="button" className="chart-arrow">
                    ‹
                  </button>

                  <h2>President Student Council</h2>

                  <button type="button" className="chart-arrow">
                    ›
                  </button>
                </div>

                <div className="chart">
                  <div className="chart-row">
                    <span className="candidate-name">Ryan</span>

                    <div className="bar-area">
                      <div
                        className="bar ryan"
                        style={{ width: "35%" }}
                      />
                    </div>

                    <span className="vote-count">16</span>
                  </div>

                  <div className="chart-row">
                    <span className="candidate-name">Rev</span>

                    <div className="bar-area">
                      <div
                        className="bar rev"
                        style={{ width: "88%" }}
                      />
                    </div>

                    <span className="vote-count">45</span>
                  </div>

                  <div className="chart-row">
                    <span className="candidate-name">Mathew</span>

                    <div className="bar-area">
                      <div
                        className="bar mathew"
                        style={{ width: "52%" }}
                      />
                    </div>

                    <span className="vote-count">27</span>
                  </div>

                  <div className="chart-row">
                    <span className="candidate-name">Mark</span>

                    <div className="bar-area">
                      <div
                        className="bar mark"
                        style={{ width: "74%" }}
                      />
                    </div>

                    <span className="vote-count">38</span>
                  </div>
                </div>
              </section>

              <section className="announcement-card main-hover-card">
                <h3>Announcements</h3>

                <p>Polls close in before 4pm</p>

                <div className="announcement-line" />

                <button type="button">See all ›</button>
              </section>

              <section className="faq-section">
                <h3>FAQs</h3>

                <div className="faq-list">
                  {faqs.map((faq, index) => (
                    <div className="faq-item" key={index}>
                      <button
                        type="button"
                        className={`faq-button ${
                          selectedFaq === index
                            ? "faq-active"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedFaq(
                            selectedFaq === index
                              ? null
                              : index
                          )
                        }
                      >
                        {faq.question}
                      </button>

                      {selectedFaq === index && (
                        <div className="faq-answer">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* ================= RIGHT COLUMN ================= */}

            <div className="right-column">
              <section className="calendar-card main-hover-card">
                <h3>Calendar</h3>

                <div className="calendar-tabs">
                  {["Today", "Next week", "This Month"].map(
                    (tab) => (
                      <button
                        type="button"
                        key={tab}
                        className={
                          calendarTab === tab
                            ? "selected-tab"
                            : ""
                        }
                        onClick={() => setCalendarTab(tab)}
                      >
                        {tab}
                      </button>
                    )
                  )}
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
                    <small>President Student Council</small>

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
                  <div className="process-item">
                    <div className="process-number">1</div>

                    <div className="process-text">
                      <strong>Verify identity</strong>
                      <span>
                        Confirm your student ID to unlock ballots
                      </span>
                    </div>
                  </div>

                  <div className="process-item">
                    <div className="process-number">2</div>

                    <div className="process-text">
                      <strong>Review candidates</strong>
                      <span>
                        Check profiles and platforms before choosing
                      </span>
                    </div>
                  </div>

                  <div className="process-item">
                    <div className="process-number">3</div>

                    <div className="process-text">
                      <strong>Cast your vote</strong>
                      <span>
                        Select one candidate per position
                      </span>
                    </div>
                  </div>

                  <div className="process-item">
                    <div className="process-number">4</div>

                    <div className="process-text">
                      <strong>Submit and confirm</strong>
                      <span>
                        Get a confirmation once your vote is recorded
                      </span>
                    </div>
                  </div>

                  <div className="process-item last">
                    <div className="process-number inactive">
                      5
                    </div>

                    <div className="process-text">
                      <strong>Present QR</strong>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default StudentDashboard;