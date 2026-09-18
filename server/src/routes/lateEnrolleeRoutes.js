const express = require("express");

const router = express.Router();

const lateEnrolleeController =
    require("../controllers/lateEnrolleeController");

// ============================================================
// LATE ENROLLEE ROUTES
// ============================================================

router.get(
    "/",
    lateEnrolleeController.getLateEnrolleeApplications
);

router.get(
    "/:id/documents",
    lateEnrolleeController.getLateEnrolleeDocuments
);

router.patch(
    "/:id/approve",
    lateEnrolleeController.approveLateEnrollee
);

router.patch(
    "/:id/reject",
    lateEnrolleeController.rejectLateEnrollee
);

router.patch(
    "/:id/correction",
    lateEnrolleeController.requestCorrection
);

module.exports = router;