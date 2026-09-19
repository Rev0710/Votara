import React, { useEffect, useState } from "react";

import {
    getKioskElections,
    getActiveKioskSession,
    getKioskSessions,
    startKioskSession,
    closeKioskSession
} from "../../services/kioskService";

import "./KioskManagement.css";


function KioskManagement() {

    const [elections, setElections] = useState([]);
    const [sessions, setSessions] = useState([]);

    const [selectedElection, setSelectedElection] = useState("");

    const [activeSession, setActiveSession] = useState(null);

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [showStartModal, setShowStartModal] = useState(false);


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadKioskData();

    }, []);


    // =====================================================
    // SHARED SESSION REFRESH
    // =====================================================
    // All Electoral Board members should see the same
    // active kiosk session.
    //
    // We refresh periodically so another EB member starting
    // or closing a session is reflected on this page.
    // =====================================================

    useEffect(() => {

        const interval = setInterval(() => {

            refreshActiveSession();

        }, 10000);

        return () => clearInterval(interval);

    }, []);


    // =====================================================
    // LOAD ALL KIOSK DATA
    // =====================================================

    const loadKioskData = async () => {

        try {

            setLoading(true);
            setError("");

            const [
                electionsResponse,
                activeResponse,
                sessionsResponse
            ] = await Promise.all([
                getKioskElections(),
                getActiveKioskSession(),
                getKioskSessions()
            ]);

            setElections(
                electionsResponse?.elections || []
            );

            setActiveSession(
                activeResponse?.session || null
            );

            setSessions(
                sessionsResponse?.sessions || []
            );

        } catch (err) {

            console.error(
                "Failed to load kiosk management data:",
                err
            );

            setError(
                err?.response?.data?.message ||
                "Unable to load kiosk management data."
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // REFRESH ACTIVE SESSION
    // =====================================================

    const refreshActiveSession = async () => {

        try {

            const response =
                await getActiveKioskSession();

            setActiveSession(
                response?.session || null
            );

        } catch (err) {

            console.error(
                "Failed to refresh active kiosk session:",
                err
            );

        }

    };


    // =====================================================
    // START SESSION
    // =====================================================

    const handleStartSession = async () => {

        if (!selectedElection) {

            setError(
                "Please select an election."
            );

            return;
        }

        try {

            setStarting(true);
            setError("");
            setSuccess("");

            const response =
                await startKioskSession(
                    selectedElection
                );

            setActiveSession(
                response?.session || null
            );

            setShowStartModal(false);

            setSuccess(
                "Kiosk session started successfully."
            );

            await loadKioskData();

        } catch (err) {

            console.error(
                "Failed to start kiosk session:",
                err
            );

            const status =
                err?.response?.status;

            const message =
                err?.response?.data?.message ||
                "Failed to start kiosk session.";

            if (status === 409) {

                setError(
                    message ||
                    "A kiosk session is already active for this election."
                );

                await refreshActiveSession();

            } else {

                setError(message);
            }

        } finally {

            setStarting(false);
        }
    };


    // =====================================================
    // CLOSE SESSION
    // =====================================================

    const handleCloseSession = async () => {

        if (!activeSession) {
            return;
        }

        /*
         * IMPORTANT:
         * Closing is allowed only when there are no active
         * student operations.
         */

        const activeOperations =
            Number(
                activeSession.active_operations ??
                activeSession.active_operation_count ??
                0
            );

        if (activeOperations > 0) {

            setError(
                "Please wait until the other finishes. A student is currently being assisted or is voting."
            );

            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to close this kiosk session?"
            );

        if (!confirmed) {
            return;
        }

        try {

            setActionLoading(true);
            setError("");
            setSuccess("");

            await closeKioskSession(
                activeSession.id
            );

            setActiveSession(null);

            setSuccess(
                "Kiosk session closed successfully."
            );

            await loadKioskData();

        } catch (err) {

            console.error(
                "Failed to close kiosk session:",
                err
            );

            const status =
                err?.response?.status;

            const message =
                err?.response?.data?.message ||
                "Failed to close kiosk session.";

            /*
             * 409 = another EB member is currently
             * assisting or a student is voting.
             */
            if (status === 409) {

                setError(
                    "Please wait until the other finishes. A student is currently being assisted or is voting."
                );

                await refreshActiveSession();

            } else {

                setError(message);
            }

        } finally {

            setActionLoading(false);
        }
    };


    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDateTime = (value) => {

        if (!value) {
            return "—";
        }

        return new Date(value).toLocaleString(
            undefined,
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    };


    // =====================================================
    // STATUS CLASS
    // =====================================================

    const getStatusClass = (status) => {

        switch (status) {

            case "active":
                return "status-active";

            case "closed":
                return "status-closed";

            case "expired":
                return "status-expired";

            case "cancelled":
                return "status-cancelled";

            default:
                return "";
        }
    };


    // =====================================================
    // OPEN STUDENT KIOSK
    // =====================================================

    const handleOpenStudentKiosk = () => {

        if (!activeSession?.id) {
            setError(
                "There is no active kiosk session."
            );

            return;
        }

        window.open(
            `/kiosk-voting?sessionId=${encodeURIComponent(
                activeSession.id
            )}`,
            "_blank",
            "noopener,noreferrer"
        );
    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="kiosk-page">

                <div className="kiosk-loading">

                    <div className="kiosk-spinner"></div>

                    <p>
                        Loading Kiosk Management...
                    </p>

                </div>

            </div>
        );
    }


    // =====================================================
    // ACTIVE OPERATION COUNT
    // =====================================================

    const activeOperations =
        Number(
            activeSession?.active_operations ??
            activeSession?.active_operation_count ??
            0
        );


    const hasActiveOperation =
        activeOperations > 0;


    // =====================================================
    // PAGE
    // =====================================================

    return (

        <div className="kiosk-page">


            {/* ============================================ */}
            {/* HEADER */}
            {/* ============================================ */}

            <div className="kiosk-header">

                <div>

                    <div className="kiosk-title-row">

                        <div className="kiosk-title-icon">
                            🖥️
                        </div>

                        <div>

                            <h1>
                                Kiosk Management
                            </h1>

                            <p>
                                Manage the shared temporary
                                Electoral Board kiosk session.
                            </p>

                        </div>

                    </div>

                </div>


                {!activeSession && (

                    <button
                        className="kiosk-primary-btn"
                        onClick={() => {

                            setSelectedElection("");
                            setError("");
                            setShowStartModal(true);

                        }}
                    >
                        + Start Kiosk Session
                    </button>

                )}

            </div>


            {/* ============================================ */}
            {/* SUCCESS ALERT */}
            {/* ============================================ */}

            {success && (

                <div className="kiosk-alert kiosk-alert-success">

                    <span>
                        ✓
                    </span>

                    <span>
                        {success}
                    </span>

                </div>

            )}


            {/* ============================================ */}
            {/* ERROR ALERT */}
            {/* ============================================ */}

            {error && (

                <div className="kiosk-alert kiosk-alert-error">

                    <span>
                        !
                    </span>

                    <span>
                        {error}
                    </span>

                    <button
                        onClick={() =>
                            setError("")
                        }
                    >
                        ×
                    </button>

                </div>

            )}


            {/* ============================================ */}
            {/* ACTIVE SESSION */}
            {/* ============================================ */}

            <section className="kiosk-section">


                <div className="kiosk-section-heading">

                    <div>

                        <h2>
                            Current Kiosk Session
                        </h2>

                        <p>
                            This session is shared by the
                            Electoral Board team.
                        </p>

                    </div>

                </div>


                {activeSession ? (

                    <div className="active-kiosk-card">


                        {/* ================================= */}
                        {/* ACTIVE HEADER */}
                        {/* ================================= */}

                        <div className="active-kiosk-top">

                            <div>

                                <div className="active-label">
                                    ACTIVE SESSION
                                </div>

                                <h3>
                                    {
                                        activeSession
                                            .elections
                                            ?.title ||
                                        "Election"
                                    }
                                </h3>

                            </div>


                            <span className="active-badge">
                                ● ACTIVE
                            </span>

                        </div>


                        {/* ================================= */}
                        {/* SHARED SESSION NOTICE */}
                        {/* ================================= */}

                        <div className="kiosk-shared-notice">

                            <div className="kiosk-shared-icon">
                                👥
                            </div>

                            <div>

                                <strong>
                                    Shared Electoral Board Session
                                </strong>

                                <p>
                                    All Electoral Board members
                                    can use this same active
                                    kiosk session. Do not start
                                    another session for the same
                                    election.
                                </p>

                            </div>

                        </div>


                        {/* ================================= */}
                        {/* ACTIVE OPERATION WARNING */}
                        {/* ================================= */}

                        {hasActiveOperation && (

                            <div className="kiosk-operation-warning">

                                <div className="kiosk-operation-icon">
                                    ⏳
                                </div>

                                <div>

                                    <strong>
                                        Student activity in progress
                                    </strong>

                                    <p>
                                        {activeOperations === 1
                                            ? "A student is currently being assisted or is voting."
                                            : `${activeOperations} students are currently being assisted or are voting.`}
                                    </p>

                                    <small>
                                        Please wait until the
                                        other finishes before
                                        closing the kiosk session.
                                    </small>

                                </div>

                            </div>

                        )}


                        {/* ================================= */}
                        {/* STATS */}
                        {/* ================================= */}

                        <div className="kiosk-stats-grid">


                            <div className="kiosk-stat">

                                <span>
                                    Session Started
                                </span>

                                <strong>
                                    {
                                        formatDateTime(
                                            activeSession.started_at
                                        )
                                    }
                                </strong>

                            </div>


                            <div className="kiosk-stat">

                                <span>
                                    Last Activity
                                </span>

                                <strong>
                                    {
                                        formatDateTime(
                                            activeSession.last_activity_at
                                        )
                                    }
                                </strong>

                            </div>


                            <div className="kiosk-stat">

                                <span>
                                    Students Served
                                </span>

                                <strong className="student-count">
                                    {
                                        activeSession.students_served ??
                                        0
                                    }
                                </strong>

                            </div>


                            <div className="kiosk-stat">

                                <span>
                                    Active Student Operations
                                </span>

                                <strong
                                    className={
                                        hasActiveOperation
                                            ? "operation-count-active"
                                            : "operation-count"
                                    }
                                >
                                    {
                                        activeOperations
                                    }
                                </strong>

                            </div>

                        </div>


                        {/* ================================= */}
                        {/* INACTIVITY WARNING */}
                        {/* ================================= */}

                        {activeSession.inactivity_warning && (
                            
                            <div className="kiosk-inactivity-warning">

                                <span>
                                    ⚠️
                                </span>

                                <div>

                                    <strong>
                                        Kiosk inactivity detected
                                    </strong>

                                    <p>
                                        The session has had no recent
                                        activity. Continue using the
                                        kiosk to keep the session active.
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* ================================= */}
                        {/* ACTIONS */}
                        {/* ================================= */}

                        <div className="active-kiosk-actions">


                            <button
                                className="kiosk-launch-btn"
                                onClick={
                                    handleOpenStudentKiosk
                                }
                                disabled={
                                    actionLoading
                                }
                            >
                                🗳️ Open Student Kiosk
                            </button>


                            <button
                                className="kiosk-close-btn"
                                onClick={
                                    handleCloseSession
                                }
                                disabled={
                                    actionLoading
                                }
                                title={
                                    hasActiveOperation
                                        ? "A student is currently being assisted or is voting."
                                        : "Close kiosk session"
                                }
                            >

                                {actionLoading
                                    ? "Processing..."
                                    : "Close Session"}

                            </button>


                        </div>


                    </div>

                ) : (


                    /* ===================================== */
                    /* NO ACTIVE SESSION */
                    /* ===================================== */

                    <div className="empty-kiosk-card">

                        <div className="empty-kiosk-icon">
                            🖥️
                        </div>

                        <h3>
                            No Active Kiosk Session
                        </h3>

                        <p>
                            Start a temporary kiosk session
                            when you are ready to assist
                            students.
                        </p>

                        <button
                            className="kiosk-primary-btn"
                            onClick={() => {

                                setSelectedElection("");
                                setError("");
                                setShowStartModal(true);

                            }}
                        >
                            Start Kiosk Session
                        </button>

                    </div>

                )}

            </section>


            {/* ============================================ */}
            {/* SESSION HISTORY */}
            {/* ============================================ */}

            <section className="kiosk-section">


                <div className="kiosk-section-heading">

                    <div>

                        <h2>
                            Session History
                        </h2>

                        <p>
                            Previous kiosk sessions handled
                            by the Electoral Board.
                        </p>

                    </div>

                </div>


                {sessions.length === 0 ? (

                    <div className="history-empty">

                        No kiosk sessions recorded yet.

                    </div>

                ) : (

                    <div className="kiosk-table-wrapper">

                        <table className="kiosk-table">

                            <thead>

                                <tr>

                                    <th>
                                        Election
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Started
                                    </th>

                                    <th>
                                        Ended
                                    </th>

                                    <th>
                                        Students Served
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {sessions.map(
                                    (session) => (

                                        <tr
                                            key={
                                                session.id
                                            }
                                        >

                                            <td>

                                                <div className="election-name">

                                                    {
                                                        session
                                                            .elections
                                                            ?.title ||
                                                        "Unknown Election"
                                                    }

                                                </div>

                                                <small>

                                                    {
                                                        session
                                                            .elections
                                                            ?.election_date ||
                                                        "—"
                                                    }

                                                </small>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        `session-status ${getStatusClass(
                                                            session.session_status
                                                        )}`
                                                    }
                                                >

                                                    {
                                                        session.session_status
                                                    }

                                                </span>

                                            </td>


                                            <td>

                                                {
                                                    formatDateTime(
                                                        session.started_at
                                                    )
                                                }

                                            </td>


                                            <td>

                                                {
                                                    formatDateTime(
                                                        session.ended_at
                                                    )
                                                }

                                            </td>


                                            <td>

                                                <strong>

                                                    {
                                                        session
                                                            .students_served ??
                                                        0
                                                    }

                                                </strong>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>


            {/* ============================================ */}
            {/* START SESSION MODAL */}
            {/* ============================================ */}

            {showStartModal && (

                <div
                    className="kiosk-modal-overlay"
                    onClick={() => {

                        if (!starting) {
                            setShowStartModal(false);
                        }

                    }}
                >


                    <div
                        className="kiosk-modal"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >


                        {/* ================================= */}
                        {/* MODAL HEADER */}
                        {/* ================================= */}

                        <div className="kiosk-modal-header">

                            <div>

                                <h2>
                                    Start Kiosk Session
                                </h2>

                                <p>
                                    Select the election this
                                    kiosk session will serve.
                                </p>

                            </div>


                            <button
                                className="modal-close"
                                onClick={() =>
                                    setShowStartModal(false)
                                }
                                disabled={
                                    starting
                                }
                            >
                                ×
                            </button>

                        </div>


                        {/* ================================= */}
                        {/* MODAL BODY */}
                        {/* ================================= */}

                        <div className="kiosk-modal-body">


                            <label>
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
                                disabled={starting}
                            >

                                <option value="">
                                    Select an election
                                </option>


                                {elections.map(
                                    (election) => (

                                        <option
                                            key={
                                                election.id
                                            }
                                            value={
                                                election.id
                                            }
                                        >
                                            {
                                                election.title
                                            }
                                        </option>

                                    )
                                )}

                            </select>


                            {/* ================================= */}
                            {/* SELECTED ELECTION INFO */}
                            {/* ================================= */}

                            {selectedElection && (

                                <div className="selected-election-info">

                                    {(() => {

                                        const election =
                                            elections.find(
                                                (item) =>
                                                    item.id ===
                                                    selectedElection
                                            );

                                        if (!election) {
                                            return null;
                                        }

                                        return (

                                            <>

                                                <strong>
                                                    {
                                                        election.title
                                                    }
                                                </strong>

                                                <span>
                                                    Date:{" "}
                                                    {
                                                        election.election_date ||
                                                        "—"
                                                    }
                                                </span>

                                                <span>
                                                    Status:{" "}
                                                    {
                                                        election.status ||
                                                        "—"
                                                    }
                                                </span>

                                            </>

                                        );

                                    })()}

                                </div>

                            )}


                            {/* ================================= */}
                            {/* START WARNING */}
                            {/* ================================= */}

                            <div className="kiosk-warning">

                                <strong>
                                    Before starting
                                </strong>

                                <p>
                                    This creates one shared
                                    temporary kiosk session
                                    for the Electoral Board.
                                    All EB members can use the
                                    same session. The kiosk does
                                    not store student vote choices.
                                </p>

                            </div>

                        </div>


                        {/* ================================= */}
                        {/* MODAL ACTIONS */}
                        {/* ================================= */}

                        <div className="kiosk-modal-actions">


                            {/* 
                             * This Cancel only closes the
                             * Start Session modal.
                             *
                             * It does NOT cancel a kiosk
                             * session.
                             */}

                            <button
                                className="modal-secondary-btn"
                                onClick={() =>
                                    setShowStartModal(
                                        false
                                    )
                                }
                                disabled={
                                    starting
                                }
                            >
                                Cancel
                            </button>


                            <button
                                className="kiosk-primary-btn"
                                onClick={
                                    handleStartSession
                                }
                                disabled={
                                    starting ||
                                    !selectedElection
                                }
                            >

                                {starting
                                    ? "Starting..."
                                    : "Start Session"}

                            </button>

                        </div>


                    </div>

                </div>

            )}

        </div>
    );
}


export default KioskManagement;