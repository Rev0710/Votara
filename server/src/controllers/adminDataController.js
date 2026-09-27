const supabase = require("../config/supabase");
const {
    authenticateAdmin,
} = require("./adminController");
const auditLogsService = require("../services/auditLogsService");

// =========================================================
// ADMIN DATA MANAGEMENT
// Student Registry / CSV Import / Enrollment / Deactivation
// =========================================================

const STUDENT_COLUMNS = [
    "student_id",
    "full_name",
    "first_name",
    "middle_name",
    "last_name",
    "year_level",
    "enrollment_status",
    "birthday",
    "contact_number",
    "province",
    "barangay",
    "city",
];

const clean = (value) =>
    value === undefined || value === null
        ? ""
        : String(value).trim();

const normalizeYearLevel = (value) => {
    const raw = clean(value).toLowerCase().replace(/\s+/g, " ");

    const map = {
        "1": "1st Year",
        "1st": "1st Year",
        "1st year": "1st Year",
        "first": "1st Year",
        "first year": "1st Year",

        "2": "2nd Year",
        "2nd": "2nd Year",
        "2nd year": "2nd Year",
        "second": "2nd Year",
        "second year": "2nd Year",

        "3": "3rd Year",
        "3rd": "3rd Year",
        "3rd year": "3rd Year",
        "third": "3rd Year",
        "third year": "3rd Year",

        "4": "4th Year",
        "4th": "4th Year",
        "4th year": "4th Year",
        "fourth": "4th Year",
        "fourth year": "4th Year",
    };

    return map[raw] || clean(value);
};

const normalizeEnrollmentStatus = (value) => {
    const raw = clean(value).toLowerCase();

    if (
        ["inactive", "deactivated", "disabled"].includes(raw)
    ) {
        return "inactive";
    }

    if (
        ["removed", "archived", "deleted"].includes(raw)
    ) {
        return "removed";
    }

    return "active";
};

// Small RFC4180-compatible CSV parser.
// Handles commas, quoted fields, escaped quotes, and newlines inside quotes.
const parseCSV = (text) => {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i += 1) {
        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && inQuotes && next === '"') {
            field += '"';
            i += 1;
            continue;
        }

        if (char === '"') {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            row.push(field);
            field = "";
            continue;
        }

        if (
            (char === "\n" || char === "\r") &&
            !inQuotes
        ) {
            if (char === "\r" && next === "\n") {
                i += 1;
            }

            row.push(field);
            field = "";

            if (
                row.some(
                    (value) => clean(value) !== ""
                )
            ) {
                rows.push(row);
            }

            row = [];
            continue;
        }

        field += char;
    }

    row.push(field);

    if (
        row.some(
            (value) => clean(value) !== ""
        )
    ) {
        rows.push(row);
    }

    return rows;
};

