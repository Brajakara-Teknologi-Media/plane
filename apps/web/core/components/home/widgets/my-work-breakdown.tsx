/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PieChart } from "lucide-react";
import type { THomeSummary } from "@/services/home-summary.service";
import { HomeCard, PRIORITY_COLOR } from "./card";

const PRIORITY_LABEL: Record<string, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "No priority",
};

type Props = { summary: THomeSummary | undefined; loading: boolean };

/**
 * How my open work items are distributed — by stage and by priority.
 *
 * Answers "where is my queue": everything stuck in Triage is a different
 * problem from everything stuck in Testing, and the total number alone doesn't tell that.
 */
export function MyWorkBreakdownWidget({ summary, loading }: Props) {
  if (loading) return <div className="h-52 animate-pulse rounded-xl border border-subtle bg-surface-2" />;

  const stages = summary?.by_stage ?? [];
  const priorities = summary?.by_priority ?? [];
  const total = stages.reduce((sum, s) => sum + s.count, 0);

  if (total === 0) {
    return <HomeCard icon={PieChart} title="My queue" empty="Nothing open assigned to you." />;
  }

  return (
    <HomeCard icon={PieChart} title="My queue" count={total}>
      {/* Stacked bar: proportion jumps out before the numbers. */}
      <div className="bg-surface-3 mb-3 flex h-2 overflow-hidden rounded-full">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className="h-full"
            style={{ width: `${(stage.count / total) * 100}%`, backgroundColor: stage.color || "#8b8b8b" }}
            title={`${stage.name}: ${stage.count}`}
          />
        ))}
      </div>

      <ul className="space-y-1.5">
        {stages.map((stage) => (
          <li key={stage.name} className="flex items-center gap-2 text-12">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: stage.color || "#8b8b8b" }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-secondary">{stage.name}</span>
            <span className="shrink-0 text-primary tabular-nums">{stage.count}</span>
          </li>
        ))}
      </ul>

      {priorities.length > 0 && (
        <div className="mt-3 border-t border-subtle pt-3">
          <p className="mb-1.5 text-11 text-tertiary">By priority</p>
          <ul className="space-y-1.5">
            {priorities.map((p) => (
              <li key={p.priority} className="flex items-center gap-2 text-12">
                <span className={PRIORITY_COLOR[p.priority] ?? PRIORITY_COLOR.none} aria-hidden>
                  ●
                </span>
                <span className="min-w-0 flex-1 truncate text-secondary">
                  {PRIORITY_LABEL[p.priority] ?? p.priority}
                </span>
                <span className="shrink-0 text-primary tabular-nums">{p.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </HomeCard>
  );
}
