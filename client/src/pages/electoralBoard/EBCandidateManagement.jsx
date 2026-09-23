import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";

/*
=============================================================
VOTARA - CANDIDATE MANAGEMENT
Electoral Board
=============================================================

Features:
- Election selection
- Election Management integration (selected election can be passed automatically)
- Registered student search
- Student ID / full name search
- 11 standard VOTARA election positions
- Year-level representative restrictions
- Party List selection
- Independent candidate option
- Profile picture upload
- Image preview/compression
- Add candidate
- Edit candidate
- View candidate
- Activate / Deactivate
- Candidate search
- Responsive professional UI

No QR functionality.
No candidate approval workflow.
=============================================================
*/

// ============================================================
// CONSTANTS
// ============================================================

const YEAR_LEVELS = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
];

const POSITION_NAMES = [
    "President",
    "Vice President",
    "Secretary",
    "Treasurer",
    "Auditor",
    "Business Manager",
    "Public Information Officer",
    "Sergeant at Arms",
    "2nd Year Representative",
    "3rd Year Representative",
    "4th Year Representative",
];

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;


// ============================================================
// HELPERS
// ============================================================

const getArray = (response, keys = []) => {
    if (Array.isArray(response?.data)) {
        return response.data;
    }

    for (const key of keys) {
        if (Array.isArray(response?.data?.[key])) {
            return response.data[key];
        }
    }

    return [];
};

const getId = (item) => {
    return item?.id || item?._id || "";
};

const normalizeYear = (value) => {
    if (!value) return "";

    const text = String(value)
        .trim()
        .toLowerCase();

    if (
        text.includes("1st") ||
        text.includes("first") ||
        text === "1"
    ) {
        return "1st Year";
    }

    if (
        text.includes("2nd") ||
        text.includes("second") ||
        text === "2"
    ) {
        return "2nd Year";
    }

    if (
        text.includes("3rd") ||
        text.includes("third") ||
        text === "3"
    ) {
        return "3rd Year";
    }

    if (
        text.includes("4th") ||
        text.includes("fourth") ||
        text === "4"
    ) {
        return "4th Year";
    }

    return String(value);
};

const normalizeText = (value) => {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
};

const formatElectionDate = (date) => {
    if (!date) return "Election date not set";

    try {
        return new Date(date).toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric",
                year: "numeric",
            }
        );
    } catch {
        return "Election date not set";
    }
};

const getStudentName = (candidate) => {
    return (
        candidate?.full_name ||
        candidate?.student?.full_name ||
        candidate?.student_name ||
        "Unknown Student"
    );
};

const getStudentId = (candidate) => {
    return (
        candidate?.student?.student_id ||
        candidate?.student_number ||
        candidate?.registered_student_id ||
        candidate?.student_id ||
        "N/A"
    );
};

const getPositionName = (candidate) => {
    return (
        candidate?.position?.name ||
        candidate?.position_name ||
        "Position not assigned"
    );
};

const getPartyName = (candidate) => {
    return (
        candidate?.party_list?.name ||
        candidate?.party_list_name ||
        "Independent"
    );
};


// ============================================================
// POSITION ELIGIBILITY
// ============================================================

const isRepresentativePosition = (name) => {
    return (
        normalizeText(name) ===
            normalizeText("2nd Year Representative") ||
        normalizeText(name) ===
            normalizeText("3rd Year Representative") ||
        normalizeText(name) ===
            normalizeText("4th Year Representative")
    );
};

const isStudentEligibleForPosition = (
    student,
    position
) => {
    if (!student || !position) {
        return true;
    }

    const studentYear = normalizeYear(
        student.year_level
    );

    const positionName =
        position.name || "";

    if (
        normalizeText(positionName) ===
        normalizeText("2nd Year Representative")
    ) {
        return studentYear === "2nd Year";
    }

    if (
        normalizeText(positionName) ===
        normalizeText("3rd Year Representative")
    ) {
        return studentYear === "3rd Year";
    }

    if (
        normalizeText(positionName) ===
        normalizeText("4th Year Representative")
    ) {
        return studentYear === "4th Year";
    }

    /*
     * 1st Year students do not use the general
     * year-level representative positions.
     */
    return true;
};


// ============================================================
// COMPONENT
// ============================================================

