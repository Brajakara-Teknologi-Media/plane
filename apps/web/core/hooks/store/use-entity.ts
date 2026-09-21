/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext, useEffect, useState } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IEntityStore } from "@/store/entity.store";

export const useEntityStore = (): IEntityStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useEntityStore must be used within StoreProvider");
  return context.entity;
};

export const useEntity = (workspaceSlug: string) => {
  const entityStore = useEntityStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>(undefined);

  const entities = workspaceSlug ? entityStore.getWorkspaceEntities(workspaceSlug) : undefined;

  useEffect(() => {
    if (!workspaceSlug) return;
    if (entityStore.fetchedMap[workspaceSlug]) return;

    setIsLoading(true);
    entityStore
      .fetchWorkspaceEntities(workspaceSlug)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [workspaceSlug, entityStore]);

  return { entities, isLoading, error };
};
