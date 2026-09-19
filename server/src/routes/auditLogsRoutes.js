const express = require("express");

const {
    getAuditLogs,
    getAuditLogById
} = require("../controllers/auditLogsController");

const router = express.Router();

// =========================================================
// AUDIT LOGS
// =========================================================

// GET all audit logs
router.get(
    "/",
    getAuditLogs
);

// GET a single audit log by ID
router.get(
    "/:id",
    getAuditLogById
);

module.exports = router;