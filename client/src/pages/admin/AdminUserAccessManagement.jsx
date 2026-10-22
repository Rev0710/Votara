import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    FiCheckCircle,
    FiEye,
    FiSearch,
    FiAlertCircle,
    FiKey,
    FiRefreshCw,
    FiShield,
    FiUploadCloud,
    FiUser,
    FiUserPlus,
    FiUsers,
    FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./AdminUserAccessView.css";
import "./AdminDashboardLight.css";
import AdminTopNav from "./AdminTopNav";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const emptyCredential = {
    user: null,
    temporaryPassword: "",
    emailSent: false,
    emailAttempted: false,
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


    const handleAdminLogout = () => {
        localStorage.removeItem("votaraAdminToken");
        localStorage.removeItem("votaraAdminUser");
        localStorage.removeItem("votaraStaffToken");
        localStorage.removeItem("votaraStaffUser");
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
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [accountSearch, setAccountSearch] = useState("");
    const [accountRole, setAccountRole] = useState("all");
    const accountDialog = useRef(null);

    useEffect(() => {
        const dialog = accountDialog.current;
        if (selectedAccount && !dialog.open) dialog.showModal();
        else if (!selectedAccount && dialog.open) dialog.close();
    }, [selectedAccount]);

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
                emailAttempted: data.emailAttempted === true || typeof data.emailSent === "boolean",
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
        setMessage("");
    };

    const handleDeleteAccount = async (account) => {
        if (!account || !account.id || statusUpdatingId) return;
        const confirmed = window.confirm("Permanently delete this staff account?\n\nName: " + (account.full_name || "Staff account") + "\nEmail: " + account.email + "\nRole: " + (account._role === "admin" ? "Administrator" : "Electoral Board") + "\n\nThis removes the account from both staff lists and the database. Existing report history is kept, and the email can be reused after deletion succeeds.\n\nThis cannot be undone.");
        if (!confirmed) return;
        setStatusUpdatingId(account.id);
        setError("");
        setMessage("");
        try {
            const accountType = account._role === "admin" ? "admin" : "electoral-board";
            const response = await api.delete("/admin/" + accountType + "/" + account.id);
            setSelectedAccount(null);
            setCredentials((current) => current.user?.id === account.id ? emptyCredential : current);
            setMessage(response.data?.message || "Staff account permanently deleted.");
            await loadAccounts();
        } catch (err) {
            console.error("Staff account deletion error:", err);
            const apiMessage = err.response?.data?.message || "";
            setError(apiMessage.includes("Route not found") ? "The connected API has not been updated with account deletion yet. Deploy the updated backend, then try again." : apiMessage || "Unable to delete this staff account.");
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleResetPassword = async (account) => {
        if (!account?.id) return;

        setResettingId(account.id);
        setError("");
        setMessage("");
        setCredentials(emptyCredential);

        try {
            const accountType = account._role === "admin" ? "admin" : "electoral-board";
            const response = await api.post(`/admin/${accountType}/${account.id}/reset-password`);

            const data = response.data || {};

            setCredentials({
                user: data.user || account,
                temporaryPassword: data.temporaryPassword || "",
                emailSent: data.emailSent === true,
                emailAttempted: data.emailAttempted === true || typeof data.emailSent === "boolean",
            });

            setMessage(
                data.message || `${account._role === "admin" ? "Administrator" : "Electoral Board"} temporary password generated.`
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
            console.error("Staff password reset error:", err);
            setError(
                err.response?.data?.message ||
                    `Unable to generate a temporary ${account._role === "admin" ? "Administrator" : "Electoral Board"} password.`
            );
        } finally {
            setResettingId(null);
        }
    };

    const filteredAccounts = useMemo(() => {
        const query = accountSearch.trim().toLowerCase();
        return allAccounts.filter((account) =>
            (accountRole === "all" || account._role === accountRole) &&
            (!query || `${account.full_name || ""} ${account.email || ""}`.toLowerCase().includes(query))
        );
    }, [allAccounts, accountSearch, accountRole]);
    const activeCount = allAccounts.filter((account) => account.is_active).length;
    const summaries = [
        ["Total staff", allAccounts.length, FiUsers],
        ["Administrators", admins.length, FiShield],
        ["Electoral Board", ebAccounts.length, FiUser],
        ["Active accounts", activeCount, FiCheckCircle],
    ];

    return (
        <div className="user-access-view admin-polished-page">
            <a className="ux-skip" href="#users-access-content">Skip to account management</a>
            <AdminTopNav admin={storedAdmin} onLogout={handleAdminLogout} />
            <main className="ux-main" id="users-access-content" tabIndex={-1}>
                <header className="ux-heading">
                    <div><div className="ux-breadcrumb">Administration <span>/</span> People</div><h1>User &amp; Access Management</h1><p>Manage staff accounts, roles, and account recovery.</p></div>
                    <button type="button" className="ux-button ux-secondary" onClick={loadAccounts} disabled={loadingAccounts}><FiRefreshCw aria-hidden="true" />{loadingAccounts ? "Refreshing…" : "Refresh accounts"}</button>
                </header>

                <section className="ux-summary" aria-label="Staff account summary" aria-busy={loadingAccounts}>
                    {summaries.map(([label, value, Icon]) => <div key={label}><span>{label}</span><Icon aria-hidden="true" /><strong>{loadingAccounts ? "…" : value.toLocaleString()}</strong></div>)}
                </section>
                {error && <div className="ux-alert ux-alert-error" role="alert"><FiAlertCircle aria-hidden="true" /><span>{error}</span></div>}
                {message && <div className="ux-alert ux-alert-success" role="status"><FiCheckCircle aria-hidden="true" /><span>{message}</span></div>}

                <div className="ux-create-grid">
                    <section className="ux-panel ux-create" aria-labelledby="ux-create-title">
                        <div className="ux-panel-heading"><div><h2 id="ux-create-title">Create a staff account</h2><p>Choose a role, then enter the account details.</p></div><span className="ux-heading-icon"><FiUserPlus aria-hidden="true" /></span></div>
                        <form onSubmit={handleSubmit}>
                            <fieldset className="ux-role-fieldset" disabled={loading}><legend>Account role</legend><div className="ux-role-options">
                                {[
                                    ["admin", "Administrator", "System access and administration", FiShield],
                                    ["electoral_board", "Electoral Board", "Election, candidate, and voting operations", FiUser],
                                ].map(([value, label, detail, Icon]) => <label className={`ux-role-option${role === value ? " is-selected" : ""}`} key={value}><span className="ux-role-icon"><Icon aria-hidden="true" /></span><span className="ux-role-copy"><strong>{label}</strong><span>{detail}</span></span><input type="radio" name="account-role" value={value} checked={role === value} onChange={() => handleRoleChange(value)} /></label>)}
                            </div></fieldset>
                            <div className="ux-form-row">
                                <div className="ux-field"><label htmlFor="ux-name">Full name</label><input id="ux-name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Enter full name" autoComplete="name" required disabled={loading} /></div>
                                <div className="ux-field"><label htmlFor="ux-email">Email address</label><input id="ux-email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter email address" type="email" autoComplete="email" required disabled={loading} /></div>
                            </div>
                            <div className="ux-photo-field"><div className="ux-photo-label" id="ux-photo-label">Profile picture <span>{isAdmin ? "Optional" : "Required for Electoral Board"}</span></div>
                                <button type="button" className={`ux-upload${profilePhotoPreview ? " has-preview" : ""}`} onClick={() => fileInputRef.current?.click()} aria-labelledby="ux-photo-label ux-photo-action" aria-describedby="ux-photo-help" disabled={loading}>
                                    {profilePhotoPreview ? <><img src={profilePhotoPreview} alt="Selected account profile" /><span><strong id="ux-photo-action">{profilePhoto?.name}</strong><span id="ux-photo-help">Choose another picture to replace it</span></span></> : <><span className="ux-upload-icon"><FiUploadCloud aria-hidden="true" /></span><span><strong id="ux-photo-action">Choose a profile picture</strong><span id="ux-photo-help">PNG, JPG or WEBP, up to 2 MB</span></span><span className="ux-upload-browse">Browse files</span></>}
                                </button>
                                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" onChange={handlePhoto} aria-label="Account profile picture" hidden />
                            </div>
                            <div className="ux-create-footer"><span><FiKey aria-hidden="true" />A temporary password is generated when you create the account.</span><div><button type="button" className="ux-button ux-secondary" onClick={clearForm} disabled={loading}>Clear</button><button type="submit" className="ux-button ux-primary" disabled={loading}><FiUserPlus aria-hidden="true" />{loading ? "Creating…" : "Create account"}</button></div></div>
                        </form>
                    </section>

                    <aside className="ux-panel ux-credentials" aria-labelledby="ux-credentials-title" aria-live="polite">
                        <div className="ux-panel-heading"><div><h2 id="ux-credentials-title">Generated credentials</h2><p>Temporary access for a new or recovered account.</p></div><span className="ux-heading-icon"><FiKey aria-hidden="true" /></span></div>
                        {credentials.temporaryPassword ? <div className="ux-credential-body">
                            <div className="ux-credential-account"><span className="ux-avatar">{getInitials(credentials.user?.full_name)}</span><div><strong>{credentials.user?.full_name || "New account"}</strong><span>{credentials.user?.email || email}</span></div></div>
                            <div className="ux-password"><span>Temporary password</span><code>{credentials.temporaryPassword}</code></div>
                            <div className={`ux-delivery${credentials.emailSent ? " is-sent" : ""}`}>{credentials.emailSent ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}<p>{credentials.emailSent ? "Credentials were sent to the account email." : credentials.emailAttempted ? "Email delivery was not confirmed. Share these credentials with the account holder." : "Email was not sent. Share these credentials securely with the account holder."}</p></div>
                            <button type="button" className="ux-text-button" onClick={() => setCredentials(emptyCredential)}>Clear displayed credentials</button>
                        </div> : <div className="ux-credentials-empty"><span className="ux-key-illustration"><FiKey size={26} aria-hidden="true" /></span><h3>No credentials generated yet</h3><p>Create an account or generate a temporary password for an Administrator or Electoral Board account to display it here.</p></div>}
                        <div className="ux-credential-note"><FiShield aria-hidden="true" /><span>Temporary credentials appear after account creation or password recovery.</span></div>
                    </aside>
                </div>

                <section className="ux-panel ux-directory" aria-labelledby="ux-directory-title">
                    <div className="ux-directory-heading"><div><h2 id="ux-directory-title">Account directory</h2><p>View staff details, account status, and access levels.</p></div><span>{loadingAccounts ? "Loading accounts…" : `${allAccounts.length} accounts`}</span></div>
                    <div className="ux-directory-toolbar"><div className="ux-role-filters" role="group" aria-label="Filter accounts by role">{[["all", "All staff", allAccounts.length], ["admin", "Administrators", admins.length], ["electoral_board", "Electoral Board", ebAccounts.length]].map(([value, label, count]) => <button type="button" key={value} aria-pressed={accountRole === value} onClick={() => setAccountRole(value)}>{label}<span>{loadingAccounts ? "…" : count}</span></button>)}</div><div className="ux-directory-search"><FiSearch aria-hidden="true" /><input type="search" aria-label="Search staff by name or email" value={accountSearch} onChange={(event) => setAccountSearch(event.target.value)} placeholder="Search name or email" /></div></div>
                    <div className="ux-table-scroll" role="region" aria-label="Staff accounts" tabIndex={0} aria-busy={loadingAccounts}>
                        <table className="ux-table"><caption className="ux-visually-hidden">Staff accounts, roles, status, creation date, and access levels.</caption><colgroup><col className="ux-col-account" /><col className="ux-col-role" /><col className="ux-col-status" /><col className="ux-col-created" /><col className="ux-col-access" /><col className="ux-col-details" /></colgroup><thead><tr><th scope="col">Account</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Created</th><th scope="col">Access</th><th scope="col"><span className="ux-visually-hidden">Details</span></th></tr></thead><tbody>
                            {loadingAccounts ? [0, 1, 2, 3].map((row) => <tr className="ux-loading-row" key={row}>{[0, 1, 2, 3, 4, 5].map((cell) => <td key={cell}><span className="ux-skeleton" /></td>)}</tr>) : filteredAccounts.length ? filteredAccounts.map((account) => <tr key={`${account._role}-${account.id}`}>
                                <td><div className="ux-account-cell"><span className="ux-avatar">{account.profile_photo_url ? <img src={account.profile_photo_url} alt="" /> : getInitials(account.full_name)}</span><div><strong>{account.full_name || "Staff account"}</strong><span>{account.email}</span></div></div></td>
                                <td><span className={`ux-role-badge${account._role === "admin" ? " is-admin" : ""}`}>{account._role === "admin" ? "Administrator" : "Electoral Board"}</span></td>
                                <td><span className={`ux-status${account.is_active ? " is-active" : ""}`}>{account.is_active ? "Active" : "Inactive"}</span></td>
                                <td><time dateTime={account.created_at || undefined}>{formatDate(account.created_at)}</time></td>
                                <td><span className="ux-access-label">{account._role === "admin" ? "Full access" : "Election operations"}</span></td>
                                <td><button type="button" className="ux-view" onClick={() => handleViewAccount(account)} aria-label={`View ${account.full_name || "staff account"} details`}><FiEye aria-hidden="true" />View</button></td>
                            </tr>) : <tr><td colSpan={6}><div className="ux-directory-empty"><FiUsers size={28} aria-hidden="true" /><h3>{accountSearch || accountRole !== "all" ? "No matching accounts" : "No staff accounts found"}</h3><p>{accountSearch || accountRole !== "all" ? "Try another search or show all staff accounts." : "Create an account above to add a member of your team."}</p>{(accountSearch || accountRole !== "all") && <button type="button" className="ux-button ux-secondary" onClick={() => { setAccountSearch(""); setAccountRole("all"); }}>Show all staff</button>}</div></td></tr>}
                        </tbody></table>
                    </div>
                    <footer className="ux-directory-footer" aria-live="polite">{loadingAccounts ? "Loading staff accounts…" : `Showing ${filteredAccounts.length} of ${allAccounts.length} staff accounts`}</footer>
                </section>
                <footer className="ux-footer"><FiShield aria-hidden="true" /><span>Administrator accounts manage the platform. Electoral Board accounts handle election operations.</span></footer>
            </main>

            <dialog ref={accountDialog} className="ux-dialog" aria-labelledby="ux-account-modal-title" onCancel={() => setSelectedAccount(null)} onClick={(event) => { if (event.target === event.currentTarget) setSelectedAccount(null); }}>
                {selectedAccount && <div className="ux-dialog-content"><header className="ux-dialog-heading"><div><span>Account details</span><h2 id="ux-account-modal-title">{selectedAccount.full_name}</h2></div><button type="button" className="ux-close" aria-label="Close account details" onClick={() => setSelectedAccount(null)}><FiX aria-hidden="true" /></button></header>
                    <div className="ux-modal-account"><span className="ux-avatar">{selectedAccount.profile_photo_url ? <img src={selectedAccount.profile_photo_url} alt="" /> : getInitials(selectedAccount.full_name)}</span><div><strong>{selectedAccount.full_name}</strong><span>{selectedAccount.email}</span></div></div>
                    <dl className="ux-details-grid">{[
                        ["Role", selectedAccount._role === "admin" ? "Administrator" : "Electoral Board"], ["Status", selectedAccount.is_active ? "Active" : "Inactive"], ["Created", formatDate(selectedAccount.created_at)], ["Password state", selectedAccount.must_change_password ? "Temporary password" : "Personal password"],
                    ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                    <div className="ux-recovery-note"><FiKey aria-hidden="true" /><div><strong>Account recovery</strong><p>Generate a temporary password for this active account. The password will appear in the Generated credentials panel and must be changed after sign-in.</p></div></div>
                    {error && <p className="ux-modal-message ux-modal-error" role="alert">{error}</p>}
                    {message && <p className="ux-modal-message" role="status">{message}{credentials.user?.id === selectedAccount.id ? " Close these details to view the temporary credentials." : ""}</p>}
                    <footer className="ux-dialog-actions ux-account-actions"><button type="button" className="ux-button ux-secondary" onClick={() => setSelectedAccount(null)}>Close</button><button type="button" className="ux-button ux-danger" disabled={statusUpdatingId === selectedAccount.id} onClick={() => handleDeleteAccount(selectedAccount)}>{statusUpdatingId === selectedAccount.id ? "Deleting…" : "Delete account"}</button><button type="button" className="ux-button ux-primary" disabled={resettingId === selectedAccount.id || !selectedAccount.is_active || statusUpdatingId === selectedAccount.id} onClick={() => handleResetPassword(selectedAccount)}><FiKey aria-hidden="true" />{resettingId === selectedAccount.id ? "Generating…" : "Generate temporary password"}</button></footer>
                </div>}
            </dialog>
        </div>
    );
}
