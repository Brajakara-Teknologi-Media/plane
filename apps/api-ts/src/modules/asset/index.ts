import Elysia from "elysia";
import { authPlugin } from "@middleware/auth";
import prisma from "@db";
import { paginate } from "@utils/pagination";
import { getWorkspaceOrFail, getProjectOrFail , requireWorkspaceMember} from "@utils/workspace";
import { saveAsset, serveAsset, copyAsset } from "@utils/storage";
import { AUDIT_ACTIONS, AUDIT_ENTITIES, recordAudit } from "@utils/audit";

const ENTITY_TYPE_MAP: Record<string, number> = {
  COMMENT_DESCRIPTION: 4, ISSUE_ATTACHMENT: 2, ISSUE_DESCRIPTION: 2,
  DRAFT_ISSUE_DESCRIPTION: 2, PAGE_DESCRIPTION: 3, PROJECT_COVER: 1,
  USER_AVATAR: 0, USER_COVER: 0, WORKSPACE_LOGO: 0,
};

// Files are stored in the configured S3 bucket when one is set up (workspace
// settings → Storage), otherwise on local disk. See utils/storage.ts.
async function saveFile(assetId: string, file: Blob) {
  await saveAsset(assetId, file);
}

function serveFile(assetId: string, mimeType?: string | null) {
  return serveAsset(assetId, mimeType);
}

// Entity types enum: 0=workspace, 1=project, 2=issue, 3=page, 4=comment
const ENTITY_TYPE = { WORKSPACE: 0, PROJECT: 1, ISSUE: 2, PAGE: 3, COMMENT: 4 };

export const assetModule = new Elysia({ prefix: "/workspaces/:slug" })
  .use(authPlugin)

  // ── Workspace-level file assets ───────────────────────────────────────────

  .post("/assets/", async ({ params: { slug }, body, user, set }) => {
    const ws = await getWorkspaceOrFail(slug);
    await requireWorkspaceMember(ws.id, user.id);
    const b = body as any;
    if (!b.asset) { set.status = 400; return { detail: "asset (file path/key) is required." }; }

    const asset = await prisma.fileAsset.create({
      data: {
        workspaceId: ws.id,
        entityType: b.entity_type ?? ENTITY_TYPE.WORKSPACE,
        entityId: b.entity_id || null,
        asset: b.asset,
        size: b.size ?? 0,
        mimeType: b.mime_type ?? null,
        attributes: b.attributes ?? {},
        isUploaded: b.is_uploaded ?? false,
      },
    });
    set.status = 201;
    return asset;
  })

  .get("/assets/", async ({ params: { slug }, user, query }) => {
    const ws = await getWorkspaceOrFail(slug);
    await requireWorkspaceMember(ws.id, user.id);
    const where: any = { workspaceId: ws.id, isDeleted: false };
    if (query.entity_type !== undefined) where.entityType = Number(query.entity_type);
    if (query.entity_id) where.entityId = query.entity_id;
    return paginate({
      query: (skip, take) => prisma.fileAsset.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      count: () => prisma.fileAsset.count({ where }),
      cursor: query.cursor as string | undefined,
    });
  })

  .get("/assets/:asset_id/", async ({ params: { slug, asset_id }, user }) => {
    const ws = await getWorkspaceOrFail(slug);
    await requireWorkspaceMember(ws.id, user.id);
    return prisma.fileAsset.findFirstOrThrow({ where: { id: asset_id, workspaceId: ws.id, isDeleted: false } });
  })

  .patch("/assets/:asset_id/", async ({ params: { slug, asset_id }, body, user }) => {
    const ws = await getWorkspaceOrFail(slug);
    await requireWorkspaceMember(ws.id, user.id);
    const b = body as any;
    const data: any = {};
    if (b.is_uploaded !== undefined) data.isUploaded = b.is_uploaded;
    if (b.attributes !== undefined) data.attributes = b.attributes;
    await prisma.fileAsset.findFirstOrThrow({ where: { id: asset_id, workspaceId: ws.id } });
    return prisma.fileAsset.update({ where: { id: asset_id }, data });
  })

  .delete("/assets/:asset_id/", async ({ params: { slug, asset_id }, user, set }) => {
    const ws = await getWorkspaceOrFail(slug);
    await requireWorkspaceMember(ws.id, user.id);
    await prisma.fileAsset.findFirstOrThrow({ where: { id: asset_id, workspaceId: ws.id } });
    await prisma.fileAsset.update({ where: { id: asset_id }, data: { isDeleted: true, deletedAt: new Date() } });
    set.status = 204;
    return null;
  })

  // ── Issue attachments (IssueAttachment model) ────────────────────────────

  .get(
    "/projects/:project_id/issues/:issue_id/attachments/",
    async ({ params: { slug, project_id, issue_id }, user, query }) => {
      const ws = await getWorkspaceOrFail(slug);
      await getProjectOrFail(ws.id, project_id, user.id);
      const where = { issueId: issue_id, deletedAt: null };
      return paginate({
        query: (skip, take) => prisma.issueAttachment.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
        count: () => prisma.issueAttachment.count({ where }),
        cursor: query.cursor as string | undefined,
      });
    }
  )

  .post(
    "/projects/:project_id/issues/:issue_id/attachments/",
    async ({ params: { slug, project_id, issue_id }, body, user, set }) => {
      const ws = await getWorkspaceOrFail(slug);
      await getProjectOrFail(ws.id, project_id, user.id);
      const b = body as any;
      if (!b.asset) { set.status = 400; return { detail: "asset is required." }; }

      const attachment = await prisma.issueAttachment.create({
        data: {
          issueId: issue_id,
          workspaceId: ws.id,
          projectId: project_id,
          asset: b.asset,
          attributes: b.attributes ?? {},
          externalSource: b.external_source ?? null,
          externalId: b.external_id ?? null,
        },
      });
      set.status = 201;
      return attachment;
    }
  )

  .delete(
    "/projects/:project_id/issues/:issue_id/attachments/:attachment_id/",
    async ({ params: { slug, project_id, issue_id, attachment_id }, user, set }) => {
      const ws = await getWorkspaceOrFail(slug);
      await getProjectOrFail(ws.id, project_id, user.id);
      await prisma.issueAttachment.update({ where: { id: attachment_id }, data: { deletedAt: new Date() } });
      set.status = 204;
      return null;
    }
  );

