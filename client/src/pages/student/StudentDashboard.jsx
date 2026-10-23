import PlatformNotifications from '../../components/PlatformNotifications';
import { useEffect, useMemo, useRef, useState } from "react";
import "./StudentDashboard.css";
import "./Settings.css";
import "./StudentDashboard.workspace.css";
import "./StudentNavbar.css";
import StudentDotIcon from "../../components/student/StudentDotIcon";
import { FiLogOut, FiMenu, FiMoon, FiSearch, FiSun } from "react-icons/fi";
import Profile from "./Profile";
import api, { clearAccountSession, getStudentToken } from "../../services/api";
import useAccountSession from "../../hooks/useAccountSession";
import {
    getPartyListsForElection,
    getPartyListCandidates,
} from "../../services/partyListService";

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


import {
    getStudentProfile,
    getPublishedStudentResults,
    changeStudentPassword,
} from "../../services/studentService";



// =====================================================
// VITE ASSET IMPORTS
// Import local images and Figma SVGs so Vite bundles them
// correctly for both local development and Vercel.
// =====================================================

import votaraLogoSrc from "../../images/Votara.png";
import dashboardIcon from "../../assets/icons/student/dashboard.svg";
import voteIcon from "../../assets/icons/student/vote.svg";
import candidatesIcon from "../../images/Candidates.png";
import resultsIcon from "../../images/Results.png";
import guidelinesIcon from "../../assets/icons/student/guidelines.svg";
import settingsIcon from "../../assets/icons/student/settings.svg";
import logoutIcon from "../../images/logoutalt.png";
import bellIcon from "../../images/bell.png";

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


const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.PROD
        ? "https://votara-api-olij.onrender.com/api"
        : "http://localhost:5000/api")
).replace(/\/api\/?$/, "");

const resolveImageUrl = (value) => {
    if (!value) return "";

    if (typeof value === "object") {
        value =
            value.url ||
            value.publicUrl ||
            value.public_url ||
            value.path ||
            value.filePath ||
            "";
    }

    if (!value) return "";

    const raw = String(value).trim();

    if (!raw) return "";

    if (
        raw.startsWith("data:image/") ||
        raw.startsWith("blob:") ||
        raw.startsWith("http://") ||
        raw.startsWith("https://")
    ) {
        return raw;
    }

    if (raw.startsWith("//")) {
        return `https:${raw}`;
    }

    if (raw.startsWith("/src/")) {
        return raw;
    }

    if (raw.startsWith("/")) {
        return `${API_BASE_URL}${raw}`;
    }

    return `${API_BASE_URL}/${raw.replace(/^\/+/, "")}`;
};

const getProfilePictureValue = (studentData) => {
    if (!studentData) return "";

    return (
        studentData.profilePicture ||
        studentData.profilePictureUrl ||
        studentData.profile_picture_url ||
        studentData.profile_picture ||
        studentData.profilePhotoUrl ||
        studentData.profile_photo_url ||
        studentData.profilePhotoStoragePath ||
        studentData.profile_photo_storage_path ||
        studentData.avatar ||
        studentData.avatar_url ||
        studentData.photo ||
        studentData.photo_url ||
        ""
    );
};

const getElectionStatus = (value) =>
    String(value || "").trim().toLowerCase();

const ELECTION_STATUS_LABELS = {
    draft: "Draft",
    scheduled: "Scheduled",
    open: "Voting Open",
    closed: "Voting Closed",
    cancelled: "Cancelled",
};

const ELECTION_STATUS_CLASSES = {
    draft: "status-draft",
    scheduled: "status-scheduled",
    open: "status-open",
    closed: "status-closed",
    cancelled: "status-cancelled",
};

// =====================================================
// COMPONENT
// =====================================================

