const express = require("express");

const {
    registerEB,
    loginEB,
    keepEBSession
} = require("../controllers/ebAuthController");
const authenticateElectoralBoard = require("../middleware/authenticateElectoralBoard");

const router = express.Router();

// EB Registration
router.post("/register", registerEB);

// EB Login
router.post("/login", require("../middleware/auditStaffLogin"),
    loginEB);

router.post("/session/keepalive", authenticateElectoralBoard, keepEBSession);

module.exports = router;
