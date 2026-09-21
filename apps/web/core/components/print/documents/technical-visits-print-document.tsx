/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { useTranslation } from "@plane/i18n";
// local imports
import { PrintDocument } from "../print-document";
import { PrintHtml } from "../print-html";
import { PrintFields, PrintSection } from "../print-section";

export type TTechnicalVisitRecord = {
  id: string;
  visit_number?: number | string | null;
  status?: number;
  status_label?: string | null;
  city?: string | null;
  contacts?: string | null;
  period?: string | null;
  scheduled_date?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
  summary?: string | null;
  conclusion?: string | null;
  mot_update?: boolean;
  mot_bug_fix?: boolean;
  mot_training?: boolean;
  mot_improvement?: boolean;
  mot_commercial?: boolean;
  mot_other?: boolean;
  mot_other_description?: string | null;
  entity?: { name?: string | null } | null;
};

const MOTIVATION_LABELS: { key: keyof TTechnicalVisitRecord; label: string }[] = [
  { key: "mot_update", label: "print.visits.mot_update" },
  { key: "mot_bug_fix", label: "print.visits.mot_bug_fix" },
  { key: "mot_training", label: "print.visits.mot_training" },
  { key: "mot_improvement", label: "print.visits.mot_improvement" },
  { key: "mot_commercial", label: "print.visits.mot_commercial" },
  { key: "mot_other", label: "print.visits.mot_other" },
];

const CELL = "border border-neutral-300 px-2 py-1 align-top";

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("en-US") : "—");

type ListProps = {
  visits: TTechnicalVisitRecord[];
  subtitle?: string | null;
  statusLabel?: string;
};

/** Print document for the technical visits list. */
export const TechnicalVisitsPrintDocument = function TechnicalVisitsPrintDocument(props: ListProps) {
  const { visits, subtitle, statusLabel } = props;
  const { t } = useTranslation();
  return (
    <PrintDocument
      title="Technical visits"
      subtitle={subtitle}
      meta={[
        { label: t("print.labels.status"), value: statusLabel },
        { label: t("print.labels.total"), value: t("print.counts.visits", { count: visits.length }) },
      ]}
    >
      {visits.length === 0 ? (
        <p className="text-xs py-4">{t("print.visits.empty")}</p>
      ) : (
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-neutral-100 text-left">
              <th className={CELL}>Nº</th>
              <th className={CELL}>Entity</th>
              <th className={CELL}>{t("print.labels.city")}</th>
              <th className={CELL}>{t("print.labels.scheduled_for")}</th>
              <th className={CELL}>{t("print.labels.situation")}</th>
              <th className={CELL}>{t("print.labels.contacts")}</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => (
              <tr key={visit.id}>
                <td className={CELL}>{visit.visit_number ?? "—"}</td>
                <td className={CELL}>{visit.entity?.name ?? "—"}</td>
                <td className={CELL}>{visit.city ?? "—"}</td>
                <td className={CELL}>{formatDateTime(visit.scheduled_date)}</td>
                <td className={CELL}>{visit.status_label ?? "—"}</td>
                <td className={CELL}>{visit.contacts ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PrintDocument>
  );
};

type DetailProps = {
  visit: TTechnicalVisitRecord;
};

/** Print document for a technical visit report. */
export const TechnicalVisitPrintDocument = function TechnicalVisitPrintDocument(props: DetailProps) {
  const { visit } = props;
  const { t } = useTranslation();

  const motivations = MOTIVATION_LABELS.filter(({ key }) => !!visit[key])
    .map(({ label }) => t(label))
    .concat(visit.mot_other && visit.mot_other_description ? [visit.mot_other_description] : [])
    .join(", ");

  return (
    <PrintDocument
      title={`Technical visit ${visit.visit_number ? `#${visit.visit_number}` : ""}`.trim()}
      subtitle={visit.entity?.name}
      meta={[{ label: t("print.labels.status"), value: visit.status_label }]}
    >
      <PrintSection title={t("print.visits.data_section")}>
        <PrintFields
          items={[
            { label: "Entity", value: visit.entity?.name ?? "—" },
            { label: t("print.labels.city"), value: visit.city ?? "—" },
            { label: t("print.labels.status"), value: visit.status_label ?? "—" },
            { label: t("print.labels.scheduled_for"), value: formatDateTime(visit.scheduled_date) },
            { label: "Home", value: formatDateTime(visit.started_at) },
            { label: "End date", value: formatDateTime(visit.finished_at) },
            { label: "Period", value: visit.period ?? "—" },
            { label: t("print.labels.contacts"), value: visit.contacts ?? "—" },
            { label: t("print.labels.motivations"), value: motivations || "—" },
          ]}
        />
      </PrintSection>

      <PrintSection title={t("print.visits.summary_section")}>
        <PrintHtml html={visit.summary} fallback={t("print.visits.no_summary")} />
      </PrintSection>

      <PrintSection title={t("common.conclusion")}>
        <PrintHtml html={visit.conclusion} fallback="No conclusion." />
      </PrintSection>
    </PrintDocument>
  );
};
