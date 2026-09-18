const supabase = require("../config/supabase");

// =========================================================
// CREATE CANDIDATE
// =========================================================

const createCandidate = async (data) => {
    const {
        electionId,
        positionId,
        studentId,
        platform = "",
        profilePicture = "",
    } = data;

    if (
        !electionId ||
        !positionId ||
        !studentId
    ) {
        throw new Error(
            "Election, position, and student are required."
        );
    }

    // -----------------------------------------------------
    // Check election
    // -----------------------------------------------------

    const {
        data: election,
        error: electionError,
    } = await supabase
        .from("elections")
        .select("*")
        .eq("id", electionId)
        .single();

    if (electionError || !election) {
        throw new Error(
            "Election not found."
        );
    }

    if (
        election.status === "active" ||
        election.status === "closed" ||
        election.status === "cancelled"
    ) {
        throw new Error(
            "Candidates cannot be added to an active, closed, or cancelled election."
        );
    }

    // -----------------------------------------------------
    // Check position
    // -----------------------------------------------------

    const {
        data: position,
        error: positionError,
    } = await supabase
        .from("positions")
        .select("*")
        .eq("id", positionId)
        .eq("election_id", electionId)
        .single();

    if (positionError || !position) {
        throw new Error(
            "Position not found for this election."
        );
    }

    if (!position.is_active) {
        throw new Error(
            "This position is inactive."
        );
    }

    // -----------------------------------------------------
    // Check student
    // -----------------------------------------------------

    const {
        data: student,
        error: studentError,
    } = await supabase
        .from("students")
        .select(`
            id,
            student_id,
            full_name,
            year_level,
            enrollment_status
        `)
        .eq("id", studentId)
        .single();

    if (studentError || !student) {
        throw new Error(
            "Student not found."
        );
    }

    // -----------------------------------------------------
    // Student enrollment check
    // -----------------------------------------------------

    if (
        student.enrollment_status &&
        student.enrollment_status !== "enrolled"
    ) {
        throw new Error(
            "Only enrolled students can become candidates."
        );
    }

    // -----------------------------------------------------
    // Check year-level eligibility
    // -----------------------------------------------------

    const {
        data: positionYearLevels,
        error: yearLevelError,
    } = await supabase
        .from("position_year_levels")
        .select("year_level")
        .eq("position_id", positionId);

    if (yearLevelError) {
        throw new Error(
            yearLevelError.message
        );
    }

    if (
        positionYearLevels &&
        positionYearLevels.length > 0
    ) {
        const allowedYearLevels =
            positionYearLevels.map(
                (item) => item.year_level
            );

        if (
            !allowedYearLevels.includes(
                student.year_level
            )
        ) {
            throw new Error(
                `This student is not eligible for the ${position.name} position.`
            );
        }
    }

    // -----------------------------------------------------
    // Check duplicate candidate
    // -----------------------------------------------------

    const {
        data: existingCandidate,
        error: duplicateError,
    } = await supabase
        .from("candidates")
        .select("id")
        .eq("election_id", electionId)
        .eq("position_id", positionId)
        .eq("student_id", studentId)
        .maybeSingle();

    if (duplicateError) {
        throw new Error(
            duplicateError.message
        );
    }

    if (existingCandidate) {
        throw new Error(
            "This student is already registered as a candidate for this position."
        );
    }

    // -----------------------------------------------------
    // Create candidate
    // -----------------------------------------------------

    const {
        data: candidate,
        error: candidateError,
    } = await supabase
        .from("candidates")
        .insert({
            election_id: electionId,
            position_id: positionId,
            student_id: studentId,
            full_name: student.full_name,
            profile_picture:
                profilePicture || "",
            platform: platform?.trim() || "",
            approval_status: "pending",
            is_active: true,
        })
        .select()
        .single();

    if (candidateError) {
        console.error(
            "Create candidate error:",
            candidateError
        );

        throw new Error(
            candidateError.message
        );
    }

    return candidate;
};


// =========================================================
// GET ALL CANDIDATES
// =========================================================

const getAllCandidates = async (filters = {}) => {
    let query = supabase
        .from("candidates")
        .select(`
            *,
            elections (
                id,
                title,
                election_date,
                status
            ),
            positions (
                id,
                name,
                display_order,
                is_required,
                is_active
            ),
            students (
                id,
                student_id,
                full_name,
                year_level,
                enrollment_status
            )
        `)
        .order("created_at", {
            ascending: false,
        });

    if (filters.electionId) {
        query = query.eq(
            "election_id",
            filters.electionId
        );
    }

    if (filters.positionId) {
        query = query.eq(
            "position_id",
            filters.positionId
        );
    }

    if (filters.approvalStatus) {
        query = query.eq(
            "approval_status",
            filters.approvalStatus
        );
    }

    const {
        data: candidates,
        error,
    } = await query;

    if (error) {
        console.error(
            "Get candidates error:",
            error
        );

        throw new Error(
            error.message
        );
    }

    return candidates || [];
};


