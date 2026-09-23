import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
    getAllElections,
    createElection,
    updateElection,
    updateElectionStatus,
    publishElection,
    unpublishElection,
    addPosition,
    getElectionConfiguration,
} from "../../services/electionService";

import api from "../../services/api";


// =========================================================
// CONSTANTS
// =========================================================

const YEAR_LEVELS = [
    "2nd Year",
    "3rd Year",
    "4th Year",
];


// Standard VOTARA positions configured for the election ballot.
// 1st Year has no general year-level representative position.
const STANDARD_POSITION_PRESETS = [
    {
        name: "President",
        description: "President of the student organization.",
        yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"],
    },
    {
        name: "Vice President",
        description: "Vice President of the student organization.",
        yearLevelAccess: ["4th Year"],
    },
    {
        name: "Secretary",
        description: "Manages official records and documentation.",
        yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"],
    },
    {
        name: "Treasurer",
        description: "Manages organization financial responsibilities.",
        yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"],
    },
    {
        name: "Auditor",
        description: "Oversees and reviews organization financial records.",
        yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"],
    },
    {
        name: "Business Manager",
        description: "Manages organization business and operational activities.",
        yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"],
    },
    {
        name: "Public Information Officer",
        description: "Handles official information and communication.",
        yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"],
    },
    {
        name: "Sergeant at Arms",
        description: "Assists with order, security, and official activities.",
        yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"],
    },
    {
        name: "2nd Year Representative",
        description: "Representative for 2nd Year students.",
        yearLevelAccess: ["2nd Year"],
    },
    {
        name: "3rd Year Representative",
        description: "Representative for 3rd Year students.",
        yearLevelAccess: ["3rd Year"],
    },
    {
        name: "4th Year Representative",
        description: "Representative for 4th Year students.",
        yearLevelAccess: ["4th Year"],
    },
];


const STATUS_LABELS = {
    draft: "Draft",
    scheduled: "Scheduled",
    open: "Open",
    closed: "Completed",
    cancelled: "Cancelled",
};


// =========================================================
// HELPERS
// =========================================================

const formatDate = (date) => {
    if (!date) {
        return "—";
    }

    const parsed = new Date(
        `${date}T00:00:00`
    );

    if (Number.isNaN(parsed.getTime())) {
        return date;
    }

    return parsed.toLocaleDateString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric",
        }
    );
};


const formatTime = (time) => {
    if (!time) {
        return "—";
    }

    const [hours, minutes] =
        String(time).split(":");

    const date = new Date();

    date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
    );

    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit",
        }
    );
};


const formatStatus = (status) => {
    return (
        STATUS_LABELS[status] ||
        status ||
        "Draft"
    );
};


