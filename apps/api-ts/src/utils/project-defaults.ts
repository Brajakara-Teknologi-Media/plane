// Canonical per-project defaults (English workflow). Shared by the seeder and the
// SAC migration so projects always get the full state set, intake enabled, and
// the standard labels — no matter how they were created.
//
// ensureProjectDefaults() is idempotent and safe to run on every startup; it is
// the single source of truth for "what every project must have".

// Default states created for every project (English). Order/sequence define the board.
export const DEFAULT_STATES = [
  {name: "Triage",      color: "#6366f1", group: "triage",    sequence: 5000,  isTriage: true},
  {name: "Backlog",     color: "#94a3b8", group: "backlog",   sequence: 10000, isDefault: true},
  {name: "Todo",        color: "#64748b", group: "unstarted", sequence: 15000},
  {name: "In Review",   color: "#eab308", group: "started",   sequence: 20000},
  {name: "In Progress", color: "#3b82f6", group: "started",   sequence: 25000},
  {name: "In Testing",  color: "#8b5cf6", group: "started",   sequence: 30000},
  {name: "Completed",   color: "#16a34a", group: "completed", sequence: 40000},
  {name: "Cancelled",   color: "#dc2626", group: "cancelled", sequence: 50000},
] as const;

// Legacy/old pt-BR names → canonical English. Renaming preserves the
// state id, so existing issues stay linked.
export const STATE_RENAME: Record<string, string> = {
  // Triage variants
  "In Take": "Triage",
  "In take": "Triage",
  "Triagem": "Triage",
  
  // Backlog variants
  Backlog: "Backlog",
  "Pendente": "Backlog",
  
  // Todo variants
  "A Fazer": "Todo",
  "Todo": "Todo",
  
  // In Review variants
  "Avaliando": "In Review",
  "Em Análise": "In Review",
  "Em Analise": "In Review",
  
  // In Progress variants
  "In Progress": "In Progress",
  "Em Desenvolvimento": "In Progress",
  "Em Andamento": "In Progress",
  
  // In Testing variants
  "In Test": "In Testing",
  "Em Teste": "In Testing",
  "Testando": "In Testing",
  "Em Testes": "In Testing",
  
  // Completed variants
  "Done": "Completed",
  "Concluído": "Completed",
  "Concluido": "Completed",
  "Feito": "Completed",
  
  // Cancelled variants
  "Cancelled": "Cancelled",
  "Cancelado": "Cancelled",
};

// Default labels with SLA (calendar hours; null = no auto deadline).
export const DEFAULT_LABELS = [
  {name: "Fix", color: "#ef4444", slaHours: 16},
  {name: "Improvement", color: "#3b82f6", slaHours: 96}, // 4 dias
  {name: "Project", color: "#8b5cf6", slaHours: null as number | null},
];

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Ensure every project in the workspace has the canonical states, intake enabled,
 * and the default labels. Accepts a PrismaClient instance (works from seed.ts and
 * the migration). Returns counts for logging.
 */
export async function ensureProjectDefaults(db: any, workspaceId: string) {
  const projects = await db.project.findMany({where: {workspaceId, deletedAt: null}, select: {id: true}});
  let statesRenamed = 0;
  let statesCreated = 0;
  let intakesCreated = 0;
  let labelsCreated = 0;

  for (const p of projects) {
    // ── States ──────────────────────────────────────────────────────────────
    const states = await db.state.findMany({where: {projectId: p.id, deletedAt: null}, select: {id: true, name: true}});
    const byName = new Map<string, {id: string; name: string}>(states.map((s: any) => [s.name, s]));

    // 1) rename legacy names → canonical pt-BR (only when target not present)
    for (const [from, to] of Object.entries(STATE_RENAME)) {
      if (byName.has(from) && !byName.has(to)) {
        const s = byName.get(from)!;
        await db.state.update({where: {id: s.id}, data: {name: to, slug: slugify(to)}});
        byName.set(to, s);
        byName.delete(from);
        statesRenamed++;
      }
    }

    // 1b) group-based exhaustive rename: any non-canonical name in known group → canonical
    const canonicalNames = new Set(DEFAULT_STATES.map(s => s.name));
    const groupToCanonical: Record<string, string> = {
      triage: "Triage",
      backlog: "Backlog",
      unstarted: "Todo",
      completed: "Completed",
      cancelled: "Cancelled",
    };
    
    // For started group: multiple canonical states by sequence (Review < Progress < Testing)
    const allStates = await db.state.findMany({
      where: {projectId: p.id, deletedAt: null},
      select: {id: true, name: true, group: true, sequence: true},
    });
    
    for (const st of allStates) {
      if (canonicalNames.has(st.name)) continue; // already canonical
      
      let targetName: string | null = null;
      
      if (st.group === "started") {
        // started group: map by sequence to closest canonical
        if (st.sequence < 22500) targetName = "In Review";       // seq < mid(20k,25k)
        else if (st.sequence < 27500) targetName = "In Progress"; // seq < mid(25k,30k)
        else targetName = "In Testing";
      } else {
        targetName = groupToCanonical[st.group] ?? null;
      }
      
      if (targetName && !byName.has(targetName)) {
        await db.state.update({where: {id: st.id}, data: {name: targetName, slug: slugify(targetName)}});
        byName.set(targetName, {id: st.id, name: targetName});
        byName.delete(st.name);
        statesRenamed++;
      }
    }

    // 2) create any missing default states
    for (const st of DEFAULT_STATES) {
      if (byName.has(st.name)) continue;
      await db.state.create({
        data: {
          projectId: p.id,
          workspaceId,
          name: st.name,
          color: st.color,
          group: st.group,
          sequence: st.sequence,
          default: false,
          isTriage: st.group === "triage",
          slug: slugify(st.name),
        },
      });
      statesCreated++;
    }

    // 3) default must be Backlog (never Completed)
    const pend = await db.state.findFirst({where: {projectId: p.id, name: "Backlog", deletedAt: null}, select: {id: true}});
    if (pend) {
      await db.state.updateMany({where: {projectId: p.id, default: true}, data: {default: false}});
      await db.state.update({where: {id: pend.id}, data: {default: true}});
    }

    // ── Intake ──────────────────────────────────────────────────────────────
    await db.project.update({where: {id: p.id}, data: {intakeView: true}});
    const intakeCount = await db.intake.count({where: {projectId: p.id}});
    if (intakeCount === 0) {
      await db.intake.create({data: {projectId: p.id, workspaceId, name: "Intake", isActive: true}});
      intakesCreated++;
    }

    // ── Default labels ────────────────────────────────────────────────────────
    for (const dl of DEFAULT_LABELS) {
      const exists = await db.label.findFirst({where: {projectId: p.id, name: dl.name, deletedAt: null}, select: {id: true}});
      if (exists) continue;
      await db.label.create({data: {workspaceId, projectId: p.id, name: dl.name, color: dl.color, slaHours: dl.slaHours}});
      labelsCreated++;
    }
  }

  return {projects: projects.length, statesRenamed, statesCreated, intakesCreated, labelsCreated};
}
