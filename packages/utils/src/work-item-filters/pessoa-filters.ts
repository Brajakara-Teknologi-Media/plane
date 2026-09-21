/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Decision for person shortcuts: **My work items** (`assignee_id`) and
 * **Abertos por mim** (`created_by_id`).
 *
 * Both toggle the current user on a condition **without erasing the rest of the
 * filter** — which allows combining "work items from my sector" with "just mine".
 * The rule has corners that break the listing silently (a condition with empty
 * list returns zero work items, not "no filter"), so it lives here, far from
 * React, and is tested.
 */

/** Propriedades que os atalhos manipulam. */
export const PESSOA_FILTER_PROPERTY = {
  ASSIGNEE: "assignee_id",
  CREATED_BY: "created_by_id",
} as const;

export type TPessoaFilterProperty = (typeof PESSOA_FILTER_PROPERTY)[keyof typeof PESSOA_FILTER_PROPERTY];

/** What the component should do with the condition. */
export type TPessoaFilterAction =
  | { type: "add"; values: string[] }
  | { type: "update"; values: string[] }
  | { type: "remove" }
  | { type: "noop" };

export const toPessoaList = (value: unknown): string[] => {
  // `String(undefined)` vira "undefined" (verdadeiro): descartar ANTES de converter.
  if (Array.isArray(value)) return value.filter((v) => v !== undefined && v !== null && v !== "").map(String);
  if (value === undefined || value === null || value === "") return [];
  return [String(value)];
};

export const isCurrentUserSelected = (values: string[], currentUserId: string | undefined): boolean =>
  !!currentUserId && values.includes(currentUserId);

/**
 * @param values People already filtered (empty when there is no condition).
 * @param hasCondition Whether the condition exists in the filter.
 */
export const resolvePessoaFilterAction = (
  values: string[],
  currentUserId: string | undefined,
  hasCondition: boolean
): TPessoaFilterAction => {
  if (!currentUserId) return { type: "noop" };

  if (!hasCondition) return { type: "add", values: [currentUserId] };

  if (!isCurrentUserSelected(values, currentUserId)) {
    return { type: "update", values: [...values, currentUserId] };
  }

  const restante = values.filter((id) => id !== currentUserId);
  // Empty condition is not "no filter": the listing would return zero work items.
  return restante.length === 0 ? { type: "remove" } : { type: "update", values: restante };
};

// Old names, kept because the previous version only handled assignees.
export const toAssigneeList = toPessoaList;
export const isAssignedToCurrentUser = isCurrentUserSelected;
export const resolveMyWorkItemsAction = resolvePessoaFilterAction;
