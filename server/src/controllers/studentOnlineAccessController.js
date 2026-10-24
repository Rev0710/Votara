const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");
const {sendStudentOnlineAccessCode} = require("../services/emailService");
const tokenHash = token => crypto.createHash("sha256").update(token).digest("hex");
const cleanToken = value => String(value || "").replace(/[\s-]/g, "").toLowerCase();
const otpHash = (token, challenge, otp) => crypto.createHmac("sha256", process.env.JWT_SECRET)
    .update(`online-access:${tokenHash(token)}:${challenge}:${otp}`).digest("hex");
const validToken = token => /^[a-f0-9]{32}$/.test(token);
function unavailable(res, error) {
    console.error("Online access activation unavailable:", error.code || "unknown");
    return res.status(503).json({success:false,message:"Online activation is temporarily unavailable. Please contact the Electoral Board."});
}
function rpcResponse(res, data) {
    if (data?.retryAfter) res.set("Retry-After", String(data.retryAfter));
    return res.status(data?.success ? 200 : data?.retryAfter ? 429 : 409).json(data || {success:false,message:"Unable to complete activation."});
}
exports.issue = async (req,res) => {
    try {
        if (req.body?.physicalIdChecked !== true) return res.status(400).json({success:false,message:"Confirm that you checked the student's physical ID for this activation."});
        if (!/^[a-f0-9-]{36}$/i.test(req.params.studentId || "")) return res.status(400).json({success:false,message:"Invalid student record."});
        const activationCode = crypto.randomBytes(16).toString("hex").toUpperCase();
        const {data,error} = await supabase.rpc("issue_student_online_access", {
            p_student_id:req.params.studentId,p_staff_id:req.user.id,p_token_hash:tokenHash(activationCode.toLowerCase()),
        });
        if (error) throw error;
        res.set("Cache-Control", "no-store");
        if (!data?.success) return rpcResponse(res,data);
        return res.json({...data,activationCode,message:"Give this one-time code only to the verified student. It expires in 30 minutes. A new code replaces the previous code."});
    } catch(error) { return unavailable(res,error); }
};
exports.requestCode = async (req,res) => {
    try {
        const token = cleanToken(req.body?.activationCode);
        const email = String(req.body?.email || "").trim().toLowerCase();
        if (!validToken(token) || email.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({success:false,message:"Enter your activation code and a valid email address."});
        }
        const challengeId = crypto.randomUUID();
        const code = String(crypto.randomInt(100000,1000000));
        const {data,error} = await supabase.rpc("request_student_online_code", {
            p_token_hash:tokenHash(token),p_email:email,p_challenge_id:challengeId,p_otp_hash:otpHash(token,challengeId,code),
        });
        if (error) throw error;
        if (!data?.success) return rpcResponse(res,data);
        try {
            const sent = await sendStudentOnlineAccessCode(email,code);
            if (sent === false) throw new Error("Delivery failed");
        } catch {
            await supabase.from("student_online_access").update({otp_hash:null,otp_expires_at:new Date().toISOString()})
                .eq("token_hash",tokenHash(token)).eq("challenge_id",challengeId);
            return res.status(503).json({success:false,retryAfter:30,message:"Email could not be sent. Wait 30 seconds, then try again."});
        }
        res.set("Cache-Control", "no-store");
        return res.json({success:true,challengeId,retryAfter:30,expiresAt:data.expiresAt,message:"Verification code sent. It expires in 5 minutes."});
    } catch(error) { return unavailable(res,error); }
};
exports.complete = async (req,res) => {
    try {
        const {challengeId,otp,password,confirmPassword} = req.body || {};
        const token = cleanToken(req.body?.activationCode);
        const phone = String(req.body?.contactNumber || "").trim();
        if (!validToken(token) || typeof challengeId!=="string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(challengeId) || typeof otp!=="string" || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({success:false,message:"Enter the 6-digit email code or request a new code."});
        }
        // Match the established student password policy without changing existing flows.
        if (typeof password!=="string" || password.length!==8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password) || password!==confirmPassword) {
            return res.status(400).json({success:false,message:"Use matching 8-character passwords with uppercase, lowercase, a number and a special character."});
        }
        if (phone && !/^\+?[0-9][0-9 ()-]{6,24}$/.test(phone)) return res.status(400).json({success:false,message:"Enter a valid contact number, or leave it blank."});
        const passwordHash = await bcrypt.hash(password,12);
        const {data,error} = await supabase.rpc("finish_student_online_access", {
            p_token_hash:tokenHash(token),p_challenge_id:challengeId,p_otp_hash:otpHash(token,challengeId,otp),p_password_hash:passwordHash,p_phone:phone,
        });
        if (error) throw error;
        res.set("Cache-Control", "no-store");
        return rpcResponse(res,data);
    } catch(error) { return unavailable(res,error); }
};