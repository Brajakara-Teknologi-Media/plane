/**
 * Copy objek MinIO dari key lama (dari Plane/Django, stored di `attributes.old_asset`)
 * ke key baru (UUID = file_assets.id) yang dipakai api-ts.
 *
 * Uso:
 *   docker compose -f docker-compose.prod.yml exec api-ts bun run scripts/rekey-legacy-assets.ts
 *
 * Env:
 *   DRY_RUN=true    (default false)
 *   BATCH=50
 */

import {PrismaPg} from "@prisma/adapter-pg";
import {PrismaClient} from "@prisma/client";
import {Pool} from "pg";

const pool = new Pool({connectionString: process.env.DATABASE_URL});
const prisma = new PrismaClient({adapter: new PrismaPg(pool)});

const DRY_RUN = process.env.DRY_RUN === "true";
const BATCH = Number(process.env.BATCH ?? 50);

async function getS3Client() {
  const instance = await prisma.instance.findFirst({select: {configurations: true}});
  const cfg = (instance?.configurations as any)?.s3;
  if (!cfg?.endpoint || !cfg?.bucket) throw new Error("S3 not configured");
  return new (Bun as any).S3Client({
    accessKeyId: cfg.access_key,
    secretAccessKey: cfg.secret_key,
    region: cfg.region || "auto",
    endpoint: cfg.endpoint,
    bucket: cfg.bucket,
  });
}

async function main() {
  const s3 = await getS3Client();

  const rows = await prisma.fileAsset.findMany({
    where: {isUploaded: true, isDeleted: false},
    select: {id: true, asset: true, attributes: true, mimeType: true},
  });

  console.log(`[rekey] Found ${rows.length} uploaded assets. DRY_RUN=${DRY_RUN}`);

  let ok = 0, skip = 0, miss = 0, err = 0;

  for (const row of rows) {
    const oldKey = (row.attributes as any)?.old_asset ?? null;
    if (!oldKey || oldKey === row.id) { skip++; continue; }

    try {
      const newFile = s3.file(row.id);
      if (await newFile.exists()) { skip++; continue; } // already migrated

      const oldFile = s3.file(oldKey);
      if (!(await oldFile.exists())) {
        console.warn(`[rekey] MISS: ${row.id} old=${oldKey}`);
        miss++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`[rekey] DRY: ${oldKey} -> ${row.id}`);
        ok++;
        continue;
      }

      const buf = await oldFile.arrayBuffer();
      await newFile.write(new Blob([buf], {type: row.mimeType ?? "application/octet-stream"}));
      ok++;
      if (ok % 10 === 0) console.log(`[rekey] ${ok}/${rows.length} copied`);
    } catch (e) {
      console.error(`[rekey] ERR ${row.id}:`, (e as Error).message);
      err++;
    }
  }

  console.log(`\n[rekey] Done: ok=${ok} skip=${skip} miss=${miss} err=${err}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error("[rekey] failed:", e);
  process.exit(1);
});
