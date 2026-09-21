"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import type { THomeWidgetProps } from "@plane/types";
import { cn } from "@plane/utils";
import { APIService } from "@/services/api.service";
import { API_BASE_URL } from "@plane/constants";

class DueDateService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  upcoming(slug: string) {
    const today = new Date().toISOString().slice(0, 10);
    const inSevenDays = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    return this.get(`/api/workspaces/${slug}/issues/`, {
      params: {
        target_date: `${today};${inSevenDays}`,
        state_group: "backlog,unstarted,started",
        per_page: 10,
        cursor: "10:0:0",
      },
    })
      .then((r) => r?.data?.results ?? [])
      .catch(() => []);
  }
}

const dueDateService = new DueDateService();

// Window shown by this widget. Matches the API filter above so labels and
// urgency math stay consistent with the fetched data.
const WINDOW_DAYS = 7;

// Localized weekday and month labels. Indonesian keeps the widget scannable
// for the F&B target audience even when the rest of the UI is English.
const WEEKDAY_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTH_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

type UrgencyTier = "today" | "tomorrow" | "soon" | "later";

type UrgencyMeta = {
  tier: UrgencyTier;
  // Human label: emphasises how soon the deadline is ("Hari ini", "Besok",
  // "3 hari lagi") so the reader gets a countdown at a glance.
  label: string;
  // Exact calendar reference ("Kam 12 Sep") — concrete date so the team does
  // not have to compute which weekday "3 hari lagi" lands on.
  exactDate: string;
  // Emoji chosen for emotional weight, not decoration:
  // 🔥 today, ⚠️ tomorrow, ⏳ soon, 📅 later. Empty for the calmest tier
  // would look inconsistent, so 📅 stands in as "on the radar".
  emoji: string;
  // Days until deadline; drives the progress bar fill ratio.
  daysAway: number;
  // Tailwind class fragments applied per tier. Keeping them grouped in the
  // meta object avoids scattering colour logic across the render.
  badgeClass: string;
  barClass: string;
  rowAccentClass: string;
};

function urgencyFor(dateStr: string): UrgencyMeta {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const daysAway = Math.round((target.getTime() - today.getTime()) / 86400000);

  const exactDate = `${WEEKDAY_ID[target.getDay()]} ${target.getDate()} ${MONTH_ID[target.getMonth()]}`;

  // Tier thresholds: today / tomorrow get their own tier because they trigger
  // the strongest colour and emoji; 2-3 days is "soon" (still warm); 4-7 is
  // "later" (muted but still on the radar).
  if (daysAway <= 0) {
    return {
      tier: "today",
      label: "Hari ini",
      exactDate,
      emoji: "🔥",
      daysAway,
      badgeClass: "bg-red-500/15 text-red-500 border border-red-500/30",
      barClass: "bg-red-500",
      rowAccentClass: "border-l-2 border-red-500",
    };
  }
  if (daysAway === 1) {
    return {
      tier: "tomorrow",
      label: "Besok",
      exactDate,
      emoji: "⚠️",
      daysAway,
      badgeClass: "bg-orange-500/15 text-orange-500 border border-orange-500/30",
      barClass: "bg-orange-500",
      rowAccentClass: "border-l-2 border-orange-500",
    };
  }
  if (daysAway <= 3) {
    return {
      tier: "soon",
      label: `${daysAway} hari lagi`,
      exactDate,
      emoji: "⏳",
      daysAway,
      badgeClass: "bg-yellow-500/15 text-yellow-600 border border-yellow-500/30",
      barClass: "bg-yellow-500",
      rowAccentClass: "border-l-2 border-yellow-500",
    };
  }
  return {
    tier: "later",
    label: `${daysAway} hari lagi`,
    exactDate,
    emoji: "📅",
    daysAway,
    badgeClass: "bg-surface-2 text-secondary border border-subtle",
    barClass: "bg-secondary/40",
    rowAccentClass: "border-l-2 border-transparent",
  };
}

export function UpcomingDatesWidget({ workspaceSlug }: THomeWidgetProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dueDateService
      .upcoming(workspaceSlug)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  if (loading) return <div className="h-32 animate-pulse rounded-xl border border-subtle bg-surface-2" />;

  // Sort ascending by days-away so the most urgent deadline sits on top.
  // The API does not guarantee order, and reversing here is O(n log n) on
  // at most 10 items — negligible.
  const sortedItems = [...items].sort((a, b) => {
    const aDays = urgencyFor(a.target_date).daysAway;
    const bDays = urgencyFor(b.target_date).daysAway;
    return aDays - bDays;
  });

  return (
    <div className="rounded-xl border border-subtle bg-surface-1 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-secondary" />
        <span className="text-13 font-semibold">Upcoming Deadlines</span>
      </div>

      {sortedItems.length === 0 && (
        // Positive empty state: rewards a clean queue rather than reporting
        // absence. The team is more likely to keep dates up-to-date when
        // "clean" feels like an achievement, not a blank slate.
        <div className="flex flex-col items-center gap-1 py-6 text-center">
          <span className="text-2xl" aria-hidden>
            🎉
          </span>
          <p className="text-13 font-medium">Bersih! Tidak ada deadline 7 hari ke depan.</p>
          <p className="text-11 text-secondary">Nikmati ketenangannya.</p>
        </div>
      )}

      <div className="space-y-2">
        {sortedItems.slice(0, 8).map((issue) => {
          const meta = urgencyFor(issue.target_date);
          // Progress bar fill: 0 days away = 100% (time is up), 7 days = ~0%.
          // Overdue (negative days) clamps to 100% so the bar still reads
          // "time's out" even though this widget's window excludes overdue.
          const fillRatio = Math.max(0, Math.min(1, (WINDOW_DAYS - Math.max(0, meta.daysAway)) / WINDOW_DAYS));

          return (
            <Link
              key={issue.id}
              href={`/${workspaceSlug}/projects/${issue.project_id}/issues/${issue.id}`}
              className={cn(
                "flex flex-col gap-1.5 rounded-md px-2 py-2 transition-colors hover:bg-surface-2",
                meta.rowAccentClass
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-10 font-semibold",
                    meta.badgeClass
                  )}
                >
                  <span className="mr-1" aria-hidden>
                    {meta.emoji}
                  </span>
                  {meta.label}
                </span>
                <span className="flex-1 truncate text-13">{issue.name}</span>
                {issue.project_detail?.identifier && (
                  <span className="shrink-0 text-11 text-tertiary">{issue.project_detail.identifier}</span>
                )}
              </div>
              <div className="flex items-center gap-2 pl-1">
                {/* Progress bar: gives a visceral "time is running out" feel
                    that the numeric label alone cannot. Width is a percentage
                    so it scales with the widget on any column width. */}
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn("h-full rounded-full transition-[width]", meta.barClass)}
                    style={{ width: `${(fillRatio * 100).toFixed(0)}%` }}
                  />
                </div>
                <span className="shrink-0 text-10 text-tertiary">{meta.exactDate}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
