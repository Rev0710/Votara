const express = require("express");

const {
    getStudentProfile,
    updateStudentProfile,
    changeStudentPassword,
    updateStudentProfilePicture,
    removeStudentProfilePicture,
    deactivateStudentAccount,
    requestStudentAccountDeletion,
} = require("../controllers/studentController");

const protectStudent =
    require("../middleware/protectStudent");

const router =
    express.Router();


// =========================================================
// ALL STUDENT ACCOUNT ROUTES REQUIRE STUDENT LOGIN
// =========================================================

router.use(
    protectStudent
);


// =========================================================
// PROFILE
// =========================================================

router.get(
    "/profile",
    getStudentProfile
);

router.patch(
    "/profile",
    updateStudentProfile
);


// =========================================================
// PROFILE PICTURE
// =========================================================

router.patch(
    "/profile-picture",
    updateStudentProfilePicture
);

router.delete(
    "/profile-picture",
    removeStudentProfilePicture
);


// =========================================================
// PASSWORD
// =========================================================

router.patch(
    "/password",
    changeStudentPassword
);


// =========================================================
// ACCOUNT
// =========================================================

router.post(
    "/deactivate",
    deactivateStudentAccount
);

router.delete(
    "/account",
    requestStudentAccountDeletion
);


module.exports =
    router;