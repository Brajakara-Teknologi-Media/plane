/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TInboxIssueStatus } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// store types
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
// local imports
import { PrintButton } from "../print-button";
import { PrintDocument } from "../print-document";
import { PrintHtml } from "../print-html";
import { PrintFields, PrintSection } from "../print-section";

export const INTAKE_STATUS_LABELS: Record<number, string> = {
  [-2]: "Pending",
  [-1]: "Declined",
  0: "Snoozed",
  1: "Accepted",
  2: "Duplicate",
  3: "Resolved",
};

const CELL = "border border-neutral-300 px-2 py-1 align-top";

const formatDateTime = (value?: string | Date | null) => (value ? new Date(value).toLocaleString("en-US") : "—");

type SingleProps = {
  inboxIssue: IInboxIssueStore;
};

/** Button + print document for an intake request. */
export const IntakePrintAction = observer(function IntakePrintAction(props: SingleProps) {
  const { inboxIssue } = props;
  const { t } = useTranslation();
  const { getProjectById, getProjectIdentifierById } = useProject();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();

  const issue = inboxIssue.issue;
  const identifier = issue?.project_id
    ? `${getProjectIdentifierById(issue.project_id) ?? ""}-${issue.sequence_id}`
    : "";
  const priority = ISSUE_PRIORITIES.find((item) => item.key === issue?.priority);
  const title = `Request ${identifier} — ${issue?.name ?? ""}`;

  return (
    <>
      <PrintButton documentTitle={title} auditEntity="intake" auditEntityId={issue?.id ?? ""} />
      <PrintDocument
        title={title}
        subtitle={issue?.project_id ? getProjectById(issue.project_id)?.name : undefined}
        meta={[{ label: t("print.labels.status"), value: INTAKE_STATUS_LABELS[inboxIssue.status as number] }]}
      >
        <PrintSection title={t("common.properties")}>
          <PrintFields
            items={[
              { label: t("print.labels.status"), value: INTAKE_STATUS_LABELS[inboxIssue.status as number] ?? "—" },
              { label: "Source", value: inboxIssue.source ?? "—" },
              { label: "Requester", value: getUserDetails(inboxIssue.created_by ?? "")?.display_name ?? "—" },
              { label: t("common.state"), value: issue?.state_id ? (getStateById(issue.state_id)?.name ?? "—") : "—" },
              { label: "Priority", value: priority ? t(priority.titleTranslationKey) : "—" },
              { label: t("common.created_at"), value: formatDateTime(issue?.created_at) },
              {
                label: "Snoozed until",
                value: inboxIssue.snoozed_till ? formatDateTime(inboxIssue.snoozed_till) : "—",
              },
              {
                label: t("print.table.due_date"),
                value: issue?.target_date ? renderFormattedDate(issue.target_date) : "—",
              },
              { label: t("print.labels.duplicate_of"), value: inboxIssue.duplicate_issue_detail?.name ?? "—" },
            ]}
          />
        </PrintSection>

        <PrintSection title="Description">
          <PrintHtml html={issue?.description_html} fallback="No description." />
        </PrintSection>
      </PrintDocument>
    </>
  );
});

export type TIntakeListRecord = {
  id: string;
  status: TInboxIssueStatus | number;
  created_at?: string;
  project?: { identifier?: string; name?: string } | null;
  issue?: { name?: string } | null;
};

type ListProps = {
  title: string;
  subtitle?: string | null;
  statusLabel?: string;
  records: TIntakeListRecord[];
};

/** Print document for the requests list. */
export const IntakeListPrintDocument = observer(function IntakeListPrintDocument(props: ListProps) {
  const { title, subtitle, statusLabel, records } = props;
  const { t } = useTranslation();

  return (
    <PrintDocument
      title={title}
      subtitle={subtitle}
      meta={[
        { label: t("print.labels.status"), value: statusLabel },
        { label: t("print.labels.total"), value: t("print.counts.requests", { count: records.length }) },
      ]}
    >
      {records.length === 0 ? (
        <p className="text-xs py-4">{t("print.intake.empty")}</p>
      ) : (
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-neutral-100 text-left">
              <th className={CELL}>{t("common.project")}</th>
              <th className={CELL}>Request</th>
              <th className={CELL}>{t("print.labels.status")}</th>
              <th className={CELL}>{t("common.created_at")}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td className={CELL}>{record.project?.identifier ?? record.project?.name ?? "—"}</td>
                <td className={CELL}>{record.issue?.name ?? "Untitled"}</td>
                <td className={CELL}>{INTAKE_STATUS_LABELS[record.status as number] ?? "—"}</td>
                <td className={CELL}>{formatDateTime(record.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PrintDocument>
  );
});
