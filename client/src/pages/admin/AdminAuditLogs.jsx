import React, {
    useCallback,
    useEffect,
    useMemo,
    useState,
    useRef
} from "react";
import api from "../../services/api";
import AdminTopNav from "./AdminTopNav";
import "./AdminAuditLogsView.css";
import { FiActivity, FiAlertCircle, FiArrowLeft, FiArrowRight, FiCalendar, FiChevronRight, FiFileText, FiFilter, FiRefreshCw, FiSearch, FiShield, FiX } from "react-icons/fi";
// =========================================================
// AUDIT LOGS
// =========================================================
/* =========================================================
   HUMAN-READABLE AUDIT METADATA
   Converts technical metadata keys/values into readable
   information without hiding the original recorded values.
   ========================================================= */
const AUDIT_METADATA_LABELS = {
    source: "Source",
    search: "Search",
    yearLevel: "Year Level",
    year_level: "Year Level",
    returnedCount: "Records Returned",
    returned_count: "Records Returned",
    enrollmentStatus: "Enrollment Status",
    enrollment_status: "Enrollment Status",
    targetType: "Target Type",
    target_type: "Target Type",
    studentId: "Student ID",
    student_id: "Student ID",
    candidateId: "Candidate ID",
    candidate_id: "Candidate ID",
    electionId: "Election ID",
    election_id: "Election ID",
    positionId: "Position ID",
    position_id: "Position ID",
    kioskId: "Kiosk ID",
    kiosk_id: "Kiosk ID",
    page: "Page",
    limit: "Records Per Page",
    status: "Status",
    reason: "Reason",
    role: "Role",
    email: "Email",
};
const humanizeAuditKey = (key) => {
    const normalized = String(key ?? "").trim();
    if (AUDIT_METADATA_LABELS[normalized]) {
        return AUDIT_METADATA_LABELS[normalized];
    }
    return normalized
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
};
const formatAuditMetadataValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return "Not provided";
    }
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    if (Array.isArray(value)) {
        return value.length
            ? value.map((item) => formatAuditMetadataValue(item)).join(", ")
            : "None";
    }
    if (typeof value === "object") {
        return Object.entries(value)
            .map(
                ([key, item]) =>
                    `${humanizeAuditKey(key)}: ${formatAuditMetadataValue(item)}`
            )
            .join(" • ");
    }
    return String(value);
};
const getAuditMetadataEntries = (metadata) => {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return [];
    }
    return Object.entries(metadata);
};
function AdminAuditLogs() {
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
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
    });
    const [activitySummary, setActivitySummary] = useState({
        total: 0,
        categories: {
            all: 0,
            authentication: 0,
            elections: 0,
            candidates: 0,
            accounts: 0,
            system: 0,
            security: 0,
            kiosk: 0,
        },
        severity: {
            info: 0,
            success: 0,
            warning: 0,
            critical: 0,
        },
    });
    const [selectedLog, setSelectedLog] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");
    const detailsDialog = useRef(null);
    const detailsRequest = useRef(0);
    useEffect(() => {
        const dialog = detailsDialog.current;
        if (selectedLog && !dialog.open) dialog.showModal();
        else if (!selectedLog && dialog.open) dialog.close();
    }, [selectedLog]);
    // -----------------------------------------------------
    // LOAD AUDIT LOGS
    // -----------------------------------------------------
    const loadLogs = useCallback(
        async (requestedPage = page, filters = { search, moduleFilter, actionFilter, dateFrom, dateTo }) => {
            try {
                setLoading(true);
                setError("");
                const params = {
                    page: requestedPage,
                    limit: 10
                };
                if (filters.search.trim()) {
                    params.search =
                        filters.search.trim();
                }
                if (filters.moduleFilter) {
                    params.module =
                        filters.moduleFilter;
                }
                if (filters.actionFilter) {
                    params.action =
                        filters.actionFilter;
                }
                if (filters.dateFrom) {
                    params.date_from =
                        filters.dateFrom;
                }
                if (filters.dateTo) {
                    params.date_to =
                        filters.dateTo;
                }
                const response =
                    await api.get(
                        "/admin/audit-logs",
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
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPreviousPage: false
                    }
                );
                setActivitySummary(
                    data.summary || {
                        total: data.pagination?.total || 0,
                        categories: {
                            all: data.pagination?.total || 0,
                            authentication: 0,
                            elections: 0,
                            candidates: 0,
                            accounts: 0,
                            system: 0,
                            security: 0,
                            kiosk: 0,
                        },
                        severity: {
                            info: 0,
                            success: 0,
                            warning: 0,
                            critical: 0,
                        },
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
        loadLogs(1, { search: "", moduleFilter: "", actionFilter: "", dateFrom: "", dateTo: "" });
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
        const request = ++detailsRequest.current;
        try {
            setDetailsLoading(true);
            setDetailsError("");
            setSelectedLog(log);
            const response =
                await api.get(
                    `/admin/audit-logs/${encodeURIComponent(log.id)}`
                );
            const data =
                response?.data || {};
            if (request !== detailsRequest.current) return;
            if (
                data.success &&
                data.log
            ) {
                setSelectedLog(
                    data.log
                );
            } else {
                throw new Error(
                    data.message ||
                    "Unable to load audit log details."
                );
            }
        } catch (err) {
            if (request !== detailsRequest.current) return;
            console.error(
                "Audit Log details error:",
                err
            );
            setDetailsError("Unable to refresh this record. Showing the available activity details.");
        } finally {
            if (request === detailsRequest.current) setDetailsLoading(false);
        }
    };
    // -----------------------------------------------------
    // CLOSE DETAILS
    // -----------------------------------------------------
    const closeDetails = () => {
        detailsRequest.current += 1;
        setSelectedLog(null);
    };
    // -----------------------------------------------------
    // FORMAT DATE
    // -----------------------------------------------------
    const formatDateTime = (
        value
    ) => {
        if (!value) {
            return "Not available";
        }
        const date =
            new Date(value);
        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Not available";
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
    const getActivityCategory = (log) => {
        const module = String(log?.module || "").toLowerCase();
        const action = String(log?.action || "").toLowerCase();
        if (
            action.includes("login") ||
            action.includes("logout") ||
            action.includes("password") ||
            action.includes("otp") ||
            action.includes("pin") ||
            module.includes("auth") ||
            module.includes("security")
        ) {
            return "Authentication";
        }
        if (
            module.includes("election") ||
            module.includes("results") ||
            module.includes("voting")
        ) {
            return "Elections";
        }
        if (
            module.includes("candidate") ||
            module.includes("party")
        ) {
            return "Candidates";
        }
        if (
            module.includes("account") ||
            module.includes("admin")
        ) {
            return "Accounts";
        }
        if (
            module.includes("kiosk")
        ) {
            return "Kiosk";
        }
        if (
            action.includes("reject") ||
            action.includes("fail") ||
            action.includes("suspicious") ||
            action.includes("lock")
        ) {
            return "Security";
        }
        return "System";
    };
    // -----------------------------------------------------
    // ACTIVITY SEVERITY
    // -----------------------------------------------------
    const getActivitySeverity = (log) => {
        const action = String(log?.action || "").toLowerCase();
        const description = String(log?.description || "").toLowerCase();
        if (
            action.includes("failed") ||
            action.includes("reject") ||
            action.includes("suspicious") ||
            action.includes("lock") ||
            description.includes("failed") ||
            description.includes("suspicious")
        ) {
            return "Critical";
        }
        if (
            action.includes("warning") ||
            action.includes("correction") ||
            action.includes("deactivate")
        ) {
            return "Warning";
        }
        if (
            action.includes("login") ||
            action.includes("logout") ||
            action.includes("view") ||
            action.includes("search")
        ) {
            return "Info";
        }
        return "Success";
    };
    // -----------------------------------------------------
// RENDER
// -----------------------------------------------------
    const formatTime = (value) => {
        const date = new Date(value);
        return value && !Number.isNaN(date.getTime())
            ? date.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit" })
            : "Not available";
    };
    const formatDay = (value) => {
        const date = new Date(value);
        return value && !Number.isNaN(date.getTime())
            ? date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
            : "Not available";
    };
    const metricValue = (value) => loading ? "…" : error ? "-" : Number(value || 0).toLocaleString();
    const summaryMetrics = [
        ["Matching records", pagination.total, FiFileText],
        ["Authentication", activitySummary.categories?.authentication, FiShield],
        ["Election activity", activitySummary.categories?.elections, FiCalendar],
        ["Warnings & critical", Number(activitySummary.severity?.warning || 0) + Number(activitySummary.severity?.critical || 0), FiAlertCircle],
    ];
    const selectedMetadata = getAuditMetadataEntries(selectedLog?.metadata);
    const firstRecord = (page - 1) * pagination.limit + 1;
    const lastRecord = Math.min(page * pagination.limit, pagination.total);

    return (
        <div className="audit-log-view admin-polished-page">
            <a className="al-skip" href="#audit-log-content">Skip to activity records</a>
            <AdminTopNav />
            <main className="al-main" id="audit-log-content" tabIndex={-1}>
                <header className="al-heading">
                    <div><div className="al-breadcrumb">Administration <span>/</span> Monitoring &amp; logs</div><h1>Audit logs</h1><p>Review account, election, and system activity across VOTARA.</p></div>
                    <button type="button" className="al-button al-secondary" onClick={handleRefresh} disabled={loading}><FiRefreshCw aria-hidden="true" />{loading ? "Refreshing…" : "Refresh"}</button>
                </header>

                {error && <div className="al-error" role="alert"><FiAlertCircle aria-hidden="true" /><div><strong>Unable to load audit logs</strong><p>{error}</p></div><button type="button" onClick={handleRefresh} disabled={loading}>Try again</button></div>}

                <section className="al-summary" aria-label="Activity summary" aria-busy={loading}>
                    {summaryMetrics.map(([label, value, Icon]) => <div className="al-summary-item" key={label}><span className="al-summary-label">{label}</span><Icon className="al-summary-icon" aria-hidden="true" /><strong>{metricValue(value)}</strong></div>)}
                </section>

                <section className="al-records" aria-labelledby="al-records-title">
                    <div className="al-records-heading"><div><h2 id="al-records-title">Activity history</h2><p>Search records or narrow the results with filters.</p></div><span className="al-record-count">{loading ? "Loading records…" : `${Number(pagination.total).toLocaleString()} records`}</span></div>
                    <form className="al-filters" onSubmit={(event) => { event.preventDefault(); handleApplyFilters(); }}>
                        <div className="al-field al-search"><label htmlFor="al-search">Search activity</label><div className="al-search-control"><FiSearch aria-hidden="true" /><input id="al-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity, user, or module" /></div></div>
                        <div className="al-field"><label htmlFor="al-module">Module</label><select id="al-module" value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}><option value="">All modules</option>{[...new Set([...moduleOptions, moduleFilter].filter(Boolean))].map((module) => <option value={module} key={module}>{module}</option>)}</select></div>
                        <div className="al-field"><label htmlFor="al-action">Action</label><select id="al-action" value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}><option value="">All actions</option>{[...new Set([...actionOptions, actionFilter].filter(Boolean))].map((action) => <option value={action} key={action}>{formatAction(action)}</option>)}</select></div>
                        <div className="al-field"><label htmlFor="al-from">From date</label><input id="al-from" type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} /></div>
                        <div className="al-field"><label htmlFor="al-to">To date</label><input id="al-to" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} /></div>
                        <div className="al-filter-actions"><button className="al-button al-primary" type="submit" disabled={loading}><FiFilter aria-hidden="true" />Apply filters</button><button className="al-button al-secondary" type="button" onClick={handleClearFilters} disabled={loading}>Clear</button></div>
                    </form>
                    <div className="al-table-scroll" role="region" aria-label="Audit activity records" tabIndex={0} aria-busy={loading}>
                        <table className="al-table">
                            <caption className="al-visually-hidden">VOTARA audit records. View a record for its complete details and metadata.</caption>
                            <colgroup><col className="al-col-date" /><col className="al-col-actor" /><col className="al-col-activity" /><col className="al-col-description" /><col className="al-col-severity" /><col className="al-col-details" /></colgroup>
                            <thead><tr><th scope="col">Date &amp; time</th><th scope="col">Actor</th><th scope="col">Activity</th><th scope="col">Description</th><th scope="col">Severity</th><th scope="col"><span className="al-visually-hidden">Details</span></th></tr></thead>
                            <tbody>{loading ? [0, 1, 2, 3, 4].map((row) => <tr className="al-loading-row" key={row}>{[0, 1, 2, 3, 4, 5].map((cell) => <td key={cell}><span className="al-skeleton" /></td>)}</tr>) : logs.length === 0 ? <tr><td colSpan={6}><div className="al-empty"><FiSearch size={28} aria-hidden="true" /><h3>{error ? "Records unavailable" : "No matching activity"}</h3><p>{error ? "Try refreshing to load your audit trail." : "Try a different search or clear your filters to view more records."}</p><button type="button" className="al-button al-secondary" onClick={error ? handleRefresh : handleClearFilters}>{error ? "Try again" : "Clear filters"}</button></div></td></tr> : logs.map((log) => {
                                const severity = getActivitySeverity(log);
                                return <tr key={log.id}>
                                    <td><time className="al-date" dateTime={log.created_at || undefined}><strong>{formatDay(log.created_at)}</strong><span>{formatTime(log.created_at)}</span></time></td>
                                    <td><div className="al-actor"><span className="al-avatar" aria-hidden="true">{(log.actor_name || "System").charAt(0).toUpperCase()}</span><div><strong>{log.actor_name || "System"}</strong><span title={log.actor_email || ""}>{log.actor_email || "System activity"}</span></div></div></td>
                                    <td><div className="al-activity"><strong>{formatAction(log.action)}</strong><span>{log.module || "System"}</span><span className="al-category">{getActivityCategory(log)}</span></div></td>
                                    <td><p className="al-description">{log.description || "No description available."}</p></td>
                                    <td><span className={`al-severity al-severity-${severity.toLowerCase()}`}>{severity}</span></td>
                                    <td><button type="button" className="al-view" onClick={() => handleViewDetails(log)} aria-label={`View ${formatAction(log.action)} details`}>View<FiChevronRight aria-hidden="true" /></button></td>
                                </tr>;
                            })}</tbody>
                        </table>
                    </div>
                    <div className="al-pagination"><span aria-live="polite">{loading ? "Loading audit records…" : logs.length ? <>Showing <strong>{firstRecord.toLocaleString()}-{lastRecord.toLocaleString()}</strong> of <strong>{Number(pagination.total).toLocaleString()}</strong> records</> : "0 records shown"}</span><div><button className="al-page-button" type="button" onClick={handlePrevious} disabled={loading || !pagination.hasPreviousPage}><FiArrowLeft aria-hidden="true" /><span>Previous</span></button><span>Page {pagination.totalPages ? page : 0} of {pagination.totalPages || 0}</span><button className="al-page-button" type="button" onClick={handleNext} disabled={loading || !pagination.hasNextPage}><span>Next</span><FiArrowRight aria-hidden="true" /></button></div></div>
                </section>
                <footer className="al-privacy"><FiShield aria-hidden="true" /><p>Audit records support accountability and system security. Individual voter selections and ballot choices are not displayed.</p></footer>
            </main>

            <dialog ref={detailsDialog} className="al-dialog" aria-labelledby="al-detail-title" onCancel={closeDetails} onClick={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
                <div className="al-dialog-content">
                    <header className="al-dialog-header"><div><span>Audit record</span><h2 id="al-detail-title">Activity details</h2></div><button type="button" className="al-close" onClick={closeDetails} aria-label="Close activity details"><FiX aria-hidden="true" /></button></header>
                    {detailsLoading ? <div className="al-detail-loading" role="status" aria-label="Loading activity details">{[0, 1, 2, 3].map((item) => <span className="al-skeleton" key={item} />)}</div> : selectedLog && <>
                        {detailsError && <p className="al-detail-error" role="status">{detailsError}</p>}
                        <section className="al-detail-highlight"><span className="al-detail-icon"><FiActivity size={22} aria-hidden="true" /></span><div><span>{selectedLog.module || "System"}</span><h3>{formatAction(selectedLog.action)}</h3></div><span className={`al-severity al-severity-${getActivitySeverity(selectedLog).toLowerCase()}`}>{getActivitySeverity(selectedLog)}</span></section>
                        <section className="al-detail-description"><h3>Description</h3><p>{selectedLog.description || "No description available."}</p></section>
                        <dl className="al-detail-grid">{[
                            ["Actor", selectedLog.actor_name || "System"], ["Email", selectedLog.actor_email || "Not provided"], ["Role", selectedLog.actor_role || "Not provided"], ["Date & time", formatDateTime(selectedLog.created_at)], ["Module", selectedLog.module || "System"], ["Category", getActivityCategory(selectedLog)], ["Target type", selectedLog.target_type || "Not provided"], ["Record ID", selectedLog.id], ...(selectedLog.election_id ? [["Related election ID", selectedLog.election_id]] : []), ...(selectedLog.target_id ? [["Target ID", selectedLog.target_id]] : []),
                        ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
                        {selectedMetadata.length > 0 && <section className="al-metadata"><h3>Recorded details <span>{selectedMetadata.length}</span></h3><p>Original recorded values, with readable labels.</p><dl>{selectedMetadata.map(([key, value]) => <div key={key}><dt>{humanizeAuditKey(key)}</dt><dd>{formatAuditMetadataValue(value)}</dd></div>)}</dl></section>}
                        <footer className="al-dialog-footer"><span><FiShield aria-hidden="true" />Individual ballot selections are not included.</span><button type="button" className="al-button al-secondary" onClick={closeDetails}>Close details</button></footer>
                    </>}
                </div>
            </dialog>
        </div>
    );
}

export default AdminAuditLogs;