// =========================================================
// GET CANDIDATE BY ID
// =========================================================

const getCandidateById = async (
    candidateId
) => {
    const {
        data: candidate,
        error,
    } = await supabase
        .from("candidates")
        .select(`
            *,
            elections (
                id,
                title,
                election_date,
                status
            ),
            positions (
                id,
                name,
                display_order,
                is_required,
                is_active
            ),
            students (
                id,
                student_id,
                full_name,
                year_level,
                enrollment_status
            )
        `)
        .eq("id", candidateId)
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            throw new Error(
                "Candidate not found."
            );
        }

        throw new Error(
            error.message
        );
    }

    return candidate;
};


// =========================================================
// UPDATE CANDIDATE
// =========================================================

const updateCandidate = async (
    candidateId,
    data
) => {
    const candidate =
        await getCandidateById(
            candidateId
        );

    if (
        candidate.elections.status ===
        "active"
    ) {
        throw new Error(
            "Candidates cannot be modified while the election is active."
        );
    }

    const updateData = {};

    if (data.platform !== undefined) {
        updateData.platform =
            data.platform?.trim() || "";
    }

    if (
        data.profilePicture !==
        undefined
    ) {
        updateData.profile_picture =
            data.profilePicture || "";
    }

    if (
        data.isActive !== undefined
    ) {
        updateData.is_active =
            data.isActive;
    }

    const {
        data: updatedCandidate,
        error,
    } = await supabase
        .from("candidates")
        .update(updateData)
        .eq("id", candidateId)
        .select()
        .single();

    if (error) {
        throw new Error(
            error.message
        );
    }

    return updatedCandidate;
};


// =========================================================
// APPROVE CANDIDATE
// =========================================================

const approveCandidate = async (
    candidateId,
    approvedBy = null
) => {
    const candidate =
        await getCandidateById(
            candidateId
        );

    if (
        candidate.elections.status ===
        "active"
    ) {
        throw new Error(
            "Candidate approval cannot be changed during an active election."
        );
    }

    const {
        data: updatedCandidate,
        error,
    } = await supabase
        .from("candidates")
        .update({
            approval_status: "approved",
            approval_remarks: "",
            approved_at:
                new Date().toISOString(),
            approved_by:
                approvedBy || null,
            is_active: true,
        })
        .eq("id", candidateId)
        .select()
        .single();

    if (error) {
        throw new Error(
            error.message
        );
    }

    return updatedCandidate;
};


// =========================================================
// REJECT CANDIDATE
// =========================================================

const rejectCandidate = async (
    candidateId,
    remarks = "",
    rejectedBy = null
) => {
    const candidate =
        await getCandidateById(
            candidateId
        );

    if (
        candidate.elections.status ===
        "active"
    ) {
        throw new Error(
            "Candidate approval cannot be changed during an active election."
        );
    }

    if (!remarks.trim()) {
        throw new Error(
            "Rejection remarks are required."
        );
    }

    const {
        data: updatedCandidate,
        error,
    } = await supabase
        .from("candidates")
        .update({
            approval_status: "rejected",
            approval_remarks:
                remarks.trim(),
            approved_at: null,
            approved_by:
                rejectedBy || null,
            is_active: false,
        })
        .eq("id", candidateId)
        .select()
        .single();

    if (error) {
        throw new Error(
            error.message
        );
    }

    return updatedCandidate;
};


// =========================================================
// GET APPROVED CANDIDATES FOR VOTING
// =========================================================

const getApprovedCandidatesForElection =
    async (electionId) => {
        const {
            data: candidates,
            error,
        } = await supabase
            .from("candidates")
            .select(`
                id,
                election_id,
                position_id,
                student_id,
                full_name,
                profile_picture,
                platform,
                positions (
                    id,
                    name,
                    display_order,
                    is_required
                )
            `)
            .eq(
                "election_id",
                electionId
            )
            .eq(
                "approval_status",
                "approved"
            )
            .eq(
                "is_active",
                true
            )
            .order("created_at", {
                ascending: true,
            });

        if (error) {
            throw new Error(
                error.message
            );
        }

        return candidates || [];
    };


// =========================================================
// DEACTIVATE CANDIDATE
// =========================================================

const deactivateCandidate = async (
    candidateId
) => {
    const candidate =
        await getCandidateById(
            candidateId
        );

    if (
        candidate.elections.status ===
        "active"
    ) {
        throw new Error(
            "Candidates cannot be deactivated while the election is active."
        );
    }

    const {
        data: updatedCandidate,
        error,
    } = await supabase
        .from("candidates")
        .update({
            is_active: false,
        })
        .eq("id", candidateId)
        .select()
        .single();

    if (error) {
        throw new Error(
            error.message
        );
    }

    return updatedCandidate;
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {
    createCandidate,
    getAllCandidates,
    getCandidateById,
    updateCandidate,
    approveCandidate,
    rejectCandidate,
    getApprovedCandidatesForElection,
    deactivateCandidate,
};