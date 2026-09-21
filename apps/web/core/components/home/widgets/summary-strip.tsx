/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { AlertTriangle, CalendarClock, Inbox, Layers, PenLine, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@plane/utils";
import type { THomeSummary } from "@/services/home-summary.service";

type TIndicator = {
  key: keyof THomeSummary;
  label: string;
  icon: typeof Layers;
  href: (slug: string) => string;
  /** Highlight when the number is greater than zero — only for actionable items. */
  alert?: "danger" | "warning";
};

/**
 * The strip answers, in order, the questions at the start of the day:
 * what's mine, what's overdue, what's due today, what I created, what's
 * waiting for triage, and what the team delivered.
 */
const INDICATORS: TIndicator[] = [
  {
    key: "my_open",
    label: "My open items",
    icon: Layers,
    href: (s) => `/${s}/workspace-views/all-issues/`,
  },
  {
    key: "my_overdue",
    label: "Overdue",
    icon: AlertTriangle,
    href: (s) => `/${s}/workspace-views/all-issues/`,
    alert: "danger",
  },
  {
    key: "my_due_today",
    label: "Due today",
    icon: CalendarClock,
    href: (s) => `/${s}/workspace-views/all-issues/`,
    alert: "warning",
  },
  {
    key: "created_by_me",
    label: "Created by me",
    icon: PenLine,
    href: (s) => `/${s}/workspace-views/all-issues/`,
  },
  {
    key: "pending_requests",
    label: "Awaiting triage",
    icon: Inbox,
    href: (s) => `/${s}/global-intake/`,
  },
  {
    key: "completed_7d",
    label: "Completed (7 days)",
    icon: CheckCircle2,
    href: (s) => `/${s}/analytics/work-items/`,
  },
];

const ALERT_COLORS = {
  danger: "text-danger-primary",
  warning: "text-warning-primary",
} as const;

type Props = {
  workspaceSlug: string;
  summary: THomeSummary | undefined;
  loading: boolean;
};

export function HomeSummaryStrip({ workspaceSlug, summary, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {INDICATORS.map((i) => (
          <div key={i.key} className="h-[86px] animate-pulse rounded-xl border border-subtle bg-surface-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {INDICATORS.map((indicator) => {
        const value = (summary?.[indicator.key] as number) ?? 0;
        const Icon = indicator.icon;
        // Alert color only appears when there's actually something to do: a red "0"
        // trains people to ignore red.
        const highlight = indicator.alert && value > 0 ? ALERT_COLORS[indicator.alert] : "text-primary";
        return (
          <Link
            key={indicator.key}
            href={indicator.href(workspaceSlug)}
            className="group hover:border-accent-subtle-1 flex flex-col justify-between rounded-xl border border-subtle bg-surface-1 px-4 py-3 transition-colors hover:bg-surface-2"
          >
            <div className="flex items-center gap-1.5 text-11 text-secondary">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{indicator.label}</span>
            </div>
            <span className={cn("mt-1.5 text-24 leading-none font-semibold tabular-nums", highlight)}>{value}</span>
          </Link>
        );
      })}
    </div>
  );
}
