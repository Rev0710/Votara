const express = require("express");

const {
    getKioskElections,
    getActiveKioskSession,
    getKioskSessions,

    startKioskSession,
    heartbeatKioskSession,
    closeKioskSession,
    cancelKioskSession,

    verifyKioskStudent,
    authorizeKioskStudent,

    submitKioskRegistration,
    approveKioskRegistration,
    setKioskPersonalPassword,

    startKioskOperation,
    heartbeatKioskOperation,
    finishKioskOperation,
    abortKioskOperation,
} = require("../controllers/kioskController");

const authenticateElectoralBoard =
    require("../middleware/authenticateElectoralBoard");

const router = express.Router();

// =========================================================
// STUDENT-SIDE KIOSK ACTIVATION
//
// IMPORTANT:
// This route must stay BEFORE the Electoral Board
// authentication middleware because the student uses
// the kiosk activation token here.
// =========================================================

router.post(
    "/registration/set-password",
    setKioskPersonalPassword
);

// =========================================================
// ELECTORAL BOARD AUTHENTICATION
// =========================================================

router.use(
    authenticateElectoralBoard
);

// =========================================================
// KIOSK ELECTIONS
// =========================================================

router.get(
    "/elections",
    getKioskElections
);

// =========================================================
// ACTIVE SHARED KIOSK SESSION
// =========================================================

router.get(
    "/active",
    getActiveKioskSession
);

// =========================================================
// KIOSK SESSION HISTORY
// =========================================================

router.get(
    "/sessions",
    getKioskSessions
);

// =========================================================
// START SHARED KIOSK SESSION
// =========================================================

router.post(
    "/start",
    startKioskSession
);

// =========================================================
// STUDENT VERIFICATION
// =========================================================

router.post(
    "/verify-student",
    verifyKioskStudent
);

// =========================================================
// AUTHORIZE EXISTING STUDENT
// =========================================================

router.post(
    "/authorize-student",
    authorizeKioskStudent
);

// =========================================================
// ASSISTED REGISTRATION
// =========================================================

router.post(
    "/registration/submit",
    submitKioskRegistration
);

router.post(
    "/registration/approve",
    approveKioskRegistration
);

// =========================================================
// KIOSK OPERATION MANAGEMENT
// =========================================================

router.post(
    "/operation/start",
    startKioskOperation
);

router.patch(
    "/operation/:id/heartbeat",
    heartbeatKioskOperation
);

router.post(
    "/operation/:id/complete",
    finishKioskOperation
);

router.post(
    "/operation/:id/cancel",
    abortKioskOperation
);

// =========================================================
// KIOSK SESSION HEARTBEAT
// =========================================================

router.patch(
    "/:id/heartbeat",
    heartbeatKioskSession
);

// =========================================================
// CLOSE KIOSK SESSION
// =========================================================

router.post(
    "/:id/close",
    closeKioskSession
);

// =========================================================
// CANCEL KIOSK SESSION
// =========================================================

router.post(
    "/:id/cancel",
    cancelKioskSession
);

module.exports = router;