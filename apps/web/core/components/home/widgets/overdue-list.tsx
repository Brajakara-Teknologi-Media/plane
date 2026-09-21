/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { renderFormattedDate } from "@plane/utils";
import type { THomeOverdueItem } from "@/services/home-summary.service";
import { HomeCard, PRIORITY_COLOR } from "./card";

type Props = {
  workspaceSlug: string;
  items: THomeOverdueItem[];
  loading: boolean;
};

/** How many days past due. */
function daysOverdue(date: string | null): number {
  if (!date) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - target.getTime()) / 86400000));
}

/**
 * My work items with overdue due dates.
 *
 * Sits at the top of the main column because it is the only home list that
 * demands action today — and disappears entirely when nothing is overdue,
 * instead of permanently occupying space with an "all good" message.
 */
export function OverdueWidget({ workspaceSlug, items, loading }: Props) {
  if (loading) return <div className="h-40 animate-pulse rounded-xl border border-subtle bg-surface-2" />;
  if (items.length === 0) return null;

  return (
    <HomeCard
      icon={AlertTriangle}
      title="Overdue"
      count={items.length}
      tone="danger"
      action={{ label: "View all", href: `/${workspaceSlug}/workspace-views/all-issues/` }}
    >
      <ul className="divide-y divide-subtle">
        {items.map((item) => {
          const overdue = daysOverdue(item.target_date);
          return (
            <li key={item.id}>
              <Link
                href={`/${workspaceSlug}/projects/${item.project_id}/issues/${item.id}`}
                className="flex items-center gap-3 px-1 py-2 transition-colors hover:bg-surface-2"
              >
                <span className={PRIORITY_COLOR[item.priority] ?? PRIORITY_COLOR.none} aria-hidden>
                  ●
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-13 text-primary">{item.name}</span>
                  <span className="block truncate text-11 text-tertiary">
                    {item.project_identifier}-{item.sequence_id} · {item.project_name}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-12 font-medium text-danger-primary">
                    {overdue === 1 ? "1 day" : `${overdue} days`}
                  </span>
                  <span className="block text-11 text-tertiary">{renderFormattedDate(item.target_date ?? "")}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </HomeCard>
  );
}
