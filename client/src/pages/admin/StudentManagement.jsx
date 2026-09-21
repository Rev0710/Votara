import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentManagement.css";
import PageLoader from "/src/components/transitionloader/PageLoader";
import { FiBell, FiLogOut } from "react-icons/fi";

function StudentManagement() {
    const navigate = useNavigate();
    const profileInputRef = useRef(null);

    const [admin, setAdmin] = useState(null);

    // Page transition loader used for navigation away from User & Access.
    const [isPageTransitioning, setIsPageTransitioning] = useState(false);

    const [selectedRole, setSelectedRole] = useState("admin");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("Administrator");
    const [expires, setExpires] = useState("7 days");
    const [profileFile, setProfileFile] = useState(null);
    const [generatedCode, setGeneratedCode] = useState("");
    const [recentInvitations, setRecentInvitations] = useState([
        {
            id: 1,
            name: "Sarah Fukiko",
            email: "sarah@gmail.com",
            role: "Admin",
            status: "Active",
            date: "Today",
        },
        {
            id: 2,
            name: "Sarah Fukiko",
            email: "sarah@gmail.com",
            role: "Electoral Board",
            status: "Offline",
            date: "Yesterday",
        },
        {
            id: 3,
            name: "Sarah Fukiko",
            email: "sarah@gmail.com",
            role: "Electoral Board",
            status: "Offline",
            date: "Sep 18, 2026",
        },
        {
            id: 4,
            name: "Sarah Fukiko",
            email: "sarah@gmail.com",
            role: "Electoral Board",
            status: "Offline",
            date: "Sep 17, 2026",
        },
    ]);

    const [showInvitationCode, setShowInvitationCode] = useState(false);
    const [adminConfirmation, setAdminConfirmation] = useState(false);
    const [showAdminConfirmationError, setShowAdminConfirmationError] = useState(false);
    const [showPasswordSuccess, setShowPasswordSuccess] = useState(false);
    const [generatedForName, setGeneratedForName] = useState("");

    // =====================================================
    // CHECK ADMIN SESSION
    // =====================================================

    useEffect(() => {
        const token = localStorage.getItem("votaraStaffToken");
        const storedUser = localStorage.getItem("votaraStaffUser");

        if (!token || !storedUser) {
            navigate("/admin-login", { replace: true });
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            if (user.role !== "admin") {
                navigate("/electoral-board/dashboard", { replace: true });
                return;
            }

            setAdmin(user);
        } catch (error) {
            console.error("Invalid admin session:", error);
            localStorage.removeItem("votaraStaffToken");
            localStorage.removeItem("votaraStaffUser");
            navigate("/admin-login", { replace: true });
        }
    }, [navigate]);

    // =====================================================
    // PAGE NAVIGATION WITH TRANSITION
    // =====================================================

    const goTo = (path) => {
        if (isPageTransitioning) {
            return;
        }

        setIsPageTransitioning(true);

        window.setTimeout(() => {
            navigate(path);
        }, 700);
    };

    // =====================================================
    // NAVBAR LOGOUT
    // =====================================================

    const handleNavbarLogout = () => {
        localStorage.removeItem("votaraStaffToken");
        localStorage.removeItem("votaraStaffUser");

        navigate("/admin-login", { replace: true });
    };

    // =====================================================
    // ROLE SELECTION
    // =====================================================

    const handleRoleCard = (nextRole) => {
        setSelectedRole(nextRole);
        setRole(nextRole === "admin" ? "Administrator" : "Electoral Board");

        // The administrator confirmation only applies to the Administrator role.
        if (nextRole === "electoral") {
            setAdminConfirmation(false);
            setShowAdminConfirmationError(false);
        } else {
            setShowAdminConfirmationError(false);
        }
    };

    // =====================================================
    // PROFILE UPLOAD
    // =====================================================

    const handleProfileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        setProfileFile(file);
    };

    // =====================================================
    // CLEAR FORM
    // =====================================================

    const clearForm = () => {
        setFullName("");
        setEmail("");
        setRole("Administrator");
        setExpires("7 days");
        setSelectedRole("admin");
        setProfileFile(null);
        setGeneratedCode("");
        setShowInvitationCode(false);
        setAdminConfirmation(false);
        setShowAdminConfirmationError(false);
        setShowPasswordSuccess(false);
        setGeneratedForName("");

        if (profileInputRef.current) {
            profileInputRef.current.value = "";
        }
    };

    // =====================================================
    // GENERATE INVITATION
    // =====================================================

    const invitationCode = useMemo(() => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";

        for (let index = 0; index < 8; index += 1) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }

        return `VOT-${code.slice(0, 4)}-${code.slice(4)}`;
    }, [showInvitationCode]);

    const handleGenerateInvitation = () => {
        if (!fullName.trim() || !email.trim()) {
            window.alert("Please enter the full name and email address.");
            return;
        }

        // Administrator accounts require an explicit confirmation.
        // Electoral Board accounts do not show or require this confirmation.
        if (selectedRole === "admin" && !adminConfirmation) {
            setShowAdminConfirmationError(true);
            return;
        }

        setShowAdminConfirmationError(false);

        const code = invitationCode;

        setGeneratedCode(code);
        setGeneratedForName(fullName.trim());
        setShowInvitationCode(true);
        setShowPasswordSuccess(true);

        setRecentInvitations((current) => [
            {
                id: Date.now(),
                name: fullName.trim(),
                email: email.trim(),
                role: role === "Administrator" ? "Admin" : "Electoral Board",
                status: "Offline",
                date: "Just now",
                code,
            },
            ...current,
        ]);

        setFullName("");
        setEmail("");
        setProfileFile(null);
        setAdminConfirmation(false);

        if (profileInputRef.current) {
            profileInputRef.current.value = "";
        }
    };

    const handleCopyCode = async () => {
        if (!generatedCode) return;

        try {
            await navigator.clipboard.writeText(generatedCode);
            window.alert("Invitation code copied.");
        } catch {
            window.alert(`Invitation code: ${generatedCode}`);
        }
    };

    // =====================================================
    // PAGE
    // =====================================================

    if (!admin) {
        return (
            <div className="student-management-loading">
                Loading...
            </div>
        );
    }

    return (
        <div className="student-management">

            {isPageTransitioning && <PageLoader />}

            {/* =================================================
                TOP NAVIGATION
            ================================================= */}

            <header className="student-management-topbar">
                <button
                    type="button"
                    className="student-management-brand"
                    onClick={() => goTo("/admin-dashboard")}
                    aria-label="Go to Votara dashboard"
                >
                    <span className="student-management-logo">
                        <img
            src="/src/images/Votara.png"
            alt="Votara Logo"
            className="student-management-brand-logo"
        />
                    </span>

                    <span className="votara-student-brand-name">Votara</span>
                </button>

                <nav
                    className="student-management-nav"
                    aria-label="Admin navigation"
                >
                    <button
                        type="button"
                        onClick={() => goTo("/admin-dashboard")}
                    >
                        Overview
                    </button>

                    <button
                        type="button"
                        className="active"
                        onClick={() => goTo("/admin/students")}
                    >
                        User
                    </button>

                    <button
                        type="button"
                        onClick={() => goTo("/admin/election")}
                    >
                        Elections
                    </button>

                    <button
                        type="button"
                        onClick={() => goTo("/admin/candidates")}
                    >
                        Candidates
                    </button>

                    <button
                        type="button"
                        onClick={() => goTo("/admin/audit-logs")}
                    >
                        Logs
                    </button>

                    <button
                        type="button"
                        onClick={() => goTo("/admin/settings")}
                    >
                        Config &amp; Support
                    </button>
                </nav>

                <div className="student-management-nav-right">
                    <span className="production-pill">
                        <span></span>
                        Production
                    </span>

                    <button
                        type="button"
                        className="student-management-notification-button"
                        onClick={() => goTo("/admin/audit-logs")}
                        title="Notifications"
                        aria-label="Notifications"
                    >
                        <span className="student-management-notification-dot"></span>
                        <FiBell size={16} />
                    </button>

                    <div className="student-management-user">
                        <span className="student-management-user-avatar">
                            {admin.full_name?.charAt(0)?.toUpperCase() || "A"}
                        </span>
                        <span className="student-management-user-name">
                            {admin.full_name || "Administrator"}
                        </span>
                    </div>

                    <button
                        type="button"
                        className="student-management-logout"
                        onClick={handleNavbarLogout}
                        title="Logout"
                        aria-label="Logout"
                    >
                        <FiLogOut size={17} />
                    </button>
                </div>
            </header>

            {/* =================================================
                PAGE CONTENT
            ================================================= */}

            <main className="student-management-content">

                <div className="student-management-heading">
                    <div>
                        <span className="page-badge">
                            <span className="page-badge-dot"></span>
                            User &amp; access management
                        </span>

                        <h1>Invite a team member</h1>

                        <p>
                            Issue a single-use invitation code for an administrator
                            or electoral board member. The code is tied to one
                            campus email and expires in seven days.
                        </p>
                    </div>
                </div>

                <section className="user-access-layout">

                    {/* =================================================
                        NEW INVITATION
                    ================================================= */}

                    <div className="invitation-card">

                        <div className="section-title">
                            <h2>New Invitation</h2>
                        </div>

                        <div className="role-label">Role</div>

                        <div className="role-selection">

                            <button
                                type="button"
                                className={`role-card ${
                                    selectedRole === "admin" ? "selected" : ""
                                }`}
                                onClick={() => handleRoleCard("admin")}
                            >
                                <span className="role-card-icon">
                                    ♢
                                </span>

                                <span className="role-card-content">
                                    <strong>Administrator</strong>
                                    <small>
                                        Full system access, settings, users and
                                        election management.
                                    </small>
                                </span>

                                <span className="role-radio"></span>
                            </button>

                            <button
                                type="button"
                                className={`role-card ${
                                    selectedRole === "electoral" ? "selected" : ""
                                }`}
                                onClick={() => handleRoleCard("electoral")}
                            >
                                <span className="role-card-icon electoral">
                                    ♙
                                </span>

                                <span className="role-card-content">
                                    <strong>Electoral Board</strong>
                                    <small>
                                        Manage elections, candidates and voting
                                        operations.
                                    </small>
                                </span>

                                <span className="role-radio"></span>
                            </button>

                        </div>

                        {/* ADMIN-ONLY WARNING */}

                        {selectedRole === "admin" && (
                            <div className="admin-warning-card">
                                <span className="warning-icon">△</span>

                                <div className="warning-content">
                                    <strong>
                                        Administrators can change election results infrastructure
                                    </strong>

                                    <p>
                                        This role can edit any election, alter system
                                        configuration, and revoke other admins. Only issue
                                        it to staff who need platform-wide control.
                                    </p>

                                    <label className={`confirmation-check ${
                                        showAdminConfirmationError ? "has-error" : ""
                                    }`}>
                                        <input
                                            type="checkbox"
                                            checked={adminConfirmation}
                                            onChange={(event) => {
                                                setAdminConfirmation(event.target.checked);
                                                if (event.target.checked) {
                                                    setShowAdminConfirmationError(false);
                                                }
                                            }}
                                        />
                                        <span>
                                            I confirm this person requires administrator access.
                                        </span>
                                    </label>

                                    {showAdminConfirmationError && (
                                        <span className="confirmation-error">
                                            Please confirm administrator access before generating the password.
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="invitation-form">

                            <label>
                                <span>Fullname</span>
                                <input
                                    type="text"
                                    placeholder="Enter full name"
                                    value={fullName}
                                    onChange={(event) =>
                                        setFullName(event.target.value)
                                    }
                                />
                            </label>

                            <label>
                                <span>Email</span>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                />
                            </label>

                            <label className="code-expires-field">
                                <span>Code Expires</span>
                                <select
                                    value={expires}
                                    onChange={(event) =>
                                        setExpires(event.target.value)
                                    }
                                >
                                    <option>7 days</option>
                                    <option>3 days</option>
                                    <option>24 hours</option>
                                    <option>12 hours</option>
                                </select>
                            </label>

                            <div className="profile-upload-section">
                                <span className="upload-title">
                                    Upload Profile (Optional)
                                </span>

                                <input
                                    ref={profileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleProfileChange}
                                    hidden
                                />

                                <button
                                    type="button"
                                    className={`profile-upload ${
                                        profileFile ? "has-file" : ""
                                    }`}
                                    onClick={() =>
                                        profileInputRef.current?.click()
                                    }
                                >
                                    <span className="upload-icon">⇧</span>

                                    <span>
                                        {profileFile
                                            ? profileFile.name
                                            : "Upload Account Profile picture"}
                                    </span>
                                </button>
                            </div>

                            <div className="invitation-actions">

                                <button
                                    type="button"
                                    className="clear-button"
                                    onClick={clearForm}
                                >
                                    Clear
                                </button>

                                <button
                                    type="button"
                                    className="generate-button"
                                    onClick={handleGenerateInvitation}
                                >
                                    Generate Password
                                    <span className="generate-arrow">↗</span>
                                </button>

                            </div>

                        </div>
                    </div>

                    {/* =================================================
                        RIGHT COLUMN
                    ================================================= */}

                    <div className="user-access-right">

                        {/* INVITATION CODE */}

                        <div className="invitation-code-card">

                            <div className="right-card-header">
                                <h2>Password</h2>
                            </div>

                            <div className="invitation-code-empty">

                                <div className="invitation-code-icon">
                                    ✉
                                </div>

                                {showInvitationCode ? (
                                    <>
                                        <strong>{generatedCode}</strong>

                                        <p>
                                            This single-use invitation code is valid
                                            for <b>{expires}</b>.
                                        </p>

                                        <button
                                            type="button"
                                            className="copy-code-button"
                                            onClick={handleCopyCode}
                                        >
                                            Copy Password
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <strong>No password yet</strong>

                                        <p>
                                            Fill in the name and email, then generate.
                                            The password will appear here after it is generated.
                                        </p>
                                    </>
                                )}

                            </div>
                        </div>

                        {/* RECENT INVITATIONS */}

                        <div className="recent-invitations-card">

                            <div className="right-card-header">
                                <h2>Recent invitations</h2>
                            </div>

                            <div className="recent-invitations-list">

                                {recentInvitations.map((invitation) => (
                                    <div
                                        className="recent-invitation-row"
                                        key={invitation.id}
                                    >
                                        <div className="recent-avatar">
                                            {invitation.name
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="recent-person">
                                            <strong>{invitation.name}</strong>

                                            <span
                                                className={`recent-role ${
                                                    invitation.role
                                                        .toLowerCase()
                                                        .replace(/\s+/g, "-")
                                                }`}
                                            >
                                                {invitation.role}
                                            </span>
                                        </div>

                                        <span className="recent-email">
                                            {invitation.email}
                                        </span>

                                        <span
                                            className={`recent-status ${
                                                invitation.status
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")
                                            }`}
                                        >
                                            {invitation.status === "Active"
                                                ? "Active"
                                                : "Offline"}
                                        </span>
                                    </div>
                                ))}

                            </div>
                        </div>

                    </div>
                </section>

            </main>

            {showPasswordSuccess && (
                <div
                    className="password-success-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="password-success-title"
                >
                    <div className="password-success-modal">
                        <button
                            type="button"
                            className="password-success-close"
                            onClick={() => setShowPasswordSuccess(false)}
                            aria-label="Close password success message"
                        >
                            ×
                        </button>

                        <div className="password-success-icon">
                            ✓
                        </div>

                        <h2 id="password-success-title">
                            Password Successfully Generated
                        </h2>

                        <p>
                            The password for <strong>{generatedForName || "this account"}</strong> has been
                            generated successfully.
                        </p>

                        <div className="password-success-value">
                            {generatedCode}
                        </div>

                        <button
                            type="button"
                            className="password-success-button"
                            onClick={() => setShowPasswordSuccess(false)}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentManagement;
