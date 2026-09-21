/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
// plane imports
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { COLLECTION_OPERATOR, LOGICAL_OPERATOR } from "@plane/types";
import type { TPessoaFilterProperty } from "@plane/utils";
import { isCurrentUserSelected, resolvePessoaFilterAction, toPessoaList } from "@plane/utils";
// store hooks
import { useUser } from "@/hooks/store/user";

export type TPessoaFilter = {
  /** `false` when there is no filter set up or the user hasn't loaded yet. */
  isAvailable: boolean;
  isActive: boolean;
  toggle: () => void;
};

/**
 * Toggles the current user on a person condition **without erasing the rest of the
 * filtro**. Serve aos dois atalhos da barra: "Meus chamados" (`assignee_id`) e
 * "Abertos por mim" (`created_by_id`).
 *
 * The difference from the menu models is this: the model replaces everything that
 * is applied, while these buttons only add (or remove) you from the
 * condition. You can combine the sector filter with "just mine", which is
 * justamente o caso de quem quer parar de olhar o trabalho dos outros.
 *
 * The decision itself lives in `@plane/utils` (`resolvePessoaFilterAction`), where it is
 * tested; here we just apply the result to the store.
 */
export const usePessoaFilter = (
  filter: IWorkItemFilterInstance | undefined,
  property: TPessoaFilterProperty
): TPessoaFilter => {
  const { data: currentUser } = useUser();
  const currentUserId = currentUser?.id;

  const condition = useMemo(
    () => filter?.allConditions.find((c) => c.property === property),
    [filter?.allConditions, property]
  );

  const values = useMemo(() => toPessoaList(condition?.value), [condition?.value]);

  const toggle = useCallback(() => {
    if (!filter) return;
    const acao = resolvePessoaFilterAction(values, currentUserId, !!condition);

    if (acao.type === "add") {
      filter.addCondition(
        LOGICAL_OPERATOR.AND,
        { property, operator: COLLECTION_OPERATOR.IN, value: acao.values },
        false
      );
      filter.toggleVisibility(true);
      return;
    }
    if (!condition) return;
    if (acao.type === "remove") filter.removeCondition(condition.id);
    if (acao.type === "update") filter.updateConditionValue(condition.id, acao.values);
  }, [filter, currentUserId, condition, values, property]);

  return {
    isAvailable: !!filter && !!currentUserId,
    isActive: isCurrentUserSelected(values, currentUserId),
    toggle,
  };
};
