const electionService = require("../services/electionService");

// =========================================================
// AUDIT LOG SERVICE
// =========================================================

const {
    createAuditLog
} = require("../services/auditLogsService");


// =========================================================
// AUDIT LOG HELPER
// =========================================================
//
// IMPORTANT:
// Audit logging must NEVER cause the actual election
// operation to fail.
//
// If an election action succeeds but the audit log
// encounters an error, the original election action
// remains successful.
//

const writeAuditLog = async (
    req,
    {
        action,
        description,
        electionId = null,
        targetId = null,
        targetType = null,
        metadata = {}
    }
) => {

    try {

        const user =
            req.user || {};

        await createAuditLog({

            // -------------------------------------------------
            // ACTOR
            // -------------------------------------------------

            actorId:
                user._id ||
                user.id ||
                user.user_id ||
                null,

            actorName:
                user.full_name ||
                user.fullName ||
                user.name ||
                null,

            actorEmail:
                user.email ||
                null,

            actorRole:
                user.role ||
                null,

            // -------------------------------------------------
            // ACTION
            // -------------------------------------------------

            action,

            module:
                "Election Management",

            description,

            // -------------------------------------------------
            // TARGET
            // -------------------------------------------------

            electionId,

            targetId,

            targetType,

            // -------------------------------------------------
            // SAFE METADATA
            // -------------------------------------------------

            metadata,

            // -------------------------------------------------
            // REQUEST INFORMATION
            // -------------------------------------------------

            ipAddress:
                req.ip ||
                req.headers?.["x-forwarded-for"] ||
                null,

            userAgent:
                req.get?.("user-agent") ||
                null
        });

    } catch (auditError) {

        // -----------------------------------------------------
        // IMPORTANT
        // Do NOT throw this error.
        //
        // The election operation has already succeeded.
        // Audit logging failure must not undo it.
        // -----------------------------------------------------

        console.error(
            "Audit log error:",
            auditError
        );
    }
};


// =========================================================
// CREATE ELECTION
// =========================================================

const createElection = async (
    req,
    res
) => {

    try {

        const election =
            await electionService.createElection(
                req.body,
                req.user?._id ||
                req.user?.id
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "create",

                description:
                    `Created election "${election?.title || election?.name || "Untitled election"}".`,

                electionId:
                    election?.id ||
                    election?._id ||
                    null,

                targetId:
                    election?.id ||
                    election?._id ||
                    null,

                targetType:
                    "election",

                metadata: {
                    electionTitle:
                        election?.title ||
                        election?.name ||
                        null
                }
            }
        );


        return res.status(201).json({

            success:
                true,

            message:
                "Election created successfully.",

            election,

        });

    } catch (error) {

        console.error(
            "Create election error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// GET ALL ELECTIONS
// =========================================================

const getAllElections = async (
    req,
    res
) => {

    try {

        const elections =
            await electionService.getAllElections();


        const electionList =
            Array.isArray(elections)
                ? elections
                : [];


        console.log(
            `📋 Elections loaded: ${electionList.length}`
        );


        return res.status(200).json({

            success:
                true,

            count:
                electionList.length,

            elections:
                electionList,

        });

    } catch (error) {

        console.error(
            "Get elections error:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                error.message ||
                "Unable to load elections.",

            elections:
                [],

        });
    }
};


// =========================================================
// GET ELECTION BY ID
// =========================================================

const getElectionById = async (
    req,
    res
) => {

    try {

        const election =
            await electionService.getElectionById(
                req.params.id
            );


        // -------------------------------------------------
        // IMPORTANT
        // Never access election.status or other properties
        // if the service did not return an election.
        // -------------------------------------------------

        if (!election) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "Election not found.",

            });
        }


        return res.status(200).json({

            success:
                true,

            election,

        });

    } catch (error) {

        console.error(
            "Get election error:",
            error
        );


        return res.status(404).json({

            success:
                false,

            message:
                error.message ||
                "Election not found.",

        });
    }
};


// =========================================================
// DELETE ELECTION
// =========================================================

