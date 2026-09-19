import React, { useState } from "react";
import { FiShield, FiUserCheck, FiUpload } from "react-icons/fi";
import "./InviteTeamPopUp.css";

const InviteTeamPopUp = ({ isOpen, onClose }) => {
    const [adminConfirmed, setAdminConfirmed] = useState(false);
    const [showAdminWarning, setShowAdminWarning] = useState(false);

    const [inviteRole, setInviteRole] = useState("Electoral Board");
    const [inviteFullName, setInviteFullName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteExpiry, setInviteExpiry] = useState("7 days");
    const [invitationCode, setInvitationCode] = useState("");

    // NEW — profile picture
    const [inviteProfilePicture, setInviteProfilePicture] =
        useState(null);
    const [inviteProfilePreview, setInviteProfilePreview] =
        useState("");

    // Do not render anything when popup is closed
    if (!isOpen) {
        return null;
    }

    // Generate invitation code
    const generateInvitationCode = () => {
        const characters =
            "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        let code = "";

        for (let i = 0; i < 8; i++) {
            code += characters.charAt(
                Math.floor(
                    Math.random() * characters.length
                )
            );
        }

        setInvitationCode(code);

        return code;
    };

    // Profile picture upload
    const handleProfilePictureChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        // Only allow image files
        if (!file.type.startsWith("image/")) {
            event.target.value = "";
            return;
        }

        // Limit to 5 MB
        if (file.size > 5 * 1024 * 1024) {
            event.target.value = "";
            return;
        }

        setInviteProfilePicture(file);

        const previewUrl = URL.createObjectURL(file);
        setInviteProfilePreview(previewUrl);
    };

    // Submit
    const handleSubmit = (event) => {
        event.preventDefault();

        // Administrator requires confirmation first
        if (inviteRole === "Administrator") {
            setAdminConfirmed(false);
            setShowAdminWarning(true);
            return;
        }

        generateInvitationCode();
    };

    const closeAdminWarning = () => {
        setShowAdminWarning(false);
        setAdminConfirmed(false);
    };

    const handleAdminContinue = () => {
        if (!adminConfirmed) {
            return;
        }

        setShowAdminWarning(false);
        setAdminConfirmed(false);

        generateInvitationCode();
    };

    // Clear fields
    const handleClear = () => {
        setInviteFullName("");
        setInviteEmail("");
        setInviteExpiry("7 days");
        setInvitationCode("");
        setInviteProfilePicture(null);

        if (inviteProfilePreview) {
            URL.revokeObjectURL(inviteProfilePreview);
        }

        setInviteProfilePreview("");

        const fileInput =
            document.getElementById(
                "invite-profile-picture"
            );

        if (fileInput) {
            fileInput.value = "";
        }
    };

    // Close popup
    const handleClose = () => {
        setInvitationCode("");
        setInviteProfilePicture(null);

        if (inviteProfilePreview) {
            URL.revokeObjectURL(inviteProfilePreview);
        }

        setInviteProfilePreview("");

        onClose();
    };

    return (
        <div className="votara-invite-overlay">

            <div className="votara-invite-background-card">

                {/* =========================================
                    OUTER GLASS CARD HEADER
                ========================================= */}

                <div className="votara-invite-background-header">

                    <span className="votara-invite-background-badge">
                        <span className="votara-invite-badge-dot"></span>
                        Invite a team member
                    </span>

                    <h2>
                        Invite a team member
                    </h2>

                    <p>
                        Issue a single-use invitation code for an
                        administrator or electoral board member.
                        The code is valid for the selected expiration
                        period.
                    </p>

                </div>


                {/* =========================================
                    INNER INVITATION CARD
                ========================================= */}

                <div
                    className="votara-invite-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="invite-team-title"
                >

                    {/* HEADER */}

                    <div className="votara-invite-modal-header">

                        <h2 id="invite-team-title">
                            New Invitation
                        </h2>

                        <button
                            type="button"
                            className="votara-invite-close"
                            onClick={handleClose}
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>


                    <form onSubmit={handleSubmit}>

                        {/* ROLE */}

                        <div className="votara-invite-role-grid">

                            <button
                                type="button"
                                className={`votara-invite-role-card ${
                                    inviteRole === "Administrator"
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setInviteRole(
                                        "Administrator"
                                    )
                                }
                            >

                                <span className="votara-invite-role-icon">
                                    <FiShield size={17} />
                                </span>

                                <span className="votara-invite-role-copy">

                                    <strong>
                                        Administrator
                                    </strong>

                                    <small>
                                        Full system access, settings,
                                        users and election management.
                                    </small>

                                </span>

                                <span className="votara-invite-role-radio"></span>

                            </button>


                            <button
                                type="button"
                                className={`votara-invite-role-card ${
                                    inviteRole === "Electoral Board"
                                        ? "selected"
                                        : ""
                                }`}
                                onClick={() =>
                                    setInviteRole(
                                        "Electoral Board"
                                    )
                                }
                            >

                                <span className="votara-invite-role-icon">
                                    <FiUserCheck size={17} />
                                </span>

                                <span className="votara-invite-role-copy">

                                    <strong>
                                        Electoral Board
                                    </strong>

                                    <small>
                                        Manage elections, candidates
                                        and voting operations.
                                    </small>

                                </span>

                                <span className="votara-invite-role-radio"></span>

                            </button>

                        </div>


                        {/* FIELDS */}

                        <div className="votara-invite-fields">

                            <label>
                                Fullname

                                <input
                                    type="text"
                                    value={inviteFullName}
                                    onChange={(event) =>
                                        setInviteFullName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter full name"
                                />
                            </label>


                            <label>
                                Email

                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(event) =>
                                        setInviteEmail(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter email address"
                                />
                            </label>


                            <div className="votara-invite-select-row">

                                <label>
                                    Code Expires

                                    <select
                                        value={inviteExpiry}
                                        onChange={(event) =>
                                            setInviteExpiry(
                                                event.target.value
                                            )
                                        }
                                    >
                                        <option value="7 days">
                                            7 days
                                        </option>

                                        <option value="3 days">
                                            3 days
                                        </option>

                                        <option value="24 hours">
                                            24 hours
                                        </option>

                                        <option value="Never">
                                            Never
                                        </option>
                                    </select>
                                </label>

                            </div>


                            {/* =====================================
                                PROFILE PICTURE
                            ===================================== */}

                            <div className="votara-invite-profile-upload">

                                <label className="votara-invite-profile-upload-label">
                                    Upload Profile (Optional)

                                    <label
                                        htmlFor="invite-profile-picture"
                                        className="votara-invite-profile-upload-box"
                                    >

                                        {inviteProfilePreview ? (
                                            <>
                                                <img
                                                    src={
                                                        inviteProfilePreview
                                                    }
                                                    alt="Profile preview"
                                                    style={{
                                                        width: "42px",
                                                        height: "42px",
                                                        objectFit: "cover",
                                                        borderRadius:
                                                            "50%",
                                                    }}
                                                />

                                                <span>
                                                    {inviteProfilePicture?.name ||
                                                        "Profile picture selected"}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <FiUpload
                                                    size={18}
                                                />

                                                <span>
                                                    Upload Account Profile picture
                                                </span>
                                            </>
                                        )}

                                    </label>

                                    <input
                                        id="invite-profile-picture"
                                        className="votara-invite-profile-upload-input"
                                        type="file"
                                        accept="image/png,image/jpeg,image/jpg,image/webp"
                                        onChange={
                                            handleProfilePictureChange
                                        }
                                    />
                                </label>

                            </div>


                            {invitationCode && (
                                <div className="votara-invitation-code">

                                    <span>
                                        Invitation Code
                                    </span>

                                    <strong>
                                        {invitationCode}
                                    </strong>

                                </div>
                            )}


                            <div className="votara-invite-actions">

                                <button
                                    type="button"
                                    className="votara-invite-clear"
                                    onClick={handleClear}
                                >
                                    Clear
                                </button>

                                <button
                                    type="submit"
                                    className="votara-invite-generate"
                                >
                                    Generate Invitation Code
                                </button>

                            </div>

                        </div>

                    </form>

                </div>

            </div>


            {/* =========================================
                ADMIN WARNING
            ========================================= */}

            {showAdminWarning && (
                <div className="votara-admin-warning-overlay">

                    <div className="votara-admin-warning-card">

                        <div className="votara-admin-warning-icon">
                            <span><img src="./src/images/warning.png" alt="votara-admin-warning-icon" /></span>
                        </div>

                        <div className="votara-admin-warning-content">

                            <h3>
                                Administrators can change election
                                results infrastructure
                            </h3>

                            <p>
                                This role can edit any election, alter
                                system configuration, and revoke other
                                admins. Only issue it to staff who need
                                platform-wide control.
                            </p>

                            <label className="votara-admin-warning-confirm">

                                <input
                                    type="checkbox"
                                    checked={adminConfirmed}
                                    onChange={(event) =>
                                        setAdminConfirmed(
                                            event.target.checked
                                        )
                                    }
                                />

                                <span>
                                    I confirm this person requires
                                    administrator access.
                                </span>

                            </label>

                            <div className="votara-admin-warning-actions">

                                <button
                                    type="button"
                                    className="votara-admin-warning-cancel"
                                    onClick={closeAdminWarning}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="votara-admin-warning-continue"
                                    onClick={handleAdminContinue}
                                    disabled={!adminConfirmed}
                                >
                                    Continue
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
};

export default InviteTeamPopUp;