const normalizeHeader = (value) =>
    clean(value)
        .replace(/^\uFEFF/, "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

const parseStudentCSV = (csvText) => {
    const rawRows = parseCSV(csvText);

    if (rawRows.length < 2) {
        throw new Error(
            "The CSV must contain a header row and at least one student row."
        );
    }

    const headers = rawRows[0].map(normalizeHeader);

    const studentIdIndex = headers.indexOf("student_id");

    if (studentIdIndex === -1) {
        throw new Error(
            "CSV is missing the required 'student_id' column."
        );
    }

    const rows = [];
    const errors = [];
    const seenIds = new Set();

    rawRows.slice(1).forEach((values, rowOffset) => {
        const rowNumber = rowOffset + 2;

        const raw = {};
        headers.forEach((header, index) => {
            raw[header] = clean(values[index]);
        });

        const studentId = clean(
            raw.student_id ||
            raw.studentid ||
            raw.id_number
        );

        if (!studentId) {
            errors.push(
                `Row ${rowNumber}: student_id is required.`
            );
            return;
        }

        if (seenIds.has(studentId)) {
            errors.push(
                `Row ${rowNumber}: duplicate student_id '${studentId}' inside the CSV.`
            );
            return;
        }

        seenIds.add(studentId);

        const fullName =
            clean(raw.full_name) ||
            [
                clean(raw.first_name),
                clean(raw.middle_name),
                clean(raw.last_name),
            ]
                .filter(Boolean)
                .join(" ")
                .trim();

        if (!fullName) {
            errors.push(
                `Row ${rowNumber}: full_name or first_name/last_name is required.`
            );
            return;
        }

        const record = {
            student_id: studentId,
            full_name: fullName,
            year_level: normalizeYearLevel(
                raw.year_level
            ),
        };

        [
            "first_name",
            "middle_name",
            "last_name",
            "birthday",
            "contact_number",
            "province",
            "barangay",
            "city",
        ].forEach((field) => {
            if (raw[field]) {
                record[field] = raw[field];
            }
        });

        if (headers.includes("enrollment_status")) {
            record.enrollment_status =
                normalizeEnrollmentStatus(
                    raw.enrollment_status
                );
        }

        rows.push(record);
    });

    return {
        rows,
        errors,
        totalRows: rawRows.length - 1,
    };
};

const writeAudit = async (
    req,
    {
        action,
        description,
        targetId = null,
        targetType = "student",
        metadata = {},
    }
) => {
    try {
        const admin = await authenticateAdmin(req);

        await auditLogsService.createAuditLog({
            actorId: admin.userId,
            actorName: admin.fullName,
            actorEmail: admin.email,
            actorRole: admin.role,
            action,
            module: "Data Management",
            description,
            targetId,
            targetType,
            metadata,
            ipAddress:
                req.ip ||
                req.headers?.["x-forwarded-for"]
                    ?.split(",")[0]
                    ?.trim() ||
                null,
            userAgent:
                typeof req.get === "function"
                    ? req.get("user-agent")
                    : null,
        });
    } catch (error) {
        // Audit failure must never undo a successful data operation.
        console.error(
            "Data Management audit log failed:",
            error.message
        );
    }
};

// =========================================================
// GET STUDENT REGISTRY
// GET /api/admin/data/students
// =========================================================

const getStudentRegistry = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const page = Math.max(
            1,
            Number.parseInt(req.query.page, 10) || 1
        );

        const limit = Math.min(
            100,
            Math.max(
                10,
                Number.parseInt(req.query.limit, 10) || 25
            )
        );

        const search = clean(req.query.search);
        const status = clean(req.query.status).toLowerCase();
        const yearLevel = clean(req.query.year_level);

        let query = supabase
            .from("students")
            .select(
                `
                id,
                student_id,
                full_name,
                first_name,
                middle_name,
                last_name,
                year_level,
                enrollment_status,
                birthday,
                contact_number,
                province,
                barangay,
                city,
                created_at,
                updated_at
                `,
                { count: "exact" }
            )
            .order("full_name", {
                ascending: true,
            });

        if (search) {
            const safeSearch = search.replace(/[%_]/g, "");
            query = query.or(
                `student_id.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`
            );
        }

        if (status) {
            query = query.eq(
                "enrollment_status",
                status
            );
        }

        if (yearLevel) {
            query = query.eq(
                "year_level",
                normalizeYearLevel(yearLevel)
            );
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const {
            data: students,
            error,
            count,
        } = await query.range(from, to);

        if (error) {
            throw error;
        }

        const studentIds = (students || []).map(
            (student) => student.student_id
        );

        let accounts = [];

        if (studentIds.length) {
            const {
                data: accountData,
                error: accountError,
            } = await supabase
                .from("student_accounts")
                .select(
                    "student_id, email, account_status, must_change_password, last_login_at, deactivated_at"
                )
                .in("student_id", studentIds);

            if (accountError) {
                throw accountError;
            }

            accounts = accountData || [];
        }

        const accountMap = new Map(
            accounts.map((account) => [
                String(account.student_id),
                account,
            ])
        );

        const enrichedStudents = (
            students || []
        ).map((student) => ({
            ...student,
            account:
                accountMap.get(
                    String(student.student_id)
                ) || null,
            effective_status:
                student.enrollment_status ||
                accountMap.get(
                    String(student.student_id)
                )?.account_status ||
                "active",
        }));

        return res.status(200).json({
            success: true,
            students: enrichedStudents,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil(
                    (count || 0) / limit
                ),
            },
        });
    } catch (error) {
        console.error(
            "Get student registry error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to load student registry.",
        });
    }
};

// =========================================================
// GET DATA MANAGEMENT SUMMARY
// GET /api/admin/data/summary
// =========================================================

const getDataManagementSummary = async (
    req,
    res
) => {
    try {
        await authenticateAdmin(req);

        const [
            studentsResult,
            activeResult,
            inactiveResult,
            removedResult,
        ] = await Promise.all([
            supabase
                .from("students")
                .select("id", {
                    count: "exact",
                    head: true,
                }),

            supabase
                .from("students")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq(
                    "enrollment_status",
                    "active"
                ),

            supabase
                .from("students")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq(
                    "enrollment_status",
                    "inactive"
                ),

            supabase
                .from("students")
                .select("id", {
                    count: "exact",
                    head: true,
                })
                .eq(
                    "enrollment_status",
                    "removed"
                ),
        ]);

        for (const result of [
            studentsResult,
            activeResult,
            inactiveResult,
            removedResult,
        ]) {
            if (result.error) {
                throw result.error;
            }
        }

        return res.status(200).json({
            success: true,
            summary: {
                totalStudents:
                    studentsResult.count || 0,
                activeStudents:
                    activeResult.count || 0,
                inactiveStudents:
                    inactiveResult.count || 0,
                removedStudents:
                    removedResult.count || 0,
            },
        });
    } catch (error) {
        console.error(
            "Get data management summary error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to load data summary.",
        });
    }
};

// =========================================================
// IMPORT / UPSERT STUDENTS
// POST /api/admin/data/students/import
//
// Safe import behavior:
// - Adds new student records.
// - Updates matching student_id records.
// - DOES NOT delete records missing from the CSV.
// - DOES NOT automatically create student login accounts.
// =========================================================

