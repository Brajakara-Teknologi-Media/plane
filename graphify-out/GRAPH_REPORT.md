# Graph Report - apps/api-ts  (2026-08-11)

## Corpus Check
- 166 files · ~127,524 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 706 nodes · 2018 edges · 29 communities (26 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 27 edges (avg confidence: 0.64)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Core App & Middleware
- Database & Replication
- Auth & Framework (Elysia)
- Quick Links & Settings
- Prisma Client & Deps
- Asset Upload Module
- Seed & Config
- Build Artifacts & Types
- File Storage Utilities
- Auth Flows & DTOs
- Instance Config & SLA
- Plugin Manifest & Types
- Advanced Analytics
- Audit Log & MIME
- Plugin Storage Drivers
- Plugin Admin & Schema
- Notifications & Realtime
- Plugin ZIP Extraction
- AI Provider Module
- Plugin Registry & Audit
- Widget SDK Gateway
- Crypto & Webhooks
- Rate Limiter
- JWT Test Utilities
- Widget Storage Driver
- HTTP Response Helpers

## God Nodes (most connected - your core abstractions)
1. `getWorkspaceOrFail()` - 73 edges
2. `paginate()` - 52 edges
3. `cleanDb()` - 45 edges
4. `createUser()` - 44 edges
5. `authPlugin` - 42 edges
6. `requireWorkspaceMember()` - 42 edges
7. `createWorkspace()` - 39 edges
8. `getProjectOrFail()` - 33 edges
9. `createProject()` - 32 edges
10. `createApiToken()` - 31 edges

## Surprising Connections (you probably didn't know these)
- `main()` --indirect_call--> `role()`  [INFERRED]
  scripts/seed.ts → tests/unit/permissions.test.ts
- `importBinary()` --calls--> `saveAsset()`  [EXTRACTED]
  scripts/migrate-sac-files.ts → src/utils/storage.ts
- `main()` --calls--> `seedWorkflowRoles()`  [EXTRACTED]
  scripts/seed.ts → src/utils/permissions.ts
- `main()` --calls--> `sincronizarFuncaoNosProjetos()`  [EXTRACTED]
  scripts/seed.ts → src/utils/permissions.ts
- `main()` --calls--> `ensureProjectDefaults()`  [EXTRACTED]
  scripts/seed.ts → src/utils/project-defaults.ts

## Import Cycles
- None detected.

## Communities (29 total, 3 thin omitted)

### Community 0 - "Core App & Middleware"
Cohesion: 0.05
Nodes (105): App, authApp, corsConfig, PORT, authPlugin, AuthUnavailableError, AuthUser, JWT_SECRET_BYTES (+97 more)

### Community 1 - "Database & Replication"
Cohesion: 0.09
Nodes (36): apiApp, replicateToLinkedIntakes(), isWorkspaceMember(), ETAPAS, Envelope, Envelope, ETAPAS, addAssignee() (+28 more)

### Community 2 - "Auth & Framework (Elysia)"
Cohesion: 0.04
Nodes (46): elysia, @elysiajs/bearer, @elysiajs/cors, @elysiajs/jwt, @elysiajs/swagger, fflate, jose, mysql2 (+38 more)

### Community 3 - "Quick Links & Settings"
Cohesion: 0.09
Nodes (39): getStoredQuickLinks(), getWorkspaceQuickLinks(), mergePrintSettings(), normalizeQuickLinkUrl(), PrintSettingsRecord, QuickLinkRecord, readPrintSettings(), RecentActivityRecord (+31 more)

### Community 4 - "Prisma Client & Deps"
Cohesion: 0.06
Nodes (36): trustedDependencies, prisma, @prisma/client, log(), main(), pool, prisma, log() (+28 more)

### Community 5 - "Asset Upload Module"
Cohesion: 0.11
Nodes (34): assetV2Module, ENTITY_TYPE, ENTITY_TYPE_MAP, saveFile(), serveFile(), userAssetV2Module, auditModule, buildWhere() (+26 more)

### Community 6 - "Seed & Config"
Cohesion: 0.12
Nodes (25): ADMINS_EXTRAS, DEFAULT_INSTANCE_CONFIG(), log(), main(), pool, prisma, ALL_ACTIONS, CONTRIBUTOR (+17 more)

### Community 7 - "Build Artifacts & Types"
Cohesion: 0.08
Nodes (26): dist, node_modules, ./prisma.config.ts, ./src/**/*, ./src/db.ts, ./src/middleware/*, ./src/modules/*, ./src/utils/* (+18 more)

### Community 8 - "File Storage Utilities"
Cohesion: 0.18
Nodes (23): assetKeyFor(), BATCH_SIZE, FETCH_TIMEOUT_MS, fileNameFor(), FILES_BASE, HAS_SOURCE, importBinary(), importMessageAttachment() (+15 more)

### Community 9 - "Auth Flows & DTOs"
Cohesion: 0.25
Nodes (17): auditAuth(), AUTH_ERR, authRedirect(), authUserDto(), clearCookieHeader(), emailCheck(), JWT_SECRET_BYTES, resolveTokenFromRequest() (+9 more)

### Community 10 - "Instance Config & SLA"
Cohesion: 0.18
Nodes (16): ADMIN_CONFIG_DEFAULTS, buildInstanceConfig(), clearCookieHeader(), DEFAULT_PRIORITY_SLA, instanceConfigurationsDto(), instanceModule, isTruthy(), JWT_SECRET_BYTES (+8 more)

### Community 11 - "Plugin Manifest & Types"
Cohesion: 0.16
Nodes (16): CONFIG_FIELD_TYPES, PluginBackendManifest, PluginConfigField, PluginContributions, PluginDefinedPermission, PluginPageContribution, PluginSidebarContribution, slugify() (+8 more)

### Community 12 - "Advanced Analytics"
Cohesion: 0.18
Nodes (15): advanceAnalyticsModule, Agrupador, AGRUPADORES, agruparPorColuna(), Consulta, contadores(), criadosVersusResolvidos(), filtroChamados() (+7 more)

### Community 13 - "Audit Log & MIME"
Cohesion: 0.19
Nodes (10): ALLOWED_BUNDLE_MIME, auditLog(), requireInstanceAdmin(), serializeWidget(), widgetModule, ExtractedWidget, extractWidgetZip(), MAX_BUNDLE_BYTES (+2 more)

### Community 14 - "Plugin Storage Drivers"
Cohesion: 0.15
Nodes (6): localDriver, pluginStorage, PluginStorageDriver, localDriver, widgetStorage, drivers

### Community 15 - "Plugin Admin & Schema"
Cohesion: 0.32
Nodes (13): canAdminPlugin(), configSchemaOf(), ENTITY_SELECT, isoDate(), manifestOf(), pluginAuthPlugin, pluginSdkGatewayModule, redactSecrets() (+5 more)

### Community 16 - "Notifications & Realtime"
Cohesion: 0.22
Nodes (10): avisarSino(), notifyQualityOfIntake(), notifyStateChange(), channels, Listener, publishRealtime(), RealtimeAction, RealtimeEntity (+2 more)

### Community 17 - "Plugin ZIP Extraction"
Cohesion: 0.21
Nodes (7): ExtractedPlugin, MAX_BUNDLE_BYTES, MAX_ZIP_BYTES, normalizeZipEntries(), MANIFEST, entries(), u8()

### Community 18 - "AI Provider Module"
Cohesion: 0.33
Nodes (10): aiModule, callAiProvider(), chatComplete(), ChatMsg, ChatRole, extractContent(), getDefaultBaseUrl(), getDefaultModel() (+2 more)

### Community 19 - "Plugin Registry & Audit"
Cohesion: 0.33
Nodes (9): auditLog(), contentTypeFor(), pluginRegistryModule, requireInstanceAdmin(), serializePlugin(), extractPluginZip(), isUploader(), MaybeAdminUser (+1 more)

### Community 20 - "Widget SDK Gateway"
Cohesion: 0.25
Nodes (8): isoDate(), requirePermission(), widgetAuthPlugin, widgetSdkGatewayModule, VALID_PERMISSIONS, ValidatedManifest, validateManifest(), VALID

### Community 21 - "Crypto & Webhooks"
Cohesion: 0.33
Nodes (7): ALLOWED_TABLES, BLOCKED_FIELDS, customWebhookModule, makePrismaExecutor(), runWebhookCode(), sanitizeData(), sanitizeWhere()

### Community 22 - "Rate Limiter"
Cohesion: 0.32
Nodes (5): Bucket, buckets, checkRateLimit(), pruneStaleBuckets(), pruneTimer

## Knowledge Gaps
- **174 isolated node(s):** `name`, `version`, `private`, `dev`, `start` (+169 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `Prisma Client & Deps` to `Core App & Middleware`, `Database & Replication`, `Quick Links & Settings`, `Seed & Config`, `File Storage Utilities`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Why does `trustedDependencies` connect `Prisma Client & Deps` to `Auth & Framework (Elysia)`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **What connects `name`, `version`, `private` to the rest of the system?**
  _174 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core App & Middleware` be split into smaller, more focused modules?**
  _Cohesion score 0.05319148936170213 - nodes in this community are weakly interconnected._
- **Should `Database & Replication` be split into smaller, more focused modules?**
  _Cohesion score 0.0916013437849944 - nodes in this community are weakly interconnected._
- **Should `Auth & Framework (Elysia)` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Quick Links & Settings` be split into smaller, more focused modules?**
  _Cohesion score 0.09082125603864734 - nodes in this community are weakly interconnected._