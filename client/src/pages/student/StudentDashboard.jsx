import { useEffect, useMemo, useState } from "react";
import "./StudentDashboard.css";
import Profile from "./Profile";
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
} from "../../services/studentService";

// =====================================================
// VITE ASSET IMPORTS
// Keep images in client/src/images and import them so Vite
// bundles them correctly for both local development and Vercel.
// =====================================================

import votaraLogoSrc from "../../images/Votara.png";
import dashboardIcon from "../../images/homealt.png";
import dashboardActiveIcon from "../../images/home.png";
import voteIcon from "../../images/votealt.png";
import voteActiveIcon from "../../images/review.png";
import candidatesIcon from "../../images/Candidates.png";
import resultsIcon from "../../images/Results.png";
import guidelinesIcon from "../../images/guidelinesalt.png";
import guidelinesActiveIcon from "../../images/guidelines.png";
import settingsIcon from "../../images/settingalt.png";
import settingsActiveIcon from "../../images/setting.png";
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
    const handleResize = () => {
        setSidebarOpen(window.matchMedia("(min-width: 721px)").matches);
    };

    window.addEventListener("resize", handleResize);

    return () => {
        window.removeEventListener("resize", handleResize);
    };
}, []);
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [activeSidebarItem, setActiveSidebarItem] = useState("dashboard");

    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);

    const [searchValue, setSearchValue] = useState("");
    const [calendarTab, setCalendarTab] = useState("Today");
    const [selectedFaq, setSelectedFaq] = useState(null);

    const [settingsModal, setSettingsModal] = useState(null);
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
            const token =
                localStorage.getItem("votaraToken") ||
                localStorage.getItem("votaraStudentToken") ||
                localStorage.getItem("studentToken") ||
                "";

            // Show the saved account immediately while the server refresh runs.
            if (!cancelled && storedStudent) {
                setStudent(storedStudent);
            }

            if (!token) {
                if (!cancelled) {
                    setStudent(storedStudent || null);
                    setLoading(false);
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
        activeIcon: dashboardActiveIcon,
    },
    {
        id: "vote",
        label: "Vote",
        icon: voteIcon,
        activeIcon: voteActiveIcon,
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

    window.scrollTo({
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
            [positionId]: candidateId,
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

    const handleSubmitVotes = async () => {
        if (!election?.id) {
            alert(
                "There is no election currently available for voting."
            );
            return;
        }

        if (!electionIsOpen) {
            alert(
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
            alert(
                "1st Year students are not eligible to vote in this election."
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
                                    ? "SELECTED"
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
                                    <span className="live-results-badge">
                                        <span className="live-results-dot" />
                                        Awaiting data
                                    </span>
                                </div>

                                <div className="live-results-empty-state">
                                    <div className="live-results-icon" aria-hidden="true">
                                        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <rect x="5" y="5" width="38" height="38" rx="12" fill="#EEF4FF" />
                                            <path d="M14 32V25M24 32V17M34 32V21" stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <h4>Election results will appear here</h4>
                                    <p>Candidate standings and vote percentages will be displayed here when results are connected to the Electoral Board.</p>
                                    <span className="live-results-note">Results are not available yet.</span>
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

                                                    <span className="directory-position-badge">
                                                        {position.name}
                                                    </span>

                                                    <p className="directory-party-name">
                                                        Party List:{" "}
                                                        {candidate.party_list?.name ||
                                                            candidate.partyList?.name ||
                                                            "Independent"}
                                                    </p>

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
                                            {position.is_required !== false
                                                ? "You must select one candidate for this position."
                                                : "This position is optional."}
                                        </p>
                                        {position.description && <p>{position.description}</p>}
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
                                        onClick={handleSubmitVotes}
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
                        onClick={() => setSidebarOpen((previous) => !previous)}
                        aria-label="Toggle sidebar"
                    >
                        <span />
                        <span />
                        <span />
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
                        ⌕
                    </button>
                </div>

                <div className="nav-right">
                    <button
                        type="button"
                        className="nav-icon-button"
                        aria-label="Notifications"
                        onClick={() => alert("You have no new notifications.")}
                    >
                        <img
                            src={bellIcon}
                            alt="Notifications"
                            className="nav-icon-image"
                        />
                    </button>
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

                {renderMainContent()}
            </div>
            
            

{/* ================= CANDIDATE CAMPAIGN PLATFORM ================= */}

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
                <div
                    className="settings-modal-overlay"
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
                </div>
            )}

            {/* ================= OTHER SETTINGS MODALS ================= */}

            {settingsModal &&
                settingsModal !== "Edit profile" && (
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
                                aria-label="Close settings"
                                onClick={() =>
                                    setSettingsModal(null)
                                }
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
                                onClick={() =>
                                    setSettingsModal(null)
                                }
                            >
                                Close
                            </button>
                        </div>
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
                            ?
                        </div>
                        <h2 id="logout-confirmation-title">Log out of VOTARA?</h2>
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
                                Yes, log out
                            </button>
                        </div>
                    </section>
                </div>
            )}

            </div>
    );
}

export default StudentDashboard;
