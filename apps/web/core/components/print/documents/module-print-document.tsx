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
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
// local imports
import { PrintButton } from "../print-button";
import { PrintDocument } from "../print-document";
import { PrintHtml } from "../print-html";
import { PrintIssuesTable } from "../print-issues-table";
import { PrintFields, PrintSection } from "../print-section";
import { usePrintableIssues } from "../use-printable-issues";

type Props = {
  moduleId: string;
};

/** Module overview + work items currently listed. */
export const ModulePrintDocument = observer(function ModulePrintDocument(props: Props) {
  const { moduleId } = props;
  const { getModuleById } = useModule();
  const { getProjectById } = useProject();
  const { getUserDetails } = useMember();
  const { t } = useTranslation();
  const issues = usePrintableIssues(EIssuesStoreType.MODULE);

  const moduleDetails = getModuleById(moduleId);
  if (!moduleDetails) return null;

  const title = t("print.module.document_title", { name: moduleDetails.name });
  const memberNames = (moduleDetails.member_ids ?? [])
    .map((id) => getUserDetails(id)?.display_name)
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PrintButton documentTitle={title} auditEntity="module" auditEntityId={moduleId} />
      <PrintDocument title={title} subtitle={getProjectById(moduleDetails.project_id)?.name}>
        <PrintSection title="Overview">
          <PrintFields
            items={[
              {
                label: "Home",
                value: moduleDetails.start_date ? renderFormattedDate(moduleDetails.start_date) : "—",
              },
              {
                label: "End date",
                value: moduleDetails.target_date ? renderFormattedDate(moduleDetails.target_date) : "—",
              },
              { label: "Lead", value: getUserDetails(moduleDetails.lead_id ?? "")?.display_name ?? "—" },
              { label: t("common.members"), value: memberNames || "—" },
              { label: t("print.module.total_issues"), value: String(moduleDetails.total_issues ?? 0) },
              { label: "Completed", value: String(moduleDetails.completed_issues ?? 0) },
              { label: "In Progress", value: String(moduleDetails.started_issues ?? 0) },
              { label: "Unstarted", value: String(moduleDetails.unstarted_issues ?? 0) },
              { label: "Backlog", value: String(moduleDetails.backlog_issues ?? 0) },
            ]}
          />
        </PrintSection>

        <PrintSection title="Description">
          <PrintHtml html={moduleDetails.description_html} fallback={moduleDetails.description || "No description."} />
        </PrintSection>

        <PrintSection title={`Work Items (${issues.length})`}>
          <PrintIssuesTable issues={issues} showProject={false} />
        </PrintSection>
      </PrintDocument>
    </>
  );
});
