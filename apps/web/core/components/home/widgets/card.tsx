/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@plane/utils";

/** Priority dot color. Single definition for the entire home. */
export const PRIORITY_COLOR: Record<string, string> = {
  urgent: "text-danger-primary",
  high: "text-orange-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
  none: "text-tertiary",
};

const TONE = {
  neutral: { border: "border-subtle", icon: "text-secondary" },
  danger: { border: "border-danger-subtle-1", icon: "text-danger-primary" },
  accent: { border: "border-accent-subtle-1", icon: "text-accent-primary" },
} as const;

type Props = {
  icon: React.FC<{ className?: string }>;
  title: string;
  /** Displayed as badge next to title. */
  count?: number;
  tone?: keyof typeof TONE;
  action?: { label: string; href: string };
  /** Shown in place of content when there is nothing to list. */
  empty?: string;
  children?: ReactNode;
};

/**
 * Unified frame for home blocks.
 *
 * Previously each widget drew its own border, title, and "view all" link with
 * slightly different measurements, causing misalignment. A single component
 * keeps everything on the same rhythm.
 */
export function HomeCard({ icon: Icon, title, count, tone = "neutral", action, empty, children }: Props) {
  const colors = TONE[tone];
  const noContent = !children;

  return (
    <section className={cn("flex flex-col rounded-xl border bg-surface-1", colors.border)}>
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn("size-4 shrink-0", colors.icon)} />
          <h3 className="truncate text-13 font-semibold text-primary">{title}</h3>
          {count !== undefined && count > 0 && (
            <span className="bg-surface-3 shrink-0 rounded-full px-1.5 py-0.5 text-11 text-secondary tabular-nums">
              {count}
            </span>
          )}
        </div>
        {action && (
          <Link
            href={action.href}
            className="flex shrink-0 items-center gap-1 text-11 text-accent-primary hover:underline"
          >
            {action.label}
            <ArrowRight className="size-3" />
          </Link>
        )}
      </header>
      <div className="px-4 pb-3">
        {noContent ? <p className="py-6 text-center text-12 text-tertiary">{empty}</p> : children}
      </div>
    </section>
  );
}
