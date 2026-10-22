import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createElection } from "../../services/electionService";
import "./CreateElection.css";

const YEAR_LEVELS = ["2nd Year", "3rd Year", "4th Year"];

const INITIAL_FORM = {
    title: "",
    description: "",
    electionType: "Party list only",
    yearLevelAccess: [...YEAR_LEVELS],
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

    const updateField = (name, value) => {
        setError("");
        setSuccess("");
        setForm((current) => ({ ...current, [name]: value }));
    };

    const toggleYearLevel = (yearLevel) => {
        const selected = form.yearLevelAccess.includes(yearLevel);
        updateField(
            "yearLevelAccess",
            selected
                ? form.yearLevelAccess.filter((item) => item !== yearLevel)
                : YEAR_LEVELS.filter((item) => form.yearLevelAccess.includes(item) || item === yearLevel)
        );
    };

    const goBack = () => (onBack ? onBack() : navigate(-1));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!form.title.trim() || !form.description.trim()) {
            setError("Enter an election name and description to continue.");
            return;
        }
        if (!form.yearLevelAccess.length) {
            setError("Select at least one eligible year level.");
            return;
        }
        if (!form.electionDate || !form.startTime || !form.endTime) {
            setError("Election date, opening time, and closing time are required.");
            return;
        }
        if (form.startTime >= form.endTime) {
            setError("Closing time must be later than opening time.");
            return;
        }

        try {
            setSaving(true);
            const response = await createElection({
                title: form.title.trim(),
                description: form.description.trim(),
                electionType: form.electionType,
                yearLevelAccess: form.yearLevelAccess,
                electionDate: form.electionDate,
                startTime: form.startTime,
                endTime: form.endTime,
            });
            const created = response?.election || response?.data?.election || response?.data || response;
            setSuccess(`“${created?.title || form.title.trim()}” was saved as a draft.`);
            window.setTimeout(goBack, 700);
        } catch (err) {
            console.error("Create election error:", err);
            setError(err?.response?.data?.message || err?.message || "Failed to save the election draft.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="create-election-page">
            <section className="create-election-shell" aria-labelledby="create-election-title">
                <header className="create-election-heading">
                    <div>
                        <p className="create-election-kicker">Electoral Board / Elections</p>
                        <h1 id="create-election-title">Create an election</h1>
                        <p>Save this election as a draft, then review it before publishing.</p>
                    </div>
                    <button type="button" className="create-election-back" onClick={goBack}>Cancel</button>
                </header>

                <form onSubmit={handleSubmit} className="create-election-form">
                    <label className="create-field">
                        <span>Election name <b aria-hidden="true">*</b></span>
                        <input
                            type="text"
                            value={form.title}
                            onChange={(event) => updateField("title", event.target.value)}
                            placeholder="e.g. Student Council 2026–2027"
                            autoComplete="off"
                            required
                        />
                    </label>

                    <label className="create-field">
                        <span>Description <b aria-hidden="true">*</b></span>
                        <textarea
                            value={form.description}
                            onChange={(event) => updateField("description", event.target.value)}
                            placeholder="Describe the election and the students it serves."
                            rows={3}
                            required
                        />
                    </label>

                    <div className="create-field election-type-readonly">
                        <span>Election type</span>
                        <div className="election-type-value">
                            <strong>Party list election</strong>
                            <small>Independent candidates can be managed separately under Individual Candidacy.</small>
                        </div>
                    </div>

                    <fieldset className="year-level-field">
                        <legend>Eligible year levels <b aria-hidden="true">*</b></legend>
                        <p>Students in the selected years can participate in this election.</p>
                        <div className="year-level-options">
                            {YEAR_LEVELS.map((yearLevel) => {
                                const checked = form.yearLevelAccess.includes(yearLevel);
                                return (
                                    <label className={`year-level-option${checked ? " selected" : ""}`} key={yearLevel}>
                                        <input type="checkbox" checked={checked} onChange={() => toggleYearLevel(yearLevel)} />
                                        <span className="year-level-check" aria-hidden="true">{checked ? "✓" : ""}</span>
                                        {yearLevel}
                                    </label>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="schedule-grid">
                        <label className="create-field compact-field">
                            <span>Voting date <b aria-hidden="true">*</b></span>
                            <input type="date" value={form.electionDate} onChange={(event) => updateField("electionDate", event.target.value)} required />
                        </label>
                        <label className="create-field compact-field">
                            <span>Opens <b aria-hidden="true">*</b></span>
                            <input type="time" value={form.startTime} onChange={(event) => updateField("startTime", event.target.value)} required />
                        </label>
                        <label className="create-field compact-field">
                            <span>Closes <b aria-hidden="true">*</b></span>
                            <input type="time" value={form.endTime} onChange={(event) => updateField("endTime", event.target.value)} required />
                        </label>
                    </div>
                    <p className="create-election-time-note">Times use Asia/Manila (UTC+8). Closing time must be after opening time.</p>

                    <div className="create-election-footer">
                        <div className="create-election-feedback" aria-live="polite">
                            {error && <p className="create-election-message error">{error}</p>}
                            {success && <p className="create-election-message success">{success}</p>}
                        </div>
                        <button type="button" className="create-election-cancel" onClick={goBack} disabled={saving}>Cancel</button>
                        <button type="submit" className="create-election-submit" disabled={saving}>
                            {saving ? "Saving…" : "Save election draft"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}

export default CreateElection;
