import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FiActivity,
    FiArchive,
    FiBarChart2,
    FiCheckCircle,
    FiChevronRight,
    FiDatabase,
    FiDownload,
    FiFileText,
    FiRefreshCw,
    FiSearch,
    FiSettings,
    FiShield,
    FiUploadCloud,
    FiUsers,
    FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "./AdminDataManagement.css";
import AdminTopNav from "./AdminTopNav";

const STATUS_OPTIONS = [
    { value: "all", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "late_enrollee", label: "Late Enrollee" },
    { value: "inactive", label: "Inactive / Archived" },
];

const YEAR_OPTIONS = [
    { value: "all", label: "All year levels" },
    { value: "1st Year", label: "1st Year" },
    { value: "2nd Year", label: "2nd Year" },
    { value: "3rd Year", label: "3rd Year" },
    { value: "4th Year", label: "4th Year" },
];

const clean = (value) => String(value ?? "").trim();

const normalizeHeader = (value) =>
    clean(value)
        .replace(/^\uFEFF/, "")
        .toLowerCase()
        .replace(/[\s-]+/g, "_");

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

const escapeCsv = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

// Small CSV parser so no new npm dependency is required.
const parseCSV = (text) => {
    const source = String(text || "").replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    const firstLine = source.split(/\r?\n/, 1)[0] || "";
    const delimiter = firstLine.includes("\t")
        ? "\t"
        : firstLine.includes(";") && !firstLine.includes(",")
            ? ";"
            : ",";

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];

        if (char === '"' && quoted && next === '"') {
            cell += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            quoted = !quoted;
            continue;
        }

        if (!quoted && char === delimiter) {
            row.push(cell.trim());
            cell = "";
            continue;
        }

        if (!quoted && (char === "\n" || char === "\r")) {
            if (char === "\r" && next === "\n") index += 1;
            row.push(cell.trim());
            cell = "";
            if (row.some((value) => value !== "")) rows.push(row);
            row = [];
            continue;
        }

        cell += char;
    }

    if (cell !== "" || row.length) {
        row.push(cell.trim());
        if (row.some((value) => value !== "")) rows.push(row);
    }

    return rows;
};

const findHeaderIndex = (headers, aliases) =>
    headers.findIndex((header) => aliases.includes(header));

const parseStudentCSV = (text) => {
    const rows = parseCSV(text);

    if (rows.length < 2) {
        throw new Error("The CSV must contain a header row and at least one student record.");
    }

    const headers = rows[0].map(normalizeHeader);

    const studentIdIndex = findHeaderIndex(headers, [
        "student_id",
        "studentid",
        "student_number",
        "student_no",
        "id_number",
    ]);

    const fullNameIndex = findHeaderIndex(headers, [
        "full_name",
        "fullname",
        "name",
        "student_name",
    ]);

    const yearLevelIndex = findHeaderIndex(headers, [
        "year_level",
        "yearlevel",
        "year",
        "level",
    ]);

    const statusIndex = findHeaderIndex(headers, [
        "enrollment_status",
        "enrolment_status",
        "status",
    ]);

    const optionalIndex = (aliases) => findHeaderIndex(headers, aliases);

    const firstNameIndex = optionalIndex(["first_name", "firstname"]);
    const middleNameIndex = optionalIndex(["middle_name", "middlename"]);
    const lastNameIndex = optionalIndex(["last_name", "lastname"]);
    const birthdayIndex = optionalIndex(["birthday", "birth_date", "birthdate"]);
    const contactIndex = optionalIndex([
        "contact_number",
        "contact",
        "phone",
        "phone_number",
    ]);
    const provinceIndex = optionalIndex(["province"]);
    const barangayIndex = optionalIndex(["barangay"]);
    const cityIndex = optionalIndex(["city", "municipality"]);

    if (studentIdIndex < 0 || fullNameIndex < 0 || yearLevelIndex < 0) {
        throw new Error(
            "Required CSV columns are Student ID, Full Name, and Year Level."
        );
    }

    const records = rows.slice(1).map((values, index) => {
        const valueAt = (columnIndex) =>
            columnIndex >= 0 ? clean(values[columnIndex]) : "";

        return {
            rowNumber: index + 2,
            student_id: valueAt(studentIdIndex),
            full_name: valueAt(fullNameIndex),
            year_level: valueAt(yearLevelIndex),
            enrollment_status:
                statusIndex >= 0
                    ? normalizeStatus(valueAt(statusIndex))
                    : "active",
            ...(firstNameIndex >= 0 && {
                first_name: valueAt(firstNameIndex),
            }),
            ...(middleNameIndex >= 0 && {
                middle_name: valueAt(middleNameIndex),
            }),
            ...(lastNameIndex >= 0 && {
                last_name: valueAt(lastNameIndex),
            }),
            ...(birthdayIndex >= 0 && {
                birthday: valueAt(birthdayIndex),
            }),
            ...(contactIndex >= 0 && {
                contact_number: valueAt(contactIndex),
            }),
            ...(provinceIndex >= 0 && {
                province: valueAt(provinceIndex),
            }),
            ...(barangayIndex >= 0 && {
                barangay: valueAt(barangayIndex),
            }),
            ...(cityIndex >= 0 && {
                city: valueAt(cityIndex),
            }),
        };
    });

    const meaningful = records.filter(
        (record) => record.student_id || record.full_name || record.year_level
    );

    if (!meaningful.length) {
        throw new Error("The CSV does not contain any student records.");
    }

    const seen = new Set();

    for (const record of meaningful) {
        if (!record.student_id || !record.full_name || !record.year_level) {
            throw new Error(
                `CSV row ${record.rowNumber} is missing Student ID, Full Name, or Year Level.`
            );
        }

        if (seen.has(record.student_id)) {
            throw new Error(
                `Duplicate Student ID found in CSV: ${record.student_id}.`
            );
        }

        seen.add(record.student_id);
    }

    return meaningful;
};

