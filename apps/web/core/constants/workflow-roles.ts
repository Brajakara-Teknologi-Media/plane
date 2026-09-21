/**
 * Shared vocabulary for roles and permissions screens.
 *
 * Only labels and the catalog of stages used in selectors. Who can do what
 * and which transitions each role executes always comes from `GET /roles/` — never
 * from here.
 */

/** Labels for stage groups used by the backend. */
export const STATE_GROUP_LABELS: Record<string, string> = {
  triage: "Triage",
  backlog: "Backlog",
  unstarted: "Unstarted",
  started: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type TWorkflowStateOption = {
  group: string;
  name: string;
};

/**
 * Default workflow stages (mirrors DEFAULT_STATES from backend migration).
 * Only used to populate "from → to" selectors when creating a new transition;
 * configured transitions always come from the API.
 */
export const WORKFLOW_STATE_TEMPLATE: TWorkflowStateOption[] = [
  { group: "triage", name: "Triage" },
  { group: "backlog", name: "Backlog" },
  { group: "unstarted", name: "To Do" },
  { group: "started", name: "In Review" },
  { group: "started", name: "In Development" },
  { group: "started", name: "In Testing" },
  { group: "completed", name: "Completed" },
  { group: "cancelled", name: "Cancelled" },
];

/** Readable label for one side of the transition (`state_name` null = entire group). */
export const describeTransitionSide = (group: string, stateName: string | null): string =>
  stateName ?? `Any stage in ${STATE_GROUP_LABELS[group] ?? group}`;
