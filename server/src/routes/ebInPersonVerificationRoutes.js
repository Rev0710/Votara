const express = require("express");
const requireStaff = require("../middleware/requireStaff");
const auditEBRequest = require("../middleware/auditEBRequest");
const {
    getInPersonVerificationStudents,
    verifyStudentInPerson,
    activateVerifiedStudent,
} = require("../controllers/ebInPersonVerificationController");

const router = express.Router();
router.use(requireStaff("electoral_board"));
router.use(auditEBRequest("Registration"));
router.get("/", getInPersonVerificationStudents);
router.patch("/:studentId/verify", verifyStudentInPerson);
router.patch("/:studentId/activate", activateVerifiedStudent);

module.exports = router;