// ── assets/v2 — new attachment API (frontend calls /api/assets/v2/workspaces/...) ──────
export const assetV2Module = new Elysia({ prefix: "/assets/v2/workspaces/:slug" })
  .use(authPlugin)

  // ── Workspace-level asset upload ─────────────────────────────────────────────
  .post("/", async ({params: {slug}, body, user, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    const b = body as any;
    const entityTypeStr = b.entity_type ?? "WORKSPACE_LOGO";
    const ext = (b.name ?? "file").split(".").pop() ?? "bin";
    const asset = await prisma.fileAsset.create({
      data: {
        workspaceId: ws.id, entityType: ENTITY_TYPE_MAP[entityTypeStr] ?? 0,
        entityId: b.entity_identifier || null, asset: `ws/${ws.id}/${Date.now()}.${ext}`,
        size: b.size ?? 0, mimeType: b.type ?? null,
        attributes: {name: b.name, type: b.type, size: b.size, entity_type: entityTypeStr},
        isUploaded: false,
      },
    });
    set.status = 200;
    return {
      asset_id: asset.id,
      asset_url: `/api/assets/v2/workspaces/${slug}/${asset.id}/`,
      upload_data: {url: `/api/assets/v2/workspaces/${slug}/${asset.id}/upload/`, fields: {}},
    };
  })

  .patch("/:asset_id/", async ({params: {slug, asset_id}}) => {
    const ws = await getWorkspaceOrFail(slug);
    const asset = await prisma.fileAsset.findFirst({where: {id: asset_id, workspaceId: ws.id}});
    await prisma.fileAsset.updateMany({where: {id: asset_id, workspaceId: ws.id}, data: {isUploaded: true}});
    if (asset && asset.entityType === 0) {
      await prisma.workspace.update({where: {id: ws.id}, data: {logo: asset_id}});
    }
    return {status: "uploaded"};
  })

  .post("/:asset_id/upload/", async ({params: {slug, asset_id}, body}) => {
    const ws = await getWorkspaceOrFail(slug);
    const file: Blob | null = (body as any).file ?? null;
    if (!file) throw new Error("No file provided in request body");
    await saveFile(asset_id, file);
    const asset = await prisma.fileAsset.findFirst({where: {id: asset_id, workspaceId: ws.id}});
    await prisma.fileAsset.updateMany({where: {id: asset_id, workspaceId: ws.id}, data: {isUploaded: true}});
    if (asset && asset.entityType === 0) {
      await prisma.workspace.update({where: {id: ws.id}, data: {logo: asset_id}});
    }
    return {status: "uploaded", asset_id};
  })

  .get("/:asset_id/", async ({params: {slug, asset_id}, set, user, headers}) => {
    const ws = await getWorkspaceOrFail(slug);
    const asset = await prisma.fileAsset.findFirst({where: {id: asset_id, workspaceId: ws.id, isDeleted: false}});
    if (!asset) { set.status = 404; return {detail: "File not found."}; }
    // LGPD: baixar um anexo é acesso a dado — registra quem, o quê e de onde.
    recordAudit({
      workspaceId: ws.id,
      entity: AUDIT_ENTITIES.ATTACHMENT,
      entityId: asset.id,
      action: AUDIT_ACTIONS.DOWNLOAD,
      actor: user,
      headers,
      metadata: {nome: (asset.attributes as any)?.name ?? null, tipo: asset.mimeType},
    });
    const fileResponse = await serveFile(asset_id, asset.mimeType);
    if (fileResponse) return fileResponse;
    return {id: asset.id, asset_url: `/media/${asset.asset}`, asset: asset.asset};
  })

  .delete("/:asset_id/", async ({params: {slug, asset_id}, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    await prisma.fileAsset.updateMany({where: {id: asset_id, workspaceId: ws.id}, data: {isDeleted: true, deletedAt: new Date()}}).catch(() => {});
    set.status = 204;
    return null;
  })

  .post("/:asset_id/bulk/", async ({params: {slug}, body}) => {
    const ws = await getWorkspaceOrFail(slug);
    const ids: string[] = (body as any).asset_ids ?? [];
    if (ids.length) await prisma.fileAsset.updateMany({where: {id: {in: ids}, workspaceId: ws.id}, data: {isUploaded: true}}).catch(() => {});
    return {updated: ids.length};
  })

  .get("/check/:asset_id/", async ({params: {slug, asset_id}, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    const asset = await prisma.fileAsset.findFirst({where: {id: asset_id, workspaceId: ws.id}});
    return {exists: !!asset, is_uploaded: asset?.isUploaded ?? false};
  })

  .post("/restore/:asset_id/", async ({params: {slug, asset_id}}) => {
    const ws = await getWorkspaceOrFail(slug);
    await prisma.fileAsset.updateMany({where: {id: asset_id, workspaceId: ws.id}, data: {isDeleted: false, deletedAt: null}}).catch(() => {});
    return {status: "restored"};
  })

  .post("/duplicate-assets/:asset_id/", async ({params: {slug, asset_id}, body, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    const b = body as any;
    const original = await prisma.fileAsset.findFirst({where: {id: asset_id, workspaceId: ws.id}});
    if (!original) { set.status = 404; return {detail: "File not found."}; }
    const dup = await prisma.fileAsset.create({
      data: {
        workspaceId: ws.id, projectId: b.project_id || original.projectId,
        entityType: original.entityType, entityId: b.entity_id || original.entityId,
        asset: original.asset, size: original.size, mimeType: original.mimeType,
        attributes: original.attributes as any, isUploaded: original.isUploaded,
      },
    });
    // Copy the underlying file (S3 or local) to the new asset id.
    await copyAsset(asset_id, dup.id).catch(() => {});
    return {[asset_id]: dup.id};
  })

  // ── User assets ──────────────────────────────────────────────────────────────
  .post("/user-assets/", async ({body, user, set}) => {
    const b = body as any;
    const entityTypeStr = b.entity_type ?? "USER_AVATAR";
    const ext = (b.name ?? "file").split(".").pop() ?? "bin";
    const asset = await prisma.fileAsset.create({
      data: {
        entityType: ENTITY_TYPE_MAP[entityTypeStr] ?? 0, entityId: user.id,
        asset: `user/${user.id}/${Date.now()}.${ext}`,
        size: b.size ?? 0, mimeType: b.type ?? null,
        attributes: {name: b.name, type: b.type, size: b.size, entity_type: entityTypeStr},
        isUploaded: false,
      },
    });
    set.status = 200;
    return {
      asset_id: asset.id,
      asset_url: `/api/assets/v2/user-assets/${asset.id}/`,
      upload_data: {url: `/api/assets/v2/user-assets/${asset.id}/upload/`, fields: {}},
    };
  })

  // ── Project-level assets ─────────────────────────────────────────────────────
  .post("/projects/:project_id/", async ({params: {slug, project_id}, body, user, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    await getProjectOrFail(ws.id, project_id, user.id);
    const b = body as any;
    const entityTypeStr = b.entity_type ?? "PROJECT_COVER";
    const ext = (b.name ?? "file").split(".").pop() ?? "bin";
    const asset = await prisma.fileAsset.create({
      data: {
        workspaceId: ws.id, projectId: project_id,
        entityType: ENTITY_TYPE_MAP[entityTypeStr] ?? 1,
        entityId: b.entity_identifier || null,
        asset: `proj/${project_id}/${Date.now()}.${ext}`,
        size: b.size ?? 0, mimeType: b.type ?? null,
        attributes: {name: b.name, type: b.type, size: b.size, entity_type: entityTypeStr},
        isUploaded: false,
      },
    });
    set.status = 200;
    return {
      asset_id: asset.id,
      asset_url: `/api/assets/v2/workspaces/${slug}/projects/${project_id}/${asset.id}/`,
      upload_data: {url: `/api/assets/v2/workspaces/${slug}/projects/${project_id}/${asset.id}/upload/`, fields: {}},
    };
  })

  .patch("/projects/:project_id/:asset_id/", async ({params: {slug, project_id, asset_id}}) => {
    const ws = await getWorkspaceOrFail(slug);
    await prisma.fileAsset.updateMany({where: {id: asset_id, workspaceId: ws.id}, data: {isUploaded: true}});
    return {status: "uploaded"};
  })

  .post("/projects/:project_id/:asset_id/upload/", async ({params: {slug, project_id, asset_id}, body}) => {
    const ws = await getWorkspaceOrFail(slug);
    const file: Blob | null = (body as any).file ?? null;
    if (!file) throw new Error("No file provided in request body");
    await saveFile(asset_id, file);
    await prisma.fileAsset.updateMany({where: {id: asset_id, workspaceId: ws.id}, data: {isUploaded: true}});
    return {status: "uploaded", asset_id};
  })

  .get("/projects/:project_id/:asset_id/", async ({params: {slug, project_id, asset_id}, set, user, headers}) => {
    const ws = await getWorkspaceOrFail(slug);
    const asset = await prisma.fileAsset.findFirst({where: {id: asset_id, workspaceId: ws.id, isDeleted: false}});
    if (!asset) { set.status = 404; return {detail: "File not found."}; }
    // LGPD: baixar um anexo é acesso a dado — registra quem, o quê e de onde.
    recordAudit({
      workspaceId: ws.id,
      entity: AUDIT_ENTITIES.ATTACHMENT,
      entityId: asset.id,
      action: AUDIT_ACTIONS.DOWNLOAD,
      actor: user,
      headers,
      metadata: {nome: (asset.attributes as any)?.name ?? null, tipo: asset.mimeType},
    });
    const fileResponse = await serveFile(asset_id, asset.mimeType);
    if (fileResponse) return fileResponse;
    return {id: asset.id, asset_url: `/media/${asset.asset}`, asset: asset.asset};
  })

  .post("/projects/:project_id/:asset_id/bulk/", async ({params: {slug}, body}) => {
    const ws = await getWorkspaceOrFail(slug);
    const ids: string[] = (body as any).asset_ids ?? [];
    if (ids.length) await prisma.fileAsset.updateMany({where: {id: {in: ids}, workspaceId: ws.id}, data: {isUploaded: true}}).catch(() => {});
    return {updated: ids.length};
  })

  // ── Issue/Epic/Work-item attachments (alias routes) ──
  // Frontend uses /:service_type/ segment (issues | epics | work-items), but Elysia radix router
  // requires identical param names at the same position. Rename to :asset_id to match existing routes.
  // The literal "attachments/" segment after :issue_id disambiguates from other :asset_id routes.
  .get("/projects/:project_id/:asset_id/:issue_id/attachments/", async ({params: {slug, project_id, issue_id}, user, query}) => {
    const ws = await getWorkspaceOrFail(slug);
    await getProjectOrFail(ws.id, project_id, user.id);
    const where = {issueId: issue_id, deletedAt: null};
    const cursor = typeof query.cursor === "string" ? query.cursor : undefined;
    return paginate({
      query: (skip, take) => prisma.issueAttachment.findMany({where, skip, take, orderBy: {createdAt: "desc"}}),
      count: () => prisma.issueAttachment.count({where}),
      cursor,
      // Local shape covers the columns we read; keeps this callsite type-safe
      // regardless of whether Prisma client types are generated.
      transform: (items) => (items as ReadonlyArray<{
        id: string;
        asset: string;
        attributes: unknown;
        createdAt: Date;
        updatedAt: Date;
      }>).map((a) => ({
        id: a.id,
        issue_id: issue_id,
        asset_url: `/api/assets/v2/workspaces/${slug}/projects/${project_id}/${a.asset}/`,
        attributes: (a.attributes ?? {}) as Record<string, unknown>,
        created_at: a.createdAt.toISOString(),
        updated_at: a.updatedAt.toISOString(),
        created_by: "",
        updated_by: "",
      })),
    });
  })

  .post("/projects/:project_id/:asset_id/:issue_id/attachments/", async ({params: {slug, project_id, issue_id}, body, user, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    await getProjectOrFail(ws.id, project_id, user.id);

    const meta = (typeof body === "object" && body !== null ? body : {}) as {
      name?: string; type?: string; size?: number;
    };
    const name = typeof meta.name === "string" ? meta.name : "file";
    const size = typeof meta.size === "number" ? meta.size : 0;
    const mimeType = typeof meta.type === "string" ? meta.type : null;

    // 1. Create FileAsset placeholder (isUploaded false — flipped by /upload/).
    const asset = await prisma.fileAsset.create({
      data: {
        workspaceId: ws.id, projectId: project_id,
        entityType: ENTITY_TYPE_MAP["ISSUE_ATTACHMENT"] ?? 2,
        entityId: issue_id,
        asset: `issues/${issue_id}/${Date.now()}-${name}`,
        size,
        mimeType,
        attributes: {name, type: mimeType, size},
        isUploaded: false,
      },
    });

    // 2. Create IssueAttachment row pointing at FileAsset.id.
    const attachment = await prisma.issueAttachment.create({
      data: {
        issueId: issue_id,
        workspaceId: ws.id,
        projectId: project_id,
        asset: asset.id,
        attributes: {name, size},
      },
    });

    set.status = 201;
    // 3. Return signed-URL response (matches TIssueAttachmentUploadResponse).
    return {
      asset_id: asset.id,
      asset_url: `/api/assets/v2/workspaces/${slug}/projects/${project_id}/${asset.id}/`,
      upload_data: {
        url: `/api/assets/v2/workspaces/${slug}/projects/${project_id}/${asset.id}/upload/`,
        fields: {},
      },
      attachment: {
        id: attachment.id,
        issue_id: issue_id,
        asset_url: `/api/assets/v2/workspaces/${slug}/projects/${project_id}/${asset.id}/`,
        attributes: (attachment.attributes ?? {}) as Record<string, unknown>,
        created_at: attachment.createdAt.toISOString(),
        updated_at: attachment.updatedAt.toISOString(),
        created_by: user.id,
        updated_by: user.id,
      },
    };
  })

  .patch("/projects/:project_id/:asset_id/:issue_id/attachments/:attachment_id/", async ({params: {slug, project_id, issue_id, attachment_id}, user, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    await getProjectOrFail(ws.id, project_id, user.id);

    // Frontend passes the FileAsset id (asset_id from the signed-URL response) as attachment_id.
    // Locate the IssueAttachment via the `asset` foreign key, then finalize the upload.
    const attachment = await prisma.issueAttachment.findFirst({
      where: {asset: attachment_id, issueId: issue_id, deletedAt: null},
    });
    if (!attachment) { set.status = 404; return {detail: "Attachment not found."}; }

    await prisma.fileAsset.updateMany({
      where: {id: attachment_id, workspaceId: ws.id},
      data: {isUploaded: true},
    });

    const updated = await prisma.issueAttachment.update({
      where: {id: attachment.id},
      data: {updatedAt: new Date()},
    });

    return {
      id: updated.id,
      issue_id: issue_id,
      asset_url: `/api/assets/v2/workspaces/${slug}/projects/${project_id}/${attachment_id}/`,
      attributes: (updated.attributes ?? {}) as Record<string, unknown>,
      created_at: updated.createdAt.toISOString(),
      updated_at: updated.updatedAt.toISOString(),
      created_by: user.id,
      updated_by: user.id,
    };
  })

  .delete("/projects/:project_id/:asset_id/:issue_id/attachments/:attachment_id/", async ({params: {slug, project_id, issue_id, attachment_id}, user, set}) => {
    const ws = await getWorkspaceOrFail(slug);
    await getProjectOrFail(ws.id, project_id, user.id);
    await prisma.issueAttachment.update({where: {id: attachment_id}, data: {deletedAt: new Date()}});
    set.status = 204;
    return null;
  });

// ── User assets module (separate prefix) ─────────────────────────────────────
export const userAssetV2Module = new Elysia({ prefix: "/assets/v2/user-assets" })
  .use(authPlugin)

  .post("/", async ({body, user, set}) => {
    const b = body as any;
    const entityTypeStr = b.entity_type ?? "USER_AVATAR";
    const ext = (b.name ?? "file").split(".").pop() ?? "bin";
    const asset = await prisma.fileAsset.create({
      data: {
        entityType: ENTITY_TYPE_MAP[entityTypeStr] ?? 0, entityId: user.id,
        asset: `user/${user.id}/${Date.now()}.${ext}`,
        size: b.size ?? 0, mimeType: b.type ?? null,
        attributes: {name: b.name, type: b.type, size: b.size, entity_type: entityTypeStr},
        isUploaded: false,
      },
    });
    set.status = 200;
    return {
      asset_id: asset.id,
      asset_url: `/api/assets/v2/user-assets/${asset.id}/`,
      upload_data: {url: `/api/assets/v2/user-assets/${asset.id}/upload/`, fields: {}},
    };
  })

  .patch("/:asset_id/", async ({params: {asset_id}, user}) => {
    await prisma.fileAsset.updateMany({where: {id: asset_id, entityId: user.id}, data: {isUploaded: true}});
    return {status: "uploaded"};
  })

  .post("/:asset_id/upload/", async ({params: {asset_id}, body, user}) => {
    const file: Blob | null = (body as any).file ?? null;
    if (!file) throw new Error("No file provided in request body");
    await saveFile(asset_id, file);
    await prisma.fileAsset.updateMany({where: {id: asset_id}, data: {isUploaded: true}});
    return {status: "uploaded", asset_id};
  })

  .get("/:asset_id/", async ({params: {asset_id}, set, user, headers}) => {
    const asset = await prisma.fileAsset.findFirst({where: {id: asset_id, isDeleted: false}});
    if (!asset) { set.status = 404; return {detail: "File not found."}; }
    // LGPD: baixar um anexo é acesso a dado — registra quem, o quê e de onde.
    // Esta rota não tem workspace no caminho; usa o do próprio arquivo.
    if (asset.workspaceId) recordAudit({
      workspaceId: asset.workspaceId,
      entity: AUDIT_ENTITIES.ATTACHMENT,
      entityId: asset.id,
      action: AUDIT_ACTIONS.DOWNLOAD,
      actor: user,
      headers,
      metadata: {nome: (asset.attributes as any)?.name ?? null, tipo: asset.mimeType},
    });
    const fileResponse = await serveFile(asset_id, asset.mimeType);
    if (fileResponse) return fileResponse;
    return {id: asset.id, asset_url: `/media/${asset.asset}`};
  })

  .delete("/:asset_id/", async ({params: {asset_id}, user, set}) => {
    await prisma.fileAsset.updateMany({where: {id: asset_id, entityId: user.id}, data: {isDeleted: true, deletedAt: new Date()}}).catch(() => {});
    set.status = 204;
    return null;
  });
