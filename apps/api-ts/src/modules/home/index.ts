/**
 * Home page summary.
 *
 * The home needs a dozen counts (mine, by stage, deadlines, triage queue).
 * Fetching each from a separate endpoint would make the screen open with ten
 * requests and flicker number by number — here they come out in one query.
 *
 * Everything is counted within the projects the user participates in: the
 * home is the personal view of the day, not a whole-workspace panel.
 */
import Elysia from "elysia";
import prisma from "@db";
import { authPlugin } from "@middleware/auth";
import { getWorkspaceOrFail, requireWorkspaceMember } from "@utils/workspace";

/** Groups that represent still-open work. */
const GRUPOS_ABERTOS = ["backlog", "unstarted", "started", "triage"];

/** Today's date at midnight, in the server timezone. */
function inicioDeHoje(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function somandoDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d;
}

export const homeModule = new Elysia({ prefix: "/workspaces/:slug" })
  .use(authPlugin)

  .get("/home-summary/", async ({ params: { slug }, user }) => {
    const ws = await getWorkspaceOrFail(slug);
    await requireWorkspaceMember(ws.id, user.id);

    const meusProjetos = await prisma.projectMember.findMany({
      where: { workspaceId: ws.id, memberId: user.id, isActive: true, deletedAt: null },
      select: { projectId: true },
    });
    const projectIds = meusProjetos.map((p) => p.projectId);

    // With no project there is nothing to count — returning zeros avoids the
    // screen showing "loading" forever on a freshly created account.
    if (projectIds.length === 0) {
      return {
        my_open: 0,
        my_overdue: 0,
        my_due_today: 0,
        created_by_me: 0,
        in_triage: 0,
        pending_requests: 0,
        completed_7d: 0,
        created_7d: 0,
        by_priority: [],
        by_stage: [],
        projects: 0,
      };
    }

    const hoje = inicioDeHoje();
    const amanha = somandoDias(hoje, 1);
    const seteDiasAtras = somandoDias(hoje, -7);

    const base = { workspaceId: ws.id, projectId: { in: projectIds }, deletedAt: null, isDraft: false } as const;
    const meus = { ...base, assignees: { some: { assigneeId: user.id, deletedAt: null } } };
    const abertos = { state: { group: { in: GRUPOS_ABERTOS } } };

    const [
      meus_abertos,
      meus_atrasados,
      meus_vencem_hoje,
      abertos_por_mim,
      em_triagem,
      solicitacoes_pendentes,
      concluidos_7d,
      criados_7d,
      prioridades,
      etapas,
    ] = await Promise.all([
      prisma.issue.count({ where: { ...meus, ...abertos } }),
      prisma.issue.count({ where: { ...meus, ...abertos, targetDate: { lt: hoje } } }),
      prisma.issue.count({ where: { ...meus, ...abertos, targetDate: { gte: hoje, lt: amanha } } }),
      prisma.issue.count({ where: { ...base, ...abertos, createdById: user.id } }),
      prisma.issue.count({ where: { ...base, state: { group: "triage" } } }),
      // Intake convention: -2 pending, -1 declined, 0 deferred, 1 accepted, 2 duplicate.
      prisma.intakeIssue.count({
        where: { workspaceId: ws.id, projectId: { in: projectIds }, deletedAt: null, status: { in: [-2, 0] } },
      }),
      prisma.issue.count({ where: { ...base, state: { group: "completed" }, completedAt: { gte: seteDiasAtras } } }),
      prisma.issue.count({ where: { ...base, createdAt: { gte: seteDiasAtras } } }),
      prisma.issue.groupBy({ by: ["priority"], where: { ...meus, ...abertos }, _count: { id: true } }),
      prisma.issue.groupBy({ by: ["stateId"], where: { ...meus, ...abertos }, _count: { id: true } }),
    ]);

    // States repeat per project; the home shows them by NAME, summed.
    const estados = await prisma.state.findMany({
      where: { id: { in: etapas.map((e) => e.stateId!).filter(Boolean) } },
      select: { id: true, name: true, color: true, group: true },
    });
    const porNome = new Map<string, { name: string; color: string; group: string; count: number }>();
    for (const linha of etapas) {
      const estado = estados.find((e) => e.id === linha.stateId);
      if (!estado) continue;
      const atual = porNome.get(estado.name) ?? { name: estado.name, color: estado.color, group: estado.group, count: 0 };
      atual.count += linha._count.id;
      porNome.set(estado.name, atual);
    }

    return {
      my_open: meus_abertos,
      my_overdue: meus_atrasados,
      my_due_today: meus_vencem_hoje,
      created_by_me: abertos_por_mim,
      in_triage: em_triagem,
      pending_requests: solicitacoes_pendentes,
      completed_7d: concluidos_7d,
      created_7d: criados_7d,
      by_priority: prioridades
        .map((p) => ({ priority: p.priority, count: p._count.id }))
        .sort((a, b) => b.count - a.count),
      by_stage: [...porNome.values()].sort((a, b) => b.count - a.count),
      projects: projectIds.length,
    };
  })

  /** My work items past their due date — the list the home highlights. */
  .get("/home-overdue/", async ({ params: { slug }, user, query }) => {
    const ws = await getWorkspaceOrFail(slug);
    await requireWorkspaceMember(ws.id, user.id);

    const limite = Math.min(Number(query.limit ?? 6) || 6, 20);
    const chamados = await prisma.issue.findMany({
      where: {
        workspaceId: ws.id,
        deletedAt: null,
        isDraft: false,
        assignees: { some: { assigneeId: user.id, deletedAt: null } },
        state: { group: { in: GRUPOS_ABERTOS } },
        targetDate: { lt: inicioDeHoje() },
      },
      orderBy: { targetDate: "asc" },
      take: limite,
      select: {
        id: true,
        name: true,
        priority: true,
        targetDate: true,
        sequenceId: true,
        project: { select: { id: true, identifier: true, name: true } },
        state: { select: { name: true, color: true, group: true } },
      },
    });

    return chamados.map((c) => ({
      id: c.id,
      name: c.name,
      priority: c.priority,
      target_date: c.targetDate,
      sequence_id: c.sequenceId,
      project_id: c.project.id,
      project_identifier: c.project.identifier,
      project_name: c.project.name,
      state_name: c.state?.name ?? null,
      state_color: c.state?.color ?? null,
      state_group: c.state?.group ?? null,
    }));
  });
