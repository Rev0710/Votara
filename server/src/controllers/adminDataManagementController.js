const jwt = require("jsonwebtoken");
const supabase = require("../config/supabase");
const auditLogsService = require("../services/auditLogsService");

// ============================================================
// VOTARA ADMIN — DATA MANAGEMENT CONTROLLER
// ============================================================
// This controller is intentionally self-contained so it does not
// change the existing Admin authentication middleware or student
// routes. It operates only on the Admin Data Management endpoints.
//
// CSV behavior:
// - Existing student_id => update that student record.
// - New student_id      => insert a new student record.
// - Duplicate IDs inside the CSV are rejected.
// - Duplicate IDs already existing in the database are rejected.
// - Student accounts/passwords are NOT created by this importer.
// - Election/candidate/party-list/ballot data is NOT touched.
// ============================================================

const ADMIN_MODULE = "Admin Data Management";
const MAX_IMPORT_RECORDS = 10000;

const clean = (value) =>
    value === undefined || value === null
        ? ""
        : String(value).trim();

const normalizeStatus = (value) => {
    const status = clean(value).toLowerCase();

    if (["late", "late enrollee", "late_enrollee"].includes(status)) {
        return "late_enrollee";
    }

    if (["inactive", "archived", "deactivated"].includes(status)) {
        return "inactive";
    }

    return "active";
};

const normalizeStudentRecord = (student) => {
    const record = {
        student_id: clean(student?.student_id),
        full_name: clean(student?.full_name),
        year_level: clean(student?.year_level),
        enrollment_status: normalizeStatus(student?.enrollment_status),
    };

    const optionalFields = [
        "first_name",
        "middle_name",
        "last_name",
        "birthday",
        "contact_number",
        "province",
        "barangay",
        "city",
    ];

    optionalFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(student || {}, field)) {
            const value = clean(student[field]);
            record[field] = field === "birthday" ? value || null : value;
        }
    });

    return record;
};

const chunk = (array, size) => {
    const result = [];
    for (let index = 0; index < array.length; index += size) {
        result.push(array.slice(index, index + size));
    }
    return result;
};

// ============================================================
// ADMIN AUTHENTICATION
// ============================================================
// Matches the current VOTARA Admin session format used by the
// supplied Admin audit controller: role === "admin" and userId.
// ============================================================

const authenticateAdmin = async (req) => {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
        const error = new Error("Authentication token is required.");
        error.statusCode = 401;
        throw error;
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
        const error = new Error("Authentication token is missing.");
        error.statusCode = 401;
        throw error;
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        const authError = new Error("Invalid or expired administrator session.");
        authError.statusCode = 401;
        throw authError;
    }

    if (!decoded || decoded.role !== "admin") {
        const error = new Error("Administrator access is required.");
        error.statusCode = 403;
        throw error;
    }

    if (!decoded.userId) {
        const error = new Error("Invalid administrator session.");
        error.statusCode = 401;
        throw error;
    }

    const { data: admin, error } = await supabase
        .from("staff_users")
        .select("id, full_name, email, role, is_active")
        .eq("id", decoded.userId)
        .eq("role", "admin")
        .maybeSingle();

    if (error) throw error;

    if (!admin) {
        const authError = new Error("Administrator account was not found.");
        authError.statusCode = 401;
        throw authError;
    }

    if (admin.is_active !== true) {
        const authError = new Error("Administrator account is inactive.");
        authError.statusCode = 403;
        throw authError;
    }

    req.admin = admin;
    return admin;
};

const getAdminActor = (req) => {
    const admin = req.admin || {};

    return {
        actorId: admin.id || null,
        actorName: admin.full_name || "Administrator",
        actorEmail:
            admin.email ||
            process.env.EMAIL_USER ||
            "votara.election@gmail.com",
        actorRole: admin.role || "admin",
    };
};

const writeAudit = async (req, options) => {
    try {
        const actor = getAdminActor(req);

        await auditLogsService.createAuditLog({
            ...actor,
            ...options,
            ipAddress:
                req.ip ||
                req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
                "0.0.0.0",
            userAgent:
                typeof req.get === "function"
                    ? req.get("user-agent")
                    : null,
        });
    } catch (auditError) {
        // Audit failure must not undo a successful data operation.
        console.error(
            "⚠️ Data Management audit log failed:",
            auditError?.message || auditError
        );
    }
};

const selectStudentFields = `
    id,
    student_id,
    full_name,
    year_level,
    enrollment_status
`;

// ============================================================
// GET STUDENT REGISTRY
// ============================================================

const getDataManagementStudents = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const search = clean(req.query.search);
        const yearLevel = clean(req.query.year_level);
        const enrollmentStatus = clean(req.query.enrollment_status);

        let query = supabase
            .from("students")
            .select(selectStudentFields)
            .order("full_name", { ascending: true });

        if (search) {
            const escaped = search.replace(/[%_,]/g, "");
            query = query.or(
                `student_id.ilike.%${escaped}%,full_name.ilike.%${escaped}%`
            );
        }

        if (yearLevel) {
            query = query.eq("year_level", yearLevel);
        }

        if (enrollmentStatus) {
            query = query.eq(
                "enrollment_status",
                normalizeStatus(enrollmentStatus)
            );
        }

        const { data, error } = await query;
        if (error) throw error;

        await writeAudit(req, {
            action: "view_student_registry",
            module: ADMIN_MODULE,
            description: "Administrator viewed the VOTARA student registry.",
            targetType: "students",
            metadata: {
                search: search || null,
                yearLevel: yearLevel || null,
                enrollmentStatus: enrollmentStatus || null,
                returnedCount: data?.length || 0,
            },
        });

        return res.status(200).json({
            success: true,
            count: data?.length || 0,
            students: data || [],
        });
    } catch (error) {
        console.error("Get Data Management students error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to load student registry.",
        });
    }
};