const deleteElection = async (
    req,
    res
) => {

    try {

        const electionId =
            req.params.id;


        // -------------------------------------------------
        // Validate ID
        // -------------------------------------------------

        if (!electionId) {

            return res.status(400).json({

                success:
                    false,

                code:
                    "ELECTION_ID_REQUIRED",

                message:
                    "Election ID is required.",

            });
        }


        // -------------------------------------------------
        // IMPORTANT:
        // Let electionService.deleteElection() perform
        // all deletion safety checks.
        //
        // It should prevent deletion of:
        //
        // - open elections
        // - closed/completed elections
        // - elections containing ballot records
        // -------------------------------------------------

        const deletedElection =
            await electionService.deleteElection(
                electionId
            );


        // -------------------------------------------------
        // AUDIT LOG
        //
        // The deletion succeeded, therefore record it.
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "delete",

                description:
                    `Deleted election "${deletedElection?.title || deletedElection?.name || electionId}".`,

                electionId:
                    electionId,

                targetId:
                    electionId,

                targetType:
                    "election",

                metadata: {
                    electionTitle:
                        deletedElection?.title ||
                        deletedElection?.name ||
                        null
                }
            }
        );


        // -------------------------------------------------
        // Successful deletion
        // -------------------------------------------------

        return res.status(200).json({

            success:
                true,

            message:
                "Election deleted successfully.",

            election:
                deletedElection,

        });

    } catch (error) {

        console.error(
            "Delete election error:",
            error
        );


        // -------------------------------------------------
        // Use the status code supplied by the service.
        // Otherwise use 400.
        // -------------------------------------------------

        const statusCode =
            Number.isInteger(
                error?.statusCode
            )
                ? error.statusCode
                : 400;


        return res.status(
            statusCode
        ).json({

            success:
                false,

            code:
                error?.code ||
                "ELECTION_DELETE_FAILED",

            message:
                error?.message ||
                "Unable to delete election.",

        });
    }
};


// =========================================================
// UPDATE ELECTION
// =========================================================

