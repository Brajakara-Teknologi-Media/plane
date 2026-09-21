/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PenLine, UserRound } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { Tooltip } from "@plane/ui";
import { PESSOA_FILTER_PROPERTY, type TPessoaFilterProperty } from "@plane/utils";
import { cn } from "@plane/utils";
// hooks
import { usePessoaFilter } from "@/hooks/work-item-filters/use-pessoa-filter";

type TPessoaToggleProps = {
  filter: IWorkItemFilterInstance | undefined;
};

const BUTTON_CLASSNAME =
  "flex h-7 items-center gap-1 rounded-md border border-subtle-1 px-2 py-0.5 text-12 text-secondary transition-all duration-200 cursor-pointer hover:bg-layer-1";

/**
 * The toggled-on state must be unmistakable: a filtered list the person doesn't
 * notice looks like an empty list. We reuse exactly the classes the filter
 * button (the funnel) already uses for "active" — `border-accent-strong` and
 * `ring-*` don't exist in the theme and rendered with no effect, leaving the
 * button merely grayed out.
 */
const ACTIVE_BUTTON_CLASSNAME = [
  "border border-accent-subtle-1 hover:border-accent-subtle-1",
  "bg-accent-subtle hover:bg-accent-subtle-hover",
  "font-medium text-accent-primary hover:text-accent-primary",
].join(" ");

type TAtalho = {
  property: TPessoaFilterProperty;
  icon: typeof UserRound;
  i18nKey: string;
};

const ATALHO: Record<"assignee" | "createdBy", TAtalho> = {
  assignee: { property: PESSOA_FILTER_PROPERTY.ASSIGNEE, icon: UserRound, i18nKey: "common.my_work_items_filter" },
  createdBy: { property: PESSOA_FILTER_PROPERTY.CREATED_BY, icon: PenLine, i18nKey: "common.opened_by_me_filter" },
};

/**
 * Must be `observer` in its own right: it is HERE that the filter conditions
 * (MobX observables) are read. With the observer only on the outer component,
 * the button mounted with the right state and then never updated again —
 * clicking applied the filter, but the "toggled-on" highlight never appeared.
 */
const PessoaToggle = observer(function PessoaToggle({
  filter,
  atalho,
}: TPessoaToggleProps & { atalho: TAtalho }) {
  const { t } = useTranslation();
  const { isAvailable, isActive, toggle } = usePessoaFilter(filter, atalho.property);

  if (!isAvailable) return null;

  const rotulo = t(`${atalho.i18nKey}.label`);
  const Icone = atalho.icon;

  return (
    <Tooltip tooltipContent={t(`${atalho.i18nKey}.tooltip`)} position="bottom">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={isActive}
        // The label disappears on narrow screens, so the button's name has to
        // come from here: without it, mobile gets two icon buttons with no name.
        aria-label={rotulo}
        className={cn(BUTTON_CLASSNAME, "px-1.5 @4xl:px-2", { [ACTIVE_BUTTON_CLASSNAME]: isActive })}
      >
        <Icone className="size-4 flex-shrink-0" />
        {/* On narrow screens the bar already competes with layout, templates,
            display and the new work item button: only the icon remains. */}
        <span className="hidden whitespace-nowrap @4xl:inline">{rotulo}</span>
        {/* The dot is the same signal the filter button uses: it guarantees an
            at-a-glance read even where the label is hidden. */}
        {isActive && <span className="size-1.5 shrink-0 rounded-full bg-accent-primary" aria-hidden />}
      </button>
    </Tooltip>
  );
});

/**
 * "My work items" and "Opened by me" shortcuts, side by side.
 *
 * Mounted next to `FiltersToggle`, which ALL list screens render (system work
 * items, cycle, module, visualizations, global views, archived and profile) —
 * a single spot and both appear in all of them.
 *
 * They are complementary: Quality and Support open many work items that later
 * end up with someone else, so "opened by me" answers a question that "my
 * work items" does not.
 */
export const PessoaFilterToggles = observer(function PessoaFilterToggles(props: TPessoaToggleProps) {
  return (
    <>
      <PessoaToggle {...props} atalho={ATALHO.assignee} />
      <PessoaToggle {...props} atalho={ATALHO.createdBy} />
    </>
  );
});
