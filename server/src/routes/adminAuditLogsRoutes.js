const express = require("express");

const {
    getAdminAuditLogs,
    getAdminAuditLogById,
} = require("../controllers/adminAuditLogsController");

const router = express.Router();

// ADMIN-ONLY MONITORING LOGS
router.get(
    "/",
    getAdminAuditLogs
);

router.get(
    "/:id",
    getAdminAuditLogById
);

module.exports = router;
