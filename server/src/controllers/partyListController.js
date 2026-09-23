const supabase = require("../config/supabase");

// =====================================================
// PARTY LIST CONTROLLER
// =====================================================


// =====================================================
// GET ALL PARTY LISTS
// =====================================================
// GET /api/party-lists
// Optional:
// GET /api/party-lists?election_id=UUID
// =====================================================

const getAllPartyLists = async (req, res) => {
    try {
        const { election_id } = req.query;

        let query = supabase
            .from("party_lists")
            .select(`
                id,
                election_id,
                name,
                description,
                logo_url,
                approval_status,
                approval_remarks,
                approved_at,
                approved_by,
                is_active,
                created_at,
                updated_at
            `)
            .order("created_at", {
                ascending: false,
            });

        if (election_id) {
            query = query.eq(
                "election_id",
                election_id
            );
        }

        const {
            data,
            error,
        } = await query;

        if (error) {
            console.error(
                "❌ Get party lists error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to retrieve party lists.",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            data: data || [],
        });

    } catch (error) {
        console.error(
            "❌ Get party lists exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve party lists.",
        });
    }
};


// =====================================================
// GET PARTY LIST BY ID
// =====================================================
// GET /api/party-lists/:id
// =====================================================

const getPartyListById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Party List ID is required.",
            });
        }

        const {
            data,
            error,
        } = await supabase
            .from("party_lists")
            .select(`
                id,
                election_id,
                name,
                description,
                logo_url,
                approval_status,
                approval_remarks,
                approved_at,
                approved_by,
                is_active,
                created_at,
                updated_at
            `)
            .eq("id", id)
            .maybeSingle();

        if (error) {
            console.error(
                "❌ Get party list error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to retrieve party list.",
                error: error.message,
            });
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message:
                    "Party list not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data,
        });

    } catch (error) {
        console.error(
            "❌ Get party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve party list.",
        });
    }
};


// =====================================================
// CREATE PARTY LIST
// =====================================================
// POST /api/party-lists
// =====================================================

const createPartyList = async (req, res) => {
    try {
        const {
            election_id,
            name,
            description,
            logo_url,
        } = req.body;

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!election_id) {
            return res.status(400).json({
                success: false,
                message:
                    "Election ID is required.",
            });
        }

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Party list name is required.",
            });
        }

        const partyName =
            String(name).trim();

        // -------------------------------------------------
        // CHECK ELECTION
        // -------------------------------------------------

        const {
            data: election,
            error: electionError,
        } = await supabase
            .from("elections")
            .select("id")
            .eq("id", election_id)
            .maybeSingle();

        if (electionError) {
            console.error(
                "❌ Election check error:",
                electionError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to validate election.",
                error:
                    electionError.message,
            });
        }

        if (!election) {
            return res.status(404).json({
                success: false,
                message:
                    "Election not found.",
            });
        }

        // -------------------------------------------------
        // CHECK DUPLICATE PARTY
        // -------------------------------------------------

        const {
            data: existingParty,
            error: duplicateError,
        } = await supabase
            .from("party_lists")
            .select("id")
            .eq(
                "election_id",
                election_id
            )
            .ilike(
                "name",
                partyName
            )
            .maybeSingle();

        if (duplicateError) {
            console.error(
                "❌ Duplicate party check error:",
                duplicateError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to validate party list.",
                error:
                    duplicateError.message,
            });
        }

        if (existingParty) {
            return res.status(409).json({
                success: false,
                message:
                    "A party list with this name already exists for this election.",
            });
        }

        // -------------------------------------------------
        // CREATE PARTY
        // -------------------------------------------------

        const {
            data,
            error,
        } = await supabase
            .from("party_lists")
            .insert({
                election_id:
                    election_id,

                name:
                    partyName,

                description:
                    description
                        ? String(
                              description
                          ).trim()
                        : "",

                logo_url:
                    logo_url
                        ? String(
                              logo_url
                          ).trim()
                        : "",

                approval_status:
                    "pending",

                approval_remarks:
                    "",

                approved_at:
                    null,

                approved_by:
                    null,

                is_active:
                    true,
            })
            .select()
            .single();

        if (error) {
            console.error(
                "❌ Create party list error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to create party list.",
                error: error.message,
            });
        }

        return res.status(201).json({
            success: true,
            message:
                "Party list created successfully.",
            data,
        });

    } catch (error) {
        console.error(
            "❌ Create party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create party list.",
        });
    }
};


// =====================================================
// UPDATE PARTY LIST
// =====================================================
// PUT /api/party-lists/:id
// =====================================================

