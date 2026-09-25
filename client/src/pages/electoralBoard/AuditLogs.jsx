import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import api from "../../services/api";

import "./AuditLogs.css";


// =========================================================
// AUDIT LOGS
// =========================================================

function AuditLogs() {

    // -----------------------------------------------------
    // STATE
    // -----------------------------------------------------

    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [moduleFilter, setModuleFilter] = useState("");

    const [actionFilter, setActionFilter] = useState("");

    const [dateFrom, setDateFrom] = useState("");

    const [dateTo, setDateTo] = useState("");

    const [page, setPage] = useState(1);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });

    const [selectedLog, setSelectedLog] = useState(null);

    const [detailsLoading, setDetailsLoading] = useState(false);

    // -----------------------------------------------------
    // LOAD AUDIT LOGS
    // -----------------------------------------------------

    const loadLogs = useCallback(
        async (requestedPage = page) => {

            try {

                setLoading(true);
                setError("");

                const params = {
                    page: requestedPage,
                    limit: 20
                };

                if (search.trim()) {
                    params.search =
                        search.trim();
                }

                if (moduleFilter) {
                    params.module =
                        moduleFilter;
                }

                if (actionFilter) {
                    params.action =
                        actionFilter;
                }

                if (dateFrom) {
                    params.date_from =
                        dateFrom;
                }

                if (dateTo) {
                    params.date_to =
                        dateTo;
                }

                const response =
                    await api.get(
                        "/electoral-board/audit-logs",
                        {
                            params
                        }
                    );

                const data =
                    response?.data || {};

                if (!data.success) {
                    throw new Error(
                        data.message ||
                        "Unable to load audit logs."
                    );
                }

                setLogs(
                    Array.isArray(data.logs)
                        ? data.logs
                        : []
                );

                setPagination(
                    data.pagination || {
                        page: requestedPage,
                        limit: 20,
                        total: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                );

                setPage(
                    data.pagination?.page ||
                    requestedPage
                );

            } catch (err) {

                console.error(
                    "Audit Logs error:",
                    err
                );

                setLogs([]);

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Unable to load audit logs."
                );

            } finally {

                setLoading(false);

            }
        },
        [
            page,
            search,
            moduleFilter,
            actionFilter,
            dateFrom,
            dateTo
        ]
    );

    // -----------------------------------------------------
    // INITIAL LOAD
    // -----------------------------------------------------

    useEffect(() => {

        loadLogs(1);

    }, []);

    // -----------------------------------------------------
    // MODULE OPTIONS
    // -----------------------------------------------------

    const moduleOptions = useMemo(() => {

        const modules =
            logs
                .map(
                    (log) =>
                        log?.module
                )
                .filter(Boolean);

        return [
            ...new Set(modules)
        ].sort();

    }, [logs]);

    // -----------------------------------------------------
    // ACTION OPTIONS
    // -----------------------------------------------------

    const actionOptions = useMemo(() => {

        const actions =
            logs
                .map(
                    (log) =>
                        log?.action
                )
                .filter(Boolean);

        return [
            ...new Set(actions)
        ].sort();

    }, [logs]);

    // -----------------------------------------------------
    // SEARCH / FILTER
    // -----------------------------------------------------

    const handleApplyFilters = () => {

        setPage(1);

        loadLogs(1);

    };

    // -----------------------------------------------------
    // CLEAR FILTERS
    // -----------------------------------------------------

    const handleClearFilters = () => {

        setSearch("");

        setModuleFilter("");

        setActionFilter("");

        setDateFrom("");

        setDateTo("");

        setPage(1);

        setTimeout(() => {
            loadLogs(1);
        }, 0);

    };

    // -----------------------------------------------------
    // REFRESH
    // -----------------------------------------------------

    const handleRefresh = () => {

        loadLogs(page);

    };

    // -----------------------------------------------------
    // PAGINATION
    // -----------------------------------------------------

    const handlePrevious = () => {

        if (
            pagination.hasPreviousPage
        ) {

            const nextPage =
                page - 1;

            setPage(nextPage);

            loadLogs(nextPage);

        }

    };

    const handleNext = () => {

        if (
            pagination.hasNextPage
        ) {

            const nextPage =
                page + 1;

            setPage(nextPage);

            loadLogs(nextPage);

        }

    };

    // -----------------------------------------------------
    // VIEW DETAILS
    // -----------------------------------------------------

    const handleViewDetails = async (
        log
    ) => {

        if (!log?.id) {
            return;
        }

        try {

            setDetailsLoading(true);

            setSelectedLog(log);

            const response =
                await api.get(
                    `/electoral-board/audit-logs/${log.id}`
                );

            const data =
                response?.data || {};

            if (
                data.success &&
                data.log
            ) {
                setSelectedLog({
                    ...data.log,
                    related:
                        data.related || {}
                });
            }

        } catch (err) {

            console.error(
                "Audit Log details error:",
                err
            );

        } finally {

            setDetailsLoading(false);

        }
    };

    // -----------------------------------------------------
    // CLOSE DETAILS
    // -----------------------------------------------------

    const closeDetails = () => {

        setSelectedLog(null);

    };

    // -----------------------------------------------------
    // FORMAT DATE
    // -----------------------------------------------------

    const formatDateTime = (
        value
    ) => {

        if (!value) {
            return "—";
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

        return date.toLocaleString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit"
            }
        );
    };

    // -----------------------------------------------------
    // FORMAT SHORT DATE
    // -----------------------------------------------------

    const formatShortDate = (
        value
    ) => {

        if (!value) {
            return "—";
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

        return date.toLocaleDateString(
            "en-PH",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    };

    // -----------------------------------------------------
    // ACTION LABEL
    // -----------------------------------------------------

    const formatAction = (
        action
    ) => {

        if (!action) {
            return "Activity";
        }

        return String(action)
            .replace(/_/g, " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );

    };

    // -----------------------------------------------------
    // ACTION CLASS
    // -----------------------------------------------------

    const getActionClass = (
        action
    ) => {

        const normalized =
            String(
                action || ""
            ).toLowerCase();

        if (
            normalized.includes("approve") ||
            normalized.includes("activate") ||
            normalized.includes("publish") ||
            normalized.includes("open")
        ) {
            return "success";
        }

        if (
            normalized.includes("reject") ||
            normalized.includes("deactivate") ||
            normalized.includes("delete") ||
            normalized.includes("close")
        ) {
            return "danger";
        }

        if (
            normalized.includes("login") ||
            normalized.includes("logout")
        ) {
            return "security";
        }

        if (
            normalized.includes("update") ||
            normalized.includes("edit")
        ) {
            return "warning";
        }

        return "default";

    };

    // -----------------------------------------------------
    // MODULE ICON
    // -----------------------------------------------------

    const getModuleIcon = (
        module
    ) => {

        const normalized =
            String(
                module || ""
            ).toLowerCase();

        if (
            normalized.includes(
                "registration"
            )
        ) {
            return "▤";
        }

        if (
            normalized.includes(
                "candidate"
            )
        ) {
            return "♙";
        }

        if (
            normalized.includes(
                "party"
            )
        ) {
            return "▰";
        }

        if (
            normalized.includes(
                "election"
            )
        ) {
            return "◉";
        }

        if (
            normalized.includes(
                "voting"
            )
        ) {
            return "◫";
        }

        if (
            normalized.includes(
                "result"
            )
        ) {
            return "▥";
        }

        if (
            normalized.includes(
                "security"
            )
        ) {
            return "♢";
        }

        return "◌";

    };

    // -----------------------------------------------------
    // READABLE METADATA
    // -----------------------------------------------------

    const getReadableMetadata = (
        log
    ) => {
        const metadata =
            log?.metadata || {};

        const related =
            log?.related || {};

        const rows = [];

        // Candidate-specific information
        if (
            String(
                log?.target_type || ""
            ).toLowerCase() === "candidate" ||
            String(
                log?.module || ""
            ).toLowerCase().includes("candidate")
        ) {
            const candidateName =
                related.targetName ||
                metadata.candidateName;

            const positionName =
                related.positionName;

            const partyListName =
                related.partyListName;

            if (candidateName) {
                rows.push({
                    label: "Candidate",
                    value: candidateName
                });
            }

            if (positionName) {
                rows.push({
                    label: "Position",
                    value: positionName
                });
            }

            rows.push({
                label: "Party List",
                value:
                    partyListName ||
                    "Independent / No Party List"
            });

            return rows;
        }

        // Generic metadata for other modules.
        Object.entries(metadata).forEach(
            ([key, value]) => {
                if (
                    key.toLowerCase().endsWith("id") ||
                    key.toLowerCase() === "id"
                ) {
                    return;
                }

                if (
                    value === null ||
                    value === undefined ||
                    value === ""
                ) {
                    return;
                }

                const label =
                    key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (letter) =>
                            letter.toUpperCase()
                        )
                        .trim();

                rows.push({
                    label,
                    value:
                        typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)
                });
            }
        );

        return rows;
    };

    // -----------------------------------------------------
    // RENDER
    // -----------------------------------------------------

    return (
        <div className="audit-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="audit-header">

                <div>

                    <div className="audit-eyebrow">
                        ELECTORAL BOARD
                    </div>

                    <h1>
                        Audit Logs
                    </h1>

                    <p>
                        Review Electoral Board
                        activities and important
                        system events.
                    </p>

                </div>

                <button
                    type="button"
                    className="audit-refresh-btn"
                    onClick={
                        handleRefresh
                    }
                    disabled={loading}
                >
                    <span>
                        ↻
                    </span>

                    {loading
                        ? "Refreshing..."
                        : "Refresh"}
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="audit-error">

                    <div className="audit-error-icon">
                        !
                    </div>

                    <div>

                        <strong>
                            Unable to load audit logs
                        </strong>

                        <p>
                            {error}
                        </p>

                    </div>

                </div>

            )}


            {/* =================================================
                FILTER PANEL
            ================================================= */}

            <div className="audit-filter-card">

                <div className="audit-filter-title">

                    <div>

                        <span className="audit-filter-icon">
                            ⌕
                        </span>

                        <div>

                            <h2>
                                Search & Filter
                            </h2>

                            <p>
                                Find specific Electoral
                                Board activities.
                            </p>

                        </div>

                    </div>

                </div>


                <div className="audit-filters">

                    {/* Search */}

                    <div className="audit-field audit-search-field">

                        <label>
                            Search
                        </label>

                        <div className="audit-input-wrapper">

                            <span>
                                🔎
                            </span>

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search activity, user, module..."
                                onKeyDown={(event) => {

                                    if (
                                        event.key ===
                                        "Enter"
                                    ) {
                                        handleApplyFilters();
                                    }

                                }}
                            />

                        </div>

                    </div>


                    {/* Module */}

                    <div className="audit-field">

                        <label>
                            Module
                        </label>

                        <select
                            value={
                                moduleFilter
                            }
                            onChange={(event) =>
                                setModuleFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                All Modules
                            </option>

                            {moduleOptions.map(
                                (module) => (
                                    <option
                                        key={module}
                                        value={module}
                                    >
                                        {module}
                                    </option>
                                )
                            )}

                        </select>

                    </div>


                    {/* Action */}

                    <div className="audit-field">

                        <label>
                            Action
                        </label>

                        <select
                            value={
                                actionFilter
                            }
                            onChange={(event) =>
                                setActionFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="">
                                All Actions
                            </option>

                            {actionOptions.map(
                                (action) => (
                                    <option
                                        key={action}
                                        value={action}
                                    >
                                        {formatAction(
                                            action
                                        )}
                                    </option>
                                )
                            )}

                        </select>

                    </div>


                    {/* Date From */}

                    <div className="audit-field">

                        <label>
                            From
                        </label>

                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(event) =>
                                setDateFrom(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    {/* Date To */}

                    <div className="audit-field">

                        <label>
                            To
                        </label>

                        <input
                            type="date"
                            value={dateTo}
                            onChange={(event) =>
                                setDateTo(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    {/* Buttons */}

                    <div className="audit-filter-actions">

                        <button
                            type="button"
                            className="audit-apply-btn"
                            onClick={
                                handleApplyFilters
                            }
                        >
                            Apply Filters
                        </button>

                        <button
                            type="button"
                            className="audit-clear-btn"
                            onClick={
                                handleClearFilters
                            }
                        >
                            Clear
                        </button>

                    </div>

                </div>

            </div>


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="audit-stat-grid">

                <div className="audit-stat-card">

                    <div className="audit-stat-icon">
                        ▤
                    </div>

                    <div>

                        <span>
                            Total Logs
                        </span>

                        <strong>
                            {pagination.total}
                        </strong>

                    </div>

                </div>


                <div className="audit-stat-card">

                    <div className="audit-stat-icon">
                        ◉
                    </div>

                    <div>

                        <span>
                            Current Page
                        </span>

                        <strong>
                            {pagination.totalPages
                                ? `${page} / ${pagination.totalPages}`
                                : "0"}
                        </strong>

                    </div>

                </div>


                <div className="audit-stat-card">

                    <div className="audit-stat-icon">
                        ♢
                    </div>

                    <div>

                        <span>
                            Security Trail
                        </span>

                        <strong>
                            Active
                        </strong>

                    </div>

                </div>


                <div className="audit-stat-card">

                    <div className="audit-stat-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            Access
                        </span>

                        <strong>
                            EB Only
                        </strong>

                    </div>

                </div>

            </div>


            {/* =================================================
                LOG TABLE
            ================================================= */}

            <div className="audit-table-card">

                <div className="audit-table-header">

                    <div>

                        <div className="audit-table-eyebrow">
                            ACTIVITY HISTORY
                        </div>

                        <h2>
                            Electoral Board Activity
                        </h2>

                    </div>

                    <span className="audit-count-badge">
                        {pagination.total}{" "}
                        {pagination.total === 1
                            ? "record"
                            : "records"}
                    </span>

                </div>


                {loading ? (

                    <div className="audit-loading">

                        <div className="audit-spinner">
                        </div>

                        <p>
                            Loading audit logs...
                        </p>

                    </div>

                ) : logs.length === 0 ? (

                    <div className="audit-empty">

                        <div className="audit-empty-icon">
                            ◌
                        </div>

                        <h3>
                            No Audit Logs Found
                        </h3>

                        <p>
                            There are no activities
                            matching the selected
                            filters.
                        </p>

                    </div>

                ) : (

                    <div className="audit-table-wrapper">

                        <table className="audit-table">

                            <thead>

                                <tr>

                                    <th>
                                        Date & Time
                                    </th>

                                    <th>
                                        Electoral Board Member
                                    </th>

                                    <th>
                                        Module
                                    </th>

                                    <th>
                                        Action
                                    </th>

                                    <th>
                                        Description
                                    </th>

                                    <th>
                                        Details
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {logs.map(
                                    (log) => (

                                        <tr
                                            key={
                                                log.id
                                            }
                                        >

                                            {/* Date */}

                                            <td>

                                                <div className="audit-date">

                                                    <strong>
                                                        {formatShortDate(
                                                            log.created_at
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {formatDateTime(
                                                            log.created_at
                                                        ).split(
                                                            ", "
                                                        )[1] ||
                                                            ""}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* Actor */}

                                            <td>

                                                <div className="audit-actor">

                                                    <div className="audit-avatar">

                                                        {(
                                                            log.actor_name ||
                                                            "E"
                                                        )
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase()}

                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {log.actor_name ||
                                                                "Electoral Board"}
                                                        </strong>

                                                        <span>
                                                            {log.actor_email ||
                                                                "—"}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>


                                            {/* Module */}

                                            <td>

                                                <div className="audit-module">

                                                    <span className="audit-module-icon">
                                                        {getModuleIcon(
                                                            log.module
                                                        )}
                                                    </span>

                                                    <span>
                                                        {log.module ||
                                                            "System"}
                                                    </span>

                                                </div>

                                            </td>


                                            {/* Action */}

                                            <td>

                                                <span
                                                    className={`audit-action-badge ${getActionClass(
                                                        log.action
                                                    )}`}
                                                >
                                                    {formatAction(
                                                        log.action
                                                    )}
                                                </span>

                                            </td>


                                            {/* Description */}

                                            <td>

                                                <div className="audit-description">

                                                    {log.description ||
                                                        "No description available."}

                                                </div>

                                            </td>


                                            {/* Details */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="audit-details-btn"
                                                    onClick={() =>
                                                        handleViewDetails(
                                                            log
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}


                {/* =================================================
                    PAGINATION
                ================================================= */}

                {!loading &&
                    logs.length > 0 && (

                        <div className="audit-pagination">

                            <div>

                                Showing{" "}

                                <strong>
                                    {(
                                        (page - 1) *
                                            pagination.limit
                                    ) + 1}
                                </strong>

                                {" "}to{" "}

                                <strong>
                                    {Math.min(
                                        page *
                                            pagination.limit,
                                        pagination.total
                                    )}
                                </strong>

                                {" "}of{" "}

                                <strong>
                                    {pagination.total}
                                </strong>

                            </div>


                            <div className="audit-pagination-buttons">

                                <button
                                    type="button"
                                    onClick={
                                        handlePrevious
                                    }
                                    disabled={
                                        !pagination.hasPreviousPage
                                    }
                                >
                                    ← Previous
                                </button>

                                <span>
                                    Page {page}
                                </span>

                                <button
                                    type="button"
                                    onClick={
                                        handleNext
                                    }
                                    disabled={
                                        !pagination.hasNextPage
                                    }
                                >
                                    Next →
                                </button>

                            </div>

                        </div>

                    )}

            </div>


            {/* =================================================
                SECURITY NOTICE
            ================================================= */}

            <div className="audit-security-notice">

                <div className="audit-security-icon">
                    ♢
                </div>

                <div>

                    <strong>
                        Audit Trail & Privacy
                    </strong>

                    <p>
                        Audit Logs record important
                        Electoral Board activities
                        for accountability and
                        system security. Individual
                        voter selections and ballot
                        choices are not displayed
                        in this module.
                    </p>

                </div>

            </div>


            {/* =================================================
                DETAILS MODAL
            ================================================= */}

            {selectedLog && (

                <div
                    className="audit-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeDetails();
                        }

                    }}
                >

                    <div className="audit-modal">

                        <div className="audit-modal-header">

                            <div>

                                <div className="audit-modal-eyebrow">
                                    AUDIT LOG DETAILS
                                </div>

                                <h2>
                                    Activity Details
                                </h2>

                            </div>

                            <button
                                type="button"
                                className="audit-modal-close"
                                onClick={
                                    closeDetails
                                }
                            >
                                ×
                            </button>

                        </div>


                        {detailsLoading ? (

                            <div className="audit-modal-loading">

                                <div className="audit-spinner">
                                </div>

                                Loading details...

                            </div>

                        ) : (

                            <div className="audit-details">

                                {/* Action */}

                                <div className="audit-detail-highlight">

                                    <span className="audit-detail-icon">
                                        {getModuleIcon(
                                            selectedLog.module
                                        )}
                                    </span>

                                    <div>

                                        <span>
                                            {selectedLog.module ||
                                                "System"}
                                        </span>

                                        <strong>
                                            {formatAction(
                                                selectedLog.action
                                            )}
                                        </strong>

                                    </div>

                                </div>


                                {/* Description */}

                                <div className="audit-detail-section">

                                    <label>
                                        Description
                                    </label>

                                    <p>
                                        {selectedLog.description ||
                                            "No description available."}
                                    </p>

                                </div>


                                {/* Actor */}

                                <div className="audit-detail-grid">

                                    <div>

                                        <label>
                                            Electoral Board Member
                                        </label>

                                        <strong>
                                            {selectedLog.actor_name ||
                                                "—"}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Email
                                        </label>

                                        <strong>
                                            {selectedLog.actor_email ||
                                                "—"}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Role
                                        </label>

                                        <strong>
                                            {selectedLog.actor_role ||
                                                "—"}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Date & Time
                                        </label>

                                        <strong>
                                            {formatDateTime(
                                                selectedLog.created_at
                                            )}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Module
                                        </label>

                                        <strong>
                                            {selectedLog.module ||
                                                "—"}
                                        </strong>

                                    </div>

                                    <div>

                                        <label>
                                            Target Type
                                        </label>

                                        <strong>
                                            {selectedLog.target_type ||
                                                "—"}
                                        </strong>

                                    </div>

                                </div>


                                {/* Related Election */}

                                {(
                                    selectedLog.election_id ||
                                    selectedLog.related?.electionName
                                ) && (

                                    <div className="audit-detail-section">

                                        <label>
                                            Related Election
                                        </label>

                                        <strong>
                                            {selectedLog.related?.electionName ||
                                                "Election information unavailable"}
                                        </strong>

                                    </div>

                                )}


                                {/* Target */}

                                {selectedLog.target_id && (

                                    <div className="audit-detail-section">

                                        <label>
                                            Target
                                        </label>

                                        <strong>
                                            {selectedLog.related?.targetName ||
                                                selectedLog.metadata?.candidateName ||
                                                "Target information unavailable"}
                                        </strong>

                                    </div>

                                )}


                                {/* Additional Information */}

                                {getReadableMetadata(
                                    selectedLog
                                ).length > 0 && (

                                    <div className="audit-detail-section">

                                        <label>
                                            Additional Information
                                        </label>

                                        <div className="audit-readable-details">

                                            {getReadableMetadata(
                                                selectedLog
                                            ).map(
                                                (item) => (
                                                    <div
                                                        className="audit-readable-row"
                                                        key={`${item.label}-${item.value}`}
                                                    >
                                                        <span>
                                                            {item.label}
                                                        </span>

                                                        <strong>
                                                            {item.value}
                                                        </strong>
                                                    </div>
                                                )
                                            )}

                                        </div>

                                    </div>

                                )}


                                {/* Privacy */}

                                <div className="audit-modal-privacy">

                                    <span>
                                        ♢
                                    </span>

                                    <p>
                                        This audit record
                                        does not expose
                                        individual ballot
                                        selections.
                                    </p>

                                </div>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
}

export default AuditLogs;