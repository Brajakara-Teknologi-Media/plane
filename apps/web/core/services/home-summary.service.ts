/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export type THomeSummary = {
  my_open: number;
  my_overdue: number;
  my_due_today: number;
  created_by_me: number;
  in_triage: number;
  pending_requests: number;
  completed_7d: number;
  created_7d: number;
  by_priority: { priority: string; count: number }[];
  by_stage: { name: string; color: string; group: string; count: number }[];
  projects: number;
};

export type THomeOverdueItem = {
  id: string;
  name: string;
  priority: string;
  target_date: string | null;
  sequence_id: number;
  project_id: string;
  project_identifier: string;
  project_name: string;
  state_name: string | null;
  state_color: string | null;
  state_group: string | null;
};

const EMPTY: THomeSummary = {
  my_open: 0,
  my_overdue: 0,
  my_due_today: 0,
  created_by_me: 0,
  in_triage: 0,
  pending_requests: 0,
  completed_7d: 0,
  created_7d: 0,
  by_priority: [],
  by_stage: [],
  projects: 0,
};

/**
 * Home page statistics.
 *
 * Single request for the entire indicator strip — home is the first screen
 * of the day and cannot open firing dozens of calls.
 */
class HomeSummaryService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  /** Failures become zeros: a network error cannot leave home blank. */
  summary(workspaceSlug: string): Promise<THomeSummary> {
    return this.get(`/api/workspaces/${workspaceSlug}/home-summary/`)
      .then((r) => (r?.data as THomeSummary) ?? EMPTY)
      .catch(() => EMPTY);
  }

  overdue(workspaceSlug: string, limit = 6): Promise<THomeOverdueItem[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/home-overdue/`, { params: { limit } })
      .then((r) => (r?.data as THomeOverdueItem[]) ?? [])
      .catch(() => []);
  }
}

export const homeSummaryService = new HomeSummaryService();
