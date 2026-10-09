import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    FiArrowLeft,
    FiCheckCircle,
    FiChevronLeft,
    FiChevronRight,
    FiDownload,
    FiBell,
    FiDatabase,
    FiFileText,
    FiFilter,
    FiLogOut,
    FiRefreshCw,
    FiSearch,
    FiShield,
    FiTrash2,
    FiUploadCloud,
    FiUserCheck,
    FiUserX,
    FiUsers,
    FiXCircle,
} from "react-icons/fi";
import api from "../../services/api";
import "./AdminDashboard.css";
import "./DataManagement.css";

const PAGE_LIMIT = 25;

const escapeCsv = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

const DataManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);

    const storedAdmin = useMemo(() => {
        try {
            return JSON.parse(
                localStorage.getItem("votaraAdminUser") || "null"
            );
        } catch {
            return null;
        }
    }, []);

    const adminDisplayName =
        storedAdmin?.full_name || "Administrator";

    const goToAdminPage = (path) => {
        if (location.pathname === path) return;
        navigate(path);
    };

    const handleAdminLogout = () => {
        localStorage.removeItem("votaraAdminToken");
        localStorage.removeItem("votaraAdminUser");
        navigate("/admin-login", { replace: true });
    };

    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState({
        totalStudents: 0,
        activeStudents: 0,
        inactiveStudents: 0,
        removedStudents: 0,
    });

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: PAGE_LIMIT,
        total: 0,
        totalPages: 1,
    });

    const [selectedFile, setSelectedFile] = useState(null);

    const token = localStorage.getItem("votaraAdminToken");

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const loadSummary = async () => {
        const response = await api.get(
            "/admin/data/summary",
            authConfig
        );

        if (response.data?.success) {
            setSummary(
                response.data.summary || {}
            );
        }
    };

    const loadStudents = async () => {
        setLoading(true);
        setError("");

        try {
            if (!token) {
                navigate("/admin-login", {
                    replace: true,
                });
                return;
            }

            const response = await api.get(
                "/admin/data/students",
                {
                    ...authConfig,
                    params: {
                        page,
                        limit: PAGE_LIMIT,
                        search,
                        status,
                        year_level: yearLevel,
                    },
                }
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Unable to load student registry."
                );
            }

            setStudents(
                response.data.students || []
            );
            setPagination(
                response.data.pagination || {
                    page,
                    limit: PAGE_LIMIT,
                    total: 0,
                    totalPages: 1,
                }
            );

            await loadSummary();
        } catch (requestError) {
            if (
                requestError.response?.status ===
                401
            ) {
                localStorage.removeItem(
                    "votaraAdminToken"
                );
                localStorage.removeItem(
                    "votaraAdminUser"
                );

                navigate("/admin-login", {
                    replace: true,
                });
                return;
            }

            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Unable to load student registry."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = window.setTimeout(
            () => {
                loadStudents();
            },
            250
        );

        return () => window.clearTimeout(timer);
        // Search/filter/page intentionally trigger a fresh registry query.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search, status, yearLevel]);

    const showResult = (text) => {
        setMessage(text);
        window.setTimeout(
            () => setMessage(""),
            4000
        );
    };

    const handleFileChange = (event) => {
        const file =
            event.target.files?.[0] || null;

        setSelectedFile(file);
        setError("");
        setMessage("");
    };

    const handleImport = async () => {
        if (!selectedFile) {
            setError(
                "Please select a CSV file first."
            );
            return;
        }

        if (
            !selectedFile.name
                .toLowerCase()
                .endsWith(".csv")
        ) {
            setError(
                "Only CSV files are accepted."
            );
            return;
        }

        try {
            setUploading(true);
            setError("");
            setMessage("");

            const csvText =
                await selectedFile.text();

            const response = await api.post(
                "/admin/data/students/import",
                {
                    csvText,
                    fileName:
                        selectedFile.name,
                },
                authConfig
            );

            if (!response.data?.success) {
                throw new Error(
                    response.data?.message ||
                    "Student import failed."
                );
            }

            const rejected =
                response.data.rejectedCount || 0;

            showResult(
                `${response.data.importedCount || 0} student record(s) synchronized successfully${
                    rejected
                        ? `; ${rejected} row(s) were rejected.`
                        : "."
                }`
            );

            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            await loadStudents();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                "Unable to import CSV."
            );
        } finally {
            setUploading(false);
        }
    };

    const updateStudent = async (
        student,
        action
    ) => {
        const labels = {
            activate: "activate",
            deactivate: "deactivate",
            remove: "remove",
        };

        const label =
            labels[action] || action;

        if (
            !window.confirm(
                `Are you sure you want to ${label} ${student.full_name} (${student.student_id})?`
            )
        ) {
            return;
        }

        try {
            setError("");

            await api.patch(
                `/admin/data/students/${encodeURIComponent(
                    student.student_id
                )}/${action}`,
                {},
                authConfig
            );

            showResult(
                `Student ${student.student_id} was ${label}d successfully.`
            );

            await loadStudents();
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                requestError.message ||
                `Unable to ${label} student.`
            );
        }
    };

    const downloadTemplate = () => {
        const headers = [
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

        const example = [
            "2026-00001",
            "Juan Dela Cruz",
            "Juan",
            "Dela",
            "Cruz",
            "1st Year",
            "active",
            "2007-05-10",
            "09171234567",
            "Iloilo",
            "Jaro",
            "Iloilo City",
        ];

        const csv = [
            headers,
            example,
        ]
            .map((row) =>
                row.map(escapeCsv).join(",")
            )
            .join("\n");

        const blob = new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;",
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            "votara-student-import-template.csv";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    const exportCurrentView = () => {
        const rows = students.map(
            (student) => [
                student.student_id,
                student.full_name,
                student.year_level,
                student.enrollment_status ||
                    "active",
                student.account
                    ?.account_status ||
                    "not_created",
                student.account?.email || "",
            ]
        );

        const csv = [
            [
                "student_id",
                "full_name",
                "year_level",
                "enrollment_status",
                "account_status",
                "email",
            ],
            ...rows,
        ]
            .map((row) =>
                row.map(escapeCsv).join(",")
            )
            .join("\n");

        const blob = new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;",
            }
        );

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;
        link.download =
            `votara-students-page-${page}.csv`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    };

    const visibleCount = useMemo(
        () => students.length,
        [students]
    );

    return (
        <div className="data-management-page">
            <header className="votara-admin-topbar ua-shared-topbar">
                <button
                    type="button"
                    className="votara-admin-brand"
                    onClick={() => goToAdminPage("/admin-dashboard")}
                    aria-label="Votara System Dashboard"
                >
                    <span
                        className="votara-admin-brand-mark"
                        aria-hidden="true"
                    >
                        <img
                            src="/src/images/Votara.png"
                            alt=""
                            className="votara-admin-brand-logo"
                        />
                    </span>
                    <span className="votara-admin-brand-name">
                        Votara
                    </span>
                </button>

                <nav
                    className="votara-admin-topnav"
                    aria-label="Admin navigation"
                >
                    <button
                        type="button"
                        className={`votara-admin-topnav-link ${
                            location.pathname === "/admin-dashboard"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            goToAdminPage("/admin-dashboard")
                        }
                    >
                        System Dashboard
                    </button>

                    <button
                        type="button"
                        className={`votara-admin-topnav-link ${
                            location.pathname === "/admin/users" ||
                            location.pathname === "/admin/electoral-board" ||
                            location.pathname === "/admin/admin-accounts"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            goToAdminPage("/admin/users")
                        }
                    >
                        User &amp; Access Management
                    </button>

                    <button
                        type="button"
                        className={`votara-admin-topnav-link ${
                            location.pathname === "/admin/data-management"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            goToAdminPage("/admin/data-management")
                        }
                    >
                        Data Management
                    </button>

                    <button
                        type="button"
                        className={`votara-admin-topnav-link ${
                            location.pathname === "/admin/settings"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            goToAdminPage("/admin/settings")
                        }
                    >
                        System Configuration
                    </button>

                    <button
                        type="button"
                        className={`votara-admin-topnav-link ${
                            location.pathname === "/admin/audit-logs"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            goToAdminPage("/admin/audit-logs")
                        }
                    >
                        Monitoring &amp; Logs
                    </button>

                    <button
                        type="button"
                        className="votara-admin-topnav-link"
                        onClick={() =>
                            goToAdminPage("/admin/settings")
                        }
                    >
                        Support &amp; Troubleshooting
                    </button>

                    <button
                        type="button"
                        className={`votara-admin-topnav-link ${
                            location.pathname === "/admin/reports"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            goToAdminPage("/admin/reports")
                        }
                    >
                        Reports &amp; Analytics
                    </button>
                </nav>

                <div className="votara-admin-topbar-actions">
                    <button
                        type="button"
                        className="votara-topbar-environment"
                        aria-label="Environment"
                    >
                        <span className="votara-env-dot"></span>
                        Production
                    </button>

                    <button
                        type="button"
                        className="votara-notification-button"
                        onClick={() =>
                            goToAdminPage("/admin/audit-logs")
                        }
                        title="Notifications"
                        aria-label="Notifications"
                    >
                        <span className="notification-dot"></span>
                        <FiBell size={16} />
                    </button>

                    <div className="votara-admin-user">
                        <span className="votara-admin-user-avatar">
                            {adminDisplayName.charAt(0).toUpperCase()}
                        </span>
                        <span className="votara-admin-user-name">
                            {adminDisplayName}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="votara-admin-logout"
                        onClick={handleAdminLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <FiLogOut size={17} />
                    </button>
                </div>
            </header>

            <header className="data-management-header">
                <div className="data-management-header-left">
                    <button
                        type="button"
                        className="dm-back-button"
                        onClick={() =>
                            navigate(
                                "/admin-dashboard"
                            )
                        }
                        title="Back to Admin Dashboard"
                    >
                        <FiArrowLeft size={18} />
                    </button>

                    <div>
                        <span className="dm-kicker">
                            ADMIN • 03
                        </span>
                        <h1>
                            Data Management
                        </h1>
                        <p>
                            Maintain the VOTARA student
                            registry, enrollment status,
                            and data lifecycle.
                        </p>
                    </div>
                </div>

                <div className="dm-header-actions">
                    <button
                        type="button"
                        className="dm-secondary-button"
                        onClick={downloadTemplate}
                    >
                        <FiDownload size={16} />
                        CSV Template
                    </button>

                    <button
                        type="button"
                        className="dm-primary-button"
                        onClick={() =>
                            fileInputRef.current?.click()
                        }
                    >
                        <FiUploadCloud size={17} />
                        Choose CSV
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv"
                        hidden
                        onChange={handleFileChange}
                    />
                </div>
            </header>

            <main className="dm-content">
                <section className="dm-stat-grid">
                    <div className="dm-stat-card">
                        <div className="dm-stat-icon blue">
                            <FiUsers />
                        </div>
                        <span>Total Students</span>
                        <strong>
                            {summary.totalStudents}
                        </strong>
                    </div>

                    <div className="dm-stat-card">
                        <div className="dm-stat-icon green">
                            <FiUserCheck />
                        </div>
                        <span>Active</span>
                        <strong>
                            {summary.activeStudents}
                        </strong>
                    </div>

                    <div className="dm-stat-card">
                        <div className="dm-stat-icon amber">
                            <FiUserX />
                        </div>
                        <span>Inactive</span>
                        <strong>
                            {summary.inactiveStudents}
                        </strong>
                    </div>

                    <div className="dm-stat-card">
                        <div className="dm-stat-icon red">
                            <FiTrash2 />
                        </div>
                        <span>Removed</span>
                        <strong>
                            {summary.removedStudents}
                        </strong>
                    </div>
                </section>

                <section className="dm-import-card">
                    <div className="dm-import-icon">
                        <FiUploadCloud size={27} />
                    </div>

                    <div className="dm-import-copy">
                        <h2>
                            Student Registry Import
                        </h2>
                        <p>
                            Upload a CSV to add new students
                            or update existing student records.
                            Records are matched using
                            <strong> student_id</strong>.
                            Missing CSV rows are never
                            automatically deleted.
                        </p>

                        {selectedFile && (
                            <div className="dm-selected-file">
                                <FiFileText />
                                <span>
                                    {selectedFile.name}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        if (
                                            fileInputRef.current
                                        ) {
                                            fileInputRef.current.value =
                                                "";
                                        }
                                    }}
                                    title="Remove selected file"
                                >
                                    <FiXCircle />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        className="dm-import-button"
                        onClick={handleImport}
                        disabled={
                            uploading ||
                            !selectedFile
                        }
                    >
                        {uploading ? (
                            <>
                                <FiRefreshCw className="dm-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <FiUploadCloud />
                                Import / Sync
                            </>
                        )}
                    </button>
                </section>

                {message && (
                    <div className="dm-alert dm-alert-success">
                        <FiCheckCircle />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="dm-alert dm-alert-error">
                        <FiXCircle />
                        {error}
                    </div>
                )}

                <section className="dm-tool-grid">
                    <button
                        type="button"
                        className="dm-tool-card"
                        onClick={() => {
                            setStatus("");
                            setPage(1);
                        }}
                    >
                        <FiDatabase />
                        <span>
                            <strong>
                                Student Registry
                            </strong>
                            <small>
                                Import, search, filter,
                                and manage student records.
                            </small>
                        </span>
                    </button>

                    <button
                        type="button"
                        className="dm-tool-card"
                        onClick={() => {
                            setStatus("active");
                            setPage(1);
                        }}
                    >
                        <FiUserCheck />
                        <span>
                            <strong>
                                Enrollment Status
                            </strong>
                            <small>
                                Review active and inactive
                                enrollment records.
                            </small>
                        </span>
                    </button>

                    <button
                        type="button"
                        className="dm-tool-card"
                        onClick={exportCurrentView}
                    >
                        <FiDownload />
                        <span>
                            <strong>
                                Export Registry
                            </strong>
                            <small>
                                Download the currently
                                filtered student list.
                            </small>
                        </span>
                    </button>

                    <button
                        type="button"
                        className="dm-tool-card"
                        onClick={() =>
                            setStatus("removed")
                        }
                    >
                        <FiTrash2 />
                        <span>
                            <strong>
                                Data Cleanup
                            </strong>
                            <small>
                                Review records that were
                                removed from the active registry.
                            </small>
                        </span>
                    </button>
                </section>

                <section className="dm-table-card">
                    <div className="dm-table-header">
                        <div>
                            <span className="dm-section-kicker">
                                BACKGROUND STUDENT LIST
                            </span>
                            <h2>
                                Student Registry
                            </h2>
                            <p>
                                {pagination.total.toLocaleString()}
                                {" "}records in the current
                                registry.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="dm-refresh-button"
                            onClick={loadStudents}
                            disabled={loading}
                        >
                            <FiRefreshCw
                                className={
                                    loading
                                        ? "dm-spin"
                                        : ""
                                }
                            />
                            Refresh
                        </button>
                    </div>

                    <div className="dm-filters">
                        <div className="dm-search">
                            <FiSearch />
                            <input
                                value={search}
                                onChange={(event) => {
                                    setSearch(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                                placeholder="Search Student ID or name..."
                            />
                        </div>

                        <div className="dm-select">
                            <FiFilter />
                            <select
                                value={yearLevel}
                                onChange={(event) => {
                                    setYearLevel(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    All Year Levels
                                </option>
                                <option value="1st Year">
                                    1st Year
                                </option>
                                <option value="2nd Year">
                                    2nd Year
                                </option>
                                <option value="3rd Year">
                                    3rd Year
                                </option>
                                <option value="4th Year">
                                    4th Year
                                </option>
                            </select>
                        </div>

                        <div className="dm-select">
                            <FiShield />
                            <select
                                value={status}
                                onChange={(event) => {
                                    setStatus(
                                        event.target.value
                                    );
                                    setPage(1);
                                }}
                            >
                                <option value="">
                                    All Status
                                </option>
                                <option value="active">
                                    Active
                                </option>
                                <option value="inactive">
                                    Inactive
                                </option>
                                <option value="removed">
                                    Removed
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="dm-table-wrap">
                        <table className="dm-table">
                            <thead>
                                <tr>
                                    <th>Student ID</th>
                                    <th>Student</th>
                                    <th>Year Level</th>
                                    <th>Enrollment</th>
                                    <th>Account</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="dm-empty"
                                        >
                                            <FiRefreshCw className="dm-spin" />
                                            Loading student registry...
                                        </td>
                                    </tr>
                                ) : students.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="dm-empty"
                                        >
                                            <FiUsers />
                                            No student records found.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map(
                                        (student) => {
                                            const enrollment =
                                                student.enrollment_status ||
                                                "active";

                                            const account =
                                                student.account
                                                    ?.account_status ||
                                                "not_created";

                                            return (
                                                <tr
                                                    key={
                                                        student.student_id
                                                    }
                                                >
                                                    <td>
                                                        <strong>
                                                            {
                                                                student.student_id
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td>
                                                        <div className="dm-student-name">
                                                            <strong>
                                                                {
                                                                    student.full_name
                                                                }
                                                            </strong>
                                                            <small>
                                                                {
                                                                    student.account
                                                                        ?.email ||
                                                                    "No account email"
                                                                }
                                                            </small>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {
                                                            student.year_level ||
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`dm-status ${enrollment}`}
                                                        >
                                                            {enrollment}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <span
                                                            className={`dm-status ${account}`}
                                                        >
                                                            {account.replace(
                                                                "_",
                                                                " "
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td>
                                                        <div className="dm-row-actions">
                                                            {enrollment ===
                                                            "active" ? (
                                                                <button
                                                                    type="button"
                                                                    className="dm-action warning"
                                                                    title="Deactivate student"
                                                                    onClick={() =>
                                                                        updateStudent(
                                                                            student,
                                                                            "deactivate"
                                                                        )
                                                                    }
                                                                >
                                                                    <FiUserX />
                                                                </button>
                                                            ) : enrollment ===
                                                              "removed" ? (
                                                                <button
                                                                    type="button"
                                                                    className="dm-action success"
                                                                    title="Reactivate student"
                                                                    onClick={() =>
                                                                        updateStudent(
                                                                            student,
                                                                            "activate"
                                                                        )
                                                                    }
                                                                >
                                                                    <FiUserCheck />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="dm-action success"
                                                                    title="Activate student"
                                                                    onClick={() =>
                                                                        updateStudent(
                                                                            student,
                                                                            "activate"
                                                                        )
                                                                    }
                                                                >
                                                                    <FiUserCheck />
                                                                </button>
                                                            )}

                                                            {enrollment !==
                                                            "removed" && (
                                                                <button
                                                                    type="button"
                                                                    className="dm-action danger"
                                                                    title="Remove from active registry"
                                                                    onClick={() =>
                                                                        updateStudent(
                                                                            student,
                                                                            "remove"
                                                                        )
                                                                    }
                                                                >
                                                                    <FiTrash2 />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="dm-pagination">
                        <span>
                            Showing {visibleCount} of{" "}
                            {pagination.total.toLocaleString()} records
                        </span>

                        <div>
                            <button
                                type="button"
                                disabled={
                                    page <= 1 ||
                                    loading
                                }
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            Math.max(
                                                1,
                                                current - 1
                                            )
                                    )
                                }
                            >
                                <FiChevronLeft />
                            </button>

                            <strong>
                                {page} /{" "}
                                {Math.max(
                                    1,
                                    pagination.totalPages
                                )}
                            </strong>

                            <button
                                type="button"
                                disabled={
                                    page >=
                                        pagination.totalPages ||
                                    loading
                                }
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            Math.min(
                                                pagination.totalPages,
                                                current + 1
                                            )
                                    )
                                }
                            >
                                <FiChevronRight />
                            </button>
                        </div>
                    </div>
                </section>

                <section className="dm-security-note">
                    <FiShield />
                    <div>
                        <strong>
                            Data safety rule
                        </strong>
                        <p>
                            CSV synchronization uses
                            <strong> student_id</strong> as the
                            unique key. Existing records are
                            updated; records missing from a CSV
                            are not automatically deleted.
                            Removal is handled as a soft removal
                            so historical election references
                            remain intact.
                        </p>
                    </div>
                </section>
            </main>
        </div>
        
    );
};

export default DataManagement;
