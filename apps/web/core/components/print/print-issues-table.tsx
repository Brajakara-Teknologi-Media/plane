/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { ISSUE_PRIORITIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";

type Props = {
  issues: TIssue[];
  /** Hides the project column on screens already scoped to a project. */
  showProject?: boolean;
  emptyMessage?: string;
};

const CELL = "border border-neutral-300 px-2 py-1 align-top";

/** Compact work item table used by all print documents. */
export const PrintIssuesTable = observer(function PrintIssuesTable(props: Props) {
  const { issues, showProject = true, emptyMessage = "No tickets found." } = props;
  const { t } = useTranslation();
  const { getStateById } = useProjectState();
  const { getProjectById, getProjectIdentifierById } = useProject();
  const { getUserDetails } = useMember();

  if (issues.length === 0) return <p className="text-xs py-4">{emptyMessage}</p>;

  const priorityLabel = (priority: TIssue["priority"]) => {
    const entry = ISSUE_PRIORITIES.find((item) => item.key === priority);
    return entry ? t(entry.titleTranslationKey) : "—";
  };

  const assigneeNames = (issue: TIssue) =>
    (issue.assignee_ids ?? [])
      .map((id) => getUserDetails(id)?.display_name)
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <table className="w-full border-collapse text-[10px]">
      <thead>
        <tr className="bg-neutral-100 text-left">
          <th className={CELL}>ID</th>
          <th className={CELL}>{t("common.title")}</th>
          {showProject && <th className={CELL}>{t("common.project")}</th>}
          <th className={CELL}>{t("common.state")}</th>
          <th className={CELL}>{t("common.priority")}</th>
          <th className={CELL}>{t("common.assignee")}</th>
          <th className={CELL}>{t("print.table.due_date")}</th>
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => (
          <tr key={issue.id}>
            <td className={CELL}>
              {getProjectIdentifierById(issue.project_id) ?? ""}-{issue.sequence_id}
            </td>
            <td className={CELL}>{issue.name}</td>
            {showProject && <td className={CELL}>{getProjectById(issue.project_id)?.name ?? "—"}</td>}
            <td className={CELL}>{getStateById(issue.state_id)?.name ?? "—"}</td>
            <td className={CELL}>{priorityLabel(issue.priority)}</td>
            <td className={CELL}>{assigneeNames(issue)}</td>
            <td className={CELL}>{issue.target_date ? renderFormattedDate(issue.target_date) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});
