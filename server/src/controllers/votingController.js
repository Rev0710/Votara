const votingService = require("../services/votingService");
const supabase = require("../config/supabase");

// =========================================================
// KIOSK SESSION VALIDATION
// =========================================================
const validateKioskVotingSession = async (student) => {
    if (!student?.kiosk) return null;

    if (!student.kioskSessionId || !student.electionId) {
        throw new Error("Invalid kiosk voting session.");
    }

    const { data: session, error } = await supabase
        .from("kiosk_sessions")
        .select(`
            id,
            election_id,
            session_status,
            students_served,
            elections (
                id,
                status,
                is_published
            )
        `)
        .eq("id", student.kioskSessionId)
        .maybeSingle();

    if (error) throw error;

    if (!session) {
        throw new Error("Kiosk session not found.");
    }

    if (session.session_status !== "active") {
        throw new Error("The kiosk session is no longer active.");
    }

    if (session.election_id !== student.electionId) {
        throw new Error("Kiosk election mismatch.");
    }

    if (
        session.elections?.status !== "active" ||
        session.elections?.is_published !== true
    ) {
        throw new Error("The election is no longer available for kiosk voting.");
    }

    return session;
};

// =========================================================
// MARK KIOSK STUDENT AS SERVED
// =========================================================
const markKioskStudentServed = async (session) => {
    if (!session?.id) return;

    const { error } = await supabase
        .from("kiosk_sessions")
        .update({
            students_served: Number(session.students_served || 0) + 1,
            last_activity_at: new Date().toISOString(),
        })
        .eq("id", session.id)
        .eq("session_status", "active");

    if (error) {
        console.error("⚠️ Unable to update kiosk students served:", error);
    }
};

// =========================================================
// SUBMIT VOTE
// =========================================================
const submitVote = async (req, res) => {
    try {
        const { electionId, selections } = req.body;
        const studentId = req.student?.id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is required.",
            });
        }

        if (!electionId) {
            return res.status(400).json({
                success: false,
                message: "Election ID is required.",
            });
        }

        if (!Array.isArray(selections)) {
            return res.status(400).json({
                success: false,
                message: "Vote selections must be provided.",
            });
        }

        // Kiosk voting is tied to the active temporary EB session.
        const kioskSession = await validateKioskVotingSession(req.student);

        if (kioskSession && kioskSession.election_id !== electionId) {
            return res.status(403).json({
                success: false,
                message: "This kiosk session is assigned to a different election.",
            });
        }

        const result = await votingService.submitVote({
            electionId,
            studentId,
            selections,
        });

        if (kioskSession) {
            await markKioskStudentServed(kioskSession);
        }

        return res.status(201).json({
            success: true,
            message: result.message,
            ballotId: result.ballotId,
            ballotToken: result.ballotToken,
            kioskCompleted: Boolean(kioskSession),
        });
    } catch (error) {
        console.error("❌ Submit vote error:", error);

        return res.status(400).json({
            success: false,
            message: error.message || "Failed to submit vote.",
        });
    }
};

// =========================================================
// CHECK VOTE STATUS
// =========================================================
const checkVoteStatus = async (req, res) => {
    try {
        const studentId = req.student?.id;

        if (!studentId) {
            return res.status(401).json({
                success: false,
                message: "Student authentication is required.",
            });
        }

        const { electionId } = req.params;

        if (!electionId) {
            return res.status(400).json({
                success: false,
                message: "Election ID is required.",
            });
        }

        const kioskSession = await validateKioskVotingSession(req.student);

        if (kioskSession && kioskSession.election_id !== electionId) {
            return res.status(403).json({
                success: false,
                message: "This kiosk session is assigned to a different election.",
            });
        }

        const result = await votingService.checkVoteStatus({
            electionId,
            studentId,
        });

        return res.status(200).json({
            success: true,
            hasVoted: result.hasVoted,
            votedAt: result.votedAt,
        });
    } catch (error) {
        console.error("❌ Check vote status error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to check voting status.",
        });
    }
};

module.exports = {
    submitVote,
    checkVoteStatus,
};