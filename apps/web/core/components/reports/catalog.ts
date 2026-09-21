/**
 * Management reports catalog.
 * Each item describes a report available at /:workspaceSlug/reports/:reportId.
 * `id` matches the route segment and the ReportsService method / backend endpoint.
 */

export type ReportCategory = "tickets" | "people" | "visits" | "management";

export type ReportMeta = {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  /** lucide icon name (resolvido no componente) */
  icon: string;
  /** applicable filters for this report */
  filters: ("period" | "project" | "entity")[];
};

export const REPORT_CATEGORIES: { key: ReportCategory; label: string; description: string }[] = [
  { key: "tickets", label: "reports.categories.tickets", description: "reports.categories.tickets_desc" },
  { key: "people", label: "reports.categories.people", description: "reports.categories.people_desc" },
  { key: "visits", label: "reports.categories.visits", description: "reports.categories.visits_desc" },
  { key: "management", label: "reports.categories.management", description: "reports.categories.management_desc" },
];

export const REPORTS: ReportMeta[] = [
  {
    id: "tickets-overview",
    title: "reports.tickets_overview.title",
    description: "reports.tickets_overview.description",
    category: "tickets",
    icon: "LayoutDashboard",
    filters: ["period", "project", "entity"],
  },
  {
    id: "by-system",
    title: "reports.by_system.title",
    description: "reports.by_system.description",
    category: "tickets",
    icon: "MonitorSmartphone",
    filters: ["period", "entity"],
  },
  {
    id: "by-entity",
    title: "reports.by_entity.title",
    description: "reports.by_entity.description",
    category: "tickets",
    icon: "Building2",
    filters: ["period", "project"],
  },
  {
    id: "by-priority",
    title: "reports.by_priority.title",
    description: "reports.by_priority.description",
    category: "tickets",
    icon: "Flame",
    filters: ["period", "project", "entity"],
  },
  {
    id: "by-type",
    title: "reports.by_type.title",
    description: "reports.by_type.description",
    category: "tickets",
    icon: "Tags",
    filters: ["period", "project", "entity"],
  },
  {
    id: "productivity",
    title: "reports.productivity.title",
    description: "reports.productivity.description",
    category: "people",
    icon: "Users",
    filters: ["period", "project", "entity"],
  },
  {
    id: "time-tracking",
    title: "reports.time_tracking.title",
    description: "reports.time_tracking.description",
    category: "people",
    icon: "Clock",
    filters: ["period", "project", "entity"],
  },
  {
    id: "interactions",
    title: "reports.interactions.title",
    description: "reports.interactions.description",
    category: "people",
    icon: "MessagesSquare",
    filters: ["period", "project", "entity"],
  },
  {
    id: "visits-overview",
    title: "reports.visits_overview.title",
    description: "reports.visits_overview.description",
    category: "visits",
    icon: "Wrench",
    filters: ["period", "entity"],
  },
  {
    id: "trends",
    title: "reports.trends.title",
    description: "reports.trends.description",
    category: "management",
    icon: "TrendingUp",
    filters: ["project", "entity"],
  },
  {
    id: "backlog-aging",
    title: "reports.backlog_aging.title",
    description: "reports.backlog_aging.description",
    category: "management",
    icon: "Hourglass",
    filters: ["project", "entity"],
  },
  {
    id: "sla",
    title: "reports.sla.title",
    description: "reports.sla.description",
    category: "management",
    icon: "Timer",
    filters: ["period", "project", "entity"],
  },
  {
    id: "executive",
    title: "reports.executive.title",
    description: "reports.executive.description",
    category: "management",
    icon: "Gauge",
    filters: ["period", "project", "entity"],
  },
];

export function getReportMeta(id: string): ReportMeta | undefined {
  return REPORTS.find((r) => r.id === id);
}
