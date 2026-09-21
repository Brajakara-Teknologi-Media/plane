"use client";

import { APIService } from "@/services/api.service";
import { API_BASE_URL } from "@plane/constants";
import type { THomeWidgetProps } from "@plane/types";
import { calculateTimeAgo, cn, generateIssueDetailLink } from "@plane/utils";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

class UrgentService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  list(slug: string) {
    return this.get(`/api/workspaces/${slug}/urgent-issues/`)
      .then((r) => r?.data ?? [])
      .catch(() => []);
  }
}

const urgentService = new UrgentService();

const STATE_GROUP_BG: Record<string, string> = {
  backlog: "bg-gray-100 text-gray-700",
  unstarted: "bg-blue-100 text-blue-700",
  started: "bg-yellow-100 text-yellow-800",
  triage: "bg-purple-100 text-purple-700",
};

export function CriticalIssuesWidget({ workspaceSlug }: THomeWidgetProps) {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    urgentService
      .list(workspaceSlug)
      .then(setIssues)
      .finally(() => setLoading(false));
  }, [workspaceSlug]);

  if (loading) return <div className="h-32 animate-pulse rounded-xl border border-subtle bg-surface-2" />;
  if (issues.length === 0) return null;

  return (
    <div className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20 rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="text-red-600 h-4 w-4" />
        <span className="text-red-800 dark:text-red-300 text-13 font-semibold">
          Urgent Open Items ({issues.length})
        </span>
      </div>
      <div className="space-y-2">
        {issues.slice(0, 6).map((issue) => (
          <Link
            key={issue.id}
            href={generateIssueDetailLink({ workspaceSlug, projectId: issue.project?.id, issueId: issue.id })}
            className="border-red-100 bg-red-50 shadow-sm hover:border-red-200 hover:bg-red-100/70 dark:border-red-900/50 dark:bg-red-950/35 dark:hover:bg-red-950/55 flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors"
          >
            {issue.legacy_ticket_number && (
              <span className="font-mono shrink-0 rounded border border-danger-strong/20 bg-danger-subtle px-1.5 py-0.5 text-10 font-semibold text-danger-primary dark:border-danger-strong/40 dark:bg-danger-primary/20 dark:text-danger-secondary">
                #{issue.legacy_ticket_number}
              </span>
            )}
            {issue.project?.identifier && (
              <span className="shrink-0 rounded border border-danger-strong/10 bg-danger-transparent px-1.5 py-0.5 text-11 font-medium text-danger-primary dark:border-danger-strong/25 dark:bg-danger-primary/10 dark:text-danger-secondary">
                {issue.project.identifier}-{issue.sequence_id}
              </span>
            )}
            <span className="flex-1 truncate text-13 text-primary">{issue.name}</span>
            {issue.state && (
              <span
                className={cn(
                  "shrink-0 rounded px-1.5 py-0.5 text-10 font-medium",
                  STATE_GROUP_BG[issue.state.group] ?? "bg-surface-2 text-secondary"
                )}
              >
                {issue.state.name}
              </span>
            )}
            <span className="shrink-0 text-11 text-tertiary">{calculateTimeAgo(issue.updated_at)}</span>
          </Link>
        ))}
        {issues.length > 6 && (
          <p className="text-red-600 text-center text-12">+{issues.length - 6} more urgent items</p>
        )}
      </div>
    </div>
  );
}