// ============================================================
// IMPORT / SYNCHRONIZE STUDENTS
// ============================================================
// This implementation deliberately does NOT require a new unique
// constraint on student_id. It first resolves existing records and
// then performs inserts/updates using their current UUIDs.
// ============================================================

const importStudentDataset = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const students = Array.isArray(req.body?.students)
            ? req.body.students
            : [];
        const fileName = clean(req.body?.fileName);

        if (!students.length) {
            return res.status(400).json({
                success: false,
                message: "No student records were provided.",
            });
        }

        if (students.length > MAX_IMPORT_RECORDS) {
            return res.status(413).json({
                success: false,
                message: `A single import may contain at most ${MAX_IMPORT_RECORDS.toLocaleString()} student records.`,
            });
        }

        const records = students.map(normalizeStudentRecord);
        const seen = new Set();

        for (const record of records) {
            if (!record.student_id || !record.full_name || !record.year_level) {
                return res.status(400).json({
                    success: false,
                    message: "Every student must contain Student ID, Full Name, and Year Level.",
                });
            }

            if (seen.has(record.student_id)) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate Student ID found in the CSV: ${record.student_id}.`,
                });
            }

            seen.add(record.student_id);
        }

        const studentIds = records.map((record) => record.student_id);
        const existingRows = [];

        // Chunk the lookup so a large CSV does not create an oversized
        // Supabase request URL.
        for (const ids of chunk(studentIds, 500)) {
            const { data, error } = await supabase
                .from("students")
                .select("id, student_id")
                .in("student_id", ids);

            if (error) throw error;
            existingRows.push(...(data || []));
        }

        const existingByStudentId = new Map();

        for (const row of existingRows) {
            if (existingByStudentId.has(row.student_id)) {
                return res.status(409).json({
                    success: false,
                    message:
                        `The database contains duplicate Student ID records for ${row.student_id}. Clean that duplicate before importing this dataset.`,
                });
            }

            existingByStudentId.set(row.student_id, row);
        }

        const inserts = [];
        const updates = [];

        for (const record of records) {
            const existing = existingByStudentId.get(record.student_id);

            if (existing) {
                updates.push({
                    id: existing.id,
                    payload: {
                        ...record,
                        updated_at: new Date().toISOString(),
                    },
                });
            } else {
                inserts.push({
                    ...record,
                    updated_at: new Date().toISOString(),
                });
            }
        }

        let insertedCount = 0;
        let updatedCount = 0;

        // Insert all new students in a batch.
        if (inserts.length) {
            const { error } = await supabase
                .from("students")
                .insert(inserts);

            if (error) throw error;
            insertedCount = inserts.length;
        }

        // Update existing records individually because each row can have
        // different values. The batch itself is still bounded and validated.
        for (const item of updates) {
            const { error } = await supabase
                .from("students")
                .update(item.payload)
                .eq("id", item.id);

            if (error) throw error;
            updatedCount += 1;
        }

        await writeAudit(req, {
            action: "import_student_dataset",
            module: ADMIN_MODULE,
            description: "Administrator imported and synchronized a student dataset.",
            targetType: "students",
            metadata: {
                fileName: fileName || null,
                submittedRecords: records.length,
                insertedRecords: insertedCount,
                updatedRecords: updatedCount,
            },
        });

        return res.status(200).json({
            success: true,
            message:
                `Student dataset synchronized successfully. ${insertedCount} new record(s) added and ${updatedCount} existing record(s) updated.`,
            count: records.length,
            insertedCount,
            updatedCount,
        });
    } catch (error) {
        console.error("Import student dataset error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to import student dataset.",
        });
    }
};

// ============================================================
// UPDATE ENROLLMENT STATUS
// ============================================================

const updateStudentEnrollmentStatus = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const id = clean(req.params.id);
        const status = normalizeStatus(req.body?.enrollmentStatus);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Student record ID is required.",
            });
        }

        const { data, error } = await supabase
            .from("students")
            .update({
                enrollment_status: status,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select(selectStudentFields)
            .single();

        if (error) throw error;

        await writeAudit(req, {
            action: "update_student_enrollment_status",
            module: ADMIN_MODULE,
            description: "Administrator updated a student's enrollment status.",
            targetId: data.id,
            targetType: "student",
            metadata: {
                studentId: data.student_id,
                enrollmentStatus: status,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Student enrollment status updated successfully.",
            student: data,
        });
    } catch (error) {
        console.error("Update student enrollment status error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to update enrollment status.",
        });
    }
};

// ============================================================
// ARCHIVE STUDENT
// ============================================================

const archiveStudent = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const id = clean(req.params.id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Student record ID is required.",
            });
        }

        const { data, error } = await supabase
            .from("students")
            .update({
                enrollment_status: "inactive",
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select(selectStudentFields)
            .single();

        if (error) throw error;

        await writeAudit(req, {
            action: "archive_student",
            module: ADMIN_MODULE,
            description: "Administrator archived a student registry record.",
            targetId: data.id,
            targetType: "student",
            metadata: {
                studentId: data.student_id,
            },
        });

        return res.status(200).json({
            success: true,
            message: "Student record archived successfully.",
            student: data,
        });
    } catch (error) {
        console.error("Archive student error:", error);

        return res.status(error.statusCode || 500).json({
            success: false,
            message: error.message || "Unable to archive student.",
        });
    }
};

module.exports = {
    getDataManagementStudents,
    importStudentDataset,
    updateStudentEnrollmentStatus,
    archiveStudent,
};
