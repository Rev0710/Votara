const electionService = require("../services/electionService");


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