import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
    verifyKioskStudent,
    authorizeKioskStudent,
    submitKioskRegistration,
    approveKioskRegistration,
    setKioskPersonalPassword,
    getActiveKioskSession,
} from "../../services/kioskService";

import {
    getElectionConfiguration,
} from "../../services/electionService";

import {
    submitVote,
    checkVoteStatus,
} from "../../services/votingService";

import "./KioskVoting.css";

const YEARS = ["2nd Year", "3rd Year", "4th Year"];

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const normalizeYear = (value) => {
    const raw = String(value || "").trim().toLowerCase();
    if (raw.includes("2nd") || raw === "2") return "2nd Year";
    if (raw.includes("3rd") || raw === "3") return "3rd Year";
    if (raw.includes("4th") || raw === "4") return "4th Year";
    return value;
};

const getPositionYearAccess = (position) => {
    const direct =
        position?.yearLevels ||
        position?.year_level_access ||
        position?.position_year_levels ||
        [];

    const values = Array.isArray(direct)
        ? direct.map((item) => normalizeYear(item?.year_level || item))
        : [];

    if (values.length) return values;

    const name = String(position?.name || "").toLowerCase();

    if (name.includes("2nd year representative")) return ["2nd Year"];
    if (name.includes("3rd year representative")) return ["3rd Year"];
    if (name.includes("4th year representative")) return ["4th Year"];

    return YEARS;
};

const normalizePositions = (configuration) => {
    const raw =
        configuration?.positions ||
        configuration?.election?.positions ||
        [];

    return raw
        .filter((position) => position?.is_active !== false)
        .map((position) => ({
            ...position,
            candidates: (
                position?.candidates ||
                position?.candidate_list ||
                []
            ).filter((candidate) => candidate?.is_active !== false),
        }))
        .sort(
            (a, b) =>
                Number(a.display_order || 0) -
                Number(b.display_order || 0)
        );
};

