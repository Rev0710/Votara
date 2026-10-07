import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FiCheckCircle,
    FiChevronDown,
    FiEye,
    FiKey,
    FiRefreshCw,
    FiBell,
    FiLogOut,
    FiShield,
    FiUploadCloud,
    FiUser,
    FiUserPlus,
    FiUsers,
    FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AdminUserAccessManagement.css";
import AdminTopNav from "./AdminTopNav";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const emptyCredential = {
    user: null,
    temporaryPassword: "",
    emailSent: false,
};

function getInitials(name = "") {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "U";
    return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

function formatDate(value) {
    if (!value) return "Not available";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "Not available";
    return d.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export default function AdminUserAccessManagement() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const storedAdmin = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("votaraAdminUser") || "null");
        } catch {
            return null;
        }
    }, []);

    const adminDisplayName =
        storedAdmin?.full_name || "Administrator";

    const handleAdminLogout = () => {
        localStorage.removeItem("votaraAdminToken");
        localStorage.removeItem("votaraAdminUser");
        navigate("/admin-login", { replace: true });
    };
    const [role, setRole] = useState("electoral_board");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState("");
    const [admins, setAdmins] = useState([]);
    const [ebAccounts, setEbAccounts] = useState([]);
    const [credentials, setCredentials] = useState(emptyCredential);
    const [loading, setLoading] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(true);
    const [resettingId, setResettingId] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const isAdmin = role === "admin";

    const allAccounts = useMemo(
        () => [
            ...admins.map((item) => ({ ...item, _role: "admin" })),
            ...ebAccounts.map((item) => ({ ...item, _role: "electoral_board" })),
        ].sort(
            (a, b) =>
                new Date(b.created_at || 0).getTime() -
                new Date(a.created_at || 0).getTime()
        ),
        [admins, ebAccounts]
    );

    const loadAccounts = async () => {
        setLoadingAccounts(true);
        setError("");

        try {
            const [adminResponse, ebResponse] = await Promise.all([
                api.get("/admin/admin"),
                api.get("/admin/electoral-board"),
            ]);

            setAdmins(adminResponse.data?.admins || adminResponse.data?.staff || []);
            setEbAccounts(ebResponse.data?.staff || []);
        } catch (err) {
            console.error("User & Access account loading error:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to load administrator and Electoral Board accounts."
            );
        } finally {
            setLoadingAccounts(false);
        }
    };

    useEffect(() => {
        loadAccounts();
    }, []);

    useEffect(() => {
        return () => {
            if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);
        };
    }, [profilePhotoPreview]);

    const clearForm = () => {
        setFullName("");
        setEmail("");
        setProfilePhoto(null);
        setCredentials(emptyCredential);
        setMessage("");
        setError("");

        if (profilePhotoPreview) {
            URL.revokeObjectURL(profilePhotoPreview);
            setProfilePhotoPreview("");
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRoleChange = (nextRole) => {
        setRole(nextRole);
        setCredentials(emptyCredential);
        setMessage("");
        setError("");
    };

    const handlePhoto = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError("Profile picture must be PNG, JPG/JPEG, or WEBP.");
            event.target.value = "";
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError("Profile picture must not exceed 2 MB.");
            event.target.value = "";
            return;
        }

        if (profilePhotoPreview) URL.revokeObjectURL(profilePhotoPreview);

        setProfilePhoto(file);
        setProfilePhotoPreview(URL.createObjectURL(file));
        setError("");
    };

    const fileToDataUrl = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage("");
        setError("");
        setCredentials(emptyCredential);

        if (!fullName.trim() || !email.trim()) {
            setError("Full name and email address are required.");
            return;
        }

        if (!isAdmin && !profilePhoto) {
            setError("A profile picture is required for an Electoral Board account.");
            return;
        }

        setLoading(true);

        try {
            let response;

            if (isAdmin) {
                response = await api.post("/admin/admin", {
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                });
            } else {
                const profilePhotoData = await fileToDataUrl(profilePhoto);

                response = await api.post("/admin/electoral-board", {
                    fullName: fullName.trim(),
                    email: email.trim().toLowerCase(),
                    profilePhotoData,
                    profilePhotoName: profilePhoto.name,
                    profilePhotoType: profilePhoto.type,
                });
            }

            const data = response.data || {};

            setCredentials({
                user: data.user || null,
                temporaryPassword: data.temporaryPassword || "",
                emailSent: data.emailSent === true,
            });

            setMessage(
                data.message ||
                    `${isAdmin ? "Administrator" : "Electoral Board"} account created successfully.`
            );

            setFullName("");
            setEmail("");
            setProfilePhoto(null);

            if (profilePhotoPreview) {
                URL.revokeObjectURL(profilePhotoPreview);
                setProfilePhotoPreview("");
            }

            if (fileInputRef.current) fileInputRef.current.value = "";

            await loadAccounts();
        } catch (err) {
            console.error("Account creation error:", err);
            setError(
                err.response?.data?.message ||
                    `Unable to create ${isAdmin ? "Administrator" : "Electoral Board"} account.`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleViewAccount = (account) => {
        setSelectedAccount(account);
        setError("");
    };

    const handleResetEBPassword = async (account) => {
        if (!account?.id) return;

        setResettingId(account.id);
        setError("");
        setMessage("");
        setCredentials(emptyCredential);

        try {
            const response = await api.post(
                `/admin/electoral-board/${account.id}/reset-password`
            );

            const data = response.data || {};

            setCredentials({
                user: data.user || account,
                temporaryPassword: data.temporaryPassword || "",
                emailSent: data.emailSent === true,
            });

            setMessage(
                data.message || "Electoral Board password reset successfully."
            );

            setSelectedAccount((current) =>
                current
                    ? {
                          ...current,
                          must_change_password: true,
                      }
                    : current
            );

            await loadAccounts();
        } catch (err) {
            console.error("EB password reset error:", err);
            setError(
                err.response?.data?.message ||
                    "Unable to reset Electoral Board password."
            );
        } finally {
            setResettingId(null);
        }
    };

    const accountCountLabel = `${allAccounts.length} account${
        allAccounts.length === 1 ? "" : "s"
    }`;

    const adminCountLabel = `${admins.length} Administrator account${
        admins.length === 1 ? "" : "s"
    }`;

    const ebCountLabel = `${ebAccounts.length} Electoral Board account${
        ebAccounts.length === 1 ? "" : "s"
    }`;

    const renderAccountRow = (account, adminAccount) => (
        <div className="ua-account-row" key={`${adminAccount ? "admin" : "electoral_board"}-${account.id}`}>
            <span className={`ua-avatar ${adminAccount ? "admin" : ""}`}>
                {account.profile_photo_url ? (
                    <img src={account.profile_photo_url} alt="" />
                ) : (
                    getInitials(account.full_name)
                )}
            </span>

            <div className="ua-account-info">
                <div className="ua-account-name-line">
                    <strong>{account.full_name}</strong>
                    <span className={`ua-role-badge ${adminAccount ? "admin" : "eb"}`}>
                        {adminAccount ? "Administrator" : "Electoral Board"}
                    </span>
                </div>
                <small>{account.email}</small>
                <small>Created {formatDate(account.created_at)}</small>
            </div>

            <span className={`ua-status ${account.is_active ? "active" : "inactive"}`}>
                {account.is_active ? "Active" : "Inactive"}
            </span>

            <button
                type="button"
                className="ua-view-button"
                onClick={() => handleViewAccount({ ...account, _role: adminAccount ? "admin" : "electoral_board" })}
            >
                <FiEye />
                View
            </button>

            {adminAccount ? (
                <span className="ua-admin-access-label">Full Access</span>
            ) : (
                <span className="ua-eb-access-label">Election Operations</span>
            )}
        </div>
    );

    return (
        <>
            <AdminTopNav admin={storedAdmin} onLogout={handleAdminLogout} />

            <div className="admin-user-access-page">
            <div className="admin-user-access-shell">
                <div className="admin-user-access-heading">
                    <div className="admin-user-access-number">02</div>
                    <div>
                        <h1>User &amp; Access Management</h1>
                        <p>
                            Manage administrator and Electoral Board accounts,
                            generated credentials, account status, and access recovery.
                        </p>
                    </div>
                </div>

                <div className="admin-user-access-grid">
                    <section className="ua-card ua-create-card">
                        <div className="ua-card-heading">
                            <div>
                                <span className="ua-eyebrow">USER &amp; ACCESS MANAGEMENT</span>
                                <h2>
                                    Create {isAdmin ? "Administrator" : "Electoral Board"} Account
                                </h2>
                                <p>
                                    Create a staff account directly. No invitation code or
                                    expiration is used.
                                </p>
                            </div>

                            <button
                                className="ua-icon-button"
                                type="button"
                                aria-label="Return to Admin Dashboard"
                                onClick={() => navigate("/admin-dashboard")}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="ua-role-switcher">
                            <button
                                type="button"
                                className={`ua-role-card ${isAdmin ? "selected" : ""}`}
                                onClick={() => handleRoleChange("admin")}
                            >
                                <span className="ua-role-icon">
                                    <FiShield />
                                </span>
                                <span className="ua-role-copy">
                                    <strong>Administrator</strong>
                                    <small>System access and administration</small>
                                </span>
                                {isAdmin && <span className="ua-selected">Selected</span>}
                            </button>

                            <button
                                type="button"
                                className={`ua-role-card ${!isAdmin ? "selected" : ""}`}
                                onClick={() => handleRoleChange("electoral_board")}
                            >
                                <span className="ua-role-icon">
                                    <FiUser />
                                </span>
                                <span className="ua-role-copy">
                                    <strong>Electoral Board</strong>
                                    <small>Election, candidate and voting operations</small>
                                </span>
                                {!isAdmin && <span className="ua-selected">Selected</span>}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="ua-form-row">
                                <label>
                                    Full Name
                                    <input
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="Enter full name"
                                        autoComplete="name"
                                    />
                                </label>

                                <label>
                                    Email
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter email address"
                                        type="email"
                                        autoComplete="email"
                                    />
                                </label>
                            </div>

                            <div className="ua-form-field">
                                <label>Profile Picture</label>

                                <button
                                    type="button"
                                    className={`ua-upload ${profilePhotoPreview ? "has-preview" : ""}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {profilePhotoPreview ? (
                                        <>
                                            <img
                                                src={profilePhotoPreview}
                                                alt="Selected profile"
                                            />
                                            <span>
                                                <strong>{profilePhoto.name}</strong>
                                                <small>Click to replace profile picture</small>
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <FiUploadCloud />
                                            <strong>Upload account profile picture</strong>
                                            <small>PNG, JPG or WEBP · maximum 2 MB</small>
                                        </>
                                    )}
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                                    onChange={handlePhoto}
                                    hidden
                                />
                            </div>

                            {message && (
                                <div className="ua-alert success">
                                    <FiCheckCircle />
                                    <span>{message}</span>
                                </div>
                            )}

                            {error && (
                                <div className="ua-alert error">
                                    <FiX />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="ua-form-actions">
                                <button
                                    type="button"
                                    className="ua-secondary-button"
                                    onClick={clearForm}
                                    disabled={loading}
                                >
                                    Clear
                                </button>

                                <button
                                    type="submit"
                                    className="ua-primary-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <FiRefreshCw className="ua-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <FiUserPlus />
                                            Create Account &amp; Generate Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="ua-card ua-credentials-card">
                        <div className="ua-panel-heading">
                            <div>
                                <span className="ua-eyebrow">SECURITY &amp; CREDENTIALS</span>
                                <h2>Generated Credentials</h2>
                                <p>
                                    Password is generated only when the account is created or reset.
                                </p>
                            </div>
                            <FiKey className="ua-panel-icon" />
                        </div>

                        {credentials.temporaryPassword ? (
                            <div className="ua-credential-body">
                                <div className="ua-account-preview">
                                    <span className="ua-avatar">
                                        {getInitials(credentials.user?.full_name)}
                                    </span>
                                    <div>
                                        <strong>
                                            {credentials.user?.full_name || "New Account"}
                                        </strong>
                                        <small>
                                            {credentials.user?.email || email}
                                        </small>
                                    </div>
                                </div>

                                <div className="ua-password-box">
                                    <span>TEMPORARY PASSWORD</span>
                                    <strong>{credentials.temporaryPassword}</strong>
                                </div>

                                <div className="ua-email-status">
                                    <FiCheckCircle />
                                    <span>
                                        {credentials.emailSent
                                            ? "Credentials were sent to the account email."
                                            : "Account created. Email delivery was not confirmed."}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="ua-empty-state">
                                <FiShield />
                                <strong>No credentials generated yet</strong>
                                <span>
                                    Create an account or reset a password to generate
                                    temporary credentials.
                                </span>
                            </div>
                        )}
                    </section>
                </div>

                <div className="ua-account-sections">
                    <section className="ua-card ua-accounts-card ua-role-accounts-card">
                        <div className="ua-panel-heading ua-role-panel-heading">
                            <div>
                                <span className="ua-section-label admin-label">
                                    ADMINISTRATOR ACCOUNTS
                                </span>
                                <h2>Administrator Accounts</h2>
                                <p>
                                    {adminCountLabel} with system administration access.
                                </p>
                            </div>
                            <div className="ua-panel-heading-actions">
                                <span className="ua-section-count admin-count">{admins.length}</span>
                                <button
                                    className="ua-refresh-button"
                                    type="button"
                                    onClick={loadAccounts}
                                    disabled={loadingAccounts}
                                    aria-label="Refresh administrator accounts"
                                >
                                    <FiRefreshCw className={loadingAccounts ? "ua-spin" : ""} />
                                </button>
                            </div>
                        </div>

                        <div className="ua-account-list ua-role-account-list">
                            {loadingAccounts ? (
                                <div className="ua-list-empty">Loading administrator accounts...</div>
                            ) : admins.length === 0 ? (
                                <div className="ua-list-empty">
                                    No administrator accounts found.
                                </div>
                            ) : (
                                admins.map((account) => renderAccountRow(account, true))
                            )}
                        </div>
                    </section>

                    <section className="ua-card ua-accounts-card ua-role-accounts-card">
                        <div className="ua-panel-heading ua-role-panel-heading">
                            <div>
                                <span className="ua-section-label eb-label">
                                    ELECTORAL BOARD ACCOUNTS
                                </span>
                                <h2>Electoral Board Accounts</h2>
                                <p>
                                    {ebCountLabel} for election, candidate, and voting operations.
                                </p>
                            </div>
                            <div className="ua-panel-heading-actions">
                                <span className="ua-section-count eb-count">{ebAccounts.length}</span>
                                <button
                                    className="ua-refresh-button"
                                    type="button"
                                    onClick={loadAccounts}
                                    disabled={loadingAccounts}
                                    aria-label="Refresh Electoral Board accounts"
                                >
                                    <FiRefreshCw className={loadingAccounts ? "ua-spin" : ""} />
                                </button>
                            </div>
                        </div>

                        <div className="ua-account-list ua-role-account-list">
                            {loadingAccounts ? (
                                <div className="ua-list-empty">Loading Electoral Board accounts...</div>
                            ) : ebAccounts.length === 0 ? (
                                <div className="ua-list-empty">
                                    No Electoral Board accounts found.
                                </div>
                            ) : (
                                ebAccounts.map((account) => renderAccountRow(account, false))
                            )}
                        </div>
                    </section>
                </div>
                </div>

            {selectedAccount && (
                <div
                    className="ua-modal-backdrop"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedAccount(null);
                        }
                    }}
                >
                    <div
                        className="ua-account-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="ua-account-modal-title"
                    >
                        <div className="ua-modal-heading">
                            <div>
                                <span className="ua-eyebrow">
                                    ACCOUNT DETAILS
                                </span>
                                <h2 id="ua-account-modal-title">
                                    {selectedAccount.full_name}
                                </h2>
                                <p>
                                    {selectedAccount._role === "admin"
                                        ? "Administrator account"
                                        : "Electoral Board account"}
                                </p>
                            </div>

                            <button
                                type="button"
                                className="ua-icon-button"
                                aria-label="Close account details"
                                onClick={() => setSelectedAccount(null)}
                            >
                                <FiX />
                            </button>
                        </div>

                        <div className="ua-modal-account">
                            <span
                                className={`ua-modal-avatar ${
                                    selectedAccount._role === "admin" ? "admin" : ""
                                }`}
                            >
                                {selectedAccount.profile_photo_url ? (
                                    <img
                                        src={selectedAccount.profile_photo_url}
                                        alt=""
                                    />
                                ) : (
                                    getInitials(selectedAccount.full_name)
                                )}
                            </span>

                            <div>
                                <strong>{selectedAccount.full_name}</strong>
                                <span>{selectedAccount.email}</span>
                            </div>
                        </div>

                        <div className="ua-modal-grid">
                            <div>
                                <span>Role</span>
                                <strong>
                                    {selectedAccount._role === "admin"
                                        ? "Administrator"
                                        : "Electoral Board"}
                                </strong>
                            </div>

                            <div>
                                <span>Status</span>
                                <strong>
                                    {selectedAccount.is_active ? "Active" : "Inactive"}
                                </strong>
                            </div>

                            <div>
                                <span>Created</span>
                                <strong>{formatDate(selectedAccount.created_at)}</strong>
                            </div>

                            <div>
                                <span>Password State</span>
                                <strong>
                                    {selectedAccount.must_change_password
                                        ? "Temporary password"
                                        : "Personal password"}
                                </strong>
                            </div>
                        </div>

                        {selectedAccount._role === "electoral_board" && (
                            <div className="ua-modal-security-note">
                                <FiKey />
                                <div>
                                    <strong>Temporary password security</strong>
                                    <p>
                                        The previous temporary password cannot be viewed again
                                        after it has been cleared because VOTARA stores only its
                                        secure hash. If the password was lost, generate a new
                                        temporary password below.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="ua-modal-actions">
                            <button
                                type="button"
                                className="ua-secondary-button"
                                onClick={() => setSelectedAccount(null)}
                            >
                                Close
                            </button>

                            {selectedAccount._role === "electoral_board" && (
                                <button
                                    type="button"
                                    className="ua-primary-button"
                                    disabled={resettingId === selectedAccount.id}
                                    onClick={() => handleResetEBPassword(selectedAccount)}
                                >
                                    <FiKey />
                                    {resettingId === selectedAccount.id
                                        ? "Generating..."
                                        : "Generate New Password"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}
