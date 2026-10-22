const express = require("express");

const {
    getAdminDashboard,
    getAdminAccounts,
    getElectoralBoardAccounts,
    createElectoralBoardAccount,
    createAdminAccount,
    resetAdminPassword,
    activateAdminAccount,
    deactivateAdminAccount,
    deleteAdminAccount,
    deleteElectoralBoardAccount,
    activateElectoralBoardAccount,
    deactivateElectoralBoardAccount,
    resetElectoralBoardPassword,
} = require("../controllers/adminController");

const adminReportsRoutes =
    require("./adminReportsRoutes");

const router = express.Router();

router.get("/dashboard", getAdminDashboard);

// Reports & Analytics
router.use(
    "/reports",
    adminReportsRoutes
);

router.post("/admin", createAdminAccount);
router.get("/admin", getAdminAccounts);
router.post("/admin/:id/reset-password", resetAdminPassword);
router.patch("/admin/:id/activate", activateAdminAccount);
router.patch("/admin/:id/deactivate", deactivateAdminAccount);
router.delete("/admin/:id", deleteAdminAccount);

router.get("/electoral-board", getElectoralBoardAccounts);
router.post("/electoral-board", createElectoralBoardAccount);
router.patch("/electoral-board/:id/activate", activateElectoralBoardAccount);
router.patch("/electoral-board/:id/deactivate", deactivateElectoralBoardAccount);
router.post("/electoral-board/:id/reset-password", resetElectoralBoardPassword);
router.delete("/electoral-board/:id", deleteElectoralBoardAccount);

module.exports = router;
