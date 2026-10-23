import React, { useEffect, useState } from "react";

import {
    getKioskElections,
    getActiveKioskSession,
    getKioskSessions,
    startKioskSession,
    closeKioskSession
} from "../../services/kioskService";

import KioskManagementView from "./KioskManagementView";


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


    return (
        <KioskManagementView
            elections={elections}
            sessions={sessions}
            activeSession={activeSession}
            loading={loading}
            starting={starting}
            actionLoading={actionLoading}
            error={error}
            success={success}
            showStartModal={showStartModal}
            selectedElection={selectedElection}
            onSelectElection={setSelectedElection}
            onDismissError={() => setError("")}
            onRefresh={loadKioskData}
            onOpenKiosk={handleOpenStudentKiosk}
            onCloseSession={handleCloseSession}
            onStartSession={handleStartSession}
            onOpenStart={() => {
                setSelectedElection("");
                setError("");
                setShowStartModal(true);
            }}
            onDismissStart={() => setShowStartModal(false)}
        />
    );
}

export default KioskManagement;
