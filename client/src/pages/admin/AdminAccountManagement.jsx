import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FiArrowLeft,
    FiSearch,
    FiRefreshCw,
    FiPlus,
    FiUsers,
    FiMail,
    FiCalendar,
    FiMoreVertical,
    FiCheckCircle,
    FiXCircle,
    FiShield,
    FiEye,
    FiEyeOff,
    FiCopy,
} from "react-icons/fi";

import api from "../../services/api";

// =========================================================
// ADMIN ACCOUNT MANAGEMENT
// =========================================================

function AdminAccountManagement() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);
    const [admins, setAdmins] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("all");

    const [openMenu, setOpenMenu] =
        useState(null);

    // =====================================================
    // CREATE ADMIN MODAL
    // =====================================================

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [createForm, setCreateForm] = useState({
        fullName: "",
        email: "",
    });

    const [creatingAccount, setCreatingAccount] =
        useState(false);

    const [createError, setCreateError] =
        useState("");

    // =====================================================
    // CREATED ACCOUNT / TEMPORARY PASSWORD
    // =====================================================

    const [createdAccount, setCreatedAccount] =
        useState(null);

    const [temporaryPassword, setTemporaryPassword] =
        useState("");

    const [showTemporaryPassword, setShowTemporaryPassword] =
        useState(false);

    const [copyMessage, setCopyMessage] =
        useState("");

    // =====================================================
    // SESSION CHECK
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
                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            setAdmin(user);

            loadAdminAccounts();
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
    // LOAD ADMIN ACCOUNTS
    // =====================================================

    const loadAdminAccounts = async () => {
        setLoading(true);
        setError("");

        try {
            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                );

            if (!token) {
                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            /*
             * This endpoint will return all Admin accounts.
             * We will add the backend endpoint next if it
             * does not already exist.
             */

            const response =
                await api.get(
                    "/admin/admin",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            if (
                !response.data?.success
            ) {
                throw new Error(
                    response.data?.message ||
                        "Unable to load Admin accounts."
                );
            }

            setAdmins(
                response.data.admins ||
                    []
            );
        } catch (error) {
            console.error(
                "Admin accounts error:",
                error
            );

            if (
                error.response?.status ===
                401
            ) {
                localStorage.removeItem(
                    "votaraStaffToken"
                );

                localStorage.removeItem(
                    "votaraStaffUser"
                );

                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            setError(
                error.response?.data
                    ?.message ||
                    error.message ||
                    "Unable to load Admin accounts."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // OPEN CREATE MODAL
    // =====================================================

    const openCreateModal = () => {
        setCreateForm({
            fullName: "",
            email: "",
        });

        setCreateError("");

        setCreatedAccount(null);
        setTemporaryPassword("");
        setShowTemporaryPassword(false);
        setCopyMessage("");

        setShowCreateModal(true);
    };

    // =====================================================
    // CLOSE CREATE MODAL
    // =====================================================

    const closeCreateModal = () => {
        setShowCreateModal(false);

        setCreateForm({
            fullName: "",
            email: "",
        });

        setCreateError("");
        setCreatedAccount(null);
    };

    // =====================================================
    // FORM INPUT
    // =====================================================

    const handleInput = (event) => {
        const {
            name,
            value,
        } = event.target;

        setCreateForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );

        setCreateError("");
    };

    // =====================================================
    // CREATE ADMIN ACCOUNT
    // =====================================================

    const handleCreateAccount = async (
        event
    ) => {
        event.preventDefault();

        setCreateError("");

        if (
            !createForm.fullName.trim()
        ) {
            setCreateError(
                "Full name is required."
            );

            return;
        }

        if (
            !createForm.email.trim()
        ) {
            setCreateError(
                "Email address is required."
            );

            return;
        }

        try {
            setCreatingAccount(true);

            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                );

            if (!token) {
                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            const response =
                await api.post(
                    "/admin/admin",
                    {
                        fullName:
                            createForm.fullName.trim(),

                        email:
                            createForm.email
                                .trim()
                                .toLowerCase(),
                    },
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            if (
                !response.data?.success
            ) {
                throw new Error(
                    response.data?.message ||
                        "Unable to create Admin account."
                );
            }

            setCreatedAccount(
                response.data.user
            );

            setTemporaryPassword(
                response.data
                    ?.temporaryPassword ||
                    ""
            );

            setShowTemporaryPassword(
                false
            );

            setCopyMessage("");

            await loadAdminAccounts();
        } catch (error) {
            console.error(
                "Create Admin account error:",
                error
            );

            if (
                error.response?.status ===
                401
            ) {
                localStorage.removeItem(
                    "votaraStaffToken"
                );

                localStorage.removeItem(
                    "votaraStaffUser"
                );

                navigate("/admin-login", {
                    replace: true,
                });

                return;
            }

            setCreateError(
                error.response?.data
                    ?.message ||
                    error.message ||
                    "Unable to create Admin account."
            );
        } finally {
            setCreatingAccount(false);
        }
    };

    // =====================================================
    // COPY TEMPORARY PASSWORD
    // =====================================================

    const copyTemporaryPassword =
        async () => {
            if (!temporaryPassword) {
                return;
            }

            try {
                await navigator.clipboard.writeText(
                    temporaryPassword
                );

                setCopyMessage(
                    "Temporary password copied."
                );

                setTimeout(() => {
                    setCopyMessage("");
                }, 2500);
            } catch (error) {
                console.error(
                    "Copy password error:",
                    error
                );

                setCopyMessage(
                    "Unable to copy password."
                );
            }
        };

    // =====================================================
    // FILTER ADMINS
    // =====================================================

    const filteredAdmins = useMemo(() => {
        const searchValue =
            search
                .trim()
                .toLowerCase();

        return admins.filter(
            (member) => {
                const matchesSearch =
                    !searchValue ||
                    member.full_name
                        ?.toLowerCase()
                        .includes(
                            searchValue
                        ) ||
                    member.email
                        ?.toLowerCase()
                        .includes(
                            searchValue
                        );

                const matchesStatus =
                    statusFilter ===
                        "all" ||
                    (statusFilter ===
                        "active" &&
                        member.is_active) ||
                    (statusFilter ===
                        "inactive" &&
                        !member.is_active);

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );
    }, [
        admins,
        search,
        statusFilter,
    ]);

    // =====================================================
    // FORMAT DATE
    // =====================================================

    const formatDate = (
        value
    ) => {
        if (!value) {
            return "Never";
        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return date.toLocaleString();
    };

    // =====================================================
    // LOADING
    // =====================================================

    if (!admin) {
        return (
            <div
                style={
                    styles.loadingPage
                }
            >
                <FiRefreshCw
                    size={28}
                    style={{
                        animation:
                            "spin 1s linear infinite",
                    }}
                />

                <p>
                    Loading Admin Account
                    Management...
                </p>
            </div>
        );
    }

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div style={styles.page}>
            {/* =================================================
                HEADER
            ================================================= */}

            <header style={styles.header}>
                <div
                    style={
                        styles.headerLeft
                    }
                >
                    <button
                        style={
                            styles.backButton
                        }
                        onClick={() =>
                            navigate(
                                "/admin-dashboard"
                            )
                        }
                    >
                        <FiArrowLeft
                            size={18}
                        />

                        Back to Dashboard
                    </button>

                    <div>
                        <span
                            style={
                                styles.pageLabel
                            }
                        >
                            USER & ACCESS
                            MANAGEMENT
                        </span>

                        <h1
                            style={
                                styles.title
                            }
                        >
                            Admin Accounts
                        </h1>

                        <p
                            style={
                                styles.subtitle
                            }
                        >
                            Create and manage
                            administrator accounts.
                        </p>
                    </div>
                </div>

                <button
                    style={
                        styles.createButton
                    }
                    onClick={
                        openCreateModal
                    }
                >
                    <FiPlus size={18} />

                    Create Admin Account
                </button>
            </header>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <section
                style={
                    styles.summaryGrid
                }
            >
                <SummaryCard
                    icon={FiUsers}
                    label="Total Admins"
                    value={admins.length}
                />

                <SummaryCard
                    icon={FiCheckCircle}
                    label="Active Admins"
                    value={
                        admins.filter(
                            (item) =>
                                item.is_active
                        ).length
                    }
                />

                <SummaryCard
                    icon={FiXCircle}
                    label="Inactive Admins"
                    value={
                        admins.filter(
                            (item) =>
                                !item.is_active
                        ).length
                    }
                />

                <SummaryCard
                    icon={FiShield}
                    label="Access Level"
                    value="Administrator"
                />
            </section>

            {/* =================================================
                CONTENT
            ================================================= */}

            <section
                style={
                    styles.contentCard
                }
            >
                <div
                    style={
                        styles.cardHeader
                    }
                >
                    <div>
                        <h2
                            style={
                                styles.cardTitle
                            }
                        >
                            Administrator Accounts
                        </h2>

                        <p
                            style={
                                styles.cardDescription
                            }
                        >
                            All administrator accounts
                            registered in VOTARA.
                        </p>
                    </div>

                    <button
                        style={
                            styles.refreshButton
                        }
                        onClick={
                            loadAdminAccounts
                        }
                        disabled={loading}
                    >
                        <FiRefreshCw
                            size={16}
                            style={{
                                animation:
                                    loading
                                        ? "spin 1s linear infinite"
                                        : "none",
                            }}
                        />

                        Refresh
                    </button>
                </div>

                {/* FILTERS */}

                <div
                    style={
                        styles.filters
                    }
                >
                    <div
                        style={
                            styles.searchWrapper
                        }
                    >
                        <FiSearch
                            size={17}
                            style={
                                styles.searchIcon
                            }
                        />

                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target
                                        .value
                                )
                            }
                            style={
                                styles.searchInput
                            }
                        />
                    </div>

                    <select
                        value={
                            statusFilter
                        }
                        onChange={(event) =>
                            setStatusFilter(
                                event.target
                                    .value
                            )
                        }
                        style={
                            styles.select
                        }
                    >
                        <option value="all">
                            All Status
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>
                    </select>
                </div>

                {/* ERROR */}

                {error && (
                    <div
                        style={
                            styles.errorBox
                        }
                    >
                        <FiXCircle
                            size={18}
                        />

                        <span>
                            {error}
                        </span>
                    </div>
                )}

                {/* TABLE */}

                <div
                    style={
                        styles.tableWrapper
                    }
                >
                    <table
                        style={
                            styles.table
                        }
                    >
                        <thead>
                            <tr>
                                <th>
                                    Administrator
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Role
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Last Login
                                </th>

                                <th>
                                    Created
                                </th>

                                <th>
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        style={
                                            styles.emptyCell
                                        }
                                    >
                                        <FiRefreshCw
                                            size={22}
                                            style={{
                                                animation:
                                                    "spin 1s linear infinite",
                                            }}
                                        />

                                        Loading
                                        accounts...
                                    </td>
                                </tr>
                            ) : filteredAdmins.length ===
                              0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        style={
                                            styles.emptyCell
                                        }
                                    >
                                        <FiUsers
                                            size={30}
                                        />

                                        <strong>
                                            No Admin
                                            accounts
                                            found
                                        </strong>

                                        <span>
                                            Create an
                                            Admin account
                                            to see it
                                            here.
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map(
                                    (member) => (
                                        <tr
                                            key={
                                                member.id
                                            }
                                        >
                                            {/* ADMIN */}

                                            <td>
                                                <div
                                                    style={
                                                        styles.memberCell
                                                    }
                                                >
                                                    <div
                                                        style={
                                                            styles.avatar
                                                        }
                                                    >
                                                        {member.full_name
                                                            ?.charAt(
                                                                0
                                                            )
                                                            ?.toUpperCase() ||
                                                            "A"}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                member.full_name
                                                            }
                                                        </strong>

                                                        <span>
                                                            Administrator
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* EMAIL */}

                                            <td>
                                                <div
                                                    style={
                                                        styles.emailCell
                                                    }
                                                >
                                                    <FiMail
                                                        size={
                                                            15
                                                        }
                                                    />

                                                    {
                                                        member.email
                                                    }
                                                </div>
                                            </td>

                                            {/* ROLE */}

                                            <td>
                                                <span
                                                    style={
                                                        styles.roleBadge
                                                    }
                                                >
                                                    <FiShield
                                                        size={
                                                            13
                                                        }
                                                    />

                                                    Admin
                                                </span>
                                            </td>

                                            {/* STATUS */}

                                            <td>
                                                <span
                                                    style={{
                                                        ...styles.statusBadge,
                                                        ...(member.is_active
                                                            ? styles.activeBadge
                                                            : styles.inactiveBadge),
                                                    }}
                                                >
                                                    {member.is_active ? (
                                                        <FiCheckCircle
                                                            size={
                                                                13
                                                            }
                                                        />
                                                    ) : (
                                                        <FiXCircle
                                                            size={
                                                                13
                                                            }
                                                        />
                                                    )}

                                                    {member.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            {/* LOGIN */}

                                            <td>
                                                {
                                                    formatDate(
                                                        member.last_login_at
                                                    )
                                                }
                                            </td>

                                            {/* CREATED */}

                                            <td>
                                                <div
                                                    style={
                                                        styles.dateCell
                                                    }
                                                >
                                                    <FiCalendar
                                                        size={
                                                            14
                                                        }
                                                    />

                                                    {
                                                        formatDate(
                                                            member.created_at
                                                        )
                                                    }
                                                </div>
                                            </td>

                                            {/* ACTION */}

                                            <td
                                                style={{
                                                    position:
                                                        "relative",
                                                }}
                                            >
                                                <button
                                                    style={
                                                        styles.actionButton
                                                    }
                                                    onClick={() =>
                                                        setOpenMenu(
                                                            openMenu ===
                                                                member.id
                                                                ? null
                                                                : member.id
                                                        )
                                                    }
                                                >
                                                    <FiMoreVertical
                                                        size={
                                                            18
                                                        }
                                                    />
                                                </button>

                                                {openMenu ===
                                                    member.id && (
                                                    <div
                                                        style={
                                                            styles.actionMenu
                                                        }
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                alert(
                                                                    `Admin account: ${member.full_name}`
                                                                )
                                                            }
                                                        >
                                                            View
                                                            Account
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                alert(
                                                                    "Account status management will be added after the Create Admin workflow is tested."
                                                                )
                                                            }
                                                        >
                                                            Manage
                                                            Account
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                <div
                    style={
                        styles.tableFooter
                    }
                >
                    Showing{" "}
                    <strong>
                        {
                            filteredAdmins.length
                        }
                    </strong>{" "}
                    of{" "}
                    <strong>
                        {admins.length}
                    </strong>{" "}
                    Admin accounts
                </div>
            </section>

            {/* =================================================
                CREATE ADMIN MODAL
            ================================================= */}

            {showCreateModal && (
                <div
                    style={
                        styles.modalOverlay
                    }
                    onClick={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeCreateModal();
                        }
                    }}
                >
                    <div
                        style={
                            styles.modal
                        }
                    >
                        {!createdAccount ? (
                            <>
                                <div
                                    style={
                                        styles.modalHeader
                                    }
                                >
                                    <div>
                                        <span
                                            style={
                                                styles.pageLabel
                                            }
                                        >
                                            USER & ACCESS
                                        </span>

                                        <h2
                                            style={
                                                styles.modalTitle
                                            }
                                        >
                                            Create Admin
                                            Account
                                        </h2>

                                        <p
                                            style={
                                                styles.modalDescription
                                            }
                                        >
                                            Create an
                                            additional
                                            administrator
                                            account.
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        style={
                                            styles.closeButton
                                        }
                                        onClick={
                                            closeCreateModal
                                        }
                                    >
                                        ×
                                    </button>
                                </div>

                                <form
                                    onSubmit={
                                        handleCreateAccount
                                    }
                                >
                                    {/* FULL NAME */}

                                    <div
                                        style={
                                            styles.formGroup
                                        }
                                    >
                                        <label
                                            style={
                                                styles.formLabel
                                            }
                                        >
                                            Full Name
                                        </label>

                                        <input
                                            type="text"
                                            name="fullName"
                                            value={
                                                createForm.fullName
                                            }
                                            onChange={
                                                handleInput
                                            }
                                            placeholder="Enter administrator full name"
                                            style={
                                                styles.formInput
                                            }
                                            autoComplete="name"
                                        />
                                    </div>

                                    {/* EMAIL */}

                                    <div
                                        style={
                                            styles.formGroup
                                        }
                                    >
                                        <label
                                            style={
                                                styles.formLabel
                                            }
                                        >
                                            Email Address
                                        </label>

                                        <input
                                            type="email"
                                            name="email"
                                            value={
                                                createForm.email
                                            }
                                            onChange={
                                                handleInput
                                            }
                                            placeholder="Enter administrator email"
                                            style={
                                                styles.formInput
                                            }
                                            autoComplete="email"
                                        />
                                    </div>

                                    {/* PASSWORD INFORMATION */}

                                    <div
                                        style={
                                            styles.passwordInfo
                                        }
                                    >
                                        <FiShield
                                            size={20}
                                        />

                                        <div>
                                            <strong>
                                                Secure
                                                Temporary
                                                Password
                                            </strong>

                                            <p>
                                                VOTARA will
                                                generate a
                                                secure
                                                temporary
                                                password
                                                automatically.
                                                The new
                                                administrator
                                                must change
                                                it during
                                                first login.
                                            </p>
                                        </div>
                                    </div>

                                    {createError && (
                                        <div
                                            style={
                                                styles.modalError
                                            }
                                        >
                                            <FiXCircle
                                                size={
                                                    17
                                                }
                                            />

                                            {createError}
                                        </div>
                                    )}

                                    <div
                                        style={
                                            styles.modalActions
                                        }
                                    >
                                        <button
                                            type="button"
                                            style={
                                                styles.cancelButton
                                            }
                                            onClick={
                                                closeCreateModal
                                            }
                                            disabled={
                                                creatingAccount
                                            }
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="submit"
                                            style={
                                                styles.createButton
                                            }
                                            disabled={
                                                creatingAccount
                                            }
                                        >
                                            {creatingAccount ? (
                                                <>
                                                    <FiRefreshCw
                                                        size={
                                                            16
                                                        }
                                                        style={{
                                                            animation:
                                                                "spin 1s linear infinite",
                                                        }}
                                                    />

                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <FiPlus
                                                        size={
                                                            17
                                                        }
                                                    />

                                                    Create
                                                    Account
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <div
                                    style={
                                        styles.successContent
                                    }
                                >
                                    <div
                                        style={
                                            styles.successIcon
                                        }
                                    >
                                        <FiCheckCircle
                                            size={35}
                                        />
                                    </div>

                                    <h2
                                        style={
                                            styles.successTitle
                                        }
                                    >
                                        Admin Account
                                        Created
                                    </h2>

                                    <p
                                        style={
                                            styles.successDescription
                                        }
                                    >
                                        The administrator
                                        account was created
                                        successfully.
                                    </p>

                                    <div
                                        style={
                                            styles.accountSummary
                                        }
                                    >
                                        <div
                                            style={
                                                styles.summaryRow
                                            }
                                        >
                                            <span>
                                                Full Name
                                            </span>

                                            <strong>
                                                {
                                                    createdAccount.full_name
                                                }
                                            </strong>
                                        </div>

                                        <div
                                            style={
                                                styles.summaryRow
                                            }
                                        >
                                            <span>
                                                Email
                                            </span>

                                            <strong>
                                                {
                                                    createdAccount.email
                                                }
                                            </strong>
                                        </div>

                                        <div
                                            style={
                                                styles.summaryRow
                                            }
                                        >
                                            <span>
                                                Role
                                            </span>

                                            <strong>
                                                Administrator
                                            </strong>
                                        </div>
                                    </div>

                                    {/* TEMPORARY PASSWORD */}

                                    <div
                                        style={
                                            styles.temporaryPasswordBox
                                        }
                                    >
                                        <div
                                            style={
                                                styles.passwordBoxHeader
                                            }
                                        >
                                            <FiShield
                                                size={18}
                                            />

                                            <strong>
                                                Temporary
                                                Password
                                            </strong>
                                        </div>

                                        <div
                                            style={
                                                styles.passwordDisplayRow
                                            }
                                        >
                                            <div
                                                style={
                                                    styles.passwordValue
                                                }
                                            >
                                                {showTemporaryPassword
                                                    ? temporaryPassword
                                                    : "••••••••••••"}
                                            </div>

                                            <button
                                                type="button"
                                                style={
                                                    styles.passwordIconButton
                                                }
                                                onClick={() =>
                                                    setShowTemporaryPassword(
                                                        (
                                                            previous
                                                        ) =>
                                                            !previous
                                                    )
                                                }
                                                title={
                                                    showTemporaryPassword
                                                        ? "Hide password"
                                                        : "Show password"
                                                }
                                            >
                                                {showTemporaryPassword ? (
                                                    <FiEyeOff
                                                        size={
                                                            18
                                                        }
                                                    />
                                                ) : (
                                                    <FiEye
                                                        size={
                                                            18
                                                        }
                                                    />
                                                )}
                                            </button>
                                        </div>

                                        <button
                                            type="button"
                                            style={
                                                styles.copyPasswordButton
                                            }
                                            onClick={
                                                copyTemporaryPassword
                                            }
                                        >
                                            <FiCopy
                                                size={
                                                    15
                                                }
                                            />

                                            Copy Password
                                        </button>

                                        {copyMessage && (
                                            <div
                                                style={
                                                    styles.copyMessage
                                                }
                                            >
                                                <FiCheckCircle
                                                    size={
                                                        14
                                                    }
                                                />

                                                {copyMessage}
                                            </div>
                                        )}

                                        <p>
                                            This temporary
                                            password is not
                                            stored as
                                            plaintext in
                                            the database.
                                        </p>
                                    </div>

                                    <div
                                        style={
                                            styles.firstLoginNotice
                                        }
                                    >
                                        <FiCheckCircle
                                            size={17}
                                        />

                                        <span>
                                            The new
                                            administrator
                                            must change
                                            this temporary
                                            password during
                                            their first
                                            login.
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        style={
                                            styles.createButton
                                        }
                                        onClick={
                                            closeCreateModal
                                        }
                                    >
                                        Done
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>
                {`
                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }

                        to {
                            transform: rotate(360deg);
                        }
                    }

                    * {
                        box-sizing: border-box;
                    }

                    button,
                    input,
                    select {
                        font-family: inherit;
                    }

                    table th,
                    table td {
                        padding: 12px 14px;
                        text-align: left;
                        border-bottom: 1px solid #EAECF0;
                        font-size: 12px;
                    }

                    table th {
                        font-weight: 750;
                        color: #172033;
                        background: #ffffff;
                        white-space: nowrap;
                    }

                    table td {
                        color: #344054;
                        vertical-align: middle;
                    }

                    table tbody tr:last-child td {
                        border-bottom: none;
                    }

                    @media (max-width: 900px) {
                        .admin-management-page {
                            padding: 20px;
                        }
                    }
                `}
            </style>
        </div>
    );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div
            style={
                styles.summaryCard
            }
        >
            <div
                style={
                    styles.summaryIcon
                }
            >
                <Icon size={20} />
            </div>

            <div>
                <span
                    style={
                        styles.summaryLabel
                    }
                >
                    {label}
                </span>

                <strong
                    style={
                        styles.summaryValue
                    }
                >
                    {value}
                </strong>
            </div>
        </div>
    );
}

// =========================================================
// STYLES
// =========================================================

const styles = {
    page: {
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#172033",
        padding: "32px 42px",
        fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    header: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "flex-end",
        gap: "25px",
        marginBottom: "25px",
    },

    headerLeft: {
        display: "flex",
        flexDirection: "column",
        gap: "18px",
    },

    backButton: {
        alignSelf: "flex-start",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        border: "none",
        background: "transparent",
        color: "#667085",
        cursor: "pointer",
        padding: 0,
        fontSize: "12px",
        fontWeight: 600,
    },

    pageLabel: {
        display: "block",
        color: "#266EFF",
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "1.5px",
    },

    title: {
        margin: "7px 0 5px",
        fontSize: "29px",
        fontWeight: 800,
        letterSpacing: "-0.6px",
    },

    subtitle: {
        margin: 0,
        color: "#667085",
        fontSize: "13px",
    },

    createButton: {
        border: "none",
        background: "#266EFF",
        color: "#ffffff",
        borderRadius: "9px",
        padding: "11px 16px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700,
        boxShadow:
            "0 3px 8px rgba(38,110,255,0.20)",
    },

    summaryGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(4, minmax(0, 1fr))",
        gap: "15px",
        marginBottom: "20px",
    },

    summaryCard: {
        background: "#ffffff",
        border:
            "1px solid #EAECF0",
        borderRadius: "13px",
        padding: "17px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },

    summaryIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "#EEF4FF",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    summaryLabel: {
        display: "block",
        color: "#667085",
        fontSize: "11px",
    },

    summaryValue: {
        display: "block",
        marginTop: "3px",
        fontSize: "21px",
        fontWeight: 800,
    },

    contentCard: {
        background: "#ffffff",
        border:
            "1px solid #EAECF0",
        borderRadius: "14px",
        overflow: "hidden",
    },

    cardHeader: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center",
        gap: "20px",
        padding: "20px",
        borderBottom:
            "1px solid #EAECF0",
    },

    cardTitle: {
        margin: 0,
        fontSize: "17px",
        fontWeight: 750,
    },

    cardDescription: {
        margin: "4px 0 0",
        color: "#667085",
        fontSize: "11px",
    },

    refreshButton: {
        border:
            "1px solid #D0D5DD",
        background: "#ffffff",
        color: "#344054",
        borderRadius: "8px",
        padding: "9px 12px",
        display: "flex",
        alignItems: "center",
        gap: "7px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: 600,
    },

    filters: {
        display: "flex",
        gap: "10px",
        padding: "15px 20px",
        borderBottom:
            "1px solid #EAECF0",
    },

    searchWrapper: {
        position: "relative",
        flex: 1,
    },

    searchIcon: {
        position: "absolute",
        left: "12px",
        top: "50%",
        transform:
            "translateY(-50%)",
        color: "#98A2B3",
    },

    searchInput: {
        width: "100%",
        border:
            "1px solid #D0D5DD",
        borderRadius: "8px",
        padding:
            "10px 12px 10px 37px",
        outline: "none",
        fontSize: "12px",
    },

    select: {
        minWidth: "135px",
        border:
            "1px solid #D0D5DD",
        borderRadius: "8px",
        padding: "10px 12px",
        background: "#ffffff",
        color: "#344054",
        outline: "none",
        fontSize: "12px",
    },

    errorBox: {
        margin: "15px 20px",
        padding: "13px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        color: "#B42318",
        background: "#FEF3F2",
        border:
            "1px solid #FECDCA",
        borderRadius: "9px",
        fontSize: "12px",
    },

    tableWrapper: {
        width: "100%",
        overflowX: "auto",
    },

    table: {
        width: "100%",
        minWidth: "950px",
        borderCollapse:
            "collapse",
    },

    memberCell: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },

    avatar: {
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        background: "#EEF4FF",
        color: "#266EFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: 800,
        flexShrink: 0,
    },

    emailCell: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        color: "#667085",
    },

    dateCell: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        color: "#667085",
    },

    roleBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 8px",
        borderRadius: "20px",
        background: "#EEF4FF",
        color: "#266EFF",
        fontSize: "10px",
        fontWeight: 700,
    },

    statusBadge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 8px",
        borderRadius: "20px",
        fontSize: "10px",
        fontWeight: 700,
    },

    activeBadge: {
        background: "#ECFDF3",
        color: "#027A48",
    },

    inactiveBadge: {
        background: "#FEF3F2",
        color: "#B42318",
    },

    actionButton: {
        width: "32px",
        height: "32px",
        border: "none",
        background: "transparent",
        color: "#667085",
        borderRadius: "7px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    actionMenu: {
        position: "absolute",
        right: "10px",
        top: "42px",
        width: "175px",
        background: "#ffffff",
        border:
            "1px solid #EAECF0",
        borderRadius: "9px",
        boxShadow:
            "0 8px 25px rgba(16,24,40,0.12)",
        zIndex: 20,
        padding: "5px",
    },

    tableFooter: {
        padding: "13px 20px",
        borderTop:
            "1px solid #EAECF0",
        color: "#667085",
        fontSize: "11px",
    },

    emptyCell: {
        height: "220px",
        textAlign: "center",
        color: "#98A2B3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    },

    loadingPage: {
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#667085",
        gap: "10px",
    },

    // =====================================================
    // MODAL
    // =====================================================

    modalOverlay: {
        position: "fixed",
        inset: 0,
        background:
            "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 1000,
    },

    modal: {
        width: "100%",
        maxWidth: "540px",
        maxHeight: "90vh",
        overflowY: "auto",
        background: "#ffffff",
        borderRadius: "16px",
        boxShadow:
            "0 20px 50px rgba(16,24,40,0.25)",
        padding: "25px",
    },

    modalHeader: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "flex-start",
        gap: "20px",
        marginBottom: "22px",
    },

    modalTitle: {
        margin: "6px 0 5px",
        fontSize: "23px",
        fontWeight: 800,
    },

    modalDescription: {
        margin: 0,
        color: "#667085",
        fontSize: "12px",
    },

    closeButton: {
        border: "none",
        background: "#F2F4F7",
        color: "#667085",
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: "23px",
        lineHeight: "1",
    },

    formGroup: {
        marginBottom: "18px",
    },

    formLabel: {
        display: "block",
        marginBottom: "7px",
        color: "#344054",
        fontSize: "12px",
        fontWeight: 700,
    },

    formInput: {
        width: "100%",
        padding: "11px 12px",
        border:
            "1px solid #D0D5DD",
        borderRadius: "8px",
        outline: "none",
        fontSize: "13px",
    },

    passwordInfo: {
        display: "flex",
        gap: "11px",
        alignItems: "flex-start",
        padding: "13px",
        marginBottom: "16px",
        background: "#EEF4FF",
        border:
            "1px solid #D1E0FF",
        borderRadius: "10px",
        color: "#266EFF",
    },

    modalError: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "11px 12px",
        marginBottom: "15px",
        background: "#FEF3F2",
        border:
            "1px solid #FECDCA",
        borderRadius: "8px",
        color: "#B42318",
        fontSize: "11px",
    },

    modalActions: {
        display: "flex",
        justifyContent:
            "flex-end",
        gap: "9px",
        paddingTop: "7px",
    },

    cancelButton: {
        border:
            "1px solid #D0D5DD",
        background: "#ffffff",
        color: "#344054",
        borderRadius: "8px",
        padding: "10px 15px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 600,
    },

    successContent: {
        textAlign: "center",
    },

    successIcon: {
        width: "65px",
        height: "65px",
        margin: "0 auto 15px",
        borderRadius: "50%",
        background: "#ECFDF3",
        color: "#039855",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },

    successTitle: {
        margin: 0,
        fontSize: "22px",
        fontWeight: 800,
    },

    successDescription: {
        color: "#667085",
        fontSize: "12px",
        margin: "6px 0 20px",
    },

    accountSummary: {
        textAlign: "left",
        background: "#F9FAFB",
        borderRadius: "10px",
        padding: "14px",
        marginBottom: "15px",
    },

    summaryRow: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center",
        gap: "15px",
        padding: "8px 0",
        borderBottom:
            "1px solid #EAECF0",
        fontSize: "12px",
    },

    temporaryPasswordBox: {
        textAlign: "left",
        background: "#FFF7E6",
        border:
            "1px solid #FEC84B",
        borderRadius: "10px",
        padding: "15px",
        marginBottom: "13px",
    },

    passwordBoxHeader: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        color: "#B54708",
        fontSize: "12px",
    },

    passwordDisplayRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "10px",
    },

    passwordValue: {
        flex: 1,
        padding: "12px",
        background: "#ffffff",
        border:
            "1px solid #FEC84B",
        borderRadius: "8px",
        fontFamily:
            "monospace",
        fontSize: "17px",
        fontWeight: 800,
        letterSpacing: "1px",
        textAlign: "center",
        color: "#172033",
        wordBreak: "break-all",
    },

    passwordIconButton: {
        width: "40px",
        height: "40px",
        border:
            "1px solid #FEC84B",
        background: "#ffffff",
        color: "#B54708",
        borderRadius: "8px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    copyPasswordButton: {
        marginTop: "9px",
        border:
            "1px solid #D0D5DD",
        background: "#ffffff",
        color: "#344054",
        borderRadius: "7px",
        padding: "8px 11px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: 700,
    },

    copyMessage: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        marginTop: "8px",
        color: "#027A48",
        fontSize: "10px",
        fontWeight: 600,
    },

    firstLoginNotice: {
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        textAlign: "left",
        color: "#027A48",
        background: "#ECFDF3",
        border:
            "1px solid #ABEFC6",
        borderRadius: "9px",
        padding: "11px",
        fontSize: "11px",
        marginBottom: "17px",
    },
};

export default AdminAccountManagement;