const updatePartyList = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            name,
            description,
            logo_url,
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Party List ID is required.",
            });
        }

        if (!name || !String(name).trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Party list name is required.",
            });
        }

        const partyName =
            String(name).trim();

        // -------------------------------------------------
        // CHECK PARTY EXISTS
        // -------------------------------------------------

        const {
            data: existingParty,
            error: existingError,
        } = await supabase
            .from("party_lists")
            .select("id, election_id")
            .eq("id", id)
            .maybeSingle();

        if (existingError) {
            console.error(
                "❌ Existing party check error:",
                existingError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to find party list.",
                error:
                    existingError.message,
            });
        }

        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message:
                    "Party list not found.",
            });
        }

        // -------------------------------------------------
        // UPDATE
        // -------------------------------------------------

        const {
            data,
            error,
        } = await supabase
            .from("party_lists")
            .update({
                name:
                    partyName,

                description:
                    description
                        ? String(
                              description
                          ).trim()
                        : "",

                logo_url:
                    logo_url
                        ? String(
                              logo_url
                          ).trim()
                        : "",

                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(
                "❌ Update party list error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to update party list.",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Party list updated successfully.",
            data,
        });

    } catch (error) {
        console.error(
            "❌ Update party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to update party list.",
        });
    }
};


// =====================================================
// APPROVE PARTY LIST
// =====================================================
// PATCH /api/party-lists/:id/approve
// =====================================================

const approvePartyList = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            approval_remarks,
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Party List ID is required.",
            });
        }

        const {
            data: existingParty,
            error: existingError,
        } = await supabase
            .from("party_lists")
            .select("id")
            .eq("id", id)
            .maybeSingle();

        if (existingError) {
            console.error(
                "❌ Party lookup error:",
                existingError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to find party list.",
                error:
                    existingError.message,
            });
        }

        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message:
                    "Party list not found.",
            });
        }

        const now =
            new Date().toISOString();

        const {
            data,
            error,
        } = await supabase
            .from("party_lists")
            .update({
                approval_status:
                    "approved",

                approval_remarks:
                    approval_remarks
                        ? String(
                              approval_remarks
                          ).trim()
                        : "",

                approved_at:
                    now,

                approved_by:
                    null,

                is_active:
                    true,

                updated_at:
                    now,
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(
                "❌ Approve party list error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to approve party list.",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Party list approved successfully.",
            data,
        });

    } catch (error) {
        console.error(
            "❌ Approve party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to approve party list.",
        });
    }
};


// =====================================================
// REJECT PARTY LIST
// =====================================================
// PATCH /api/party-lists/:id/reject
// =====================================================

const rejectPartyList = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            approval_remarks,
        } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Party List ID is required.",
            });
        }

        const {
            data: existingParty,
            error: existingError,
        } = await supabase
            .from("party_lists")
            .select("id")
            .eq("id", id)
            .maybeSingle();

        if (existingError) {
            console.error(
                "❌ Party lookup error:",
                existingError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to find party list.",
                error:
                    existingError.message,
            });
        }

        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message:
                    "Party list not found.",
            });
        }

        const now =
            new Date().toISOString();

        const {
            data,
            error,
        } = await supabase
            .from("party_lists")
            .update({
                approval_status:
                    "rejected",

                approval_remarks:
                    approval_remarks
                        ? String(
                              approval_remarks
                          ).trim()
                        : "",

                approved_at:
                    null,

                approved_by:
                    null,

                updated_at:
                    now,
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(
                "❌ Reject party list error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to reject party list.",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Party list rejected successfully.",
            data,
        });

    } catch (error) {
        console.error(
            "❌ Reject party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reject party list.",
        });
    }
};


// =====================================================
// ACTIVATE PARTY LIST
// =====================================================
// PATCH /api/party-lists/:id/activate
// =====================================================

const activatePartyList = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Party List ID is required.",
            });
        }

        const {
            data: existingParty,
            error: existingError,
        } = await supabase
            .from("party_lists")
            .select(
                "id, approval_status"
            )
            .eq("id", id)
            .maybeSingle();

        if (existingError) {
            console.error(
                "❌ Party lookup error:",
                existingError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to find party list.",
                error:
                    existingError.message,
            });
        }

        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message:
                    "Party list not found.",
            });
        }

        // A rejected party should not be activated.
        if (
            existingParty.approval_status ===
            "rejected"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "A rejected party list cannot be activated. Approve it first.",
            });
        }

        const {
            data,
            error,
        } = await supabase
            .from("party_lists")
            .update({
                is_active:
                    true,

                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(
                "❌ Activate party list error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to activate party list.",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Party list activated successfully.",
            data,
        });

    } catch (error) {
        console.error(
            "❌ Activate party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to activate party list.",
        });
    }
};


