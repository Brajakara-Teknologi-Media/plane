/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Inbox, AlertCircle, Plus, Search } from "lucide-react";
import { Intake } from "@plane/propel/icons";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";
import { cn, calculateTimeAgo } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { InboxIssueRoot } from "@/components/inbox";
import { IntakeListPrintDocument, PrintButton } from "@/components/print";
import { IntakeQuickCreate } from "@/components/inbox/modals/intake-quick-create";
import { APIService } from "@/services/api.service";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { API_BASE_URL } from "@plane/constants";

const INTAKE_STATUS_LABEL: Record<number, string> = {
  [-2]: "Pending",
  [-1]: "Declined",
  0: "Snoozed",
  1: "Accepted",
  2: "Duplicate",
};

const INTAKE_STATUS_COLOR: Record<number, string> = {
  [-2]: "bg-yellow-100 text-yellow-800",
  [-1]: "bg-red-100 text-red-800",
  0: "bg-gray-100 text-gray-700",
  1: "bg-green-100 text-green-800",
  2: "bg-blue-100 text-blue-800",
};
type TIntakeProject = { id: string; name: string; identifier: string; logo_props: TLogoProps };

class GlobalIntakeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  list(slug: string, statusFilter: number[]) {
    return this.get(`/api/workspaces/${slug}/global-intake-issues/`, {
      params: { status: statusFilter.join(","), per_page: 100, cursor: "100:0:0" },
    })
      .then((r) => r?.data?.results ?? [])
      .catch(() => []);
  }
  // Projects accepting external intake — visible to any workspace member,
  // independent of project membership.
  intakeProjects(slug: string): Promise<TIntakeProject[]> {
    return this.get(`/api/workspaces/${slug}/intake-projects/`)
      .then((r) => r?.data ?? [])
      .catch(() => []);
  }
}

const globalIntakeService = new GlobalIntakeService();

