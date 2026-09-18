const express = require("express");

const router = express.Router();

const {
    getAllPartyLists,
    getPartyListById,
    createPartyList,
    updatePartyList,
    approvePartyList,
    rejectPartyList,
    activatePartyList,
    deactivatePartyList,
    getPartyListCandidates,
} = require("../controllers/partyListController");

// =====================================================
// PARTY LIST ROUTES
// =====================================================

// GET ALL PARTY LISTS
// GET /api/party-lists
// Optional:
// GET /api/party-lists?election_id=UUID

router.get(
    "/",
    getAllPartyLists
);


// =====================================================
// GET PARTY LIST BY ID
// =====================================================

// GET /api/party-lists/:id

router.get(
    "/:id",
    getPartyListById
);


// =====================================================
// CREATE PARTY LIST
// =====================================================

// POST /api/party-lists

router.post(
    "/",
    createPartyList
);


// =====================================================
// UPDATE PARTY LIST
// =====================================================

// PUT /api/party-lists/:id

router.put(
    "/:id",
    updatePartyList
);


// =====================================================
// APPROVE PARTY LIST
// =====================================================

// PATCH /api/party-lists/:id/approve

router.patch(
    "/:id/approve",
    approvePartyList
);


// =====================================================
// REJECT PARTY LIST
// =====================================================

// PATCH /api/party-lists/:id/reject

router.patch(
    "/:id/reject",
    rejectPartyList
);


// =====================================================
// ACTIVATE PARTY LIST
// =====================================================

// PATCH /api/party-lists/:id/activate

router.patch(
    "/:id/activate",
    activatePartyList
);


// =====================================================
// DEACTIVATE PARTY LIST
// =====================================================

// PATCH /api/party-lists/:id/deactivate

router.patch(
    "/:id/deactivate",
    deactivatePartyList
);


// =====================================================
// VIEW PARTY LIST CANDIDATES
// =====================================================

// GET /api/party-lists/:id/candidates

router.get(
    "/:id/candidates",
    getPartyListCandidates
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;