function StudentDashboard() {
    useAccountSession("student");
    const contentScrollRef = useRef(null);
    const [platformUpdate,setPlatformUpdate]=useState(null);
    const [studentTheme, setStudentTheme] = useState(() => {
        try { return localStorage.getItem("votaraStudentTheme") === "dark" ? "dark" : "light"; }
        catch { return "light"; }
    });
    useEffect(() => {
        try { localStorage.setItem("votaraStudentTheme", studentTheme); } catch { /* Storage may be disabled. */ }
        window.dispatchEvent(new Event("votara-student-theme"));
    }, [studentTheme]);

    // =================================================
    // GENERAL DASHBOARD STATE
    // =================================================

const [partyLists, setPartyLists] = useState([]);
const [partyListsLoading, setPartyListsLoading] = useState(false);
const [partyListsError, setPartyListsError] = useState("");
const [studentResults, setStudentResults] = useState(null);
const [resultsLoading, setResultsLoading] = useState(false);
const [resultsError, setResultsError] = useState("");

const [selectedPartyList, setSelectedPartyList] = useState(null);
const [partyRoster, setPartyRoster] = useState([]);
const [partyRosterLoading, setPartyRosterLoading] = useState(false);
const [partyRosterError, setPartyRosterError] = useState("");


    const [sidebarOpen, setSidebarOpen] = useState(
    () => window.matchMedia("(min-width: 721px)").matches
);

useEffect(() => {
    const desktop = window.matchMedia("(min-width: 721px)");
    const handleBreakpointChange = event => setSidebarOpen(event.matches);
    desktop.addEventListener("change", handleBreakpointChange);
    return () => desktop.removeEventListener("change", handleBreakpointChange);
}, []);
    const [activeMenu, setActiveMenu] = useState("dashboard");
    useEffect(() => { contentScrollRef.current?.scrollTo({ top: 0, behavior: "instant" }); }, [activeMenu]);
    useEffect(() => {
        const closeDrawer = event => { if (event.key === "Escape") setSidebarOpen(false); };
        window.addEventListener("keydown", closeDrawer);
        return () => window.removeEventListener("keydown", closeDrawer);
    }, []);
    const [activeSidebarItem, setActiveSidebarItem] = useState("dashboard");

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    // Keep an actively viewed student session alive. The server extends its
    // 30-minute idle window for authenticated requests; this small heartbeat
    // also renews the 8-hour JWT while the dashboard remains visible.
    useEffect(() => {
        let refreshInFlight = false;

        const refreshSession = async () => {
            if (document.visibilityState !== "visible" || refreshInFlight) return;
            const token = getStudentToken();
            if (!token) return;

            refreshInFlight = true;
            try {
                const response = await api.post(
                    "/auth/session/keepalive",
                    {},
                    { headers: { Authorization: `Bearer ${token}` }, timeout: 10000 }
                );
                const renewedToken = response?.data?.token;
                if (renewedToken && getStudentToken() === token) {
                    localStorage.setItem("votaraToken", renewedToken);
                }
            } catch (error) {
                // Keep the dashboard open; ordinary API handling can surface
                // a genuinely expired or unavailable session without a loop.
                console.warn("Student session renewal was unsuccessful:", error?.message);
            } finally {
                refreshInFlight = false;
            }
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") refreshSession();
        };

        const timer = window.setInterval(refreshSession, 5 * 60 * 1000);
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, []);

    const [searchValue, setSearchValue] = useState("");
    const [calendarTab, setCalendarTab] = useState("Today");
    const [selectedFaq, setSelectedFaq] = useState(null);

    const [settingsModal, setSettingsModal] = useState(null);
    const profileDialog = useRef(null);
    const studentLogoutInProgress = useRef(false);
    useEffect(() => {
        if (settingsModal === "Edit profile" && profileDialog.current && !profileDialog.current.open) profileDialog.current.showModal();
    }, [settingsModal]);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [passwordError, setPasswordError] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

    // Student issue reports
    const [reportView, setReportView] = useState("");
    const [reportDraft, setReportDraft] = useState({ category: "", subject: "", description: "", contactEmail: "", attachment: null });
    const [reportHistory, setReportHistory] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportHistoryTimeline, setReportHistoryTimeline] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportError, setReportError] = useState("");
    const [submittedReport, setSubmittedReport] = useState(null);


    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [profileImageError, setProfileImageError] = useState(false);
    const [profileImageVersion, setProfileImageVersion] = useState(0);

    // =================================================
    // ELECTION / VOTING STATE
    // =================================================

    const [election, setElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [candidates, setCandidates] = useState([]);

    // Stores selections as:
    // { positionId: candidateId }
    const [selectedVotes, setSelectedVotes] = useState({});
    const [selectedCandidateDetails, setSelectedCandidateDetails] =
    useState(null);

    const [electionLoading, setElectionLoading] = useState(true);
    const [electionError, setElectionError] = useState("");

    const [voteLoading, setVoteLoading] = useState(false);
    const [ballotReview,setBallotReview]=useState(false);
    const [voteFeedback,setVoteFeedback]=useState("");
    const [hasVoted, setHasVoted] = useState(false);
    const [voteConfirmation, setVoteConfirmation] = useState(null);

    // =================================================
    // FETCH CURRENT STUDENT
    // =================================================

    useEffect(() => {
        let cancelled = false;

        const readStoredStudent = () => {
            try {
                const stored = localStorage.getItem("votaraStudent");
                return stored ? JSON.parse(stored) : null;
            } catch (storageError) {
                console.warn("Unable to read stored student profile:", storageError);
                return null;
            }
        };

        const mergeStudentProfile = (storedStudent, serverStudent) => {
            const stored = storedStudent || {};
            const server = serverStudent || {};

            // Do not let an empty API photo field erase the saved image.
            const storedPhoto = getProfilePictureValue(stored);
            const serverPhoto = getProfilePictureValue(server);

            const merged = {
                ...stored,
                ...server,
            };

            if (serverPhoto) {
                merged.profilePicture = serverPhoto;
            } else if (storedPhoto) {
                merged.profilePicture = storedPhoto;
            }

            // Normalize common backend field names without replacing valid values.
            merged.fullName =
                server.fullName || server.full_name ||
                stored.fullName || stored.full_name || "Student";
            merged.yearLevel =
                server.yearLevel ?? server.year_level ??
                stored.yearLevel ?? stored.year_level ?? "";

            return merged;
        };

        const fetchStudent = async () => {
            const storedStudent = readStoredStudent();
            const token = getStudentToken();

            // Show the saved account immediately while the server refresh runs.
            if (!cancelled && storedStudent) {
                setStudent(storedStudent);
            }

            if (!token) {
                if (!cancelled) {
                    setStudent(null);
                    setLoading(false);
                    window.location.replace("/student-login");
                }
                return;
            }

            try {
                let serverStudent = null;

                // Use the configured API service first. It has the correct
                // production URL and attaches the current student token.
                try {
                    const profileResponse = await getStudentProfile();
                    if (profileResponse?.success && profileResponse?.student) {
                        serverStudent = profileResponse.student;
                    }
                } catch (profileError) {
                    console.warn(
                        "Unable to refresh student profile from /students/profile:",
                        profileError
                    );
                }

                // Legacy fallback, using the configured API host rather than
                // localhost so deployed mobile browsers do not call themselves.
                if (!serverStudent) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        });
                        const data = await response.json().catch(() => ({}));
                        if (response.ok && data?.success && data?.student) {
                            serverStudent = data.student;
                        }
                    } catch (authError) {
                        console.warn("Unable to refresh student from /auth/me:", authError);
                    }
                }

                if (cancelled) return;

                if (serverStudent) {
                    const mergedStudent = mergeStudentProfile(storedStudent, serverStudent);
                    setStudent(mergedStudent);
                    try {
                        localStorage.setItem("votaraStudent", JSON.stringify(mergedStudent));
                    } catch (storageError) {
                        console.warn("Unable to cache refreshed student profile:", storageError);
                    }
                } else if (storedStudent) {
                    // Keep the cached profile visible during temporary API failures.
                    setStudent(storedStudent);
                } else {
                    setStudent(null);
                }
            } catch (error) {
                console.error("Unable to load student:", error);
                if (!cancelled) {
                    setStudent(storedStudent || null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchStudent();

        return () => {
            cancelled = true;
        };
    }, []);

    // =================================================
    // LOAD ACTIVE ELECTION
    // =================================================

    
useEffect(() => {
    let mounted = true;
    let requestInFlight = false;
    let refreshTimer;

    const loadElectionData = async (silent = false) => {
        if (requestInFlight) return;

        requestInFlight = true;

        if (!silent) {
            setElectionLoading(true);
        }

        try {
            setElectionError("");

            const electionResponse = await getActiveElection();

            if (!mounted) return;

            const activeElection = extractElection(electionResponse);

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
                getElectionConfiguration(activeElection.id),
                getApprovedCandidatesForElection(activeElection.id),
            ]);

            if (!mounted) return;

            setPositions(
                extractArray(configurationResponse, "positions")
            );

            setCandidates(
                extractArray(candidateResponse, "candidates")
            );

            try {
                const voteStatus = await checkVoteStatus(
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
            if (!mounted) return;

            // No active election is a normal state.
            if (error?.response?.status === 404) {
                setElection(null);
                setPositions([]);
                setCandidates([]);
                setHasVoted(false);
                setElectionError("");
            } else {
                console.error(
                    "Unable to refresh election data:",
                    error
                );

                // Keep previously loaded data during temporary
                // network failures instead of blanking the dashboard.
                if (!silent) {
                    setElectionError(
                        error?.response?.data?.message ||
                        error?.message ||
                        "Unable to load the current election."
                    );
                }
            }
        } finally {
            requestInFlight = false;

            if (mounted && !silent) {
                setElectionLoading(false);
            }
        }
    };

    const refreshElection = () => {
        if (document.visibilityState === "visible") {
            loadElectionData(true);
        }
    };

    // Load immediately when the dashboard opens.
    loadElectionData(false);

    // Check for EB election changes every 15 seconds.
    refreshTimer = window.setInterval(() => {
        refreshElection();
    }, 15000);

    // Refresh immediately when the student returns to this tab.
    document.addEventListener("visibilitychange", refreshElection);

    return () => {
        mounted = false;
        window.clearInterval(refreshTimer);
        document.removeEventListener(
            "visibilitychange",
            refreshElection
        );
    };
}, []);

// =================================================
// LOAD EB-APPROVED PARTY LISTS FOR THE ACTIVE ELECTION
// =================================================

useEffect(() => {
    let cancelled = false;

    const loadPartyLists = async () => {
        if (!election?.id) {
            setPartyLists([]);
            return;
        }

        setPartyListsLoading(true);
        setPartyListsError("");

        try {
            const response = await getPartyListsForElection(election.id);

            const rows = Array.isArray(response?.data)
                ? response.data
                : [];

            const approvedLists = rows.filter(
                (party) =>
                    String(party.approval_status || "").toLowerCase() === "approved" &&
                    party.is_active === true
            );

            if (!cancelled) {
                setPartyLists(approvedLists);
            }
        } catch (error) {
            if (!cancelled) {
                setPartyLists([]);
                setPartyListsError(
                    error?.response?.data?.message ||
                    "Unable to load approved party lists."
                );
            }
        } finally {
            if (!cancelled) {
                setPartyListsLoading(false);
            }
        }
    };

    loadPartyLists();

    return () => {
        cancelled = true;
    };
}, [election?.id]);

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

            
        const profilePictureValue = getProfilePictureValue(student);

        const resolvedProfilePicture = resolveImageUrl(profilePictureValue);

        const isEmbeddedImage =
            resolvedProfilePicture.startsWith("data:image/") ||
            resolvedProfilePicture.startsWith("blob:");

        const isSignedStorageUrl =
            resolvedProfilePicture.includes("/storage/v1/object/sign/");

        const profilePicture =
            resolvedProfilePicture &&
            !isEmbeddedImage &&
            !isSignedStorageUrl
                ? `${resolvedProfilePicture}${
                    resolvedProfilePicture.includes("?") ? "&" : "?"
                }v=${profileImageVersion}`
                : resolvedProfilePicture;


    useEffect(() => {
        setProfileImageError(false);
    }, [profilePicture]);

    const studentYearLevel =
        normalizeYearLevel(
            student?.yearLevel
        );

    const studentEligible =
        ["2nd Year", "3rd Year", "4th Year"].includes(
            studentYearLevel
        );

    const electionStatus =
        getElectionStatus(election?.status);

    const electionStatusLabel =
        ELECTION_STATUS_LABELS[electionStatus] ||
        "No Election";

    const electionStatusClass =
        ELECTION_STATUS_CLASSES[electionStatus] ||
        "status-none";

    const electionIsOpen =
        electionStatus === "open" &&
        election?.is_published !== false;

    const electionIsScheduled =
        electionStatus === "scheduled";

    const electionIsClosed =
        electionStatus === "closed";

    const electionIsCancelled =
        electionStatus === "cancelled";

    const studentCanVote =
        Boolean(electionIsOpen) &&
        studentEligible &&
        !hasVoted &&
        !voteLoading;

    // =================================================
    // SIDEBAR ITEMS
    // =================================================

    
const sidebarItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: dashboardIcon,
        activeIcon: dashboardIcon,
    },
    {
        id: "vote",
        label: "Vote",
        icon: voteIcon,
        activeIcon: voteIcon,
    },
    {
        id: "candidates",
        label: "Candidates",
        icon: candidatesIcon,
        activeIcon: candidatesIcon,
    },
    {
        id: "results",
        label: "Results",
        icon: resultsIcon,
        activeIcon: resultsIcon,
    },
    {
        id: "guidelines",
        label: "Voters Guidelines",
        icon: guidelinesIcon,
        activeIcon: guidelinesIcon,
    },
    {
        id: "settings",
        label: "Settings",
        icon: settingsIcon,
        activeIcon: settingsIcon,
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
// GROUP ACTIVE CANDIDATES BY POSITION
// =================================================

const candidatesByPosition = useMemo(() => {
    const grouped = {};

    eligiblePositions.forEach(
        (position) => {

            const positionId =
                String(
                    position.id || ""
                ).trim();

            grouped[position.id] =
                candidates.filter(
                    (candidate) => {

                        const candidatePositionId =
                            String(
                                candidate.position_id ||
                                candidate.positionId ||
                                candidate.position?.id ||
                                ""
                            ).trim();

                        return (
                            candidatePositionId ===
                                positionId &&
                            candidate.is_active !==
                                false
                        );
                    }
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
    setActiveSidebarItem(id);
    setActiveMenu(id);

    if (window.matchMedia("(max-width: 720px)").matches) {
        setSidebarOpen(false);
    }

    contentScrollRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
    });
};


// =================================================
// OPEN PARTY LIST AND LOAD ITS CANDIDATES
// =================================================

const handleOpenPartyList = async (partyList) => {
    setSelectedPartyList(partyList);
    setPartyRoster([]);
    setPartyRosterError("");
    setPartyRosterLoading(true);

    try {
        const response = await getPartyListCandidates(partyList.id);

        const rows = Array.isArray(response?.data)
            ? response.data
            : [];

        const approvedCandidates = rows.filter(
            (candidate) =>
                candidate.is_active === true &&
                String(candidate.approval_status || "").toLowerCase() === "approved" &&
                String(candidate.election_id) === String(election?.id)
        );

        setPartyRoster(approvedCandidates);
    } catch (error) {
        setPartyRosterError(
            error?.response?.data?.message ||
            "Unable to load candidates for this party list."
        );
    } finally {
        setPartyRosterLoading(false);
    }
};


    // =================================================
    // FAQ
    // =================================================

    const faqs = [
        {
            question: "Where can I see historical results?",
            answer:
                "You can participate in the election by selecting the Vote section from the sidebar.",
        },
        {
            question: "Can I view results without logging in?",
            answer:
                "Review the available candidates and select your preferred candidate before submitting your vote.",
        },
        {
            question: "How is my vote protected?",
            answer:
                "Once your vote is submitted and confirmed, your participation will be recorded.",
        },
        {
            question: "Can I change my vote after submitting?",
            answer:
                "Once your vote is submitted and confirmed, you won't be able to change it.",
        },
         {
            question: "Who can create an election?",
            answer:
                "Those Electoral Board.",
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
    // CHANGE PASSWORD
    // =================================================

    const passwordRequirements = [
        {
            label: "At least 8 characters",
            valid: passwordForm.newPassword.length >= 8,
        },
        {
            label: "At least one uppercase letter",
            valid: /[A-Z]/.test(passwordForm.newPassword),
        },
        {
            label: "At least one lowercase letter",
            valid: /[a-z]/.test(passwordForm.newPassword),
        },
        {
            label: "At least one number",
            valid: /\d/.test(passwordForm.newPassword),
        },
        {
            label: "At least one special character",
            valid: /[^A-Za-z0-9]/.test(passwordForm.newPassword),
        },
    ];

    const closePasswordModal = () => {
        if (passwordLoading) return;
        setSettingsModal(null);
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setPasswordError("");
        setPasswordChangeSuccess(false);
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();
        setPasswordError("");

        if (!passwordForm.currentPassword) {
            setPasswordError("Enter your current password.");
            return;
        }

        if (!passwordRequirements.every((item) => item.valid)) {
            setPasswordError("Please meet all the password requirements.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError("Your new passwords do not match.");
            return;
        }

        if (passwordForm.currentPassword === passwordForm.newPassword) {
            setPasswordError("Your new password must differ from your current password.");
            return;
        }

        try {
            setPasswordLoading(true);
            const result = await changeStudentPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
                confirmPassword: passwordForm.confirmPassword,
            });

            if (result?.success === false) {
                throw new Error(result.message || "Unable to update your password.");
            }

            setPasswordChangeSuccess(true);
        } catch (error) {
            setPasswordError(
                error?.response?.data?.message ||
                error?.message ||
                "Unable to update your password. Please try again."
            );
        } finally {
            setPasswordLoading(false);
        }
    };


    // =================================================
    // STUDENT ISSUE REPORTS
    // =================================================

    const reportCategories = [
        "Voting issue",
        "Account or profile",
        "Candidate information",
        "Election results",
        "Other",
    ];

    const openReportCategory = () => {
        const currentEmail = student?.email || student?.email_address || student?.contactEmail || "";
        setReportDraft((current) => ({ ...current, contactEmail: current.contactEmail || currentEmail }));
        setReportError("");
        setSubmittedReport(null);
        setReportView("category");
        setSettingsModal("Report an Issue");
    };

    const loadReportHistory = async () => {
        setSettingsModal("Report an Issue");
        setReportView("history");
        setReportLoading(true);
        setReportError("");
        try {
            const response = await api.get("/students/issues");
            setReportHistory(response.data?.reports || []);
            setReportView("history");
        } catch (error) {
            setReportError(error?.response?.data?.message || error?.message || "Unable to load report history.");
            setReportView("history");
        } finally {
            setReportLoading(false);
        }
    };

    const openReportHistoryDetail = async (report) => {
        setSelectedReport(report);
        setReportHistoryTimeline([]);
        setReportError("");
        setReportView("history-detail");
        try {
            const response = await api.get(`/students/issues/${report.id}/history`);
            setReportHistoryTimeline(response.data?.history || []);
        } catch (error) {
            setReportError(error?.response?.data?.message || error?.message || "Unable to load report updates.");
        }
    };

    const handleReportAttachment = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(file.type)) {
            setReportError("Choose a JPG, PNG, WEBP, or PDF file.");
            event.target.value = "";
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setReportError("Attachment must be 5 MB or smaller.");
            event.target.value = "";
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setReportDraft((current) => ({ ...current, attachment: { name: file.name, type: file.type, data: reader.result } }));
            setReportError("");
        };
        reader.onerror = () => setReportError("Unable to read the selected attachment.");
        reader.readAsDataURL(file);
    };

    const submitIssueReport = async (event) => {
        event.preventDefault();
        setReportSubmitting(true);
        setReportError("");
        try {
            const response = await api.post("/students/issues", reportDraft);
            const report = response.data?.report;
            if (!response.data?.success || !report) throw new Error(response.data?.message || "The report was not saved.");
            setSubmittedReport(report);
            window.dispatchEvent(new Event('votara-student-activity'));
            setReportView("submitted");
        } catch (error) {
            setReportError(error?.response?.data?.message || error?.message || "Unable to submit your report.");
        } finally {
            setReportSubmitting(false);
        }
    };

    const closeReportFlow = () => {
        if (reportSubmitting) return;
        setReportView("");
        setReportError("");
        setSubmittedReport(null);
        setSelectedReport(null);
        setReportDraft({ category: "", subject: "", description: "", contactEmail: student?.email || student?.email_address || student?.contactEmail || "", attachment: null });
        setSettingsModal(null);
    };

    
    
const handleSettingsItemClick = (item) => {
    if (item === "Report an Issue") {
        openReportCategory();
        return;
    }

    const pageMap = {
        "Privacy Policy": "privacy",
        "Terms of Service": "terms",
        "Contact us": "contact",
        "About us": "about",
    };

    if (pageMap[item]) {
        setSettingsModal(null);
        setActiveMenu(pageMap[item]);
        setActiveSidebarItem("settings");
        contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    setSettingsModal(item);
};



    // =================================================
    // SELECT CANDIDATE
    // =================================================

    const handleVoteSelect = (
        positionId,
        candidateId
    ) => {
        if (
            hasVoted ||
            voteLoading ||
            !electionIsOpen ||
            !studentEligible
        ) {
            return;
        }

        setSelectedVotes((previous) => ({
            ...previous,
            [positionId]: previous[positionId] === candidateId ? null : candidateId,
        }));
    };

    // =================================================
    // VIEW CANDIDATE DETAILS
    // =================================================

        const handleViewDetails = (candidate) => {
            setSelectedCandidateDetails(candidate);

        const name =
            candidate?.full_name ||
            candidate?.fullName ||
            candidate?.name ||
            "Candidate";

    };

    // =================================================
    // SUBMIT VOTE
    // =================================================

    const handleSubmitVotes = async (confirmed = false) => {
        if(voteLoading)return;
        setVoteFeedback("");
        if (!election?.id) {
            setVoteFeedback(
                "There is no election currently available for voting."
            );
            return;
        }

        if (!electionIsOpen) {
            setVoteFeedback(
                electionIsScheduled
                    ? "The election has not been opened for voting by the Electoral Board yet."
                    : electionIsClosed
                    ? "Voting for this election has ended."
                    : electionIsCancelled
                    ? "This election has been cancelled."
                    : "The election is not currently open for voting."
            );
            return;
        }

        if (!studentEligible) {
            setVoteFeedback(
                "1st Year students are not eligible to vote in this election."
            );
            return;
        }

        if (hasVoted) {
            setVoteFeedback(
                "You have already submitted your vote for this election."
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
            setVoteFeedback(
                "Select at least one candidate. You may leave other positions unselected."
            );
            return;
        }

        const skipped = eligiblePositions.filter(position => !selectedVotes[position.id]);
        const review = skipped.length
            ? 'Unselected positions (no vote): ' + skipped.map(position => position.name).join(', ') + '. '
            : '';
        if (confirmed !== true) {setBallotReview(true);return;}
        setBallotReview(false);

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
            window.dispatchEvent(new Event('votara-student-activity'));
            setSelectedVotes({});

            const confirmationSource =
                result?.ballotId ||
                "";

            const confirmationId =
                confirmationSource
                    ? `VTR-${String(confirmationSource)
                          .replace(/-/g, "")
                          .slice(0, 8)
                          .toUpperCase()}`
                    : `VTR-${Date.now()
                          .toString(36)
                          .slice(-8)
                          .toUpperCase()}`;

            setVoteConfirmation({
                confirmationId,
                submittedAt: new Date(),
            });

            console.log(
                "Vote submission result:",
                result
            );
        } catch (error) {
            console.error(
                "Vote submission error:",
                error
            );

            setVoteFeedback(
                /all required eligible positions/i.test(error?.response?.data?.message || "")
                    ? "Your partial ballot was not recorded because this election’s voting service has not been updated to accept abstentions yet. Your choices are still here; please contact the Electoral Board."
                    : error?.response?.data?.message ||
                error?.message ||
                "Unable to submit your vote. Please try again."
            );
        } finally {
            setVoteLoading(false);
        }
    };

    // =================================================
    // PROFILE UPDATE
    // =================================================

    const handleProfileUpdated = async (updatedStudent) => {
        if (!updatedStudent) return;

        let mergedStudent = {
            ...(student || {}),
            ...updatedStudent,
        };

        // Refresh the private photo URL after upload; the upload response may
        // contain only a storage path, which is not directly displayable.
        try {
            const profileResponse = await getStudentProfile();
            if (profileResponse?.success && profileResponse?.student) {
                mergedStudent = {
                    ...mergedStudent,
                    ...profileResponse.student,
                };
            }
        } catch (profileError) {
            console.warn("Unable to refresh the updated student profile:", profileError);
        }

        setStudent(mergedStudent);
        setProfileImageVersion(Date.now());
        setProfileImageError(false);

        try {
            localStorage.setItem("votaraStudent", JSON.stringify(mergedStudent));
        } catch (storageError) {
            console.warn(
                "Unable to synchronize updated profile with local storage:",
                storageError
            );
        }
    };

    // =================================================
    // LOGOUT
    // =================================================

    
const handleLogout = async () => {
    if (studentLogoutInProgress.current) return;
    studentLogoutInProgress.current = true;
    const token = getStudentToken();

    // Release the server-side session before leaving the dashboard.
    if (token) {
        try {
            await api.post(
                "/auth/student-logout",
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: 2000,
                }
            );
        } catch (error) {
            console.warn(
                "Unable to release student session during logout:",
                error?.message
            );
        }
    }

    clearAccountSession("student");
    window.location.replace("/student-login");
};


    // =================================================
    // SEARCH
    // =================================================

    const handleSearch = () => {
        const query = searchValue.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ');
        if (!query) return;
        const features = [
            ['guidelines', ['voters guidelines', 'voter guidelines', 'guidelines', 'guideline', 'how to vote']],
            ['candidates', ['candidate directory', 'candidates', 'candidate', 'campaign']],
            ['results', ['election results', 'results', 'result']],
            ['terms', ['terms and conditions', 'terms of service', 'terms', 'conditions']],
            ['privacy', ['privacy policy', 'privacy']],
            ['about', ['about us', 'about', 'mission']],
            ['contact', ['contact us', 'contact', 'support']],
            ['report', ['report an issue', 'report', 'issue', 'concern']],
            ['settings', ['settings', 'setting', 'account']],
            ['dashboard', ['dashboard', 'home']],
            ['vote', ['voting', 'vote', 'ballot']],
        ];
        const match = features.find(([, labels]) => labels.some(label => label === query))
            || features.find(([, labels]) => labels.some(label => label.includes(query) || query.includes(label)));
        if (!match) { alert('No feature found. Try candidates, results, guidelines, settings, or report an issue.'); return; }
        const settingsPages = {about: 'About us', contact: 'Contact us', terms: 'Terms of Service', privacy: 'Privacy Policy', report: 'Report an Issue'};
        if (settingsPages[match[0]]) {
            handleSettingsItemClick(settingsPages[match[0]]);
            if (window.matchMedia('(max-width: 720px)').matches) setSidebarOpen(false);
        } else handleMenuClick(match[0]);
        setSearchValue('');
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
                        No active candidates are
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
                    resolveImageUrl(
                        candidate.profile_picture ||
                        candidate.profilePicture ||
                        candidate.profile_picture_url ||
                        candidate.profilePictureUrl
                    ) || candidatesIcon;

                const isSelected =
                    selectedVotes[
                        position.id
                    ] === candidate.id;

                const candidateAffiliation =
                    candidate.party_list?.name ||
                    candidate.partyList?.name ||
                    candidate.partyListName ||
                    candidate.party_list_name ||
                    (candidate.party_list_id || candidate.partyListId
                        ? "Party list"
                        : "Individual");

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

                            <span className="candidate-affiliation-badge">
                                {candidateAffiliation}
                            </span>

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
                                aria-pressed={isSelected}
                                disabled={
                                    hasVoted ||
                                    voteLoading ||
                                    !electionIsOpen ||
                                    !studentEligible
                                }
                                onClick={() =>
                                    handleVoteSelect(
                                        position.id,
                                        candidate.id
                                    )
                                }
                            >
                                {isSelected
                                    ? "SELECTED · CLEAR"
                                    : "VOTE"}
                            </button>

                            
                            <button
                                type="button"
                                className="candidate-details-button"
                                aria-label={`View campaign platform for ${candidateName}`}
                                title="View campaign platform"
                                onClick={() => handleViewDetails(candidate)}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    width="17"
                                    height="17"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden="true"
                                >
                                    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z" />
                                </svg>
                            </button>

                        </div>
                    </article>
                );
            }
        );
    };

    // =================================================
    // STUDENT RESULTS LOADER
    // =================================================