function GlobalIntakePage() {
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const selectedProjectId = searchParams.get("projectId");
  const inboxIssueId = searchParams.get("inboxIssueId") ?? undefined;

  const { currentWorkspace } = useWorkspace();

  // A lista da barra lateral é longa (um item por sistema): sem busca, achar um
  // sistema pelo nome vira rolagem no olho.
  const [buscaProjeto, setBuscaProjeto] = useState("");
  // Projects accepting external intake — fetched directly so members can file
  // intake for teams whose projects they have not joined.
  const { data: todosProjetos } = useSWR(
    workspaceSlug ? `GLOBAL_INTAKE_PROJECTS_${workspaceSlug}` : null,
    () => globalIntakeService.intakeProjects(workspaceSlug.toString()),
    { revalidateIfStale: false }
  );
  const termo = buscaProjeto.trim().toLowerCase();
  const intakeProjects = (todosProjetos ?? []).filter((p) =>
    termo ? `${p?.name ?? ""} ${p?.identifier ?? ""}`.toLowerCase().includes(termo) : true
  );

  const activeProject = selectedProjectId ? intakeProjects.find((p) => p?.id === selectedProjectId) : undefined;

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - Global requests` : "Global requests";

  // ── Global list state (when no project is selected) ──────────────────────
  const [statusFilter, setStatusFilter] = useState<number>(-2); // -2=pending default
  const [allIntakes, setAllIntakes] = useState<any[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // bumped after the create modal closes so the "all" list re-fetches
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (activeProject || !workspaceSlug) return;
    setLoadingAll(true);
    globalIntakeService
      .list(workspaceSlug.toString(), [statusFilter])
      .then(setAllIntakes)
      .finally(() => setLoadingAll(false));
  }, [workspaceSlug, activeProject, statusFilter, refreshKey]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <PageHead title={pageTitle} />

      {/* Project selector sidebar */}
      <div className="flex h-full w-56 flex-shrink-0 flex-col border-r border-subtle">
        <div className="flex flex-col gap-3 border-b border-subtle px-4 py-3">
          <div className="flex items-center gap-2">
            <Intake className="size-4 text-secondary" />
            <span className="text-13 font-semibold">Projects</span>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="text-15 shadow-md hover:shadow-lg flex w-full items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-3 font-semibold text-on-color transition-all hover:bg-accent-primary-hover active:scale-[0.98] active:bg-accent-primary-active"
          >
            <Plus className="size-5" strokeWidth={2.5} />
            New request
          </button>
        </div>
        <div className="flex items-center gap-1.5 border-b border-subtle px-3 py-2">
          <Search className="size-3.5 shrink-0 text-placeholder" />
          <input
            value={buscaProjeto}
            onChange={(e) => setBuscaProjeto(e.target.value)}
            placeholder="Search system"
            className="w-full bg-transparent text-12 outline-none placeholder:text-placeholder"
          />
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {/* "All" option */}
          <Link
            href={`/${workspaceSlug}/global-intake/`}
            className={cn(
              "flex w-full items-center gap-2 px-4 py-2 text-left text-13 transition-colors hover:bg-surface-2",
              !activeProject && "bg-surface-1-80 font-medium"
            )}
          >
            <Inbox className="size-3.5 text-secondary" />
            <span>All projects</span>
          </Link>
          {intakeProjects.length === 0 && (
            <p className="text-xs px-4 py-3 text-secondary">
              {termo ? `No system with "${buscaProjeto}".` : "No projects found."}
            </p>
          )}
          {intakeProjects.map((project) => {
            if (!project) return null;
            const isActive = activeProject?.id === project.id;
            return (
              <Link
                key={project.id}
                href={`/${workspaceSlug}/global-intake/?projectId=${project.id}`}
                className={cn(
                  "flex w-full items-center gap-2 px-4 py-2 text-left text-13 transition-colors hover:bg-surface-2",
                  isActive && "bg-surface-1-80 font-medium"
                )}
              >
                <Logo logo={project.logo_props} size={14} />
                <span className="truncate">{project.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Intake content */}
      <div className="h-full flex-1 overflow-hidden">
        {activeProject ? (
          <InboxIssueRoot
            workspaceSlug={workspaceSlug.toString()}
            projectId={activeProject.id}
            inboxIssueId={inboxIssueId}
            inboxAccessible={true}
          />
        ) : (
          <div className="flex h-full flex-col overflow-hidden">
            {/* Status filter tabs */}
            <div className="flex items-center gap-1 border-b border-subtle px-6 py-3">
              {[-2, -1, 0, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-12 font-medium transition-colors",
                    statusFilter === s
                      ? "bg-accent-primary text-white"
                      : "bg-surface-2 text-secondary hover:text-primary"
                  )}
                >
                  {INTAKE_STATUS_LABEL[s]}
                </button>
              ))}
              <div className="ml-auto">
                <PrintButton
                  documentTitle="Requests"
                  auditEntity="intake"
                  auditEntityId={currentWorkspace?.id ?? ""}
                  auditMetadata={{ escopo: "listagem" }}
                />
              </div>
            </div>

            <IntakeListPrintDocument
              title="Requests"
              subtitle={currentWorkspace?.name}
              statusLabel={INTAKE_STATUS_LABEL[statusFilter]}
              records={allIntakes}
            />

            <div className="flex-1 overflow-y-auto">
              {loadingAll && (
                <div className="flex h-full items-center justify-center text-13 text-secondary">Loading...</div>
              )}
              {!loadingAll && allIntakes.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-secondary">
                  <AlertCircle className="h-10 w-10 opacity-40" />
                  <p className="text-sm">No requests with status "{INTAKE_STATUS_LABEL[statusFilter]}".</p>
                </div>
              )}
              {!loadingAll &&
                allIntakes.map((intake: any) => (
                  <Link
                    key={intake.id}
                    href={`/${workspaceSlug}/global-intake/?projectId=${intake.project?.id}&inboxIssueId=${intake.issue?.id}`}
                    className="flex items-center gap-3 border-b border-subtle px-6 py-3 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-10 font-medium",
                            INTAKE_STATUS_COLOR[intake.status] ?? "bg-surface-2 text-secondary"
                          )}
                        >
                          {INTAKE_STATUS_LABEL[intake.status] ?? "?"}
                        </span>
                        {intake.project && (
                          <span className="shrink-0 text-11 text-tertiary">{intake.project.identifier}</span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-13">{intake.issue?.name ?? "Untitled"}</p>
                    </div>
                    <span className="shrink-0 text-11 text-tertiary">{calculateTimeAgo(intake.created_at)}</span>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
      {workspaceSlug && (
        <IntakeQuickCreate
          workspaceSlug={workspaceSlug.toString()}
          projectIds={(todosProjetos ?? []).map((p) => p.id)}
          projects={(todosProjetos ?? []).map((p) => ({ id: p.id, identifier: p.identifier, name: p.name }))}
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}
    </div>
  );
}

export default observer(GlobalIntakePage);
