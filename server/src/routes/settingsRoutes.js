const express = require("express");

const {
    getSettings,
    getAccountStatus
} = require("../controllers/settingsController");

const router = express.Router();


// =========================================================
// VOTARA ELECTORAL BOARD SETTINGS
// =========================================================


// GET Electoral Board settings
router.get(
    "/",
    getSettings
);


// GET current account status
router.get(
    "/account-status",
    getAccountStatus
);


module.exports = router;