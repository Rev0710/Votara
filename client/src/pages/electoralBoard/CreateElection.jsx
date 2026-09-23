import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createElection } from "../../services/electionService";
import "./CreateElection.css";

const YEAR_LEVELS = ["2nd Year", "3rd Year", "4th Year"];
const ELECTION_TYPES = ["Party list only", "Individual only"];

const INITIAL_FORM = {
    title: "",
    description: "",
    electionType: "Party list only",
    yearLevel: "",
    electionDate: "",
    startTime: "08:00",
    endTime: "17:00",
};

function CreateElection({ onBack }) {
    const navigate = useNavigate();
    const [form, setForm] = useState(INITIAL_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const stepOneComplete = useMemo(
        () => form.title.trim().length > 0 && form.description.trim().length > 0,
        [form.title, form.description]
    );

    const stepTwoComplete = useMemo(
        () =>
            Boolean(
                form.electionType &&
                    form.yearLevel &&
                    form.electionDate &&
                    form.startTime &&
                    form.endTime &&
                    form.startTime < form.endTime
            ),
        [form]
    );

    const updateField = (name, value) => {
        setError("");
        setSuccess("");
        setForm((current) => ({ ...current, [name]: value }));
    };

    const selectYearLevel = (yearLevel) => {
        setError("");
        setSuccess("");

        // Exactly one year level is allowed.
        setForm((current) => ({
            ...current,
            yearLevel,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!stepOneComplete) {
            setError("Complete all fields in Step 1 first.");
            return;
        }

        if (!form.yearLevel) {
            setError("Select exactly one eligible year level.");
            return;
        }

        if (!form.electionDate) {
            setError("Election date is required.");
            return;
        }

        if (!form.startTime || !form.endTime) {
            setError("Start time and end time are required.");
            return;
        }

        if (form.startTime >= form.endTime) {
            setError("End time must be later than start time.");
            return;
        }

        try {
            setSaving(true);

            const response = await createElection({
                title: form.title.trim(),
                description: form.description.trim(),
                electionType: form.electionType,
                electionDate: form.electionDate,
                startTime: form.startTime,
                endTime: form.endTime,
                yearLevelAccess: [form.yearLevel],
            });

            const created =
                response?.election ||
                response?.data?.election ||
                response?.data ||
                response;

            setSuccess(
                `"${created?.title || form.title.trim()}" was created successfully.`
            );

            // Give the success message a moment to be visible before returning.
            window.setTimeout(() => {
                if (onBack) {
                    onBack();
                } else {
                    navigate(-1);
                }
            }, 700);
        } catch (err) {
            console.error("Create election error:", err);
            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to create election."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="create-election-page">
            <div className="create-election-shell">
                <button
                    type="button"
                    className="create-election-back"
                    onClick={() => {
                        if (onBack) {
                            onBack();
                        } else {
                            navigate(-1);
                        }
                    }}
                >
                    <span>‹</span> Back
                </button>

                <div className="create-election-badge">
                    <span /> Election
                </div>

                <div className="create-election-heading">
                    <h1>Create New Election</h1>
                    <p>Create, configure, publish, and manage VOTARA elections.</p>
                </div>

                <form onSubmit={handleSubmit} className="create-election-form">
                    <div className="create-step active-step">
                        <div className="create-step-marker">1</div>
                        <div className="create-step-line" />

                        <div className="create-step-content">
                            <h2>General</h2>

                            <label className="create-field">
                                <span>Election Name</span>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(event) =>
                                        updateField("title", event.target.value)
                                    }
                                    placeholder="e.g. SSG Election 2026"
                                    autoComplete="off"
                                    required
                                />
                                <small>Use a clear election name with the year included.</small>
                            </label>

                            <label className="create-field">
                                <span>Description</span>
                                <textarea
                                    value={form.description}
                                    onChange={(event) =>
                                        updateField("description", event.target.value)
                                    }
                                    placeholder="Describe the purpose of this election..."
                                    rows="2"
                                    required
                                />
                            </label>
                        </div>
                    </div>

                    <div
                        className={`create-step step-two ${
                            stepOneComplete ? "step-two-visible" : "step-two-hidden"
                        }`}
                        aria-hidden={!stepOneComplete}
                    >
                        <div className="create-step-marker">2</div>
                        <div className="create-step-line" />

                        <div className="create-step-content">
                            <h2>Configuration</h2>

                            <div className="type-card">
                                <div>
                                    <strong>Choose Election Type</strong>
                                    <small>
                                        Select whether the election is for party lists or individual candidates.
                                    </small>
                                </div>

                                <select
                                    value={form.electionType}
                                    onChange={(event) =>
                                        updateField("electionType", event.target.value)
                                    }
                                    aria-label="Election type"
                                >
                                    {ELECTION_TYPES.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="year-level-section">
                                <div className="field-heading-row">
                                    <div>
                                        <span>Eligible Year Levels</span>
                                        <small>Select exactly one year level.</small>
                                    </div>
                                    <span className="required-label">Required</span>
                                </div>

                                <div className="year-level-options">
                                    {YEAR_LEVELS.map((yearLevel) => {
                                        const selected = form.yearLevel === yearLevel;

                                        return (
                                            <label
                                                key={yearLevel}
                                                className={`year-level-option ${
                                                    selected ? "selected" : ""
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => selectYearLevel(yearLevel)}
                                                />
                                                <span className="custom-checkbox">
                                                    {selected ? "✓" : ""}
                                                </span>
                                                <span>{yearLevel}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="schedule-grid">
                                <label className="create-field compact-field">
                                    <span>Date</span>
                                    <div className="input-with-icon">
                                        <input
                                            type="date"
                                            value={form.electionDate}
                                            onChange={(event) =>
                                                updateField("electionDate", event.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="create-field compact-field">
                                    <span>Start time</span>
                                    <div className="input-with-icon">
                                        <span className="clock-icon">◷</span>
                                        <input
                                            type="time"
                                            value={form.startTime}
                                            onChange={(event) =>
                                                updateField("startTime", event.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </label>

                                <label className="create-field compact-field">
                                    <span>End time</span>
                                    <div className="input-with-icon">
                                        <span className="clock-icon">◷</span>
                                        <input
                                            type="time"
                                            value={form.endTime}
                                            onChange={(event) =>
                                                updateField("endTime", event.target.value)
                                            }
                                            required
                                        />
                                    </div>
                                </label>
                            </div>

                            <div className="create-step-footer">
                                {error && <div className="create-election-message error">{error}</div>}
                                {success && (
                                    <div className="create-election-message success">✓ {success}</div>
                                )}

                                <button
                                    type="submit"
                                    className="create-election-submit"
                                    disabled={saving || !stepOneComplete || !stepTwoComplete}
                                >
                                    {saving ? "Creating..." : "Create Election"}
                                    <span>↗</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {!stepOneComplete && (
                        <div className="step-locked-note">
                            <span>2</span>
                            <div>
                                <strong>Configuration is locked</strong>
                                <small>Complete the Election Name and Description to continue.</small>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default CreateElection;
