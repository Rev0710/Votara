const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");

const REPORT_FIELDS = `
    id, reference, student_id, student_number, student_name,
    category, subject, description, attachment_name, attachment_path,
    contact_email, status, admin_response, created_at, updated_at, resolved_at
`;
const VALID_CATEGORIES = [
    "Voting issue",
    "Account or profile",
    "Candidate information",
    "Election results",
    "Other",
];
const VALID_STATUSES = ["submitted", "in_review", "resolved", "closed"];
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const BUCKET = "student-issue-attachments";

const safeReport = async (report, includeAttachment = true) => {
    if (!report) return report;
    let attachmentUrl = null;
    if (includeAttachment && report.attachment_path) {
        const { data } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(report.attachment_path, 60 * 60);
        attachmentUrl = data?.signedUrl || null;
    }
    return { ...report, attachment_url: attachmentUrl };
};

const writeHistory = async ({ reportId, status, actorRole, actorId, note }) => {
    const { error } = await supabase.from("student_issue_report_history").insert({
        report_id: reportId,
        status,
        actor_role: actorRole,
        actor_id: actorId ? String(actorId) : null,
        note: note || null,
    });
    if (error) throw error;
};

const authenticateAdmin = async (req) => {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
        const error = new Error("Authentication token is required.");
        error.statusCode = 401;
        throw error;
    }
    let decoded;
    try {
        decoded = jwt.verify(header.slice(7).trim(), process.env.JWT_SECRET);
    } catch {
        const error = new Error("Invalid or expired administrator session.");
        error.statusCode = 401;
        throw error;
    }
    if (decoded?.role !== "admin" || !decoded.userId) {
        const error = new Error("Administrator access is required.");
        error.statusCode = 403;
        throw error;
    }
    const { data: admin, error: dbError } = await supabase
        .from("staff_users")
        .select("id, full_name, role, is_active")
        .eq("id", decoded.userId)
        .eq("role", "admin")
        .maybeSingle();
    if (dbError) throw dbError;
    if (!admin || admin.is_active !== true) {
        const error = new Error("Active administrator account is required.");
        error.statusCode = 403;
        throw error;
    }
    return admin;
};

const handleError = (res, error, fallback) => {
    console.error("Student issue report error:", error);
    return res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || fallback,
    });
};

