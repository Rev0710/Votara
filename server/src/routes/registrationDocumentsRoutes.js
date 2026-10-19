const express = require("express");

const {
    uploadRegistrationRequirements,
} = require("../controllers/registrationDocumentsController");

const router = express.Router();
const { requireRegistrationSession } = require("../services/registrationSessionService");


// =========================================================
// UPLOAD REGISTRATION REQUIREMENTS
// =========================================================

router.post(
    "/upload",
    requireRegistrationSession,
    uploadRegistrationRequirements
);


module.exports = router;
