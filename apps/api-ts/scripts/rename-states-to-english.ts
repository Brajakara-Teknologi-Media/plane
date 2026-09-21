/**
 * One-off migration: rename existing project states from PT to canonical English.
 * Runs ensureProjectDefaults() against every workspace so all projects get:
 *   - Legacy PT names renamed (state id preserved → issues stay linked)
 *   - Missing default states created
 *   - Backlog set as project default
 *
 * Idempotent: safe to run multiple times.
 *
 * Usage (from inside the api container):
 *   bun run scripts/rename-states-to-english.ts
 */
import {Pool} from "pg";
import {PrismaClient} from "@prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";
import {ensureProjectDefaults} from "../src/utils/project-defaults";

const pool = new Pool({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter: new PrismaPg(pool)});

async function main() {
  const workspaces = await prisma.workspace.findMany({
    where: {deletedAt: null},
    select: {id: true, name: true, slug: true},
  });

  console.log(`Found ${workspaces.length} workspace(s); normalizing states…`);

  let totals = {projects: 0, renamed: 0, created: 0, intakes: 0, labels: 0};
  for (const ws of workspaces) {
    const r = await ensureProjectDefaults(prisma, ws.id);
    totals.projects += r.projects;
    totals.renamed += r.statesRenamed;
    totals.created += r.statesCreated;
    totals.intakes += r.intakesCreated;
    totals.labels += r.labelsCreated;
    console.log(
      `  [${ws.slug}] ${r.projects} project(s), ${r.statesRenamed} renamed, ${r.statesCreated} created`,
    );
  }

  console.log("\n=== Done ===");
  console.log(`Projects touched: ${totals.projects}`);
  console.log(`States renamed:   ${totals.renamed}`);
  console.log(`States created:   ${totals.created}`);
  console.log(`Intakes created:  ${totals.intakes}`);
  console.log(`Labels created:   ${totals.labels}`);
}

main()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
