const express = require("express");

const {
    studentLogin,
    changeTemporaryPassword,
} = require("../controllers/studentAuthController");


const router = express.Router();


// =========================================================
// STUDENT LOGIN
// =========================================================

router.post(
    "/login",
    studentLogin
);


// =========================================================
// CHANGE TEMPORARY PASSWORD
// =========================================================

router.post(
    "/change-password",
    changeTemporaryPassword
);


module.exports = router;