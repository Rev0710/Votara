const express = require("express");

const {
    uploadRegistrationRequirements,
} = require("../controllers/registrationDocumentsController");

const router = express.Router();


// =========================================================
// UPLOAD REGISTRATION REQUIREMENTS
// =========================================================

router.post(
    "/upload",
    uploadRegistrationRequirements
);


module.exports = router;