exports.createStudentIssueReport = async (req, res) => {
    let uploadedPath = null;
    try {
        const studentId = req.student?.id;
        if (!studentId) return res.status(401).json({ success: false, message: "Student authentication is required." });

        const { data: student, error: studentError } = await supabase
            .from("students")
            .select("id, student_id, full_name")
            .eq("id", studentId)
            .maybeSingle();
        if (studentError) throw studentError;
        if (!student) return res.status(404).json({ success: false, message: "Student record was not found." });
        const { data: account, error: accountError } = await supabase
            .from("student_accounts")
            .select("email")
            .eq("student_id", student.student_id)
            .maybeSingle();
        if (accountError) throw accountError;

        const category = String(req.body?.category || "").trim();
        const subject = String(req.body?.subject || "").trim();
        const description = String(req.body?.description || "").trim();
        const contactEmail = String(req.body?.contactEmail || account?.email || "").trim();
        if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ success: false, message: "Select a valid issue category." });
        if (subject.length < 4 || subject.length > 160) return res.status(400).json({ success: false, message: "Subject must contain 4–160 characters." });
        if (description.length < 10 || description.length > 5000) return res.status(400).json({ success: false, message: "Description must contain 10–5,000 characters." });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return res.status(400).json({ success: false, message: "Enter a valid contact email." });

        let attachmentName = null;
        let attachmentPath = null;
        const attachment = req.body?.attachment;
        if (attachment && attachment.data) {
            const mime = String(attachment.type || "").toLowerCase();
            const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
            if (!allowedTypes.includes(mime)) return res.status(400).json({ success: false, message: "Attachment must be JPG, PNG, WEBP, or PDF." });
            const base64 = String(attachment.data).replace(/^data:[^;]+;base64,/, "");
            const buffer = Buffer.from(base64, "base64");
            if (!buffer.length || buffer.length > MAX_ATTACHMENT_BYTES) return res.status(400).json({ success: false, message: "Attachment must be no larger than 5 MB." });
            const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" })[mime];
            const safeName = String(attachment.name || `attachment.${extension}`).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
            uploadedPath = `${student.id}/${crypto.randomUUID()}.${extension}`;
            const { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadedPath, buffer, { contentType: mime, upsert: false });
            if (uploadError) throw uploadError;
            attachmentName = safeName;
            attachmentPath = uploadedPath;
        }

        const reference = `VT-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
        const { data: report, error: insertError } = await supabase
            .from("student_issue_reports")
            .insert({
                reference,
                student_id: student.id,
                student_number: student.student_id ? String(student.student_id) : null,
                student_name: student.full_name || "Student",
                category,
                subject,
                description,
                attachment_name: attachmentName,
                attachment_path: attachmentPath,
                contact_email: contactEmail,
                status: "submitted",
            })
            .select(REPORT_FIELDS)
            .single();
        if (insertError) throw insertError;

        await writeHistory({ reportId: report.id, status: "submitted", actorRole: "student", actorId: student.id, note: "Report submitted by student." });
        return res.status(201).json({ success: true, report: await safeReport(report) });
    } catch (error) {
        if (uploadedPath) {
            await supabase.storage.from(BUCKET).remove([uploadedPath]).catch(() => {});
        }
        return handleError(res, error, "Unable to submit your report.");
    }
};

exports.getStudentIssueReports = async (req, res) => {
    try {
        const studentId = req.student?.id;
        if (!studentId) return res.status(401).json({ success: false, message: "Student authentication is required." });
        const { data, error } = await supabase.from("student_issue_reports")
            .select(REPORT_FIELDS).eq("student_id", studentId).order("created_at", { ascending: false });
        if (error) throw error;
        const reports = await Promise.all((data || []).map((item) => safeReport(item)));
        return res.json({ success: true, reports });
    } catch (error) {
        return handleError(res, error, "Unable to load report history.");
    }
};

exports.getStudentIssueReportHistory = async (req, res) => {
    try {
        const studentId = req.student?.id;
        const { data: report, error: reportError } = await supabase.from("student_issue_reports")
            .select("id, reference, student_id").eq("id", req.params.id).eq("student_id", studentId).maybeSingle();
        if (reportError) throw reportError;
        if (!report) return res.status(404).json({ success: false, message: "Report was not found." });
        const { data, error } = await supabase.from("student_issue_report_history")
            .select("id, status, actor_role, note, created_at").eq("report_id", report.id).order("created_at", { ascending: true });
        if (error) throw error;
        return res.json({ success: true, history: data || [] });
    } catch (error) {
        return handleError(res, error, "Unable to load report history.");
    }
};

exports.getAdminStudentIssueReports = async (req, res) => {
    try {
        await authenticateAdmin(req);
        const status = String(req.query.status || "").trim();
        let query = supabase.from("student_issue_reports").select(REPORT_FIELDS).order("created_at", { ascending: false }).limit(200);
        if (status && VALID_STATUSES.includes(status)) query = query.eq("status", status);
        const { data, error } = await query;
        if (error) throw error;
        const reports = await Promise.all((data || []).map((item) => safeReport(item)));
        return res.json({ success: true, reports });
    } catch (error) {
        return handleError(res, error, "Unable to load student issue reports.");
    }
};

exports.updateAdminStudentIssueReport = async (req, res) => {
    try {
        const admin = await authenticateAdmin(req);
        const status = String(req.body?.status || "").trim();
        const adminResponse = String(req.body?.adminResponse || "").trim();
        if (!VALID_STATUSES.includes(status)) return res.status(400).json({ success: false, message: "Select a valid report status." });
        if (adminResponse.length > 2000) return res.status(400).json({ success: false, message: "Response must be 2,000 characters or fewer." });

        const { data: existing, error: lookupError } = await supabase.from("student_issue_reports")
            .select("id, status").eq("id", req.params.id).maybeSingle();
        if (lookupError) throw lookupError;
        if (!existing) return res.status(404).json({ success: false, message: "Student issue report was not found." });

        const update = {
            status,
            admin_response: adminResponse || null,
            updated_at: new Date().toISOString(),
            resolved_at: ["resolved", "closed"].includes(status) ? new Date().toISOString() : null,
        };
        const { data: report, error } = await supabase.from("student_issue_reports")
            .update(update).eq("id", req.params.id).select(REPORT_FIELDS).single();
        if (error) throw error;
        if (existing.status !== status || adminResponse) {
            await writeHistory({ reportId: report.id, status, actorRole: "admin", actorId: admin.id, note: adminResponse || `Status changed to ${status.replace("_", " ")}.` });
        }
        return res.json({ success: true, report: await safeReport(report) });
    } catch (error) {
        return handleError(res, error, "Unable to update student issue report.");
    }
};

exports.getAdminStudentIssueReportHistory = async (req, res) => {
    try {
        await authenticateAdmin(req);
        const { data: report, error: reportError } = await supabase.from("student_issue_reports")
            .select("id, reference").eq("id", req.params.id).maybeSingle();
        if (reportError) throw reportError;
        if (!report) return res.status(404).json({ success: false, message: "Student issue report was not found." });
        const { data, error } = await supabase.from("student_issue_report_history")
            .select("id, status, actor_role, note, created_at").eq("report_id", report.id).order("created_at", { ascending: true });
        if (error) throw error;
        return res.json({ success: true, history: data || [] });
    } catch (error) {
        return handleError(res, error, "Unable to load report history.");
    }
};
