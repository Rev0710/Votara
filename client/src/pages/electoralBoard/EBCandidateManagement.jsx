import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./EBCandidateManagement.css";
import VotaraLogo from "/src/images/Votara.png";

const getId = (item) => item?.id || item?._id || "";

const getArray = (response, keys = []) => {
    if (Array.isArray(response?.data)) return response.data;
    for (const key of keys) {
        if (Array.isArray(response?.data?.[key])) return response.data[key];
    }
    return [];
};

function EBCandidateManagement({ onOpenPartyList }) {
    const navigate = useNavigate();
    const [elections, setElections] = useState([]);
    const [selectedElectionId, setSelectedElectionId] = useState("");
    const [partyLists, setPartyLists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [search, setSearch] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ name: "", logo_url: "", description: "" });

    const selectedElection = useMemo(
        () => elections.find((e) => String(getId(e)) === String(selectedElectionId)),
        [elections, selectedElectionId]
    );

    const loadElections = async () => {
        try {
            const response = await api.get("/elections");
            const list = getArray(response, ["elections", "data", "items"]);
            setElections(list);
            if (!selectedElectionId && list.length) setSelectedElectionId(String(getId(list[0])));
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to load elections.");
        }
    };

    const loadPartyLists = async (electionId = selectedElectionId) => {
        if (!electionId) {
            setPartyLists([]);
            return;
        }
        try {
            setLoading(true);
            setError("");
            const response = await api.get("/party-lists", {
                params: { election_id: electionId },
            });
            setPartyLists(
                getArray(response, ["partyLists", "party_lists", "data", "items"])
            );
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to load party lists.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadElections();
    }, []);

    useEffect(() => {
        loadPartyLists();
    }, [selectedElectionId]);

    const filteredPartyLists = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return partyLists;
        return partyLists.filter((party) =>
            String(party?.name || "").toLowerCase().includes(keyword)
        );
    }, [partyLists, search]);

    const openAddModal = () => {
        if (!selectedElectionId) {
            setError("Please select an election first.");
            return;
        }
        setError("");
        setSuccess("");
        setForm({ name: "", logo_url: "", description: "" });
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        if (saving) return;
        setShowAddModal(false);
        setForm({ name: "", logo_url: "", description: "" });
    };

    const handleAddPartyList = async (event) => {
        event.preventDefault();
        const name = form.name.trim();

        if (!selectedElectionId) {
            setError("Please select an election first.");
            return;
        }
        if (!name) {
            setError("Party list name is required.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            await api.post("/party-lists", {
                election_id: selectedElectionId,
                name,
                description: form.description.trim(),
                logo_url: form.logo_url.trim(),
            });

            closeAddModal();
            setSuccess(`"${name}" party list was added successfully.`);
            await loadPartyLists(selectedElectionId);
        } catch (err) {
            setError(err?.response?.data?.message || "Unable to add party list.");
        } finally {
            setSaving(false);
        }
    };

    const openPartyList = (party) => {
        if (!party) return;

        const navigationState = {
            partyListId: getId(party),
            partyListName: party.name || "Party List",
            electionId: selectedElectionId,
        };

        // Keep the optional callback for embedded dashboard usage.
        // When this page is used as a route, always navigate to the
        // dedicated ManagePartyList page so clicking a party never does nothing.
        if (typeof onOpenPartyList === "function") {
            onOpenPartyList(navigationState);
            return;
        }

        navigate("/electoral-board/manage-party-list", {
            state: navigationState,
        });
    };

    return (
        <div className="partylist-page">
            <main className="partylist-main">

                <div className="partylist-pill">
                    <span /> Partylist
                </div>

                <section className="partylist-heading">
                    <div>
                        <h1>Partylist Management</h1>
                        <p>Register party lists, verify their documents, and track every filing from submission to approval.</p>
                    </div>
                    <div className="partylist-controls">
                        <select
                            value={selectedElectionId}
                            onChange={(e) => setSelectedElectionId(e.target.value)}
                            aria-label="Election"
                        >
                            <option value="">Election</option>
                            {elections.map((election) => (
                                <option key={getId(election)} value={getId(election)}>
                                    {election.title || election.name || "Election"}
                                </option>
                            ))}
                        </select>
                        <button type="button" className="partylist-add-button" onClick={openAddModal}>
                            Add Party list
                        </button>
                    </div>
                </section>

                {error && <div className="partylist-alert partylist-alert-error">{error}</div>}
                {success && <div className="partylist-alert partylist-alert-success">{success}</div>}

                <section className="partylist-card">
                    <div className="partylist-card-top">
                        <h2>Partylist</h2>
                        <div className="partylist-search">
                            <span>⌕</span>
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search party list"
                            />
                        </div>
                    </div>

                    <div className="partylist-table-header">
                        <div className="partylist-check"><input type="checkbox" aria-label="Select all party lists" /></div>
                        <div>Name</div>
                        <div>Added</div>
                        <div>Actions</div>
                    </div>

                    <div className="partylist-table">
                        {loading ? (
                            <div className="partylist-empty">Loading party lists...</div>
                        ) : filteredPartyLists.length === 0 ? (
                            <div className="partylist-empty">
                                <strong>No party lists yet</strong>
                                <span>Add a party list for the selected election.</span>
                            </div>
                        ) : (
                            filteredPartyLists.map((party) => (
                                <button
                                    type="button"
                                    className="partylist-row"
                                    key={getId(party)}
                                    onClick={() => openPartyList(party)}
                                >
                                    <span className="partylist-check">
                                        <input type="checkbox" onClick={(e) => e.stopPropagation()} aria-label={`Select ${party.name}`} />
                                    </span>
                                    <span className="partylist-name-cell">
                                        <span className="partylist-avatar">
                                            {party.logo_url ? (
                                                <img src={party.logo_url} alt="" />
                                            ) : (
                                                <img src={VotaraLogo} alt="" />
                                            )}
                                        </span>
                                        <span>{party.name || "Unnamed Party List"}</span>
                                    </span>
                                    <span className="partylist-added">
                                        {party.created_at
                                            ? new Date(party.created_at).toLocaleDateString("en-US", {
                                                month: "long", day: "numeric", year: "numeric"
                                            })
                                            : "June 21, 2026"}
                                    </span>
                                    <span className="partylist-actions">
                                        <span className="partylist-action-dots">•••</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </section>
            </main>

            {showAddModal && (
                <div className="partylist-modal-backdrop" role="presentation" onMouseDown={closeAddModal}>
                    <form className="partylist-modal" onSubmit={handleAddPartyList} onMouseDown={(e) => e.stopPropagation()}>
                        <button type="button" className="partylist-modal-close" onClick={closeAddModal} disabled={saving}>×</button>
                        <div className="partylist-modal-pill"><span /> Partylist</div>
                        <h2>Partylist Management</h2>
                        <p>Review, verify, and manage official candidate party lists for the current election cycle.</p>

                        <div className="partylist-form-grid">
                            <label>
                                Partylist Name
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                                    placeholder=""
                                    autoFocus
                                />
                            </label>
                            <label>
                                Logo URL
                                <input
                                    value={form.logo_url}
                                    onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
                                />
                            </label>
                            <label className="partylist-description-field">
                                Description
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                />
                            </label>
                        </div>

                        <div className="partylist-modal-actions">
                            <button type="button" className="partylist-cancel" onClick={closeAddModal} disabled={saving}>cancel</button>
                            <button type="submit" className="partylist-submit" disabled={saving}>
                                {saving ? "Adding..." : "Add Partylist"} <span>↗</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default EBCandidateManagement;