const updateElection = async (
    req,
    res
) => {

    try {

        const election =
            await electionService.updateElection(
                req.params.id,
                req.body
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "update",

                description:
                    `Updated election "${election?.title || election?.name || req.params.id}".`,

                electionId:
                    req.params.id,

                targetId:
                    req.params.id,

                targetType:
                    "election",

                metadata: {
                    electionTitle:
                        election?.title ||
                        election?.name ||
                        null
                }
            }
        );


        return res.status(200).json({

            success:
                true,

            message:
                "Election updated successfully.",

            election,

        });

    } catch (error) {

        console.error(
            "Update election error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// UPDATE STATUS
// =========================================================

const updateElectionStatus = async (
    req,
    res
) => {

    try {

        const {
            status,
        } = req.body;


        if (!status) {

            return res.status(400).json({

                success:
                    false,

                message:
                    "Election status is required.",

            });
        }


        const election =
            await electionService.updateElectionStatus(
                req.params.id,
                status
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "status_update",

                description:
                    `Updated election status to "${status}".`,

                electionId:
                    req.params.id,

                targetId:
                    req.params.id,

                targetType:
                    "election",

                metadata: {
                    status
                }
            }
        );


        return res.status(200).json({

            success:
                true,

            message:
                "Election status updated successfully.",

            election,

        });

    } catch (error) {

        console.error(
            "Update election status error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// PUBLISH
// =========================================================

const publishElection = async (
    req,
    res
) => {

    try {

        const election =
            await electionService.publishElection(
                req.params.id
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "publish",

                description:
                    `Published election "${election?.title || election?.name || req.params.id}".`,

                electionId:
                    req.params.id,

                targetId:
                    req.params.id,

                targetType:
                    "election",

                metadata: {
                    electionTitle:
                        election?.title ||
                        election?.name ||
                        null
                }
            }
        );


        return res.status(200).json({

            success:
                true,

            message:
                "Election published successfully.",

            election,

        });

    } catch (error) {

        console.error(
            "Publish election error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// UNPUBLISH
// =========================================================

const unpublishElection = async (
    req,
    res
) => {

    try {

        const election =
            await electionService.unpublishElection(
                req.params.id
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "unpublish",

                description:
                    `Unpublished election "${election?.title || election?.name || req.params.id}".`,

                electionId:
                    req.params.id,

                targetId:
                    req.params.id,

                targetType:
                    "election",

                metadata: {
                    electionTitle:
                        election?.title ||
                        election?.name ||
                        null
                }
            }
        );


        return res.status(200).json({

            success:
                true,

            message:
                "Election unpublished successfully.",

            election,

        });

    } catch (error) {

        console.error(
            "Unpublish election error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// ADD POSITION
// =========================================================

const addPosition = async (
    req,
    res
) => {

    try {

        const position =
            await electionService.addPosition(
                req.params.id,
                req.body
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "add_position",

                description:
                    `Added position "${position?.name || position?.position || "Unnamed position"}" to the election.`,

                electionId:
                    req.params.id,

                targetId:
                    position?.id ||
                    position?._id ||
                    null,

                targetType:
                    "position",

                metadata: {
                    positionName:
                        position?.name ||
                        position?.position ||
                        null
                }
            }
        );


        return res.status(201).json({

            success:
                true,

            message:
                "Position added successfully.",

            position,

        });

    } catch (error) {

        console.error(
            "Add position error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// GET POSITIONS
// =========================================================

const getElectionPositions = async (
    req,
    res
) => {

    try {

        const positions =
            await electionService.getElectionPositions(
                req.params.id
            );


        const positionList =
            Array.isArray(positions)
                ? positions
                : [];


        return res.status(200).json({

            success:
                true,

            count:
                positionList.length,

            positions:
                positionList,

        });

    } catch (error) {

        console.error(
            "Get positions error:",
            error
        );


        return res.status(404).json({

            success:
                false,

            message:
                error.message,

            positions:
                [],

        });
    }
};


// =========================================================
// UPDATE POSITION
// =========================================================

const updatePosition = async (
    req,
    res
) => {

    try {

        const position =
            await electionService.updatePosition(
                req.params.positionId,
                req.body
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "update_position",

                description:
                    `Updated position "${position?.name || position?.position || req.params.positionId}".`,

                electionId:
                    position?.election_id ||
                    position?.electionId ||
                    null,

                targetId:
                    position?.id ||
                    position?._id ||
                    req.params.positionId,

                targetType:
                    "position",

                metadata: {
                    positionName:
                        position?.name ||
                        position?.position ||
                        null
                }
            }
        );


        return res.status(200).json({

            success:
                true,

            message:
                "Position updated successfully.",

            position,

        });

    } catch (error) {

        console.error(
            "Update position error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// DEACTIVATE POSITION
// =========================================================

const deactivatePosition = async (
    req,
    res
) => {

    try {

        const position =
            await electionService.deactivatePosition(
                req.params.positionId
            );


        // -------------------------------------------------
        // AUDIT LOG
        // -------------------------------------------------

        await writeAuditLog(
            req,
            {
                action:
                    "deactivate_position",

                description:
                    `Deactivated position "${position?.name || position?.position || req.params.positionId}".`,

                electionId:
                    position?.election_id ||
                    position?.electionId ||
                    null,

                targetId:
                    position?.id ||
                    position?._id ||
                    req.params.positionId,

                targetType:
                    "position",

                metadata: {
                    positionName:
                        position?.name ||
                        position?.position ||
                        null
                }
            }
        );


        return res.status(200).json({

            success:
                true,

            message:
                "Position deactivated successfully.",

            position,

        });

    } catch (error) {

        console.error(
            "Deactivate position error:",
            error
        );


        return res.status(400).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// GET ACTIVE ELECTION
// =========================================================

const getActiveElection = async (
    req,
    res
) => {

    try {

        const election =
            await electionService.getActiveElection();


        if (!election) {

            return res.status(404).json({

                success:
                    false,

                message:
                    "There is currently no active election.",

            });
        }


        return res.status(200).json({

            success:
                true,

            election,

        });

    } catch (error) {

        console.error(
            "Get active election error:",
            error
        );


        return res.status(500).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// GET ELECTION CONFIGURATION
// =========================================================

const getElectionConfiguration = async (
    req,
    res
) => {

    try {

        const configuration =
            await electionService.getElectionConfiguration(
                req.params.id
            );


        return res.status(200).json({

            success:
                true,

            ...configuration,

        });

    } catch (error) {

        console.error(
            "Get election configuration error:",
            error
        );


        return res.status(404).json({

            success:
                false,

            message:
                error.message,

        });
    }
};


// =========================================================
// EXPORTS
// =========================================================

module.exports = {

    createElection,

    getAllElections,

    getElectionById,

    updateElection,

    deleteElection,

    updateElectionStatus,

    publishElection,

    unpublishElection,

    addPosition,

    getElectionPositions,

    updatePosition,

    deactivatePosition,

    getActiveElection,

    getElectionConfiguration,

};