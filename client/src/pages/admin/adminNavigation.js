export const ADMIN_OVERVIEW = { label: "Overview", path: "/admin-dashboard" };

export const ADMIN_CONFIGURATION = [
    { label: "Maintenance", section: "configuration" },
    { label: "Platform notices", section: "platform-notices" },
    { label: "Backup & restore", section: "backup" },
    { label: "Troubleshooting", section: "troubleshooting" },
    { label: "Security", section: "security" },
].map((item) => ({ ...item, path: `/admin/settings?section=${item.section}` }));

export const ADMIN_NAVIGATION = [
    {
        key: "people",
        label: "People",
        items: [
            { label: "Users & access", path: "/admin/users" },
            { label: "Late enrollees", path: "/admin/late-enrollees" },
        ],
    },
    {
        key: "data",
        label: "Data & reports",
        items: [
            { label: "Data management", path: "/admin/data-management" },
            { label: "Reports", path: "/admin/reports" },
            { label: "Monitoring & logs", path: "/admin/audit-logs" },
        ],
    },
    {
        key: "settings",
        label: "Settings",
        items: [0, 1, 2, 4, 3].map((index) => ADMIN_CONFIGURATION[index]),
    },
];

export function getAdminSection(search) {
    const section = new URLSearchParams(search).get("section");
    return [...ADMIN_CONFIGURATION.map((item) => item.section), "student-reports"].includes(section)
        ? section
        : "configuration";
}

export function isAdminDestinationActive(item, location) {
    const pathname = item.path.split("?")[0];
    const matchesPath = location.pathname === pathname || location.pathname.startsWith(`${pathname}/`);
    return matchesPath && (!item.section || getAdminSection(location.search) === item.section);
}