function EBCandidateManagement() {

    const navigate = useNavigate();
    const location = useLocation();

    // The Back button is shown only when Candidate Management
    // was opened from Election Management -> Manage Candidates.
    const cameFromElectionManagement = Boolean(
        location.state?.electionId
    );

    // ========================================================
    // DATA
    // ========================================================

    const [elections, setElections] = useState([]);
    const [students, setStudents] = useState([]);
    const [positions, setPositions] = useState([]);
    const [partyLists, setPartyLists] = useState([]);
    const [candidates, setCandidates] = useState([]);

    const [selectedElectionId, setSelectedElectionId] =
        useState("");

    // ========================================================
    // PARTY LIST CONTEXT
    // ========================================================

    // When Candidate Management is opened from a specific
    // party list, keep the selected party list as the active
    // context so only its candidates are displayed and new
    // candidates are automatically assigned to that party.
    const partyListContextId =
        location.state?.partyListId || "";

    const partyListContextName =
        location.state?.partyListName || "";

    const isPartyListScoped =
        Boolean(partyListContextId);

    // ========================================================
    // SEARCH
    // ========================================================

    const [candidateSearch, setCandidateSearch] =
        useState("");

    const [studentSearch, setStudentSearch] =
        useState("");

    const [
        showStudentResults,
        setShowStudentResults,
    ] = useState(false);

    // ========================================================
    // LOADING
    // ========================================================

    const [loading, setLoading] =
        useState(false);

    const [loadingOptions, setLoadingOptions] =
        useState(false);

    // ========================================================
    // ALERTS
    // ========================================================

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");

    // ========================================================
    // MODALS
    // ========================================================

    const [showModal, setShowModal] =
        useState(false);

    const [showDetails, setShowDetails] =
        useState(false);

    const [showConfirmation, setShowConfirmation] =
        useState(false);

    // ========================================================
    // SELECTED
    // ========================================================

    const [editingCandidate, setEditingCandidate] =
        useState(null);

    const [selectedCandidate, setSelectedCandidate] =
        useState(null);

    const [confirmation, setConfirmation] =
        useState(null);

    // ========================================================
    // IMAGE
    // ========================================================

    const fileInputRef = useRef(null);

    // ========================================================
    // FORM
    // ========================================================

    const [form, setForm] = useState({
        student_id: "",
        position_id: "",
        party_list_id: "",
        platform: "",
        profile_picture: "",
    });

    // ========================================================
    // LOAD ELECTIONS
    // ========================================================

    const loadElections = async () => {
        try {
            setLoadingOptions(true);
            setError("");

            const response =
                await api.get("/elections");

            const list = getArray(response, [
                "elections",
                "data",
                "items",
            ]);

            setElections(list);

            const incomingElectionId =
                location.state?.electionId;

            const incomingElectionExists =
                incomingElectionId &&
                list.some(
                    (election) =>
                        String(getId(election)) ===
                        String(incomingElectionId)
                );

            if (incomingElectionExists) {
                setSelectedElectionId(
                    String(incomingElectionId)
                );
            } else if (
                !selectedElectionId &&
                list.length > 0
            ) {
                setSelectedElectionId(
                    getId(list[0])
                );
            }
        } catch (err) {
            console.error(
                "Candidate elections loading error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to load elections."
            );
        } finally {
            setLoadingOptions(false);
        }
    };

    // ========================================================
    // LOAD ALL OPTIONS
    // ========================================================

    const loadOptions = async () => {
        if (!selectedElectionId) {
            setStudents([]);
            setPositions([]);
            setPartyLists([]);
            setCandidates([]);
            return;
        }

        try {
            setLoadingOptions(true);
            setError("");

            const [
                studentsResponse,
                positionsResponse,
                partyListsResponse,
                candidatesResponse,
            ] = await Promise.all([
                api.get("/candidates/students", {
                    params: {
                        election_id:
                            selectedElectionId,
                    },
                }),

                api.get(
                    `/elections/${selectedElectionId}/positions`
                ),

                api.get("/party-lists", {
                    params: {
                        election_id:
                            selectedElectionId,
                    },
                }),

                api.get("/candidates", {
                    params: {
                        election_id:
                            selectedElectionId,
                    },
                }),
            ]);

            const studentList = getArray(
                studentsResponse,
                [
                    "students",
                    "data",
                    "items",
                ]
            );

            const positionList = getArray(
                positionsResponse,
                [
                    "positions",
                    "data",
                    "items",
                ]
            );

            const partyList = getArray(
                partyListsResponse,
                [
                    "partyLists",
                    "party_lists",
                    "data",
                    "items",
                ]
            );

            const candidateList = getArray(
                candidatesResponse,
                [
                    "candidates",
                    "data",
                    "items",
                ]
            );

            // -----------------------------------------------------
            // PARTY LIST FILTER
            // -----------------------------------------------------
            // Candidate Management can be opened directly from a
            // specific Party List. In that case, only candidates
            // belonging to that Party List should be displayed.
            //
            // When opened normally, all candidates for the selected
            // election remain visible exactly as before.
            const visibleCandidates =
                isPartyListScoped
                    ? candidateList.filter(
                          (candidate) =>
                              String(
                                  candidate.party_list_id ||
                                  candidate.party_list?.id ||
                                  ""
                              ) ===
                              String(
                                  partyListContextId
                              )
                      )
                    : candidateList;

            setStudents(studentList);

            /*
             * Remove duplicate positions from the
             * frontend list using normalized names.
             */
            const uniquePositions = [];

            const seenPositions =
                new Set();

            positionList
                .sort(
                    (a, b) =>
                        Number(
                            a.display_order || 999
                        ) -
                        Number(
                            b.display_order || 999
                        )
                )
                .forEach((position) => {
                    const key =
                        normalizeText(
                            position.name
                        );

                    if (!seenPositions.has(key)) {
                        seenPositions.add(key);
                        uniquePositions.push(
                            position
                        );
                    }
                });

            /*
             * If the database contains fewer positions,
             * we do not invent IDs. We only display the
             * actual DB positions.
             */
            setPositions(
                uniquePositions
            );

            setPartyLists(partyList);
            setCandidates(visibleCandidates);
        } catch (err) {
            console.error(
                "Candidate options loading error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to load candidate information."
            );
        } finally {
            setLoadingOptions(false);
        }
    };

    // ========================================================
    // INITIAL LOAD
    // ========================================================

    useEffect(() => {
        loadElections();
    }, []);

    useEffect(() => {
        loadOptions();
    }, [selectedElectionId]);

    // ========================================================
    // SELECTED ELECTION
    // ========================================================

    const selectedElection = useMemo(() => {
        return elections.find(
            (election) =>
                String(
                    getId(election)
                ) ===
                String(
                    selectedElectionId
                )
        );
    }, [
        elections,
        selectedElectionId,
    ]);

    // ========================================================
    // STUDENT SEARCH
    // ========================================================

    const studentResults = useMemo(() => {
        const keyword =
            normalizeText(studentSearch);

        if (!keyword) {
            return [];
        }

        return students
            .filter((student) => {
                const name =
                    normalizeText(
                        student.full_name
                    );

                const id =
                    normalizeText(
                        student.student_id
                    );

                const year =
                    normalizeText(
                        normalizeYear(
                            student.year_level
                        )
                    );

                return (
                    name.includes(keyword) ||
                    id.includes(keyword) ||
                    year.includes(keyword)
                );
            })
            .slice(0, 12);
    }, [
        students,
        studentSearch,
    ]);

    // ========================================================
    // SELECTED STUDENT
    // ========================================================

    const selectedStudentForForm = useMemo(() => {
        return students.find(
            (student) =>
                String(
                    getId(student)
                ) ===
                String(
                    form.student_id
                )
        );
    }, [
        students,
        form.student_id,
    ]);

    // ========================================================
    // AVAILABLE POSITIONS
    // ========================================================

const availablePositions = useMemo(() => {
    const activePositions =
        positions.filter(
            (position) =>
                position.is_active !== false
        );

    // -----------------------------------------------------
    // PARTY LIST POSITION AVAILABILITY
    // -----------------------------------------------------
    // A party list may have only one candidate per position.
    // When this page is scoped to a party list, positions
    // already occupied by that party are removed from the
    // Add Candidate form. The currently edited candidate keeps
    // its own position available while editing.
    const occupiedPositionIds =
        new Set(
            candidates
                .filter((candidate) => {
                    if (!isPartyListScoped) {
                        return true;
                    }

                    return (
                        String(
                            candidate.party_list_id ||
                            candidate.party_list?.id ||
                            ""
                        ) ===
                        String(
                            partyListContextId
                        )
                    );
                })
                .filter(
                    (candidate) =>
                        String(
                            getId(candidate)
                        ) !==
                        String(
                            getId(
                                editingCandidate
                            )
                        )
                )
                .map(
                    (candidate) =>
                        candidate.position_id ||
                        candidate.position?.id
                )
                .filter(Boolean)
                .map((id) => String(id))
        );

    return activePositions.filter(
        (position) => {
            if (!selectedStudentForForm) {
                return !occupiedPositionIds.has(
                    String(
                        getId(position)
                    )
                );
            }

            if (
                !isStudentEligibleForPosition(
                    selectedStudentForForm,
                    position
                )
            ) {
                return false;
            }

            return !occupiedPositionIds.has(
                String(
                    getId(position)
                )
            );
        }
    );
}, [
    positions,
    selectedStudentForForm,
    candidates,
    editingCandidate,
    isPartyListScoped,
    partyListContextId,
]);

    // ========================================================
    // SELECTED POSITION
    // ========================================================

    const selectedPositionForForm =
        useMemo(() => {
            return positions.find(
                (position) =>
                    String(
                        getId(position)
                    ) ===
                    String(
                        form.position_id
                    )
            );
        }, [
            positions,
            form.position_id,
        ]);

    // ========================================================
    // FILTER CANDIDATES
    // ========================================================

    const filteredCandidates =
        useMemo(() => {
            const keyword =
                normalizeText(
                    candidateSearch
                );

            if (!keyword) {
                return candidates;
            }

            return candidates.filter(
                (candidate) => {
                    const name =
                        normalizeText(
                            getStudentName(
                                candidate
                            )
                        );

                    const studentId =
                        normalizeText(
                            getStudentId(
                                candidate
                            )
                        );

                    const position =
                        normalizeText(
                            getPositionName(
                                candidate
                            )
                        );

                    const party =
                        normalizeText(
                            getPartyName(
                                candidate
                            )
                        );

                    return (
                        name.includes(
                            keyword
                        ) ||
                        studentId.includes(
                            keyword
                        ) ||
                        position.includes(
                            keyword
                        ) ||
                        party.includes(
                            keyword
                        )
                    );
                }
            );
        }, [
            candidates,
            candidateSearch,
        ]);

    // ========================================================
    // STATS
    // ========================================================

    const totalCandidates =
        candidates.length;

    const activeCandidates =
        candidates.filter(
            (candidate) =>
                candidate.is_active === true
        ).length;

    const inactiveCandidates =
        candidates.filter(
            (candidate) =>
                candidate.is_active === false
        ).length;

    const positionsCovered =
        new Set(
            candidates.map(
                (candidate) =>
                    candidate.position_id ||
                    candidate.position?.id
            )
        ).size;

    // ========================================================
    // RESET FORM
    // ========================================================

    const resetForm = () => {
        setForm({
            student_id: "",
            position_id: "",
            party_list_id:
                isPartyListScoped
                    ? String(
                          partyListContextId
                      )
                    : "",
            platform: "",
            profile_picture: "",
        });

        setStudentSearch("");
        setEditingCandidate(null);
    };

    // ========================================================
    // OPEN ADD
    // ========================================================

    const openAddModal = () => {
        if (!selectedElectionId) {
            setError(
                "Please select an election first."
            );
            return;
        }

        resetForm();

        // If opened from Party List Management, the party list is
        // fixed to the party that the EB selected.
        if (isPartyListScoped) {
            setForm((previous) => ({
                ...previous,
                party_list_id:
                    String(
                        partyListContextId
                    ),
            }));
        }

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ========================================================
    // OPEN EDIT
    // ========================================================

    const openEditModal = (candidate) => {
        const student =
            candidate.student ||
            students.find(
                (item) =>
                    String(
                        getId(item)
                    ) ===
                    String(
                        candidate.student_id
                    )
            );

        const position =
            candidate.position ||
            positions.find(
                (item) =>
                    String(
                        getId(item)
                    ) ===
                    String(
                        candidate.position_id
                    )
            );

        setEditingCandidate(
            candidate
        );

        setForm({
            student_id:
                candidate.student_id ||
                candidate.student?.id ||
                "",

            position_id:
                candidate.position_id ||
                candidate.position?.id ||
                "",

            party_list_id:
                candidate.party_list_id ||
                candidate.party_list?.id ||
                "",

            platform:
                candidate.platform || "",

            profile_picture:
                candidate.profile_picture ||
                "",
        });

        setStudentSearch(
            student
                ? `${student.full_name} — ${student.student_id}`
                : ""
        );

        setError("");
        setSuccess("");
        setShowModal(true);
    };

    // ========================================================
    // FORM CHANGE
    // ========================================================

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (name === "position_id") {
            setError("");
        }
    };

    // ========================================================
    // SELECT STUDENT
    // ========================================================

    const selectStudent = (student) => {
        setForm((previous) => ({
            ...previous,
            student_id:
                getId(student),
            position_id: "",
        }));

        setStudentSearch(
            `${student.full_name} — ${student.student_id}`
        );

        setShowStudentResults(
            false
        );

        setError("");
    };

    // ========================================================
    // IMAGE UPLOAD
    // ========================================================

    const compressImage = (
        file
    ) => {
        return new Promise(
            (
                resolve,
                reject
            ) => {
                const reader =
                    new FileReader();

                reader.onload = (
                    event
                ) => {
                    const image =
                        new Image();

                    image.onload =
                        () => {
                            const maxWidth =
                                900;

                            const maxHeight =
                                900;

                            let width =
                                image.width;

                            let height =
                                image.height;

                            if (
                                width >
                                maxWidth
                            ) {
                                height =
                                    Math.round(
                                        (height *
                                            maxWidth) /
                                            width
                                    );

                                width =
                                    maxWidth;
                            }

                            if (
                                height >
                                maxHeight
                            ) {
                                width =
                                    Math.round(
                                        (width *
                                            maxHeight) /
                                            height
                                    );

                                height =
                                    maxHeight;
                            }

                            const canvas =
                                document.createElement(
                                    "canvas"
                                );

                            canvas.width =
                                width;

                            canvas.height =
                                height;

                            const context =
                                canvas.getContext(
                                    "2d"
                                );

                            context.drawImage(
                                image,
                                0,
                                0,
                                width,
                                height
                            );

                            const result =
                                canvas.toDataURL(
                                    "image/jpeg",
                                    0.82
                                );

                            resolve(result);
                        };

                    image.onerror =
                        reject;

                    image.src =
                        event.target.result;
                };

                reader.onerror =
                    reject;

                reader.readAsDataURL(
                    file
                );
            }
        );
    };

    const handleImageUpload = async (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        setError("");

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            setError(
                "Please select a valid image file."
            );

            event.target.value = "";
            return;
        }

        if (
            file.size >
            MAX_IMAGE_SIZE
        ) {
            setError(
                "Profile picture must not exceed 2 MB."
            );

            event.target.value = "";
            return;
        }

        try {
            setLoading(true);

            const compressed =
                await compressImage(
                    file
                );

            setForm((previous) => ({
                ...previous,
                profile_picture:
                    compressed,
            }));
        } catch (err) {
            console.error(
                "Image processing error:",
                err
            );

            setError(
                "Unable to process the profile picture."
            );
        } finally {
            setLoading(false);
            event.target.value = "";
        }
    };

    // ========================================================
    // REMOVE IMAGE
    // ========================================================

    const removeImage = () => {
        setForm((previous) => ({
            ...previous,
            profile_picture: "",
        }));
    };

    // ========================================================
    // SUBMIT CANDIDATE
    // ========================================================

    const submitCandidate = () => {
        setError("");

        if (!selectedElectionId) {
            setError(
                "Please select an election."
            );
            return;
        }

        if (!form.student_id) {
            setError(
                "Please search and select a registered student."
            );
            return;
        }

        if (!form.position_id) {
            setError(
                "Please select an election position."
            );
            return;
        }

        if (
            selectedStudentForForm &&
            selectedPositionForForm &&
            !isStudentEligibleForPosition(
                selectedStudentForForm,
                selectedPositionForForm
            )
        ) {
            setError(
                "This student is not eligible for the selected representative position based on year level."
            );
            return;
        }

        /*
         * 1st Year students cannot use the
         * general year representative positions.
         */
        if (
            normalizeYear(
                selectedStudentForForm?.year_level
            ) === "1st Year" &&
            isRepresentativePosition(
                selectedPositionForForm?.name
            )
        ) {
            setError(
                "1st Year students cannot be assigned to the general year-level representative positions."
            );
            return;
        }

        /*
         * Prevent duplicate student + position.
         */
        const duplicate =
            candidates.find(
                (candidate) => {
                    const candidateStudentId =
                        candidate.student_id ||
                        candidate.student?.id;

                    const candidatePositionId =
                        candidate.position_id ||
                        candidate.position?.id;

                    return (
                        String(
                            candidateStudentId
                        ) ===
                            String(
                                form.student_id
                            ) &&
                        String(
                            candidatePositionId
                        ) ===
                            String(
                                form.position_id
                            ) &&
                        String(
                            getId(
                                candidate
                            )
                        ) !==
                            String(
                                getId(
                                    editingCandidate
                                )
                            )
                    );
                }
            );

        if (duplicate) {
            setError(
                "This student is already assigned to this position."
            );
            return;
        }

        const studentName =
            selectedStudentForForm
                ?.full_name ||
            "this student";

        const positionName =
            selectedPositionForForm
                ?.name ||
            "this position";

        // A Party List can have only one candidate per position.
        // The availablePositions list normally prevents this in
        // the UI, but keep a final frontend guard as well.
        if (isPartyListScoped && !editingCandidate) {
            const positionAlreadyUsed =
                candidates.some((candidate) => {
                    const candidatePartyId =
                        candidate.party_list_id ||
                        candidate.party_list?.id ||
                        "";

                    const candidatePositionId =
                        candidate.position_id ||
                        candidate.position?.id ||
                        "";

                    return (
                        String(candidatePartyId) ===
                            String(partyListContextId) &&
                        String(candidatePositionId) ===
                            String(form.position_id)
                    );
                });

            if (positionAlreadyUsed) {
                setError(
                    "This party list already has a candidate for the selected position. Please choose another available position."
                );
                return;
            }
        }

        setConfirmation({
            title: editingCandidate
                ? "Update Candidate"
                : "Add Candidate",

            message:
                editingCandidate
                    ? `Are you sure you want to update ${studentName}'s candidate information?`
                    : `Are you sure you want to add ${studentName} as ${positionName}?`,

            action: async () => {
                await saveCandidate();
            },
        });

        setShowConfirmation(true);
    };

    // ========================================================
    // SAVE CANDIDATE
    // ========================================================

    const saveCandidate = async () => {
        try {
            setLoading(true);
            setError("");
            setSuccess("");

            const payload = {
                election_id:
                    selectedElectionId,

                position_id:
                    form.position_id,

                student_id:
                    form.student_id,

                party_list_id:
                    form.party_list_id ||
                    null,

                platform:
                    form.platform.trim(),

                profile_picture:
                    form.profile_picture ||
                    "",
            };

            if (editingCandidate) {
                await api.put(
                    `/candidates/${getId(
                        editingCandidate
                    )}`,
                    payload
                );

                setSuccess(
                    "Candidate information updated successfully."
                );
            } else {
                await api.post(
                    "/candidates",
                    payload
                );

                setSuccess(
                    "Candidate added successfully."
                );
            }

            setShowModal(false);
            setShowConfirmation(false);
            setConfirmation(null);

            resetForm();

            await loadOptions();
        } catch (err) {
            console.error(
                "Candidate save error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                    "Unable to save candidate."
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================================
    // ACTIVATE / DEACTIVATE
    // ========================================================

    const requestStatusChange =
        (candidate) => {
            const name =
                getStudentName(
                    candidate
                );

            const isActive =
                candidate.is_active ===
                true;

            setConfirmation({
                title: isActive
                    ? "Deactivate Candidate"
                    : "Activate Candidate",

                message: isActive
                    ? `Deactivating ${name} will make this candidate inactive and unavailable for the official ballot.`
                    : `Activating ${name} will make this candidate active for the election.`,

                action:
                    async () => {
                        await updateCandidateStatus(
                            candidate
                        );
                    },
            });

            setShowConfirmation(true);
        };

    const updateCandidateStatus =
        async (candidate) => {
            try {
                setLoading(true);
                setError("");
                setSuccess("");

                const isActive =
                    candidate.is_active ===
                    true;

                const endpoint =
                    isActive
                        ? `/candidates/${getId(
                              candidate
                          )}/deactivate`
                        : `/candidates/${getId(
                              candidate
                          )}/activate`;

                await api.patch(
                    endpoint
                );

                setSuccess(
                    isActive
                        ? "Candidate deactivated successfully."
                        : "Candidate activated successfully."
                );

                setShowConfirmation(
                    false
                );

                setConfirmation(
                    null
                );

                await loadOptions();
            } catch (err) {
                console.error(
                    "Candidate status error:",
                    err
                );

                setError(
                    err?.response?.data
                        ?.message ||
                        "Unable to update candidate status."
                );
            } finally {
                setLoading(false);
            }
        };

    // ========================================================
    // VIEW CANDIDATE
    // ========================================================

    const viewCandidate = (
        candidate
    ) => {
        setSelectedCandidate(
            candidate
        );

        setShowDetails(true);
    };

    // =========================================================
// DELETE INACTIVE CANDIDATE
// =========================================================

const requestDeleteCandidate = (candidate) => {
    const name =
        getStudentName(candidate);

    // Safety check on the frontend
    if (candidate.is_active === true) {
        setError(
            "Active candidates cannot be deleted. Deactivate the candidate first."
        );

        return;
    }

    setConfirmation({
        type: "delete",

        title:
            "Delete Candidate",

        message:
            `Are you sure you want to permanently delete ${name}? This candidate will be removed from the candidate list and will no longer be available for the official ballot.`,

        action:
            async () => {
                await deleteCandidate(
                    candidate
                );
            },
    });

    setShowConfirmation(true);
};

// =========================================================
// DELETE CANDIDATE
// =========================================================

const deleteCandidate = async (
    candidate
) => {
    try {
        setLoading(true);
        setError("");
        setSuccess("");

        if (candidate.is_active === true) {
            throw new Error(
                "Active candidates cannot be deleted. Deactivate the candidate first."
            );
        }

        await api.delete(
            `/candidates/${getId(candidate)}`
        );

        setSuccess(
            `${getStudentName(candidate)} was permanently removed from the candidate list.`
        );

        setShowConfirmation(false);
        setConfirmation(null);

        await loadOptions();

    } catch (err) {
        console.error(
            "Delete candidate error:",
            err
        );

        setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to delete candidate."
        );

    } finally {
        setLoading(false);
    }
};

    // ========================================================
    // PREPARE CANDIDATE
    // ========================================================

    const prepareCandidate = (
        candidate
    ) => {
        const name =
            getStudentName(
                candidate
            );

        if (
            candidate.is_active ===
            true
        ) {
            setSuccess(
                `${name} is already active and ready for the election.`
            );

            return;
        }

        setConfirmation({
            title: "Prepare Candidate",

            message: `Activate ${name} so the candidate can appear as an active election candidate?`,

            action:
                async () => {
                    await updateCandidateStatus(
                        candidate
                    );
                },
        });

        setShowConfirmation(true);
    };

    // ========================================================
    // CLOSE MODALS
    // ========================================================

    const closeCandidateModal =
        () => {
            if (loading) return;

            setShowModal(false);
            resetForm();
        };

    const closeConfirmation =
        () => {
            if (loading) return;

            setShowConfirmation(
                false
            );

            setConfirmation(
                null
            );
        };

    // ========================================================
    // RENDER
    // ========================================================

    return (
        <div style={styles.page}>
            <style>{`
                .candidate-delete-button:hover {
                    background: #fef2f2 !important;
                    border-color: #dc2626 !important;
                    color: #b91c1c !important;
                }

                @keyframes votaraSpin {
                    from {
                        transform: rotate(0deg);
                    }

                    to {
                        transform: rotate(360deg);
                    }
                }

                @keyframes votaraFade {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(.99);
                    }

                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .candidate-hover:hover {
                    border-color: #bcd3f5 !important;
                    box-shadow: 0 8px 24px rgba(37, 99, 235, .08);
                    transform: translateY(-1px);
                }

                .votara-button:hover {
                    filter: brightness(.97);
                }

                .student-result:hover {
                    background: #f5f9ff !important;
                    border-color: #bfdbfe !important;
                }

                .upload-area:hover {
                    border-color: #2563eb !important;
                    background: #f8fbff !important;
                }

                .position-option:hover {
                    background: #f8fbff !important;
                }

                @media (max-width: 1050px) {
                    .candidate-grid {
                        grid-template-columns: 1fr !important;
                    }

                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }

                @media (max-width: 700px) {
                    .top-header {
                        padding: 15px 18px !important;
                    }

                    .main-content {
                        padding: 20px 14px 50px !important;
                    }

                    .header-layout {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }

                    .candidate-card {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }

                    .candidate-actions {
                        width: 100% !important;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr !important;
                    }

                    .selector-layout {
                        flex-direction: column !important;
                    }
                }
            `}</style>

            {/* ==================================================
                TOP HEADER
            =================================================== */}

            <div
                className="top-header"
                style={{
                    ...styles.topHeader,
                    gap: "16px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        minWidth: 0,
                    }}
                >
                    {cameFromElectionManagement && (
                        <button
                            type="button"
                            onClick={() =>
                                navigate("/electoral-board/dashboard")
                            }
                            aria-label="Back to Electoral Board Dashboard"
                            title="Back to EB Dashboard"
                            style={{
                                width: "38px",
                                height: "38px",
                                flex: "0 0 38px",
                                border: "1px solid #d8e1ef",
                                background: "#ffffff",
                                color: "#266EFF",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontSize: "21px",
                                fontWeight: 800,
                                lineHeight: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            ←
                        </button>
                    )}

                    <div>
                        <h1 style={styles.topTitle}>
                            Candidate Management
                        </h1>

                        <p style={styles.topSubtitle}>
                            Manage and prepare candidates
                            for the official VOTARA
                            election ballot.
                        </p>

                        {isPartyListScoped && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "7px",
                                    padding: "7px 11px",
                                    borderRadius: "9px",
                                    background: "#eef4ff",
                                    border: "1px solid #d7e4ff",
                                    color: "#1e3a8a",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                }}
                            >
                                <span>▰</span>
                                <span>
                                    Party List: {partyListContextName || "Selected Party List"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    className="votara-button"
                    style={styles.primaryButton}
                    onClick={openAddModal}
                >
                    + Add Candidate
                </button>
            </div>

            {/* ==================================================
                MAIN CONTENT
            =================================================== */}

            <div
                className="main-content"
                style={styles.content}
            >
                {/* ==================================================
                    ALERTS
                =================================================== */}

                {error && (
                    <Alert
                        type="error"
                        message={error}
                        onClose={() =>
                            setError("")
                        }
                    />
                )}

                {success && (
                    <Alert
                        type="success"
                        message={success}
                        onClose={() =>
                            setSuccess("")
                        }
                    />
                )}

                {/* ==================================================
                    ELECTION SELECTOR
                =================================================== */}

                <div style={styles.card}>
                    <div
                        style={
                            styles.sectionLabel
                        }
                    >
                        ELECTION
                    </div>

                    <div
                        className="selector-layout"
                        style={
                            styles.selectorRow
                        }
                    >
                        <select
                            value={
                                selectedElectionId
                            }
                            onChange={(e) =>
                                setSelectedElectionId(
                                    e.target
                                        .value
                                )
                            }
                            style={
                                styles.select
                            }
                        >
                            <option value="">
                                Select an election
                            </option>

                            {elections.map(
                                (
                                    election
                                ) => (
                                    <option
                                        key={getId(
                                            election
                                        )}
                                        value={getId(
                                            election
                                        )}
                                    >
                                        {
                                            election.title
                                        }
                                    </option>
                                )
                            )}
                        </select>

                        <button
                            className="votara-button"
                            style={
                                styles.secondaryButton
                            }
                            onClick={
                                async () => {
                                    await loadElections();
                                    await loadOptions();
                                }
                            }
                            disabled={
                                loadingOptions
                            }
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {selectedElection && (
                        <div
                            style={
                                styles.electionInfo
                            }
                        >
                            <div>
                                <span
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Election
                                </span>

                                <strong>
                                    {
                                        selectedElection.title
                                    }
                                </strong>
                            </div>

                            <div>
                                <span
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Date
                                </span>

                                <strong>
                                    {formatElectionDate(
                                        selectedElection.election_date
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span
                                    style={
                                        styles.infoLabel
                                    }
                                >
                                    Status
                                </span>

                                <StatusPill
                                    status={
                                        selectedElection.status
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ==================================================
                    STATISTICS
                =================================================== */}

                <div
                    className="stats-grid"
                    style={
                        styles.statsGrid
                    }
                >
                    <StatCard
                        icon="♟"
                        label="Total Candidates"
                        value={
                            totalCandidates
                        }
                    />

                    <StatCard
                        icon="✓"
                        label="Active Candidates"
                        value={
                            activeCandidates
                        }
                    />

                    <StatCard
                        icon="○"
                        label="Inactive Candidates"
                        value={
                            inactiveCandidates
                        }
                    />

                    <StatCard
                        icon="◎"
                        label="Positions Covered"
                        value={
                            positionsCovered
                        }
                    />
                </div>

                {/* ==================================================
                    PROCESS
                =================================================== */}

                <div style={styles.card}>
                    <div
                        style={
                            styles.sectionHeading
                        }
                    >
                        <div>
                            <h3
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Candidate Process
                            </h3>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                Follow the standard
                                Electoral Board
                                candidate preparation
                                process.
                            </p>
                        </div>
                    </div>

                    <div
                        className="candidate-grid"
                        style={
                            styles.functionGrid
                        }
                    >
                        <ProcessCard
                            number="1"
                            title="Select Student"
                            description="Search and select a registered student."
                            onClick={
                                openAddModal
                            }
                        />

                        <ProcessCard
                            number="2"
                            title="Assign Position"
                            description="Choose the appropriate election position."
                            onClick={
                                openAddModal
                            }
                        />

                        <ProcessCard
                            number="3"
                            title="Party List"
                            description="Assign an approved party list or Independent."
                            onClick={
                                openAddModal
                            }
                        />

                        <ProcessCard
                            number="4"
                            title="Review"
                            description="Review the candidate information before saving."
                            onClick={() => {
                                if (
                                    candidates.length
                                ) {
                                    viewCandidate(
                                        candidates[0]
                                    );
                                } else {
                                    setError(
                                        "There are no candidates to review yet."
                                    );
                                }
                            }}
                        />

                        <ProcessCard
                            number="5"
                            title="Activate"
                            description="Activate candidates who are ready for the ballot."
                            onClick={() => {
                                const inactive =
                                    candidates.find(
                                        (
                                            candidate
                                        ) =>
                                            candidate.is_active !==
                                            true
                                    );

                                if (
                                    inactive
                                ) {
                                    prepareCandidate(
                                        inactive
                                    );
                                } else {
                                    setSuccess(
                                        "All current candidates are already active."
                                    );
                                }
                            }}
                        />

                        <ProcessCard
                            number="6"
                            title="Ballot Ready"
                            description="Active candidates are prepared for election use."
                            onClick={() =>
                                setSuccess(
                                    `${activeCandidates} active candidate(s) are currently prepared.`
                                )
                            }
                        />
                    </div>
                </div>

                {/* ==================================================
                    CANDIDATE LIST
                =================================================== */}

                <div style={styles.card}>
                    <div
                        className="header-layout"
                        style={
                            styles.listHeader
                        }
                    >
                        <div>
                            <h3
                                style={
                                    styles.sectionTitle
                                }
                            >
                                Candidates
                            </h3>

                            <p
                                style={
                                    styles.sectionDescription
                                }
                            >
                                View and manage
                                candidates for the
                                selected election.
                            </p>
                        </div>

                    </div>

                    {/* SEARCH */}

                    <div
                        style={
                            styles.searchContainer
                        }
                    >
                        <span
                            style={
                                styles.searchIcon
                            }
                        >
                            ⌕
                        </span>

                        <input
                            type="text"
                            placeholder="Search candidate, Student ID, position, or party list..."
                            value={
                                candidateSearch
                            }
                            onChange={(e) =>
                                setCandidateSearch(
                                    e.target
                                        .value
                                )
                            }
                            style={
                                styles.searchInput
                            }
                        />

                        {candidateSearch && (
                            <button
                                style={
                                    styles.clearSearch
                                }
                                onClick={() =>
                                    setCandidateSearch(
                                        ""
                                    )
                                }
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* LIST */}

                    {!selectedElectionId ? (
                        <EmptyState
                            icon="!"
                            title="Select an election first"
                            description="Choose an election above to manage its candidates."
                        />
                    ) : loadingOptions ? (
                        <div
                            style={
                                styles.loadingState
                            }
                        >
                            <div
                                style={
                                    styles.spinner
                                }
                            />

                            <span>
                                Loading candidate
                                information...
                            </span>
                        </div>
                    ) : filteredCandidates.length ===
                      0 ? (
                        <EmptyState
                            icon="♟"
                            title={
                                candidateSearch
                                    ? "No matching candidates"
                                    : "No candidates yet"
                            }
                            description={
                                candidateSearch
                                    ? "Try another name, Student ID, position, or party list."
                                    : "Add the first candidate for this election."
                            }
                        >
                        </EmptyState>
                    ) : (
                        <div
                            style={
                                styles.candidateList
                            }
                        >
                            {filteredCandidates.map(
                                (
                                    candidate
                                ) => {
                                    const name =
                                        getStudentName(
                                            candidate
                                        );

                                    const position =
                                        getPositionName(
                                            candidate
                                        );

                                    const party =
                                        getPartyName(
                                            candidate
                                        );

                                    const year =
                                        normalizeYear(
                                            candidate
                                                ?.student
                                                ?.year_level
                                        );

                                    return (
                                        <div
                                            key={getId(
                                                candidate
                                            )}
                                            className="candidate-hover candidate-card"
                                            style={
                                                styles.candidateCard
                                            }
                                        >
                                            {/* AVATAR */}

                                            <div
                                                style={
                                                    styles.candidateAvatar
                                                }
                                            >
                                                {candidate.profile_picture ? (
                                                    <img
                                                        src={
                                                            candidate.profile_picture
                                                        }
                                                        alt={
                                                            name
                                                        }
                                                        style={
                                                            styles.avatarImage
                                                        }
                                                    />
                                                ) : (
                                                    <span>
                                                        {name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase() ||
                                                            "C"}
                                                    </span>
                                                )}
                                            </div>

                                            {/* INFORMATION */}

                                            <div
                                                style={
                                                    styles.candidateInformation
                                                }
                                            >
                                                <div
                                                    style={
                                                        styles.candidateName
                                                    }
                                                >
                                                    {
                                                        name
                                                    }
                                                </div>

                                                <div
                                                    style={
                                                        styles.candidatePosition
                                                    }
                                                >
                                                    {
                                                        position
                                                    }
                                                </div>

                                                <div
                                                    style={
                                                        styles.candidateMeta
                                                    }
                                                >
                                                    <span>
                                                        ID:{" "}
                                                        {
                                                            getStudentId(
                                                                candidate
                                                            )
                                                        }
                                                    </span>

                                                    {year && (
                                                        <>
                                                            <span>
                                                                •
                                                            </span>

                                                            <span>
                                                                {
                                                                    year
                                                                }
                                                            </span>
                                                        </>
                                                    )}

                                                    <span>
                                                        •
                                                    </span>

                                                    <span>
                                                        {
                                                            party
                                                        }
                                                    </span>
                                                </div>
                                            </div>

                                            {/* STATUS */}

                                            <div
                                                style={
                                                    styles.statusArea
                                                }
                                            >
                                                <span
                                                    style={
                                                        candidate.is_active
                                                            ? styles.activeBadge
                                                            : styles.inactiveBadge
                                                    }
                                                >
                                                    <span
                                                        style={
                                                            styles.statusDot
                                                        }
                                                    />

                                                    {candidate.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </div>

                                            {/* ACTIONS */}

                                            <div
                                                className="candidate-actions"
                                                style={
                                                    styles.actionGroup
                                                }
                                            >
                                                <button
                                                    className="votara-button"
                                                    style={
                                                        styles.smallButton
                                                    }
                                                    onClick={() =>
                                                        viewCandidate(
                                                            candidate
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                                <button
                                                    className="votara-button"
                                                    style={
                                                        styles.smallButton
                                                    }
                                                    onClick={() =>
                                                        openEditModal(
                                                            candidate
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="votara-button"
                                                    style={
                                                        candidate.is_active
                                                            ? styles.dangerButton
                                                            : styles.activateButton
                                                    }
                                                    onClick={() =>
                                                        requestStatusChange(
                                                            candidate
                                                        )
                                                    }
                                                >
                                                    {candidate.is_active
                                                        ? "Deactivate"
                                                        : "Activate"}
                                                </button>

                                                {/* Permanently delete only inactive candidates */}
                                                {!candidate.is_active && (
                                                    <button
                                                        type="button"
                                                        className="votara-button candidate-delete-button"
                                                        style={
                                                            styles.removeButton
                                                        }
                                                        onClick={() =>
                                                            requestDeleteCandidate(
                                                                candidate
                                                            )
                                                        }
                                                        disabled={loading}
                                                        title="Permanently delete inactive candidate"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ==================================================
                ADD / EDIT MODAL
            =================================================== */}

            {showModal && (
                <ModalOverlay>
                    <div
                        style={
                            styles.largeModal
                        }
                    >
                        {/* HEADER */}

                        <div
                            style={
                                styles.modalHeader
                            }
                        >
                            <div>
                                <div
                                    style={
                                        styles.overline
                                    }
                                >
                                    {editingCandidate
                                        ? "EDIT CANDIDATE"
                                        : "ADD CANDIDATE"}
                                </div>

                                <h2
                                    style={
                                        styles.modalTitle
                                    }
                                >
                                    {editingCandidate
                                        ? "Edit Candidate"
                                        : "Add Candidate"}
                                </h2>

                                <p
                                    style={
                                        styles.modalDescription
                                    }
                                >
                                    {editingCandidate
                                        ? "Update the candidate information below."
                                        : "Search for a registered student and prepare their candidacy."}
                                </p>
                            </div>

                            <button
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeCandidateModal
                                }
                                disabled={
                                    loading
                                }
                            >
                                ×
                            </button>
                        </div>

                        {/* BODY */}

                        <div
                            style={
                                styles.modalBody
                            }
                        >
                            {/* =====================================
                                STEP 1 - STUDENT
                            ====================================== */}

                            <FormStep
                                number="1"
                                title="Select Registered Student"
                                description="Search using the student's Student ID or full name."
                            />

                            <div
                                style={
                                    styles.formGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Registered Student{" "}
                                    <span
                                        style={
                                            styles.required
                                        }
                                    >
                                        *
                                    </span>
                                </label>

                                <div
                                    style={
                                        styles.studentSearchWrapper
                                    }
                                >
                                    <span
                                        style={
                                            styles.studentSearchIcon
                                        }
                                    >
                                        ⌕
                                    </span>

                                    <input
                                        type="text"
                                        value={
                                            studentSearch
                                        }
                                        onChange={(
                                            e
                                        ) => {
                                            setStudentSearch(
                                                e
                                                    .target
                                                    .value
                                            );

                                            setShowStudentResults(
                                                true
                                            );

                                            if (
                                                !e
                                                    .target
                                                    .value
                                            ) {
                                                setForm(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        student_id:
                                                            "",
                                                        position_id:
                                                            "",
                                                    })
                                                );
                                            }
                                        }}
                                        onFocus={() =>
                                            setShowStudentResults(
                                                true
                                            )
                                        }
                                        placeholder="Search Student ID or full name..."
                                        style={
                                            styles.studentSearchInput
                                        }
                                    />

                                    {studentSearch && (
                                        <button
                                            style={
                                                styles.studentClear
                                            }
                                            onClick={() => {
                                                setStudentSearch(
                                                    ""
                                                );

                                                setForm(
                                                    (
                                                        previous
                                                    ) => ({
                                                        ...previous,
                                                        student_id:
                                                            "",
                                                        position_id:
                                                            "",
                                                    })
                                                );
                                            }}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>

                                {/* SEARCH RESULTS */}

                                {showStudentResults &&
                                    studentSearch &&
                                    !selectedStudentForForm && (
                                        <div
                                            style={
                                                styles.studentResults
                                            }
                                        >
                                            {studentResults.length >
                                            0 ? (
                                                <>
                                                    <div
                                                        style={
                                                            styles.resultsHeader
                                                        }
                                                    >
                                                        Registered
                                                        Students
                                                    </div>

                                                    {studentResults.map(
                                                        (
                                                            student
                                                        ) => (
                                                            <button
                                                                key={getId(
                                                                    student
                                                                )}
                                                                className="student-result"
                                                                style={
                                                                    styles.studentResult
                                                                }
                                                                onClick={() =>
                                                                    selectStudent(
                                                                        student
                                                                    )
                                                                }
                                                            >
                                                                <div
                                                                    style={
                                                                        styles.resultAvatar
                                                                    }
                                                                >
                                                                    {student
                                                                        .full_name
                                                                        ?.charAt(
                                                                            0
                                                                        )
                                                                        ?.toUpperCase()}
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.resultInformation
                                                                    }
                                                                >
                                                                    <strong>
                                                                        {
                                                                            student.full_name
                                                                        }
                                                                    </strong>

                                                                    <span>
                                                                        Student
                                                                        ID:{" "}
                                                                        {
                                                                            student.student_id
                                                                        }
                                                                    </span>
                                                                </div>

                                                                <div
                                                                    style={
                                                                        styles.resultYear
                                                                    }
                                                                >
                                                                    {normalizeYear(
                                                                        student.year_level
                                                                    )}
                                                                </div>

                                                                <span
                                                                    style={
                                                                        styles.resultArrow
                                                                    }
                                                                >
                                                                    →
                                                                </span>
                                                            </button>
                                                        )
                                                    )}
                                                </>
                                            ) : (
                                                <div
                                                    style={
                                                        styles.noResults
                                                    }
                                                >
                                                    <span>
                                                        No registered
                                                        student found.
                                                    </span>

                                                    <small>
                                                        Try another
                                                        Student ID or
                                                        full name.
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>

                            {/* SELECTED STUDENT */}

                            {selectedStudentForForm && (
                                <div
                                    style={
                                        styles.selectedStudentCard
                                    }
                                >
                                    <div
                                        style={
                                            styles.selectedStudentAvatar
                                        }
                                    >
                                        {selectedStudentForForm
                                            .full_name
                                            ?.charAt(
                                                0
                                            )
                                            ?.toUpperCase()}
                                    </div>

                                    <div
                                        style={
                                            styles.selectedStudentInformation
                                        }
                                    >
                                        <span
                                            style={
                                                styles.selectedLabel
                                            }
                                        >
                                            SELECTED
                                            REGISTERED
                                            STUDENT
                                        </span>

                                        <strong>
                                            {
                                                selectedStudentForForm.full_name
                                            }
                                        </strong>

                                        <div
                                            style={
                                                styles.selectedStudentMeta
                                            }
                                        >
                                            <span>
                                                Student
                                                ID:{" "}
                                                {
                                                    selectedStudentForForm.student_id
                                                }
                                            </span>

                                            <span>
                                                •
                                            </span>

                                            <span>
                                                Year
                                                Level:{" "}
                                                {normalizeYear(
                                                    selectedStudentForForm.year_level
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div
                                        style={
                                            styles.selectedCheck
                                        }
                                    >
                                        ✓
                                    </div>
                                </div>
                            )}

                            {/* =====================================
                                STEP 2 - POSITION
                            ====================================== */}

                            <FormStep
                                number="2"
                                title="Assign Election Position"
                                description="Only positions configured for this election are shown."
                            />

                            <div
                                style={
                                    styles.formGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Election Position{" "}
                                    <span
                                        style={
                                            styles.required
                                        }
                                    >
                                        *
                                    </span>
                                </label>

                                <select
                                    name="position_id"
                                    value={
                                        form.position_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={
                                        styles.input
                                    }
                                    disabled={
                                        !selectedStudentForForm
                                    }
                                >
                                    <option value="">
                                        {!selectedStudentForForm
                                            ? "Select a registered student first"
                                            : "Select a position"}
                                    </option>

                                    {availablePositions.map(
                                        (
                                            position
                                        ) => (
                                            <option
                                                key={getId(
                                                    position
                                                )}
                                                value={getId(
                                                    position
                                                )}
                                            >
                                                {
                                                    position.name
                                                }
                                            </option>
                                        )
                                    )}
                                </select>

                                {selectedStudentForForm &&
                                    normalizeYear(
                                        selectedStudentForForm.year_level
                                    ) ===
                                        "1st Year" && (
                                        <div
                                            style={
                                                styles.infoNotice
                                            }
                                        >
                                            <span>
                                                ℹ
                                            </span>

                                            <div>
                                                <strong>
                                                    1st Year
                                                    voting
                                                    rule
                                                </strong>

                                                <p>
                                                    1st Year
                                                    students do
                                                    not use the
                                                    general
                                                    year-level
                                                    representative
                                                    positions.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                            </div>

                            {/* =====================================
                                STEP 3 - PARTY LIST
                            ====================================== */}

                            <FormStep
                                number="3"
                                title="Party List"
                                description="Choose an approved active party list or Independent."
                            />

                            <div
                                style={
                                    styles.formGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Party List
                                </label>

                                <select
                                    name="party_list_id"
                                    value={
                                        form.party_list_id
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    style={
                                        styles.input
                                    }
                                    disabled={
                                        isPartyListScoped
                                    }
                                >
                                    {!isPartyListScoped && (
                                        <option value="">
                                            Independent /
                                            No Party List
                                        </option>
                                    )}

                                    {partyLists
                                        .filter(
                                            (
                                                party
                                            ) =>
                                                party.is_active !==
                                                    false &&
                                                party.approval_status ===
                                                    "approved" &&
                                                (
                                                    !isPartyListScoped ||
                                                    String(
                                                        getId(party)
                                                    ) ===
                                                        String(
                                                            partyListContextId
                                                        )
                                                )
                                        )
                                        .map(
                                            (
                                                party
                                            ) => (
                                                <option
                                                    key={getId(
                                                        party
                                                    )}
                                                    value={getId(
                                                        party
                                                    )}
                                                >
                                                    {
                                                        party.name
                                                    }
                                                </option>
                                            )
                                        )}
                                </select>

                                <small
                                    style={
                                        styles.helperText
                                    }
                                >
                                    {isPartyListScoped
                                        ? `Candidates added from this page will be assigned to ${partyListContextName || "this party list"}. Only unfilled positions are available.`
                                        : `Only approved and active party lists can be assigned to candidates.`}

                                </small>
                            </div>

                            {/* =====================================
                                STEP 4 - PROFILE PICTURE
                            ====================================== */}

                            <FormStep
                                number="4"
                                title="Candidate Profile Picture"
                                description="Upload a clear candidate photo for identification on the ballot."
                            />

                            <div
                                style={
                                    styles.formGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Profile Picture
                                </label>

                                {!form.profile_picture ? (
                                    <button
                                        type="button"
                                        className="upload-area"
                                        style={
                                            styles.uploadArea
                                        }
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={
                                            loading
                                        }
                                    >
                                        <div
                                            style={
                                                styles.uploadIcon
                                            }
                                        >
                                            ↑
                                        </div>

                                        <strong>
                                            Upload
                                            Candidate
                                            Photo
                                        </strong>

                                        <span>
                                            Click to
                                            browse
                                            JPG, JPEG,
                                            PNG
                                        </span>

                                        <small>
                                            Maximum
                                            file size:
                                            2 MB
                                        </small>
                                    </button>
                                ) : (
                                    <div
                                        style={
                                            styles.imagePreviewBox
                                        }
                                    >
                                        <img
                                            src={
                                                form.profile_picture
                                            }
                                            alt="Candidate preview"
                                            style={
                                                styles.largeImagePreview
                                            }
                                        />

                                        <div
                                            style={
                                                styles.imagePreviewInformation
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.imageReadyBadge
                                                }
                                            >
                                                ✓ Photo
                                                Ready
                                            </span>

                                            <strong>
                                                Candidate
                                                profile
                                                picture
                                            </strong>

                                            <p>
                                                This photo
                                                will be
                                                used as the
                                                candidate's
                                                profile
                                                image.
                                            </p>

                                            <div
                                                style={
                                                    styles.imageButtons
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    style={
                                                        styles.secondaryButton
                                                    }
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                >
                                                    Change
                                                    Photo
                                                </button>

                                                <button
                                                    type="button"
                                                    style={
                                                        styles.removeButton
                                                    }
                                                    onClick={
                                                        removeImage
                                                    }
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={
                                        handleImageUpload
                                    }
                                    style={{
                                        display:
                                            "none",
                                    }}
                                />
                            </div>

                            {/* =====================================
                                STEP 5 - PLATFORM
                            ====================================== */}

                            <FormStep
                                number="5"
                                title="Platform / Description"
                                description="Provide a short description of the candidate's platform."
                            />

                            <div
                                style={
                                    styles.formGroup
                                }
                            >
                                <label
                                    style={
                                        styles.label
                                    }
                                >
                                    Platform /
                                    Description
                                </label>

                                <textarea
                                    name="platform"
                                    value={
                                        form.platform
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter candidate platform or short description..."
                                    rows={5}
                                    style={
                                        styles.textarea
                                    }
                                    maxLength={1000}
                                />

                                <div
                                    style={
                                        styles.characterCount
                                    }
                                >
                                    {
                                        form.platform
                                            .length
                                    }{" "}
                                    / 1000
                                    characters
                                </div>
                            </div>

                            {/* =====================================
                                FINAL REVIEW
                            ====================================== */}

                            {selectedStudentForForm &&
                                selectedPositionForForm && (
                                    <div
                                        style={
                                            styles.finalReview
                                        }
                                    >
                                        <div
                                            style={
                                                styles.finalReviewHeader
                                            }
                                        >
                                            <div>
                                                <span
                                                    style={
                                                        styles.reviewOverline
                                                    }
                                                >
                                                    FINAL REVIEW
                                                </span>

                                                <h3
                                                    style={
                                                        styles.reviewHeading
                                                    }
                                                >
                                                    Candidate
                                                    Information
                                                </h3>
                                            </div>

                                            <span
                                                style={
                                                    styles.readyBadge
                                                }
                                            >
                                                ✓ Ready
                                            </span>
                                        </div>

                                        <div
                                            style={
                                                styles.reviewGrid
                                            }
                                        >
                                            <ReviewItem
                                                label="Student"
                                                value={
                                                    selectedStudentForForm.full_name
                                                }
                                            />

                                            <ReviewItem
                                                label="Student ID"
                                                value={
                                                    selectedStudentForForm.student_id
                                                }
                                            />

                                            <ReviewItem
                                                label="Year Level"
                                                value={normalizeYear(
                                                    selectedStudentForForm.year_level
                                                )}
                                            />

                                            <ReviewItem
                                                label="Position"
                                                value={
                                                    selectedPositionForForm.name
                                                }
                                            />

                                            <ReviewItem
                                                label="Party List"
                                                value={
                                                    form.party_list_id
                                                        ? partyLists.find(
                                                              (
                                                                  party
                                                              ) =>
                                                                  String(
                                                                      getId(
                                                                          party
                                                                      )
                                                                  ) ===
                                                                  String(
                                                                      form.party_list_id
                                                                  )
                                                          )
                                                              ?.name ||
                                                          "Independent"
                                                        : "Independent"
                                                }
                                            />

                                            <ReviewItem
                                                label="Status"
                                                value="Active after preparation"
                                            />
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* FOOTER */}

                        <div
                            style={
                                styles.modalFooter
                            }
                        >
                            <button
                                style={
                                    styles.secondaryButton
                                }
                                onClick={
                                    closeCandidateModal
                                }
                                disabled={
                                    loading
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="votara-button"
                                style={
                                    styles.primaryButton
                                }
                                onClick={
                                    submitCandidate
                                }
                                disabled={
                                    loading
                                }
                            >
                                {loading
                                    ? "Processing..."
                                    : editingCandidate
                                    ? "Save Changes"
                                    : "Add Candidate"}
                            </button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {/* ==================================================
                DETAILS MODAL
            =================================================== */}

            {showDetails &&
                selectedCandidate && (
                    <ModalOverlay>
                        <div
                            style={
                                styles.detailsModal
                            }
                        >
                            <div
                                style={
                                    styles.modalHeader
                                }
                            >
                                <div>
                                    <div
                                        style={
                                            styles.overline
                                        }
                                    >
                                        CANDIDATE DETAILS
                                    </div>

                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Candidate
                                        Information
                                    </h2>

                                    <p
                                        style={
                                            styles.modalDescription
                                        }
                                    >
                                        Review the
                                        candidate's
                                        election
                                        information.
                                    </p>
                                </div>

                                <button
                                    style={
                                        styles.closeButton
                                    }
                                    onClick={() =>
                                        setShowDetails(
                                            false
                                        )
                                    }
                                >
                                    ×
                                </button>
                            </div>

                            <div
                                style={
                                    styles.detailsBody
                                }
                            >
                                <div
                                    style={
                                        styles.detailProfile
                                    }
                                >
                                    <div
                                        style={
                                            styles.detailAvatar
                                        }
                                    >
                                        {selectedCandidate.profile_picture ? (
                                            <img
                                                src={
                                                    selectedCandidate.profile_picture
                                                }
                                                alt={getStudentName(
                                                    selectedCandidate
                                                )}
                                                style={
                                                    styles.avatarImage
                                                }
                                            />
                                        ) : (
                                            getStudentName(
                                                selectedCandidate
                                            )
                                                ?.charAt(
                                                    0
                                                )
                                                ?.toUpperCase()
                                        )}
                                    </div>

                                    <div>
                                        <h3
                                            style={
                                                styles.detailName
                                            }
                                        >
                                            {getStudentName(
                                                selectedCandidate
                                            )}
                                        </h3>

                                        <span
                                            style={
                                                selectedCandidate.is_active
                                                    ? styles.activeBadge
                                                    : styles.inactiveBadge
                                            }
                                        >
                                            <span
                                                style={
                                                    styles.statusDot
                                                }
                                            />

                                            {selectedCandidate.is_active
                                                ? "Active Candidate"
                                                : "Inactive Candidate"}
                                        </span>
                                    </div>
                                </div>

                                <DetailRow
                                    label="Student ID"
                                    value={getStudentId(
                                        selectedCandidate
                                    )}
                                />

                                <DetailRow
                                    label="Year Level"
                                    value={
                                        normalizeYear(
                                            selectedCandidate
                                                ?.student
                                                ?.year_level
                                        ) ||
                                        "N/A"
                                    }
                                />

                                <DetailRow
                                    label="Position"
                                    value={getPositionName(
                                        selectedCandidate
                                    )}
                                />

                                <DetailRow
                                    label="Party List"
                                    value={getPartyName(
                                        selectedCandidate
                                    )}
                                />

                                <DetailRow
                                    label="Election"
                                    value={
                                        selectedElection?.title ||
                                        "N/A"
                                    }
                                />

                                <div
                                    style={
                                        styles.platformDetails
                                    }
                                >
                                    <span>
                                        PLATFORM /
                                        DESCRIPTION
                                    </span>

                                    <p>
                                        {selectedCandidate.platform ||
                                            "No platform or description provided."}
                                    </p>
                                </div>
                            </div>

                            <div
                                style={
                                    styles.modalFooter
                                }
                            >
                                <button
                                    style={
                                        styles.secondaryButton
                                    }
                                    onClick={() =>
                                        setShowDetails(
                                            false
                                        )
                                    }
                                >
                                    Close
                                </button>

                                <button
                                    className="votara-button"
                                    style={
                                        styles.primaryButton
                                    }
                                    onClick={() => {
                                        setShowDetails(
                                            false
                                        );

                                        openEditModal(
                                            selectedCandidate
                                        );
                                    }}
                                >
                                    Edit Candidate
                                </button>
                            </div>
                        </div>
                    </ModalOverlay>
                )}

            {/* ==================================================
                CONFIRMATION MODAL
            =================================================== */}

            {showConfirmation &&
                confirmation && (
                    <ModalOverlay>
                        <div
                            style={
                                styles.confirmModal
                            }
                        >
                            <div
                                style={
                                    styles.confirmIcon
                                }
                            >
                                ?
                            </div>

                            <h2
                                style={
                                    styles.confirmTitle
                                }
                            >
                                {
                                    confirmation.title
                                }
                            </h2>

                            <p
                                style={
                                    styles.confirmMessage
                                }
                            >
                                {
                                    confirmation.message
                                }
                            </p>

                            <div
                                style={
                                    styles.confirmNote
                                }
                            >
                                <span>
                                    ℹ
                                </span>

                                <p>
                                    Please verify
                                    the candidate
                                    information
                                    before
                                    continuing.
                                </p>
                            </div>

                            <div
                                style={
                                    styles.confirmFooter
                                }
                            >
                                <button
                                    style={
                                        styles.secondaryButton
                                    }
                                    onClick={
                                        closeConfirmation
                                    }
                                    disabled={
                                        loading
                                    }
                                >
                                    Cancel
                                </button>

                                <button
                                    className="votara-button"
                                    style={
                                        styles.primaryButton
                                    }
                                    onClick={
                                        confirmation.action
                                    }
                                    disabled={
                                        loading
                                    }
                                >
                                    {loading
                                        ? "Processing..."
                                        : "Confirm"}
                                </button>
                            </div>
                        </div>
                    </ModalOverlay>
                )}
        </div>
    );
}


// ============================================================
// ALERT
// ============================================================

function Alert({
    type,
    message,
    onClose,
}) {
    const isError =
        type === "error";

    return (
        <div
            style={
                isError
                    ? styles.errorAlert
                    : styles.successAlert
            }
        >
            <span
                style={
                    isError
                        ? styles.alertIcon
                        : styles.successIcon
                }
            >
                {isError
                    ? "!"
                    : "✓"}
            </span>

            <span
                style={{
                    flex: 1,
                }}
            >
                {message}
            </span>

            <button
                style={
                    styles.alertClose
                }
                onClick={onClose}
            >
                ×
            </button>
        </div>
    );
}


// ============================================================
// STATUS PILL
// ============================================================

function StatusPill({
    status,
}) {
    const normalized =
        String(
            status || "draft"
        ).toLowerCase();

    let style =
        styles.statusDraft;

    if (
        normalized ===
        "open"
    ) {
        style =
            styles.statusOpen;
    }

    if (
        normalized ===
        "scheduled"
    ) {
        style =
            styles.statusScheduled;
    }

    if (
        normalized ===
        "closed"
    ) {
        style =
            styles.statusClosed;
    }

    return (
        <span
            style={style}
        >
            {status ||
                "Draft"}
        </span>
    );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
    icon,
    label,
    value,
}) {
    return (
        <div
            style={
                styles.statCard
            }
        >
            <div
                style={
                    styles.statIcon
                }
            >
                {icon}
            </div>

            <div>
                <span
                    style={
                        styles.statLabel
                    }
                >
                    {label}
                </span>

                <strong
                    style={
                        styles.statValue
                    }
                >
                    {value}
                </strong>
            </div>
        </div>
    );
}


// ============================================================
// PROCESS CARD
// ============================================================

function ProcessCard({
    number,
    title,
    description,
    onClick,
}) {
    return (
        <button
            className="position-option"
            style={
                styles.functionCard
            }
            onClick={onClick}
        >
            <div
                style={
                    styles.functionNumber
                }
            >
                {number}
            </div>

            <div
                style={{
                    flex: 1,
                    textAlign:
                        "left",
                }}
            >
                <strong
                    style={
                        styles.functionTitle
                    }
                >
                    {title}
                </strong>

                <span
                    style={
                        styles.functionDescription
                    }
                >
                    {description}
                </span>
            </div>

            <span
                style={
                    styles.arrow
                }
            >
                →
            </span>
        </button>
    );
}


// ============================================================
// FORM STEP
// ============================================================

function FormStep({
    number,
    title,
    description,
}) {
    return (
        <div
            style={
                styles.formStep
            }
        >
            <div
                style={
                    styles.formStepNumber
                }
            >
                {number}
            </div>

            <div>
                <strong
                    style={
                        styles.formStepTitle
                    }
                >
                    {title}
                </strong>

                <span
                    style={
                        styles.formStepDescription
                    }
                >
                    {description}
                </span>
            </div>
        </div>
    );
}


// ============================================================
// REVIEW ITEM
// ============================================================

function ReviewItem({
    label,
    value,
}) {
    return (
        <div
            style={
                styles.reviewItem
            }
        >
            <span>
                {label}
            </span>

            <strong>
                {value ||
                    "N/A"}
            </strong>
        </div>
    );
}


// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
    label,
    value,
}) {
    return (
        <div
            style={
                styles.detailRow
            }
        >
            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>
        </div>
    );
}


// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({
    icon,
    title,
    description,
    children,
}) {
    return (
        <div
            style={
                styles.emptyState
            }
        >
            <div
                style={
                    styles.emptyIcon
                }
            >
                {icon}
            </div>

            <strong
                style={
                    styles.emptyTitle
                }
            >
                {title}
            </strong>

            <span
                style={
                    styles.emptyDescription
                }
            >
                {description}
            </span>

            {children}
        </div>
    );
}


// ============================================================
// MODAL OVERLAY
// ============================================================

function ModalOverlay({
    children,
}) {
    return (
        <div
            style={
                styles.overlay
            }
        >
            {children}
        </div>
    );
}


// ============================================================
// STYLES
// ============================================================

const styles = {
    // ========================================================
    // PAGE
    // ========================================================

    page: {
        minHeight:
            "100vh",
        background:
            "#f5f8fc",
        color:
            "#0f2747",
        fontFamily:
            "Inter, Poppins, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    topHeader: {
        minHeight:
            "76px",
        background:
            "#ffffff",
        borderBottom:
            "1px solid #e5eaf1",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "space-between",
        padding:
            "0 34px",
        boxSizing:
            "border-box",
    },

    topTitle: {
        margin: 0,
        fontSize:
            "22px",
        fontWeight:
            800,
        color:
            "#0b1f3a",
    },

    topSubtitle: {
        margin:
            "5px 0 0",
        fontSize:
            "13px",
        color:
            "#71809a",
    },

    accountBox: {
        display:
            "flex",
        flexDirection:
            "column",
        alignItems:
            "flex-end",
        gap:
            "3px",
        fontSize:
            "12px",
        color:
            "#0b1f3a",
    },

    content: {
        maxWidth:
            "1240px",
        margin:
            "0 auto",
        padding:
            "36px 34px 70px",
        boxSizing:
            "border-box",
    },

    // ========================================================
    // HEADER
    // ========================================================

    pageHeader: {
        background:
            "#ffffff",
        border:
            "1px solid #dfe6ef",
        borderRadius:
            "18px",
        padding:
            "26px 28px",
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "center",
        gap:
            "20px",
        boxShadow:
            "0 4px 18px rgba(15, 39, 71, 0.04)",
    },

    pageHeaderLeft: {
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "18px",
    },

    iconBox: {
        width:
            "54px",
        height:
            "54px",
        borderRadius:
            "15px",
        background:
            "#eff5ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "27px",
        fontWeight:
            800,
    },

    overline: {
        color:
            "#2563eb",
        fontSize:
            "10px",
        fontWeight:
            800,
        letterSpacing:
            "1.5px",
        marginBottom:
            "5px",
    },

    pageTitle: {
        margin: 0,
        fontSize:
            "25px",
        fontWeight:
            800,
        color:
            "#0b1f3a",
    },

    pageDescription: {
        margin:
            "7px 0 0",
        color:
            "#71809a",
        fontSize:
            "13px",
    },

    // ========================================================
    // BUTTONS
    // ========================================================

    primaryButton: {
        border:
            "none",
        background:
            "#2563eb",
        color:
            "#ffffff",
        borderRadius:
            "10px",
        padding:
            "12px 18px",
        fontWeight:
            700,
        fontSize:
            "13px",
        cursor:
            "pointer",
        boxShadow:
            "0 6px 14px rgba(37, 99, 235, 0.18)",
    },

    secondaryButton: {
        background:
            "#ffffff",
        color:
            "#27456d",
        border:
            "1px solid #d6dfeb",
        borderRadius:
            "10px",
        padding:
            "11px 16px",
        fontWeight:
            700,
        fontSize:
            "13px",
        cursor:
            "pointer",
    },

    smallButton: {
        background:
            "#ffffff",
        color:
            "#31557e",
        border:
            "1px solid #d8e1ed",
        borderRadius:
            "8px",
        padding:
            "8px 11px",
        fontWeight:
            700,
        fontSize:
            "11px",
        cursor:
            "pointer",
    },

    dangerButton: {
        background:
            "#fff5f5",
        color:
            "#dc2626",
        border:
            "1px solid #fecaca",
        borderRadius:
            "8px",
        padding:
            "8px 11px",
        fontWeight:
            700,
        fontSize:
            "11px",
        cursor:
            "pointer",
    },

    activateButton: {
        background:
            "#effdf5",
        color:
            "#15803d",
        border:
            "1px solid #bbf7d0",
        borderRadius:
            "8px",
        padding:
            "8px 11px",
        fontWeight:
            700,
        fontSize:
            "11px",
        cursor:
            "pointer",
    },

    removeButton: {
        background:
            "#fff5f5",
        color:
            "#dc2626",
        border:
            "1px solid #fecaca",
        borderRadius:
            "9px",
        padding:
            "10px 14px",
        fontWeight:
            700,
        fontSize:
            "12px",
        cursor:
            "pointer",
    },

    clearSearch: {
        position:
            "absolute",
        right:
            "10px",
        top:
            "50%",
        transform:
            "translateY(-50%)",
        border:
            "none",
        background:
            "#eef2f7",
        width:
            "25px",
        height:
            "25px",
        borderRadius:
            "50%",
        cursor:
            "pointer",
        color:
            "#64748b",
        fontSize:
            "16px",
    },

    // ========================================================
    // CARDS
    // ========================================================

    card: {
        background:
            "#ffffff",
        border:
            "1px solid #dfe6ef",
        borderRadius:
            "16px",
        padding:
            "24px",
        marginTop:
            "18px",
        boxShadow:
            "0 3px 14px rgba(15, 39, 71, 0.035)",
    },

    sectionLabel: {
        fontSize:
            "10px",
        fontWeight:
            800,
        color:
            "#425a78",
        letterSpacing:
            "1px",
        marginBottom:
            "9px",
    },

    sectionHeading: {
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "flex-start",
    },

    sectionTitle: {
        margin: 0,
        fontSize:
            "17px",
        fontWeight:
            800,
        color:
            "#0b1f3a",
    },

    sectionDescription: {
        margin:
            "5px 0 18px",
        fontSize:
            "12px",
        color:
            "#7a899e",
    },

    // ========================================================
    // ELECTION
    // ========================================================

    selectorRow: {
        display:
            "flex",
        gap:
            "12px",
    },

    select: {
        flex:
            1,
        minHeight:
            "44px",
        border:
            "1px solid #d6dfeb",
        borderRadius:
            "9px",
        padding:
            "0 13px",
        background:
            "#ffffff",
        color:
            "#17365d",
        outline:
            "none",
        fontSize:
            "13px",
    },

    electionInfo: {
        marginTop:
            "14px",
        padding:
            "13px 15px",
        borderRadius:
            "10px",
        background:
            "#f7faff",
        border:
            "1px solid #e6eef9",
        display:
            "flex",
        gap:
            "28px",
        flexWrap:
            "wrap",
        color:
            "#526985",
        fontSize:
            "12px",
    },

    infoLabel: {
        display:
            "block",
        fontSize:
            "9px",
        color:
            "#8a9ab0",
        fontWeight:
            700,
        textTransform:
            "uppercase",
        letterSpacing:
            ".5px",
        marginBottom:
            "3px",
    },

    // ========================================================
    // STATS
    // ========================================================

    statsGrid: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap:
            "14px",
        marginTop:
            "18px",
    },

    statCard: {
        background:
            "#ffffff",
        border:
            "1px solid #dfe6ef",
        borderRadius:
            "14px",
        padding:
            "19px",
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "14px",
    },

    statIcon: {
        width:
            "40px",
        height:
            "40px",
        borderRadius:
            "11px",
        background:
            "#eff5ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            800,
        fontSize:
            "17px",
    },

    statLabel: {
        display:
            "block",
        color:
            "#71809a",
        fontSize:
            "10px",
        fontWeight:
            600,
        marginBottom:
            "3px",
    },

    statValue: {
        display:
            "block",
        color:
            "#0b1f3a",
        fontSize:
            "22px",
        fontWeight:
            800,
    },

    // ========================================================
    // PROCESS
    // ========================================================

    functionGrid: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap:
            "12px",
    },

    functionCard: {
        width:
            "100%",
        border:
            "1px solid #e1e8f1",
        background:
            "#f8faff",
        borderRadius:
            "12px",
        padding:
            "15px",
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "13px",
        cursor:
            "pointer",
        transition:
            "0.2s ease",
        textAlign:
            "left",
    },

    functionNumber: {
        width:
            "34px",
        height:
            "34px",
        flexShrink:
            0,
        borderRadius:
            "50%",
        background:
            "#2563eb",
        color:
            "#ffffff",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            800,
        fontSize:
            "12px",
    },

    functionTitle: {
        display:
            "block",
        color:
            "#102b4e",
        fontSize:
            "13px",
        marginBottom:
            "3px",
    },

    functionDescription: {
        display:
            "block",
        color:
            "#75869e",
        fontSize:
            "11px",
        lineHeight:
            1.5,
    },

    arrow: {
        color:
            "#2563eb",
        fontSize:
            "18px",
        fontWeight:
            700,
    },

    // ========================================================
    // SEARCH
    // ========================================================

    listHeader: {
        display:
            "flex",
        alignItems:
            "flex-start",
        justifyContent:
            "space-between",
        gap:
            "15px",
    },

    searchContainer: {
        position:
            "relative",
        margin:
            "8px 0 18px",
    },

    searchIcon: {
        position:
            "absolute",
        left:
            "13px",
        top:
            "50%",
        transform:
            "translateY(-50%)",
        color:
            "#71809a",
        fontSize:
            "18px",
    },

    searchInput: {
        width:
            "100%",
        height:
            "43px",
        boxSizing:
            "border-box",
        border:
            "1px solid #d6dfeb",
        borderRadius:
            "9px",
        padding:
            "0 40px",
        outline:
            "none",
        color:
            "#17365d",
        fontSize:
            "12px",
    },

    // ========================================================
    // CANDIDATE LIST
    // ========================================================

    candidateList: {
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "10px",
    },

    candidateCard: {
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "14px",
        padding:
            "14px",
        border:
            "1px solid #e2e8f0",
        borderRadius:
            "12px",
        transition:
            "0.2s ease",
        background:
            "#ffffff",
    },

    candidateAvatar: {
        width:
            "52px",
        height:
            "52px",
        borderRadius:
            "13px",
        background:
            "#eff5ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            800,
        fontSize:
            "20px",
        flexShrink:
            0,
        overflow:
            "hidden",
    },

    avatarImage: {
        width:
            "100%",
        height:
            "100%",
        objectFit:
            "cover",
    },

    candidateInformation: {
        flex:
            1,
        minWidth:
            0,
    },

    candidateName: {
        color:
            "#102b4e",
        fontSize:
            "14px",
        fontWeight:
            800,
    },

    candidatePosition: {
        color:
            "#2563eb",
        fontSize:
            "12px",
        fontWeight:
            700,
        marginTop:
            "3px",
    },

    candidateMeta: {
        display:
            "flex",
        gap:
            "7px",
        flexWrap:
            "wrap",
        color:
            "#7a899e",
        fontSize:
            "10px",
        marginTop:
            "5px",
    },

    statusArea: {
        marginLeft:
            "auto",
    },

    activeBadge: {
        display:
            "inline-flex",
        alignItems:
            "center",
        gap:
            "6px",
        borderRadius:
            "999px",
        background:
            "#ecfdf5",
        color:
            "#15803d",
        padding:
            "6px 10px",
        fontSize:
            "10px",
        fontWeight:
            800,
        whiteSpace:
            "nowrap",
    },

    inactiveBadge: {
        display:
            "inline-flex",
        alignItems:
            "center",
        gap:
            "6px",
        borderRadius:
            "999px",
        background:
            "#fff7ed",
        color:
            "#c2410c",
        padding:
            "6px 10px",
        fontSize:
            "10px",
        fontWeight:
            800,
        whiteSpace:
            "nowrap",
    },

    statusDot: {
        width:
            "6px",
        height:
            "6px",
        borderRadius:
            "50%",
        background:
            "currentColor",
    },

    actionGroup: {
        display:
            "flex",
        gap:
            "6px",
        flexWrap:
            "wrap",
        justifyContent:
            "flex-end",
    },

    // ========================================================
    // EMPTY / LOADING
    // ========================================================

    emptyState: {
        minHeight:
            "220px",
        display:
            "flex",
        flexDirection:
            "column",
        alignItems:
            "center",
        justifyContent:
            "center",
        gap:
            "8px",
        color:
            "#71809a",
        textAlign:
            "center",
    },

    emptyIcon: {
        width:
            "50px",
        height:
            "50px",
        borderRadius:
            "50%",
        background:
            "#eff5ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            800,
        marginBottom:
            "5px",
        fontSize:
            "18px",
    },

    emptyTitle: {
        color:
            "#243f61",
        fontSize:
            "14px",
    },

    emptyDescription: {
        color:
            "#7a899e",
        fontSize:
            "12px",
        marginBottom:
            "8px",
    },

    loadingState: {
        minHeight:
            "180px",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        gap:
            "10px",
        color:
            "#71809a",
        fontSize:
            "12px",
    },

    spinner: {
        width:
            "18px",
        height:
            "18px",
        border:
            "2px solid #dbeafe",
        borderTopColor:
            "#2563eb",
        borderRadius:
            "50%",
        animation:
            "votaraSpin .8s linear infinite",
    },

    // ========================================================
    // ALERTS
    // ========================================================

    errorAlert: {
        marginTop:
            "18px",
        background:
            "#fff1f2",
        border:
            "1px solid #fecdd3",
        color:
            "#be123c",
        borderRadius:
            "10px",
        padding:
            "13px 15px",
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "10px",
        fontSize:
            "12px",
        fontWeight:
            600,
    },

    successAlert: {
        marginTop:
            "18px",
        background:
            "#ecfdf5",
        border:
            "1px solid #bbf7d0",
        color:
            "#15803d",
        borderRadius:
            "10px",
        padding:
            "13px 15px",
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "10px",
        fontSize:
            "12px",
        fontWeight:
            600,
    },

    alertIcon: {
        width:
            "22px",
        height:
            "22px",
        borderRadius:
            "50%",
        background:
            "#e11d48",
        color:
            "#ffffff",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            800,
    },

    successIcon: {
        width:
            "22px",
        height:
            "22px",
        borderRadius:
            "50%",
        background:
            "#16a34a",
        color:
            "#ffffff",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            800,
    },

    alertClose: {
        border:
            "none",
        background:
            "transparent",
        color:
            "inherit",
        fontSize:
            "18px",
        cursor:
            "pointer",
    },

    // ========================================================
    // MODALS
    // ========================================================

    overlay: {
        position:
            "fixed",
        inset:
            0,
        background:
            "rgba(8, 25, 48, .55)",
        backdropFilter:
            "blur(4px)",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        zIndex:
            99999,
        padding:
            "20px",
        boxSizing:
            "border-box",
    },

    largeModal: {
        width:
            "min(760px, 100%)",
        maxHeight:
            "92vh",
        overflow:
            "auto",
        background:
            "#ffffff",
        borderRadius:
            "18px",
        boxShadow:
            "0 25px 70px rgba(0,0,0,.25)",
        animation:
            "votaraFade .18s ease",
    },

    detailsModal: {
        width:
            "min(570px, 100%)",
        maxHeight:
            "90vh",
        overflow:
            "auto",
        background:
            "#ffffff",
        borderRadius:
            "18px",
        boxShadow:
            "0 25px 70px rgba(0,0,0,.25)",
        animation:
            "votaraFade .18s ease",
    },

    modalHeader: {
        padding:
            "22px 24px",
        borderBottom:
            "1px solid #e7edf4",
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "flex-start",
        gap:
            "15px",
    },

    modalTitle: {
        margin:
            0,
        color:
            "#0b1f3a",
        fontSize:
            "21px",
        fontWeight:
            800,
    },

    modalDescription: {
        margin:
            "5px 0 0",
        color:
            "#75869e",
        fontSize:
            "12px",
        lineHeight:
            1.5,
    },

    closeButton: {
        width:
            "34px",
        height:
            "34px",
        border:
            "none",
        borderRadius:
            "9px",
        background:
            "#f1f5f9",
        color:
            "#52657e",
        fontSize:
            "21px",
        cursor:
            "pointer",
        flexShrink:
            0,
    },

    modalBody: {
        padding:
            "22px 24px",
    },

    modalFooter: {
        padding:
            "17px 24px",
        borderTop:
            "1px solid #e7edf4",
        display:
            "flex",
        justifyContent:
            "flex-end",
        gap:
            "10px",
    },

    // ========================================================
    // FORM
    // ========================================================

    formStep: {
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "12px",
        margin:
            "8px 0 13px",
        padding:
            "11px 12px",
        background:
            "#f7faff",
        border:
            "1px solid #e5edf8",
        borderRadius:
            "10px",
    },

    formStepNumber: {
        width:
            "30px",
        height:
            "30px",
        borderRadius:
            "50%",
        background:
            "#2563eb",
        color:
            "#ffffff",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "11px",
        fontWeight:
            800,
        flexShrink:
            0,
    },

    formStepTitle: {
        display:
            "block",
        color:
            "#183a62",
        fontSize:
            "12px",
        marginBottom:
            "2px",
    },

    formStepDescription: {
        display:
            "block",
        color:
            "#7a899e",
        fontSize:
            "10px",
    },

    formGroup: {
        marginBottom:
            "20px",
    },

    label: {
        display:
            "block",
        marginBottom:
            "7px",
        color:
            "#344c6a",
        fontSize:
            "11px",
        fontWeight:
            800,
    },

    required: {
        color:
            "#dc2626",
    },

    input: {
        width:
            "100%",
        minHeight:
            "43px",
        boxSizing:
            "border-box",
        border:
            "1px solid #d6dfeb",
        borderRadius:
            "9px",
        padding:
            "0 12px",
        color:
            "#17365d",
        background:
            "#ffffff",
        fontSize:
            "12px",
        outline:
            "none",
    },

    textarea: {
        width:
            "100%",
        boxSizing:
            "border-box",
        border:
            "1px solid #d6dfeb",
        borderRadius:
            "9px",
        padding:
            "11px 12px",
        color:
            "#17365d",
        background:
            "#ffffff",
        fontSize:
            "12px",
        outline:
            "none",
        resize:
            "vertical",
        fontFamily:
            "inherit",
        lineHeight:
            1.5,
    },

    helperText: {
        display:
            "block",
        marginTop:
            "6px",
        color:
            "#8493a7",
        fontSize:
            "10px",
    },

    characterCount: {
        textAlign:
            "right",
        marginTop:
            "5px",
        color:
            "#8a9ab0",
        fontSize:
            "10px",
    },

    // ========================================================
    // STUDENT SEARCH
    // ========================================================

    studentSearchWrapper: {
        position:
            "relative",
    },

    studentSearchIcon: {
        position:
            "absolute",
        left:
            "13px",
        top:
            "50%",
        transform:
            "translateY(-50%)",
        color:
            "#71809a",
        fontSize:
            "18px",
        zIndex:
            2,
    },

    studentSearchInput: {
        width:
            "100%",
        height:
            "45px",
        boxSizing:
            "border-box",
        border:
            "1px solid #cbd8e8",
        borderRadius:
            "10px",
        padding:
            "0 40px",
        color:
            "#17365d",
        background:
            "#ffffff",
        fontSize:
            "12px",
        outline:
            "none",
    },

    studentClear: {
        position:
            "absolute",
        right:
            "10px",
        top:
            "50%",
        transform:
            "translateY(-50%)",
        border:
            "none",
        background:
            "#eef2f7",
        width:
            "25px",
        height:
            "25px",
        borderRadius:
            "50%",
        cursor:
            "pointer",
        color:
            "#64748b",
        fontSize:
            "16px",
    },

    studentResults: {
        marginTop:
            "6px",
        background:
            "#ffffff",
        border:
            "1px solid #dbe4ef",
        borderRadius:
            "11px",
        overflow:
            "hidden",
        boxShadow:
            "0 12px 28px rgba(15,39,71,.12)",
        maxHeight:
            "330px",
        overflowY:
            "auto",
    },

    resultsHeader: {
        padding:
            "10px 13px",
        background:
            "#f7faff",
        color:
            "#667b96",
        fontSize:
            "10px",
        fontWeight:
            800,
        textTransform:
            "uppercase",
        letterSpacing:
            ".7px",
    },

    studentResult: {
        width:
            "100%",
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "11px",
        padding:
            "11px 13px",
        border:
            "none",
        borderBottom:
            "1px solid #edf1f5",
        background:
            "#ffffff",
        cursor:
            "pointer",
        textAlign:
            "left",
    },

    resultAvatar: {
        width:
            "37px",
        height:
            "37px",
        borderRadius:
            "9px",
        background:
            "#eff5ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "14px",
        fontWeight:
            800,
        flexShrink:
            0,
    },

    resultInformation: {
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "3px",
        flex:
            1,
        minWidth:
            0,
    },

    resultInformationStrong: {
        color:
            "#183a62",
        fontSize:
            "12px",
        fontWeight:
            800,
    },

    resultYear: {
        color:
            "#2563eb",
        background:
            "#eff5ff",
        padding:
            "5px 8px",
        borderRadius:
            "7px",
        fontSize:
            "9px",
        fontWeight:
            800,
        whiteSpace:
            "nowrap",
    },

    resultArrow: {
        color:
            "#2563eb",
        fontSize:
            "17px",
        fontWeight:
            700,
    },

    noResults: {
        padding:
            "24px 15px",
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "4px",
        alignItems:
            "center",
        color:
            "#64748b",
        fontSize:
            "12px",
    },

    selectedStudentCard: {
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "13px",
        padding:
            "14px",
        marginTop:
            "-5px",
        marginBottom:
            "21px",
        background:
            "#f4f9ff",
        border:
            "1px solid #cfe1fb",
        borderRadius:
            "12px",
    },

    selectedStudentAvatar: {
        width:
            "48px",
        height:
            "48px",
        borderRadius:
            "12px",
        background:
            "#2563eb",
        color:
            "#ffffff",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "17px",
        fontWeight:
            800,
        flexShrink:
            0,
    },

    selectedStudentInformation: {
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "3px",
        flex:
            1,
    },

    selectedLabel: {
        color:
            "#2563eb",
        fontSize:
            "8px",
        fontWeight:
            800,
        letterSpacing:
            "1px",
    },

    selectedStudentMeta: {
        display:
            "flex",
        flexWrap:
            "wrap",
        gap:
            "7px",
        color:
            "#71809a",
        fontSize:
            "10px",
        marginTop:
            "2px",
    },

    selectedCheck: {
        width:
            "27px",
        height:
            "27px",
        borderRadius:
            "50%",
        background:
            "#16a34a",
        color:
            "#ffffff",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontWeight:
            800,
    },

    infoNotice: {
        display:
            "flex",
        gap:
            "9px",
        marginTop:
            "9px",
        padding:
            "10px 12px",
        borderRadius:
            "9px",
        background:
            "#fffbeb",
        border:
            "1px solid #fde68a",
        color:
            "#92400e",
        fontSize:
            "10px",
    },

    // ========================================================
    // UPLOAD
    // ========================================================

    uploadArea: {
        width:
            "100%",
        minHeight:
            "170px",
        boxSizing:
            "border-box",
        border:
            "2px dashed #cbd8e8",
        borderRadius:
            "13px",
        background:
            "#fafcff",
        display:
            "flex",
        flexDirection:
            "column",
        alignItems:
            "center",
        justifyContent:
            "center",
        gap:
            "6px",
        color:
            "#385677",
        cursor:
            "pointer",
        transition:
            "0.2s ease",
    },

    uploadIcon: {
        width:
            "45px",
        height:
            "45px",
        borderRadius:
            "50%",
        background:
            "#eff5ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "22px",
        fontWeight:
            800,
        marginBottom:
            "3px",
    },

    imagePreviewBox: {
        display:
            "flex",
        gap:
            "18px",
        alignItems:
            "center",
        padding:
            "15px",
        border:
            "1px solid #dbe5f0",
        borderRadius:
            "13px",
        background:
            "#f9fbfe",
    },

    largeImagePreview: {
        width:
            "105px",
        height:
            "105px",
        borderRadius:
            "13px",
        objectFit:
            "cover",
        border:
            "1px solid #d9e3ee",
        flexShrink:
            0,
    },

    imagePreviewInformation: {
        display:
            "flex",
        flexDirection:
            "column",
        alignItems:
            "flex-start",
        gap:
            "6px",
    },

    imageReadyBadge: {
        display:
            "inline-flex",
        background:
            "#ecfdf5",
        color:
            "#15803d",
        padding:
            "5px 8px",
        borderRadius:
            "999px",
        fontSize:
            "9px",
        fontWeight:
            800,
    },

    imageButtons: {
        display:
            "flex",
        gap:
            "7px",
        marginTop:
            "4px",
    },

    // ========================================================
    // FINAL REVIEW
    // ========================================================

    finalReview: {
        marginTop:
            "10px",
        border:
            "1px solid #dbe5f0",
        borderRadius:
            "13px",
        overflow:
            "hidden",
    },

    finalReviewHeader: {
        padding:
            "14px 15px",
        background:
            "#f5f9ff",
        display:
            "flex",
        justifyContent:
            "space-between",
        alignItems:
            "center",
        gap:
            "15px",
    },

    reviewOverline: {
        display:
            "block",
        color:
            "#2563eb",
        fontSize:
            "8px",
        fontWeight:
            800,
        letterSpacing:
            "1px",
        marginBottom:
            "3px",
    },

    reviewHeading: {
        margin:
            0,
        color:
            "#17365d",
        fontSize:
            "14px",
        fontWeight:
            800,
    },

    readyBadge: {
        display:
            "inline-flex",
        alignItems:
            "center",
        gap:
            "4px",
        background:
            "#ecfdf5",
        color:
            "#15803d",
        borderRadius:
            "999px",
        padding:
            "6px 9px",
        fontSize:
            "9px",
        fontWeight:
            800,
    },

    reviewGrid: {
        display:
            "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0,1fr))",
    },

    reviewItem: {
        display:
            "flex",
        flexDirection:
            "column",
        gap:
            "4px",
        padding:
            "12px 15px",
        borderTop:
            "1px solid #edf1f5",
    },

    // ========================================================
    // DETAILS
    // ========================================================

    detailsBody: {
        padding:
            "22px 24px",
    },

    detailProfile: {
        display:
            "flex",
        alignItems:
            "center",
        gap:
            "15px",
        paddingBottom:
            "20px",
        marginBottom:
            "15px",
        borderBottom:
            "1px solid #e7edf4",
    },

    detailAvatar: {
        width:
            "70px",
        height:
            "70px",
        borderRadius:
            "15px",
        background:
            "#eff5ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        fontSize:
            "27px",
        fontWeight:
            800,
        overflow:
            "hidden",
        flexShrink:
            0,
    },

    detailName: {
        margin:
            "0 0 8px",
        color:
            "#0b1f3a",
        fontSize:
            "18px",
        fontWeight:
            800,
    },

    detailRow: {
        display:
            "flex",
        justifyContent:
            "space-between",
        gap:
            "20px",
        padding:
            "12px 0",
        borderBottom:
            "1px solid #edf1f5",
        fontSize:
            "12px",
    },

    platformDetails: {
        marginTop:
            "17px",
        background:
            "#f8fafc",
        borderRadius:
            "10px",
        padding:
            "14px",
    },

    // ========================================================
    // CONFIRMATION
    // ========================================================

    confirmModal: {
        width:
            "min(430px, 100%)",
        background:
            "#ffffff",
        borderRadius:
            "17px",
        padding:
            "30px",
        boxSizing:
            "border-box",
        textAlign:
            "center",
        boxShadow:
            "0 25px 70px rgba(0,0,0,.25)",
        animation:
            "votaraFade .18s ease",
    },

    confirmIcon: {
        width:
            "55px",
        height:
            "55px",
        borderRadius:
            "50%",
        background:
            "#eff6ff",
        color:
            "#2563eb",
        display:
            "flex",
        alignItems:
            "center",
        justifyContent:
            "center",
        margin:
            "0 auto 14px",
        fontSize:
            "23px",
        fontWeight:
            800,
    },

    confirmTitle: {
        margin:
            0,
        color:
            "#0b1f3a",
        fontSize:
            "19px",
        fontWeight:
            800,
    },

    confirmMessage: {
        margin:
            "10px auto 16px",
        maxWidth:
            "350px",
        color:
            "#71809a",
        fontSize:
            "13px",
        lineHeight:
            1.6,
    },

    confirmNote: {
        display:
            "flex",
        alignItems:
            "flex-start",
        gap:
            "8px",
        textAlign:
            "left",
        background:
            "#f8fafc",
        border:
            "1px solid #e2e8f0",
        borderRadius:
            "9px",
        padding:
            "10px",
        marginBottom:
            "22px",
        color:
            "#64748b",
        fontSize:
            "10px",
    },

    confirmFooter: {
        display:
            "flex",
        justifyContent:
            "center",
        gap:
            "10px",
    },

    // ========================================================
    // STATUS
    // ========================================================

    statusDraft: {
        display:
            "inline-flex",
        background:
            "#f1f5f9",
        color:
            "#64748b",
        borderRadius:
            "999px",
        padding:
            "5px 9px",
        fontSize:
            "9px",
        fontWeight:
            800,
        textTransform:
            "capitalize",
    },

    statusOpen: {
        display:
            "inline-flex",
        background:
            "#ecfdf5",
        color:
            "#15803d",
        borderRadius:
            "999px",
        padding:
            "5px 9px",
        fontSize:
            "9px",
        fontWeight:
            800,
        textTransform:
            "capitalize",
    },

    statusScheduled: {
        display:
            "inline-flex",
        background:
            "#eff6ff",
        color:
            "#2563eb",
        borderRadius:
            "999px",
        padding:
            "5px 9px",
        fontSize:
            "9px",
        fontWeight:
            800,
        textTransform:
            "capitalize",
    },

    statusClosed: {
        display:
            "inline-flex",
        background:
            "#f1f5f9",
        color:
            "#475569",
        borderRadius:
            "999px",
        padding:
            "5px 9px",
        fontSize:
            "9px",
        fontWeight:
            800,
        textTransform:
            "capitalize",
    },
};

export default EBCandidateManagement;