/**
 * Renderers for each report. `ReportRenderer` dispatches by reportId.
 * Each function receives the payload already loaded from the API (see ReportsService / backend).
 */
import { useTranslation } from "@plane/i18n";
import {
  BarList,
  fmtDays,
  fmtHours,
  KpiCard,
  KpiGrid,
  PRIORITY_COLORS,
  CHART_PALETTE,
  ReportTable,
  SectionTitle,
  type BarItem,
  type Column,
} from "./ui";

function ticketRef(row: { legacy_ticket_number?: string | null; sequence_id?: number | null }) {
  if (row.legacy_ticket_number) return row.legacy_ticket_number;
  if (row.sequence_id) return `#${row.sequence_id}`;
  return "—";
}

// ── 1. Visão geral de chamados ──────────────────────────────────────────────
function TicketsOverview({ data }: { data: any }) {
  const { t } = useTranslation();
  const k = data.kpis ?? {};
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.tickets_overview.total_tickets")} value={k.total ?? 0} />
        <KpiCard label={t("reports.tickets_overview.completed")} value={k.completed ?? 0} accent="green" />
        <KpiCard label={t("reports.tickets_overview.in_progress")} value={k.in_progress ?? 0} accent="blue" />
        <KpiCard label={t("reports.tickets_overview.pending")} value={k.pending ?? 0} accent="amber" />
        <KpiCard label={t("reports.tickets_overview.cancelled")} value={k.cancelled ?? 0} accent="red" />
        <KpiCard
          label={t("reports.tickets_overview.completion_rate")}
          value={`${k.completion_rate ?? 0}%`}
          accent="green"
        />
        <KpiCard
          label={t("reports.tickets_overview.avg_resolution_time")}
          value={fmtDays(k.avg_resolution_days)}
          hint={t("reports.tickets_overview.avg_resolution_hint")}
        />
      </KpiGrid>

      <SectionTitle>{t("reports.tickets_overview.dist_by_priority")}</SectionTitle>
      <BarList
        items={(data.by_priority ?? []).map(
          (p: any): BarItem => ({ label: p.label, value: p.count, color: PRIORITY_COLORS[p.key] })
        )}
      />

      <SectionTitle>{t("reports.tickets_overview.dist_by_status")}</SectionTitle>
      <BarList
        items={(data.by_status ?? []).map(
          (s: any, i: number): BarItem => ({
            label: s.label,
            value: s.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
    </div>
  );
}

// ── 2. Tickets by system ─────────────────────────────────────────────────
function BySystem({ data }: { data: any }) {
  const { t } = useTranslation();
  const cols: Column<any>[] = [
    {
      key: "name",
      header: t("reports.by_system.col_system"),
      render: (r) => <span className="font-medium text-primary">{r.name}</span>,
    },
    { key: "total", header: t("reports.by_system.col_total"), align: "right" },
    { key: "percentage", header: t("reports.by_system.col_pct"), align: "right", render: (r) => `${r.percentage}%` },
    { key: "completed", header: t("reports.by_system.col_completed"), align: "right" },
    { key: "open", header: t("reports.by_system.col_open"), align: "right" },
    {
      key: "avg",
      header: t("reports.by_system.col_avg"),
      align: "right",
      render: (r) => fmtDays(r.avg_resolution_days),
    },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.by_system.total_tickets")} value={data.total ?? 0} />
        <KpiCard label={t("reports.by_system.systems_with_tickets")} value={data.count ?? 0} />
      </KpiGrid>
      <SectionTitle hint={t("reports.common.top_12")}>{t("reports.by_system.ranking")}</SectionTitle>
      <BarList
        items={(data.rows ?? []).slice(0, 12).map(
          (r: any, i: number): BarItem => ({
            label: r.name,
            value: r.total,
            sub: `${r.percentage}%`,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.by_system.details")}</SectionTitle>
      <ReportTable columns={cols} rows={data.rows ?? []} />
    </div>
  );
}

// ── 3. Tickets by entity ────────────────────────────────────────────────
function ByEntity({ data }: { data: any }) {
  const { t } = useTranslation();
  const cols: Column<any>[] = [
    {
      key: "name",
      header: t("reports.by_entity.col_entity"),
      render: (r) => <span className="font-medium text-primary">{r.name}</span>,
    },
    {
      key: "city",
      header: t("reports.by_entity.col_city"),
      render: (r) => [r.city, r.state].filter(Boolean).join(" / ") || "—",
    },
    { key: "total", header: t("reports.by_entity.col_total"), align: "right" },
    { key: "percentage", header: t("reports.by_entity.col_pct"), align: "right", render: (r) => `${r.percentage}%` },
    { key: "open", header: t("reports.by_entity.col_open"), align: "right" },
    { key: "high_priority", header: t("reports.by_entity.col_high"), align: "right" },
    {
      key: "avg",
      header: t("reports.by_entity.col_avg"),
      align: "right",
      render: (r) => fmtDays(r.avg_resolution_days),
    },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.by_entity.total_tickets")} value={data.total ?? 0} />
        <KpiCard label={t("reports.by_entity.entities_with_tickets")} value={data.count ?? 0} />
      </KpiGrid>
      <SectionTitle hint={t("reports.common.top_12")}>{t("reports.by_entity.ranking")}</SectionTitle>
      <BarList
        items={(data.rows ?? []).slice(0, 12).map(
          (r: any, i: number): BarItem => ({
            label: r.name,
            value: r.total,
            sub: `${r.percentage}%`,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.by_entity.details")}</SectionTitle>
      <ReportTable columns={cols} rows={data.rows ?? []} />
    </div>
  );
}

// ── 4. Tickets by priority ──────────────────────────────────────────────
function ByPriority({ data }: { data: any }) {
  const { t } = useTranslation();
  const cols: Column<any>[] = [
    {
      key: "label",
      header: t("reports.by_priority.col_priority"),
      render: (r) => <span className="font-medium text-primary">{r.label}</span>,
    },
    { key: "total", header: t("reports.by_priority.col_total"), align: "right" },
    { key: "completed", header: t("reports.by_priority.col_completed"), align: "right" },
    { key: "open", header: t("reports.by_priority.col_open"), align: "right" },
    {
      key: "avg",
      header: t("reports.by_priority.col_avg"),
      align: "right",
      render: (r) => fmtDays(r.avg_resolution_days),
    },
  ];
  const critCols: Column<any>[] = [
    {
      key: "ref",
      header: t("reports.by_priority.col_ticket"),
      render: (r) => <span className="font-medium text-primary">{ticketRef(r)}</span>,
    },
    {
      key: "name",
      header: t("reports.by_priority.col_title"),
      render: (r) => <span className="line-clamp-1">{r.name}</span>,
    },
    { key: "priority_label", header: t("reports.by_priority.col_priority") },
    { key: "project", header: t("reports.by_priority.col_system"), render: (r) => r.project ?? "—" },
    { key: "entity", header: t("reports.by_priority.col_entity"), render: (r) => r.entity ?? "—" },
    { key: "age_days", header: t("reports.by_priority.col_age"), align: "right", render: (r) => `${r.age_days} d` },
  ];
  return (
    <div>
      <SectionTitle>{t("reports.by_priority.dist_by_priority")}</SectionTitle>
      <BarList
        items={(data.rows ?? []).map(
          (r: any): BarItem => ({ label: r.label, value: r.total, color: PRIORITY_COLORS[r.key] })
        )}
      />
      <SectionTitle>{t("reports.by_priority.perf_by_priority")}</SectionTitle>
      <ReportTable columns={cols} rows={data.rows ?? []} />
      <SectionTitle hint={t("reports.by_priority.critical_hint")}>
        {t("reports.by_priority.critical_list")}
      </SectionTitle>
      <ReportTable columns={critCols} rows={data.critical ?? []} emptyLabel={t("reports.by_priority.no_critical")} />
    </div>
  );
}

// ── 5. Tickets by activity type ───────────────────────────────────────
function ByType({ data }: { data: any }) {
  const { t } = useTranslation();
  const cols: Column<any>[] = [
    {
      key: "name",
      header: t("reports.by_type.col_type"),
      render: (r) => (
        <span className="flex items-center gap-2 font-medium text-primary">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
          {r.name}
        </span>
      ),
    },
    { key: "total", header: t("reports.by_type.col_total"), align: "right" },
    { key: "completed", header: t("reports.by_type.col_completed"), align: "right" },
    { key: "open", header: t("reports.by_type.col_open"), align: "right" },
    { key: "avg", header: t("reports.by_type.col_avg"), align: "right", render: (r) => fmtDays(r.avg_resolution_days) },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.by_type.analyzed_tickets")} value={data.total_issues ?? 0} />
        <KpiCard label={t("reports.by_type.without_label")} value={data.untagged ?? 0} accent="amber" />
        <KpiCard label={t("reports.by_type.distinct_types")} value={(data.rows ?? []).length} />
      </KpiGrid>
      <SectionTitle>{t("reports.by_type.volume_by_type")}</SectionTitle>
      <BarList
        items={(data.rows ?? [])
          .slice(0, 14)
          .map((r: any): BarItem => ({ label: r.name, value: r.total, color: r.color }))}
      />
      <SectionTitle>{t("reports.by_type.details")}</SectionTitle>
      <ReportTable columns={cols} rows={data.rows ?? []} />
    </div>
  );
}

// ── 6. Productivity by technician ────────────────────────────────────────────
function Productivity({ data }: { data: any }) {
  const { t } = useTranslation();
  const cols: Column<any>[] = [
    {
      key: "name",
      header: t("reports.productivity.col_assignee"),
      render: (r) => <span className="font-medium text-primary">{r.name}</span>,
    },
    { key: "assigned", header: t("reports.productivity.col_assigned"), align: "right" },
    { key: "completed", header: t("reports.productivity.col_resolved"), align: "right" },
    {
      key: "completion_rate",
      header: t("reports.productivity.col_rate"),
      align: "right",
      render: (r) => `${r.completion_rate}%`,
    },
    {
      key: "avg",
      header: t("reports.productivity.col_avg"),
      align: "right",
      render: (r) => fmtDays(r.avg_resolution_days),
    },
    {
      key: "logged_hours",
      header: t("reports.productivity.col_hours"),
      align: "right",
      render: (r) => fmtHours(r.logged_hours),
    },
    { key: "interactions", header: t("reports.productivity.col_interactions"), align: "right" },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.productivity.people_active")} value={data.count ?? 0} />
      </KpiGrid>
      <SectionTitle hint={t("reports.productivity.workload_hint")}>{t("reports.productivity.workload")}</SectionTitle>
      <BarList
        items={(data.rows ?? []).slice(0, 12).map(
          (r: any, i: number): BarItem => ({
            label: r.name,
            value: r.assigned,
            sub: `${r.completed} resolv.`,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.productivity.details")}</SectionTitle>
      <ReportTable columns={cols} rows={data.rows ?? []} />
    </div>
  );
}

// ── 7. Time spent ──────────────────────────────────────────────────────────
function TimeTracking({ data }: { data: any }) {
  const { t } = useTranslation();
  const k = data.kpis ?? {};
  const issueCols: Column<any>[] = [
    {
      key: "ref",
      header: t("reports.time_tracking.col_ticket"),
      render: (r) => <span className="font-medium text-primary">{ticketRef(r)}</span>,
    },
    {
      key: "name",
      header: t("reports.time_tracking.col_title"),
      render: (r) => <span className="line-clamp-1">{r.name}</span>,
    },
    { key: "project", header: t("reports.time_tracking.col_system"), render: (r) => r.project ?? "—" },
    { key: "hours", header: t("reports.time_tracking.col_hours"), align: "right", render: (r) => fmtHours(r.hours) },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.time_tracking.total_logged")} value={fmtHours(k.total_hours)} />
        <KpiCard label={t("reports.time_tracking.entries")} value={k.entries ?? 0} />
        <KpiCard label={t("reports.time_tracking.avg_per_entry")} value={`${k.avg_minutes_per_entry ?? 0} min`} />
      </KpiGrid>
      <SectionTitle>{t("reports.time_tracking.hours_by_user")}</SectionTitle>
      <BarList
        unit="h"
        items={(data.by_user ?? []).slice(0, 12).map(
          (u: any, i: number): BarItem => ({
            label: u.name,
            value: u.hours,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.time_tracking.hours_by_system")}</SectionTitle>
      <BarList
        unit="h"
        items={(data.by_system ?? []).slice(0, 12).map(
          (s: any, i: number): BarItem => ({
            label: s.name,
            value: s.hours,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.time_tracking.top_tickets")}</SectionTitle>
      <ReportTable columns={issueCols} rows={data.top_issues ?? []} />
    </div>
  );
}

// ── 8. Interactions / messages ───────────────────────────────────────────────
function Interactions({ data }: { data: any }) {
  const { t } = useTranslation();
  const k = data.kpis ?? {};
  const issueCols: Column<any>[] = [
    {
      key: "ref",
      header: t("reports.interactions.col_ticket"),
      render: (r) => <span className="font-medium text-primary">{ticketRef(r)}</span>,
    },
    {
      key: "name",
      header: t("reports.interactions.col_title"),
      render: (r) => <span className="line-clamp-1">{r.name}</span>,
    },
    { key: "project", header: t("reports.interactions.col_system"), render: (r) => r.project ?? "—" },
    { key: "entity", header: t("reports.interactions.col_entity"), render: (r) => r.entity ?? "—" },
    { key: "interactions", header: t("reports.interactions.col_interactions"), align: "right" },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.interactions.total_interactions")} value={k.total_interactions ?? 0} />
        <KpiCard label={t("reports.interactions.tickets")} value={k.total_issues ?? 0} />
        <KpiCard label={t("reports.interactions.avg_per_ticket")} value={k.avg_per_issue ?? 0} />
      </KpiGrid>
      <SectionTitle hint={t("reports.interactions.most_active_hint")}>
        {t("reports.interactions.most_active")}
      </SectionTitle>
      <ReportTable columns={issueCols} rows={data.most_active_issues ?? []} />
      <SectionTitle>{t("reports.interactions.by_user")}</SectionTitle>
      <BarList
        items={(data.by_user ?? []).slice(0, 12).map(
          (u: any, i: number): BarItem => ({
            label: u.name,
            value: u.interactions,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.interactions.by_system")}</SectionTitle>
      <BarList
        items={(data.by_system ?? []).slice(0, 12).map(
          (s: any, i: number): BarItem => ({
            label: s.name,
            value: s.interactions,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
    </div>
  );
}

// ── 9. Visits overview ───────────────────────────────────────────────
function VisitsOverview({ data }: { data: any }) {
  const { t } = useTranslation();
  const k = data.kpis ?? {};
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.visits_overview.total_visits")} value={k.total ?? 0} />
        <KpiCard label={t("reports.visits_overview.completed")} value={k.completed ?? 0} accent="green" />
        <KpiCard label={t("reports.visits_overview.scheduled")} value={k.scheduled ?? 0} accent="blue" />
        <KpiCard label={t("reports.visits_overview.cancelled")} value={k.cancelled ?? 0} accent="red" />
        <KpiCard label={t("reports.visits_overview.avg_duration")} value={fmtHours(k.avg_duration_hours)} />
      </KpiGrid>
      <SectionTitle>{t("reports.visits_overview.by_status")}</SectionTitle>
      <BarList
        items={(data.by_status ?? []).map(
          (s: any, i: number): BarItem => ({
            label: s.label,
            value: s.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.visits_overview.by_reason")}</SectionTitle>
      <BarList
        items={(data.by_motive ?? []).map(
          (m: any, i: number): BarItem => ({
            label: m.label,
            value: m.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.visits_overview.by_technician")}</SectionTitle>
      <BarList
        items={(data.by_technician ?? []).slice(0, 12).map(
          (t2: any, i: number): BarItem => ({
            label: t2.name,
            value: t2.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.visits_overview.by_entity")}</SectionTitle>
      <BarList
        items={(data.by_entity ?? []).slice(0, 12).map(
          (e: any, i: number): BarItem => ({
            label: e.name,
            value: e.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.visits_overview.by_city")}</SectionTitle>
      <BarList
        items={(data.by_city ?? []).slice(0, 12).map(
          (c: any, i: number): BarItem => ({
            label: c.name,
            value: c.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
    </div>
  );
}

// ── 10. Temporal trends ──────────────────────────────────────────────────
function Trends({ data }: { data: any }) {
  const { t } = useTranslation();
  const series: any[] = data.series ?? [];
  const cols: Column<any>[] = [
    {
      key: "month",
      header: t("reports.trends.col_month"),
      render: (r) => <span className="font-medium text-primary">{r.month}</span>,
    },
    { key: "created", header: t("reports.trends.col_created"), align: "right" },
    { key: "completed", header: t("reports.trends.col_completed"), align: "right" },
    {
      key: "net",
      header: t("reports.trends.col_net"),
      align: "right",
      render: (r) => (
        <span className={r.net > 0 ? "text-red-600" : "text-green-600"}>{r.net > 0 ? `+${r.net}` : r.net}</span>
      ),
    },
  ];
  return (
    <div>
      <SectionTitle hint={t("reports.trends.created_vs_completed_hint")}>
        {t("reports.trends.created_vs_completed")}
      </SectionTitle>
      <div className="space-y-2">
        {series.map((s) => {
          const max = Math.max(1, ...series.map((x) => Math.max(x.created, x.completed)));
          return (
            <div key={s.month} className="flex items-center gap-3">
              <div className="w-20 shrink-0 text-12 text-secondary">{s.month}</div>
              <div className="flex-1 space-y-1">
                <div className="relative h-3 overflow-hidden rounded bg-surface-2">
                  <div className="bg-blue-500 h-full rounded" style={{ width: `${(s.created / max) * 100}%` }} />
                </div>
                <div className="relative h-3 overflow-hidden rounded bg-surface-2">
                  <div className="bg-green-500 h-full rounded" style={{ width: `${(s.completed / max) * 100}%` }} />
                </div>
              </div>
              <div className="w-24 shrink-0 text-right text-11 tabular-nums">
                <span className="text-blue-600">{s.created}</span> /{" "}
                <span className="text-green-600">{s.completed}</span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-11 text-tertiary">
        <span className="text-blue-600">{t("reports.trends.legend_created")}</span> &nbsp;{" "}
        <span className="text-green-600">{t("reports.trends.legend_completed")}</span>
      </p>
      <SectionTitle>{t("reports.trends.monthly_table")}</SectionTitle>
      <ReportTable columns={cols} rows={series} />
    </div>
  );
}

// ── 11. Backlog aging ───────────────────────────────────────────────────────
function BacklogAging({ data }: { data: any }) {
  const { t } = useTranslation();
  const bucketColors = ["#22c55e", "#eab308", "#f97316", "#ef4444"];
  const oldCols: Column<any>[] = [
    {
      key: "ref",
      header: t("reports.backlog_aging.col_ticket"),
      render: (r) => <span className="font-medium text-primary">{ticketRef(r)}</span>,
    },
    {
      key: "name",
      header: t("reports.backlog_aging.col_title"),
      render: (r) => <span className="line-clamp-1">{r.name}</span>,
    },
    { key: "priority_label", header: t("reports.backlog_aging.col_priority") },
    { key: "project", header: t("reports.backlog_aging.col_system"), render: (r) => r.project ?? "—" },
    { key: "entity", header: t("reports.backlog_aging.col_entity"), render: (r) => r.entity ?? "—" },
    { key: "age_days", header: t("reports.backlog_aging.col_age"), align: "right", render: (r) => `${r.age_days} d` },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.backlog_aging.open_tickets")} value={data.total_open ?? 0} accent="amber" />
      </KpiGrid>
      <SectionTitle>{t("reports.backlog_aging.dist_by_age")}</SectionTitle>
      <BarList
        items={(data.buckets ?? []).map(
          (b: any, i: number): BarItem => ({
            label: b.range,
            value: b.count,
            color: bucketColors[i % bucketColors.length],
          })
        )}
      />
      <SectionTitle hint={t("reports.backlog_aging.aging_hint")}>
        {t("reports.backlog_aging.aging_tickets")}
      </SectionTitle>
      <ReportTable columns={oldCols} rows={data.oldest ?? []} emptyLabel={t("reports.backlog_aging.no_open")} />
    </div>
  );
}

// ── 12. SLA ─────────────────────────────────────────────────────────────────
function Sla({ data }: { data: any }) {
  const { t } = useTranslation();
  const k = data.kpis ?? {};
  const cols: Column<any>[] = [
    {
      key: "label",
      header: t("reports.sla.col_priority"),
      render: (r) => <span className="font-medium text-primary">{r.label}</span>,
    },
    { key: "resolved", header: t("reports.sla.col_resolved"), align: "right" },
    { key: "avg", header: t("reports.sla.col_avg"), align: "right", render: (r) => fmtHours(r.avg_resolution_hours) },
  ];
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.sla.resolved_tickets")} value={k.total_resolved ?? 0} />
        <KpiCard label={t("reports.sla.avg_time")} value={fmtHours(k.avg_resolution_hours)} />
        <KpiCard label={t("reports.sla.within_24h")} value={`${k.pct_within_24h ?? 0}%`} accent="green" />
        <KpiCard label={t("reports.sla.within_72h")} value={`${k.pct_within_72h ?? 0}%`} accent="green" />
      </KpiGrid>
      <SectionTitle>{t("reports.sla.dist_resolution")}</SectionTitle>
      <BarList
        items={(data.bands ?? []).map(
          (b: any, i: number): BarItem => ({
            label: b.range,
            value: b.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle>{t("reports.sla.avg_by_priority")}</SectionTitle>
      <ReportTable columns={cols} rows={data.by_priority ?? []} />
    </div>
  );
}

// ── 13. Executive dashboard ─────────────────────────────────────────────────
function Executive({ data }: { data: any }) {
  const { t } = useTranslation();
  const k = data.kpis ?? {};
  return (
    <div>
      <KpiGrid>
        <KpiCard label={t("reports.executive.total_tickets")} value={k.total_tickets ?? 0} />
        <KpiCard label={t("reports.executive.completed")} value={k.completed ?? 0} accent="green" />
        <KpiCard label={t("reports.executive.completion_rate")} value={`${k.completion_rate ?? 0}%`} accent="green" />
        <KpiCard label={t("reports.executive.open")} value={k.open_total ?? 0} accent="amber" />
        <KpiCard
          label={t("reports.executive.open_high_priority")}
          value={k.open_high_priority ?? 0}
          accent="red"
          hint={t("reports.executive.open_high_hint")}
        />
        <KpiCard label={t("reports.executive.avg_resolution")} value={fmtDays(k.avg_resolution_days)} />
        <KpiCard label={t("reports.executive.logged_hours")} value={fmtHours(k.total_logged_hours)} />
        <KpiCard label={t("reports.executive.technical_visits")} value={k.total_visits ?? 0} accent="blue" />
      </KpiGrid>
      <SectionTitle hint={t("reports.executive.top_systems_hint")}>{t("reports.executive.top_systems")}</SectionTitle>
      <BarList
        items={(data.top_systems ?? []).map(
          (s: any, i: number): BarItem => ({
            label: s.name,
            value: s.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
      <SectionTitle hint={t("reports.executive.top_entities_hint")}>{t("reports.executive.top_entities")}</SectionTitle>
      <BarList
        items={(data.top_entities ?? []).map(
          (e: any, i: number): BarItem => ({
            label: e.name,
            value: e.count,
            color: CHART_PALETTE[i % CHART_PALETTE.length],
          })
        )}
      />
    </div>
  );
}

const RENDERERS: Record<string, (props: { data: any }) => JSX.Element> = {
  "tickets-overview": TicketsOverview,
  "by-system": BySystem,
  "by-entity": ByEntity,
  "by-priority": ByPriority,
  "by-type": ByType,
  productivity: Productivity,
  "time-tracking": TimeTracking,
  interactions: Interactions,
  "visits-overview": VisitsOverview,
  trends: Trends,
  "backlog-aging": BacklogAging,
  sla: Sla,
  executive: Executive,
};

export function ReportRenderer({ reportId, data }: { reportId: string; data: any }) {
  const { t } = useTranslation();
  const Comp = RENDERERS[reportId];
  if (!Comp) return <p className="text-12 text-tertiary">{t("reports.not_found")}</p>;
  return <Comp data={data} />;
}