function KioskVoting() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const sessionIdFromUrl = searchParams.get("sessionId") || "";

    const [session, setSession] = useState(null);
    const [studentId, setStudentId] = useState("");
    const [student, setStudent] = useState(null);
    const [verification, setVerification] = useState(null);

    const [step, setStep] = useState("student");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [registration, setRegistration] = useState({
        fullName: "",
        yearLevel: "",
        email: "",
        studentIdFront: null,
        studentIdBack: null,
        enrollmentProof: null,
        selfie: null,
    });

    const [registrationReview, setRegistrationReview] = useState(null);
    const [activationToken, setActivationToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [election, setElection] = useState(null);
    const [positions, setPositions] = useState([]);
    const [selections, setSelections] = useState({});
    const [submittedBallot, setSubmittedBallot] = useState(null);

    const eligiblePositions = useMemo(() => {
        if (!student?.yearLevel) return [];
        return positions.filter((position) =>
            getPositionYearAccess(position).includes(student.yearLevel)
        );
    }, [positions, student]);

    const requiredPositions = eligiblePositions.filter(
        (position) => position.is_required !== false
    );

    useEffect(() => {
        initialize();
    }, []);

    const handleBackToKioskManagement = () => {
        // When Kiosk Management opened this page in a new tab,
        // close the student kiosk tab and return to the existing
        // Kiosk Management tab.
        if (window.opener && !window.opener.closed) {
            window.close();
            return;
        }

        // Fallback for a kiosk page opened directly.
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }

        navigate("/electoral-board/dashboard");
    };

    const initialize = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getActiveKioskSession();
            const active = response?.session;

            if (!active) {
                throw new Error("There is no active kiosk session. Please return to Kiosk Management.");
            }

            if (
                sessionIdFromUrl &&
                active.id !== sessionIdFromUrl
            ) {
                throw new Error("This kiosk session is no longer the active session for this Electoral Board account.");
            }

            setSession(active);
        } catch (err) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to open the student kiosk."
            );
        } finally {
            setLoading(false);
        }
    };

    const clearStudentSession = () => {
        localStorage.removeItem("votaraKioskToken");
        localStorage.removeItem("votaraKioskStudent");
        localStorage.removeItem("votaraKioskElectionId");
        localStorage.removeItem("votaraKioskSessionId");
        localStorage.removeItem("votaraKioskMode");

        setStudent(null);
        setVerification(null);
        setSelections({});
        setElection(null);
        setPositions([]);
        setSubmittedBallot(null);
        setRegistrationReview(null);
        setActivationToken("");
        setPassword("");
        setConfirmPassword("");
        setStep("student");
        setStudentId("");
        setSuccess("");
        setError("");
    };

    const handleVerifyStudent = async (event) => {
        event.preventDefault();

        if (!session?.id) {
            setError("No active kiosk session is available.");
            return;
        }

        if (!studentId.trim()) {
            setError("Please enter the student's Student ID.");
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");

            const response = await verifyKioskStudent(
                session.id,
                studentId.trim()
            );

            setStudent(response.student);
            setVerification(response);

            if (response.accountExists) {
                setStep("verified");
            } else {
                setRegistration((current) => ({
                    ...current,
                    fullName: response.student?.fullName || "",
                    yearLevel: response.student?.yearLevel || "",
                }));
                setStep("register");
            }
        } catch (err) {
            const code = err?.response?.data?.code;

            if (code === "STUDENT_NOT_FOUND") {
                setRegistration((current) => ({
                    ...current,
                    fullName: "",
                    yearLevel: "",
                }));
                setStep("register");
            }

            setError(
                err?.response?.data?.message ||
                "Unable to verify this student."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const authorizeStudent = async () => {
        try {
            setActionLoading(true);
            setError("");

            const response = await authorizeKioskStudent(
                session.id,
                student.studentId
            );

            activateKioskToken(response);
            await loadVotingConfiguration(
                response.electionId,
                response.student
            );
        } catch (err) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Unable to authorize this student for voting."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const activateKioskToken = (response) => {
        localStorage.setItem("votaraKioskToken", response.token);
        localStorage.setItem("votaraKioskMode", "true");
        localStorage.setItem("votaraKioskStudent", JSON.stringify(response.student));
        localStorage.setItem("votaraKioskElectionId", response.electionId);
        localStorage.setItem("votaraKioskSessionId", response.sessionId);

        setStudent(response.student);
    };

    const loadVotingConfiguration = async (electionId, currentStudent = student) => {
        try {
            setActionLoading(true);
            setError("");

            const [configuration, status] = await Promise.all([
                getElectionConfiguration(electionId),
                checkVoteStatus(electionId),
            ]);

            if (status?.hasVoted) {
                throw new Error("This student has already voted in this election.");
            }

            const normalizedElection =
                configuration?.election ||
                configuration;

            const normalizedPositions = normalizePositions(configuration);

            setElection(normalizedElection);
            setPositions(normalizedPositions);
            setSelections({});
            setStudent(currentStudent);
            setStep("vote");
        } catch (err) {
            console.error(err);
            clearStudentSession();
            setError(
                err?.response?.data?.message ||
                err.message ||
                "Unable to load the voting ballot."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleRegistrationFile = async (field, event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError("Each registration file must be 5MB or smaller.");
            event.target.value = "";
            return;
        }

        try {
            const data = await readFileAsDataUrl(file);
            setRegistration((current) => ({
                ...current,
                [field]: {
                    name: file.name,
                    type: file.type,
                    data,
                },
            }));
        } catch {
            setError(`Unable to read ${file.name}.`);
        }
    };

    const submitRegistration = async (event) => {
        event.preventDefault();

        if (!registration.fullName.trim()) {
            setError("Full name is required.");
            return;
        }

        if (!YEARS.includes(registration.yearLevel)) {
            setError("Only 2nd Year, 3rd Year, and 4th Year students are eligible to vote.");
            return;
        }

        if (
            !registration.studentIdFront ||
            !registration.studentIdBack ||
            !registration.enrollmentProof ||
            !registration.selfie
        ) {
            setError("School ID front, School ID back, enrollment proof, and selfie are required.");
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");

            const response = await submitKioskRegistration({
                sessionId: session.id,
                studentId: studentId.trim(),
                fullName: registration.fullName.trim(),
                yearLevel: registration.yearLevel,
                email: registration.email.trim() || null,
                studentIdFront: registration.studentIdFront,
                studentIdBack: registration.studentIdBack,
                enrollmentProof: registration.enrollmentProof,
                selfie: registration.selfie,
            });

            setRegistrationReview(response);
            setStep("review-registration");
        } catch (err) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Unable to submit assisted registration."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const approveRegistration = async () => {
        if (!registrationReview?.registration?.id) return;

        try {
            setActionLoading(true);
            setError("");

            const response = await approveKioskRegistration({
                registrationId: registrationReview.registration.id,
                sessionId: session.id,
            });

            setActivationToken(response.activationToken);
            setStudent(response.student);
            setSuccess(
                "Registration approved. The student must create a personal 8-character password before voting."
            );
            setStep("set-password");
        } catch (err) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Unable to approve assisted registration."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const passwordRequirements = useMemo(
        () => ({
            length: password.length === 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password),
        }),
        [password]
    );

    const passwordValid = Object.values(passwordRequirements).every(Boolean);

    const setPersonalPassword = async (event) => {
        event.preventDefault();

        if (!passwordValid) {
            setError("Password must be exactly 8 characters and include uppercase, lowercase, number, and special character.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setActionLoading(true);
            setError("");

            const response = await setKioskPersonalPassword(
                activationToken,
                password
            );

            activateKioskToken({
                token: response.token,
                student: response.student,
                electionId: session.election_id,
                sessionId: session.id,
            });

            setSuccess("Personal password created successfully. Loading the ballot...");
            await loadVotingConfiguration(session.election_id, response.student);
        } catch (err) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Unable to set the student's personal password."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const selectCandidate = (positionId, candidateId) => {
        setSelections((current) => ({
            ...current,
            [positionId]: candidateId,
        }));
    };

    const submitKioskVote = async () => {
        const missing = requiredPositions.filter(
            (position) => !selections[position.id]
        );

        if (missing.length) {
            setError(
                `Please select a candidate for: ${missing
                    .map((position) => position.name)
                    .join(", ")}.`
            );
            return;
        }

        try {
            setActionLoading(true);
            setError("");
            setSuccess("");

            const formattedSelections = eligiblePositions
                .filter((position) => selections[position.id])
                .map((position) => ({
                    positionId: position.id,
                    candidateId: selections[position.id],
                }));

            const response = await submitVote(
                session.election_id,
                formattedSelections
            );

            setSubmittedBallot(response);
            setStep("complete");
        } catch (err) {
            console.error(err);
            setError(
                err?.response?.data?.message ||
                "Unable to submit the ballot."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const nextStudent = () => {
        clearStudentSession();
        initialize();
    };

    if (loading) {
        return (
            <div className="kiosk-voting-page kiosk-voting-center">
                <div className="kiosk-voting-card">
                    <div className="kiosk-voting-icon">🖥️</div>
                    <h1>Opening Student Kiosk</h1>
                    <p>Checking the active Electoral Board kiosk session...</p>
                    <div className="kiosk-voting-spinner" />
                </div>
            </div>
        );
    }

    return (
        <div className="kiosk-voting-page">
            <header className="kiosk-voting-header">
                <button
                    type="button"
                    className="kiosk-back-button"
                    onClick={handleBackToKioskManagement}
                    aria-label="Back to Kiosk Management"
                >
                    <span className="kiosk-back-arrow">←</span>
                    <span>Back to Kiosk Management</span>
                </button>

                <div className="kiosk-voting-header-info">
                    <div className="kiosk-voting-brand">VOTARA</div>
                    <h1>Student Voting Kiosk</h1>
                    <p>{session?.elections?.title || "Election"}</p>
                </div>

                <div className="kiosk-session-pill">
                    <span /> ACTIVE SESSION
                </div>
            </header>

            <main className="kiosk-voting-main">
                {error && (
                    <div className="kiosk-voting-alert error">
                        <span>!</span>
                        <div>{error}</div>
                        <button onClick={() => setError("")}>×</button>
                    </div>
                )}

                {success && (
                    <div className="kiosk-voting-alert success">
                        <span>✓</span>
                        <div>{success}</div>
                    </div>
                )}

                {step === "student" && (
                    <section className="kiosk-voting-card kiosk-id-card">
                        <div className="kiosk-voting-icon">🎓</div>
                        <h2>Enter Student ID</h2>
                        <p>Ask the student to enter their Student ID before proceeding.</p>

                        <form onSubmit={handleVerifyStudent}>
                            <input
                                value={studentId}
                                onChange={(event) => setStudentId(event.target.value)}
                                placeholder="Student ID"
                                autoFocus
                                disabled={actionLoading}
                            />
                            <button className="kiosk-main-button" disabled={actionLoading}>
                                {actionLoading ? "Verifying..." : "Verify Student"}
                            </button>
                        </form>
                    </section>
                )}

                {step === "verified" && student && (
                    <section className="kiosk-voting-card">
                        <div className="kiosk-card-heading">
                            <div>
                                <span className="kiosk-eyebrow">STUDENT VERIFIED</span>
                                <h2>{student.fullName}</h2>
                                <p>{student.studentId} · {student.yearLevel}</p>
                            </div>
                            <span className="kiosk-check">✓</span>
                        </div>

                        <div className="kiosk-verification-grid">
                            <div><span>Election</span><strong>{session?.elections?.title}</strong></div>
                            <div><span>Eligibility</span><strong>Eligible to vote</strong></div>
                            <div><span>Voting status</span><strong>Not yet voted</strong></div>
                        </div>

                        <div className="kiosk-action-row">
                            <button className="kiosk-secondary-button" onClick={clearStudentSession} disabled={actionLoading}>
                                Cancel
                            </button>
                            <button className="kiosk-main-button" onClick={authorizeStudent} disabled={actionLoading}>
                                {actionLoading ? "Authorizing..." : "Continue to Vote"}
                            </button>
                        </div>
                    </section>
                )}

                {step === "register" && (
                    <section className="kiosk-voting-card">
                        <div className="kiosk-card-heading">
                            <div>
                                <span className="kiosk-eyebrow">ASSISTED REGISTRATION</span>
                                <h2>Register Student In Person</h2>
                                <p>No existing VOTARA account was found. Complete the required verification documents.</p>
                            </div>
                        </div>

                        <form className="kiosk-registration-form" onSubmit={submitRegistration}>
                            <div className="kiosk-form-grid">
                                <label>
                                    Student ID
                                    <input value={studentId} disabled />
                                </label>
                                <label>
                                    Full Name
                                    <input
                                        value={registration.fullName}
                                        onChange={(event) => setRegistration({ ...registration, fullName: event.target.value })}
                                        required
                                    />
                                </label>
                                <label>
                                    Year Level
                                    <select
                                        value={registration.yearLevel}
                                        onChange={(event) => setRegistration({ ...registration, yearLevel: event.target.value })}
                                        required
                                    >
                                        <option value="">Select year level</option>
                                        {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                                    </select>
                                </label>
                                <label>
                                    Email (optional)
                                    <input
                                        type="email"
                                        value={registration.email}
                                        onChange={(event) => setRegistration({ ...registration, email: event.target.value })}
                                        placeholder="Optional for assisted kiosk registration"
                                    />
                                </label>
                            </div>

                            <div className="kiosk-doc-grid">
                                {[
                                    ["studentIdFront", "School ID - Front", "image/jpeg,image/png,application/pdf"],
                                    ["studentIdBack", "School ID - Back", "image/jpeg,image/png,application/pdf"],
                                    ["enrollmentProof", "Registration / Enrollment Proof", "image/jpeg,image/png,application/pdf"],
                                    ["selfie", "Selfie", "image/jpeg,image/png"],
                                ].map(([field, label, accept]) => (
                                    <label className="kiosk-file-box" key={field}>
                                        <span>{label}</span>
                                        <input type="file" accept={accept} onChange={(event) => handleRegistrationFile(field, event)} required />
                                        <small>{registration[field]?.name || "Choose file · max 5MB"}</small>
                                    </label>
                                ))}
                            </div>

                            <div className="kiosk-action-row">
                                <button type="button" className="kiosk-secondary-button" onClick={clearStudentSession} disabled={actionLoading}>Cancel</button>
                                <button className="kiosk-main-button" disabled={actionLoading}>
                                    {actionLoading ? "Submitting..." : "Submit for EB Verification"}
                                </button>
                            </div>
                        </form>
                    </section>
                )}

                {step === "review-registration" && registrationReview && (
                    <section className="kiosk-voting-card">
                        <div className="kiosk-card-heading">
                            <div>
                                <span className="kiosk-eyebrow">EB REVIEW</span>
                                <h2>Verify Student Registration</h2>
                                <p>Review the submitted information and documents before approving the account.</p>
                            </div>
                        </div>

                        <div className="kiosk-review-student">
                            <strong>{registrationReview.registration.fullName}</strong>
                            <span>{registrationReview.registration.studentId} · {registrationReview.registration.yearLevel}</span>
                        </div>

                        <div className="kiosk-review-grid">
                            {(registrationReview.review?.documents || []).map((document) => (
                                <a key={document.type} href={document.url || "#"} target="_blank" rel="noreferrer" className="kiosk-review-document">
                                    <span>📄</span>
                                    <strong>{document.type.replaceAll("_", " ")}</strong>
                                    <small>Open document</small>
                                </a>
                            ))}
                            {registrationReview.review?.selfieUrl && (
                                <a href={registrationReview.review.selfieUrl} target="_blank" rel="noreferrer" className="kiosk-review-document">
                                    <span>📷</span>
                                    <strong>Selfie</strong>
                                    <small>Open selfie</small>
                                </a>
                            )}
                        </div>

                        <div className="kiosk-warning-box">
                            Approve only after the Electoral Board has verified the student's identity and submitted documents.
                        </div>

                        <div className="kiosk-action-row">
                            <button className="kiosk-secondary-button" onClick={clearStudentSession} disabled={actionLoading}>Cancel</button>
                            <button className="kiosk-main-button" onClick={approveRegistration} disabled={actionLoading}>
                                {actionLoading ? "Approving..." : "Approve & Continue"}
                            </button>
                        </div>
                    </section>
                )}

                {step === "set-password" && (
                    <section className="kiosk-voting-card kiosk-password-card">
                        <div className="kiosk-voting-icon">🔐</div>
                        <span className="kiosk-eyebrow">CREATE PERSONAL PASSWORD</span>
                        <h2>{student?.fullName}</h2>
                        <p>Create the student's personal 8-character password before voting.</p>

                        <form onSubmit={setPersonalPassword}>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Personal password"
                                maxLength={8}
                                autoFocus
                            />

                            <div className="kiosk-password-checks">
                                {[
                                    ["length", "Exactly 8 characters"],
                                    ["upper", "Uppercase letter"],
                                    ["lower", "Lowercase letter"],
                                    ["number", "Number"],
                                    ["special", "Special character"],
                                ].map(([key, label]) => (
                                    <div key={key} className={passwordRequirements[key] ? "valid" : ""}>
                                        <span>{passwordRequirements[key] ? "✓" : "○"}</span>{label}
                                    </div>
                                ))}
                            </div>

                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Confirm password"
                                maxLength={8}
                            />

                            <button className="kiosk-main-button" disabled={actionLoading}>
                                {actionLoading ? "Saving..." : "Save Password & Continue"}
                            </button>
                        </form>
                    </section>
                )}

                {step === "vote" && (
                    <section className="kiosk-ballot-card">
                        <div className="kiosk-ballot-heading">
                            <div>
                                <span className="kiosk-eyebrow">BALLOT</span>
                                <h2>{student?.fullName}</h2>
                                <p>{student?.studentId} · {student?.yearLevel}</p>
                            </div>
                            <span className="kiosk-ballot-election">{election?.title}</span>
                        </div>

                        {eligiblePositions.length === 0 ? (
                            <div className="kiosk-warning-box">No voting positions are configured for this student's year level.</div>
                        ) : (
                            <div className="kiosk-position-list">
                                {eligiblePositions.map((position) => (
                                    <div className="kiosk-position-card" key={position.id}>
                                        <div className="kiosk-position-heading">
                                            <div>
                                                <h3>{position.name}</h3>
                                                {position.description && <p>{position.description}</p>}
                                            </div>
                                            {position.is_required !== false && <span>Required</span>}
                                        </div>

                                        <div className="kiosk-candidate-grid">
                                            {position.candidates.length ? position.candidates.map((candidate) => (
                                                <label className={`kiosk-candidate ${selections[position.id] === candidate.id ? "selected" : ""}`} key={candidate.id}>
                                                    <input
                                                        type="radio"
                                                        name={`position-${position.id}`}
                                                        checked={selections[position.id] === candidate.id}
                                                        onChange={() => selectCandidate(position.id, candidate.id)}
                                                    />
                                                    <span className="kiosk-radio" />
                                                    <span>
                                                        <strong>{candidate.full_name || candidate.fullName || candidate.name}</strong>
                                                        {candidate.platform && <small>{candidate.platform}</small>}
                                                    </span>
                                                </label>
                                            )) : (
                                                <div className="kiosk-empty-candidates">No active candidates are available for this position.</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="kiosk-ballot-footer">
                            <span>{Object.keys(selections).length} position(s) selected</span>
                            <button className="kiosk-main-button" onClick={submitKioskVote} disabled={actionLoading}>
                                {actionLoading ? "Submitting Ballot..." : "Submit Ballot"}
                            </button>
                        </div>
                    </section>
                )}

                {step === "complete" && (
                    <section className="kiosk-voting-card kiosk-complete-card">
                        <div className="kiosk-success-icon">✓</div>
                        <span className="kiosk-eyebrow">BALLOT RECORDED</span>
                        <h2>Your vote has been successfully submitted.</h2>
                        <p>The ballot was recorded securely. No vote choices are stored in the kiosk session.</p>

                        {submittedBallot?.ballotId && (
                            <div className="kiosk-ballot-reference">
                                Ballot recorded · {submittedBallot.ballotId}
                            </div>
                        )}

                        <button className="kiosk-main-button" onClick={nextStudent}>
                            Next Student
                        </button>
                    </section>
                )}
            </main>
        </div>
    );
}

export default KioskVoting;
