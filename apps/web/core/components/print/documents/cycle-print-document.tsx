/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType } from "@plane/types";
import { useTranslation } from "@plane/i18n";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// local imports
import { PrintButton } from "../print-button";
import { PrintDocument } from "../print-document";
import { PrintIssuesTable } from "../print-issues-table";
import { PrintFields, PrintSection } from "../print-section";
import { usePrintableIssues } from "../use-printable-issues";

type Props = {
  cycleId: string;
};

/** Cycle overview + work items currently listed. */
export const CyclePrintDocument = observer(function CyclePrintDocument(props: Props) {
  const { cycleId } = props;
  const { getCycleById } = useCycle();
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const { t } = useTranslation();
  const issues = usePrintableIssues(EIssuesStoreType.CYCLE);

  const cycle = getCycleById(cycleId);
  if (!cycle) return null;

  const title = t("print.cycle.document_title", { name: cycle.name });

  return (
    <>
      <PrintButton documentTitle={title} auditEntity="cycle" auditEntityId={cycleId} />
      <PrintDocument title={title} subtitle={getProjectById(cycle.project_id)?.name}>
        <PrintSection title="Overview">
          <PrintFields
            items={[
              { label: "Home", value: cycle.start_date ? renderFormattedDate(cycle.start_date) : "—" },
              { label: "End date", value: cycle.end_date ? renderFormattedDate(cycle.end_date) : "—" },
              { label: "Responsible", value: getUserDetails(cycle.owned_by_id)?.display_name ?? "—" },
              { label: "Total work items", value: String(cycle.total_issues ?? 0) },
              { label: "Completed", value: String(cycle.completed_issues ?? 0) },
              { label: "In Progress", value: String(cycle.started_issues ?? 0) },
              { label: "Unstarted", value: String(cycle.unstarted_issues ?? 0) },
              { label: "Backlog", value: String(cycle.backlog_issues ?? 0) },
              { label: "Cancelled", value: String(cycle.cancelled_issues ?? 0) },
            ]}
          />
        </PrintSection>

        {cycle.description && (
          <PrintSection title="Description">
            <p>{cycle.description}</p>
          </PrintSection>
        )}

        <PrintSection title={`Work Items (${issues.length})`}>
          <PrintIssuesTable issues={issues} showProject={false} />
        </PrintSection>
      </PrintDocument>
    </>
  );
});
