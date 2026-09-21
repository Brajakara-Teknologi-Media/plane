/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
// types
import type { TEntity } from "@plane/types";
// services
import entityService from "@/services/entity.service";
// store
import type { CoreRootStore } from "./root.store";

export interface IEntityStore {
  // observable
  entityMap: Record<string, Record<string, TEntity>>; // workspaceSlug -> id -> entity
  fetchedMap: Record<string, boolean>;
  // computed actions
  getWorkspaceEntities: (workspaceSlug: string) => TEntity[] | undefined;
  getEntityById: (workspaceSlug: string, entityId: string) => TEntity | undefined;
  // fetch actions
  fetchWorkspaceEntities: (workspaceSlug: string) => Promise<TEntity[]>;
}

export class EntityStore implements IEntityStore {
  entityMap: Record<string, Record<string, TEntity>> = {};
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      entityMap: observable,
      fetchedMap: observable,
      fetchWorkspaceEntities: action,
    });
    this.rootStore = _rootStore;
  }

  getWorkspaceEntities = (workspaceSlug: string): TEntity[] | undefined => {
    if (!this.fetchedMap[workspaceSlug]) return undefined;
    const entities = this.entityMap[workspaceSlug];
    if (!entities) return [];
    return Object.values(entities);
  };

  getEntityById = (workspaceSlug: string, entityId: string): TEntity | undefined =>
    this.entityMap[workspaceSlug]?.[entityId];

  fetchWorkspaceEntities = async (workspaceSlug: string): Promise<TEntity[]> => {
    const list = await entityService.list(workspaceSlug);
    runInAction(() => {
      const map: Record<string, TEntity> = {};
      for (const entity of list) {
        if (entity?.id) map[entity.id] = entity;
      }
      this.entityMap[workspaceSlug] = map;
      this.fetchedMap[workspaceSlug] = true;
    });
    return list;
  };
}
