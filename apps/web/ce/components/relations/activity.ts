/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssueActivity } from "@plane/types";

export const getRelationActivityContent = (
  activity: TIssueActivity | undefined,
  t: (key: string, params?: Record<string, unknown>) => string
): string | undefined => {
  if (!activity) return;

  switch (activity.field) {
    case "blocking":
      return activity.old_value === ""
        ? t("issue.relation.activity_blocking_set")
        : t("issue.relation.activity_blocking_remove");
    case "blocked_by":
      return activity.old_value === ""
        ? t("issue.relation.activity_blocked_by_set")
        : t("issue.relation.activity_blocked_by_remove");
    case "duplicate":
      return activity.old_value === ""
        ? t("issue.relation.activity_duplicate_set")
        : t("issue.relation.activity_duplicate_remove");
    case "relates_to":
      return activity.old_value === ""
        ? t("issue.relation.activity_relates_to_set")
        : t("issue.relation.activity_relates_to_remove");
  }

  return;
};
