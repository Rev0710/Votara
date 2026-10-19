const express = require("express");

const {
    registerEB,
    loginEB
} = require("../controllers/ebAuthController");

const router = express.Router();

// EB Registration
router.post("/register", registerEB);

// EB Login
router.post("/login", require("../middleware/auditStaffLogin"),
    loginEB);

module.exports = router;