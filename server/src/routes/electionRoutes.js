const express = require("express");

const router = express.Router();

const {
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
} = require("../controllers/electionController");

// =========================================================
// ELECTION ROUTES
// =========================================================

// Create election
router.post("/", createElection);

// Get all elections
router.get("/", getAllElections);

// Get currently active election
router.get("/active", getActiveElection);

// Get complete election configuration
router.get(
  "/:id/configuration",
  getElectionConfiguration
);

// Get election by ID
router.get("/:id", getElectionById);

// Update election
router.put("/:id", updateElection);

// Delete election
router.delete("/:id", deleteElection);

// Update election status
router.patch(
  "/:id/status",
  updateElectionStatus
);

// Publish election
router.patch(
  "/:id/publish",
  publishElection
);

// Unpublish election
router.patch(
  "/:id/unpublish",
  unpublishElection
);

// =========================================================
// POSITION ROUTES
// =========================================================

// Add position to election
router.post(
  "/:id/positions",
  addPosition
);

// Get all positions for election
router.get(
  "/:id/positions",
  getElectionPositions
);

// Update position
router.put(
  "/positions/:positionId",
  updatePosition
);

// Deactivate position
router.patch(
  "/positions/:positionId/deactivate",
  deactivatePosition
);

module.exports = router;