// =====================================================
// DEACTIVATE PARTY LIST
// =====================================================
// PATCH /api/party-lists/:id/deactivate
// =====================================================

const deactivatePartyList = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Party List ID is required.",
            });
        }

        const {
            data: existingParty,
            error: existingError,
        } = await supabase
            .from("party_lists")
            .select("id")
            .eq("id", id)
            .maybeSingle();

        if (existingError) {
            console.error(
                "❌ Party lookup error:",
                existingError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to find party list.",
                error:
                    existingError.message,
            });
        }

        if (!existingParty) {
            return res.status(404).json({
                success: false,
                message:
                    "Party list not found.",
            });
        }

        const {
            data,
            error,
        } = await supabase
            .from("party_lists")
            .update({
                is_active:
                    false,

                updated_at:
                    new Date().toISOString(),
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error(
                "❌ Deactivate party list error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to deactivate party list.",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Party list deactivated successfully.",
            data,
        });

    } catch (error) {
        console.error(
            "❌ Deactivate party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to deactivate party list.",
        });
    }
};


// =====================================================
// DELETE PARTY LIST
// =====================================================
// DELETE /api/party-lists/:id
// =====================================================

const deletePartyList = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Party List ID is required.",
            });
        }

        const { data: party, error: partyError } =
            await supabase
                .from("party_lists")
                .select("id, name")
                .eq("id", id)
                .maybeSingle();

        if (partyError) {
            return res.status(500).json({
                success: false,
                message: "Failed to find party list.",
                error: partyError.message,
            });
        }

        if (!party) {
            return res.status(404).json({
                success: false,
                message: "Party list not found.",
            });
        }

        // Do not silently remove candidates belonging to this party list.
        const { count, error: candidateError } =
            await supabase
                .from("candidates")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true,
                    }
                )
                .eq(
                    "party_list_id",
                    id
                );

        if (candidateError) {
            return res.status(500).json({
                success: false,
                message:
                    "Unable to check party list candidates.",
                error:
                    candidateError.message,
            });
        }

        if (Number(count || 0) > 0) {
            return res.status(409).json({
                success: false,
                message:
                    `Cannot delete "${party.name}" because it still has ${count} candidate(s). Deactivate the party list instead or remove its candidates first.`,
            });
        }

        const {
            error: deleteError,
        } = await supabase
            .from("party_lists")
            .delete()
            .eq("id", id);

        if (deleteError) {
            console.error(
                "❌ Delete party list error:",
                deleteError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to delete party list.",
                error:
                    deleteError.message,
            });
        }

        return res.status(200).json({
            success: true,
            message:
                "Party list deleted successfully.",
        });

    } catch (error) {
        console.error(
            "❌ Delete party list exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to delete party list.",
        });
    }
};


// =====================================================
// GET PARTY LIST CANDIDATES
// =====================================================
// GET /api/party-lists/:id/candidates
// =====================================================

const getPartyListCandidates = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                message:
                    "Party List ID is required.",
            });
        }

        // -------------------------------------------------
        // CHECK PARTY EXISTS
        // -------------------------------------------------

        const {
            data: party,
            error: partyError,
        } = await supabase
            .from("party_lists")
            .select(
                "id, name"
            )
            .eq("id", id)
            .maybeSingle();

        if (partyError) {
            console.error(
                "❌ Party lookup error:",
                partyError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to find party list.",
                error:
                    partyError.message,
            });
        }

        if (!party) {
            return res.status(404).json({
                success: false,
                message:
                    "Party list not found.",
            });
        }

        // -------------------------------------------------
        // GET CANDIDATES
        // -------------------------------------------------

        const {
            data,
            error,
        } = await supabase
            .from("candidates")
            .select(`
                id,
                election_id,
                position_id,
                student_id,
                party_list_id,
                full_name,
                profile_picture,
                platform,
                approval_status,
                is_active,
                created_at,
                updated_at
            `)
            .eq(
                "party_list_id",
                id
            )
            .order(
                "created_at",
                {
                    ascending: true,
                }
            );

        if (error) {
            console.error(
                "❌ Get party candidates error:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to retrieve party candidates.",
                error: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            party: party,
            data: data || [],
        });

    } catch (error) {
        console.error(
            "❌ Get party candidates exception:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to retrieve party candidates.",
        });
    }
};


// =====================================================
// EXPORT ALL CONTROLLERS
// =====================================================

module.exports = {
    getAllPartyLists,
    getPartyListById,
    createPartyList,
    updatePartyList,
    approvePartyList,
    rejectPartyList,
    activatePartyList,
    deactivatePartyList,
    deletePartyList,
    getPartyListCandidates,
};