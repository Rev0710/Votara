import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { getAllElections } from "../../services/electionService";
import "./PartyListManagement.css";


// =====================================================
// PARTY LIST MANAGEMENT
// =====================================================

const PartyListManagement = () => {
    // =====================================================
    // STATE
    // =====================================================

    const [elections, setElections] = useState([]);
    const [selectedElection, setSelectedElection] = useState("");

    const [partyLists, setPartyLists] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState("");

    const [search, setSearch] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [modal, setModal] = useState(null);
    const [selectedParty, setSelectedParty] = useState(null);

    const [featureSelection, setFeatureSelection] = useState(null);

    // Confirmation popup
    const [confirmation, setConfirmation] = useState(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
        logo_url: "",
    });

    const [candidates, setCandidates] = useState([]);
    const [candidateLoading, setCandidateLoading] = useState(false);

    // =====================================================
    // LOAD ELECTIONS
    // =====================================================

    useEffect(() => {
        loadElections();
    }, []);

    // =====================================================
    // LOAD PARTY LISTS WHEN ELECTION CHANGES
    // =====================================================

    useEffect(() => {
        if (selectedElection) {
            loadPartyLists(selectedElection);
        } else {
            setPartyLists([]);
        }
    }, [selectedElection]);

    // =====================================================
    // AUTO CLEAR MESSAGES
    // =====================================================

    useEffect(() => {
        if (!success && !error) return;

        const timer = setTimeout(() => {
            setSuccess("");
            setError("");
        }, 5000);

        return () => clearTimeout(timer);
    }, [success, error]);

    // =====================================================
    // LOAD ELECTIONS
    // =====================================================

