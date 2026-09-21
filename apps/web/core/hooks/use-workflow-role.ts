/**
 * Hooks for configurable workflow roles of the workspace.
 *
 * `GET /api/v1/workspaces/:slug/roles/` is the single source of truth for
 * permissions and stage transitions: the same records that the backend reads in
 * `resolveRole` / `canTransition`. There is no static mirrored matrix in the
 * frontend — while the configuration doesn't arrive, the hooks report `isLoading`
 * para que a UI desabilite o controle em vez de adivinhar uma resposta.
 *
 * Visibility by role no longer exists: whoever participates in the project sees all
 * chamados, em qualquer etapa.
 */
import useSWR from "swr";
import rolesService, { type TWorkflowRole } from "@/services/roles.service";

export type TWorkspaceWorkflowRoles = {
  roles: TWorkflowRole[] | undefined;
  isLoading: boolean;
};

export type TResolvedWorkflowRole = {
  workflowRole: TWorkflowRole | undefined;
  isLoading: boolean;
};

export function useWorkspaceWorkflowRoles(workspaceSlug?: string): TWorkspaceWorkflowRoles {
  const { data, isLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_WORKFLOW_ROLES_${workspaceSlug}` : null,
    workspaceSlug ? () => rolesService.list(workspaceSlug) : null,
    { revalidateOnFocus: false, revalidateIfStale: false, errorRetryCount: 2 }
  );
  return { roles: data, isLoading };
}

/** Effective configurable role of the user in the workspace (match by level, like the backend). */
export function useWorkflowRole(workspaceSlug?: string, roleLevel?: number): TResolvedWorkflowRole {
  const { roles, isLoading } = useWorkspaceWorkflowRoles(workspaceSlug);
  if (!roles || roleLevel === undefined) return { workflowRole: undefined, isLoading };
  return { workflowRole: roles.find((r) => r.level === roleLevel), isLoading };
}
