import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

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
// ELECTORAL BOARD MANAGEMENT
// =========================================================

function ElectoralBoardManagement() {
    const navigate = useNavigate();

    const [admin, setAdmin] = useState(null);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] =
        useState("all");
    const [openMenu, setOpenMenu] =
        useState(null);

    // =====================================================
    // CREATE EB ACCOUNT STATES
    // =====================================================

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [createForm, setCreateForm] = useState({
        fullName: "",
        email: "",
    });

    const [photoPreview, setPhotoPreview] =
        useState("");

    const [photoData, setPhotoData] =
        useState("");

    const [cameraOpen, setCameraOpen] =
        useState(false);

    const [creatingAccount, setCreatingAccount] =
        useState(false);

    const [createError, setCreateError] =
        useState("");

    const [createdAccount, setCreatedAccount] =
        useState(null);

    // =====================================================
    // TEMPORARY PASSWORD
    // =====================================================

    const [temporaryPassword, setTemporaryPassword] =
        useState("");

    const [showTemporaryPassword, setShowTemporaryPassword] =
        useState(false);

    const [credentialAccountId, setCredentialAccountId] =
        useState(null);

    const [copyMessage, setCopyMessage] =
        useState("");

    // =====================================================
    // ACCOUNT ACTION STATES
    // =====================================================

    const [showDeactivateModal, setShowDeactivateModal] =
        useState(false);

    const [showActivateModal, setShowActivateModal] =
        useState(false);

    const [showResetPasswordModal, setShowResetPasswordModal] =
        useState(false);

    const [selectedMember, setSelectedMember] =
        useState(null);

    const [deactivationReason, setDeactivationReason] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(false);

    const [actionError, setActionError] =
        useState("");

    // =====================================================
    // CAMERA
    // =====================================================

    const videoRef = useRef(null);

    const streamRef = useRef(null);

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

            loadElectoralBoardAccounts();
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
    // CREATE FORM
    // =====================================================

    const openCreateModal = () => {
        setCreateForm({
            fullName: "",
            email: "",
        });

        setPhotoPreview("");
        setPhotoData("");
        setCreateError("");
        setCreatedAccount(null);
        setTemporaryPassword("");
        setShowTemporaryPassword(false);
        setCredentialAccountId(null);
        setCopyMessage("");
        setCameraOpen(false);

        setShowCreateModal(true);
    };

    // =====================================================
    // CLOSE CREATE MODAL
    // =====================================================

    const closeCreateModal = () => {
        stopCamera();

        setShowCreateModal(false);

        setCreateForm({
            fullName: "",
            email: "",
        });

        setPhotoPreview("");
        setPhotoData("");
        setCreateError("");
        setCreatedAccount(null);
    };

    // =====================================================
    // HANDLE FORM INPUT
    // =====================================================

    const handleCreateInput = (event) => {
        const {
            name,
            value,
        } = event.target;

        setCreateForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =====================================================
    // UPLOAD PHOTO
    // =====================================================

    const handlePhotoUpload = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setCreateError(
                "Please select a valid image file."
            );

            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setCreateError(
                "Photo must be 5MB or smaller."
            );

            return;
        }

        const reader =
            new FileReader();

        reader.onload = () => {
            const result =
                reader.result;

            setPhotoPreview(result);
            setPhotoData(result);
            setCreateError("");
        };

        reader.readAsDataURL(file);
    };

    // =====================================================
    // CREATE EB ACCOUNT
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

        if (!photoData) {
            setCreateError(
                "Please upload a photo or take a photo."
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
                navigate(
                    "/admin-login",
                    {
                        replace: true,
                    }
                );

                return;
            }

            const response =
                await api.post(
                    "/admin/electoral-board",
                    {
                        fullName:
                            createForm.fullName.trim(),

                        email:
                            createForm.email
                                .trim()
                                .toLowerCase(),

                        photoData:
                            photoData,
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
                        "Unable to create account."
                );
            }

            setCreatedAccount(
                response.data.user
            );

            setTemporaryPassword(
                response.data
                    .temporaryPassword || ""
            );

            setCredentialAccountId(
                response.data.user?.id || null
            );

            setShowTemporaryPassword(false);
            setCopyMessage("");

            await loadElectoralBoardAccounts();
        } catch (error) {
            console.error(
                "Create EB account error:",
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

                navigate(
                    "/admin-login",
                    {
                        replace: true,
                    }
                );

                return;
            }

            setCreateError(
                error.response?.data
                    ?.message ||
                    error.message ||
                    "Unable to create Electoral Board account."
            );
        } finally {
            setCreatingAccount(false);
        }
    };

    // =====================================================
    // COPY TEMPORARY PASSWORD
    // =====================================================

    const copyTemporaryPassword = async () => {
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
    // START CAMERA
    // =====================================================

    const startCamera = async () => {
        try {
            setCreateError("");

            if (
                !navigator.mediaDevices ||
                !navigator.mediaDevices
                    .getUserMedia
            ) {
                setCreateError(
                    "Camera access is not supported by this browser."
                );

                return;
            }

            const stream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode: "user",
                        },
                        audio: false,
                    }
                );

            streamRef.current =
                stream;

            setCameraOpen(true);

            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject =
                        stream;
                }
            }, 100);
        } catch (error) {
            console.error(
                "Camera error:",
                error
            );

            setCreateError(
                "Unable to access the camera. Please allow camera permission or upload a photo instead."
            );
        }
    };

    // =====================================================
    // TAKE PHOTO
    // =====================================================

    const capturePhoto = () => {
        if (!videoRef.current) {
            return;
        }

        const video =
            videoRef.current;

        const canvas =
            document.createElement(
                "canvas"
            );

        canvas.width =
            video.videoWidth ||
            640;

        canvas.height =
            video.videoHeight ||
            480;

        const context =
            canvas.getContext("2d");

        if (!context) {
            setCreateError(
                "Unable to capture photo."
            );

            return;
        }

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const imageData =
            canvas.toDataURL(
                "image/jpeg",
                0.85
            );

        setPhotoPreview(
            imageData
        );

        setPhotoData(
            imageData
        );

        setCreateError("");

        stopCamera();
    };

    // =====================================================
    // STOP CAMERA
    // =====================================================

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => {
                    track.stop();
                });

            streamRef.current = null;
        }

        setCameraOpen(false);
    };

    // =====================================================
    // CLEAN CAMERA
    // =====================================================

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current = null;
            }
        };
    }, []);

    // =====================================================
    // LOAD EB ACCOUNTS
    // =====================================================

    const loadElectoralBoardAccounts =
        async () => {
            setLoading(true);
            setError("");

            try {
                const token =
                    localStorage.getItem(
                        "votaraStaffToken"
                    );

                if (!token) {
                    navigate(
                        "/admin-login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                const response =
                    await api.get(
                        "/admin/electoral-board",
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
                            "Unable to load Electoral Board accounts."
                    );
                }

                setStaff(
                    response.data.staff ||
                        []
                );
            } catch (error) {
                console.error(
                    "EB accounts error:",
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

                    navigate(
                        "/admin-login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                setError(
                    error.response?.data
                        ?.message ||
                        error.message ||
                        "Unable to load Electoral Board accounts."
                );
            } finally {
                setLoading(false);
            }
        };

    // =====================================================
    // OPEN DEACTIVATE MODAL
    // =====================================================

    const openDeactivateModal = (
        member
    ) => {
        setSelectedMember(member);
        setDeactivationReason("");
        setActionError("");
        setOpenMenu(null);
        setShowDeactivateModal(true);
    };

    // =====================================================
    // OPEN ACTIVATE MODAL
    // =====================================================

    const openActivateModal = (
        member
    ) => {
        setSelectedMember(member);
        setActionError("");
        setOpenMenu(null);
        setShowActivateModal(true);
    };

    // =====================================================
    // OPEN RESET PASSWORD MODAL
    // =====================================================

    const openResetPasswordModal = (
        member
    ) => {
        setSelectedMember(member);
        setActionError("");
        setTemporaryPassword("");
        setShowTemporaryPassword(false);
        setCopyMessage("");
        setOpenMenu(null);
        setShowResetPasswordModal(true);
    };

    // =====================================================
    // ACTIVATE EB ACCOUNT
    // =====================================================

    const handleActivateAccount = async () => {
        if (!selectedMember) {
            return;
        }

        try {
            setActionLoading(true);
            setActionError("");

            const token =
                localStorage.getItem(
                    "votaraStaffToken"
                );

            if (!token) {
                navigate(
                    "/admin-login",
                    {
                        replace: true,
                    }
                );

                return;
            }

            const response =
                await api.patch(
                    `/admin/electoral-board/${selectedMember.id}/activate`,
                    {},
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
                        "Unable to activate account."
                );
            }

            setShowActivateModal(false);
            setSelectedMember(null);
            setActionError("");

            await loadElectoralBoardAccounts();
        } catch (error) {
            console.error(
                "Activate EB account error:",
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

                navigate(
                    "/admin-login",
                    {
                        replace: true,
                    }
                );

                return;
            }

            setActionError(
                error.response?.data
                    ?.message ||
                    error.message ||
                    "Unable to activate account."
            );
        } finally {
            setActionLoading(false);
        }
    };

    // =====================================================
    // DEACTIVATE EB ACCOUNT
    // =====================================================

    const handleDeactivateAccount =
        async () => {
            if (!selectedMember) {
                return;
            }

            if (
                !deactivationReason.trim()
            ) {
                setActionError(
                    "Please provide a reason for deactivation."
                );

                return;
            }

            if (
                deactivationReason.trim()
                    .length < 5
            ) {
                setActionError(
                    "The deactivation reason must contain at least 5 characters."
                );

                return;
            }

            try {
                setActionLoading(true);
                setActionError("");

                const token =
                    localStorage.getItem(
                        "votaraStaffToken"
                    );

                if (!token) {
                    navigate(
                        "/admin-login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                const response =
                    await api.patch(
                        `/admin/electoral-board/${selectedMember.id}/deactivate`,
                        {
                            reason:
                                deactivationReason.trim(),
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
                            "Unable to deactivate account."
                    );
                }

                setShowDeactivateModal(
                    false
                );

                setSelectedMember(null);
                setDeactivationReason("");
                setActionError("");

                await loadElectoralBoardAccounts();
            } catch (error) {
                console.error(
                    "Deactivate EB account error:",
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

                    navigate(
                        "/admin-login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                setActionError(
                    error.response?.data
                        ?.message ||
                        error.message ||
                        "Unable to deactivate account."
                );
            } finally {
                setActionLoading(false);
            }
        };

    // =====================================================
    // RESET EB PASSWORD
    // =====================================================

    const handleResetPassword =
        async () => {
            if (!selectedMember) {
                return;
            }

            try {
                setActionLoading(true);
                setActionError("");

                const token =
                    localStorage.getItem(
                        "votaraStaffToken"
                    );

                if (!token) {
                    navigate(
                        "/admin-login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                const response =
                    await api.post(
                        `/admin/electoral-board/${selectedMember.id}/reset-password`,
                        {},
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
                            "Unable to reset password."
                    );
                }

                setTemporaryPassword(
                    response.data
                        ?.temporaryPassword ||
                        ""
                );

                setCredentialAccountId(
                    selectedMember.id
                );

                setShowTemporaryPassword(
                    false
                );

                setCopyMessage("");
                setActionError("");

                setShowResetPasswordModal(
                    false
                );

                await loadElectoralBoardAccounts();
            } catch (error) {
                console.error(
                    "Reset EB password error:",
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

                    navigate(
                        "/admin-login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                setActionError(
                    error.response?.data
                        ?.message ||
                        error.message ||
                        "Unable to reset password."
                );
            } finally {
                setActionLoading(false);
            }
        };

    // =====================================================
    // FILTER STAFF
    // =====================================================

    const filteredStaff = useMemo(() => {
        const searchValue =
            search
                .trim()
                .toLowerCase();

        return staff.filter(
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
        staff,
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
    // CLOSE MENU
    // =====================================================

    useEffect(() => {
        const closeMenu = () => {
            setOpenMenu(null);
        };

        document.addEventListener(
            "click",
            closeMenu
        );

        return () => {
            document.removeEventListener(
                "click",
                closeMenu
            );
        };
    }, []);

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
                    Loading Electoral Board
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
                            Electoral Board
                            Management
                        </h1>

                        <p
                            style={
                                styles.subtitle
                            }
                        >
                            Manage Electoral Board
                            staff accounts and
                            access.
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

                    Create EB Account
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
                    label="Total EB Accounts"
                    value={staff.length}
                />

                <SummaryCard
                    icon={FiCheckCircle}
                    label="Active Accounts"
                    value={
                        staff.filter(
                            (item) =>
                                item.is_active
                        ).length
                    }
                />

                <SummaryCard
                    icon={FiXCircle}
                    label="Inactive Accounts"
                    value={
                        staff.filter(
                            (item) =>
                                !item.is_active
                        ).length
                    }
                />

                <SummaryCard
                    icon={FiShield}
                    label="Role"
                    value="Electoral Board"
                />
            </section>

            {/* =================================================
                MAIN CARD
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
                            EB Accounts
                        </h2>

                        <p
                            style={
                                styles.cardDescription
                            }
                        >
                            Electoral Board accounts
                            registered in VOTARA.
                        </p>
                    </div>

                    <button
                        style={
                            styles.refreshButton
                        }
                        onClick={
                            loadElectoralBoardAccounts
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

                {/* =================================================
                    FILTERS
                ================================================= */}

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

                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (
                    <div
                        style={
                            styles.errorBox
                        }
                    >
                        <FiXCircle
                            size={18}
                        />

                        <div>
                            <strong>
                                Unable to load
                                accounts
                            </strong>

                            <p>
                                {error}
                            </p>
                        </div>
                    </div>
                )}

                {/* =================================================
                    TABLE
                ================================================= */}

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
                                    Staff Member
                                </th>

                                <th>
                                    Email
                                </th>

                                <th>
                                    Credentials
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

                                        <span>
                                            Loading
                                            accounts...
                                        </span>
                                    </td>
                                </tr>
                            ) : filteredStaff.length ===
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
                                            No Electoral
                                            Board
                                            accounts
                                            found
                                        </strong>

                                        <span>
                                            Accounts
                                            created by
                                            the Admin
                                            will appear
                                            here.
                                        </span>
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map(
                                    (member) => (
                                        <tr
                                            key={
                                                member.id
                                            }
                                        >
                                            {/* STAFF */}

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
                                                            "E"}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {
                                                                member.full_name
                                                            }
                                                        </strong>

                                                        <span>
                                                            Electoral
                                                            Board
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

                                            {/* CREDENTIALS */}

                                            <td>
                                                {credentialAccountId ===
                                                    member.id &&
                                                temporaryPassword ? (
                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.credentialButton
                                                        }
                                                        onClick={() => {
                                                            setShowCreateModal(
                                                                true
                                                            );

                                                            setCreatedAccount(
                                                                member
                                                            );

                                                            setShowTemporaryPassword(
                                                                false
                                                            );

                                                            setCopyMessage(
                                                                ""
                                                            );
                                                        }}
                                                    >
                                                        <FiShield
                                                            size={
                                                                14
                                                            }
                                                        />

                                                        View
                                                        Credential
                                                    </button>
                                                ) : (
                                                    <span
                                                        style={
                                                            styles.credentialUnavailable
                                                        }
                                                    >
                                                        —
                                                    </span>
                                                )}
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

                                            {/* LAST LOGIN */}

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

                                            {/* ACTIONS */}

                                            <td
                                                style={{
                                                    position:
                                                        "relative",
                                                }}
                                                onClick={(
                                                    event
                                                ) =>
                                                    event.stopPropagation()
                                                }
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
                                                                    `View account: ${member.full_name}`
                                                                )
                                                            }
                                                        >
                                                            View
                                                            Account
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (
                                                                    member.is_active
                                                                ) {
                                                                    openDeactivateModal(
                                                                        member
                                                                    );
                                                                } else {
                                                                    openActivateModal(
                                                                        member
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {member.is_active
                                                                ? "Deactivate"
                                                                : "Activate"}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openResetPasswordModal(
                                                                    member
                                                                )
                                                            }
                                                        >
                                                            Reset
                                                            Password
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

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div
                    style={
                        styles.tableFooter
                    }
                >
                    Showing{" "}
                    <strong>
                        {
                            filteredStaff.length
                        }
                    </strong>{" "}
                    of{" "}
                    <strong>
                        {staff.length}
                    </strong>{" "}
                    Electoral Board accounts
                </div>
            </section>

            {/* =================================================
                CREATE EB ACCOUNT MODAL
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
                                            Create EB
                                            Account
                                        </h2>

                                        <p
                                            style={
                                                styles.modalDescription
                                            }
                                        >
                                            Create an
                                            Electoral
                                            Board staff
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
                                                handleCreateInput
                                            }
                                            placeholder="Enter full name"
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
                                                handleCreateInput
                                            }
                                            placeholder="Enter email address"
                                            style={
                                                styles.formInput
                                            }
                                            autoComplete="email"
                                        />
                                    </div>

                                    {/* PHOTO */}

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
                                            Profile Photo
                                        </label>

                                        {!cameraOpen ? (
                                            <div
                                                style={
                                                    styles.photoArea
                                                }
                                            >
                                                {photoPreview ? (
                                                    <img
                                                        src={
                                                            photoPreview
                                                        }
                                                        alt="EB Preview"
                                                        style={
                                                            styles.photoPreview
                                                        }
                                                    />
                                                ) : (
                                                    <div
                                                        style={
                                                            styles.photoPlaceholder
                                                        }
                                                    >
                                                        <FiUsers
                                                            size={
                                                                35
                                                            }
                                                        />

                                                        <span>
                                                            No
                                                            photo
                                                            selected
                                                        </span>
                                                    </div>
                                                )}

                                                <div
                                                    style={
                                                        styles.photoButtons
                                                    }
                                                >
                                                    <label
                                                        style={
                                                            styles.secondaryButton
                                                        }
                                                    >
                                                        Upload
                                                        Photo

                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={
                                                                handlePhotoUpload
                                                            }
                                                            style={{
                                                                display:
                                                                    "none",
                                                            }}
                                                        />
                                                    </label>

                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.secondaryButton
                                                        }
                                                        onClick={
                                                            startCamera
                                                        }
                                                    >
                                                        Take a
                                                        Photo
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                style={
                                                    styles.cameraArea
                                                }
                                            >
                                                <video
                                                    ref={
                                                        videoRef
                                                    }
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    style={
                                                        styles.video
                                                    }
                                                />

                                                <div
                                                    style={
                                                        styles.cameraButtons
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.primarySmallButton
                                                        }
                                                        onClick={
                                                            capturePhoto
                                                        }
                                                    >
                                                        Capture
                                                        Photo
                                                    </button>

                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.secondaryButton
                                                        }
                                                        onClick={
                                                            stopCamera
                                                        }
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
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
                                                Generate
                                                Temporary
                                                Password
                                            </strong>

                                            <p>
                                                A secure
                                                temporary
                                                password
                                                will be
                                                generated
                                                automatically
                                                by the server
                                                after this
                                                account is
                                                created.
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
                            /* =================================================
                               SUCCESS / CREDENTIALS
                            ================================================= */

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
                                    Account Created
                                    Successfully
                                </h2>

                                <p
                                    style={
                                        styles.successDescription
                                    }
                                >
                                    The Electoral Board
                                    account has been
                                    created.
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
                                            Electoral
                                            Board
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
                                        Save this
                                        password
                                        securely. The
                                        password is not
                                        stored as
                                        plaintext in the
                                        database.
                                    </p>
                                </div>

                                {/* FIRST LOGIN NOTICE */}

                                <div
                                    style={
                                        styles.firstLoginNotice
                                    }
                                >
                                    <FiCheckCircle
                                        size={17}
                                    />

                                    <span>
                                        The EB will be
                                        required to
                                        change this
                                        temporary
                                        password during
                                        their first login.
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
                        )}
                    </div>
                </div>
            )}

            {/* =================================================
                DEACTIVATE EB ACCOUNT MODAL
            ================================================= */}

            {showDeactivateModal &&
                selectedMember && (
                    <div
                        style={
                            styles.modalOverlay
                        }
                        onClick={(event) => {
                            if (
                                event.target ===
                                    event.currentTarget &&
                                !actionLoading
                            ) {
                                setShowDeactivateModal(
                                    false
                                );

                                setSelectedMember(
                                    null
                                );

                                setActionError(
                                    ""
                                );
                            }
                        }}
                    >
                        <div
                            style={
                                styles.modal
                            }
                        >
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
                                        ACCOUNT
                                        MANAGEMENT
                                    </span>

                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Deactivate EB
                                        Account
                                    </h2>

                                    <p
                                        style={
                                            styles.modalDescription
                                        }
                                    >
                                        This will prevent
                                        the Electoral
                                        Board member from
                                        logging in.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    style={
                                        styles.closeButton
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() => {
                                        setShowDeactivateModal(
                                            false
                                        );

                                        setSelectedMember(
                                            null
                                        );

                                        setActionError(
                                            ""
                                        );
                                    }}
                                >
                                    ×
                                </button>
                            </div>

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
                                            selectedMember.full_name
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
                                            selectedMember.email
                                        }
                                    </strong>
                                </div>
                            </div>

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
                                    Reason for
                                    Deactivation *
                                </label>

                                <textarea
                                    value={
                                        deactivationReason
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setDeactivationReason(
                                            event
                                                .target
                                                .value
                                        );

                                        setActionError(
                                            ""
                                        );
                                    }}
                                    placeholder="Enter the reason for deactivating this account..."
                                    rows={5}
                                    style={{
                                        ...styles.formInput,
                                        resize:
                                            "vertical",
                                    }}
                                />
                            </div>

                            {actionError && (
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

                                    {actionError}
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
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() => {
                                        setShowDeactivateModal(
                                            false
                                        );

                                        setSelectedMember(
                                            null
                                        );

                                        setActionError(
                                            ""
                                        );
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    style={
                                        styles.dangerButton
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={
                                        handleDeactivateAccount
                                    }
                                >
                                    {actionLoading ? (
                                        <>
                                            <FiRefreshCw
                                                size={
                                                    15
                                                }
                                                style={{
                                                    animation:
                                                        "spin 1s linear infinite",
                                                }}
                                            />

                                            Deactivating...
                                        </>
                                    ) : (
                                        <>
                                            <FiXCircle
                                                size={
                                                    15
                                                }
                                            />

                                            Deactivate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =================================================
                ACTIVATE EB ACCOUNT MODAL
            ================================================= */}

            {showActivateModal &&
                selectedMember && (
                    <div
                        style={
                            styles.modalOverlay
                        }
                    >
                        <div
                            style={
                                styles.modal
                            }
                        >
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
                                        ACCOUNT
                                        MANAGEMENT
                                    </span>

                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Activate EB
                                        Account
                                    </h2>

                                    <p
                                        style={
                                            styles.modalDescription
                                        }
                                    >
                                        Are you sure you
                                        want to reactivate
                                        this Electoral
                                        Board account?
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    style={
                                        styles.closeButton
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() => {
                                        setShowActivateModal(
                                            false
                                        );

                                        setSelectedMember(
                                            null
                                        );

                                        setActionError(
                                            ""
                                        );
                                    }}
                                >
                                    ×
                                </button>
                            </div>

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
                                            selectedMember.full_name
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
                                            selectedMember.email
                                        }
                                    </strong>
                                </div>
                            </div>

                            {actionError && (
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

                                    {actionError}
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
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() => {
                                        setShowActivateModal(
                                            false
                                        );

                                        setSelectedMember(
                                            null
                                        );

                                        setActionError(
                                            ""
                                        );
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    style={
                                        styles.createButton
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={
                                        handleActivateAccount
                                    }
                                >
                                    {actionLoading ? (
                                        <>
                                            <FiRefreshCw
                                                size={
                                                    15
                                                }
                                                style={{
                                                    animation:
                                                        "spin 1s linear infinite",
                                                }}
                                            />

                                            Activating...
                                        </>
                                    ) : (
                                        <>
                                            <FiCheckCircle
                                                size={
                                                    15
                                                }
                                            />

                                            Activate
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =================================================
                RESET PASSWORD MODAL
            ================================================= */}

            {showResetPasswordModal &&
                selectedMember && (
                    <div
                        style={
                            styles.modalOverlay
                        }
                    >
                        <div
                            style={
                                styles.modal
                            }
                        >
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
                                        ACCOUNT
                                        SECURITY
                                    </span>

                                    <h2
                                        style={
                                            styles.modalTitle
                                        }
                                    >
                                        Reset Password
                                    </h2>

                                    <p
                                        style={
                                            styles.modalDescription
                                        }
                                    >
                                        A new temporary
                                        password will be
                                        generated.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    style={
                                        styles.closeButton
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() => {
                                        setShowResetPasswordModal(
                                            false
                                        );

                                        setSelectedMember(
                                            null
                                        );

                                        setActionError(
                                            ""
                                        );
                                    }}
                                >
                                    ×
                                </button>
                            </div>

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
                                            selectedMember.full_name
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
                                            selectedMember.email
                                        }
                                    </strong>
                                </div>
                            </div>

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
                                        Important
                                    </strong>

                                    <p>
                                        The existing
                                        password will be
                                        replaced. The EB
                                        will be required
                                        to change the new
                                        temporary password
                                        during the next
                                        login.
                                    </p>
                                </div>
                            </div>

                            {actionError && (
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

                                    {actionError}
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
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={() => {
                                        setShowResetPasswordModal(
                                            false
                                        );

                                        setSelectedMember(
                                            null
                                        );

                                        setActionError(
                                            ""
                                        );
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    style={
                                        styles.createButton
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                    onClick={
                                        handleResetPassword
                                    }
                                >
                                    {actionLoading ? (
                                        <>
                                            <FiRefreshCw
                                                size={
                                                    15
                                                }
                                                style={{
                                                    animation:
                                                        "spin 1s linear infinite",
                                                }}
                                            />

                                            Resetting...
                                        </>
                                    ) : (
                                        <>
                                            <FiShield
                                                size={
                                                    15
                                                }
                                            />

                                            Reset Password
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            {/* =================================================
                PAGE STYLE
            ================================================= */}

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
                    select,
                    textarea {
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
                        font-size: 12px;
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

                    .action-menu-button:hover {
                        background: #F2F4F7;
                    }

                    @media (max-width: 1100px) {
                        .eb-management-table {
                            overflow-x: auto;
                        }
                    }

                    @media (max-width: 900px) {
                        .eb-management-page {
                            padding: 20px;
                        }
                    }

                    @media (max-width: 700px) {
                        .eb-management-header {
                            flex-direction: column;
                            align-items: flex-start;
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
        alignItems: "flex-start",
        gap: "10px",
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
        minWidth: "1000px",
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

    credentialButton: {
        border:
            "1px solid #D1E0FF",
        background: "#EEF4FF",
        color: "#266EFF",
        borderRadius: "7px",
        padding: "7px 9px",
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
        fontSize: "10px",
        fontWeight: 700,
    },

    credentialUnavailable: {
        color: "#98A2B3",
        fontSize: "12px",
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
        width: "165px",
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
        maxWidth: "560px",
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

    photoArea: {
        border:
            "1px dashed #D0D5DD",
        borderRadius: "12px",
        padding: "15px",
    },

    photoPlaceholder: {
        height: "180px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        color: "#98A2B3",
        background: "#F9FAFB",
        borderRadius: "9px",
    },

    photoPreview: {
        width: "100%",
        height: "220px",
        objectFit: "cover",
        borderRadius: "9px",
        display: "block",
    },

    photoButtons: {
        display: "flex",
        gap: "9px",
        marginTop: "11px",
    },

    secondaryButton: {
        border:
            "1px solid #D0D5DD",
        background: "#ffffff",
        color: "#344054",
        borderRadius: "8px",
        padding: "9px 13px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: 600,
    },

    cameraArea: {
        background: "#101828",
        borderRadius: "12px",
        padding: "12px",
    },

    video: {
        width: "100%",
        maxHeight: "300px",
        objectFit: "cover",
        borderRadius: "8px",
        display: "block",
    },

    cameraButtons: {
        display: "flex",
        gap: "9px",
        marginTop: "10px",
    },

    primarySmallButton: {
        border: "none",
        background: "#266EFF",
        color: "#ffffff",
        borderRadius: "8px",
        padding: "9px 13px",
        cursor: "pointer",
        fontSize: "11px",
        fontWeight: 700,
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

    dangerButton: {
        border: "none",
        background: "#D92D20",
        color: "#ffffff",
        borderRadius: "8px",
        padding: "10px 15px",
        cursor: "pointer",
        fontSize: "12px",
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        gap: "7px",
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

export default ElectoralBoardManagement;