import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiCheckCircle, FiEye, FiEyeOff, FiMail, FiShield, FiUpload, FiUser, FiX, FiRefreshCw } from "react-icons/fi";
import api from "../../services/api";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const maskPassword = (value) => {
    if (!value) return "Not available";
    return "•".repeat(Math.min(Math.max(value.length, 8), 12));
};

const InviteTeamPopUp = ({ isOpen, onClose }) => {
    const fileInputRef = useRef(null);

    const [role, setRole] = useState("electoral_board");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePreview, setProfilePreview] = useState("");

    const [accounts, setAccounts] = useState([]);
    const [createdCredentials, setCreatedCredentials] = useState(null);
    const [showPassword, setShowPassword] = useState(true);

    const [loading, setLoading] = useState(false);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [resettingId, setResettingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isAdmin = role === "admin";

    const title = useMemo(
        () => (isAdmin ? "Create Administrator Account" : "Create Electoral Board Account"),
        [isAdmin]
    );

    const loadAccounts = async () => {
        try {
            setLoadingAccounts(true);

            const response = await api.get("/admin/electoral-board");
            setAccounts(response?.data?.staff || []);
        } catch (requestError) {
            console.error("Unable to load Electoral Board accounts:", requestError);
        } finally {
            setLoadingAccounts(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        loadAccounts();
    }, [isOpen]);

    useEffect(() => {
        return () => {
            if (profilePreview) {
                URL.revokeObjectURL(profilePreview);
            }
        };
    }, [profilePreview]);

    if (!isOpen) {
        return null;
    }

    const handlePhotoChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please select an image file.");
            return;
        }

        if (file.size > MAX_IMAGE_SIZE) {
            setError("Profile picture must be 2 MB or smaller.");
            return;
        }

        try {
            const dataUrl = await readFileAsDataUrl(file);

            if (profilePreview) {
                URL.revokeObjectURL(profilePreview);
            }

            setProfilePhoto({
                name: file.name,
                type: file.type,
                dataUrl,
            });
            setProfilePreview(URL.createObjectURL(file));
            setError("");
        } catch (photoError) {
            console.error(photoError);
            setError("Unable to read the profile picture.");
        }
    };

    const resetForm = () => {
        setFullName("");
        setEmail("");
        setRole("electoral_board");
        setProfilePhoto(null);

        if (profilePreview) {
            URL.revokeObjectURL(profilePreview);
        }

        setProfilePreview("");
        setError("");
        setSuccess("");
    };

    const handleCreateAccount = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");

        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();

        if (!cleanName) {
            setError("Full name is required.");
            return;
        }

        if (!cleanEmail) {
            setError("Email address is required.");
            return;
        }

        if (!profilePhoto) {
            setError("Please upload the account profile picture.");
            return;
        }

        try {
            setLoading(true);

            const endpoint = isAdmin
                ? "/admin/admin"
                : "/admin/electoral-board";

            const response = await api.post(endpoint, {
                fullName: cleanName,
                email: cleanEmail,
                profilePhotoData: profilePhoto.dataUrl,
                profilePhotoName: profilePhoto.name,
                profilePhotoType: profilePhoto.type,
            });

            const createdUser = response?.data?.user || {};
            const generatedPassword = response?.data?.temporaryPassword || "";

            setCreatedCredentials({
                user: createdUser,
                password: generatedPassword,
                emailSent: response?.data?.emailSent !== false,
            });

            setShowPassword(true);
            setSuccess(
                isAdmin
                    ? "Administrator account created successfully."
                    : "Electoral Board account created successfully."
            );

            if (!isAdmin) {
                await loadAccounts();
            }

            setFullName("");
            setEmail("");
            setProfilePhoto(null);

            if (profilePreview) {
                URL.revokeObjectURL(profilePreview);
            }

            setProfilePreview("");

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (requestError) {
            console.error("Create account error:", requestError);

            setError(
                requestError?.response?.data?.message ||
                "Unable to create the account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (account) => {
        if (!account?.id) return;

        try {
            setResettingId(account.id);
            setError("");
            setSuccess("");

            const response = await api.post(
                `/admin/electoral-board/${account.id}/reset-password`
            );

            setCreatedCredentials({
                user: response?.data?.user || account,
                password: response?.data?.temporaryPassword || "",
                emailSent: response?.data?.emailSent !== false,
            });

            setShowPassword(true);
            setSuccess("A new temporary password was generated for this account.");
        } catch (requestError) {
            console.error("Reset EB password error:", requestError);
            setError(
                requestError?.response?.data?.message ||
                "Unable to reset the password."
            );
        } finally {
            setResettingId(null);
        }
    };

    const handleCopyPassword = async () => {
        if (!createdCredentials?.password) return;

        try {
            await navigator.clipboard.writeText(
                createdCredentials.password
            );
            setSuccess("Temporary password copied to the clipboard.");
        } catch {
            setError("Unable to copy the password automatically.");
        }
    };

    const handleClose = () => {
        resetForm();
        setCreatedCredentials(null);
        onClose?.();
    };

    return (
        <div
            className="votara-account-modal-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    handleClose();
                }
            }}
        >
            <div className="votara-account-modal">
                <div className="votara-account-modal-header">
                    <div>
                        <span className="votara-account-kicker">
                            USER &amp; ACCESS MANAGEMENT
                        </span>
                        <h2>{title}</h2>
                        <p>
                            Create a staff account directly. No invitation code or expiration is used.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="votara-account-close"
                        onClick={handleClose}
                        aria-label="Close"
                    >
                        <FiX size={20} />
                    </button>
                </div>

                <div className="votara-account-modal-body">
                    <form
                        className="votara-account-create-card"
                        onSubmit={handleCreateAccount}
                    >
                        <div className="votara-account-card-title">
                            <div>
                                <span>New Account</span>
                                <small>Enter the account information below.</small>
                            </div>
                        </div>

                        <div className="votara-account-role-grid">
                            <button
                                type="button"
                                className={`votara-role-card ${
                                    role === "admin" ? "selected" : ""
                                }`}
                                onClick={() => setRole("admin")}
                            >
                                <span className="votara-role-icon">
                                    <FiShield />
                                </span>
                                <span>
                                    <strong>Administrator</strong>
                                    <small>System access and administration</small>
                                </span>
                            </button>

                            <button
                                type="button"
                                className={`votara-role-card ${
                                    role === "electoral_board" ? "selected" : ""
                                }`}
                                onClick={() => setRole("electoral_board")}
                            >
                                <span className="votara-role-icon">
                                    <FiUser />
                                </span>
                                <span>
                                    <strong>Electoral Board</strong>
                                    <small>Election, candidate and voting operations</small>
                                </span>
                            </button>
                        </div>

                        <label className="votara-field-label">
                            Full Name
                            <input
                                type="text"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                placeholder="Enter full name"
                                autoComplete="name"
                            />
                        </label>

                        <label className="votara-field-label">
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="Enter email address"
                                autoComplete="email"
                            />
                        </label>

                        <div className="votara-field-label">
                            Profile Picture
                            <button
                                type="button"
                                className={`votara-photo-upload ${
                                    profilePreview ? "has-image" : ""
                                }`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {profilePreview ? (
                                    <img
                                        src={profilePreview}
                                        alt="Profile preview"
                                    />
                                ) : (
                                    <>
                                        <FiUpload size={24} />
                                        <span>Upload account profile picture</span>
                                        <small>PNG, JPG or WEBP · maximum 2 MB</small>
                                    </>
                                )}
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handlePhotoChange}
                                hidden
                            />
                        </div>

                        {error && (
                            <div className="votara-account-message error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="votara-account-message success">
                                <FiCheckCircle />
                                <span>{success}</span>
                            </div>
                        )}

                        <div className="votara-account-actions">
                            <button
                                type="button"
                                className="votara-secondary-button"
                                onClick={resetForm}
                                disabled={loading}
                            >
                                Clear
                            </button>

                            <button
                                type="submit"
                                className="votara-primary-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FiRefreshCw className="votara-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account & Generate Password"
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="votara-account-side">
                        <section className="votara-credentials-card">
                            <div className="votara-account-card-title">
                                <div>
                                    <span>Generated Credentials</span>
                                    <small>Password is generated only when the account is created or reset.</small>
                                </div>
                            </div>

                            {createdCredentials ? (
                                <div className="votara-credentials-content">
                                    <div className="votara-credential-avatar">
                                        {createdCredentials.user?.profile_photo_url ? (
                                            <img
                                                src={createdCredentials.user.profile_photo_url}
                                                alt={createdCredentials.user.full_name || "Account"}
                                            />
                                        ) : (
                                            <FiUser />
                                        )}
                                    </div>

                                    <strong>
                                        {createdCredentials.user?.full_name || "Account"}
                                    </strong>
                                    <span>
                                        {createdCredentials.user?.email || "—"}
                                    </span>

                                    <div className="votara-password-box">
                                        <div>
                                            <small>Temporary Password</small>
                                            <strong>
                                                {showPassword
                                                    ? createdCredentials.password || "Not available"
                                                    : maskPassword(createdCredentials.password)}
                                            </strong>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((value) => !value)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>

                                    <div className="votara-credential-actions">
                                        <button
                                            type="button"
                                            onClick={handleCopyPassword}
                                            disabled={!createdCredentials.password}
                                        >
                                            Copy Password
                                        </button>
                                    </div>

                                    <div className="votara-email-status">
                                        <FiMail />
                                        {createdCredentials.emailSent
                                            ? "Credentials email sent to the account email."
                                            : "Email could not be confirmed. Use the displayed temporary password."}
                                    </div>
                                </div>
                            ) : (
                                <div className="votara-empty-credentials">
                                    <FiShield size={30} />
                                    <strong>No credentials generated yet</strong>
                                    <span>Create an account to generate its temporary password.</span>
                                </div>
                            )}
                        </section>

                        <section className="votara-recent-card">
                            <div className="votara-account-card-title">
                                <div>
                                    <span>Recently Added EB Accounts</span>
                                    <small>Current Electoral Board accounts from VOTARA.</small>
                                </div>
                            </div>

                            {loadingAccounts ? (
                                <div className="votara-recent-loading">
                                    <FiRefreshCw className="votara-spin" />
                                    Loading accounts...
                                </div>
                            ) : accounts.length === 0 ? (
                                <div className="votara-recent-empty">
                                    No Electoral Board accounts yet.
                                </div>
                            ) : (
                                <div className="votara-recent-list">
                                    {accounts.slice(0, 8).map((account) => (
                                        <div className="votara-recent-row" key={account.id}>
                                            <div className="votara-recent-avatar">
                                                {account.profile_photo_url ? (
                                                    <img
                                                        src={account.profile_photo_url}
                                                        alt={account.full_name}
                                                    />
                                                ) : (
                                                    account.full_name?.charAt(0)?.toUpperCase() || "E"
                                                )}
                                            </div>

                                            <div className="votara-recent-info">
                                                <strong>{account.full_name}</strong>
                                                <span>{account.email}</span>
                                                <small>Created {formatDate(account.created_at)}</small>
                                            </div>

                                            <div className="votara-recent-actions">
                                                <span
                                                    className={`votara-status ${
                                                        account.is_active ? "active" : "inactive"
                                                    }`}
                                                >
                                                    {account.is_active ? "Active" : "Inactive"}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => handleResetPassword(account)}
                                                    disabled={resettingId === account.id}
                                                    title="Generate a new temporary password"
                                                >
                                                    {resettingId === account.id
                                                        ? "Resetting..."
                                                        : "Reset Password"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            <style>{`
                .votara-account-modal-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 3000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    background: rgba(3, 7, 18, 0.72);
                    backdrop-filter: blur(8px);
                }

                .votara-account-modal {
                    width: min(1120px, 100%);
                    max-height: calc(100vh - 48px);
                    overflow: auto;
                    border: 1px solid rgba(148, 163, 184, 0.22);
                    border-radius: 22px;
                    background: #11182b;
                    color: #f8fafc;
                    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.45);
                }

                .votara-account-modal-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 24px;
                    padding: 28px 30px 22px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
                }

                .votara-account-kicker {
                    color: #4d8dff;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.14em;
                }

                .votara-account-modal-header h2 {
                    margin: 6px 0 6px;
                    font-size: 25px;
                }

                .votara-account-modal-header p {
                    margin: 0;
                    color: #94a3b8;
                    font-size: 13px;
                }

                .votara-account-close {
                    width: 38px;
                    height: 38px;
                    display: grid;
                    place-items: center;
                    border: 1px solid rgba(148, 163, 184, 0.2);
                    border-radius: 10px;
                    background: rgba(255,255,255,0.04);
                    color: #cbd5e1;
                    cursor: pointer;
                }

                .votara-account-modal-body {
                    display: grid;
                    grid-template-columns: minmax(0, 1.05fr) minmax(380px, 0.95fr);
                    gap: 18px;
                    padding: 20px;
                }

                .votara-account-create-card,
                .votara-credentials-card,
                .votara-recent-card {
                    border: 1px solid rgba(148, 163, 184, 0.18);
                    border-radius: 16px;
                    background: #151d33;
                }

                .votara-account-create-card {
                    padding: 22px;
                }

                .votara-account-card-title {
                    padding: 18px 20px;
                    border-bottom: 1px solid rgba(148, 163, 184, 0.14);
                }

                .votara-account-card-title span {
                    display: block;
                    font-size: 17px;
                    font-weight: 700;
                }

                .votara-account-card-title small {
                    display: block;
                    margin-top: 5px;
                    color: #8290a8;
                    font-size: 11px;
                }

                .votara-account-role-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    margin: 20px 0;
                }

                .votara-role-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 82px;
                    padding: 14px;
                    border: 1px solid rgba(148, 163, 184, 0.24);
                    border-radius: 10px;
                    background: #171f36;
                    color: #f8fafc;
                    text-align: left;
                    cursor: pointer;
                }

                .votara-role-card.selected {
                    border-color: #266eff;
                    background: rgba(38, 110, 255, 0.13);
                    box-shadow: inset 0 0 0 1px rgba(38,110,255,.2);
                }

                .votara-role-icon {
                    width: 36px;
                    height: 36px;
                    display: grid;
                    place-items: center;
                    flex: 0 0 36px;
                    border-radius: 8px;
                    background: rgba(38, 110, 255, 0.14);
                    color: #5b91ff;
                }

                .votara-role-card strong,
                .votara-role-card small {
                    display: block;
                }

                .votara-role-card small {
                    margin-top: 4px;
                    color: #8b98ad;
                    font-size: 10px;
                }

                .votara-field-label {
                    display: block;
                    margin-top: 16px;
                    color: #cbd5e1;
                    font-size: 12px;
                    font-weight: 600;
                }

                .votara-field-label input {
                    width: 100%;
                    margin-top: 8px;
                    padding: 12px 13px;
                    border: 1px solid rgba(148, 163, 184, 0.28);
                    border-radius: 8px;
                    outline: none;
                    box-sizing: border-box;
                    background: #11182b;
                    color: #f8fafc;
                }

                .votara-photo-upload {
                    width: 100%;
                    min-height: 150px;
                    margin-top: 8px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    border: 1px dashed rgba(148, 163, 184, 0.35);
                    border-radius: 10px;
                    background: #11182b;
                    color: #a7b2c5;
                    cursor: pointer;
                    overflow: hidden;
                }

                .votara-photo-upload small {
                    color: #68778f;
                    font-size: 10px;
                }

                .votara-photo-upload.has-image {
                    padding: 8px;
                }

                .votara-photo-upload img {
                    width: 130px;
                    height: 130px;
                    object-fit: cover;
                    border-radius: 12px;
                }

                .votara-account-message {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 16px;
                    padding: 11px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                }

                .votara-account-message.error {
                    background: rgba(220, 38, 38, 0.12);
                    color: #fca5a5;
                }

                .votara-account-message.success {
                    background: rgba(22, 163, 74, 0.12);
                    color: #86efac;
                }

                .votara-account-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 22px;
                }

                .votara-secondary-button,
                .votara-primary-button,
                .votara-credential-actions button,
                .votara-recent-actions button {
                    border: 0;
                    border-radius: 8px;
                    padding: 11px 15px;
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                }

                .votara-secondary-button {
                    border: 1px solid rgba(148, 163, 184, 0.22);
                    background: transparent;
                    color: #cbd5e1;
                }

                .votara-primary-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #266eff;
                    color: white;
                }

                .votara-primary-button:disabled,
                .votara-secondary-button:disabled,
                .votara-recent-actions button:disabled {
                    opacity: .55;
                    cursor: not-allowed;
                }

                .votara-account-side {
                    display: grid;
                    gap: 18px;
                }

                .votara-credentials-card,
                .votara-recent-card {
                    overflow: hidden;
                }

                .votara-credentials-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 22px;
                    text-align: center;
                }

                .votara-credential-avatar,
                .votara-recent-avatar {
                    display: grid;
                    place-items: center;
                    overflow: hidden;
                    background: #e9e5ff;
                    color: #6d4aff;
                    font-weight: 800;
                }

                .votara-credential-avatar {
                    width: 70px;
                    height: 70px;
                    border-radius: 50%;
                    margin-bottom: 10px;
                }

                .votara-credential-avatar img,
                .votara-recent-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .votara-credentials-content > strong {
                    font-size: 16px;
                }

                .votara-credentials-content > span {
                    margin-top: 4px;
                    color: #8b98ad;
                    font-size: 11px;
                }

                .votara-password-box {
                    width: 100%;
                    margin-top: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 13px;
                    box-sizing: border-box;
                    border: 1px solid rgba(38, 110, 255, 0.28);
                    border-radius: 10px;
                    background: rgba(38, 110, 255, 0.08);
                    text-align: left;
                }

                .votara-password-box small,
                .votara-password-box strong {
                    display: block;
                }

                .votara-password-box small {
                    color: #8090a8;
                    font-size: 10px;
                }

                .votara-password-box strong {
                    margin-top: 5px;
                    color: #fff;
                    font-family: monospace;
                    letter-spacing: .08em;
                }

                .votara-password-box button {
                    border: 0;
                    background: transparent;
                    color: #70a0ff;
                    cursor: pointer;
                }

                .votara-credential-actions {
                    margin-top: 12px;
                }

                .votara-credential-actions button {
                    background: #266eff;
                    color: white;
                }

                .votara-email-status {
                    display: flex;
                    align-items: center;
                    gap: 7px;
                    margin-top: 12px;
                    color: #8fa0b8;
                    font-size: 10px;
                }

                .votara-empty-credentials,
                .votara-recent-loading,
                .votara-recent-empty {
                    min-height: 170px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-direction: column;
                    gap: 8px;
                    padding: 20px;
                    color: #8290a8;
                    text-align: center;
                    font-size: 11px;
                }

                .votara-empty-credentials strong {
                    color: #cbd5e1;
                }

                .votara-recent-list {
                    max-height: 360px;
                    overflow: auto;
                }

                .votara-recent-row {
                    display: grid;
                    grid-template-columns: 38px minmax(0, 1fr) auto;
                    gap: 11px;
                    align-items: center;
                    padding: 13px 18px;
                    border-top: 1px solid rgba(148, 163, 184, 0.10);
                }

                .votara-recent-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 50%;
                    font-size: 13px;
                }

                .votara-recent-info {
                    min-width: 0;
                }

                .votara-recent-info strong,
                .votara-recent-info span,
                .votara-recent-info small {
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .votara-recent-info strong {
                    font-size: 12px;
                }

                .votara-recent-info span {
                    margin-top: 2px;
                    color: #8b98ad;
                    font-size: 10px;
                }

                .votara-recent-info small {
                    margin-top: 3px;
                    color: #5f6f88;
                    font-size: 9px;
                }

                .votara-recent-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .votara-status {
                    padding: 5px 8px;
                    border-radius: 5px;
                    font-size: 9px;
                    font-weight: 700;
                }

                .votara-status.active {
                    background: rgba(22, 163, 74, .16);
                    color: #4ade80;
                }

                .votara-status.inactive {
                    background: rgba(148, 163, 184, .12);
                    color: #94a3b8;
                }

                .votara-recent-actions button {
                    padding: 7px 9px;
                    background: rgba(38, 110, 255, .12);
                    color: #72a0ff;
                }

                .votara-spin {
                    animation: votara-spin 1s linear infinite;
                }

                @keyframes votara-spin {
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 900px) {
                    .votara-account-modal-body {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 600px) {
                    .votara-account-modal-overlay {
                        padding: 10px;
                    }

                    .votara-account-role-grid {
                        grid-template-columns: 1fr;
                    }

                    .votara-recent-row {
                        grid-template-columns: 38px 1fr;
                    }

                    .votara-recent-actions {
                        grid-column: 2;
                    }
                }
            `}</style>
        </div>
    );
};

export default InviteTeamPopUp;
