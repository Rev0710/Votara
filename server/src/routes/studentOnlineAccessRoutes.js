const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const controller = require("../controllers/studentOnlineAccessController");
const limiter = limit => rateLimit({windowMs:15*60*1000,limit,standardHeaders:"draft-8",legacyHeaders:false,
    message:{success:false,message:"Too many activation attempts. Please try again later."}});
router.post("/request-code",limiter(30),controller.requestCode);
router.post("/complete",limiter(60),controller.complete);
module.exports = router;