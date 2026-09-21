/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams, usePathname } from "next/navigation";
import useSWR from "swr";
// plane imports
import type { THomeWidgetKeys, THomeWidgetProps } from "@plane/types";
// components
// hooks
import { useHome } from "@/hooks/store/use-home";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
// plane web components
import { HomePageHeader } from "@/plane-web/components/home/header";
// services
import { homeSummaryService } from "@/services/home-summary.service";
// local imports
import { StickiesWidget } from "../stickies/widget";
import { UserGreetingsView } from "./user-greetings";
import { HomeLoader, NoProjectsEmptyState, RecentActivityWidget } from "./widgets";
import { DashboardQuickLinks } from "./widgets/links";
import { ManageWidgetsModal } from "./widgets/manage";
import { MyWorkItemsWidget } from "./widgets/my-work-items";
import { UpcomingDatesWidget } from "./widgets/upcoming-dates";
import { OpenIntakesWidget } from "./widgets/open-intakes";
import { CriticalIssuesWidget } from "./widgets/critical-issues";
import { MarketplaceWidgetsSection } from "./widgets/marketplace-widgets-section";
import { HomeSummaryStrip } from "./widgets/summary-strip";
import { MyWorkBreakdownWidget } from "./widgets/my-work-breakdown";
import { OverdueWidget } from "./widgets/overdue-list";

export const HOME_WIDGETS_LIST: {
  [key in THomeWidgetKeys]: {
    component: React.FC<THomeWidgetProps> | null;
    fullWidth: boolean;
    title: string;
  };
} = {
  quick_links: {
    component: DashboardQuickLinks,
    fullWidth: false,
    title: "home.quick_links.title_plural",
  },
  recents: {
    component: RecentActivityWidget,
    fullWidth: false,
    title: "home.recents.title",
  },
  my_stickies: {
    component: StickiesWidget,
    fullWidth: false,
    title: "stickies.title",
  },
  new_at_plane: {
    component: null,
    fullWidth: false,
    title: "home.new_at_plane.title",
  },
  quick_tutorial: {
    component: null,
    fullWidth: false,
    title: "home.quick_tutorial.title",
  },
  my_work_items: {
    component: MyWorkItemsWidget,
    fullWidth: false,
    title: "home.my_work_items.title",
  },
  upcoming_dates: {
    component: UpcomingDatesWidget,
    fullWidth: false,
    title: "home.upcoming_dates.title",
  },
  open_intakes: {
    component: OpenIntakesWidget,
    fullWidth: false,
    title: "home.open_intakes.title",
  },
};

/** Already rendered fixed above; cannot repeat in the optional list. */
const WIDGETS_JA_FIXOS: THomeWidgetKeys[] = ["my_work_items", "open_intakes", "upcoming_dates", "quick_links"];

export const DashboardWidgets = observer(function DashboardWidgets() {
  // router
  const { workspaceSlug } = useParams();
  // navigation
  const pathname = usePathname();
  // store hooks
  const { toggleWidgetSettings, widgetsMap, showWidgetSettings, orderedWidgets, isAnyWidgetEnabled, loading } =
    useHome();
  const { loader } = useProject();
  const { data: currentUser } = useUser();
  // derived values

  // derived values
  const slug = workspaceSlug?.toString() ?? "";
  const isWikiApp = pathname.includes(`/${slug}/pages`);

  const { data: summary, isLoading: loadingSummary } = useSWR(
    slug ? `HOME_SUMMARY_${slug}` : null,
    slug ? () => homeSummaryService.summary(slug) : null,
    { revalidateOnFocus: false }
  );
  const { data: overdueItems, isLoading: loadingOverdue } = useSWR(
    slug ? `HOME_OVERDUE_${slug}` : null,
    slug ? () => homeSummaryService.overdue(slug) : null,
    { revalidateOnFocus: false }
  );

  /** A context line next to the date, in place of a bare number. */
  const contextPhrase = (() => {
    if (!summary) return undefined;
    if (summary.my_overdue > 0) {
      return `${summary.my_overdue} item${summary.my_overdue > 1 ? "s" : ""} overdue`;
    }
    if (summary.my_due_today > 0) {
      return `${summary.my_due_today} item${summary.my_due_today > 1 ? "s" : ""} due today`;
    }
    if (summary.my_open > 0) return `${summary.my_open} open items assigned to you`;
    return "No open items assigned to you";
  })();

  if (!workspaceSlug) return null;
  if (loading || loader !== "loaded") return <HomeLoader />;

  return (
    <div className="relative flex h-full w-full flex-col gap-6">
      <ManageWidgetsModal
        workspaceSlug={workspaceSlug.toString()}
        isModalOpen={showWidgetSettings}
        handleOnClose={() => toggleWidgetSettings(false)}
      />

      {/* Header: greeting on the left, actions on the right. */}
      <div className="flex flex-wrap items-start justify-between gap-3 pt-2">
        {currentUser ? <UserGreetingsView user={currentUser} resumo={contextPhrase} /> : <div />}
        <HomePageHeader />
      </div>

      {!isWikiApp && <NoProjectsEmptyState />}

      {!isWikiApp && (
        <>
          <HomeSummaryStrip workspaceSlug={slug} summary={summary} loading={loadingSummary} />

          <CriticalIssuesWidget workspaceSlug={slug} />

          {/* Two columns: actionable items on the left, context on the right.
              Previously everything shared a three-column grid, so the most
              important list was the same size as a counter. */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="flex flex-col gap-4 xl:col-span-2">
              <OverdueWidget workspaceSlug={slug} items={overdueItems ?? []} loading={loadingOverdue} />
              <UpcomingDatesWidget workspaceSlug={slug} />
              <OpenIntakesWidget workspaceSlug={slug} />
            </div>
            <div className="flex flex-col gap-4">
              <MyWorkBreakdownWidget summary={summary} loading={loadingSummary} />
              <MyWorkItemsWidget workspaceSlug={slug} />
              <DashboardQuickLinks workspaceSlug={slug} />
            </div>
          </div>
        </>
      )}

      {/* Marketplace widgets — sent by the widgets panel. */}
      {!isWikiApp && <MarketplaceWidgetsSection />}

      {/* Optional widgets, enabled in "Manage widgets". The fixed ones above
          already cover the essentials, so there's no full-page empty state here:
          a home without optional widgets is still complete. */}
      {isAnyWidgetEnabled && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {orderedWidgets.map((key) => {
            const WidgetComponent = HOME_WIDGETS_LIST[key]?.component;
            const isEnabled = widgetsMap[key]?.is_enabled;
            // "My work items" and "Requests" already appear fixed above; repeating
            // them was what caused the home to show the same block twice.
            if (!WidgetComponent || !isEnabled || WIDGETS_JA_FIXOS.includes(key)) return null;
            return <WidgetComponent key={key} workspaceSlug={slug} />;
          })}
        </div>
      )}
    </div>
  );
});
