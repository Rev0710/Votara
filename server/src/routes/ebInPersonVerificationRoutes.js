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

router.post("/:studentId/online-access", require("express-rate-limit")({windowMs:15*60*1000,limit:30,keyGenerator:req=>req.user.id,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many activation requests. Please try again later."}}), require("../controllers/studentOnlineAccessController").issue);

module.exports = router;
