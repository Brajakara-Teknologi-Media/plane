/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { EIssuesStoreType, TGroupedIssues, TIssue, TSubGroupedIssues } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";

type TGroupedIssueIds = TGroupedIssues | TSubGroupedIssues | undefined;

const flattenGroupedIssueIds = (grouped: TGroupedIssueIds): string[] => {
  if (!grouped) return [];
  const ids: string[] = [];
  Object.values(grouped).forEach((group) => {
    if (Array.isArray(group)) {
      ids.push(...group);
      return;
    }
    Object.values(group ?? {}).forEach((subGroup) => {
      if (Array.isArray(subGroup)) ids.push(...subGroup);
    });
  });
  return Array.from(new Set(ids));
};

/**
 * Work Items currently loaded in a layout, already in the order and with the
 * filters the screen applied — that is exactly what goes into the print document.
 */
export const usePrintableIssues = (storeType: EIssuesStoreType): TIssue[] => {
  const { issues } = useIssues(storeType);
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  return flattenGroupedIssueIds(issues?.groupedIssueIds)
    .map((issueId) => getIssueById(issueId))
    .filter((issue): issue is TIssue => !!issue);
};