const normalizeStudent = (student) => ({
    id: student?.id || "",
    student_id: clean(student?.student_id),
    full_name: clean(student?.full_name),
    year_level: clean(student?.year_level),
    enrollment_status: normalizeStatus(student?.enrollment_status),
});

const getStudentsFromResponse = (response) =>
    Array.isArray(response?.data?.students) ? response.data.students : [];

const StatCard = ({ icon: Icon, label, value, caption, tone }) => (
    <article className={`dm-stat-card ${tone}`}>
        <div className="dm-stat-icon">
            <Icon size={20} />
        </div>
        <div className="dm-stat-copy">
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{caption}</small>
        </div>
    </article>
);

function AdminDataManagement() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [yearFilter, setYearFilter] = useState("all");

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewRows, setPreviewRows] = useState([]);
    const [importRecords, setImportRecords] = useState([]);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadStudents = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            setError("");

            const response = await api.get("/admin/data-management/students");
            setStudents(getStudentsFromResponse(response).map(normalizeStudent));
        } catch (requestError) {
            if (requestError?.response?.status === 401) {
                navigate("/admin-login", { replace: true });
                return;
            }

            setError(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    "Unable to load the student registry."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadStudents();
    }, []);

    const stats = useMemo(() => {
        const active = students.filter(
            (student) => student.enrollment_status === "active"
        ).length;
        const late = students.filter(
            (student) => student.enrollment_status === "late_enrollee"
        ).length;
        const inactive = students.filter(
            (student) => student.enrollment_status === "inactive"
        ).length;

        const years = [
            "1st Year",
            "2nd Year",
            "3rd Year",
            "4th Year",
        ].map((year) => ({
            year,
            count: students.filter((student) => student.year_level === year).length,
        }));

        return {
            total: students.length,
            active,
            late,
            inactive,
            years,
        };
    }, [students]);

    const filteredStudents = useMemo(() => {
        const query = clean(search).toLowerCase();

        return students.filter((student) => {
            const matchesSearch =
                !query ||
                student.student_id.toLowerCase().includes(query) ||
                student.full_name.toLowerCase().includes(query);

            const matchesStatus =
                statusFilter === "all" ||
                student.enrollment_status === statusFilter;

            const matchesYear =
                yearFilter === "all" || student.year_level === yearFilter;

            return matchesSearch && matchesStatus && matchesYear;
        });
    }, [students, search, statusFilter, yearFilter]);

    const handleFileSelected = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setMessage("");
        setError("");
        setPreviewRows([]);
        setImportRecords([]);

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setError("Please select a CSV file.");
            event.target.value = "";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("The CSV file must be 10 MB or smaller.");
            event.target.value = "";
            return;
        }

        try {
            const text = await file.text();
            const records = parseStudentCSV(text);

            setSelectedFile(file);
            setImportRecords(records);
            setPreviewRows(records.slice(0, 8));
        } catch (parseError) {
            setSelectedFile(null);
            setImportRecords([]);
            setError(parseError.message || "Unable to read the CSV file.");
            event.target.value = "";
        }
    };

    const clearImport = () => {
        setSelectedFile(null);
        setImportRecords([]);
        setPreviewRows([]);
        setMessage("");
        setError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImport = async () => {
        if (!selectedFile || !importRecords.length) return;

        setImporting(true);
        setMessage("");
        setError("");

        try {
            const response = await api.post(
                "/admin/data-management/students/import",
                {
                    fileName: selectedFile.name,
                    students: importRecords,
                }
            );

            setMessage(
                response.data?.message ||
                    "Student dataset synchronized successfully."
            );

            clearImport();
            await loadStudents(true);
        } catch (requestError) {
            if (requestError?.response?.status === 401) {
                navigate("/admin-login", { replace: true });
                return;
            }

            setError(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    "Unable to import the student dataset."
            );
        } finally {
            setImporting(false);
        }
    };

    const updateStatus = async (student, nextStatus) => {
        setUpdatingId(student.id);
        setError("");
        setMessage("");

        try {
            const response = await api.patch(
                `/admin/data-management/students/${student.id}/enrollment-status`,
                { enrollmentStatus: nextStatus }
            );

            const updated = normalizeStudent(response.data?.student || {
                ...student,
                enrollment_status: nextStatus,
            });

            setStudents((current) =>
                current.map((item) =>
                    item.id === student.id ? updated : item
                )
            );

            setMessage(response.data?.message || "Enrollment status updated.");
        } catch (requestError) {
            if (requestError?.response?.status === 401) {
                navigate("/admin-login", { replace: true });
                return;
            }

            setError(
                requestError?.response?.data?.message ||
                    requestError?.message ||
                    "Unable to update enrollment status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    const downloadTemplate = () => {
        const rows = [
            [
                "student_id",
                "full_name",
                "year_level",
                "enrollment_status",
                "first_name",
                "middle_name",
                "last_name",
                "birthday",
                "contact_number",
                "province",
                "barangay",
                "city",
            ],
            [
                "2026-0001",
                "Juan Dela Cruz",
                "1st Year",
                "active",
                "Juan",
                "",
                "Dela Cruz",
                "2008-01-15",
                "09123456789",
                "Iloilo",
                "Example Barangay",
                "Iloilo City",
            ],
        ];

        const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "votara-student-dataset-template.csv";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    };
    return (
        <div className="votara-data-page">
            <AdminTopNav />

            <main className="dm-main">
                <section className="dm-page-heading">
                    <div className="dm-section-number">03</div>
                    <div>
                        <span className="dm-kicker">VOTARA ADMINISTRATION</span>
                        <h1>Data Management</h1>
                        <p>
                            Maintain student records, enrollment information, database collections,
                            and data lifecycle operations from one administrative workspace.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="dm-refresh"
                        disabled={refreshing}
                        onClick={() => {
                            setRefreshing(true);
                            loadStudents(true);
                        }}
                    >
                        <FiRefreshCw className={refreshing ? "dm-spin" : ""} />
                        Refresh Data
                    </button>
                </section>

                <section className="dm-stat-grid">
                    <StatCard
                        icon={FiUsers}
                        label="Total Students"
                        value={loading ? "—" : stats.total.toLocaleString()}
                        caption="Official student registry"
                        tone="blue"
                    />
                    <StatCard
                        icon={FiCheckCircle}
                        label="Active Students"
                        value={loading ? "—" : stats.active.toLocaleString()}
                        caption="Active enrollment records"
                        tone="green"
                    />
                    <StatCard
                        icon={FiActivity}
                        label="Late Enrollees"
                        value={loading ? "—" : stats.late.toLocaleString()}
                        caption="Records requiring review"
                        tone="purple"
                    />
                    <StatCard
                        icon={FiArchive}
                        label="Inactive / Archived"
                        value={loading ? "—" : stats.inactive.toLocaleString()}
                        caption="Inactive registry records"
                        tone="orange"
                    />
                </section>

                {error && (
                    <div className="dm-alert error">
                        <FiX />
                        <span>{error}</span>
                    </div>
                )}

                {message && (
                    <div className="dm-alert success">
                        <FiCheckCircle />
                        <span>{message}</span>
                    </div>
                )}

                <section className="dm-overview-grid">
                    <article className="dm-panel dm-chart-panel">
                        <div className="dm-panel-heading">
                            <div>
                                <span className="dm-kicker">STUDENT DATA</span>
                                <h2>Year Level Distribution</h2>
                                <p>Current student registry distribution by VOTARA year-level classification.</p>
                            </div>
                            <div className="dm-panel-icon blue"><FiBarChart2 /></div>
                        </div>

                        <div className="dm-year-chart">
                            {stats.years.map((item) => {
                                const percent = stats.total
                                    ? Math.round((item.count / stats.total) * 100)
                                    : 0;

                                return (
                                    <div className="dm-year-row" key={item.year}>
                                        <div className="dm-year-label">
                                            <span>{item.year}</span>
                                            <strong>{item.count}</strong>
                                        </div>
                                        <div className="dm-year-track">
                                            <span style={{ width: `${percent}%` }} />
                                        </div>
                                        <small>{percent}%</small>
                                    </div>
                                );
                            })}
                        </div>
                    </article>

                    <article className="dm-panel dm-status-panel">
                        <div className="dm-panel-heading">
                            <div>
                                <span className="dm-kicker">ENROLLMENT STATUS</span>
                                <h2>Registry Health</h2>
                                <p>Distribution of records currently stored in the student registry.</p>
                            </div>
                            <div className="dm-panel-icon green"><FiActivity /></div>
                        </div>

                        <div
                            className="dm-donut"
                            style={{
                                "--active": `${stats.total ? (stats.active / stats.total) * 100 : 0}%`,
                                "--late": `${stats.total ? (stats.late / stats.total) * 100 : 0}%`,
                            }}
                        >
                            <div>
                                <strong>{loading ? "—" : stats.total}</strong>
                                <span>records</span>
                            </div>
                        </div>

                        <div className="dm-legend">
                            <span><i className="green" />Active <b>{stats.active}</b></span>
                            <span><i className="purple" />Late <b>{stats.late}</b></span>
                            <span><i className="orange" />Inactive <b>{stats.inactive}</b></span>
                        </div>
                    </article>
                </section>

                <section className="dm-management-grid">
                    <button type="button" className="dm-management-card active" onClick={() => document.getElementById("student-registry")?.scrollIntoView({ behavior: "smooth" })}>
                        <span className="dm-management-icon blue"><FiUsers /></span>
                        <span><strong>Student Data</strong><small>Import, synchronize, search, and review student records.</small></span>
                        <FiChevronRight />
                    </button>
                    <button type="button" className="dm-management-card" onClick={() => document.getElementById("student-registry")?.scrollIntoView({ behavior: "smooth" })}>
                        <span className="dm-management-icon green"><FiCheckCircle /></span>
                        <span><strong>Enrollment Status</strong><small>Maintain active, late-enrollee, and inactive registry status.</small></span>
                        <FiChevronRight />
                    </button>
                    <button type="button" className="dm-management-card" onClick={() => go("/admin/settings")}>
                        <span className="dm-management-icon purple"><FiDatabase /></span>
                        <span><strong>Collections / Database</strong><small>Database configuration and operational controls remain in System Configuration.</small></span>
                        <FiChevronRight />
                    </button>
                    <button type="button" className="dm-management-card" onClick={() => go("/admin/settings")}>
                        <span className="dm-management-icon orange"><FiArchive /></span>
                        <span><strong>Data Cleanup</strong><small>Archive eligible records without altering election or ballot data.</small></span>
                        <FiChevronRight />
                    </button>
                </section>

                <section className="dm-import-registry-grid" id="student-registry">
                    <article className="dm-panel dm-import-panel">
                        <div className="dm-panel-heading">
                            <div>
                                <span className="dm-kicker">STUDENT REGISTRY</span>
                                <h2>Import Dataset CSV</h2>
                                <p>
                                    Upload the official student dataset. Existing Student IDs are updated and new Student IDs are inserted into the Supabase <code>students</code> table.
                                </p>
                            </div>
                            <div className="dm-panel-icon blue"><FiUploadCloud /></div>
                        </div>

                        <input
                            ref={fileInputRef}
                            className="dm-hidden-input"
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileSelected}
                        />

                        <button
                            type="button"
                            className={`dm-dropzone ${selectedFile ? "selected" : ""}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FiUploadCloud size={30} />
                            <strong>{selectedFile ? selectedFile.name : "Import Student Dataset CSV"}</strong>
                            <span>
                                {selectedFile
                                    ? `${importRecords.length.toLocaleString()} valid records ready for preview`
                                    : "CSV only · Maximum 10 MB · Student ID, Full Name, Year Level required"}
                            </span>
                        </button>

                        <div className="dm-import-actions">
                            <button type="button" className="dm-secondary" onClick={downloadTemplate}>
                                <FiDownload /> CSV Template
                            </button>
                            {selectedFile && (
                                <button type="button" className="dm-secondary" onClick={clearImport}>
                                    <FiX /> Clear
                                </button>
                            )}
                            <button
                                type="button"
                                className="dm-primary"
                                disabled={!selectedFile || !importRecords.length || importing}
                                onClick={handleImport}
                            >
                                <FiUploadCloud />
                                {importing ? "Synchronizing..." : "Import Dataset"}
                            </button>
                        </div>

                        <div className="dm-security-note">
                            <FiShield />
                            <div>
                                <strong>Protected Admin operation</strong>
                                <span>
                                    The CSV is validated in the browser and again on the server before Supabase is changed. Student passwords, ballot selections, candidates, party lists, and election records are not modified by this importer.
                                </span>
                            </div>
                        </div>

                        {previewRows.length > 0 && (
                            <div className="dm-preview">
                                <div className="dm-preview-heading">
                                    <div>
                                        <span className="dm-kicker">PREVIEW</span>
                                        <h3>First {previewRows.length} records</h3>
                                    </div>
                                    <FiFileText />
                                </div>
                                <div className="dm-table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Student ID</th>
                                                <th>Full Name</th>
                                                <th>Year Level</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewRows.map((row) => (
                                                <tr key={`${row.student_id}-${row.rowNumber}`}>
                                                    <td>{row.student_id}</td>
                                                    <td>{row.full_name}</td>
                                                    <td>{row.year_level}</td>
                                                    <td><span className={`dm-status ${normalizeStatus(row.enrollment_status)}`}>{normalizeStatus(row.enrollment_status).replace("_", " ")}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </article>

                    <aside className="dm-side-stack">
                        <article className="dm-panel dm-format-panel">
                            <div className="dm-panel-heading compact">
                                <div>
                                    <span className="dm-kicker">CSV FORMAT</span>
                                    <h2>Accepted Dataset</h2>
                                </div>
                                <FiFileText className="dm-heading-icon" />
                            </div>
                            <div className="dm-format-list">
                                <span><b>Required</b> student_id</span>
                                <span><b>Required</b> full_name</span>
                                <span><b>Required</b> year_level</span>
                                <span><b>Optional</b> enrollment_status</span>
                                <span><b>Optional</b> name/address fields</span>
                            </div>
                            <button type="button" className="dm-link-button" onClick={downloadTemplate}>
                                Download CSV template <FiDownload />
                            </button>
                        </article>

                        <article className="dm-panel dm-info-panel">
                            <div className="dm-info-icon"><FiDatabase /></div>
                            <div>
                                <h3>Backend synchronization</h3>
                                <p>
                                    The import endpoint reads the current <code>students</code> table, updates matching Student IDs, inserts new Student IDs, and records the operation in VOTARA audit logs.
                                </p>
                            </div>
                        </article>
                    </aside>
                </section>

                <section className="dm-panel dm-registry-panel">
                    <div className="dm-registry-heading">
                        <div>
                            <span className="dm-kicker">LIVE REGISTRY</span>
                            <h2>Student Records</h2>
                            <p>{filteredStudents.length.toLocaleString()} records shown from the current VOTARA student registry.</p>
                        </div>
                        <div className="dm-registry-tools">
                            <label className="dm-search">
                                <FiSearch />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search Student ID or name..."
                                />
                            </label>
                            <select value={yearFilter} onChange={(event) => setYearFilter(event.target.value)}>
                                {YEAR_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                                {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="dm-table-scroll registry-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Full Name</th>
                                    <th>Year Level</th>
                                    <th>Enrollment Status</th>
                                    <th>Update</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="dm-empty">Loading student registry...</td></tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr><td colSpan="5" className="dm-empty">No student records match the selected filters.</td></tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <tr key={student.id || student.student_id}>
                                            <td><strong>{student.student_id}</strong></td>
                                            <td>{student.full_name}</td>
                                            <td>{student.year_level}</td>
                                            <td>
                                                <span className={`dm-status ${student.enrollment_status}`}>
                                                    {student.enrollment_status.replace("_", " ")}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className="dm-row-select"
                                                    value={student.enrollment_status}
                                                    disabled={updatingId === student.id}
                                                    onChange={(event) => updateStatus(student, event.target.value)}
                                                >
                                                    {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <footer className="dm-footer">
                    <span>VOTARA Data Management</span>
                    <span><FiSettings /> Collections, database controls, and system cleanup remain under System Configuration.</span>
                </footer>
            </main>
        </div>
    );
}

export default AdminDataManagement;
