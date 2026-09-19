const express = require("express");

const router = express.Router();

const {
    getAllCandidates,
    getCandidateById,
    getCandidateStudents,
    createCandidate,
    updateCandidate,
    activateCandidate,
    deactivateCandidate,
    deleteCandidate,
} = require("../controllers/candidateController");

// =========================================================
// CANDIDATES
// =========================================================

// GET /api/candidates
router.get(
    "/",
    getAllCandidates
);

// GET /api/candidates/students
// IMPORTANT: keep this BEFORE /:id
router.get(
    "/students",
    getCandidateStudents
);

// GET /api/candidates/:id
router.get(
    "/:id",
    getCandidateById
);

// POST /api/candidates
router.post(
    "/",
    createCandidate
);

// PUT /api/candidates/:id
router.put(
    "/:id",
    updateCandidate
);

// PATCH /api/candidates/:id/activate
router.patch(
    "/:id/activate",
    activateCandidate
);

// PATCH /api/candidates/:id/deactivate
router.patch(
    "/:id/deactivate",
    deactivateCandidate
);

// =========================================================
// DELETE CANDIDATE
// Only inactive candidates may be permanently deleted.
// =========================================================

// DELETE /api/candidates/:id
router.delete(
    "/:id",
    deleteCandidate
);

module.exports = router;