const loadStudentResults = async () => {
    try {
        setResultsLoading(true);
        setResultsError("");

        const response = await getPublishedStudentResults();

        if (!response?.success) {
            throw new Error(
                response?.message ||
                "Unable to load election results."
            );
        }

        // Always replace the previous response, including when
        // results are no longer published or the election is open.
        setStudentResults(response);
    } catch (error) {
        setStudentResults(null);

        setResultsError(
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load election results."
        );
    } finally {
        setResultsLoading(false);
    }
};

// Keep the dashboard's Live result card connected to the same official
// release feed as the full Results page.
useEffect(() => {
    if (activeMenu !== "dashboard") return undefined;

    let cancelled = false;
    const refresh = async () => {
        setResultsLoading(true);
        setResultsError("");
        try {
            const response = await getPublishedStudentResults();
            if (!cancelled && response?.success) setStudentResults(response);
        } catch (error) {
            if (!cancelled) setResultsError(error?.response?.data?.message || error?.message || "Unable to load election results.");
        } finally {
            if (!cancelled) setResultsLoading(false);
        }
    };

    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => {
        cancelled = true;
        window.clearInterval(timer);
    };
}, [activeMenu]);


    // =================================================
    // AUTO-REFRESH PUBLISHED RESULTS
    // =================================================

    useEffect(() => {
    if (activeMenu !== "results") return;

    let cancelled = false;
    let requestInFlight = false;

    const refreshResults = async () => {
        if (
            cancelled ||
            requestInFlight ||
            document.visibilityState !== "visible"
        ) {
            return;
        }

        requestInFlight = true;

        try {
            setResultsLoading(true);
            setResultsError("");

            const response = await getPublishedStudentResults();

            if (!response?.success) {
                throw new Error(
                    response?.message || "Unable to load election results."
                );
            }

            if (!cancelled) {
                setStudentResults(response);
            }
        } catch (error) {
            if (!cancelled) {
                setResultsError(
                    error?.response?.data?.message ||
                    error?.message ||
                    "Unable to load election results."
                );
            }
        } finally {
            requestInFlight = false;

            if (!cancelled) {
                setResultsLoading(false);
            }
        }
    };

    refreshResults();

    const timer = window.setInterval(refreshResults, 15000);

    return () => {
        cancelled = true;
        window.clearInterval(timer);
    };
}, [activeMenu]);










    // =================================================
    // MAIN PAGE CONTENT
    // =================================================

    const renderMainContent = () => {

        
    if (activeMenu === "results") {
        const electionResults = studentResults?.positions || [];

const resultStatus = String(
    studentResults?.election?.status || ""
).trim().toLowerCase();

const electionFinished = [
    "closed",
    "completed",
    "finished",
].includes(resultStatus);

const resultsAreVisible =
    studentResults?.published === true &&
    electionFinished;

        return (
            <main className="dashboard-main content-page-animation">
                <section className="student-results-page">
                    <div className="student-results-heading">
                        <div>
                            <h1>Election Results</h1>
                            <p>
                                Official results published by the Electoral Board.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="student-results-refresh"
                            onClick={loadStudentResults}
                            disabled={resultsLoading}
                        >
                            {resultsLoading ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>

                    {resultsError ? (
                        <div className="student-results-message error">
                            <h2>Unable to load results</h2>
                            <p>{resultsError}</p>
                            <button
                                type="button"
                                onClick={loadStudentResults}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : resultsLoading && !studentResults ? (
                        <div className="student-results-message">
                            Loading election results...
                        </div>
                    ) : !resultsAreVisible ? (
                        

<div className="student-results-message">
    <h2>
        {electionFinished
            ? "Election Finished"
            : "Election is still ongoing"}
    </h2>

    <p>
        {electionFinished
            ? "The election has finished. Please wait until the Electoral Board releases the official results."
            : "Please wait until the election has finished and the Electoral Board releases the official results."}
    </p>
</div>


                    ) : electionResults.length === 0 ? (
                        <div className="student-results-message">
                            <h2>No position results available</h2>
                            <p>
                                No position results were returned for this election.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="student-results-election">
                                <span>Published Election</span>
                                <h2>
                                    {studentResults.election?.title ||
                                        "VOTARA Election"}
                                </h2>
                                {studentResults.election?.published_at && (
                                    <p>
                                        Published:{" "}
                                        {new Date(
                                            studentResults.election.published_at
                                        ).toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="student-results-grid">
                                {electionResults.map((position) => (
                                    <article
                                        className="student-result-card"
                                        key={position.id}
                                    >
                                        <div className="student-result-card-heading">
                                            <h2>{position.name}</h2>

                                            <span
                                                className={`student-result-status ${position.resultStatus}`}
                                            >
                                                {position.resultStatus === "winner"
                                                    ? "Winner declared"
                                                    : position.resultStatus === "tie"
                                                    ? "Tied"
                                                    : "No votes"}
                                            </span>
                                        </div>

                                        {position.description && (
                                            <p className="student-result-description">
                                                {position.description}
                                            </p>
                                        )}

                                        {position.resultStatus === "tie" && (
                                            <p className="student-result-notice">
                                                This position has tied candidates.
                                            </p>
                                        )}

                                        {position.resultStatus === "no_votes" && (
                                            <p className="student-result-notice">
                                                No votes were recorded for this position.
                                            </p>
                                        )}

                                        <div className="student-result-candidates">
                                            {position.candidates.map((candidate) => (
                                                <div
                                                    className={`student-result-candidate ${
                                                        position.winner?.id === candidate.id
                                                            ? "is-winner"
                                                            : ""
                                                    }`}
                                                    key={candidate.id}
                                                >
                                                    <div className="student-result-candidate-info">
                                                        {candidate.profilePicture ? (
                                                            <img
                                                                src={candidate.profilePicture}
                                                                alt={candidate.fullName}
                                                            />
                                                        ) : (
                                                            <div className="student-result-avatar">
                                                                {(candidate.fullName || "C")
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                        )}

                                                        <div>
                                                            <strong>
                                                                {candidate.fullName}
                                                            </strong>
                                                            <span>
                                                                {candidate.partyListName ||
                                                                    "Independent"}
                                                            </span>
                                                            {position.winner?.id === candidate.id && (
                                                                <span className="student-result-winner-label">
                                                                    Official winner
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <strong className="student-result-votes">
                                                        {candidate.voteCount}{" "}
                                                        {candidate.voteCount === 1
                                                            ? "vote"
                                                            : "votes"}
                                                    </strong>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </main>
        );
    }

        // =================================================
        // DASHBOARD
        // =================================================

        if (
            activeMenu ===
            "dashboard"
        ) {
            return (
                <main className="dashboard-main content-page-animation">
                    <div className="dashboard-grid">
                        {/* LEFT COLUMN */}

                        <div className="left-column">
                            <section
                                className={`election-card main-hover-card ${
                                    electionStatusClass
                                }`}
                            >
                                
<div className="election-card-header">
    <div className="election-card-heading">
        <span className="election-eyebrow">
            {electionIsOpen
                ? "ACTIVE NOW"
                : electionIsScheduled
                ? "UPCOMING ELECTION"
                : "ELECTION STATUS"}
                        </span>

                        <h3>
                            {election?.title || "PSITS Election"}
                        </h3>

                        <p className="election-banner-subtitle">
                            Your vote shapes the future of campus life.
                            Review the candidates and cast your digital
                            ballot before voting closes.
                        </p>
                    </div>

                    <span
                        className={`election-status-badge ${electionStatusClass}`}
                    >
                        {electionStatusLabel}
                    </span>
                </div>


                                {election ? (
                                    <div className="election-card-meta">
                                        <span>
                                            {formatDate(
                                                election.election_date
                                            )}
                                        </span>

                                        <span>
                                            {formatTime(
                                                election.start_time
                                            )}

                                            {election.end_time
                                                ? ` - ${formatTime(
                                                      election.end_time
                                                  )}`
                                                : ""}
                                        </span>
                                    </div>
                                ) : (
                                    <p className="election-card-message">
                                        {electionLoading
                                            ? "Checking the current election..."
                                            : electionError ||
                                              "No published election is currently open."}
                                    </p>
                                )}

                                {election && !electionIsOpen && (
                                    <div
                                        className={`election-notice ${electionStatusClass}`}
                                    >
                                        {electionIsScheduled &&
                                            "The Electoral Board has scheduled this election but has not opened voting yet."}

                                        {electionIsClosed &&
                                            "Voting for this election has ended."}

                                        {electionIsCancelled &&
                                            "This election has been cancelled."}

                                        {electionStatus === "draft" &&
                                            "This election is still being configured."}
                                    </div>
                                )}

                                {electionIsOpen &&
                                    !studentEligible && (
                                        <div className="election-notice status-warning">
                                            1st Year students are not eligible
                                            to vote in this election.
                                        </div>
                                    )}

                                <button
                                    type="button"
                                    className="vote-button"
                                    disabled={!studentCanVote}
                                    onClick={() => handleMenuClick("vote")}
                                    title={
                                        hasVoted
                                            ? "You already voted in this election."
                                            : !electionIsOpen
                                            ? "Voting is not currently open."
                                            : !studentEligible
                                            ? "Your year level is not eligible to vote."
                                            : "Open the ballot"
                                    }
                                >
                                    {hasVoted
                                        ? "VOTE SUBMITTED"
                                        : electionIsOpen && studentEligible
                                        ? "Vote Now"
                                        : electionIsScheduled
                                        ? "NOT OPEN YET"
                                        : "VOTING CLOSED"}
                                </button>

                                <button
                                    type="button"
                                    className="view-candidates-button"
                                    onClick={() => handleMenuClick("candidates")}
                                >
                                    View Candidates
                                </button>
                            </section>

                            <section className="results-card live-results-card main-hover-card">
                                <div className="results-header live-results-header">
                                    <div>
                                        <h3>Live result</h3>
                                        <p>Election results overview</p>
                                    </div>
                                    <span className={`live-results-badge ${studentResults?.published ? "is-released" : ""}`}>
                                        <span className="live-results-dot" />
                                        {studentResults?.published ? "Official results" : "Awaiting release"}
                                    </span>
                                </div>

                                {studentResults?.published && studentResults?.positions?.length ? (
                                    <div className="live-results-list">
                                        {studentResults.positions.map((position) => (
                                            <div className="live-results-row" key={position.id}>
                                                <span className="live-results-position">{position.name}</span>
                                                {position.resultStatus === "tie" ? (
                                                    <span className="live-results-winner">Tie</span>
                                                ) : position.winner ? (
                                                    <span className="live-results-winner">
                                                        {position.winner.fullName}
                                                        <small>{position.winner.partyListName || "Independent"} · {position.winner.voteCount} votes</small>
                                                    </span>
                                                ) : (
                                                    <span className="live-results-winner">No votes</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="live-results-empty-state">
                                    <div className="live-results-icon" aria-hidden="true">
                                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="5" y="5" width="38" height="38" rx="12" fill="#EEF4FF" />
                                            <path d="M14 32V25M24 32V17M34 32V21" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <h4>{resultsLoading ? "Checking official results" : "Election results will appear here"}</h4>
                                    <p>{resultsError || (studentResults?.election?.status && ["closed", "completed", "finished"].includes(String(studentResults.election.status).toLowerCase())
                                        ? "The Electoral Board has not released the official results yet."
                                        : "Candidate standings and vote totals will appear here after the Electoral Board releases the official results.")}</p>
                                    <span className="live-results-note">{resultsLoading ? "Refreshing results…" : "Results are not available yet."}</span>
                                </div>}
                            </section>

                            <section id="student-announcements" className="announcement-card main-hover-card">
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
                                {platformUpdate?.notice && <p className="student-admin-announcement">{platformUpdate.notice}</p>}
                                {platformUpdate?.upcoming && <p className="student-admin-announcement">Maintenance is scheduled for {new Date(platformUpdate.startsAt).toLocaleString()}. {platformUpdate.message}</p>}
                            </section>

                            <section className="faq-section">
                            <div className="faq-intro">
                                <h3>FAQs</h3>
                                <p>
                                    Answer the questions voters ask before they
                                    register, vote or check results.
                                </p>
                                </div>
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
                                                        ? electionStatusLabel
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
                                        [
                                            "5",
                                            "Waiting for election result",
                                            "Results will appear after they become available",
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
                                                    4
                                                        ? "last process-item-pending"
                                                        : ""
                                                }`}
                                                key={
                                                    number
                                                }
                                            >
                                                <div
                                                    className={`process-number ${
                                                        index === 4 ? "inactive" : ""
                                                    }`}
                                                >
                                                    {number}
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


        if (activeMenu === "candidates") {
    return (
        <main className="dashboard-main content-page-animation">
            <section className="welcome-section">
                <h1>
                    Candidate Directory
                </h1>
                <p>
                    Review the candidates, their positions,
                    party lists, and campaign platforms.
                </p>
            </section>

            {!election ? (
                <section className="candidates-empty-state">
                    <h2>No election available</h2>
                    <p>
                        Candidate information will appear when
                        an election is available.
                    </p>
                </section>
            ) : (
                <>
                    <section className="candidates-election-banner">
                        <span>Current Election</span>
                        <h2>
                            {election.title || "VOTARA Election"}
                        </h2>
                        <p>
                            {electionStatusLabel}
                        </p>
                    </section>

                    {eligiblePositions.map((position) => {
                        const positionCandidates =
                            candidatesByPosition[position.id] || [];

                        return (
                            <section
                                className="directory-position"
                                key={position.id}
                            >
                                <div className="directory-position-heading">
                                    <div>
                                        <h2>{position.name}</h2>
                                        <p>
                                            {positionCandidates.length} candidate
                                            {positionCandidates.length !== 1
                                                ? "s"
                                                : ""}
                                        </p>
                                    </div>
                                </div>

                                {positionCandidates.length === 0 ? (
                                    <div className="candidates-empty-state">
                                        No active candidates are listed
                                        for this position yet.
                                    </div>
                                ) : (
                                    <div className="directory-candidate-grid">
                                        {positionCandidates.map((candidate) => (
                                            <article
                                                className="directory-candidate-card"
                                                key={candidate.id}
                                            >
                                                <div className="directory-candidate-photo">
                                                    {candidate.profile_picture ? (
                                                        <img
                                                            src={candidate.profile_picture}
                                                            alt={candidate.full_name || "Candidate"}
                                                        />
                                                    ) : (
                                                        <span>
                                                            {(candidate.full_name || "C")
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="directory-candidate-info">
                                                    <h3>
                                                        {candidate.full_name ||
                                                            candidate.fullName ||
                                                            "Unnamed Candidate"}
                                                    </h3>

                                                    <div className="directory-candidate-labels">
                                                        <span className="directory-position-badge">
                                                            {position.name}
                                                        </span>
                                                        <span className="directory-party-badge">
                                                            {candidate.party_list?.name ||
                                                                candidate.partyList?.name ||
                                                                "Independent"}
                                                        </span>
                                                    </div>

                                                    <div className="directory-platform">
                                                        <h4>Campaign Platform</h4>
                                                        <p>
                                                            {candidate.platform?.trim()
                                                                ? candidate.platform
                                                                : "No campaign platform provided."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </>
            )}
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
                                : election && !electionIsOpen
                                ? electionStatusLabel
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

                    {hasVoted ? (
                        <section className="vote-confirmation-panel">
                            <div className="vote-confirmation-icon">
                                ✓
                            </div>

                            <div className="vote-confirmation-content">
                                <span className="vote-confirmation-badge">
                                    Vote Successfully Recorded
                                </span>

                                <h2>Your vote has been recorded</h2>

                                <p className="vote-confirmation-message">
                                    Your ballot was successfully submitted.
                                </p>

                                {election && (
                                    <div className="vote-confirmation-details">
                                        <div className="vote-confirmation-detail">
                                            <span>Election</span>
                                            <strong>{election.title}</strong>
                                        </div>

                                        {voteConfirmation?.submittedAt && (
                                            <div className="vote-confirmation-detail">
                                                <span>Submitted</span>
                                                <strong>
                                                    {voteConfirmation.submittedAt.toLocaleString()}
                                                </strong>
                                            </div>
                                        )}

                                        {voteConfirmation?.confirmationId && (
                                            <div className="vote-confirmation-detail">
                                                <span>Confirmation ID</span>
                                                <strong>{voteConfirmation.confirmationId}</strong>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="vote-confirmation-privacy">
                                    <strong>Your selections are private.</strong>
                                    <span>
                                        Candidate choices are not displayed on this confirmation screen.
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="vote-confirmation-return-button"
                                    onClick={() => handleMenuClick("dashboard")}
                                >
                                    Return to Dashboard
                                </button>
                            </div>
                        </section>
                    ) : (
                        <>
                            {electionLoading && (
                                <section className="vote-position-section">
                                    <div className="vote-position-heading">
                                        <h2>Loading election...</h2>
                                    </div>
                                </section>
                            )}

                            {!electionLoading && electionError && (
                                <section className="vote-position-section">
                                    <div className="vote-position-heading">
                                        <h2>Unable to load election</h2>
                                        <p>{electionError}</p>
                                    </div>
                                </section>
                            )}

                            {election && !electionIsOpen && (
                                <section className="vote-status-panel">
                                    <div className={`vote-status-icon ${electionStatusClass}`}>
                                        {electionStatus === "scheduled" ? "!" : electionStatus === "closed" ? "✓" : "!"}
                                    </div>
                                    <div>
                                        <span className={`election-status-badge ${electionStatusClass}`}>
                                            {electionStatusLabel}
                                        </span>
                                        <h2>
                                            {electionStatus === "scheduled"
                                                ? "Voting has not opened yet"
                                                : electionStatus === "closed"
                                                ? "Voting has ended"
                                                : electionStatus === "cancelled"
                                                ? "Election cancelled"
                                                : "Voting is unavailable"}
                                        </h2>
                                        <p>
                                            {electionStatus === "scheduled"
                                                ? "Please wait for the Electoral Board to open the election."
                                                : electionStatus === "closed"
                                                ? "The Electoral Board has closed voting for this election."
                                                : "This election is not currently available for voting."}
                                        </p>
                                    </div>
                                </section>
                            )}

                            {election && electionIsOpen && !studentEligible && (
                                <section className="vote-status-panel status-warning">
                                    <div className="vote-status-icon status-warning">!</div>
                                    <div>
                                        <span className="election-status-badge status-warning">Not Eligible</span>
                                        <h2>You are not eligible to vote</h2>
                                        <p>
                                            1st Year students are not eligible to vote in this election.
                                        </p>
                                    </div>
                                </section>
                            )}

                            {!electionLoading && !electionError && !election && (
                                <section className="vote-position-section">
                                    <div className="vote-position-heading">
                                        <h2>No Active Election</h2>
                                        <p>
                                            There is currently no published election available for voting.
                                        </p>
                                    </div>
                                </section>
                            )}

                            {election && eligiblePositions.length === 0 && (
                                <section className="vote-position-section">
                                    <div className="vote-position-heading">
                                        <h2>No Available Positions</h2>
                                        <p>
                                            There are currently no voting positions available for your year level.
                                        </p>
                                    </div>
                                </section>
                            )}

                            {election && electionIsOpen && studentEligible && eligiblePositions.map((position) => (
                                <section className="vote-position-section" key={position.id}>
                                    <div className="vote-position-heading">
                                        <h2>{position.name}</h2>
                                        <p>
                                            Choose one candidate or abstain from this position. You can still submit the choices you make for other positions.
                                        </p>
                                        {position.description && <p>{position.description}</p>}
                                        <button
                                            type="button"
                                            className={`vote-position-abstain${selectedVotes[position.id] ? "" : " is-selected"}`}
                                            aria-pressed={!selectedVotes[position.id]}
                                            disabled={hasVoted || voteLoading || !electionIsOpen || !studentEligible}
                                            onClick={() => setSelectedVotes(previous => ({ ...previous, [position.id]: null }))}
                                        >
                                            {selectedVotes[position.id] ? "Abstain from this position" : "Abstention selected"}
                                        </button>
                                    </div>
                                    <div className="candidate-grid">
                                        {renderCandidateCards(position)}
                                    </div>
                                </section>
                            ))}

                            {election && electionIsOpen && studentEligible && eligiblePositions.length > 0 && (
                                <section className="vote-submit-section">
                                    <p>Double check your choices before submitting your votes.</p>
                                    <button
                                        type="button"
                                        className="submit-vote-button"
                                        disabled={voteLoading}
                                        onClick={() => handleSubmitVotes()}
                                    >
                                        {voteLoading ? "SUBMITTING..." : "SUBMIT VOTE"}
                                    </button>
                                </section>
                            )}
                        </>
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

            const groups = [
                { title: "Before you vote", subtitle: "Prepare for election day", items: [0, 1, 2, 4] },
                { title: "Cast your ballot", subtitle: "Review, choose, and confirm", items: [3, 6, 7, 8] },
                { title: "Protect your account", subtitle: "Vote responsibly and get support", items: [5, 9, 10, 11] },
            ];
            return (
                <main className="guidelines-main content-page-animation">
                    <section className="guidelines-container">
                        <div className="student-guidelines-heading">
                            <span className="student-guidelines-eyebrow">VOTER RESOURCES</span>
                            <h1>Voters Guidelines</h1>
                            <p>A little preparation makes every vote count. Follow these guidelines for a smooth and secure voting experience.</p>
                        </div>
                        <div className="student-guidelines-grid">
                            {groups.map((group, groupIndex) => (
                                <section className="student-guidelines-card" key={group.title} aria-labelledby={"guidelines-group-" + groupIndex}>
                                    <span className="student-guidelines-number">0{groupIndex + 1}</span>
                                    <h2 id={"guidelines-group-" + groupIndex}>{group.title}</h2>
                                    <p>{group.subtitle}</p>
                                    <ul>{group.items.map(index => <li key={index}><span className="guideline-dot" aria-hidden="true" /><span>{guidelines[index]}</span></li>)}</ul>
                                </section>
                            ))}
                        </div>
                        <div className="student-guidelines-support"><div><strong>Need a hand?</strong><p>If something goes wrong, send a concern to your administrator.</p></div><button type="button" onClick={() => handleSettingsItemClick("Report an Issue")}>Report an issue <span aria-hidden="true">↗</span></button></div>
                    </section>
                </main>
            );
        }


        // =================================================
        // ABOUT VOTARA PAGE
        // =================================================

        if (activeMenu === "about") {
            return (
                <main className="about-votara-page content-page-animation">
                    <div className="about-votara-topline">
                        <span>ABOUT VOTARA</span>
                    </div>

                    <div className="about-votara-sheet">
                        <button
                            type="button"
                            className="about-votara-back"
                            onClick={() => handleMenuClick("settings")}
                        >
                            <span aria-hidden="true">←</span>
                            Back to Settings
                        </button>

                        <section className="about-votara-hero">
                            <div className="about-votara-hero-copy">
                                <span className="about-votara-eyebrow">
                                    A BETTER WAY TO VOTE
                                </span>

                                <h1>
                                    Voting brings
                                    <br />
                                    us together.
                                </h1>

                                <p>
                                    Building the Future of Modern Democracy
                                </p>

                                <div className="about-votara-hero-actions">
                                    <button
                                        type="button"
                                        className="about-votara-primary"
                                        onClick={() => handleMenuClick("candidates")}
                                    >
                                        Explore candidates
                                    </button>

                                    <button
                                        type="button"
                                        className="about-votara-secondary"
                                        onClick={() => handleSettingsItemClick("Contact us")}
                                    >
                                        Contact us
                                    </button>
                                </div>
                            </div>

                            <div className="about-votara-brand-panel">
                                <div className="about-votara-logo-frame">
                                    <img
                                        src={votaraLogoSrc}
                                        alt="VOTARA logo"
                                    />
                                </div>

                                <h2>Boto + tara.</h2>
                                <p>
                                    From <strong>boto</strong> (vote) and
                                    <strong> tara</strong> (let's go),
                                    VOTARA is an invitation to participate
                                    together. Tara, bumoto na tayo. The name
                                    carries the spirit of bayanihan into
                                    student elections.
                                </p>
                            </div>
                        </section>

                        <section className="about-votara-mission">
                            <div className="about-votara-section-heading">
                                <span>WHY VOTARA EXISTS</span>
                                <h2>Our Mission</h2>
                            </div>

                            <p>
                                VOTARA is an online and multi-target
                                electronic voting platform designed for
                                modern academic institutions. We aim to
                                minimize verification delays and manual
                                overhead while supporting an organized,
                                accessible, and reliable student election
                                experience.
                            </p>
                        </section>

                        <section className="about-votara-architecture">
                            <div className="about-votara-section-heading">
                                <span>BUILT AROUND TRUST</span>
                                <h2>Core Architecture</h2>
                            </div>

                            <div className="about-votara-architecture-grid">
                                <article className="about-votara-info-card">
                                    <span className="about-votara-card-number">
                                        01
                                    </span>
                                    <h3>Identity Integrity</h3>
                                    <p>
                                        Student verification, documented
                                        records, and access controls help
                                        support legitimate voter
                                        participation.
                                    </p>
                                </article>

                                <article className="about-votara-info-card">
                                    <span className="about-votara-card-number">
                                        02
                                    </span>
                                    <h3>Ballot Security</h3>
                                    <p>
                                        A structured voting workflow helps
                                        protect ballot handling and support
                                        reliable election records.
                                    </p>
                                </article>

                                <article className="about-votara-info-card">
                                    <span className="about-votara-card-number">
                                        03
                                    </span>
                                    <h3>Hybrid Accessibility</h3>
                                    <p>
                                        A responsive interface supports
                                        student access across desktop,
                                        tablet, and mobile devices.
                                    </p>
                                </article>
                            </div>
                        </section>

                        <section className="about-votara-capabilities">
                            <div className="about-votara-section-heading">
                                <span>DESIGNED FOR STUDENT ELECTIONS</span>
                                <h2>Platform Capabilities</h2>
                            </div>

                            <div className="about-votara-capability-list">
                                <div className="about-votara-capability-row">
                                    <strong>Feature Matrix</strong>
                                    <span>Purpose-built election workflows</span>
                                </div>

                                <div className="about-votara-capability-row">
                                    <strong>Eligibility & Governance</strong>
                                    <span>Student access and election controls</span>
                                </div>

                                <div className="about-votara-capability-row">
                                    <strong>Verification Support</strong>
                                    <span>Account-based voter participation</span>
                                </div>

                                <div className="about-votara-capability-row">
                                    <strong>Ballot Handling</strong>
                                    <span>Structured submission and vote records</span>
                                </div>

                                <div className="about-votara-capability-row">
                                    <strong>Election Monitoring</strong>
                                    <span>Election status and available results</span>
                                </div>

                                <div className="about-votara-capability-row">
                                    <strong>Deployment</strong>
                                    <span>Web-based access across supported devices</span>
                                </div>
                            </div>
                        </section>

                        <section className="about-votara-cta">
                            <div>
                                <span>YOUR VOICE MATTERS</span>
                                <h2>Make your voice part of the campus.</h2>
                                <p>
                                    Stay informed and prepare for your
                                    student election.
                                </p>
                            </div>

                            <div className="about-votara-cta-actions">
                                <button
                                    type="button"
                                    onClick={() => handleMenuClick("guidelines")}
                                >
                                    Voting guidelines
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleMenuClick("settings")}
                                >
                                    Back to Settings
                                </button>
                            </div>
                        </section>
                    </div>
                </main>
            );
        }



        // =================================================
        // PRIVACY POLICY PAGE
        // =================================================

        if (activeMenu === "privacy") {
            const sections = [
                ["Information we collect", "information"],
                ["How information is used", "usage"],
                ["Secret ballots", "ballots"],
                ["Data sharing", "sharing"],
                ["Security", "security"],
                ["Retention & deletion", "retention"],
                ["Your rights", "rights"],
                ["Contact & support", "support"],
            ];

            return (
                <main className="policy-page content-page-animation">
                    <span className="policy-eyebrow">PRIVACY AND POLICY</span>

                    <div className="policy-sheet">
                        <button className="policy-back" type="button"
                            onClick={() => handleMenuClick("settings")}>
                            ← Back to Settings
                        </button>

                        <div className="policy-layout">
                            <aside className="policy-contents">
                                <h2>Contents</h2>
                                {sections.map(([label, id]) => (
                                    <a key={id} href={`#privacy-${id}`}>{label}</a>
                                ))}
                                <button type="button"
                                    onClick={() => contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}>
                                    Back to beginning
                                </button>
                                <p>You can read the full policy by scrolling through the reading area.</p>
                            </aside>

                            <article className="policy-document">
                                <h1>Privacy Policy</h1>
                                <p className="policy-subtitle">
                                    How your information is handled, protected, and kept separate from your ballot.
                                </p>

                                <div className="policy-notice">
                                    VOTARA is designed to support student election participation while respecting
                                    voter privacy. This policy explains the information handled by the platform.
                                </div>

                                <section id="privacy-information">
                                    <h2>1. Information We Collect</h2>
                                    <p>Information may include the details required to register, authenticate, and support your student account.</p>
                                    <h3>Account information</h3>
                                    <p>Student identification details, name, contact information, and profile information provided during registration.</p>
                                    <h3>Technical information</h3>
                                    <p>Relevant session and system records used to operate the platform and investigate technical issues.</p>
                                </section>

                                <section id="privacy-usage">
                                    <h2>2. How We Use Your Information</h2>
                                    <p>Information is used to manage student accounts, support voter eligibility checks, operate election workflows, and respond to support requests.</p>
                                </section>

                                <section id="privacy-ballots">
                                    <h2>3. Secret Ballots</h2>
                                    <p>VOTARA should handle ballot data according to its implemented voting and database controls. Do not treat anonymity guarantees as verified unless the backend architecture enforces them.</p>
                                </section>

                                <section id="privacy-sharing">
                                    <h2>4. Data Sharing</h2>
                                    <p>Access to student information should be limited to authorized purposes and personnel according to institutional requirements.</p>
                                </section>

                                <section id="privacy-security">
                                    <h2>5. Security</h2>
                                    <p>Users should protect their credentials and report suspicious activity or technical problems through the available support channels.</p>
                                </section>

                                <section id="privacy-retention">
                                    <h2>6. Retention and Deletion</h2>
                                    <p>Account and election records should be retained and removed according to applicable institutional rules and data-retention requirements.</p>
                                </section>

                                <section id="privacy-rights">
                                    <h2>7. Your Rights</h2>
                                    <p>Students may contact the appropriate administrator to ask questions about their information or request assistance with their account.</p>
                                </section>

                                <section id="privacy-support">
                                    <h2>8. Contact and Support</h2>
                                    <p>For privacy concerns, use the Contact Us page or the available Report an Issue feature.</p>
                                    <button type="button" className="policy-inline-button"
                                        onClick={() => handleSettingsItemClick("Contact us")}>
                                        Contact support
                                    </button>
                                </section>
                            </article>
                        </div>
                    </div>
                </main>
            );
        }

        // =================================================
        // TERMS OF SERVICE PAGE
        // =================================================

        if (activeMenu === "terms") {
            const sections = [
                ["Acceptance of terms", "acceptance"],
                ["Service & institutions", "service"],
                ["Account registration", "registration"],
                ["Voting rules", "voting"],
                ["Acceptable use", "acceptable"],
                ["Governance", "governance"],
                ["Intellectual property", "property"],
                ["Audit logs & uptime", "audit"],
                ["Disclaimers & updates", "disclaimers"],
                ["Contact & support", "contact"],
            ];

            return (
                <main className="policy-page content-page-animation">
                    <span className="policy-eyebrow">TERMS OF SERVICE</span>

                    <div className="policy-sheet">
                        <button className="policy-back" type="button"
                            onClick={() => handleMenuClick("settings")}>
                            ← Back to Settings
                        </button>

                        <div className="policy-layout">
                            <aside className="policy-contents">
                                <h2>Contents</h2>
                                {sections.map(([label, id]) => (
                                    <a key={id} href={`#terms-${id}`}>{label}</a>
                                ))}
                                <button type="button"
                                    onClick={() => contentScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}>
                                    Back to beginning
                                </button>
                                <p>Scroll through the reading area to review the terms.</p>
                            </aside>

                            <article className="policy-document">
                                <h1>Terms &amp; Conditions</h1>
                                <p className="policy-subtitle">
                                    The rules that guide participation and help protect the integrity of student elections.
                                </p>

                                <div className="policy-notice">
                                    IMPORTANT: By accessing or using VOTARA, you agree to follow the applicable
                                    election rules, institutional requirements, and platform instructions.
                                </div>

                                <section id="terms-acceptance">
                                    <h2>1. Acceptance of Terms</h2>
                                    <p>These terms govern use of VOTARA by students and authorized election personnel.</p>
                                </section>

                                <section id="terms-service">
                                    <h2>2. Service and Institutions</h2>
                                    <p>VOTARA provides online tools to support student election workflows within the institution.</p>
                                </section>

                                <section id="terms-registration">
                                    <h2>3. User Eligibility and Account Registration</h2>
                                    <h3>3.1 Account information</h3>
                                    <p>Users must provide accurate information and follow the account-registration instructions.</p>
                                    <h3>3.2 Credentials and security</h3>
                                    <p>Users are responsible for keeping their passwords and authentication codes confidential.</p>
                                </section>

                                <section id="terms-voting">
                                    <h2>4. Voting Rules</h2>
                                    <p>Students must follow the official voting schedule, review their selections, and submit their ballot through the authorized workflow.</p>
                                </section>

                                <section id="terms-acceptable">
                                    <h2>5. Acceptable Use</h2>
                                    <p>Users must not attempt unauthorized access, interfere with election operations, or misuse another person's account.</p>
                                </section>

                                <section id="terms-governance">
                                    <h2>6. Governance</h2>
                                    <p>Election activities remain subject to the rules and procedures established by the responsible institution and Electoral Board.</p>
                                </section>

                                <section id="terms-property">
                                    <h2>7. Intellectual Property</h2>
                                    <p>VOTARA branding and platform materials should be used only in accordance with applicable permissions.</p>
                                </section>

                                <section id="terms-audit">
                                    <h2>8. Audit Logs and Availability</h2>
                                    <p>System availability may depend on maintenance, network conditions, and the availability of supporting services.</p>
                                </section>

                                <section id="terms-disclaimers">
                                    <h2>9. Disclaimers and Updates</h2>
                                    <p>Platform procedures and these terms may be updated when required by the institution.</p>
                                </section>

                                <section id="terms-contact">
                                    <h2>10. Contact and Support</h2>
                                    <p>For questions about these terms, contact the appropriate support channel.</p>
                                    <button type="button" className="policy-inline-button"
                                        onClick={() => handleSettingsItemClick("Contact us")}>
                                        Contact support
                                    </button>
                                </section>
                            </article>
                        </div>
                    </div>
                </main>
            );
        }

        // =================================================
        // CONTACT US PAGE
        // =================================================

        if (activeMenu === "contact") {
            return (
                <main className="contact-page content-page-animation">
                    <span className="policy-eyebrow">CONTACT US</span>

                    <div className="contact-sheet">
                        <button className="policy-back" type="button"
                            onClick={() => handleMenuClick("settings")}>
                            ← Back to Settings
                        </button>

                        <section className="contact-hero">
                            <div>
                                <h1>Let’s get you<br />back to voting.</h1>
                                <p>
                                    Choose the right support channel for your account,
                                    election, or privacy questions.
                                </p>
                                <div className="contact-actions">
                                    <button type="button"
                                        onClick={() => handleSettingsItemClick("Report an Issue")}>
                                        Report an issue
                                    </button>
                                    <button type="button"
                                        onClick={() => handleMenuClick("guidelines")}>
                                        Voting guidelines
                                    </button>
                                </div>
                            </div>

                            <aside className="contact-hours">
                                <h2>Support Hours &amp; Response</h2>
                                <strong>Standard Operations</strong>
                                <p>Monday–Friday, 8:00 AM–6:00 PM (local time)</p>
                                <strong>Average Response</strong>
                                <p>Response times depend on issue type and availability.</p>
                                <strong>Election Coverage</strong>
                                <p>Check the official election instructions for support availability during voting.</p>
                            </aside>
                        </section>

                        <section className="contact-departments">
                            <h2>Contact by Department</h2>
                            <p>Route your request to the appropriate support area.</p>

                            <div className="contact-department-grid">
                                <article>
                                    <h3>Technical Support</h3>
                                    <p>Account access, registration issues, and technical problems.</p>
                                    <a href="mailto:support@votara.app">support@votara.app</a>
                                </article>
                                <article>
                                    <h3>Privacy &amp; Security</h3>
                                    <p>Questions about personal information or security concerns.</p>
                                    <a href="mailto:privacy@votara.app">privacy@votara.app</a>
                                </article>
                                <article>
                                    <h3>Legal &amp; Compliance</h3>
                                    <p>Questions about terms, policies, or institutional requirements.</p>
                                    <a href="mailto:legal@votara.app">legal@votara.app</a>
                                </article>
                            </div>
                        </section>

                        <section className="contact-eb-support">
                            <h2>Electoral Board Support</h2>
                            <p>For election-specific assistance, use the official channel provided by your Electoral Board.</p>
                            <div>Dashboard assistance: Use Report an Issue in Settings.</div>
                            <div>Voting assistance: Follow the official campus election instructions.</div>
                        </section>

                        <section className="contact-self-service">
                            <h2>Self-Service Support</h2>
                            <details open>
                                <summary>Help Center</summary>
                                <p>Review voter guidelines, account instructions, and the steps available in your dashboard.</p>
                                <button type="button" onClick={() => handleMenuClick("guidelines")}>
                                    View voter guidelines
                                </button>
                            </details>
                            <details>
                                <summary>In-App Ticket</summary>
                                <p>Submit a report through Settings → Report an Issue to document a technical problem.</p>
                                <button type="button" onClick={() => handleSettingsItemClick("Report an Issue")}>
                                    Create a report
                                </button>
                            </details>
                            <details>
                                <summary>System Status</summary>
                                <p>If a page is unavailable, refresh the dashboard and retry. For persistent issues, submit a report.</p>
                            </details>
                        </section>

                        <section className="contact-cta">
                            <h2>Ready to continue?</h2>
                            <p>Return to your account or send a support report if you need assistance.</p>
                            <div className="contact-actions">
                                <button type="button" onClick={() => handleSettingsItemClick("Report an Issue")}>
                                    Report an issue
                                </button>
                                <button type="button" onClick={() => handleMenuClick("settings")}>
                                    Back to Settings
                                </button>
                            </div>
                        </section>
                    </div>
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
                                                onClick={() => handleSettingsItemClick(item)}
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
                                                onClick={() => handleSettingsItemClick(item)}
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
        <div className={`student-dashboard ${sidebarOpen ? "is-sidebar-expanded" : "is-sidebar-collapsed"}`} data-student-theme={studentTheme}>
            {/* ================= NAVBAR ================= */}

            
            <header className="top-navbar">
                <div className="nav-left">
                    <button
                        type="button"
                        className="menu-toggle"
                        onClick={() => setSidebarOpen((previous) => !previous)}
                        aria-label={sidebarOpen ? "Collapse navigation" : "Open navigation"}
                        aria-expanded={sidebarOpen}
                        aria-controls="student-sidebar"
                    >
                        <FiMenu aria-hidden="true" />
                    </button>

                    <div className="header-greeting">
                        <h1>
                            Hello <strong>{firstName}!</strong>
                        </h1>
                        <p>Welcome to Votara</p>
                    </div>
                </div>

                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search"
                        aria-label="Search dashboard"
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
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
                        <FiSearch aria-hidden="true" />
                    </button>
                </div>

                <button type="button" className="student-theme-toggle"
                    aria-label={studentTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    title={studentTheme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    aria-pressed={studentTheme === "dark"}
                    onClick={() => setStudentTheme(value => value === "light" ? "dark" : "light")}>
                    {studentTheme === "light" ? <FiMoon aria-hidden="true" /> : <FiSun aria-hidden="true" />}
                </button>
                <div className="student-platform-bell"><PlatformNotifications onStatus={setPlatformUpdate} onAction={target => {
                    if (target === "reports") { loadReportHistory(); return; }
                    handleMenuClick(target === "vote" ? "vote" : target === "results" ? "results" : "dashboard");
                    if (target === "announcement") window.requestAnimationFrame(() => document.getElementById("student-announcements")?.scrollIntoView({block:"center",behavior:"smooth"}));
                }}/></div>
                    </header>


            <div className="dashboard-body">
                {sidebarOpen && <button className="student-sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
                {/* ================= SIDEBAR ================= */}

                <aside id="student-sidebar" aria-label="Student navigation"
                    inert={!sidebarOpen && window.matchMedia("(max-width: 720px)").matches}
                    className={`sidebar ${
                        sidebarOpen
                            ? "sidebar-open"
                            : "sidebar-collapsed"
                    }`}
                >
                    <div className="sidebar-brand">
                        <img
                            src={votaraLogoSrc}
                            alt=""
                            className="sidebar-brand-logo"
                        />
                        <span>Votara</span>
                    </div>

                    
                    <div className="sidebar-profile">
                        {profilePicture && !profileImageError ? (
                            <img
                                src={profilePicture}
                                alt={fullName}
                                className="profile-picture"
                                onError={() => setProfileImageError(true)}
                            />
                        ) : (
                            <div className="profile-placeholder">
                                {initials}
                            </div>
                        )}

                        <div className="sidebar-profile-info">
                            <h3>{fullName}</h3>

                            <button
                                type="button"
                                className="sidebar-edit-profile"
                                onClick={() => setSettingsModal("Edit profile")}
                            >
                                Edit Profile
                            </button>
                        </div>

                        <span className="sidebar-online-badge">Online</span>
                    </div>


                    <nav className="sidebar-menu">
                        {sidebarItems.map(
                            (item) => {
                                const isActive =
                                    activeSidebarItem === item.id;

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
                                        aria-current={isActive ? "page" : undefined}
                                        title={item.label}
                                        onClick={() =>
                                            handleMenuClick(
                                                item.id
                                            )
                                        }
                                    >
                                        <span className="sidebar-icon-wrapper">
                                            {item.id === "candidates" || item.id === "results"
                                                ? <StudentDotIcon name={item.id} />
                                                : <img className="student-figma-icon" src={isActive ? item.activeIcon : item.icon} alt="" aria-hidden="true" width="20" height="20" />}
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
                        <div className="sidebar-help-card">
                            <strong>Need help?</strong>
                            <p>Use the dashboard to review your voting status, candidate information, and voter guidelines.</p>
                        </div>
                        <button
                            type="button"
                            className="logout-button"
                            onClick={() => setShowLogoutConfirmation(true)}
                        >
                            <img
                                src={logoutIcon}
                                alt=""
                                className="logout-image"
                            />

                            <span className="logout-text">
                                Log out
                            </span>
                        </button>
                    </div>
                </aside>

                {/* ================= CONTENT ================= */}

                <div className="student-content-scroll" ref={contentScrollRef} tabIndex={0} aria-label="Student dashboard content">
                    {renderMainContent()}
                </div>
            </div>
            
            

{/* ================= CANDIDATE CAMPAIGN PLATFORM ================= */}

{(ballotReview || voteFeedback) && <div className="candidate-platform-overlay"><section className="candidate-platform-modal ballot-review-modal" role="dialog" aria-modal="true" aria-labelledby="ballot-review-title"><h2 id="ballot-review-title">{voteFeedback?"Voting update":"Review your ballot"}</h2>{voteFeedback?<p role="alert">{voteFeedback}</p>:<><p>Unselected positions count as abstentions. You can submit only the candidates you chose.</p><ul>{eligiblePositions.map(position=><li key={position.id}><strong>{position.name}</strong><span>{selectedVotes[position.id]?(candidates.find(candidate=>candidate.id===selectedVotes[position.id])?.full_name||candidates.find(candidate=>candidate.id===selectedVotes[position.id])?.fullName||"Candidate selected"):"No vote — abstain"}</span></li>)}</ul><p>Your choices cannot be changed after submission.</p></>}<footer><button type="button" onClick={()=>{setBallotReview(false);setVoteFeedback("");}}> {voteFeedback?"Close":"Back to ballot"}</button>{!voteFeedback&&<button type="button" className="primary" disabled={voteLoading} onClick={()=>handleSubmitVotes(true)}>Confirm & submit</button>}</footer></section></div>}
{selectedCandidateDetails && (
    <div
        className="candidate-platform-overlay"
        onClick={() => setSelectedCandidateDetails(null)}
    >
        <section
            className="candidate-platform-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidate-platform-title"
            onClick={(event) => event.stopPropagation()}
        >
            <button
                type="button"
                className="candidate-platform-close"
                aria-label="Close campaign platform"
                onClick={() => setSelectedCandidateDetails(null)}
            >
                ×
            </button>

            <div className="candidate-platform-profile">
                <img
                    src={
                        resolveImageUrl(
                            selectedCandidateDetails.profile_picture ||
                            selectedCandidateDetails.profilePicture ||
                            selectedCandidateDetails.profile_picture_url ||
                            selectedCandidateDetails.profilePictureUrl
                        ) || candidatesIcon
                    }
                    alt={
                        selectedCandidateDetails.full_name ||
                        selectedCandidateDetails.fullName ||
                        selectedCandidateDetails.name ||
                        "Candidate"
                    }
                    className="candidate-platform-image"
                />

                <div className="candidate-platform-identity">
                    <span className="candidate-platform-kicker">
                        Candidate Profile
                    </span>

                    <h2 id="candidate-platform-title">
                        {selectedCandidateDetails.full_name ||
                            selectedCandidateDetails.fullName ||
                            selectedCandidateDetails.name ||
                            "Candidate"}
                    </h2>

                    <p>
                        For{" "}
                        <strong>
                            {selectedCandidateDetails.position_name ||
                                selectedCandidateDetails.positionName ||
                                selectedCandidateDetails.position?.name ||
                                selectedCandidateDetails.position ||
                                "Student Officer"}
                        </strong>
                    </p>
                </div>
            </div>

            <div className="candidate-platform-content">
                <h3>Campaign Platform</h3>

                {(() => {
                    const platform =
                        selectedCandidateDetails.campaign_platform ||
                        selectedCandidateDetails.campaignPlatform ||
                        selectedCandidateDetails.platform ||
                        selectedCandidateDetails.manifesto ||
                        selectedCandidateDetails.platform_statement ||
                        selectedCandidateDetails.platformStatement ||
                        selectedCandidateDetails.description ||
                        "";

                    if (Array.isArray(platform)) {
                        return platform.length > 0 ? (
                            <ol>
                                {platform.map((item, index) => (
                                    <li key={index}>
                                        {typeof item === "string"
                                            ? item
                                            : item?.description ||
                                              item?.text ||
                                              JSON.stringify(item)}
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="candidate-platform-empty">
                                This candidate has not provided a campaign
                                platform yet.
                            </p>
                        );
                    }

                    if (typeof platform === "object" && platform !== null) {
                        const entries = Object.values(platform).filter(
                            (item) => typeof item === "string" && item.trim()
                        );

                        return entries.length > 0 ? (
                            <ul>
                                {entries.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="candidate-platform-empty">
                                This candidate has not provided a campaign
                                platform yet.
                            </p>
                        );
                    }

                    return platform.trim() ? (
                        <p className="candidate-platform-text">
                            {platform}
                        </p>
                    ) : (
                        <p className="candidate-platform-empty">
                            This candidate has not provided a campaign
                            platform yet.
                        </p>
                    );
                })()}
            </div>

            <div className="candidate-platform-footer">
                <button
                    type="button"
                    onClick={() => setSelectedCandidateDetails(null)}
                >
                    Close
                </button>
            </div>
        </section>
    </div>
)}


            {/* ================= SETTINGS / PROFILE MODAL ================= */}

            {settingsModal === "Edit profile" && (
                <dialog
                    ref={profileDialog}
                    aria-label="My profile"
                    onCancel={() => setSettingsModal(null)}
                    className="settings-modal-overlay student-profile-dialog"
                    onClick={() =>
                        setSettingsModal(null)
                    }
                >
                    <div
                        className="settings-modal profile-settings-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            type="button"
                            className="modal-close profile-modal-close"
                            aria-label="Close profile"
                            onClick={() =>
                                setSettingsModal(null)
                            }
                        >
                            ×
                        </button>

                        <Profile
                            onClose={() =>
                                setSettingsModal(null)
                            }
                            onProfileUpdated={
                                handleProfileUpdated
                            }
                        />
                    </div>
                </dialog>
            )}

            {/* ================= CHANGE PASSWORD MODAL ================= */}

            {settingsModal === "Change password" && (
                <div
                    className="settings-modal-overlay password-modal-overlay"
                    onClick={closePasswordModal}
                >
                    <section
                        className="password-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="password-modal-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {!passwordChangeSuccess ? (
                            <>
                                <div className="password-modal-heading">
                                    <span className="password-modal-eyebrow">
                                        STUDENT / SETTINGS
                                    </span>
                                    <h2 id="password-modal-title">Change password</h2>
                                    <p>
                                        Enter your current password and confirm your new password.
                                    </p>
                                </div>

                                <form className="password-change-form" onSubmit={handlePasswordChange}>
                                    <label>
                                        Current password
                                        <input
                                            type="password"
                                            autoComplete="current-password"
                                            placeholder="Enter current password"
                                            value={passwordForm.currentPassword}
                                            onChange={(event) => setPasswordForm((previous) => ({
                                                ...previous,
                                                currentPassword: event.target.value,
                                            }))}
                                            required
                                        />
                                    </label>

                                    <label>
                                        New password
                                        <input
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Enter new password"
                                            value={passwordForm.newPassword}
                                            onChange={(event) => setPasswordForm((previous) => ({
                                                ...previous,
                                                newPassword: event.target.value,
                                            }))}
                                            required
                                        />
                                    </label>

                                    <div className="password-requirements">
                                        <h3>Password requirements</h3>
                                        {passwordRequirements.map((requirement) => (
                                            <div
                                                className={`password-requirement ${requirement.valid ? "is-valid" : ""}`}
                                                key={requirement.label}
                                            >
                                                <span aria-hidden="true">
                                                    {requirement.valid ? "✓" : "○"}
                                                </span>
                                                {requirement.label}
                                            </div>
                                        ))}
                                    </div>

                                    <label>
                                        Confirm new password
                                        <input
                                            type="password"
                                            autoComplete="new-password"
                                            placeholder="Confirm new password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(event) => setPasswordForm((previous) => ({
                                                ...previous,
                                                confirmPassword: event.target.value,
                                            }))}
                                            required
                                        />
                                    </label>

                                    {passwordForm.confirmPassword && (
                                        <p className={`password-match-message ${
                                            passwordForm.newPassword === passwordForm.confirmPassword
                                                ? "is-valid"
                                                : "is-invalid"
                                        }`}>
                                            {passwordForm.newPassword === passwordForm.confirmPassword
                                                ? "Passwords match."
                                                : "Passwords do not match."}
                                        </p>
                                    )}

                                    {passwordError && (
                                        <p className="password-error" role="alert">
                                            {passwordError}
                                        </p>
                                    )}

                                    <div className="password-modal-actions">
                                        <button
                                            type="button"
                                            className="password-cancel-button"
                                            onClick={closePasswordModal}
                                            disabled={passwordLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="password-submit-button"
                                            disabled={passwordLoading}
                                        >
                                            {passwordLoading ? "Updating..." : "Update password"}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="password-success-content">
                                <div className="password-success-icon" aria-hidden="true">✓</div>
                                <h2 id="password-modal-title">Password updated</h2>
                                <p>Use your new password the next time you sign in.</p>
                                <button
                                    type="button"
                                    className="password-submit-button password-done-button"
                                    onClick={closePasswordModal}
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* ================= OTHER SETTINGS MODALS ================= */}

            {settingsModal &&
                settingsModal !== "Edit profile" &&
                settingsModal !== "Change password" &&
                settingsModal !== "Report an Issue" && (
                    <div
                        className="settings-modal-overlay"
                        onClick={() => setSettingsModal(null)}
                    >
                        <div
                            className="settings-modal"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <button
                                type="button"
                                className="modal-close"
                                aria-label="Close settings"
                                onClick={() => setSettingsModal(null)}
                            >
                                ×
                            </button>

                            <h2>{settingsModal}</h2>

                            <p>
                                This section is ready
                                to be connected to its
                                corresponding feature
                                or API.
                            </p>

                            <button
                                type="button"
                                className="modal-confirm-button"
                                onClick={() => setSettingsModal(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

            {settingsModal === "Report an Issue" && reportView && (
                <div className="student-report-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !reportSubmitting) closeReportFlow(); }}>
                    <section className="student-report-modal" role="dialog" aria-modal="true" aria-labelledby="student-report-title">
                        <button type="button" className="student-report-close" aria-label="Close report dialog" onClick={closeReportFlow} disabled={reportSubmitting}>×</button>
                        {reportView === "category" && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS · REPORT AN ISSUE</div>
                            <h2 id="student-report-title">Issue category</h2>
                            <p className="student-report-intro">Choose the category that best describes your issue.</p>
                            <div className="student-report-category-list">{reportCategories.map((category) => <button type="button" key={category} onClick={() => { setReportDraft((current) => ({ ...current, category, contactEmail: current.contactEmail || student?.email || student?.email_address || student?.contactEmail || "" })); setReportError(""); setReportView("form"); }}>{category}<span>›</span></button>)}</div>
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={loadReportHistory} disabled={reportLoading}>{reportLoading ? "Loading history…" : "View report history"}</button><button type="button" className="student-report-quiet" onClick={closeReportFlow}>Cancel</button></div>
                        </>}
                        {reportView === "form" && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS · NEW REPORT</div>
                            <h2 id="student-report-title">Report an issue</h2>
                            <p className="student-report-intro">Provide the details below. Your report will be sent to the VOTARA administrator.</p>
                            <div className="student-report-selected-category"><span>Issue category</span><strong>{reportDraft.category}</strong><button type="button" onClick={() => setReportView("category")}>Change</button></div>
                            <form className="student-report-form" onSubmit={submitIssueReport}>
                                <label>Subject <span>*</span><input required minLength={4} maxLength={160} value={reportDraft.subject} onChange={(event) => setReportDraft((current) => ({ ...current, subject: event.target.value }))} placeholder="Briefly describe the issue" /></label>
                                <label>Description <span>*</span><textarea required minLength={10} maxLength={5000} rows={5} value={reportDraft.description} onChange={(event) => setReportDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Explain what happened and include any useful details." /></label>
                                <label>Contact email <span>*</span><input type="email" required value={reportDraft.contactEmail} onChange={(event) => setReportDraft((current) => ({ ...current, contactEmail: event.target.value }))} placeholder="name@example.com" /></label>
                                <label>Attachment <small>Optional · JPG, PNG, WEBP, or PDF · Max 5 MB</small><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleReportAttachment} /></label>
                                {reportDraft.attachment && <div className="student-report-attachment-name">Attached: {reportDraft.attachment.name}<button type="button" onClick={() => setReportDraft((current) => ({ ...current, attachment: null }))}>Remove</button></div>}
                                {reportError && <div className="student-report-error" role="alert">{reportError}</div>}
                                <p>Each account may submit up to 5 reports. Your history and administrator replies remain available.</p><div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={() => setReportView("category")} disabled={reportSubmitting}>Back</button><button type="submit" className="student-report-primary" disabled={reportSubmitting}>{reportSubmitting ? "Submitting…" : "Submit report"}</button></div>
                            </form>
                        </>}
                        {reportView === "submitted" && submittedReport && <div className="student-report-submitted">
                            <div className="student-report-success-icon">✓</div><div className="student-report-kicker">STUDENT / SETTINGS · REPORT SUBMITTED</div><h2 id="student-report-title">Report submitted</h2><p>Your issue has been recorded. You can review its status in your report history.</p>
                            <div className="student-report-reference"><span>Report reference</span><strong>{submittedReport.reference}</strong></div><p className="student-report-contact">Updates will be associated with {submittedReport.contact_email || reportDraft.contactEmail}.</p>
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={loadReportHistory}>View report history</button><button type="button" className="student-report-primary" onClick={closeReportFlow}>Done</button></div>
                        </div>}
                        {reportView === "history" && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS</div><h2 id="student-report-title">My report history</h2><p className="student-report-intro">Review the reports you have submitted and their latest status.</p>
                            {reportError && <div className="student-report-error" role="alert">{reportError}</div>}
                            {reportLoading ? <div className="student-report-empty">Loading your reports…</div> : reportHistory.length ? <div className="student-report-history-list">{reportHistory.map((report) => <button type="button" className="student-report-history-item" key={report.id} onClick={() => openReportHistoryDetail(report)}><span className="student-report-history-copy"><strong>{report.subject}</strong><small>{report.reference} · {report.category} · {new Date(report.created_at).toLocaleDateString()}</small></span><span className={`student-report-status status-${report.status}`}>{String(report.status).replace("_", " ")}</span><b>›</b></button>)}</div> : <div className="student-report-empty">You have not submitted any reports yet.</div>}
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={openReportCategory}>New report</button><button type="button" className="student-report-primary" onClick={closeReportFlow}>Done</button></div>
                        </>}
                        {reportView === "history-detail" && selectedReport && <>
                            <div className="student-report-kicker">STUDENT / SETTINGS · REPORT DETAILS</div><h2 id="student-report-title">{selectedReport.reference}</h2>
                            <div className="student-report-detail-card"><div><span>Status</span><strong className={`student-report-status status-${selectedReport.status}`}>{String(selectedReport.status).replace("_", " ")}</strong></div><div><span>Category</span><strong>{selectedReport.category}</strong></div><div><span>Subject</span><strong>{selectedReport.subject}</strong></div><div><span>Description</span><p>{selectedReport.description}</p></div>{selectedReport.admin_response && <div><span>Administrator response</span><p>{selectedReport.admin_response}</p></div>}{selectedReport.attachment_url && <div><span>Attachment</span><a href={selectedReport.attachment_url} target="_blank" rel="noreferrer">View attachment</a></div>}</div>
                            <h3 className="student-report-timeline-title">Report updates</h3>{reportHistoryTimeline.length ? <div className="student-report-timeline">{reportHistoryTimeline.map((item) => <div key={item.id}><strong>{String(item.status).replace("_", " ")}</strong><span>{item.note || "Status updated"}</span><small>{new Date(item.created_at).toLocaleString()}</small></div>)}</div> : <div className="student-report-empty">No status updates are available yet.</div>}
                            {reportError && <div className="student-report-error" role="alert">{reportError}</div>}
                            <div className="student-report-modal-footer"><button type="button" className="student-report-secondary" onClick={loadReportHistory}>Back to history</button><button type="button" className="student-report-primary" onClick={closeReportFlow}>Done</button></div>
                        </>}
                    </section>
                </div>
            )}

            {showLogoutConfirmation && (
                <div
                    className="logout-confirmation-overlay"
                    onClick={() => setShowLogoutConfirmation(false)}
                >
                    <section
                        className="logout-confirmation-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-confirmation-title"
                        aria-describedby="logout-confirmation-description"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="logout-confirmation-symbol" aria-hidden="true">
                            <FiLogOut />
                        </div>
                        <h2 id="logout-confirmation-title">Sign out?</h2>
                        <p id="logout-confirmation-description">
                            Are you sure you want to log out of your student account?
                        </p>
                        <div className="logout-confirmation-actions">
                            <button
                                type="button"
                                className="logout-cancel-button"
                                onClick={() => setShowLogoutConfirmation(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="logout-confirm-button"
                                onClick={handleLogout}
                            >
                                Sign out
                            </button>
                        </div>
                    </section>
                </div>
            )}

            </div>
    );
}

export default StudentDashboard;
