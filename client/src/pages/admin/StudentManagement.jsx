import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentManagement.css";

function StudentManagement() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);

    const [students, setStudents] = useState([
        {
            id: "2024-0001",
            name: "Juan Dela Cruz",
            email: "juan.delacruz@student.edu",
            course: "BS Information Technology",
            year: "4th Year",
            status: "Active",
            registered: "Sep 10, 2026",
        },
        {
            id: "2024-0002",
            name: "Maria Santos",
            email: "maria.santos@student.edu",
            course: "BS Computer Science",
            year: "3rd Year",
            status: "Active",
            registered: "Sep 10, 2026",
        },
        {
            id: "2024-0003",
            name: "Mark Reyes",
            email: "mark.reyes@student.edu",
            course: "BS Information Technology",
            year: "2nd Year",
            status: "Pending",
            registered: "Sep 9, 2026",
        },
        {
            id: "2024-0004",
            name: "Angela Garcia",
            email: "angela.garcia@student.edu",
            course: "BS Business Administration",
            year: "4th Year",
            status: "Active",
            registered: "Sep 8, 2026",
        },
        {
            id: "2024-0005",
            name: "Carlos Mendoza",
            email: "carlos.mendoza@student.edu",
            course: "BS Information Technology",
            year: "1st Year",
            status: "Inactive",
            registered: "Sep 7, 2026",
        },
    ]);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [selectedStudent, setSelectedStudent] = useState(null);

    // =====================================================
    // CHECK ADMIN SESSION
    // =====================================================

    useEffect(() => {
        const token =
            localStorage.getItem(
                "votaraStaffToken"
            );

        const storedUser =
            localStorage.getItem(
                "votaraStaffUser"
            );

        if (!token || !storedUser) {
            navigate("/admin-login", {
                replace: true,
            });

            return;
        }

        try {
            const user =
                JSON.parse(storedUser);

            if (user.role !== "admin") {
                navigate(
                    "/electoral-board/dashboard",
                    {
                        replace: true,
                    }
                );

                return;
            }

            setAdmin(user);

        } catch (error) {
            console.error(
                "Invalid admin session:",
                error
            );

            localStorage.removeItem(
                "votaraStaffToken"
            );

            localStorage.removeItem(
                "votaraStaffUser"
            );

            navigate("/admin-login", {
                replace: true,
            });
        }
    }, [navigate]);

    // =====================================================
    // FILTER STUDENTS
    // =====================================================

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const searchValue =
                search.toLowerCase().trim();

            const matchesSearch =
                student.id
                    .toLowerCase()
                    .includes(searchValue) ||
                student.name
                    .toLowerCase()
                    .includes(searchValue) ||
                student.email
                    .toLowerCase()
                    .includes(searchValue) ||
                student.course
                    .toLowerCase()
                    .includes(searchValue);

            const matchesStatus =
                statusFilter === "All" ||
                student.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        students,
        search,
        statusFilter,
    ]);

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalStudents =
        students.length;

    const activeStudents =
        students.filter(
            (student) =>
                student.status === "Active"
        ).length;

    const pendingStudents =
        students.filter(
            (student) =>
                student.status === "Pending"
        ).length;

    const inactiveStudents =
        students.filter(
            (student) =>
                student.status === "Inactive"
        ).length;

    // =====================================================
    // DELETE STUDENT
    // =====================================================

    const deleteStudent = (id) => {
        const confirmed =
            window.confirm(
                "Are you sure you want to remove this student?"
            );

        if (!confirmed) {
            return;
        }

        setStudents(
            (currentStudents) =>
                currentStudents.filter(
                    (student) =>
                        student.id !== id
                )
        );
    };

    // =====================================================
    // PAGE
    // =====================================================

    return (
        <div className="student-management">

            {/* =================================================
                BACK TO DASHBOARD
            ================================================= */}

            <button
                type="button"
                className="back-to-dashboard"
                onClick={() =>
                    navigate("/admin-dashboard")
                }
            >
                <span>←</span>
                Back to Dashboard
            </button>


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="student-management-header">

                <div>
                    <span className="student-management-label">
                        STUDENT MANAGEMENT
                    </span>

                    <h1>
                        Student Management
                    </h1>

                    <p>
                        View, manage, and monitor
                        registered students in the
                        VOTARA election system.
                    </p>
                </div>

                <button
                    className="add-student-btn"
                    type="button"
                >
                    <span>+</span>
                    Add Student
                </button>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="student-stat-grid">

                <div className="student-stat-card">

                    <div className="student-stat-icon blue">
                        <span>♙</span>
                    </div>

                    <div>
                        <span className="student-stat-label">
                            Total Students
                        </span>

                        <strong>
                            {totalStudents}
                        </strong>

                        <small>
                            Registered students
                        </small>
                    </div>

                </div>


                <div className="student-stat-card">

                    <div className="student-stat-icon green">
                        <span>✓</span>
                    </div>

                    <div>
                        <span className="student-stat-label">
                            Active Students
                        </span>

                        <strong>
                            {activeStudents}
                        </strong>

                        <small>
                            Eligible student accounts
                        </small>
                    </div>

                </div>


                <div className="student-stat-card">

                    <div className="student-stat-icon orange">
                        <span>◷</span>
                    </div>

                    <div>
                        <span className="student-stat-label">
                            Pending
                        </span>

                        <strong>
                            {pendingStudents}
                        </strong>

                        <small>
                            Awaiting verification
                        </small>
                    </div>

                </div>


                <div className="student-stat-card">

                    <div className="student-stat-icon gray">
                        <span>−</span>
                    </div>

                    <div>
                        <span className="student-stat-label">
                            Inactive
                        </span>

                        <strong>
                            {inactiveStudents}
                        </strong>

                        <small>
                            Inactive accounts
                        </small>
                    </div>

                </div>

            </div>


            {/* =================================================
                STUDENTS TABLE
            ================================================= */}

            <div className="students-table-card">

                {/* TABLE HEADER */}

                <div className="students-table-header">

                    <div>
                        <h2>
                            Registered Students
                        </h2>

                        <p>
                            Manage all student accounts
                            registered in VOTARA.
                        </p>
                    </div>


                    <div className="student-tools">

                        {/* SEARCH */}

                        <div className="student-search">

                            <span>⌕</span>

                            <input
                                type="text"
                                placeholder="Search students..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                            />

                        </div>


                        {/* FILTER */}

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value
                                )
                            }
                            className="student-filter"
                        >
                            <option value="All">
                                All Status
                            </option>

                            <option value="Active">
                                Active
                            </option>

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="Inactive">
                                Inactive
                            </option>
                        </select>

                    </div>

                </div>


                {/* TABLE */}

                <div className="students-table-wrapper">

                    <table className="students-table">

                        <thead>

                            <tr>

                                <th>
                                    Student
                                </th>

                                <th>
                                    Student ID
                                </th>

                                <th>
                                    Course / Year
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Registered
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {filteredStudents.length >
                            0 ? (

                                filteredStudents.map(
                                    (student) => (

                                        <tr
                                            key={
                                                student.id
                                            }
                                        >

                                            {/* STUDENT */}

                                            <td>

                                                <div className="student-name-cell">

                                                    <div className="student-avatar">
                                                        {student.name.charAt(
                                                            0
                                                        )}
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {
                                                                student.name
                                                            }
                                                        </strong>

                                                        <span>
                                                            {
                                                                student.email
                                                            }
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* ID */}

                                            <td>

                                                <span className="student-id">
                                                    {
                                                        student.id
                                                    }
                                                </span>

                                            </td>


                                            {/* COURSE */}

                                            <td>

                                                <div className="course-cell">

                                                    <strong>
                                                        {
                                                            student.course
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            student.year
                                                        }
                                                    </span>

                                                </div>

                                            </td>


                                            {/* STATUS */}

                                            <td>

                                                <span
                                                    className={`student-status ${student.status.toLowerCase()}`}
                                                >

                                                    <span className="status-dot"></span>

                                                    {
                                                        student.status
                                                    }

                                                </span>

                                            </td>


                                            {/* REGISTERED */}

                                            <td>

                                                <span className="registered-date">
                                                    {
                                                        student.registered
                                                    }
                                                </span>

                                            </td>


                                            {/* ACTION */}

                                            <td>

                                                <div className="student-actions">

                                                    <button
                                                        type="button"
                                                        className="action-btn view"
                                                        onClick={() =>
                                                            setSelectedStudent(
                                                                student
                                                            )
                                                        }
                                                    >
                                                        View
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="action-btn delete"
                                                        onClick={() =>
                                                            deleteStudent(
                                                                student.id
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="6"
                                    >

                                        <div className="no-students">

                                            <div>
                                                ⌕
                                            </div>

                                            <strong>
                                                No students found
                                            </strong>

                                            <span>
                                                Try changing
                                                your search
                                                or filter.
                                            </span>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================================
                    TABLE FOOTER
                ================================================= */}

                <div className="students-table-footer">

                    <span>
                        Showing{" "}
                        <strong>
                            {
                                filteredStudents.length
                            }
                        </strong>{" "}
                        of{" "}
                        <strong>
                            {
                                students.length
                            }
                        </strong>{" "}
                        students
                    </span>


                    <div className="pagination">

                        <button
                            type="button"
                            disabled
                        >
                            ‹
                        </button>

                        <button
                            type="button"
                            className="active"
                        >
                            1
                        </button>

                        <button type="button">
                            2
                        </button>

                        <button type="button">
                            3
                        </button>

                        <button type="button">
                            ›
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                STUDENT DETAILS MODAL
            ================================================= */}

            {selectedStudent && (

                <div
                    className="student-modal-overlay"
                    onClick={() =>
                        setSelectedStudent(null)
                    }
                >

                    <div
                        className="student-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div className="student-modal-header">

                            <div>

                                <h2>
                                    Student Details
                                </h2>

                                <p>
                                    Student account
                                    information
                                </p>

                            </div>


                            <button
                                type="button"
                                className="modal-close"
                                onClick={() =>
                                    setSelectedStudent(
                                        null
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="modal-student-profile">

                            <div className="modal-avatar">
                                {selectedStudent.name.charAt(
                                    0
                                )}
                            </div>

                            <div>

                                <h3>
                                    {
                                        selectedStudent.name
                                    }
                                </h3>

                                <p>
                                    {
                                        selectedStudent.email
                                    }
                                </p>

                            </div>

                        </div>


                        <div className="modal-details">

                            <div>

                                <label>
                                    Student ID
                                </label>

                                <strong>
                                    {
                                        selectedStudent.id
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Course
                                </label>

                                <strong>
                                    {
                                        selectedStudent.course
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Year Level
                                </label>

                                <strong>
                                    {
                                        selectedStudent.year
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Status
                                </label>

                                <strong>
                                    {
                                        selectedStudent.status
                                    }
                                </strong>

                            </div>


                            <div>

                                <label>
                                    Registered
                                </label>

                                <strong>
                                    {
                                        selectedStudent.registered
                                    }
                                </strong>

                            </div>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default StudentManagement;