// Normalize any date value returned by the API/database
// into the exact YYYY-MM-DD format required by <input type="date">.
const normalizeDateForInput = (value) => {
    if (!value) {
        return "";
    }

    const stringValue = String(value).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
        return stringValue;
    }

    // Handle ISO/date-time values such as:
    // 2026-09-22T00:00:00.000Z
    const isoMatch = stringValue.match(/^(\d{4}-\d{2}-\d{2})/);

    if (isoMatch) {
        return isoMatch[1];
    }

    const parsed = new Date(stringValue);

    if (Number.isNaN(parsed.getTime())) {
        return "";
    }

    const year = parsed.getUTCFullYear();
    const month = String(
        parsed.getUTCMonth() + 1
    ).padStart(2, "0");
    const day = String(
        parsed.getUTCDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


// Normalize any time value returned by the API/database
// into HH:MM for <input type="time">.
const normalizeTimeForInput = (value, fallback = "") => {
    if (!value) {
        return fallback;
    }

    const stringValue = String(value).trim();

    const match = stringValue.match(
        /^(\d{2}:\d{2})/
    );

    return match
        ? match[1]
        : fallback;
};


const canEditElection = (election) => {
    const status = String(
        election?.rawStatus || election?.status || ""
    ).toLowerCase();

    return (
        status === "draft" ||
        status === "scheduled"
    );
};



const normalizeElection = (
    election
) => {
    return {
        ...election,

        id: election?.id,

        name:
            election?.title ||
            "Untitled Election",

        description:
            election?.description ||
            "",

        rawStatus:
            election?.status ||
            "draft",

        status:
            formatStatus(
                election?.status
            ),

        isPublished:
            Boolean(
                election?.is_published
            ),

        electionDate:
            election?.election_date,

        startTime:
            election?.start_time,

        endTime:
            election?.end_time,

        yearLevelAccess:
            Array.isArray(
                election?.election_year_levels
            )
                ? election.election_year_levels
                : [],

        candidates:
            Number(
                election?.candidate_count ||
                0
            ),

        voters:
            Number(
                election?.voter_count ||
                0
            ),

        votes:
            Number(
                election?.vote_count ||
                0
            ),
    };
};


// =========================================================
// COMPONENT
// =========================================================

function ElectionManagement() {

    const navigate =
        useNavigate();


    // =====================================================
    // DATA
    // =====================================================

    const [
        elections,
        setElections,
    ] = useState([]);


    const [
        selectedElection,
        setSelectedElection,
    ] = useState(null);


    const [
        positions,
        setPositions,
    ] = useState([]);


    // =====================================================
    // PAGE STATE
    // =====================================================

    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        loadingPositions,
        setLoadingPositions,
    ] = useState(false);


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        success,
        setSuccess,
    ] = useState("");


    const [
        search,
        setSearch,
    ] = useState("");


    const [
        statusFilter,
        setStatusFilter,
    ] = useState("All");


    // =====================================================
    // MODALS
    // =====================================================

    const [
        showCreateModal,
        setShowCreateModal,
    ] = useState(false);


    const [
        showEditModal,
        setShowEditModal,
    ] = useState(false);

    // The election currently being edited.
    // This is kept separate from selectedElection because
    // selectedElection is also used by the Details modal.
    const [
        editingElection,
        setEditingElection,
    ] = useState(null);


    const [
        showConfirmModal,
        setShowConfirmModal,
    ] = useState(false);


    const [
        showPositionModal,
        setShowPositionModal,
    ] = useState(false);


    // =====================================================
    // ACTION MENU
    // =====================================================

    // Keeps the election row actions compressed into a
    // three-dot menu. Only one menu is open at a time.
    const [
        openActionMenuId,
        setOpenActionMenuId,
    ] = useState(null);


    // Fixed position for the three-dot action menu.
    // This keeps the menu above the table/card overflow so
    // the EB can see the complete action list without
    // needing to scroll the elections table.
    const [
        actionMenuPosition,
        setActionMenuPosition,
    ] = useState(null);


    // Close the action menu when the EB clicks anywhere
    // outside the menu.
    useEffect(() => {

        const handleDocumentMouseDown =
            (event) => {

                if (
                    !event.target.closest(
                        "[data-election-action-menu]"
                    )
                ) {
                    setOpenActionMenuId(
                        null
                    );

                    setActionMenuPosition(
                        null
                    );
                }
            };

        document.addEventListener(
            "mousedown",
            handleDocumentMouseDown
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleDocumentMouseDown
            );
        };

    }, []);


    // =====================================================
    // CONFIRMATION
    // =====================================================

    const [
        confirmation,
        setConfirmation,
    ] = useState({
        title: "",
        message: "",
        actionLabel: "Confirm",
        actionType: "",
        election: null,
        newStatus: null,
        danger: false,
    });


    // =====================================================
    // CREATE FORM
    // =====================================================

    const [
        createForm,
        setCreateForm,
    ] = useState({
        title: "",
        description: "",
        electionDate: "",
        startTime: "08:00",
        endTime: "16:00",
        yearLevelAccess: [
            "2nd Year",
            "3rd Year",
            "4th Year",
        ],
    });


    // =====================================================
    // EDIT FORM
    // =====================================================

    const [
        editForm,
        setEditForm,
    ] = useState({
        title: "",
        description: "",
        electionDate: "",
        startTime: "08:00",
        endTime: "16:00",
        yearLevelAccess: [],
    });


    // =====================================================
    // POSITION FORM
    // =====================================================

    const [
        positionForm,
        setPositionForm,
    ] = useState({
        name: "",
        description: "",
        order: 0,
        isRequired: true,
        yearLevelAccess: [],
    });


    // =====================================================
    // LOAD ELECTIONS
    // =====================================================

    const loadElections =
        async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await getAllElections();

                const list =
                    response?.elections ||
                    response?.data?.elections ||
                    response?.data ||
                    response ||
                    [];

                const normalized =
                    Array.isArray(list)
                        ? list.map(
                              normalizeElection
                          )
                        : [];

                setElections(
                    normalized
                );

            } catch (err) {

                console.error(
                    "Load elections error:",
                    err
                );

                setError(
                    err?.response?.data
                        ?.message ||
                    err?.message ||
                    "Unable to load elections."
                );

            } finally {

                setLoading(false);
            }
        };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadElections();

    }, []);


    // =====================================================
    // FILTER
    // =====================================================

    const filteredElections =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return elections.filter(
                (election) => {

                    const matchesSearch =
                        !keyword ||
                        election.name
                            .toLowerCase()
                            .includes(
                                keyword
                            ) ||
                        election.id
                            ?.toLowerCase()
                            .includes(
                                keyword
                            );

                    const matchesStatus =
                        statusFilter ===
                            "All" ||
                        election.rawStatus ===
                            statusFilter;

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                }
            );

        }, [
            elections,
            search,
            statusFilter,
        ]);


    // =====================================================
    // STATISTICS
    // =====================================================

    const totalElections =
        elections.length;


    const openElections =
        elections.filter(
            (election) =>
                election.rawStatus ===
                "open"
        ).length;


    const scheduledElections =
        elections.filter(
            (election) =>
                election.rawStatus ===
                "scheduled"
        ).length;


    const completedElections =
        elections.filter(
            (election) =>
                election.rawStatus ===
                "closed"
        ).length;


    // =====================================================
    // CREATE MODAL
    // =====================================================

    const openCreateModal =
        () => {

            setError("");
            setSuccess("");

            setCreateForm({
                title: "",
                description: "",
                electionDate: "",
                startTime: "08:00",
                endTime: "16:00",
                yearLevelAccess: [
                    "2nd Year",
                    "3rd Year",
                    "4th Year",
                ],
            });

            setShowCreateModal(
                true
            );
        };


    const closeCreateModal =
        () => {

            if (saving) {
                return;
            }

            setShowCreateModal(
                false
            );
        };


    // =====================================================
    // CREATE FORM CHANGE
    // =====================================================

    const handleCreateChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;

            setCreateForm(
                (current) => ({
                    ...current,
                    [name]: value,
                })
            );
        };


    // =====================================================
    // TOGGLE CREATE YEAR LEVEL
    // =====================================================

    const toggleCreateYearLevel =
        (yearLevel) => {

            setCreateForm(
                (current) => {

                    const exists =
                        current.yearLevelAccess.includes(
                            yearLevel
                        );

                    return {
                        ...current,

                        yearLevelAccess:
                            exists
                                ? current.yearLevelAccess.filter(
                                      (item) =>
                                          item !==
                                          yearLevel
                                  )
                                : [
                                      ...current.yearLevelAccess,
                                      yearLevel,
                                  ],
                    };
                }
            );
        };


    // =====================================================
    // CREATE ELECTION
    // =====================================================

    const handleCreateElection =
        async (event) => {

            event.preventDefault();

            setError("");
            setSuccess("");

            if (
                !createForm.title.trim()
            ) {
                setError(
                    "Election title is required."
                );
                return;
            }

            if (
                !createForm.electionDate
            ) {
                setError(
                    "Election date is required."
                );
                return;
            }

            if (
                !createForm.startTime ||
                !createForm.endTime
            ) {
                setError(
                    "Voting start and end times are required."
                );
                return;
            }

            if (
                createForm.startTime >=
                createForm.endTime
            ) {
                setError(
                    "Voting end time must be later than start time."
                );
                return;
            }

            if (
                createForm.yearLevelAccess
                    .length === 0
            ) {
                setError(
                    "Select at least one eligible year level."
                );
                return;
            }

            try {

                setSaving(true);

                const response =
                    await createElection({
                        title:
                            createForm.title.trim(),

                        description:
                            createForm.description.trim(),

                        electionDate:
                            createForm.electionDate,

                        startTime:
                            createForm.startTime,

                        endTime:
                            createForm.endTime,

                        yearLevelAccess:
                            createForm.yearLevelAccess,
                    });

                const created =
                    response?.election ||
                    response?.data?.election ||
                    response?.data ||
                    response;

                setShowCreateModal(
                    false
                );

                setSuccess(
                    `"${created?.title || createForm.title}" was created successfully.`
                );

                await loadElections();

                if (created?.id) {

                    await openElectionDetails(
                        normalizeElection(
                            created
                        )
                    );
                }

            } catch (err) {

                console.error(
                    "Create election error:",
                    err
                );

                setError(
                    err?.response?.data
                        ?.message ||
                    err?.message ||
                    "Failed to create election."
                );

            } finally {

                setSaving(false);
            }
        };


    // =====================================================
    // OPEN ELECTION DETAILS
    // =====================================================

    const openElectionDetails =
        async (election) => {

            setError("");

            setSelectedElection(
                normalizeElection(
                    election
                )
            );

            setPositions([]);

            await loadPositions(
                election.id
            );
        };


    // =====================================================
    // LOAD POSITIONS
    // =====================================================

    const loadPositions =
        async (electionId) => {

            try {

                setLoadingPositions(
                    true
                );

                const response =
                    await getElectionConfiguration(
                        electionId
                    );

                const data =
                    response?.data ||
                    response;

                setPositions(
                    Array.isArray(
                        data?.positions
                    )
                        ? data.positions
                        : []
                );

            } catch (err) {

                console.error(
                    "Load positions error:",
                    err
                );

                setPositions([]);

            } finally {

                setLoadingPositions(
                    false
                );
            }
        };


    // =====================================================
    // CLOSE DETAILS
    // =====================================================

    const closeDetails =
        () => {

            if (saving) {
                return;
            }

            setSelectedElection(
                null
            );

            setPositions([]);
        };


    // =====================================================
    // EDIT ELECTION
    // =====================================================

    const openEditModal =
        (election) => {

            if (!election?.id) {
                setError(
                    "Unable to edit this election because the election ID is missing."
                );
                return;
            }

            if (!canEditElection(election)) {
                setError(
                    "This election cannot be edited in its current status."
                );
                return;
            }

            setError("");
            setSuccess("");

            const yearLevels =
                Array.isArray(
                    election.yearLevelAccess
                )
                    ? election.yearLevelAccess
                          .map(
                              (item) =>
                                  item?.year_level ||
                                  item
                          )
                          .filter(
                              (year) =>
                                  YEAR_LEVELS.includes(
                                      year
                                  )
                          )
                    : [];

            // Store the exact election passed by either
            // the table Edit button or the Details Edit button.
            setEditingElection(
                election
            );

            setEditForm({
                title:
                    election.name ||
                    "",

                description:
                    election.description ||
                    "",

                electionDate:
                    normalizeDateForInput(
                        election.electionDate
                    ),

                startTime:
                    normalizeTimeForInput(
                        election.startTime,
                        "08:00"
                    ),

                endTime:
                    normalizeTimeForInput(
                        election.endTime,
                        "16:00"
                    ),

                yearLevelAccess:
                    yearLevels,
            });

            // If Edit was clicked from the Details modal,
            // close Details first. Both modals previously had
            // the same z-index, which made the Details modal
            // sit above the Edit modal and made the Edit button
            // appear to do nothing.
            setSelectedElection(
                null
            );

            setShowEditModal(
                true
            );
        };


    const closeEditModal =
        () => {

            if (saving) {
                return;
            }

            setShowEditModal(
                false
            );

            setEditingElection(
                null
            );
        };


    // =====================================================
    // EDIT FORM CHANGE
    // =====================================================

    const handleEditChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;

            setEditForm(
                (current) => ({
                    ...current,
                    [name]: value,
                })
            );
        };


    // =====================================================
    // TOGGLE EDIT YEAR LEVEL
    // =====================================================

    const toggleEditYearLevel =
        (yearLevel) => {

            setEditForm(
                (current) => {

                    const exists =
                        current.yearLevelAccess.includes(
                            yearLevel
                        );

                    return {
                        ...current,

                        yearLevelAccess:
                            exists
                                ? current.yearLevelAccess.filter(
                                      (item) =>
                                          item !==
                                          yearLevel
                                  )
                                : [
                                      ...current.yearLevelAccess,
                                      yearLevel,
                                  ],
                    };
                }
            );
        };


    // =====================================================
    // SAVE EDIT
    // =====================================================

    const handleSaveEdit =
        async (event) => {

            event.preventDefault();

            if (!editingElection?.id) {
                setError(
                    "No election is selected for editing."
                );
                return;
            }

            const normalizedDate =
                normalizeDateForInput(
                    editForm.electionDate
                );

            const normalizedStartTime =
                normalizeTimeForInput(
                    editForm.startTime
                );

            const normalizedEndTime =
                normalizeTimeForInput(
                    editForm.endTime
                );

            if (!editForm.title.trim()) {
                setError(
                    "Election title is required."
                );
                return;
            }

            if (!normalizedDate) {
                setError(
                    "Please select a valid election date."
                );
                return;
            }

            if (
                !normalizedStartTime ||
                !normalizedEndTime
            ) {
                setError(
                    "Voting start and end times are required."
                );
                return;
            }

            if (
                normalizedStartTime >=
                normalizedEndTime
            ) {
                setError(
                    "Voting end time must be later than start time."
                );
                return;
            }

            if (
                editForm.yearLevelAccess.length === 0
            ) {
                setError(
                    "Select at least one eligible year level."
                );
                return;
            }

            try {

                setSaving(true);
                setError("");
                setSuccess("");

                const updatePayload = {
                    title:
                        editForm.title.trim(),

                    description:
                        editForm.description.trim(),

                    // Always send YYYY-MM-DD.
                    electionDate:
                        normalizedDate,

                    // Always send HH:MM.
                    startTime:
                        normalizedStartTime,

                    endTime:
                        normalizedEndTime,

                    yearLevelAccess:
                        editForm.yearLevelAccess,
                };

                console.log(
                    "Updating election:",
                    editingElection.id,
                    updatePayload
                );

                const response =
                    await updateElection(
                        editingElection.id,
                        updatePayload
                    );

                const updated =
                    response?.election ||
                    response?.data?.election ||
                    response?.data ||
                    response;

                if (!updated?.id) {
                    throw new Error(
                        "The election update did not return the updated election."
                    );
                }

                const normalized =
                    normalizeElection(
                        updated
                    );

                setShowEditModal(
                    false
                );

                setEditingElection(
                    null
                );

                setEditForm({
                    title:
                        normalized.name || "",

                    description:
                        normalized.description || "",

                    electionDate:
                        normalizeDateForInput(
                            normalized.electionDate
                        ),

                    startTime:
                        normalizeTimeForInput(
                            normalized.startTime,
                            "08:00"
                        ),

                    endTime:
                        normalizeTimeForInput(
                            normalized.endTime,
                            "16:00"
                        ),

                    yearLevelAccess:
                        Array.isArray(
                            normalized.yearLevelAccess
                        )
                            ? normalized.yearLevelAccess
                                  .map(
                                      (item) =>
                                          item?.year_level ||
                                          item
                                  )
                                  .filter(
                                      (year) =>
                                          YEAR_LEVELS.includes(
                                              year
                                          )
                                  )
                            : [],
                });

                setSelectedElection(
                    normalized
                );

                setSuccess(
                    `Election information updated successfully. The election date is now ${formatDate(
                        normalized.electionDate
                    )}.`
                );

                await loadPositions(
                    normalized.id
                );

                // Refresh the table without depending on the
                // returned object to populate the list.
                await loadElections();

            } catch (err) {

                console.error(
                    "Update election error:",
                    err
                );

                const serverMessage =
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    err?.message ||
                    "Failed to update election.";

                // Keep the modal open when saving fails so
                // the EB can immediately see the actual reason.
                setError(
                    `Unable to save the election changes: ${serverMessage}`
                );

            } finally {

                setSaving(false);
            }
        };


    // =====================================================
    // OPEN CONFIRMATION
    // =====================================================

    const openConfirmation =
        ({
            title,
            message,
            actionLabel,
            actionType,
            election,
            newStatus,
            danger = false,
        }) => {

            setConfirmation({
                title,
                message,
                actionLabel,
                actionType,
                election,
                newStatus,
                danger,
            });

            setShowConfirmModal(
                true
            );
        };


    const closeConfirmation =
        () => {

            if (saving) {
                return;
            }

            setShowConfirmModal(
                false
            );
        };


    // =====================================================
    // EXECUTE CONFIRMATION
    // =====================================================

    const executeConfirmation =
        async () => {

            const {
                election,
                newStatus,
                actionType,
            } = confirmation;

            if (!election) {
                return;
            }

            try {

                setSaving(true);
                setError("");
                setSuccess("");

                let response;

                // -----------------------------------------
                // DELETE
                // -----------------------------------------

                if (
                    actionType ===
                    "delete"
                ) {

                    await api.delete(
                        `/elections/${election.id}`
                    );

                    setShowConfirmModal(false);
                    setSelectedElection(null);
                    setPositions([]);

                    setSuccess(
                        `"${election.name}" was permanently deleted.`
                    );

                    await loadElections();

                    return;
                }

                // -----------------------------------------
                // STATUS
                // -----------------------------------------

                if (
                    actionType ===
                    "status"
                ) {

                    response =
                        await updateElectionStatus(
                            election.id,
                            newStatus
                        );
                }

                // -----------------------------------------
                // PUBLISH
                // -----------------------------------------

                if (
                    actionType ===
                    "publish"
                ) {

                    response =
                        await publishElection(
                            election.id
                        );
                }

                // -----------------------------------------
                // UNPUBLISH
                // -----------------------------------------

                if (
                    actionType ===
                    "unpublish"
                ) {

                    response =
                        await unpublishElection(
                            election.id
                        );
                }

                const updated =
                    response?.election ||
                    response?.data?.election ||
                    response?.data ||
                    response;

                setShowConfirmModal(
                    false
                );

                setSuccess(
                    actionType ===
                        "publish"
                        ? "Election published successfully."
                        : actionType ===
                          "unpublish"
                        ? "Election publishing cancelled. The election is back in Draft and can be published again."
                        : `Election status changed to ${formatStatus(
                              newStatus
                          )}.`
                );

                await loadElections();

                if (updated?.id) {

                    const normalized =
                        normalizeElection(
                            updated
                        );

                    setSelectedElection(
                        normalized
                    );

                    await loadPositions(
                        updated.id
                    );
                }

            } catch (err) {

                console.error(
                    "Election action error:",
                    err
                );

                setShowConfirmModal(
                    false
                );

                setError(
                    err?.response?.data
                        ?.message ||
                    err?.message ||
                    "The election action could not be completed."
                );

            } finally {

                setSaving(false);
            }
        };


    // =====================================================
    // STATUS ACTIONS
    // =====================================================

    // =====================================================
    // DELETE ELECTION
    // =====================================================

    const requestDeleteElection =
        (election) => {

            openConfirmation({
                title:
                    "Delete Election",

                message:
                    `Are you sure you want to permanently delete "${election.name}"? This action cannot be undone. Deleting an election may also remove its related configuration and records according to the database rules.`,

                actionLabel:
                    "Delete Election",

                actionType:
                    "delete",

                election,

                danger:
                    true,
            });
        };


    const requestPublish =
        (election) => {

            openConfirmation({
                title:
                    "Publish Election",

                message:
                    `Are you sure you want to publish "${election.name}"? Publishing will make this election officially scheduled for the election process.`,

                actionLabel:
                    "Publish Election",

                actionType:
                    "publish",

                election,
            });
        };


    const requestUnpublish =
        (election) => {

            openConfirmation({
                title:
                    "Unpublish Election",

                message:
                    `Cancel publishing "${election.name}"? The election will return to Draft status. You can publish it again later.`,

                actionLabel:
                    "Unpublish",

                actionType:
                    "unpublish",

                election,

                danger:
                    false,
            });
        };


    const requestStatusChange =
        (
            election,
            newStatus
        ) => {

            let message =
                `Change "${election.name}" to ${formatStatus(
                    newStatus
                )}?`;

            if (
                newStatus ===
                "open"
            ) {
                message =
                    `Open "${election.name}" for voting? This changes the election status to Open.`;
            }

            if (
                newStatus ===
                "closed"
            ) {
                message =
                    `Close "${election.name}"? Once closed, voting should no longer be accepted.`;
            }

            if (
                newStatus ===
                "cancelled"
            ) {
                message =
                    `Cancel "${election.name}"? This action cannot be used to reopen a cancelled election.`;
            }

            openConfirmation({
                title:
                    `Change Election Status`,

                message,

                actionLabel:
                    `Set ${formatStatus(
                        newStatus
                    )}`,

                actionType:
                    "status",

                election,

                newStatus,

                danger:
                    newStatus ===
                    "cancelled",
            });
        };


    // =====================================================
    // OPEN CANDIDATE MANAGEMENT
    // =====================================================

    const openCandidateManagement = (election) => {
    if (!election?.id) {
        setError(
            "Unable to open Candidate Management because the election ID is missing."
        );
        return;
    }

    navigate("/electoral-board/candidates", {
        state: {
            electionId: election.id,
            electionTitle: election.name,
        },
    });
};


    // =====================================================
    // POSITION MODAL
    // =====================================================

    const openPositionModal =
        () => {

            if (!selectedElection) {
                return;
            }

            if (
                selectedElection.rawStatus ===
                    "open" ||
                selectedElection.rawStatus ===
                    "closed" ||
                selectedElection.rawStatus ===
                    "cancelled"
            ) {
                setError(
                    "Positions cannot be modified while the election is Open, Completed, or Cancelled."
                );
                return;
            }

            setPositionForm({
                name: "",
                description: "",
                order:
                    positions.length + 1,
                isRequired: true,
                yearLevelAccess: [],
            });

            setShowPositionModal(
                true
            );
        };


    const closePositionModal =
        () => {

            if (saving) {
                return;
            }

            setShowPositionModal(
                false
            );
        };


    // =====================================================
    // POSITION CHANGE
    // =====================================================

    const handlePositionChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;

            setPositionForm(
                (current) => ({
                    ...current,
                    [name]: value,
                })
            );
        };


    // =====================================================
    // TOGGLE POSITION YEAR LEVEL
    // =====================================================

    const togglePositionYearLevel =
        (yearLevel) => {

            setPositionForm(
                (current) => {

                    const exists =
                        current.yearLevelAccess.includes(
                            yearLevel
                        );

                    return {
                        ...current,

                        yearLevelAccess:
                            exists
                                ? current.yearLevelAccess.filter(
                                      (item) =>
                                          item !==
                                          yearLevel
                                  )
                                : [
                                      ...current.yearLevelAccess,
                                      yearLevel,
                                  ],
                    };
                }
            );
        };


    // =====================================================
    // ADD POSITION
    // =====================================================

    const handleAddPosition =
        async (event) => {

            event.preventDefault();

            if (!selectedElection) {
                return;
            }

            if (
                !positionForm.name.trim()
            ) {
                setError(
                    "Position name is required."
                );
                return;
            }

            if (
                positionForm.yearLevelAccess
                    .length === 0
            ) {
                setError(
                    "Select at least one year level for this position."
                );
                return;
            }

            try {

                setSaving(true);
                setError("");

                await addPosition(
                    selectedElection.id,
                    {
                        name:
                            positionForm.name.trim(),

                        description:
                            positionForm.description.trim(),

                        order:
                            Number(
                                positionForm.order
                            ),

                        isRequired:
                            Boolean(
                                positionForm.isRequired
                            ),

                        yearLevelAccess:
                            positionForm.yearLevelAccess,
                    }
                );

                setShowPositionModal(
                    false
                );

                setSuccess(
                    "Election position added successfully."
                );

                await loadPositions(
                    selectedElection.id
                );

                await loadElections();

            } catch (err) {

                console.error(
                    "Add position error:",
                    err
                );

                setError(
                    err?.response?.data
                        ?.message ||
                    err?.message ||
                    "Failed to add position."
                );

            } finally {

                setSaving(false);
            }
        };


    // =====================================================
    // POSITION PRESETS
    // =====================================================

    const applyPositionPreset =
        (preset) => {

            const selected =
                STANDARD_POSITION_PRESETS.find(
                    (item) => item.name === preset
                );

            if (!selected) {
                return;
            }

            setPositionForm(
                (current) => ({
                    ...current,
                    ...selected,
                    order: positions.length + 1,
                    isRequired: true,
                })
            );
        };


    // =====================================================
    // ADD ALL STANDARD POSITIONS
    // =====================================================

    const handleAddAllStandardPositions =
        async () => {

            if (!selectedElection) {
                return;
            }

            if (
                selectedElection.rawStatus === "open" ||
                selectedElection.rawStatus === "closed" ||
                selectedElection.rawStatus === "cancelled"
            ) {
                setError(
                    "Positions cannot be modified while the election is Open, Completed, or Cancelled."
                );
                return;
            }

            try {
                setSaving(true);
                setError("");
                setSuccess("");

                const existingNames = new Set(
                    positions
                        .map((position) =>
                            String(position?.name || "")
                                .trim()
                                .toLowerCase()
                        )
                        .filter(Boolean)
                );

                const missingPositions =
                    STANDARD_POSITION_PRESETS.filter(
                        (position) =>
                            !existingNames.has(
                                position.name.toLowerCase()
                            )
                    );

                if (missingPositions.length === 0) {
                    setSuccess(
                        "All 11 standard VOTARA positions are already configured for this election."
                    );
                    return;
                }

                let nextOrder =
                    Math.max(
                        0,
                        ...positions.map((position) =>
                            Number(
                                position?.display_order ??
                                position?.order ??
                                0
                            )
                        )
                    ) + 1;

                for (const position of missingPositions) {
                    await addPosition(
                        selectedElection.id,
                        {
                            name: position.name,
                            description: position.description,
                            order: nextOrder,
                            isRequired: true,
                            yearLevelAccess: position.yearLevelAccess,
                        }
                    );

                    nextOrder += 1;
                }

                await loadPositions(
                    selectedElection.id
                );

                await loadElections();

                setSuccess(
                    `${missingPositions.length} standard position${missingPositions.length === 1 ? "" : "s"} added. All 11 VOTARA positions are now configured.`
                );

            } catch (err) {
                console.error(
                    "Add standard positions error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to add the standard VOTARA positions."
                );
            } finally {
                setSaving(false);
            }
        };


    // =====================================================
    // RESET
    // =====================================================

    const resetFilters =
        () => {

            setSearch("");
            setStatusFilter("All");
        };


    // =====================================================
    // STATUS BADGE
    // =====================================================

    const StatusBadge =
        ({
            status,
        }) => {

            const styles = {

                draft: {
                    background:
                        "#f1f5f9",
                    color:
                        "#475569",
                },

                scheduled: {
                    background:
                        "#fff7ed",
                    color:
                        "#c2410c",
                },

                open: {
                    background:
                        "#dcfce7",
                    color:
                        "#15803d",
                },

                closed: {
                    background:
                        "#ede9fe",
                    color:
                        "#6d28d9",
                },

                cancelled: {
                    background:
                        "#fee2e2",
                    color:
                        "#b91c1c",
                },
            };

            const style =
                styles[status] ||
                styles.draft;

            return (
                <span
                    style={{
                        ...style,
                        display:
                            "inline-flex",
                        alignItems:
                            "center",
                        gap: "6px",
                        padding:
                            "6px 10px",
                        borderRadius:
                            "999px",
                        fontSize:
                            "11px",
                        fontWeight:
                            700,
                    }}
                >
                    <span>
                        ●
                    </span>

                    {formatStatus(
                        status
                    )}
                </span>
            );
        };


    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div
            style={{
                minHeight:
                    "100%",
                background:
                    "#f5f7fb",
                padding:
                    "28px",
                color:
                    "#172033",
                fontFamily:
                    "Inter, Poppins, Arial, sans-serif",
            }}
        >

            {/* =================================================
                PAGE TOOLBAR
            ================================================= */}

            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "14px",
                    marginBottom: "20px",
                }}
            >
                <button
                    type="button"
                    onClick={openCreateModal}
                    style={{
                        border: "none",
                        background: "#266EFF",
                        color: "#ffffff",
                        padding: "12px 19px",
                        borderRadius: "10px",
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "0 7px 18px rgba(38,110,255,.20)",
                    }}
                >
                    + Create Election
                </button>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div
                    style={{
                        background:
                            "#fff1f2",
                        border:
                            "1px solid #fecdd3",
                        color:
                            "#be123c",
                        padding:
                            "14px 17px",
                        borderRadius:
                            "12px",
                        marginBottom:
                            "18px",
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        gap:
                            "15px",
                    }}
                >

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        style={{
                            border:
                                "none",
                            background:
                                "transparent",
                            color:
                                "inherit",
                            cursor:
                                "pointer",
                            fontWeight:
                                800,
                        }}
                    >
                        ×
                    </button>

                </div>
            )}


            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
                <div
                    style={{
                        background:
                            "#ecfdf5",
                        border:
                            "1px solid #bbf7d0",
                        color:
                            "#15803d",
                        padding:
                            "14px 17px",
                        borderRadius:
                            "12px",
                        marginBottom:
                            "18px",
                    }}
                >
                    ✓ {success}
                </div>
            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(4, minmax(0, 1fr))",
                    gap:
                        "15px",
                    marginBottom:
                        "20px",
                }}
            >

                {[
                    [
                        "Total Elections",
                        totalElections,
                        "#266EFF",
                    ],
                    [
                        "Open Elections",
                        openElections,
                        "#16A34A",
                    ],
                    [
                        "Scheduled",
                        scheduledElections,
                        "#EA580C",
                    ],
                    [
                        "Completed",
                        completedElections,
                        "#7C3AED",
                    ],
                ].map(
                    (
                        [
                            label,
                            value,
                            color,
                        ]
                    ) => (
                        <div
                            key={
                                label
                            }
                            style={{
                                background:
                                    "#ffffff",
                                border:
                                    "1px solid #e5eaf2",
                                borderRadius:
                                    "15px",
                                padding:
                                    "19px",
                            }}
                        >

                            <div
                                style={{
                                    fontSize:
                                        "11px",
                                    color:
                                        "#7b8798",
                                    marginBottom:
                                        "8px",
                                    fontWeight:
                                        700,
                                }}
                            >
                                {label}
                            </div>

                            <div
                                style={{
                                    fontSize:
                                        "27px",
                                    fontWeight:
                                        800,
                                    color,
                                }}
                            >
                                {value}
                            </div>

                        </div>
                    )
                )}

            </div>


            {/* =================================================
                ELECTION LIST
            ================================================= */}

            <div
                style={{
                    background:
                        "#ffffff",
                    border:
                        "1px solid #e5eaf2",
                    borderRadius:
                        "17px",
                    overflow:
                        "hidden",
                }}
            >

                <div
                    style={{
                        padding:
                            "20px",
                        borderBottom:
                            "1px solid #edf0f5",
                        display:
                            "flex",
                        justifyContent:
                            "space-between",
                        alignItems:
                            "center",
                        gap:
                            "15px",
                    }}
                >

                    <div>

                        <h2
                            style={{
                                margin:
                                    0,
                                fontSize:
                                    "17px",
                            }}
                        >
                            Elections
                        </h2>

                        <p
                            style={{
                                margin:
                                    "4px 0 0",
                                fontSize:
                                    "12px",
                                color:
                                    "#8490a2",
                            }}
                        >
                            View and manage
                            all VOTARA
                            elections.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={
                            loadElections
                        }
                        disabled={
                            loading
                        }
                        style={{
                            border:
                                "1px solid #d8dfeb",
                            background:
                                "#ffffff",
                            padding:
                                "9px 14px",
                            borderRadius:
                                "9px",
                            cursor:
                                "pointer",
                            fontWeight:
                                700,
                        }}
                    >
                        ↻ Refresh
                    </button>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <div
                    style={{
                        padding:
                            "16px 20px",
                        display:
                            "grid",
                        gridTemplateColumns:
                            "1fr 170px auto",
                        gap:
                            "10px",
                    }}
                >

                    <input
                        type="text"
                        placeholder="Search election name or ID..."
                        value={
                            search
                        }
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        style={{
                            width:
                                "100%",
                            boxSizing:
                                "border-box",
                            padding:
                                "11px 13px",
                            border:
                                "1px solid #d9e0eb",
                            borderRadius:
                                "9px",
                            outline:
                                "none",
                        }}
                    />


                    <select
                        value={
                            statusFilter
                        }
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        style={{
                            padding:
                                "11px 13px",
                            border:
                                "1px solid #d9e0eb",
                            borderRadius:
                                "9px",
                            background:
                                "#ffffff",
                        }}
                    >
                        <option value="All">
                            All Status
                        </option>

                        <option value="draft">
                            Draft
                        </option>

                        <option value="scheduled">
                            Scheduled
                        </option>

                        <option value="open">
                            Open
                        </option>

                        <option value="closed">
                            Completed
                        </option>

                        <option value="cancelled">
                            Cancelled
                        </option>

                    </select>


                    <button
                        type="button"
                        onClick={
                            resetFilters
                        }
                        style={{
                            border:
                                "1px solid #d9e0eb",
                            background:
                                "#ffffff",
                            borderRadius:
                                "9px",
                            padding:
                                "0 14px",
                            cursor:
                                "pointer",
                            fontWeight:
                                700,
                        }}
                    >
                        Reset
                    </button>

                </div>


                {/* =================================================
                    TABLE
                ================================================= */}

                {loading ? (

                    <div
                        style={{
                            padding:
                                "70px 20px",
                            textAlign:
                                "center",
                            color:
                                "#7b8798",
                        }}
                    >
                        Loading elections...
                    </div>

                ) : filteredElections.length ===
                  0 ? (

                    <div
                        style={{
                            padding:
                                "70px 20px",
                            textAlign:
                                "center",
                            color:
                                "#7b8798",
                        }}
                    >

                        <div
                            style={{
                                fontSize:
                                    "35px",
                                marginBottom:
                                    "10px",
                            }}
                        >
                            ◫
                        </div>

                        <strong
                            style={{
                                display:
                                    "block",
                                color:
                                    "#172033",
                                marginBottom:
                                    "5px",
                            }}
                        >
                            No elections found
                        </strong>

                        <span
                            style={{
                                fontSize:
                                    "12px",
                            }}
                        >
                            Create an election
                            or change your
                            search/filter.
                        </span>

                    </div>

                ) : (

                    <div
                        style={{
                            overflowX:
                                "auto",
                        }}
                    >

                        <table
                            style={{
                                width:
                                    "100%",
                                borderCollapse:
                                    "collapse",
                            }}
                        >

                            <thead>

                                <tr
                                    style={{
                                        background:
                                            "#f8fafc",
                                        borderTop:
                                            "1px solid #edf0f5",
                                        borderBottom:
                                            "1px solid #edf0f5",
                                    }}
                                >

                                    {[
                                        "Election",
                                        "Schedule",
                                        "Access",
                                        "Status",
                                        "Actions",
                                    ].map(
                                        (heading) => (
                                            <th
                                                key={
                                                    heading
                                                }
                                                style={{
                                                    textAlign:
                                                        "left",
                                                    padding:
                                                        "13px 15px",
                                                    fontSize:
                                                        "10px",
                                                    color:
                                                        "#748094",
                                                    letterSpacing:
                                                        ".5px",
                                                }}
                                            >
                                                {heading}
                                            </th>
                                        )
                                    )}

                                </tr>

                            </thead>


                            <tbody>

                                {filteredElections.map(
                                    (
                                        election
                                    ) => (
                                        <tr
                                            key={
                                                election.id
                                            }
                                            style={{
                                                borderBottom:
                                                    "1px solid #edf0f5",
                                            }}
                                        >

                                            <td
                                                style={{
                                                    padding:
                                                        "15px",
                                                    minWidth:
                                                        "240px",
                                                }}
                                            >

                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            "13px",
                                                    }}
                                                >
                                                    {
                                                        election.name
                                                    }
                                                </strong>

                                                <span
                                                    style={{
                                                        fontSize:
                                                            "10px",
                                                        color:
                                                            "#8a95a6",
                                                    }}
                                                >
                                                    {
                                                        election.id
                                                    }
                                                </span>

                                            </td>


                                            <td
                                                style={{
                                                    padding:
                                                        "15px",
                                                    minWidth:
                                                        "180px",
                                                }}
                                            >

                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            "12px",
                                                    }}
                                                >
                                                    {formatDate(
                                                        election.electionDate
                                                    )}
                                                </strong>

                                                <span
                                                    style={{
                                                        fontSize:
                                                            "10px",
                                                        color:
                                                            "#8490a2",
                                                    }}
                                                >
                                                    {formatTime(
                                                        election.startTime
                                                    )}{" "}
                                                    –{" "}
                                                    {formatTime(
                                                        election.endTime
                                                    )}
                                                </span>

                                            </td>


                                            <td
                                                style={{
                                                    padding:
                                                        "15px",
                                                    minWidth:
                                                        "170px",
                                                }}
                                            >

                                                {election
                                                    .yearLevelAccess
                                                    .length >
                                                0
                                                    ? election.yearLevelAccess
                                                          .map(
                                                              (
                                                                  item
                                                              ) =>
                                                                  item.year_level ||
                                                                  item
                                                          )
                                                          .join(
                                                              ", "
                                                          )
                                                    : "Not configured"}

                                            </td>


                                            <td
                                                style={{
                                                    padding:
                                                        "15px",
                                                }}
                                            >
                                                <StatusBadge
                                                    status={
                                                        election.rawStatus
                                                    }
                                                />
                                            </td>


                                            <td
                                                style={{
                                                    padding:
                                                        "15px",
                                                    textAlign:
                                                        "right",
                                                }}
                                            >

                                                <div
                                                    data-election-action-menu
                                                    style={{
                                                        position:
                                                            "relative",
                                                        display:
                                                            "inline-block",
                                                    }}
                                                >

                                                    <button
                                                        type="button"
                                                        aria-label={`Open actions for ${election.name}`}
                                                        aria-haspopup="menu"
                                                        aria-expanded={
                                                            openActionMenuId ===
                                                            election.id
                                                        }
                                                        disabled={
                                                            saving
                                                        }
                                                        onClick={(event) => {
                                                            event.stopPropagation();

                                                            const buttonRect =
                                                                event.currentTarget.getBoundingClientRect();

                                                            if (
                                                                openActionMenuId ===
                                                                election.id
                                                            ) {
                                                                setOpenActionMenuId(
                                                                    null
                                                                );
                                                                setActionMenuPosition(
                                                                    null
                                                                );
                                                                return;
                                                            }

                                                            const menuWidth =
                                                                210;

                                                            // Estimate the actual menu height from the actions
                                                            // available for this election. The previous fixed
                                                            // 310px height made short menus (such as View + Delete)
                                                            // incorrectly jump all the way toward the top of the
                                                            // viewport.
                                                            const actionItemCount =
                                                                2 +
                                                                (
                                                                    election.rawStatus ===
                                                                        "draft"
                                                                        ? 2
                                                                        : election.rawStatus ===
                                                                            "scheduled"
                                                                            ? 3
                                                                            : election.rawStatus ===
                                                                                "open"
                                                                                ? 1
                                                                                : 0
                                                                );

                                                            const menuHeight =
                                                                actionItemCount *
                                                                    34 +
                                                                42;

                                                            const gap =
                                                                7;
                                                            const viewportPadding =
                                                                10;

                                                            let left =
                                                                buttonRect.right -
                                                                menuWidth;

                                                            let top =
                                                                buttonRect.bottom +
                                                                gap;

                                                            // Keep the complete menu inside the viewport.
                                                            if (
                                                                left <
                                                                viewportPadding
                                                            ) {
                                                                left =
                                                                    viewportPadding;
                                                            }

                                                            if (
                                                                left +
                                                                    menuWidth >
                                                                window.innerWidth -
                                                                    viewportPadding
                                                            ) {
                                                                left =
                                                                    window.innerWidth -
                                                                    menuWidth -
                                                                    viewportPadding;
                                                            }

                                                            // If there is not enough room below the button,
                                                            // open the menu above it instead.
                                                            if (
                                                                top +
                                                                    menuHeight >
                                                                window.innerHeight -
                                                                    viewportPadding
                                                            ) {
                                                                top =
                                                                    buttonRect.top -
                                                                    menuHeight -
                                                                    gap;
                                                            }

                                                            if (
                                                                top <
                                                                viewportPadding
                                                            ) {
                                                                top =
                                                                    viewportPadding;
                                                            }

                                                            setActionMenuPosition({
                                                                top,
                                                                left,
                                                            });

                                                            setOpenActionMenuId(
                                                                election.id
                                                            );
                                                        }}
                                                        style={{
                                                            width:
                                                                "38px",
                                                            height:
                                                                "38px",
                                                            border:
                                                                "1px solid #d9e0eb",
                                                            background:
                                                                openActionMenuId ===
                                                                election.id
                                                                    ? "#eef4ff"
                                                                    : "#ffffff",
                                                            color:
                                                                "#344054",
                                                            borderRadius:
                                                                "9px",
                                                            cursor:
                                                                saving
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                            fontSize:
                                                                "22px",
                                                            lineHeight:
                                                                1,
                                                            fontWeight:
                                                                800,
                                                            letterSpacing:
                                                                "2px",
                                                            padding:
                                                                "0 0 5px",
                                                            opacity:
                                                                saving
                                                                    ? 0.6
                                                                    : 1,
                                                        }}
                                                    >
                                                        ⋯
                                                    </button>


                                                    {openActionMenuId ===
                                                        election.id && (
                                                        <div
                                                            role="menu"
                                                            style={{
                                                                position:
                                                                    "fixed",
                                                                top:
                                                                    actionMenuPosition?.top ??
                                                                    10,
                                                                left:
                                                                    actionMenuPosition?.left ??
                                                                    10,
                                                                width:
                                                                    "210px",
                                                                maxHeight:
                                                                    "calc(100vh - 20px)",
                                                                overflow:
                                                                    "visible",
                                                                background:
                                                                    "#ffffff",
                                                                border:
                                                                    "1px solid #e2e8f0",
                                                                borderRadius:
                                                                    "11px",
                                                                boxShadow:
                                                                    "0 14px 35px rgba(15,23,42,.16)",
                                                                padding:
                                                                    "6px",
                                                                zIndex:
                                                                    1000,
                                                            }}
                                                        >

                                                            {/* VIEW */}
                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                onClick={() => {
                                                                    setOpenActionMenuId(
                                                                        null
                                                                    );
                                                                    setActionMenuPosition(
                                                                        null
                                                                    );
                                                                    openElectionDetails(
                                                                        election
                                                                    );
                                                                }}
                                                                style={{
                                                                    ...electionMenuItemStyle,
                                                                    color:
                                                                        "#266EFF",
                                                                }}
                                                            >
                                                                <span>
                                                                    View
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        color:
                                                                            "#94a3b8",
                                                                    }}
                                                                >
                                                                    ›
                                                                </span>
                                                            </button>


                                                            {/* EDIT */}
                                                            {(
                                                                election.rawStatus ===
                                                                    "draft" ||
                                                                election.rawStatus ===
                                                                    "scheduled"
                                                            ) && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    onClick={() => {
                                                                        setOpenActionMenuId(
                                                                            null
                                                                        );
                                                                    setActionMenuPosition(
                                                                        null
                                                                    );
                                                                        openEditModal(
                                                                            election
                                                                        );
                                                                    }}
                                                                    style={
                                                                        electionMenuItemStyle
                                                                    }
                                                                >
                                                                    <span>
                                                                        Edit
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                "#94a3b8",
                                                                        }}
                                                                    >
                                                                        ›
                                                                    </span>
                                                                </button>
                                                            )}


                                                            {/* PUBLISH */}
                                                            {election.rawStatus ===
                                                                "draft" && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                    onClick={() => {
                                                                        setOpenActionMenuId(
                                                                            null
                                                                        );
                                                                    setActionMenuPosition(
                                                                        null
                                                                    );
                                                                        requestPublish(
                                                                            election
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        ...electionMenuItemStyle,
                                                                        color:
                                                                            "#266EFF",
                                                                        opacity:
                                                                            saving
                                                                                ? 0.55
                                                                                : 1,
                                                                        cursor:
                                                                            saving
                                                                                ? "not-allowed"
                                                                                : "pointer",
                                                                    }}
                                                                >
                                                                    <span>
                                                                        Publish
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                "#94a3b8",
                                                                        }}
                                                                    >
                                                                        ›
                                                                    </span>
                                                                </button>
                                                            )}


                                                            {/* OPEN ELECTION */}
                                                            {election.rawStatus ===
                                                                "scheduled" && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                    onClick={() => {
                                                                        setOpenActionMenuId(
                                                                            null
                                                                        );
                                                                    setActionMenuPosition(
                                                                        null
                                                                    );
                                                                        requestStatusChange(
                                                                            election,
                                                                            "open"
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        ...electionMenuItemStyle,
                                                                        color:
                                                                            "#16A34A",
                                                                        opacity:
                                                                            saving
                                                                                ? 0.55
                                                                                : 1,
                                                                        cursor:
                                                                            saving
                                                                                ? "not-allowed"
                                                                                : "pointer",
                                                                    }}
                                                                >
                                                                    <span>
                                                                        Open Election
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                "#94a3b8",
                                                                        }}
                                                                    >
                                                                        ›
                                                                    </span>
                                                                </button>
                                                            )}


                                                            {/* CANCEL PUBLISH */}
                                                            {election.rawStatus ===
                                                                "scheduled" && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                    onClick={() => {
                                                                        setOpenActionMenuId(
                                                                            null
                                                                        );
                                                                    setActionMenuPosition(
                                                                        null
                                                                    );
                                                                        requestUnpublish(
                                                                            election
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        ...electionMenuItemStyle,
                                                                        color:
                                                                            "#DC2626",
                                                                        opacity:
                                                                            saving
                                                                                ? 0.55
                                                                                : 1,
                                                                        cursor:
                                                                            saving
                                                                                ? "not-allowed"
                                                                                : "pointer",
                                                                    }}
                                                                >
                                                                    <span>
                                                                        Cancel Publish
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                "#94a3b8",
                                                                        }}
                                                                    >
                                                                        ›
                                                                    </span>
                                                                </button>
                                                            )}


                                                            {/* CLOSE ELECTION */}
                                                            {election.rawStatus ===
                                                                "open" && (
                                                                <button
                                                                    type="button"
                                                                    role="menuitem"
                                                                    disabled={
                                                                        saving
                                                                    }
                                                                    onClick={() => {
                                                                        setOpenActionMenuId(
                                                                            null
                                                                        );
                                                                    setActionMenuPosition(
                                                                        null
                                                                    );
                                                                        requestStatusChange(
                                                                            election,
                                                                            "closed"
                                                                        );
                                                                    }}
                                                                    style={{
                                                                        ...electionMenuItemStyle,
                                                                        color:
                                                                            "#7C3AED",
                                                                        opacity:
                                                                            saving
                                                                                ? 0.55
                                                                                : 1,
                                                                        cursor:
                                                                            saving
                                                                                ? "not-allowed"
                                                                                : "pointer",
                                                                    }}
                                                                >
                                                                    <span>
                                                                        Close Election
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            color:
                                                                                "#94a3b8",
                                                                        }}
                                                                    >
                                                                        ›
                                                                    </span>
                                                                </button>
                                                            )}


                                                            {/* DELETE */}
                                                            <div
                                                                style={{
                                                                    height:
                                                                        "1px",
                                                                    background:
                                                                        "#edf0f5",
                                                                    margin:
                                                                        "5px 4px",
                                                                }}
                                                            />

                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                disabled={
                                                                    saving
                                                                }
                                                                onClick={() => {
                                                                    setOpenActionMenuId(
                                                                        null
                                                                    );
                                                                    setActionMenuPosition(
                                                                        null
                                                                    );
                                                                    requestDeleteElection(
                                                                        election
                                                                    );
                                                                }}
                                                                style={{
                                                                    ...electionMenuItemStyle,
                                                                    color:
                                                                        "#dc2626",
                                                                    opacity:
                                                                        saving
                                                                            ? 0.55
                                                                            : 1,
                                                                    cursor:
                                                                        saving
                                                                            ? "not-allowed"
                                                                            : "pointer",
                                                                }}
                                                                title="Permanently delete this election"
                                                            >
                                                                <span>
                                                                    Delete
                                                                </span>
                                                                <span
                                                                    style={{
                                                                        color:
                                                                            "#f87171",
                                                                    }}
                                                                >
                                                                    ›
                                                                </span>
                                                            </button>

                                                        </div>
                                                    )}

                                                </div>

                                            </td>

                                        </tr>
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}


                <div
                    style={{
                        padding:
                            "13px 20px",
                        color:
                            "#8490a2",
                        fontSize:
                            "11px",
                        borderTop:
                            "1px solid #edf0f5",
                    }}
                >
                    Showing{" "}
                    <strong>
                        {
                            filteredElections.length
                        }
                    </strong>{" "}
                    of{" "}
                    <strong>
                        {elections.length}
                    </strong>{" "}
                    elections
                </div>

            </div>


            {/* =================================================
                CREATE MODAL
            ================================================= */}

            {showCreateModal && (

                <ModalOverlay>

                    <ModalCard
                        title="Create Election"
                        subtitle="Set up a new VOTARA election."
                        onClose={
                            closeCreateModal
                        }
                    >

                        <form
                            onSubmit={
                                handleCreateElection
                            }
                        >

                            <FormField
                                label="Election Title"
                                required
                            >
                                <input
                                    name="title"
                                    value={
                                        createForm.title
                                    }
                                    onChange={
                                        handleCreateChange
                                    }
                                    placeholder="e.g. Student Election Council 2026"
                                    style={
                                        inputStyle
                                    }
                                />
                            </FormField>


                            <FormField
                                label="Description"
                            >
                                <textarea
                                    name="description"
                                    value={
                                        createForm.description
                                    }
                                    onChange={
                                        handleCreateChange
                                    }
                                    placeholder="Describe the purpose of this election..."
                                    rows="3"
                                    style={{
                                        ...inputStyle,
                                        resize:
                                            "vertical",
                                    }}
                                />
                            </FormField>


                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "1fr 1fr 1fr",
                                    gap:
                                        "12px",
                                }}
                            >

                                <FormField
                                    label="Election Date"
                                    required
                                >
                                    <input
                                        type="date"
                                        name="electionDate"
                                        value={
                                            createForm.electionDate
                                        }
                                        onChange={
                                            handleCreateChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                    />
                                </FormField>


                                <FormField
                                    label="Start Time"
                                    required
                                >
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={
                                            createForm.startTime
                                        }
                                        onChange={
                                            handleCreateChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                    />
                                </FormField>


                                <FormField
                                    label="End Time"
                                    required
                                >
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={
                                            createForm.endTime
                                        }
                                        onChange={
                                            handleCreateChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                    />
                                </FormField>

                            </div>


                            <FormField
                                label="Eligible Year Levels"
                            >

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap:
                                            "8px",
                                        flexWrap:
                                            "wrap",
                                    }}
                                >

                                    {YEAR_LEVELS.map(
                                        (
                                            year
                                        ) => {

                                            const active =
                                                createForm.yearLevelAccess.includes(
                                                    year
                                                );

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        year
                                                    }
                                                    onClick={() =>
                                                        toggleCreateYearLevel(
                                                            year
                                                        )
                                                    }
                                                    style={{
                                                        ...yearButtonStyle,
                                                        background:
                                                            active
                                                                ? "#266EFF"
                                                                : "#ffffff",
                                                        color:
                                                            active
                                                                ? "#ffffff"
                                                                : "#344054",
                                                        borderColor:
                                                            active
                                                                ? "#266EFF"
                                                                : "#d9e0eb",
                                                    }}
                                                >
                                                    {active
                                                        ? "✓ "
                                                        : ""}
                                                    {year}
                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                                <small
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "8px",
                                        color:
                                            "#7b8798",
                                    }}
                                >
                                    1st Year students do not use a general year-level representative. Their section president serves as the section representative.
                                </small>

                            </FormField>


                            <div
                                style={{
                                    background:
                                        "#f8faff",
                                    border:
                                        "1px solid #e4eaf5",
                                    padding:
                                        "12px 14px",
                                    borderRadius:
                                        "10px",
                                    marginTop:
                                        "15px",
                                    fontSize:
                                        "12px",
                                    color:
                                        "#516074",
                                }}
                            >
                                <strong
                                    style={{
                                        color:
                                            "#172033",
                                    }}
                                >
                                    Election starts as Draft
                                </strong>

                                <br />

                                After configuration,
                                the EB can publish
                                the election to move
                                it to Scheduled.
                            </div>


                            <ModalActions>

                                <button
                                    type="button"
                                    onClick={
                                        closeCreateModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={
                                        secondaryButtonStyle
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    style={
                                        primaryButtonStyle
                                    }
                                >
                                    {saving
                                        ? "Creating..."
                                        : "Create Election"}
                                </button>

                            </ModalActions>

                        </form>

                    </ModalCard>

                </ModalOverlay>
            )}


            {/* =================================================
                EDIT MODAL
            ================================================= */}

            {showEditModal && (

                <ModalOverlay>

                    <ModalCard
                        title="Edit Election"
                        subtitle="Update the election configuration before voting begins."
                        onClose={
                            closeEditModal
                        }
                    >

                        <form
                            onSubmit={
                                handleSaveEdit
                            }
                        >

                            {error && (
                                <div
                                    style={{
                                        background: "#fff1f2",
                                        border: "1px solid #fecdd3",
                                        color: "#be123c",
                                        padding: "11px 13px",
                                        borderRadius: "9px",
                                        marginBottom: "15px",
                                        fontSize: "12px",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {error}
                                </div>
                            )}

                            <FormField
                                label="Election Title"
                                required
                            >
                                <input
                                    name="title"
                                    value={
                                        editForm.title
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    style={
                                        inputStyle
                                    }
                                />
                            </FormField>


                            <FormField
                                label="Description"
                            >
                                <textarea
                                    name="description"
                                    value={
                                        editForm.description
                                    }
                                    onChange={
                                        handleEditChange
                                    }
                                    rows="3"
                                    style={{
                                        ...inputStyle,
                                        resize:
                                            "vertical",
                                    }}
                                />
                            </FormField>


                            <div
                                style={{
                                    display:
                                        "grid",
                                    gridTemplateColumns:
                                        "1fr 1fr 1fr",
                                    gap:
                                        "12px",
                                }}
                            >

                                <FormField
                                    label="Election Date"
                                    required
                                >
                                    <input
                                        type="date"
                                        name="electionDate"
                                        value={
                                            editForm.electionDate
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        required
                                        style={
                                            inputStyle
                                        }
                                    />
                                </FormField>


                                <FormField
                                    label="Start Time"
                                >
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={
                                            editForm.startTime
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                    />
                                </FormField>


                                <FormField
                                    label="End Time"
                                >
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={
                                            editForm.endTime
                                        }
                                        onChange={
                                            handleEditChange
                                        }
                                        style={
                                            inputStyle
                                        }
                                    />
                                </FormField>

                            </div>


                            <FormField
                                label="Eligible Year Levels"
                            >

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap:
                                            "8px",
                                        flexWrap:
                                            "wrap",
                                    }}
                                >

                                    {YEAR_LEVELS.map(
                                        (
                                            year
                                        ) => {

                                            const active =
                                                editForm.yearLevelAccess.includes(
                                                    year
                                                );

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        year
                                                    }
                                                    onClick={() =>
                                                        toggleEditYearLevel(
                                                            year
                                                        )
                                                    }
                                                    style={{
                                                        ...yearButtonStyle,
                                                        background:
                                                            active
                                                                ? "#266EFF"
                                                                : "#ffffff",
                                                        color:
                                                            active
                                                                ? "#ffffff"
                                                                : "#344054",
                                                        borderColor:
                                                            active
                                                                ? "#266EFF"
                                                                : "#d9e0eb",
                                                    }}
                                                >
                                                    {active
                                                        ? "✓ "
                                                        : ""}
                                                    {year}
                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                            </FormField>


                            <ModalActions>

                                <button
                                    type="button"
                                    onClick={
                                        closeEditModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={
                                        secondaryButtonStyle
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    style={{
                                        ...primaryButtonStyle,
                                        opacity:
                                            saving
                                                ? 0.6
                                                : 1,
                                        cursor:
                                            saving
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                            </ModalActions>

                        </form>

                    </ModalCard>

                </ModalOverlay>
            )}


            {/* =================================================
                ELECTION DETAILS MODAL
            ================================================= */}

            {selectedElection && (

                <ModalOverlay>

                    <ModalCard
                        wide
                        title={
                            selectedElection.name
                        }
                        subtitle="Election details and configuration"
                        onClose={
                            closeDetails
                        }
                    >

                        {/* STATUS */}

                        <div
                            style={{
                                background:
                                    "#f8fafc",
                                border:
                                    "1px solid #e5eaf2",
                                borderRadius:
                                    "12px",
                                padding:
                                    "14px",
                                marginBottom:
                                    "16px",
                                display:
                                    "flex",
                                justifyContent:
                                    "space-between",
                                alignItems:
                                    "center",
                            }}
                        >

                            <div>

                                <div
                                    style={{
                                        fontSize:
                                            "10px",
                                        color:
                                            "#8490a2",
                                        marginBottom:
                                            "4px",
                                        fontWeight:
                                            700,
                                    }}
                                >
                                    CURRENT STATUS
                                </div>

                                <StatusBadge
                                    status={
                                        selectedElection.rawStatus
                                    }
                                />

                            </div>


                            <div
                                style={{
                                    fontSize:
                                        "11px",
                                    color:
                                        "#8490a2",
                                }}
                            >
                                Published:{" "}
                                <strong>
                                    {
                                        selectedElection.isPublished
                                            ? "Yes"
                                            : "No"
                                    }
                                </strong>
                            </div>

                        </div>


                        {/* BASIC INFO */}

                        <div
                            style={{
                                display:
                                    "grid",
                                gridTemplateColumns:
                                    "repeat(3, minmax(0, 1fr))",
                                gap:
                                    "12px",
                                marginBottom:
                                    "18px",
                            }}
                        >

                            <InfoBox
                                label="Election Date"
                                value={
                                    formatDate(
                                        selectedElection.electionDate
                                    )
                                }
                            />

                            <InfoBox
                                label="Voting Time"
                                value={`${formatTime(
                                    selectedElection.startTime
                                )} – ${formatTime(
                                    selectedElection.endTime
                                )}`}
                            />

                            <InfoBox
                                label="Eligible Year Levels"
                                value={
                                    selectedElection
                                        .yearLevelAccess
                                        .map(
                                            (
                                                item
                                            ) =>
                                                item.year_level ||
                                                item
                                        )
                                        .join(
                                            ", "
                                        ) ||
                                    "Not configured"
                                }
                            />

                        </div>


                        {/* DESCRIPTION */}

                        {selectedElection.description && (
                            <div
                                style={{
                                    marginBottom:
                                        "18px",
                                }}
                            >

                                <h3
                                    style={{
                                        margin:
                                            "0 0 7px",
                                        fontSize:
                                            "14px",
                                    }}
                                >
                                    Description
                                </h3>

                                <div
                                    style={{
                                        padding:
                                            "12px 14px",
                                        background:
                                            "#f8fafc",
                                        borderRadius:
                                            "10px",
                                        color:
                                            "#596579",
                                        fontSize:
                                            "12px",
                                        lineHeight:
                                            1.6,
                                    }}
                                >
                                    {
                                        selectedElection.description
                                    }
                                </div>

                            </div>
                        )}


                        {/* POSITIONS */}

                        <div
                            style={{
                                borderTop:
                                    "1px solid #edf0f5",
                                paddingTop:
                                    "18px",
                            }}
                        >

                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    marginBottom:
                                        "12px",
                                }}
                            >

                                <div>

                                    <h3
                                        style={{
                                            margin:
                                                0,
                                            fontSize:
                                                "15px",
                                        }}
                                    >
                                        Election Positions
                                    </h3>

                                    <span
                                        style={{
                                            color:
                                                "#8490a2",
                                            fontSize:
                                                "11px",
                                        }}
                                    >
                                        Configure the
                                        positions students
                                        will vote for.
                                    </span>

                                </div>


                                <button
                                    type="button"
                                    onClick={
                                        openPositionModal
                                    }
                                    disabled={
                                        selectedElection.rawStatus ===
                                            "open" ||
                                        selectedElection.rawStatus ===
                                            "closed" ||
                                        selectedElection.rawStatus ===
                                            "cancelled"
                                    }
                                    style={{
                                        ...primaryButtonStyle,
                                        padding:
                                            "9px 13px",
                                        opacity:
                                            selectedElection.rawStatus ===
                                                "open" ||
                                            selectedElection.rawStatus ===
                                                "closed" ||
                                            selectedElection.rawStatus ===
                                                "cancelled"
                                                ? 0.5
                                                : 1,
                                    }}
                                >
                                    + Add Position
                                </button>

                            </div>


                            {loadingPositions ? (

                                <div
                                    style={{
                                        padding:
                                            "30px",
                                        textAlign:
                                            "center",
                                        color:
                                            "#8490a2",
                                    }}
                                >
                                    Loading positions...
                                </div>

                            ) : positions.length ===
                              0 ? (

                                <div
                                    style={{
                                        padding:
                                            "25px",
                                        textAlign:
                                            "center",
                                        background:
                                            "#f8fafc",
                                        border:
                                            "1px dashed #d8e0ec",
                                        borderRadius:
                                            "10px",
                                        color:
                                            "#8490a2",
                                        fontSize:
                                            "12px",
                                    }}
                                >
                                    No positions
                                    configured yet.
                                    Click{" "}
                                    <strong>
                                        + Add Position
                                    </strong>{" "}
                                    to configure
                                    the ballot.
                                </div>

                            ) : (

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        flexDirection:
                                            "column",
                                        gap:
                                            "9px",
                                    }}
                                >

                                    {positions.map(
                                        (
                                            position
                                        ) => (

                                            <div
                                                key={
                                                    position.id
                                                }
                                                style={{
                                                    border:
                                                        "1px solid #e3e8f0",
                                                    borderRadius:
                                                        "10px",
                                                    padding:
                                                        "13px 14px",
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    gap:
                                                        "15px",
                                                }}
                                            >

                                                <div>

                                                    <strong
                                                        style={{
                                                            display:
                                                                "block",
                                                            fontSize:
                                                                "13px",
                                                        }}
                                                    >
                                                        {
                                                            position.name
                                                        }
                                                    </strong>

                                                    {position.description && (
                                                        <span
                                                            style={{
                                                                display:
                                                                    "block",
                                                                color:
                                                                    "#8490a2",
                                                                fontSize:
                                                                    "11px",
                                                                marginTop:
                                                                    "3px",
                                                            }}
                                                        >
                                                            {
                                                                position.description
                                                            }
                                                        </span>
                                                    )}

                                                </div>


                                                <div
                                                    style={{
                                                        fontSize:
                                                            "10px",
                                                        color:
                                                            "#667085",
                                                        textAlign:
                                                            "right",
                                                    }}
                                                >

                                                    {position
                                                        .position_year_levels
                                                        ?.map(
                                                            (
                                                                item
                                                            ) =>
                                                                item.year_level
                                                        )
                                                        .join(
                                                            ", "
                                                        ) ||
                                                        "All configured levels"}

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>


                        {/* ACTIONS */}

                        <div
                            style={{
                                position:
                                    "sticky",
                                bottom:
                                    0,
                                marginTop:
                                    "20px",
                                padding:
                                    "14px 0 2px",
                                borderTop:
                                    "1px solid #edf0f5",
                                background:
                                    "#ffffff",
                                display:
                                    "flex",
                                gap:
                                    "8px",
                                flexWrap:
                                    "wrap",
                                justifyContent:
                                    "flex-end",
                                zIndex:
                                    5,
                            }}
                        >

                            <button
                                type="button"
                                onClick={() =>
                                    requestDeleteElection(
                                        selectedElection
                                    )
                                }
                                disabled={
                                    saving
                                }
                                style={{
                                    ...secondaryButtonStyle,
                                    color:
                                        "#dc2626",
                                    borderColor:
                                        "#fecaca",
                                    background:
                                        "#fff7f7",
                                    marginRight:
                                        "auto",
                                }}
                            >
                                Delete Election
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    openCandidateManagement(
                                        selectedElection
                                    )
                                }
                                style={{
                                    ...secondaryButtonStyle,
                                    color: "#266EFF",
                                    borderColor: "#bfdbfe",
                                    background: "#f8fbff",
                                }}
                            >
                                Manage Candidates
                            </button>


                            {selectedElection.rawStatus ===
                                "open" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        requestStatusChange(
                                            selectedElection,
                                            "closed"
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={{
                                        ...primaryButtonStyle,
                                        background:
                                            "#7c3aed",
                                    }}
                                >
                                    Close Election
                                </button>
                            )}


                            {selectedElection.rawStatus ===
                                "scheduled" && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        requestUnpublish(
                                            selectedElection
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={{
                                        ...secondaryButtonStyle,
                                        color:
                                            "#b91c1c",
                                        borderColor:
                                            "#fecaca",
                                    }}
                                >
                                    Cancel Publish
                                </button>
                            )}

                        </div>

                    </ModalCard>

                </ModalOverlay>
            )}


            {/* =================================================
                ADD POSITION MODAL
            ================================================= */}

            {showPositionModal && (

                <ModalOverlay>

                    <ModalCard
                        title="Add Election Position"
                        subtitle={`Configure one of the 11 standard VOTARA positions for ${selectedElection?.name || "this election"}.`}
                        onClose={
                            closePositionModal
                        }
                    >

                        {/* PRESETS */}

                        <div
                            style={{
                                background:
                                    "#f8faff",
                                border:
                                    "1px solid #e2e9f5",
                                borderRadius:
                                    "10px",
                                padding:
                                    "13px",
                                marginBottom:
                                    "17px",
                            }}
                        >

                            <strong
                                style={{
                                    fontSize:
                                        "12px",
                                }}
                            >
                                Standard VOTARA Positions
                            </strong>

                            <div
                                style={{
                                    display:
                                        "flex",
                                    flexWrap:
                                        "wrap",
                                    gap:
                                        "7px",
                                    marginTop:
                                        "9px",
                                }}
                            >

                                {STANDARD_POSITION_PRESETS.map(
                                    (preset) => (
                                        <button
                                            type="button"
                                            key={preset.name}
                                            onClick={() =>
                                                applyPositionPreset(
                                                    preset.name
                                                )
                                            }
                                            style={{
                                                padding: "7px 9px",
                                                border: "1px solid #d5deec",
                                                background: "#ffffff",
                                                borderRadius: "7px",
                                                cursor: "pointer",
                                                fontSize: "10px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {preset.name}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={handleAddAllStandardPositions}
                                    disabled={saving}
                                    style={{
                                        padding: "8px 11px",
                                        border: "1px solid #266EFF",
                                        background: "#266EFF",
                                        color: "#ffffff",
                                        borderRadius: "7px",
                                        cursor: saving ? "not-allowed" : "pointer",
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        opacity: saving ? 0.6 : 1,
                                        flexBasis: "100%",
                                        marginTop: "2px",
                                    }}
                                >
                                    {saving
                                        ? "Adding Standard Positions..."
                                        : "＋ Fill All 11 Standard Positions"}
                                </button>

                            </div>

                        </div>


                        <form
                            onSubmit={
                                handleAddPosition
                            }
                        >

                            <FormField
                                label="Position Name"
                                required
                            >
                                <input
                                    name="name"
                                    value={
                                        positionForm.name
                                    }
                                    onChange={
                                        handlePositionChange
                                    }
                                    placeholder="e.g. President"
                                    style={
                                        inputStyle
                                    }
                                />
                            </FormField>


                            <FormField
                                label="Position Description"
                            >
                                <textarea
                                    name="description"
                                    value={
                                        positionForm.description
                                    }
                                    onChange={
                                        handlePositionChange
                                    }
                                    placeholder="Describe the responsibility of this position..."
                                    rows="3"
                                    style={{
                                        ...inputStyle,
                                        resize:
                                            "vertical",
                                    }}
                                />
                            </FormField>


                            <FormField
                                label="Position Access"
                                required
                            >

                                <div
                                    style={{
                                        display:
                                            "flex",
                                        gap:
                                            "8px",
                                        flexWrap:
                                            "wrap",
                                    }}
                                >

                                    {YEAR_LEVELS.map(
                                        (
                                            year
                                        ) => {

                                            const active =
                                                positionForm.yearLevelAccess.includes(
                                                    year
                                                );

                                            return (
                                                <button
                                                    type="button"
                                                    key={
                                                        year
                                                    }
                                                    onClick={() =>
                                                        togglePositionYearLevel(
                                                            year
                                                        )
                                                    }
                                                    style={{
                                                        ...yearButtonStyle,
                                                        background:
                                                            active
                                                                ? "#266EFF"
                                                                : "#ffffff",
                                                        color:
                                                            active
                                                                ? "#ffffff"
                                                                : "#344054",
                                                        borderColor:
                                                            active
                                                                ? "#266EFF"
                                                                : "#d9e0eb",
                                                    }}
                                                >
                                                    {active
                                                        ? "✓ "
                                                        : ""}
                                                    {year}
                                                </button>
                                            );
                                        }
                                    )}

                                </div>

                                <small
                                    style={{
                                        display:
                                            "block",
                                        marginTop:
                                            "8px",
                                        color:
                                            "#7b8798",
                                    }}
                                >
                                    1st Year is
                                    intentionally
                                    excluded from
                                    VOTARA
                                    representative
                                    voting.
                                </small>

                            </FormField>


                            <label
                                style={{
                                    display:
                                        "flex",
                                    alignItems:
                                        "center",
                                    gap:
                                        "8px",
                                    fontSize:
                                        "12px",
                                    marginTop:
                                        "8px",
                                    cursor:
                                        "pointer",
                                }}
                            >

                                <input
                                    type="checkbox"
                                    checked={
                                        positionForm.isRequired
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setPositionForm(
                                            (
                                                current
                                            ) => ({
                                                ...current,
                                                isRequired:
                                                    event
                                                        .target
                                                        .checked,
                                            })
                                        )
                                    }
                                />

                                Required position

                            </label>


                            <ModalActions>

                                <button
                                    type="button"
                                    onClick={
                                        closePositionModal
                                    }
                                    disabled={
                                        saving
                                    }
                                    style={
                                        secondaryButtonStyle
                                    }
                                >
                                    Cancel
                                </button>


                                <button
                                    type="submit"
                                    disabled={
                                        saving
                                    }
                                    style={
                                        primaryButtonStyle
                                    }
                                >
                                    {saving
                                        ? "Adding..."
                                        : "Add Position"}
                                </button>

                            </ModalActions>

                        </form>

                    </ModalCard>

                </ModalOverlay>
            )}


            {/* =================================================
                CENTER CONFIRMATION MODAL
            ================================================= */}

            {showConfirmModal && (

                <ModalOverlay>

                    <div
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        style={{
                            width:
                                "min(460px, calc(100vw - 30px))",
                            background:
                                "#ffffff",
                            borderRadius:
                                "18px",
                            boxShadow:
                                "0 25px 70px rgba(15,23,42,.28)",
                            padding:
                                "27px",
                            textAlign:
                                "center",
                        }}
                    >

                        <div
                            style={{
                                width:
                                    "54px",
                                height:
                                    "54px",
                                borderRadius:
                                    "50%",
                                margin:
                                    "0 auto 15px",
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                                background:
                                    confirmation.danger
                                        ? "#fee2e2"
                                        : "#eaf1ff",
                                color:
                                    confirmation.danger
                                        ? "#dc2626"
                                        : "#266EFF",
                                fontSize:
                                    "23px",
                                fontWeight:
                                    800,
                            }}
                        >
                            {confirmation.danger
                                ? "!"
                                : "?"}
                        </div>


                        <h2
                            style={{
                                margin:
                                    "0 0 8px",
                                fontSize:
                                    "19px",
                            }}
                        >
                            {
                                confirmation.title
                            }
                        </h2>


                        <p
                            style={{
                                margin:
                                    "0 auto",
                                maxWidth:
                                    "370px",
                                color:
                                    "#667085",
                                fontSize:
                                    "13px",
                                lineHeight:
                                    1.6,
                            }}
                        >
                            {
                                confirmation.message
                            }
                        </p>


                        <div
                            style={{
                                display:
                                    "flex",
                                justifyContent:
                                    "center",
                                gap:
                                    "9px",
                                marginTop:
                                    "23px",
                            }}
                        >

                            <button
                                type="button"
                                onClick={
                                    closeConfirmation
                                }
                                disabled={
                                    saving
                                }
                                style={
                                    secondaryButtonStyle
                                }
                            >
                                No, Cancel
                            </button>


                            <button
                                type="button"
                                onClick={
                                    executeConfirmation
                                }
                                disabled={
                                    saving
                                }
                                style={{
                                    ...primaryButtonStyle,
                                    background:
                                        confirmation.danger
                                            ? "#dc2626"
                                            : "#266EFF",
                                }}
                            >
                                {saving
                                    ? "Processing..."
                                    : confirmation.actionLabel}
                            </button>

                        </div>

                    </div>

                </ModalOverlay>
            )}

        </div>
    );
}


// =========================================================
// REUSABLE UI COMPONENTS
// =========================================================

const ModalOverlay = ({
    children,
}) => {

    return (
        <div
            onClick={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    // Intentionally do nothing.
                    // Modal closes through its
                    // own close button.
                }
            }}
            style={{
                position:
                    "fixed",
                inset:
                    0,
                zIndex:
                    9999,
                background:
                    "rgba(15,23,42,.58)",
                backdropFilter:
                    "blur(5px)",
                display:
                    "flex",
                alignItems:
                    "center",
                justifyContent:
                    "center",
                padding:
                    "18px",
            }}
        >
            {children}
        </div>
    );
};


const ModalCard = ({
    children,
    title,
    subtitle,
    onClose,
    wide = false,
}) => {

    return (
        <div
            onClick={(event) =>
                event.stopPropagation()
            }
            style={{
                width:
                    wide
                        ? "min(850px, calc(100vw - 30px))"
                        : "min(650px, calc(100vw - 30px))",
                maxHeight:
                    "90vh",
                overflowY:
                    "auto",
                background:
                    "#ffffff",
                borderRadius:
                    "18px",
                boxShadow:
                    "0 25px 70px rgba(15,23,42,.28)",
            }}
        >

            <div
                style={{
                    padding:
                        "21px 24px",
                    borderBottom:
                        "1px solid #edf0f5",
                    display:
                        "flex",
                    justifyContent:
                        "space-between",
                    alignItems:
                        "flex-start",
                    gap:
                        "15px",
                }}
            >

                <div>

                    <div
                        style={{
                            color:
                                "#266EFF",
                            fontSize:
                                "9px",
                            fontWeight:
                                800,
                            letterSpacing:
                                "1.4px",
                            marginBottom:
                                "5px",
                        }}
                    >
                        VOTARA ELECTION
                    </div>

                    <h2
                        style={{
                            margin:
                                0,
                            fontSize:
                                "19px",
                        }}
                    >
                        {title}
                    </h2>

                    {subtitle && (
                        <p
                            style={{
                                margin:
                                    "5px 0 0",
                                color:
                                    "#8490a2",
                                fontSize:
                                    "11px",
                            }}
                        >
                            {subtitle}
                        </p>
                    )}

                </div>


                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    style={{
                        border:
                            "none",
                        background:
                            "#f1f5f9",
                        width:
                            "32px",
                        height:
                            "32px",
                        borderRadius:
                            "9px",
                        cursor:
                            "pointer",
                        fontSize:
                            "18px",
                        color:
                            "#64748b",
                    }}
                >
                    ×
                </button>

            </div>


            <div
                style={{
                    padding:
                        "22px 24px 24px",
                }}
            >
                {children}
            </div>

        </div>
    );
};


const FormField = ({
    label,
    children,
    required = false,
}) => {

    return (
        <div
            style={{
                marginBottom:
                    "15px",
            }}
        >

            <label
                style={{
                    display:
                        "block",
                    marginBottom:
                        "7px",
                    fontSize:
                        "11px",
                    fontWeight:
                        800,
                    color:
                        "#344054",
                }}
            >
                {label}
                {required && (
                    <span
                        style={{
                            color:
                                "#dc2626",
                        }}
                    >
                        {" "}*
                    </span>
                )}
            </label>

            {children}

        </div>
    );
};


const InfoBox = ({
    label,
    value,
}) => {

    return (
        <div
            style={{
                background:
                    "#f8fafc",
                border:
                    "1px solid #e5eaf2",
                borderRadius:
                    "10px",
                padding:
                    "12px",
            }}
        >

            <div
                style={{
                    color:
                        "#8490a2",
                    fontSize:
                        "10px",
                    marginBottom:
                        "5px",
                }}
            >
                {label}
            </div>

            <strong
                style={{
                    fontSize:
                        "12px",
                }}
            >
                {value}
            </strong>

        </div>
    );
};


const ModalActions = ({
    children,
}) => {

    return (
        <div
            style={{
                display:
                    "flex",
                justifyContent:
                    "flex-end",
                gap:
                    "8px",
                marginTop:
                    "22px",
                paddingTop:
                    "17px",
                borderTop:
                    "1px solid #edf0f5",
            }}
        >
            {children}
        </div>
    );
};


// =========================================================
// SHARED STYLES
// =========================================================

const electionMenuItemStyle = {
    width:
        "100%",
    border:
        "none",
    background:
        "transparent",
    padding:
        "10px 11px",
    borderRadius:
        "8px",
    cursor:
        "pointer",
    fontWeight:
        700,
    fontSize:
        "12px",
    display:
        "flex",
    alignItems:
        "center",
    justifyContent:
        "space-between",
    textAlign:
        "left",
};


const inputStyle = {
    width:
        "100%",
    boxSizing:
        "border-box",
    padding:
        "11px 12px",
    border:
        "1px solid #d7deea",
    borderRadius:
        "9px",
    outline:
        "none",
    fontSize:
        "12px",
    color:
        "#172033",
    background:
        "#ffffff",
};


const yearButtonStyle = {
    padding:
        "8px 12px",
    border:
        "1px solid #d9e0eb",
    borderRadius:
        "8px",
    background:
        "#ffffff",
    fontSize:
        "11px",
    fontWeight:
        700,
    cursor:
        "pointer",
};


const primaryButtonStyle = {
    border:
        "none",
    background:
        "#266EFF",
    color:
        "#ffffff",
    padding:
        "10px 15px",
    borderRadius:
        "9px",
    cursor:
        "pointer",
    fontSize:
        "11px",
    fontWeight:
        800,
};


const secondaryButtonStyle = {
    border:
        "1px solid #d7deea",
    background:
        "#ffffff",
    color:
        "#344054",
    padding:
        "10px 15px",
    borderRadius:
        "9px",
    cursor:
        "pointer",
    fontSize:
        "11px",
    fontWeight:
        700,
};


export default ElectionManagement;