const loadElections = async () => {
    try {
        setLoading(true);
        setError("");

        const response = await getAllElections();

        console.log(
            "VOTARA Elections received:",
            response
        );

        const electionData =
            Array.isArray(response)
                ? response
                : Array.isArray(response?.elections)
                    ? response.elections
                    : Array.isArray(response?.data)
                        ? response.data
                        : [];

        console.log(
            "VOTARA Election List:",
            electionData
        );

        setElections(electionData);

        if (electionData.length > 0) {
            setSelectedElection(
                electionData[0].id
            );
        } else {
            setSelectedElection("");
            setPartyLists([]);
            setError(
                "No elections are available yet. Please create an election first in Election Management."
            );
        }

    } catch (err) {
        console.error(
            "Failed to load elections:",
            err
        );

        setElections([]);
        setSelectedElection("");
        setPartyLists([]);

        setError(
            err?.response?.data?.message ||
            err?.message ||
            "Unable to load elections."
        );

    } finally {
        setLoading(false);
    }
};

    // =====================================================
    // LOAD PARTY LISTS
    // =====================================================

    const loadPartyLists = async (electionId) => {
        if (!electionId) return;

        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/party-lists?election_id=${electionId}`
            );

            const data =
                response?.data?.data ||
                response?.data?.partyLists ||
                response?.data?.party_lists ||
                (Array.isArray(response?.data)
                    ? response.data
                    : []);

            setPartyLists(data);
        } catch (err) {
            console.error(
                "Failed to load party lists:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to load party lists."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // FORM
    // =====================================================

    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            logo_url: "",
        });
    };

    const handleFormChange = (field, value) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    // =====================================================
    // ADD PARTY
    // =====================================================

    const openAddModal = () => {
        resetForm();
        setSelectedParty(null);
        setModal("add");
    };

    // =====================================================
    // EDIT PARTY
    // =====================================================

    const openEditModal = (party) => {
        setSelectedParty(party);

        setForm({
            name: party.name || "",
            description: party.description || "",
            logo_url: party.logo_url || "",
        });

        setModal("edit");
    };

    // =====================================================
    // LOGO
    // =====================================================

    const openLogoModal = (party) => {
        setSelectedParty(party);

        setForm({
            name: party.name || "",
            description: party.description || "",
            logo_url: party.logo_url || "",
        });

        setModal("logo");
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (saving || candidateLoading) return;

        setModal(null);
        setSelectedParty(null);
        setCandidates([]);
        setFeatureSelection(null);
        resetForm();
    };

    // =====================================================
    // ADD CONFIRMATION
    // =====================================================

    const requestAddConfirmation = () => {
        if (!selectedElection) {
            setError("Please select an election first.");
            return;
        }

        if (!form.name.trim()) {
            setError("Party list name is required.");
            return;
        }

        setConfirmation({
            type: "add",
            title: "Add Party List",
            message: `Adding this "${form.name.trim()}" party list. Do you want to continue?`,
            confirmText: "Yes, Add Party List",
            cancelText: "No",
            onConfirm: executeAddParty,
        });
    };

    // =====================================================
    // EXECUTE ADD PARTY
    // =====================================================

    const executeAddParty = async () => {
        if (!selectedElection) return;

        try {
            setSaving(true);
            setError("");
            setSuccess("");
            setConfirmation(null);

            await api.post("/party-lists", {
                election_id: selectedElection,
                name: form.name.trim(),
                description: form.description.trim(),
                logo_url: form.logo_url.trim(),
            });

            setSuccess(
                `"${form.name.trim()}" party list was added successfully.`
            );

            setModal(null);
            setSelectedParty(null);
            resetForm();

            await loadPartyLists(selectedElection);
        } catch (err) {
            console.error("Add party error:", err);

            setError(
                err?.response?.data?.message ||
                "Unable to add party list."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // SAVE PARTY
    // =====================================================

    const handleSaveParty = async (event) => {
        event.preventDefault();

        if (!selectedElection) {
            setError("Please select an election first.");
            return;
        }

        if (!form.name.trim()) {
            setError("Party list name is required.");
            return;
        }

        // ADD USES CONFIRMATION POPUP
        if (modal === "add") {
            requestAddConfirmation();
            return;
        }

        // EDIT / LOGO
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await api.put(
                `/party-lists/${selectedParty.id}`,
                {
                    name: form.name.trim(),
                    description: form.description.trim(),
                    logo_url: form.logo_url.trim(),
                }
            );

            setSuccess(
                `"${form.name.trim()}" party list information was updated successfully.`
            );

            setModal(null);
            setSelectedParty(null);
            resetForm();

            await loadPartyLists(selectedElection);
        } catch (err) {
            console.error(
                "Save party error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to save party list."
            );
        } finally {
            setSaving(false);
        }
    };

    // =====================================================
    // APPROVE
    // =====================================================

    const handleApprove = (party) => {
        if (!party?.id) return;

        setConfirmation({
            type: "approve",
            title: "Approve Party List",
            message: `Approve "${party.name}" as a party list?`,
            confirmText: "Yes, Approve",
            cancelText: "No",
            onConfirm: () =>
                executeApprove(party),
        });
    };

    const executeApprove = async (party) => {
        try {
            setActionLoading(`approve-${party.id}`);
            setError("");
            setSuccess("");
            setConfirmation(null);

            await api.patch(
                `/party-lists/${party.id}/approve`,
                {
                    approval_remarks: "",
                }
            );

            setSuccess(
                `"${party.name}" has been approved successfully.`
            );

            setModal(null);
            setSelectedParty(null);

            await loadPartyLists(selectedElection);
        } catch (err) {
            console.error(
                "Approve error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to approve party list."
            );
        } finally {
            setActionLoading("");
        }
    };

    // =====================================================
    // REJECT
    // =====================================================

    const handleReject = (party) => {
        if (!party?.id) return;

        const remarks = window.prompt(
            `Enter the reason for rejecting "${party.name}":`
        );

        if (remarks === null) return;

        if (!remarks.trim()) {
            setError(
                "Rejection remarks are required."
            );
            return;
        }

        setConfirmation({
            type: "reject",
            title: "Reject Party List",
            message: `Reject "${party.name}" with the provided remarks?`,
            confirmText: "Yes, Reject",
            cancelText: "No",
            onConfirm: () =>
                executeReject(
                    party,
                    remarks.trim()
                ),
        });
    };

    const executeReject = async (
        party,
        remarks
    ) => {
        try {
            setActionLoading(
                `reject-${party.id}`
            );

            setError("");
            setSuccess("");
            setConfirmation(null);

            await api.patch(
                `/party-lists/${party.id}/reject`,
                {
                    approval_remarks: remarks,
                }
            );

            setSuccess(
                `"${party.name}" has been rejected.`
            );

            setModal(null);
            setSelectedParty(null);

            await loadPartyLists(selectedElection);
        } catch (err) {
            console.error(
                "Reject error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to reject party list."
            );
        } finally {
            setActionLoading("");
        }
    };

    // =====================================================
    // ACTIVATE
    // =====================================================

    const handleActivate = (party) => {
        if (!party?.id) return;

        setConfirmation({
            type: "activate",
            title: "Activate Party List",
            message: `Activate "${party.name}"?`,
            confirmText: "Yes, Activate",
            cancelText: "No",
            onConfirm: () =>
                executeActivate(party),
        });
    };

    const executeActivate = async (party) => {
        try {
            setActionLoading(
                `activate-${party.id}`
            );

            setError("");
            setSuccess("");
            setConfirmation(null);

            await api.patch(
                `/party-lists/${party.id}/activate`
            );

            setSuccess(
                `"${party.name}" is now active.`
            );

            setModal(null);
            setSelectedParty(null);

            await loadPartyLists(selectedElection);
        } catch (err) {
            console.error(
                "Activate error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to activate party list."
            );
        } finally {
            setActionLoading("");
        }
    };

    // =====================================================
    // DEACTIVATE
    // =====================================================

    const handleDeactivate = (party) => {
        if (!party?.id) return;

        setConfirmation({
            type: "deactivate",
            title: "Deactivate Party List",
            message: `Deactivate "${party.name}"?`,
            confirmText: "Yes, Deactivate",
            cancelText: "No",
            onConfirm: () =>
                executeDeactivate(party),
        });
    };

    const executeDeactivate = async (
        party
    ) => {
        try {
            setActionLoading(
                `deactivate-${party.id}`
            );

            setError("");
            setSuccess("");
            setConfirmation(null);

            await api.patch(
                `/party-lists/${party.id}/deactivate`
            );

            setSuccess(
                `"${party.name}" has been deactivated.`
            );

            setModal(null);
            setSelectedParty(null);

            await loadPartyLists(selectedElection);
        } catch (err) {
            console.error(
                "Deactivate error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to deactivate party list."
            );
        } finally {
            setActionLoading("");
        }
    };

    // =====================================================
    // VIEW CANDIDATES
    // =====================================================

    const openCandidatesModal = async (
        party
    ) => {
        if (!party?.id) return;

        setSelectedParty(party);
        setCandidates([]);
        setCandidateLoading(true);
        setModal("candidates");

        try {
            const response = await api.get(
                `/party-lists/${party.id}/candidates`
            );

            const data =
                response?.data?.data ||
                response?.data?.candidates ||
                (Array.isArray(response?.data)
                    ? response.data
                    : []);

            setCandidates(data);
        } catch (err) {
            console.error(
                "Failed to load candidates:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to load party candidates."
            );
        } finally {
            setCandidateLoading(false);
        }
    };

    // =====================================================
    // FEATURE CLICK
    // =====================================================

    const handleFeatureClick = (
        featureNumber
    ) => {

        // =================================================
        // FEATURE 1 - ADD
        // =================================================

        if (featureNumber === 1) {
            openAddModal();
            return;
        }

        // =================================================
        // OTHER FEATURES REQUIRE A PARTY
        // =================================================

        if (partyLists.length === 0) {
            setError(
                "No party lists are available yet. Please add a party list first."
            );
            return;
        }

        // =================================================
        // ONLY ONE PARTY
        // =================================================

        if (partyLists.length === 1) {
            const party =
                partyLists[0];

            handleFeaturePartySelect(
                party,
                featureNumber
            );

            return;
        }

        // =================================================
        // MULTIPLE PARTIES
        // =================================================

        setFeatureSelection(
            featureNumber
        );

        setModal(
            "selectParty"
        );
    };

    // =====================================================
    // HANDLE PARTY SELECTION
    // =====================================================

    const handleFeaturePartySelect = (
        party,
        featureNumber = featureSelection
    ) => {

        if (!party || !featureNumber) {
            return;
        }

        setFeatureSelection(null);

        if (featureNumber === 2) {
            openEditModal(party);
            return;
        }

        if (featureNumber === 3) {
            openLogoModal(party);
            return;
        }

        if (featureNumber === 4) {
            setSelectedParty(party);
            setModal("approval");
            return;
        }

        if (featureNumber === 5) {
            openCandidatesModal(party);
            return;
        }

        if (featureNumber === 6) {
            setSelectedParty(party);
            setModal("status");
        }
    };

    // =====================================================
    // FILTER
    // =====================================================

    const filteredPartyLists =
        useMemo(() => {
            const keyword =
                search
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return partyLists;
            }

            return partyLists.filter(
                (party) =>
                    String(
                        party.name || ""
                    )
                        .toLowerCase()
                        .includes(keyword)
            );
        }, [
            partyLists,
            search,
        ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const statistics =
        useMemo(() => {
            return {
                total:
                    partyLists.length,

                pending:
                    partyLists.filter(
                        (party) =>
                            party.approval_status ===
                            "pending"
                    ).length,

                approved:
                    partyLists.filter(
                        (party) =>
                            party.approval_status ===
                            "approved"
                    ).length,

                active:
                    partyLists.filter(
                        (party) =>
                            party.is_active === true
                    ).length,
            };
        }, [partyLists]);

    // =====================================================
    // INITIAL LOADING
    // =====================================================

    if (
        loading &&
        elections.length === 0
    ) {
        return (
            <div style={styles.container}>
                <div
                    style={
                        styles.loadingCard
                    }
                >
                    <div
                        style={
                            styles.spinner
                        }
                    />

                    <p
                        style={
                            styles.loadingText
                        }
                    >
                        Loading Party List
                        Management...
                    </p>
                </div>
            </div>
        );
    }

    // =====================================================
    // MAIN RENDER
    // =====================================================

    return (
        <div style={styles.container}>

            {/* =================================================
                HEADER
            ================================================= */}

            <div
    className="plm-header"
    style={styles.header}
>

<div
    className="plm-header-icon"
    style={styles.icon}
>
    ▰
</div>
                <div
    className="plm-header-content"
    style={{ flex: 1 }}
>

                   <h2
    className="plm-title"
    style={styles.title}
>
    Party List Management
</h2>

                    <p
    className="plm-description"
    style={styles.description}
>
    Manage party lists participating in the VOTARA election.
</p>

                </div>

                <button
    className="plm-add-button"
    type="button"
    style={styles.primaryButton}
    onClick={openAddModal}
    disabled={!selectedElection}
>
    + Add Party List
</button>

            </div>

            {/* =================================================
                SUCCESS MESSAGE
            ================================================= */}

            {success && (
                <div
                    style={
                        styles.successMessage
                    }
                >
                    <span
                        style={
                            styles.messageIcon
                        }
                    >
                        ✓
                    </span>

                    <span>
                        {success}
                    </span>

                    <button
                        type="button"
                        style={
                            styles.closeMessage
                        }
                        onClick={() =>
                            setSuccess("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {/* =================================================
                ERROR MESSAGE
            ================================================= */}

            {error && (
                <div
                    style={
                        styles.errorMessage
                    }
                >
                    <span
                        style={
                            styles.messageIcon
                        }
                    >
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                    <button
                        type="button"
                        style={
                            styles.closeMessage
                        }
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>
                </div>
            )}

            {/* =================================================
                ELECTION
            ================================================= */}

            <div
                style={
                    styles.electionCard
                }
            >

                <div>

                    <label
                        style={
                            styles.label
                        }
                    >
                        Election
                    </label>

                    <select
                        value={
                            selectedElection
                        }
                        onChange={(event) =>
                            setSelectedElection(
                                event.target.value
                            )
                        }
                        style={
                            styles.select
                        }
                    >

                        <option value="">
                            Select an election
                        </option>

                        {elections.map((election) => (
                            <option
                                key={election.id}
                                value={election.id}
                            >
                                {election.title ||
                                    election.name ||
                                    "Untitled Election"}
                            </option>
                        ))
                        
                        }

                    </select>

                </div>

                <button
                    type="button"
                    style={
                        styles.secondaryButton
                    }
                    onClick={() =>
                        loadPartyLists(
                            selectedElection
                        )
                    }
                    disabled={
                        !selectedElection ||
                        loading
                    }
                >
                    ↻ Refresh
                </button>

            </div>

            {/* =================================================
                STATISTICS
            ================================================= */}

            <div
                style={
                    styles.statsGrid
                }
            >

                <StatCard
                    title="Total"
                    value={
                        statistics.total
                    }
                    icon="▣"
                />

                <StatCard
                    title="Pending"
                    value={
                        statistics.pending
                    }
                    icon="◷"
                />

                <StatCard
                    title="Approved"
                    value={
                        statistics.approved
                    }
                    icon="✓"
                />

                <StatCard
                    title="Active"
                    value={
                        statistics.active
                    }
                    icon="●"
                />

            </div>

            {/* =================================================
                SIX FUNCTIONS
            ================================================= */}

            <div
                style={
                    styles.card
                }
            >

                <div
                    style={
                        styles.cardHeader
                    }
                >

                    <h3
                        style={
                            styles.cardTitle
                        }
                    >
                        Party List Functions
                    </h3>

                    <p
                        style={
                            styles.cardSubtitle
                        }
                    >
                        Click any function
                        below to manage
                        the party lists.
                    </p>

                </div>

<div
    className="plm-feature-grid"
    style={styles.featureGrid}
>

                    <Feature
                        number="1"
                        title="Add Party List"
                        description="Create a new party list for the election."
                        onClick={() =>
                            handleFeatureClick(
                                1
                            )
                        }
                    />

                    <Feature
                        number="2"
                        title="Edit Party Information"
                        description="Update party name, description, and other information."
                        onClick={() =>
                            handleFeatureClick(
                                2
                            )
                        }
                    />

                    <Feature
                        number="3"
                        title="Party Logo"
                        description="Manage the party list logo and description."
                        onClick={() =>
                            handleFeatureClick(
                                3
                            )
                        }
                    />

                    <Feature
                        number="4"
                        title="Approve or Reject"
                        description="Review the party list and record the EB decision."
                        onClick={() =>
                            handleFeatureClick(
                                4
                            )
                        }
                    />

                    <Feature
                        number="5"
                        title="View Party Candidates"
                        description="View candidates associated with the party list."
                        onClick={() =>
                            handleFeatureClick(
                                5
                            )
                        }
                    />

                    <Feature
                        number="6"
                        title="Activate / Deactivate"
                        description="Control whether a party list is active."
                        onClick={() =>
                            handleFeatureClick(
                                6
                            )
                        }
                    />

                </div>

            </div>

            {/* =================================================
                REGISTERED PARTY LISTS
            ================================================= */}

            <div
                style={
                    styles.card
                }
            >

                <div
                    style={
                        styles.tableHeader
                    }
                >

                    <div>

                        <h3
                            style={
                                styles.cardTitle
                            }
                        >
                            Registered Party Lists
                        </h3>

                        <p
                            style={
                                styles.cardSubtitle
                            }
                        >
                            Party lists registered
                            for the selected
                            election.
                        </p>

                    </div>

                    <div
                        style={
                            styles.searchWrapper
                        }
                    >

                        <span
                            style={
                                styles.searchIcon
                            }
                        >
                            🔎
                        </span>

                        <input
                            type="text"
                            placeholder="Search party list..."
                            value={search}
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event.target
                                        .value
                                )
                            }
                            style={
                                styles.searchInput
                            }
                        />

                    </div>

                </div>

                {!selectedElection ? (

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
                            !
                        </div>

                        <h4
                            style={
                                styles.emptyTitle
                            }
                        >
                            Select an election
                        </h4>

                        <p
                            style={
                                styles.emptyText
                            }
                        >
                            Select an election
                            above to view
                            its party lists.
                        </p>

                    </div>

                ) : loading ? (

                    <div
                        style={
                            styles.emptyState
                        }
                    >

                        <div
                            style={
                                styles.spinner
                            }
                        />

                        <p
                            style={
                                styles.loadingText
                            }
                        >
                            Loading party
                            lists...
                        </p>

                    </div>

                ) : filteredPartyLists.length === 0 ? (

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
                            ▰
                        </div>

                        <h4
                            style={
                                styles.emptyTitle
                            }
                        >
                            No party lists
                            found
                        </h4>

                        <p
                            style={
                                styles.emptyText
                            }
                        >
                            Add a party list
                            to begin
                            managing party
                            participation.
                        </p>

                        <button
                            type="button"
                            style={
                                styles.primaryButton
                            }
                            onClick={
                                openAddModal
                            }
                        >
                            + Add Party List
                        </button>

                    </div>

                ) : (

                    <div
                        style={
                            styles.partyListContainer
                        }
                    >

                        {filteredPartyLists.map(
                            (party) => (

                                <PartyRow
                                    key={
                                        party.id
                                    }
                                    party={
                                        party
                                    }

                                    onEdit={() =>
                                        openEditModal(
                                            party
                                        )
                                    }

                                    onLogo={() =>
                                        openLogoModal(
                                            party
                                        )
                                    }

                                    onCandidates={() =>
                                        openCandidatesModal(
                                            party
                                        )
                                    }

                                    onApproval={() => {
                                        setSelectedParty(
                                            party
                                        );
                                        setModal(
                                            "approval"
                                        );
                                    }}

                                    onStatus={() => {
                                        setSelectedParty(
                                            party
                                        );
                                        setModal(
                                            "status"
                                        );
                                    }}

                                    onApprove={() =>
                                        handleApprove(
                                            party
                                        )
                                    }

                                    onReject={() =>
                                        handleReject(
                                            party
                                        )
                                    }

                                    onActivate={() =>
                                        handleActivate(
                                            party
                                        )
                                    }

                                    onDeactivate={() =>
                                        handleDeactivate(
                                            party
                                        )
                                    }

                                    actionLoading={
                                        actionLoading
                                    }
                                />

                            )
                        )}

                    </div>

                )}

            </div>

            {/* =================================================
                ADD / EDIT / LOGO MODAL
            ================================================= */}

            {(modal === "add" ||
                modal === "edit" ||
                modal === "logo") && (

                <Modal
                    title={
                        modal === "add"
                            ? "Add Party List"
                            : modal === "logo"
                                ? "Party Logo & Description"
                                : "Edit Party Information"
                    }
                    onClose={
                        closeModal
                    }
                    wide
                >

                    <form
                        onSubmit={
                            handleSaveParty
                        }
                    >

                        <div
                            style={
                                styles.formGrid
                            }
                        >

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
                                    Party List Name
                                </label>

                                <input
                                    type="text"
                                    value={
                                        form.name
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleFormChange(
                                            "name",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Enter party list name"
                                    style={
                                        styles.input
                                    }
                                    disabled={
                                        modal ===
                                        "logo"
                                    }
                                    required
                                />

                            </div>

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
                                    Logo URL
                                </label>

                                <input
                                    type="url"
                                    value={
                                        form.logo_url
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleFormChange(
                                            "logo_url",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="https://example.com/logo.png"
                                    style={
                                        styles.input
                                    }
                                />

                            </div>

                        </div>

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
                                Description
                            </label>

                            <textarea
                                value={
                                    form.description
                                }
                                onChange={(
                                    event
                                ) =>
                                    handleFormChange(
                                        "description",
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Enter party list description..."
                                style={
                                    styles.textarea
                                }
                                rows={5}
                            />

                        </div>

                        {form.logo_url && (
                            <div
                                style={
                                    styles.logoPreviewBox
                                }
                            >

                                <span
                                    style={
                                        styles.previewLabel
                                    }
                                >
                                    Logo Preview
                                </span>

                                <img
                                    src={
                                        form.logo_url
                                    }
                                    alt="Party logo preview"
                                    style={
                                        styles.logoPreview
                                    }
                                    onError={(
                                        event
                                    ) => {
                                        event.currentTarget.style.display =
                                            "none";
                                    }}
                                />

                            </div>
                        )}

                        <div
                            style={
                                styles.modalFooter
                            }
                        >

                            <button
                                type="button"
                                style={
                                    styles.cancelButton
                                }
                                onClick={
                                    closeModal
                                }
                                disabled={
                                    saving
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                style={
                                    styles.primaryButton
                                }
                                disabled={
                                    saving
                                }
                            >
                                {saving
                                    ? "Saving..."
                                    : modal ===
                                        "add"
                                        ? "Add Party List"
                                        : "Save Changes"}
                            </button>

                        </div>

                    </form>

                </Modal>
            )}

            {/* =================================================
                SELECT PARTY LIST MODAL
            ================================================= */}

            {modal ===
                "selectParty" && (

                <Modal
                    title="Select Party List"
                    onClose={
                        closeModal
                    }
                    wide
                >

                    <p
                        style={
                            styles.modalInstruction
                        }
                    >
                        Select the party
                        list you want to
                        manage.
                    </p>

                    <div
                        style={
                            styles.partySelectionList
                        }
                    >

                        {partyLists.map(
                            (party) => (

                                <button
                                    key={
                                        party.id
                                    }
                                    type="button"
                                    style={
                                        styles.partySelectionItem
                                    }
                                    onClick={() =>
                                        handleFeaturePartySelect(
                                            party
                                        )
                                    }
                                >

                                    <PartyLogo
                                        party={
                                            party
                                        }
                                        size={
                                            48
                                        }
                                    />

                                    <div
                                        style={
                                            styles.partySelectionInfo
                                        }
                                    >

                                        <strong
                                            style={
                                                styles.partySelectionInfoName
                                            }
                                        >
                                            {
                                                party.name
                                            }
                                        </strong>

                                        <span
                                            style={
                                                styles.partySelectionInfoStatus
                                            }
                                        >
                                            {party.approval_status ===
                                            "approved"
                                                ? "Approved"
                                                : party.approval_status ===
                                                    "rejected"
                                                    ? "Rejected"
                                                    : "Pending"}
                                        </span>

                                    </div>

                                    <span
                                        style={
                                            styles.selectionArrow
                                        }
                                    >
                                        →
                                    </span>

                                </button>

                            )
                        )}

                    </div>

                </Modal>
            )}

            {/* =================================================
                APPROVAL MODAL
            ================================================= */}

            {modal ===
                "approval" &&
                selectedParty && (

                    <Modal
                        title="Approve or Reject Party List"
                        onClose={
                            closeModal
                        }
                    >

                        <div
                            style={
                                styles.modalPartyHeader
                            }
                        >

                            <PartyLogo
                                party={
                                    selectedParty
                                }
                                size={
                                    58
                                }
                            />

                            <div>

                                <h3
                                    style={
                                        styles.modalPartyName
                                    }
                                >
                                    {
                                        selectedParty.name
                                    }
                                </h3>

                                <StatusBadge
                                    status={
                                        selectedParty.approval_status
                                    }
                                />

                            </div>

                        </div>

                        <div
                            style={
                                styles.infoBox
                            }
                        >

                            <strong>
                                EB Review
                            </strong>

                            <p>
                                Review the
                                party list
                                information
                                before
                                recording
                                the
                                Electoral
                                Board
                                decision.
                            </p>

                        </div>

                        {selectedParty.approval_remarks && (
                            <div
                                style={
                                    styles.remarksBox
                                }
                            >

                                <strong>
                                    Previous Remarks
                                </strong>

                                <p>
                                    {
                                        selectedParty.approval_remarks
                                    }
                                </p>

                            </div>
                        )}

                        <div
                            style={
                                styles.modalActions
                            }
                        >

                            <button
                                type="button"
                                style={
                                    styles.rejectButton
                                }
                                onClick={() =>
                                    handleReject(
                                        selectedParty
                                    )
                                }
                                disabled={
                                    actionLoading ===
                                    `reject-${selectedParty.id}`
                                }
                            >
                                {actionLoading ===
                                `reject-${selectedParty.id}`
                                    ? "Rejecting..."
                                    : "✕ Reject"}
                            </button>

                            <button
                                type="button"
                                style={
                                    styles.approveButton
                                }
                                onClick={() =>
                                    handleApprove(
                                        selectedParty
                                    )
                                }
                                disabled={
                                    actionLoading ===
                                    `approve-${selectedParty.id}`
                                }
                            >
                                {actionLoading ===
                                `approve-${selectedParty.id}`
                                    ? "Approving..."
                                    : "✓ Approve"}
                            </button>

                        </div>

                    </Modal>
                )}

            {/* =================================================
                STATUS MODAL
            ================================================= */}

            {modal ===
                "status" &&
                selectedParty && (

                    <Modal
                        title="Party List Status"
                        onClose={
                            closeModal
                        }
                    >

                        <div
                            style={
                                styles.modalPartyHeader
                            }
                        >

                            <PartyLogo
                                party={
                                    selectedParty
                                }
                                size={
                                    58
                                }
                            />

                            <div>

                                <h3
                                    style={
                                        styles.modalPartyName
                                    }
                                >
                                    {
                                        selectedParty.name
                                    }
                                </h3>

                                <StatusBadge
                                    status={
                                        selectedParty.is_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                />

                            </div>

                        </div>

                        <div
                            style={
                                styles.infoBox
                            }
                        >

                            <strong>
                                Current Status
                            </strong>

                            <p>
                                This party
                                list is
                                currently{" "}
                                <strong>
                                    {selectedParty.is_active
                                        ? "Active"
                                        : "Inactive"}
                                </strong>
                                .
                            </p>

                        </div>

                        <div
                            style={
                                styles.modalActions
                            }
                        >

                            {selectedParty.is_active ? (

                                <button
                                    type="button"
                                    style={
                                        styles.deactivateButton
                                    }
                                    onClick={() =>
                                        handleDeactivate(
                                            selectedParty
                                        )
                                    }
                                    disabled={
                                        actionLoading ===
                                        `deactivate-${selectedParty.id}`
                                    }
                                >
                                    {actionLoading ===
                                    `deactivate-${selectedParty.id}`
                                        ? "Deactivating..."
                                        : "Deactivate"}
                                </button>

                            ) : (

                                <button
                                    type="button"
                                    style={
                                        styles.activateButton
                                    }
                                    onClick={() =>
                                        handleActivate(
                                            selectedParty
                                        )
                                    }
                                    disabled={
                                        actionLoading ===
                                        `activate-${selectedParty.id}`
                                    }
                                >
                                    {actionLoading ===
                                    `activate-${selectedParty.id}`
                                        ? "Activating..."
                                        : "Activate"}
                                </button>

                            )}

                        </div>

                    </Modal>
                )}

            {/* =================================================
                CANDIDATES MODAL
            ================================================= */}

            {modal ===
                "candidates" &&
                selectedParty && (

                    <Modal
                        title="Party Candidates"
                        onClose={
                            closeModal
                        }
                        wide
                    >

                        <div
                            style={
                                styles.modalPartyHeader
                            }
                        >

                            <PartyLogo
                                party={
                                    selectedParty
                                }
                                size={
                                    58
                                }
                            />

                            <div>

                                <h3
                                    style={
                                        styles.modalPartyName
                                    }
                                >
                                    {
                                        selectedParty.name
                                    }
                                </h3>

                                <p
                                    style={
                                        styles.modalPartyDescription
                                    }
                                >
                                    Candidates
                                    associated
                                    with this
                                    party list.
                                </p>

                            </div>

                        </div>

                        {candidateLoading ? (

                            <div
                                style={
                                    styles.emptyState
                                }
                            >

                                <div
                                    style={
                                        styles.spinner
                                    }
                                />

                                <p
                                    style={
                                        styles.loadingText
                                    }
                                >
                                    Loading
                                    candidates...
                                </p>

                            </div>

                        ) : candidates.length === 0 ? (

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
                                    👥
                                </div>

                                <h4
                                    style={
                                        styles.emptyTitle
                                    }
                                >
                                    No candidates
                                    found
                                </h4>

                                <p
                                    style={
                                        styles.emptyText
                                    }
                                >
                                    No candidates
                                    are currently
                                    associated
                                    with this
                                    party list.
                                </p>

                            </div>

                        ) : (

                            <div
                                style={
                                    styles.candidateList
                                }
                            >

                                {candidates.map(
                                    (
                                        candidate,
                                        index
                                    ) => (

                                        <div
                                            key={
                                                candidate.id ||
                                                index
                                            }
                                            style={
                                                styles.candidateRow
                                            }
                                        >

                                            <div
                                                style={
                                                    styles.candidateNumber
                                                }
                                            >
                                                {index +
                                                    1}
                                            </div>

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
                                                            candidate.full_name ||
                                                            "Candidate"
                                                        }
                                                        style={
                                                            styles.avatarImage
                                                        }
                                                    />

                                                ) : (

                                                    String(
                                                        candidate.full_name ||
                                                        "C"
                                                    )
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase()

                                                )}

                                            </div>

                                            <div
                                                style={
                                                    styles.candidateInfo
                                                }
                                            >

                                                <strong>
                                                    {
                                                        candidate.full_name ||
                                                        "Unnamed Candidate"
                                                    }
                                                </strong>

                                                <span>
                                                    {candidate
                                                        .position
                                                        ?.name ||
                                                        candidate.position_name ||
                                                        "Position not specified"}
                                                </span>

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </Modal>
                )}

            {/* =================================================
                CONFIRMATION MODAL
            ================================================= */}

            {confirmation && (

                <ConfirmationModal
                    title={
                        confirmation.title
                    }
                    message={
                        confirmation.message
                    }
                    confirmText={
                        confirmation.confirmText
                    }
                    cancelText={
                        confirmation.cancelText
                    }
                    onConfirm={
                        confirmation.onConfirm
                    }
                    onCancel={() =>
                        setConfirmation(
                            null
                        )
                    }
                    loading={
                        saving ||
                        actionLoading !== ""
                    }
                />

            )}

        </div>
    );
};

// =====================================================
// STAT CARD
// =====================================================

const StatCard = ({
    title,
    value,
    icon,
}) => {
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

                <p
                    style={
                        styles.statTitle
                    }
                >
                    {title}
                </p>

                <h3
                    style={
                        styles.statValue
                    }
                >
                    {value}
                </h3>

            </div>

        </div>
    );
};

// =====================================================
// FEATURE CARD
// =====================================================

const Feature = ({
    number,
    title,
    description,
    onClick,
}) => {
    return (
        <button
    type="button"
    className="plm-feature-card"
    style={styles.feature}
    onClick={onClick}
>

<div
    className="plm-feature-number"
    style={styles.number}
>
    {number}
</div>

<div
    className="plm-feature-content"
    style={styles.featureContent}
>

<h4
    className="plm-feature-title"
    style={styles.featureTitle}
>
    {title}
</h4>
<p
    className="plm-feature-description"
    style={styles.featureDescription}
>
    {description}
</p>
            </div>

<div
    className="plm-feature-arrow"
    style={styles.featureArrow}
>
    →
</div>

        </button>
    );
};

// =====================================================
// PARTY ROW
// =====================================================

const PartyRow = ({
    party,
    onEdit,
    onLogo,
    onCandidates,
    onApproval,
    onStatus,
    onApprove,
    onReject,
    onActivate,
    onDeactivate,
    actionLoading,
}) => {
    return (
        <div
            className="party-row"
            style={
                styles.partyRow
            }
        >

            <PartyLogo
                party={party}
                size={52}
            />

            <div
                className="party-main"
                style={
                    styles.partyMain
                }
            >

                <div
                    className="party-name-row"
                    style={
                        styles.partyNameRow
                    }
                >

                    <h4
                        className="party-name"
                        style={
                            styles.partyName
                        }
                    >
                        {party.name}
                    </h4>

                    <StatusBadge
                        status={
                            party.approval_status
                        }
                    />

                    <span
                        style={
                            party.is_active
                                ? styles.activeBadge
                                : styles.inactiveBadge
                        }
                    >
                        {party.is_active
                            ? "Active"
                            : "Inactive"}
                    </span>

                </div>

                <p
                    className="party-description"
                    style={
                        styles.partyDescription
                    }
                >
                    {party.description ||
                        "No description provided."}
                </p>

            </div>

            <div
                className="party-actions"
                style={
                    styles.partyActions
                }
            >

                <button
                    type="button"
                    style={
                        styles.smallButton
                    }
                    onClick={
                        onEdit
                    }
                >
                    Edit
                </button>

                <button
                    type="button"
                    style={
                        styles.smallButton
                    }
                    onClick={
                        onLogo
                    }
                >
                    Logo
                </button>

                <button
                    type="button"
                    style={
                        styles.smallButton
                    }
                    onClick={
                        onCandidates
                    }
                >
                    Candidates
                </button>

                <button
                    type="button"
                    style={
                        styles.smallButton
                    }
                    onClick={
                        onApproval
                    }
                >
                    Review
                </button>

                {party.approval_status ===
                    "pending" && (
                    <>
                        <button
                            type="button"
                            style={
                                styles.smallApproveButton
                            }
                            onClick={
                                onApprove
                            }
                            disabled={
                                actionLoading ===
                                `approve-${party.id}`
                            }
                        >
                            {actionLoading ===
                            `approve-${party.id}`
                                ? "Approving..."
                                : "Approve"}
                        </button>

                        <button
                            type="button"
                            style={
                                styles.smallRejectButton
                            }
                            onClick={
                                onReject
                            }
                            disabled={
                                actionLoading ===
                                `reject-${party.id}`
                            }
                        >
                            {actionLoading ===
                            `reject-${party.id}`
                                ? "Rejecting..."
                                : "Reject"}
                        </button>
                    </>
                )}

                <button
                    type="button"
                    style={
                        party.is_active
                            ? styles.smallDeactivateButton
                            : styles.smallActivateButton
                    }
                    onClick={
                        onStatus
                    }
                >
                    {party.is_active
                        ? "Deactivate"
                        : "Activate"}
                </button>

            </div>

        </div>
    );
};

// =====================================================
// PARTY LOGO
// =====================================================

const PartyLogo = ({
    party,
    size = 52,
}) => {

    const [
        failed,
        setFailed,
    ] = useState(false);

    if (
        party?.logo_url &&
        !failed
    ) {
        return (
            <img
                src={
                    party.logo_url
                }
                alt={`${party.name || "Party"} logo`}
                style={{
                    ...styles.partyLogo,
                    width: `${size}px`,
                    height: `${size}px`,
                }}
                onError={() =>
                    setFailed(true)
                }
            />
        );
    }

    return (
        <div
            style={{
                ...styles.partyLogoPlaceholder,
                width: `${size}px`,
                height: `${size}px`,
            }}
        >
            {String(
                party?.name ||
                "P"
            )
                .charAt(0)
                .toUpperCase()}
        </div>
    );
};

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
    status,
}) => {

    const normalized =
        String(
            status || ""
        ).toLowerCase();

    let label = "Pending";
    let style =
        styles.pendingBadge;

    if (
        normalized ===
        "approved"
    ) {
        label = "Approved";
        style =
            styles.approvedBadge;
    }

    if (
        normalized ===
        "rejected"
    ) {
        label = "Rejected";
        style =
            styles.rejectedBadge;
    }

    if (
        normalized ===
        "active"
    ) {
        label = "Active";
        style =
            styles.approvedBadge;
    }

    if (
        normalized ===
        "inactive"
    ) {
        label = "Inactive";
        style =
            styles.rejectedBadge;
    }

    return (
        <span
            style={
                style
            }
        >
            {label}
        </span>
    );
};

// =====================================================
// CONFIRMATION MODAL
// =====================================================

const ConfirmationModal = ({
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    loading,
}) => {
    return (
        <div
            style={
                styles.confirmOverlay
            }
        >

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

                <h3
                    style={
                        styles.confirmTitle
                    }
                >
                    {title}
                </h3>

                <p
                    style={
                        styles.confirmMessage
                    }
                >
                    {message}
                </p>

                <div
                    style={
                        styles.confirmActions
                    }
                >

                    <button
                        type="button"
                        style={
                            styles.confirmCancelButton
                        }
                        onClick={
                            onCancel
                        }
                        disabled={
                            loading
                        }
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        style={
                            styles.confirmYesButton
                        }
                        onClick={
                            onConfirm
                        }
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Processing..."
                            : confirmText}
                    </button>

                </div>

            </div>

        </div>
    );
};

// =====================================================
// STANDARD MODAL
// =====================================================

const Modal = ({
    title,
    children,
    onClose,
    wide = false,
}) => {
    return (
        <div
            style={
                styles.modalOverlay
            }
        >

            <div
                style={{
                    ...styles.modal,
                    ...(wide
                        ? styles.modalWide
                        : {}),
                }}
            >

                <div
                    style={
                        styles.modalHeader
                    }
                >

                    <h3
                        style={
                            styles.modalTitle
                        }
                    >
                        {title}
                    </h3>

                    <button
                        type="button"
                        style={
                            styles.modalClose
                        }
                        onClick={
                            onClose
                        }
                    >
                        ×
                    </button>

                </div>

                <div
                    style={
                        styles.modalBody
                    }
                >
                    {children}
                </div>

            </div>

        </div>
    );
};

// =====================================================
// STYLES
// =====================================================

const styles = {

    container: {
        width: "100%",
    },

    header: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "17px",
        padding: "25px",
        display: "flex",
        alignItems: "center",
        gap: "17px",
        marginBottom: "20px",
    },

    icon: {
        width: "55px",
        height: "55px",
        borderRadius: "14px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px",
        fontWeight: "800",
    },

    title: {
        margin: 0,
        fontSize: "21px",
        fontWeight: "800",
        color: "#172033",
    },

    description: {
        margin: "5px 0 0",
        fontSize: "12px",
        color: "#7c8798",
    },

    primaryButton: {
        border: "none",
        borderRadius: "10px",
        background: "#266EFF",
        color: "#ffffff",
        padding: "11px 17px",
        fontSize: "12px",
        fontWeight: "800",
        cursor: "pointer",
        whiteSpace: "nowrap",
    },

    secondaryButton: {
        border: "1px solid #dbe2ee",
        borderRadius: "10px",
        background: "#ffffff",
        color: "#334155",
        padding: "10px 15px",
        fontSize: "12px",
        fontWeight: "700",
        cursor: "pointer",
    },

    successMessage: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#ecfdf3",
        border: "1px solid #bbf7d0",
        color: "#15803d",
        borderRadius: "12px",
        padding: "13px 16px",
        marginBottom: "15px",
        fontSize: "12px",
        fontWeight: "700",
    },

    errorMessage: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        borderRadius: "12px",
        padding: "13px 16px",
        marginBottom: "15px",
        fontSize: "12px",
        fontWeight: "700",
    },

    messageIcon: {
        width: "23px",
        height: "23px",
        minWidth: "23px",
        borderRadius: "50%",
        background: "#266EFF",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
    },

    closeMessage: {
        marginLeft: "auto",
        border: "none",
        background: "transparent",
        color: "inherit",
        fontSize: "20px",
        cursor: "pointer",
    },

    electionCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "17px",
        padding: "20px 25px",
        marginBottom: "20px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "20px",
    },

    label: {
        display: "block",
        marginBottom: "7px",
        fontSize: "11px",
        fontWeight: "800",
        color: "#4b5563",
    },

    select: {
        minWidth: "330px",
        border: "1px solid #dbe2ee",
        borderRadius: "9px",
        background: "#ffffff",
        padding: "11px 13px",
        color: "#172033",
        fontSize: "12px",
        outline: "none",
    },

    statsGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px",
        marginBottom: "20px",
    },

    statCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "14px",
        padding: "17px",
        display: "flex",
        alignItems: "center",
        gap: "13px",
    },

    statIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
    },

    statTitle: {
        margin: 0,
        color: "#7c8798",
        fontSize: "10px",
        fontWeight: "700",
    },

    statValue: {
        margin: "3px 0 0",
        color: "#172033",
        fontSize: "20px",
        fontWeight: "800",
    },

    card: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "17px",
        padding: "25px",
        marginBottom: "20px",
    },

    cardHeader: {
        marginBottom: "20px",
    },

    cardTitle: {
        margin: 0,
        fontSize: "16px",
        fontWeight: "800",
        color: "#172033",
    },

    cardSubtitle: {
        margin: "5px 0 0",
        color: "#7c8798",
        fontSize: "11px",
    },

    featureGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "15px",
    },

    feature: {
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: "13px",
        padding: "16px",
        background: "#f8faff",
        borderRadius: "12px",
        border: "1px solid #edf1f7",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        transition:
            "all 0.2s ease",
        appearance: "none",
    },

    number: {
        width: "32px",
        height: "32px",
        minWidth: "32px",
        borderRadius: "50%",
        background: "#266EFF",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: "800",
    },

    featureContent: {
        flex: 1,
    },

    featureTitle: {
        margin: "1px 0 5px",
        fontSize: "13px",
        fontWeight: "800",
        color: "#172033",
    },

    featureDescription: {
        margin: 0,
        fontSize: "11px",
        color: "#7c8798",
        lineHeight: 1.55,
    },

    featureArrow: {
        color: "#266EFF",
        fontSize: "18px",
        fontWeight: "800",
        alignSelf: "center",
    },

    tableHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        marginBottom: "20px",
    },

    searchWrapper: {
        position: "relative",
        width: "240px",
    },

    searchIcon: {
        position: "absolute",
        left: "11px",
        top: "50%",
        transform:
            "translateY(-50%)",
        fontSize: "12px",
    },

    searchInput: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #dbe2ee",
        borderRadius: "9px",
        padding:
            "10px 12px 10px 32px",
        fontSize: "11px",
        outline: "none",
    },

    partyListContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },

    partyRow: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "15px",
        border: "1px solid #edf1f7",
        borderRadius: "12px",
        background: "#fbfcff",
    },

    partyLogo: {
        objectFit: "cover",
        borderRadius: "12px",
        border: "1px solid #e5eaf2",
        background: "#ffffff",
        flexShrink: 0,
    },

    partyLogoPlaceholder: {
        borderRadius: "12px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "19px",
        fontWeight: "800",
        flexShrink: 0,
    },

    partyMain: {
        flex: 1,
        minWidth: 0,
    },

    partyNameRow: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        flexWrap: "wrap",
    },

    partyName: {
        margin: 0,
        fontSize: "13px",
        color: "#172033",
        fontWeight: "800",
    },

    partyDescription: {
        margin: "6px 0 0",
        fontSize: "11px",
        color: "#7c8798",
    },

    partyActions: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    },

    smallButton: {
        border: "1px solid #dbe2ee",
        background: "#ffffff",
        color: "#334155",
        borderRadius: "7px",
        padding: "7px 9px",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
    },

    smallApproveButton: {
        border: "none",
        background: "#16a34a",
        color: "#ffffff",
        borderRadius: "7px",
        padding: "7px 9px",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
    },

    smallRejectButton: {
        border: "none",
        background: "#dc2626",
        color: "#ffffff",
        borderRadius: "7px",
        padding: "7px 9px",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
    },

    smallActivateButton: {
        border: "none",
        background: "#16a34a",
        color: "#ffffff",
        borderRadius: "7px",
        padding: "7px 9px",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
    },

    smallDeactivateButton: {
        border: "none",
        background: "#f59e0b",
        color: "#ffffff",
        borderRadius: "7px",
        padding: "7px 9px",
        fontSize: "10px",
        fontWeight: "700",
        cursor: "pointer",
    },

    pendingBadge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "4px 8px",
        background: "#fff7ed",
        color: "#c2410c",
        fontSize: "9px",
        fontWeight: "800",
    },

    approvedBadge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "4px 8px",
        background: "#ecfdf3",
        color: "#15803d",
        fontSize: "9px",
        fontWeight: "800",
    },

    rejectedBadge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "4px 8px",
        background: "#fef2f2",
        color: "#b91c1c",
        fontSize: "9px",
        fontWeight: "800",
    },

    activeBadge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "4px 8px",
        background: "#eff6ff",
        color: "#2563eb",
        fontSize: "9px",
        fontWeight: "800",
    },

    inactiveBadge: {
        display: "inline-flex",
        alignItems: "center",
        borderRadius: "20px",
        padding: "4px 8px",
        background: "#f1f5f9",
        color: "#64748b",
        fontSize: "9px",
        fontWeight: "800",
    },

    emptyState: {
        padding: "45px 20px",
        textAlign: "center",
        border: "1px dashed #dbe2ee",
        borderRadius: "12px",
    },

    emptyIcon: {
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        margin: "0 auto 12px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "800",
    },

    emptyTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "14px",
        fontWeight: "800",
    },

    emptyText: {
        margin: "7px auto 16px",
        maxWidth: "430px",
        color: "#7c8798",
        fontSize: "11px",
        lineHeight: 1.6,
    },

    loadingCard: {
        background: "#ffffff",
        border: "1px solid #e7ebf2",
        borderRadius: "17px",
        padding: "60px 20px",
        textAlign: "center",
    },

    loadingText: {
        margin: "12px 0 0",
        color: "#7c8798",
        fontSize: "11px",
    },

    spinner: {
        width: "25px",
        height: "25px",
        borderRadius: "50%",
        border: "3px solid #e5e7eb",
        borderTop:
            "3px solid #266EFF",
        animation:
            "votaraPartySpinner 0.8s linear infinite",
        margin: "0 auto",
    },

    formGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(2, minmax(0, 1fr))",
        gap: "15px",
    },

    formGroup: {
        marginBottom: "17px",
    },

    input: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #dbe2ee",
        borderRadius: "9px",
        padding: "11px 12px",
        fontSize: "12px",
        outline: "none",
        color: "#172033",
    },

    textarea: {
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #dbe2ee",
        borderRadius: "9px",
        padding: "11px 12px",
        fontSize: "12px",
        outline: "none",
        resize: "vertical",
        color: "#172033",
        fontFamily: "inherit",
    },

    logoPreviewBox: {
        border: "1px solid #edf1f7",
        borderRadius: "12px",
        padding: "15px",
        marginBottom: "18px",
        background: "#f8faff",
    },

    previewLabel: {
        display: "block",
        fontSize: "10px",
        color: "#7c8798",
        fontWeight: "800",
        marginBottom: "10px",
    },

    logoPreview: {
        width: "90px",
        height: "90px",
        objectFit: "cover",
        borderRadius: "12px",
        background: "#ffffff",
        border: "1px solid #e5eaf2",
    },

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(15, 23, 42, 0.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 9999,
    },

    modal: {
        width: "100%",
        maxWidth: "540px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#ffffff",
        borderRadius: "17px",
        boxShadow:
            "0 25px 70px rgba(15, 23, 42, 0.22)",
    },

    modalWide: {
        maxWidth: "720px",
    },

    modalHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent:
            "space-between",
        padding: "18px 20px",
        borderBottom:
            "1px solid #edf1f7",
    },

    modalTitle: {
        margin: 0,
        color: "#172033",
        fontSize: "16px",
        fontWeight: "800",
    },

    modalClose: {
        width: "30px",
        height: "30px",
        border: "none",
        borderRadius: "8px",
        background: "#f1f5f9",
        color: "#64748b",
        fontSize: "20px",
        cursor: "pointer",
    },

    modalBody: {
        padding: "20px",
    },

    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "9px",
        paddingTop: "5px",
    },

    cancelButton: {
        border: "1px solid #dbe2ee",
        borderRadius: "9px",
        background: "#ffffff",
        color: "#475569",
        padding: "10px 15px",
        fontSize: "11px",
        fontWeight: "700",
        cursor: "pointer",
    },

    modalPartyHeader: {
        display: "flex",
        alignItems: "center",
        gap: "13px",
        marginBottom: "18px",
    },

    modalPartyName: {
        margin: "0 0 7px",
        fontSize: "16px",
        fontWeight: "800",
        color: "#172033",
    },

    modalPartyDescription: {
        margin: 0,
        color: "#7c8798",
        fontSize: "11px",
    },

    infoBox: {
        padding: "14px",
        background: "#f8faff",
        border: "1px solid #e7ebf2",
        borderRadius: "10px",
        marginBottom: "15px",
        color: "#475569",
        fontSize: "11px",
        lineHeight: 1.6,
    },

    remarksBox: {
        padding: "14px",
        background: "#fff8e7",
        border: "1px solid #f4e0a8",
        borderRadius: "10px",
        marginBottom: "15px",
        color: "#6f6242",
        fontSize: "11px",
        lineHeight: 1.6,
    },

    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "9px",
        marginTop: "18px",
    },

    approveButton: {
        border: "none",
        borderRadius: "9px",
        background: "#16a34a",
        color: "#ffffff",
        padding: "10px 16px",
        fontSize: "11px",
        fontWeight: "800",
        cursor: "pointer",
    },

    rejectButton: {
        border: "none",
        borderRadius: "9px",
        background: "#dc2626",
        color: "#ffffff",
        padding: "10px 16px",
        fontSize: "11px",
        fontWeight: "800",
        cursor: "pointer",
    },

    activateButton: {
        border: "none",
        borderRadius: "9px",
        background: "#16a34a",
        color: "#ffffff",
        padding: "10px 16px",
        fontSize: "11px",
        fontWeight: "800",
        cursor: "pointer",
    },

    deactivateButton: {
        border: "none",
        borderRadius: "9px",
        background: "#f59e0b",
        color: "#ffffff",
        padding: "10px 16px",
        fontSize: "11px",
        fontWeight: "800",
        cursor: "pointer",
    },

    candidateList: {
        display: "flex",
        flexDirection: "column",
        gap: "9px",
    },

    candidateRow: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        border: "1px solid #edf1f7",
        borderRadius: "10px",
        background: "#fbfcff",
    },

    candidateNumber: {
        width: "25px",
        height: "25px",
        borderRadius: "50%",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        fontWeight: "800",
    },

    candidateAvatar: {
        width: "42px",
        height: "42px",
        borderRadius: "50%",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "800",
        overflow: "hidden",
        flexShrink: 0,
    },

    avatarImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
    },

    candidateInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        fontSize: "11px",
    },

    // =====================================================
    // PARTY SELECTION
    // =====================================================

    modalInstruction: {
        margin: "0 0 16px",
        color: "#7c8798",
        fontSize: "11px",
        lineHeight: 1.6,
    },

    partySelectionList: {
        display: "flex",
        flexDirection: "column",
        gap: "9px",
    },

    partySelectionItem: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px",
        border: "1px solid #e7ebf2",
        borderRadius: "11px",
        background: "#fbfcff",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "inherit",
        appearance: "none",
    },

    partySelectionInfo: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },

    partySelectionInfoName: {
        fontSize: "12px",
        color: "#172033",
        fontWeight: "800",
    },

    partySelectionInfoStatus: {
        fontSize: "10px",
        color: "#7c8798",
    },

    selectionArrow: {
        color: "#266EFF",
        fontSize: "18px",
        fontWeight: "800",
    },

    // =====================================================
    // CONFIRMATION POPUP
    // =====================================================

    confirmOverlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(15, 23, 42, 0.58)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 10000,
    },

    confirmModal: {
        width: "100%",
        maxWidth: "420px",
        background: "#ffffff",
        borderRadius: "17px",
        padding: "28px",
        textAlign: "center",
        boxShadow:
            "0 25px 80px rgba(15, 23, 42, 0.28)",
    },

    confirmIcon: {
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        margin: "0 auto 15px",
        background: "#edf3ff",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        fontWeight: "800",
    },

    confirmTitle: {
        margin: "0 0 9px",
        color: "#172033",
        fontSize: "17px",
        fontWeight: "800",
    },

    confirmMessage: {
        margin: "0 auto",
        maxWidth: "340px",
        color: "#64748b",
        fontSize: "12px",
        lineHeight: 1.7,
    },

    confirmActions: {
        display: "flex",
        justifyContent: "center",
        gap: "10px",
        marginTop: "23px",
    },

    confirmCancelButton: {
        minWidth: "90px",
        border: "1px solid #dbe2ee",
        borderRadius: "9px",
        background: "#ffffff",
        color: "#475569",
        padding: "10px 14px",
        fontSize: "11px",
        fontWeight: "800",
        cursor: "pointer",
    },

    confirmYesButton: {
        minWidth: "130px",
        border: "none",
        borderRadius: "9px",
        background: "#266EFF",
        color: "#ffffff",
        padding: "10px 14px",
        fontSize: "11px",
        fontWeight: "800",
        cursor: "pointer",
    },
};

// =====================================================
// SPINNER ANIMATION
// =====================================================

if (
    typeof document !==
        "undefined" &&
    !document.getElementById(
        "votara-party-spinner"
    )
) {
    const styleElement =
        document.createElement(
            "style"
        );

    styleElement.id =
        "votara-party-spinner";

    styleElement.innerHTML = `
        @keyframes votaraPartySpinner {
            from {
                transform: rotate(0deg);
            }

            to {
                transform: rotate(360deg);
            }
        }
    `;

    document.head.appendChild(
        styleElement
    );
}

// =====================================================
// EXPORT
// =====================================================

export default PartyListManagement;