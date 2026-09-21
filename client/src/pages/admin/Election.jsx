    import React, {
        useEffect,
        useMemo,
        useState,
    } from "react";

    import PageLoader from "/src/components/transitionloader/PageLoader";

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

    import { FiBell, FiLogOut } from "react-icons/fi";

    import api from "../../services/api";
    import "./Election.css";


    // =========================================================
    // CONSTANTS
    // =========================================================

    const YEAR_LEVELS = [
        "2nd Year",
        "3rd Year",
        "4th Year",
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

    function Election() {

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


        const [
            showConfirmModal,
            setShowConfirmModal,
        ] = useState(false);


        const [
            showPositionModal,
            setShowPositionModal,
        ] = useState(false);


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

                if (
                    election.rawStatus ===
                        "open" ||
                    election.rawStatus ===
                        "closed" ||
                    election.rawStatus ===
                        "cancelled"
                ) {
                    setError(
                        "This election cannot be edited in its current status."
                    );
                    return;
                }

                const yearLevels =
                    election.yearLevelAccess
                        .map(
                            (item) =>
                                item.year_level ||
                                item
                        );

                setEditForm({
                    title:
                        election.name ||
                        "",

                    description:
                        election.description ||
                        "",

                    electionDate:
                        election.electionDate ||
                        "",

                    startTime:
                        election.startTime ||
                        "08:00",

                    endTime:
                        election.endTime ||
                        "16:00",

                    yearLevelAccess:
                        yearLevels.filter(
                            (year) =>
                                YEAR_LEVELS.includes(
                                    year
                                )
                        ),
                });

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

                if (!selectedElection) {
                    return;
                }

                if (
                    !editForm.title.trim()
                ) {
                    setError(
                        "Election title is required."
                    );
                    return;
                }

                if (
                    editForm.startTime >=
                    editForm.endTime
                ) {
                    setError(
                        "Voting end time must be later than start time."
                    );
                    return;
                }

                if (
                    editForm.yearLevelAccess
                        .length === 0
                ) {
                    setError(
                        "Select at least one eligible year level."
                    );
                    return;
                }

                try {

                    setSaving(true);
                    setError("");

                    const response =
                        await updateElection(
                            selectedElection.id,
                            {
                                title:
                                    editForm.title.trim(),

                                description:
                                    editForm.description.trim(),

                                electionDate:
                                    editForm.electionDate,

                                startTime:
                                    editForm.startTime,

                                endTime:
                                    editForm.endTime,

                                yearLevelAccess:
                                    editForm.yearLevelAccess,
                            }
                        );

                    const updated =
                        response?.election ||
                        response?.data?.election ||
                        response?.data ||
                        response;

                    setShowEditModal(
                        false
                    );

                    setSuccess(
                        "Election information updated successfully."
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
                        "Update election error:",
                        err
                    );

                    setError(
                        err?.response?.data
                            ?.message ||
                        err?.message ||
                        "Failed to update election."
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
                            ? "Election unpublished successfully."
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
                        `Unpublish "${election.name}"? The election will return to Draft status and will no longer be published.`,

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

                const presets = {

                    President: {
                        name:
                            "President",
                        description:
                            "President of the student organization.",
                        yearLevelAccess: [
                            "2nd Year",
                            "3rd Year",
                            "4th Year",
                        ],
                    },

                    "Vice President": {
                        name:
                            "Vice President",
                        description:
                            "Vice President of the student organization.",
                        yearLevelAccess: [
                            "4th Year",
                        ],
                    },

                    Treasurer: {
                        name:
                            "Treasurer",
                        description:
                            "Manages organization financial responsibilities.",
                        yearLevelAccess: [
                            "2nd Year",
                            "3rd Year",
                            "4th Year",
                        ],
                    },

                    Secretary: {
                        name:
                            "Secretary",
                        description:
                            "Manages official records and documentation.",
                        yearLevelAccess: [
                            "2nd Year",
                            "3rd Year",
                            "4th Year",
                        ],
                    },

                    "2nd Year Representative": {
                        name:
                            "2nd Year Representative",
                        description:
                            "Representative for 2nd Year students.",
                        yearLevelAccess: [
                            "2nd Year",
                        ],
                    },

                    "3rd Year Representative": {
                        name:
                            "3rd Year Representative",
                        description:
                            "Representative for 3rd Year students.",
                        yearLevelAccess: [
                            "3rd Year",
                        ],
                    },

                    "4th Year Representative": {
                        name:
                            "4th Year Representative",
                        description:
                            "Representative for 4th Year students.",
                        yearLevelAccess: [
                            "4th Year",
                        ],
                    },
                };

                const selected =
                    presets[preset];

                if (!selected) {
                    return;
                }

                setPositionForm(
                    (current) => ({
                        ...current,

                        ...selected,

                        order:
                            positions.length +
                            1,

                        isRequired:
                            true,
                    })
                );
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


        const [remoteVoting, setRemoteVoting] = useState(true);
        const [campusKiosk, setCampusKiosk] = useState(true);
        const [confirmSchedule, setConfirmSchedule] = useState(false);
        const [allowLateEnrollees, setAllowLateEnrollees] = useState(true);
        const [bannerFile, setBannerFile] = useState(null);

        // Admin navigation state — mirrors the Admin Dashboard topbar.
        const [navEnvironment] = useState("Production");
        const [navAdmin] = useState(() => {
            try {
                const storedUser = localStorage.getItem("votaraStaffUser");
                return storedUser ? JSON.parse(storedUser) : null;
            } catch {
                return null;
            }
        });

        // Page transition loader for Election navigation.
        // Uses the shared Votara loader component, but keeps
        // Election-specific transition state and navigation logic.
        const [isElectionPageTransitioning, setIsElectionPageTransitioning] =
            useState(false);

        const navigateWithElectionLoader = (path) => {
            if (isElectionPageTransitioning) {
                return;
            }

            setIsElectionPageTransitioning(true);

            window.setTimeout(() => {
                navigate(path);
            }, 700);
        };

        const handleNavLogout = () => {
            if (isElectionPageTransitioning) {
                return;
            }

            setIsElectionPageTransitioning(true);

            window.setTimeout(() => {
                localStorage.removeItem("votaraStaffToken");
                localStorage.removeItem("votaraStaffUser");
                navigate("/admin-login", { replace: true });
            }, 700);
        };

        const navAdminName = navAdmin?.full_name || "Administrator";
        const navAdminInitial = navAdminName.charAt(0)?.toUpperCase() || "A";

        return (
            <>
                {isElectionPageTransitioning && <PageLoader />}

                <div className="election-management-page election-redesign-page">

                <header className="election-nav-topbar">
                    <div className="election-nav-brand" onClick={() => navigateWithElectionLoader("/admin-dashboard")}>
                        <span className="election-nav-brand-mark" aria-hidden="true">
                            <img src="/src/images/Votara.png" alt="Votara Logo" className="election-nav-brand-logo" />
                        </span>
                        <span className="election-nav-brand-name">Votara</span>
                    </div>

                    <nav className="election-nav-menu" aria-label="Admin navigation">
                        <button className="election-nav-link" onClick={() => navigateWithElectionLoader("/admin-dashboard")}>Overview</button>
                        <button className="election-nav-link" onClick={() => navigateWithElectionLoader("/admin/students")}>User</button>
                        <button className="election-nav-link active" aria-current="page" onClick={() => navigateWithElectionLoader("/admin/election")}>Elections</button>
                        <button className="election-nav-link" onClick={() => navigateWithElectionLoader("/admin/candidates")}>Candidates</button>
                        <button className="election-nav-link" onClick={() => navigateWithElectionLoader("/admin/audit-logs")}>Logs</button>
                        <button className="election-nav-link" onClick={() => navigateWithElectionLoader("/admin/settings")}>Config &amp; Support</button>
                    </nav>

                    <div className="election-nav-actions">
                        <button className="election-nav-environment" type="button" aria-label="Current environment">
                            <span className="election-nav-dot"></span>{navEnvironment}
                        </button>
                        <button className="election-nav-notification" type="button" onClick={() => navigateWithElectionLoader("/admin/audit-logs")} title="Notifications" aria-label="Notifications">
                            <span className="election-nav-notification-dot"></span>
                            <FiBell size={16} />
                        </button>
                        <div className="election-nav-user">
                            <span className="election-nav-avatar">{navAdminInitial}</span>
                            <span className="election-nav-user-name">{navAdminName}</span>
                        </div>
                        <button className="election-nav-logout" type="button" onClick={handleNavLogout} title="Logout" aria-label="Logout">
                            <FiLogOut size={17} />
                        </button>
                    </div>
                </header>

                <section className="election-redesign-heading">
                    <div>
                        <span className="election-redesign-badge">
                            <span></span>
                            Elections · Setup
                        </span>
                        <h1>Create an election</h1>
                        <p>Set the registration and voting schedule, choose how students vote, then publish.</p>
                        <p>Voting period and methods lock once voting starts.</p>
                    </div>
                </section>

                {error && (
                    <div className="election-redesign-alert election-redesign-error">
                        <span>{error}</span>
                        <button type="button" onClick={() => setError("")}>×</button>
                    </div>
                )}

                {success && (
                    <div className="election-redesign-alert election-redesign-success">
                        ✓ {success}
                    </div>
                )}

                <div className="election-redesign-layout">

                    <form className="election-create-panel" onSubmit={handleCreateElection}>
                        <div className="election-panel-title">
                            <h2>New Election</h2>
                        </div>

                        <div className="election-field-label">Voting Methods</div>
                        <div className="election-method-grid">
                            <button
                                type="button"
                                className={`election-method-card ${remoteVoting ? "selected" : ""}`}
                                onClick={() => setRemoteVoting((value) => !value)}
                            >
                                <span className="election-method-icon">▣</span>
                                <span>
                                    <strong>Remote Voting</strong>
                                    <small>Students vote from their own device after the eligibility check.</small>
                                </span>
                                <span className="election-method-check">{remoteVoting ? "✓" : ""}</span>
                            </button>

                            <button
                                type="button"
                                className={`election-method-card ${campusKiosk ? "selected" : ""}`}
                                onClick={() => setCampusKiosk((value) => !value)}
                            >
                                <span className="election-method-icon">▯</span>
                                <span>
                                    <strong>Campus Kiosk</strong>
                                    <small>Students vote at the registration kiosk using their Student ID.</small>
                                </span>
                                <span className="election-method-check">{campusKiosk ? "✓" : ""}</span>
                            </button>
                        </div>
                        <small className="election-help-text">Students choose one method when they vote. Enable at least one.</small>

                        <div className="election-lock-warning">
                            <div className="election-lock-title">⚠ <strong>Dates and methods lock once voting starts</strong></div>
                            <p>After the voting period opens, the schedule and voting methods cannot be changed. Review them before creating the election.</p>
                            <label>
                                <input type="checkbox" checked={confirmSchedule} onChange={(event) => setConfirmSchedule(event.target.checked)} />
                                <span>I confirm the schedule and voting methods are correct</span>
                            </label>
                        </div>

                        <label className="election-redesign-field">
                            <span>Election Name</span>
                            <input
                                name="title"
                                value={createForm.title}
                                onChange={handleCreateChange}
                                placeholder="e.g. SSG Election 2026"
                            />
                        </label>

                        <div className="election-two-columns">
                            <label className="election-redesign-field">
                                <span>Academic Year</span>
                                <select defaultValue="2025-2026">
                                    <option>2025-2026</option>
                                    <option>2026-2027</option>
                                    <option>2027-2028</option>
                                </select>
                            </label>

                            <label className="election-redesign-field">
                                <span>Positions</span>
                                <select defaultValue="5 positions selected">
                                    <option>5 positions selected</option>
                                    <option>4 positions selected</option>
                                    <option>3 positions selected</option>
                                </select>
                            </label>
                        </div>

                        <div className="election-two-columns">
                            <label className="election-redesign-field">
                                <span>Registration Period</span>
                                <input type="date" value={createForm.electionDate} onChange={(event) => setCreateForm((current) => ({ ...current, electionDate: event.target.value }))} />
                            </label>

                            <label className="election-redesign-field">
                                <span>Voting Period</span>
                                <input type="datetime-local" value={createForm.electionDate && createForm.startTime ? `${createForm.electionDate}T${createForm.startTime}` : ""} onChange={(event) => {
                                    const value = event.target.value;
                                    if (!value) return;
                                    const [date, time] = value.split("T");
                                    setCreateForm((current) => ({ ...current, electionDate: date, startTime: time || current.startTime }));
                                }} />
                            </label>
                        </div>

                        <label className="election-redesign-field compact-field">
                            <span>Results Release</span>
                            <select defaultValue="After voting closes">
                                <option>After voting closes</option>
                                <option>Immediately</option>
                                <option>Manually by Electoral Board</option>
                            </select>
                        </label>

                        <label className="election-toggle-row">
                            <span>
                                <strong>Allow late enrollees</strong>
                                <small>The Electoral Board verifies enrolment status and documents before approving.</small>
                            </span>
                            <input type="checkbox" checked={allowLateEnrollees} onChange={(event) => setAllowLateEnrollees(event.target.checked)} />
                        </label>

                        <div className="election-redesign-field">
                            <span>Election Banner (Optional)</span>
                            <label className="election-upload-box">
                                <input type="file" accept="image/png,image/jpeg" onChange={(event) => setBannerFile(event.target.files?.[0] || null)} />
                                <span className="election-upload-icon">⇧</span>
                                <strong>{bannerFile ? bannerFile.name : "Upload election banner"}</strong>
                                <small>PNG or JPG, shown on the landing page</small>
                            </label>
                        </div>

                        <div className="election-create-actions">
                            <button type="button" className="election-secondary-btn" onClick={() => setCreateForm({ title: "", description: "", electionDate: "", startTime: "08:00", endTime: "16:00", yearLevelAccess: ["2nd Year", "3rd Year", "4th Year"] })}>
                                Clear
                            </button>
                            <button type="submit" className="election-primary-btn" disabled={saving || !confirmSchedule || (!remoteVoting && !campusKiosk)}>
                                {saving ? "Creating..." : "Create Election"} <span>→</span>
                            </button>
                        </div>
                    </form>

                    <aside className="election-redesign-side">
                        <section className="election-timeline-card">
                            <div className="election-side-title-row">
                                <h2>Election Timeline</h2>
                                <span className="election-draft-pill">Draft</span>
                            </div>

                            {[
                                ["1", "Registration", "Students register online (form, documents, live selfie) or in person at the registration desk."],
                                ["2", "EB Verification", "The Electoral Board reviews documents and selfie, then approves, rejects, or asks for a revision."],
                                ["3", "Voting Period", "Approved students log in and vote remotely or at the campus kiosk."],
                                ["4", "Results & Reports", "Ballots are stored securely, then turnout and candidate results are generated."],
                            ].map(([number, title, description]) => (
                                <div className="election-timeline-row" key={number}>
                                    <span className="election-timeline-number">{number}</span>
                                    <div>
                                        <div className="election-timeline-heading"><strong>{title}</strong><small>Not scheduled</small></div>
                                        <p>{description}</p>
                                    </div>
                                </div>
                            ))}
                        </section>

                        <section className="election-recent-card">
                            <div className="election-side-title-row">
                                <h2>Recent Elections</h2>
                                <button type="button" onClick={loadElections}>View all</button>
                            </div>

                            {loading ? (
                                <div className="election-empty-side">Loading elections...</div>
                            ) : elections.length === 0 ? (
                                <div className="election-empty-side">No recent elections yet.</div>
                            ) : (
                                elections.slice(0, 4).map((rawElection) => {
                                    const election = normalizeElection(rawElection);
                                    return (
                                        <div className="election-recent-row" key={election.id}>
                                            <span className="election-recent-icon">▣</span>
                                            <div className="election-recent-info">
                                                <strong>{election.name}</strong>
                                                <small>{election.rawStatus === "closed" ? `Ended ${formatDate(election.electionDate)}` : election.status}</small>
                                            </div>
                                            <span className={`election-status-pill ${election.rawStatus}`}>{election.status}</span>
                                            <button type="button" onClick={() => openElectionDetails(election)}>{election.rawStatus === "draft" ? "Edit" : "View"}</button>
                                        </div>
                                    );
                                })
                            )}
                        </section>
                    </aside>
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
                                        1st Year students
                                        are not included
                                        in the VOTARA
                                        election.
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
                                        style={
                                            primaryButtonStyle
                                        }
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
                                    marginTop:
                                        "20px",
                                    paddingTop:
                                        "18px",
                                    borderTop:
                                        "1px solid #edf0f5",
                                    display:
                                        "flex",
                                    gap:
                                        "8px",
                                    flexWrap:
                                        "wrap",
                                    justifyContent:
                                        "flex-end",
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

                                {(selectedElection.rawStatus ===
                                    "draft" ||
                                    selectedElection.rawStatus ===
                                        "scheduled") && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditModal(
                                                selectedElection
                                            )
                                        }
                                        style={
                                            secondaryButtonStyle
                                        }
                                    >
                                        Edit Election
                                    </button>
                                )}


                                {selectedElection.rawStatus ===
                                    "draft" && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            requestPublish(
                                                selectedElection
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                        style={
                                            primaryButtonStyle
                                        }
                                    >
                                        Publish Election
                                    </button>
                                )}


                                {selectedElection.rawStatus ===
                                    "scheduled" && (
                                    <>

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
                                            style={
                                                secondaryButtonStyle
                                            }
                                        >
                                            Unpublish
                                        </button>


                                        <button
                                            type="button"
                                            onClick={() =>
                                                requestStatusChange(
                                                    selectedElection,
                                                    "open"
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                            style={
                                                primaryButtonStyle
                                            }
                                        >
                                            Open Election
                                        </button>

                                    </>
                                )}


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


                                {(selectedElection.rawStatus ===
                                    "draft" ||
                                    selectedElection.rawStatus ===
                                        "scheduled") && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            requestStatusChange(
                                                selectedElection,
                                                "cancelled"
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
                                        Cancel Election
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
                            subtitle={`Configure a position for ${selectedElection?.name || "this election"}.`}
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
                                    Quick Position Presets
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

                                    {[
                                        "President",
                                        "Vice President",
                                        "Treasurer",
                                        "Secretary",
                                        "2nd Year Representative",
                                        "3rd Year Representative",
                                        "4th Year Representative",
                                    ].map(
                                        (
                                            preset
                                        ) => (
                                            <button
                                                type="button"
                                                key={
                                                    preset
                                                }
                                                onClick={() =>
                                                    applyPositionPreset(
                                                        preset
                                                    )
                                                }
                                                style={{
                                                    padding:
                                                        "7px 9px",
                                                    border:
                                                        "1px solid #d5deec",
                                                    background:
                                                        "#ffffff",
                                                    borderRadius:
                                                        "7px",
                                                    cursor:
                                                        "pointer",
                                                    fontSize:
                                                        "10px",
                                                    fontWeight:
                                                        700,
                                                }}
                                            >
                                                {preset}
                                            </button>
                                        )
                                    )}

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
            </>
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


    export default Election;
