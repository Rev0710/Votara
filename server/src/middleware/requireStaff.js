const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

// Resolve roles from the current account as well as the signed token.
const requireStaff = (...roles) => async (req, res, next) => {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Staff authentication is required." });
    }
    let claims;
    try {
        claims = jwt.verify(authorization.slice(7).trim(), process.env.JWT_SECRET, {
            algorithms: ["HS256"],
        });
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired staff session." });
    }
    const id = claims.userId || claims.id;
    if (!id || !roles.includes(claims.role)) {
        const isEBRoute = roles.includes("electoral_board");
        return res.status(403).json({
            success: false,
            message: isEBRoute
                ? "Electoral Board access is required. Sign in with an active Electoral Board account."
                : "You do not have permission for this action.",
        });
    }
    try {
        const { data: staff, error } = await supabase.from("staff_users")
            .select("id, email, full_name, role, is_active").eq("id", id).maybeSingle();
        if (error) {
            return res.status(503).json({ success: false, message: "Unable to verify staff account." });
        }
        if (!staff || staff.is_active !== true || staff.role !== claims.role || !roles.includes(staff.role)) {
            return res.status(403).json({ success: false, message: "Staff account is inactive or unavailable." });
        }
        req.user = { id: staff.id, userId: staff.id, email: staff.email,
            fullName: staff.full_name, role: staff.role };
        return next();
    } catch {
        return res.status(503).json({ success: false, message: "Unable to verify staff account." });
    }
};

module.exports = requireStaff;
