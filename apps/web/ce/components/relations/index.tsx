/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CircleDot, XCircle } from "lucide-react";
import { RelatedIcon, DuplicatePropertyIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import type { TRelationObject } from "@/components/issues/issue-detail-widgets/relations";
import type { TIssueRelationTypes } from "../../types";

export * from "./activity";

const RELATION_ICONS = {
  relates_to: {
    key: "relates_to",
    i18n_label: "issue.relation.relates_to",
    className: "bg-layer-1 text-secondary",
    icon: (size) => <RelatedIcon height={size} width={size} className="text-secondary" />,
  },
  duplicate: {
    key: "duplicate",
    i18n_label: "issue.relation.duplicate",
    className: "bg-layer-1 text-secondary",
    icon: (size) => <DuplicatePropertyIcon width={size} height={size} className="text-secondary" />,
  },
  blocked_by: {
    key: "blocked_by",
    i18n_label: "issue.relation.blocked_by",
    className: "bg-danger-subtle text-danger-primary",
    icon: (size) => <CircleDot size={size} className="text-secondary" />,
  },
  blocking: {
    key: "blocking",
    i18n_label: "issue.relation.blocking",
    className: "bg-yellow-500/20 text-yellow-700",
    icon: (size) => <XCircle size={size} className="text-secondary" />,
  },
} satisfies Record<TIssueRelationTypes, Omit<TRelationObject, "placeholder">>;

const PLACEHOLDER_KEYS: Record<TIssueRelationTypes, string> = {
  relates_to: "issue.relation.add_relates_to",
  duplicate: "common.none",
  blocked_by: "common.none",
  blocking: "common.none",
};

export const useTimeLineRelationOptions = (): Record<TIssueRelationTypes, TRelationObject> => {
  const { t } = useTranslation();
  return Object.fromEntries(
    Object.entries(RELATION_ICONS).map(([key, option]) => [
      key,
      { ...option, placeholder: t(PLACEHOLDER_KEYS[key as TIssueRelationTypes]) },
    ])
  ) as Record<TIssueRelationTypes, TRelationObject>;
};