const importStudentsCSV = async (req, res) => {
    try {
        const admin = await authenticateAdmin(req);

        const csvText = clean(req.body?.csvText);

        if (!csvText) {
            return res.status(400).json({
                success: false,
                message:
                    "CSV content is required.",
            });
        }

        const {
            rows,
            errors,
            totalRows,
        } = parseStudentCSV(csvText);

        if (!rows.length) {
            return res.status(400).json({
                success: false,
                message:
                    errors[0] ||
                    "No valid student records were found.",
                errors,
            });
        }

        const {
            data: imported,
            error,
        } = await supabase
            .from("students")
            .upsert(rows, {
                onConflict: "student_id",
            })
            .select(
                "id, student_id, full_name, year_level, enrollment_status"
            );

        if (error) {
            throw error;
        }

        await writeAudit(req, {
            action: "import_students_csv",
            description:
                "Administrator imported or synchronized the student registry from a CSV file.",
            targetType: "student_registry",
            metadata: {
                source: "CSV",
                fileName:
                    clean(req.body?.fileName) ||
                    "students.csv",
                totalRows,
                importedRows:
                    imported?.length || rows.length,
                rejectedRows: errors.length,
            },
        });

        return res.status(200).json({
            success: true,
            message:
                "Student registry updated successfully.",
            importedCount:
                imported?.length || rows.length,
            rejectedCount: errors.length,
            totalRows,
            errors,
        });
    } catch (error) {
        console.error(
            "Import students CSV error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to import student CSV.",
        });
    }
};

// =========================================================
// UPDATE ENROLLMENT STATUS
// PATCH /api/admin/data/students/:studentId/status
// =========================================================

const updateEnrollmentStatus = async (
    req,
    res
) => {
    try {
        await authenticateAdmin(req);

        const studentId = clean(
            req.params.studentId
        );

        const status = normalizeEnrollmentStatus(
            req.body?.status
        );

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required.",
            });
        }

        const {
            data: student,
            error,
        } = await supabase
            .from("students")
            .update({
                enrollment_status: status,
                updated_at:
                    new Date().toISOString(),
            })
            .eq("student_id", studentId)
            .select(
                "id, student_id, full_name, enrollment_status"
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student was not found.",
            });
        }

        if (status !== "active") {
            await supabase
                .from("student_accounts")
                .update({
                    account_status: "inactive",
                    deactivated_at:
                        new Date().toISOString(),
                })
                .eq("student_id", studentId);
        }

        await writeAudit(req, {
            action:
                status === "active"
                    ? "activate_student"
                    : "update_student_status",
            description:
                `Administrator changed student ${studentId} enrollment status to ${status}.`,
            targetId: studentId,
            metadata: {
                status,
            },
        });

        return res.status(200).json({
            success: true,
            message:
                "Student enrollment status updated.",
            student,
        });
    } catch (error) {
        console.error(
            "Update enrollment status error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to update enrollment status.",
        });
    }
};

// =========================================================
// DEACTIVATE
// PATCH /api/admin/data/students/:studentId/deactivate
// =========================================================

const deactivateStudent = async (req, res) => {
    req.body = {
        ...(req.body || {}),
        status: "inactive",
    };

    return updateEnrollmentStatus(req, res);
};

// =========================================================
// REACTIVATE
// PATCH /api/admin/data/students/:studentId/activate
// =========================================================

const activateStudent = async (req, res) => {
    req.body = {
        ...(req.body || {}),
        status: "active",
    };

    return updateEnrollmentStatus(req, res);
};

// =========================================================
// REMOVE / ARCHIVE
//
// This is intentionally a SOFT REMOVE. We do not hard-delete
// student records because elections, candidates, votes, audit
// records, and registration records may reference them.
// =========================================================

const removeStudent = async (req, res) => {
    try {
        await authenticateAdmin(req);

        const studentId = clean(
            req.params.studentId
        );

        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required.",
            });
        }

        const {
            data: student,
            error,
        } = await supabase
            .from("students")
            .update({
                enrollment_status: "removed",
                updated_at:
                    new Date().toISOString(),
            })
            .eq("student_id", studentId)
            .select(
                "id, student_id, full_name, enrollment_status"
            )
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student was not found.",
            });
        }

        await supabase
            .from("student_accounts")
            .update({
                account_status: "inactive",
                deactivated_at:
                    new Date().toISOString(),
            })
            .eq("student_id", studentId);

        await writeAudit(req, {
            action: "remove_student",
            description:
                `Administrator removed student ${studentId} from the active student registry.`,
            targetId: studentId,
            metadata: {
                softRemove: true,
            },
        });

        return res.status(200).json({
            success: true,
            message:
                "Student removed from the active registry.",
            student,
        });
    } catch (error) {
        console.error(
            "Remove student error:",
            error
        );

        return res.status(
            error.statusCode || 500
        ).json({
            success: false,
            message:
                error.message ||
                "Unable to remove student.",
        });
    }
};

module.exports = {
    getStudentRegistry,
    getDataManagementSummary,
    importStudentsCSV,
    updateEnrollmentStatus,
    deactivateStudent,
    activateStudent,
    removeStudent,
};
