# Hardcoded PT-BR Strings Cleanup

**Status: COMPLETE (2026-09-02). Phase 11 sweep removed the last 50+ flagged strings (39 user-flagged + 6 found on rescan). Phase 12: fixed regression — NAMESPACES was missing "project"/"project-settings" (raw `project_members.*` keys in members table) and PT role labels (Administrador/Membro/Convidado/Suspenso → common.roles_*). Final scan count: 0 PT strings in web core+ce UI.**

## Triage Status

- [x] **Phase 1:** High-frequency duplicates ("Nenhum resultado encontrado", "Nenhum") — **COMPLETE**
- [x] **Phase 2:** Error messages ("Falha ao...") - **COMPLETE**
- [x] **Phase 3:** Chat/Attendant module - **COMPLETE**
- [x] **Phase 4:** Print documents - **COMPLETE**
- [x] **Phase 5:** Plugin/Widget marketplace - **COMPLETE**
- [x] **Phase 6:** Kanban/board column names ("Nenhum" as `None` label) - **COMPLETE**
- [x] **Phase 7:** Inbox / Snooze / Sibling - **COMPLETE**
- [x] **Phase 8:** Onboarding + workspace/sidebar/misc - **COMPLETE**
- [x] **Phase 9:** Comments in code (internal PT-BR) - **COMPLETE** (chat + issue-layouts modules; ce/components had none)
- [x] **Phase 10:** Backend error messages (apps/api-ts) - **COMPLETE** (direct EN translation, no backend i18n)

---

## Pattern Categories

### 1. "Nenhum resultado encontrado" (30+ occurrences)

Duplicated across every filter dropdown. Single most repeated string.

**Files:**
- `apps/web/core/components/common/filters/created-at.tsx:76`
- `apps/web/core/components/common/filters/created-by.tsx:102`
- `apps/web/core/components/cycles/dropdowns/filters/end-date.tsx:76`
- `apps/web/core/components/cycles/dropdowns/filters/start-date.tsx:77`
- `apps/web/core/components/cycles/dropdowns/filters/status.tsx:51`
- `apps/web/core/components/inbox/inbox-filter/filters/labels.tsx:81`
- `apps/web/core/components/inbox/inbox-filter/filters/members.tsx:110`
- `apps/web/core/components/inbox/inbox-filter/filters/state.tsx:86`
- `apps/web/core/components/inbox/inbox-filter/filters/status.tsx:69`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/assignee.tsx:102`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/created-by.tsx:95`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/cycle.tsx:98`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/due-date.tsx:75`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/labels.tsx:88`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/mentions.tsx:102`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/module.tsx:88`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/project.tsx:89`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/start-date.tsx:74`
- `apps/web/core/components/issues/issue-layouts/filters/header/filters/state.tsx:87`
- `apps/web/core/components/modules/dropdowns/filters/lead.tsx:102`
- `apps/web/core/components/modules/dropdowns/filters/members.tsx:102`
- `apps/web/core/components/modules/dropdowns/filters/start-date.tsx:78`
- `apps/web/core/components/modules/dropdowns/filters/status.tsx:51`
- `apps/web/core/components/modules/dropdowns/filters/target-date.tsx:77`
- `apps/web/core/components/project/dropdowns/filters/access.tsx:52`
- `apps/web/core/components/project/dropdowns/filters/created-at.tsx:82`
- `apps/web/core/components/project/dropdowns/filters/lead.tsx:102`
- `apps/web/core/components/project/dropdowns/filters/members.tsx:102`
- `apps/web/core/components/views/views-list.tsx:57`

**Action:**
- Add i18n key `common.no_results` → EN "No results found" · PT-BR "Nenhum resultado encontrado" · ID "Tidak ada hasil"
- Replace all 29 occurrences (all follow same JSX pattern → mechanical codemod safe)

---

### 2. "Nenhum" as `None` value label

**Files:**
- `apps/web/core/components/issues/issue-layouts/utils.tsx:179` — cycle group "None" label
- `apps/web/core/components/issues/issue-layouts/utils.tsx:206` — module group "None" label
- `apps/web/core/components/issues/issue-layouts/utils.tsx:282` — labels group "None"/"Nenhuma" (feminine)
- `apps/web/core/components/issues/issue-layouts/utils.tsx:315` — assignee group "None" label
- `apps/web/core/components/issues/peek-overview/properties.tsx:228` — `placeholder="Nenhum"` (estimate)
- `apps/web/core/components/issues/issue-detail/parent/siblings.tsx:56` — "Nenhum chamado irmão"
- `apps/web/core/components/issues/issue-detail-widgets/relations/helper.tsx:29` — `entityName = ... ? "Chamado" : "Épica"`
- `apps/web/core/components/issues/issue-layouts/properties/labels.tsx:59` — `tooltipContent="Nenhuma"`
- `apps/web/core/components/issues/issue-layouts/spreadsheet/columns/entity-column.tsx:126` — "Nenhuma encontrada."
- `apps/web/core/components/project/member-select.tsx:75, 91` — `"Nenhum"` (member placeholder)
- `apps/web/ce/components/relations/index.tsx:27, 34, 41` — `placeholder: "Nenhum"` (duplicated 3× for relation types)
- `apps/web/core/components/plugins/plugin-detail-panel.tsx:42, 58, 73` — `"Nenhum"` (permissions/pages/sidebar)
- `apps/web/core/components/widgets/widget-detail-panel.tsx:38` — `"Nenhum"` (permissions)

**Action:**
- i18n keys `common.none` (masc) / `common.none_fem` (fem — PT gendered) → EN "None" · PT-BR "Nenhum"/"Nenhuma" · ID "Tidak ada"
- Backend already returns "None" (capital N) per bucket ID contract — do NOT rename backend keys, only UI display strings
- Fix `siblings.tsx:56` → key `issue.no_sibling`
- Fix `relations/helper.tsx:29` "Chamado"/"Épica" → i18n keys `entity.issue` / `entity.epic`

---

### 3. Error Messages ("Falha ao...")

**Files:**
- `apps/web/core/components/editor/rich-text/description-input/root.tsx:295` — upload failed
- `apps/web/core/components/editor/rich-text/description-input/root.tsx:308` — duplicate failed
- `apps/web/core/components/inbox/modals/create-modal/issue-description.tsx:106` — upload failed
- `apps/web/core/components/inbox/modals/create-modal/issue-description.tsx:120` — duplicate failed
- `apps/web/core/components/issues/issue-modal/components/description-editor.tsx:225` — upload failed
- `apps/web/core/components/issues/issue-modal/components/description-editor.tsx:240` — duplicate failed
- `apps/web/core/components/issues/issue-detail/issue-activity/helper.tsx:157` — duplicate failed
- `apps/web/core/components/issues/issue-detail-widgets/attachments/helper.tsx:52` — "Falha ao enviar anexo"
- `apps/web/core/components/issues/issue-detail-widgets/attachments/helper.tsx:72` — "Falha ao remover anexo"
- `apps/web/core/components/issues/issue-modal/form.tsx:303` — "Falha ao mover o chamado para o projeto"
- `apps/web/core/components/estimates/delete/modal.tsx:55` — "Falha ao criar estimativa" (mixed PT title + EN body)
- `apps/web/core/components/navigation/use-project-actions.ts:39` — "Falha ao copiar"
- `apps/web/core/components/navigation/use-tab-preferences.ts:111` — "Falha ao ocultar a aba"
- `apps/web/core/components/plugins/dynamic-plugin.tsx:119` — "Falha ao carregar o plugin"
- `apps/web/core/components/plugins/plugin-settings-form.tsx:79` — "Falha ao salvar"
- `apps/web/core/components/widgets/dynamic-widget.tsx:93` — "Falha ao carregar o bundle do widget"
- `apps/web/core/components/widgets/dynamic-widget.tsx:108` — "Falha ao carregar o widget"
- `apps/web/core/components/project/form.tsx:174` — "Falha ao processar a imagem de capa"
- `apps/web/core/components/settings/profile/content/pages/general/form.tsx:143` — "Falha ao processar a imagem de capa"
- `apps/web/core/components/settings/profile/content/pages/general/form.tsx:166, 172` — "Falha ao atualizar o perfil"
- `apps/web/core/lib/plugin-module-runtime.ts:86` — "Falha ao carregar o bundle do plugin"
- `apps/web/ce/components/projects/create/root.tsx:85` — "Falha ao enviar a imagem de capa"
- `apps/web/ce/components/issues/worklog/property/root.tsx:78` — "Falha ao registrar horas"
- `apps/web/ce/components/issues/worklog/property/root.tsx:92` — "Falha ao remover"

**Action:**
- i18n keys under `errors.*`:
  - `upload_failed`, `duplicate_failed`, `attachment_upload_failed`, `attachment_remove_failed`
  - `move_issue_failed`, `create_estimate_failed`
  - `copy_failed`, `hide_tab_failed`
  - `plugin_load_failed`, `plugin_save_failed`, `plugin_bundle_load_failed`
  - `widget_load_failed`, `widget_bundle_load_failed`
  - `cover_image_process_failed`, `cover_image_upload_failed`
  - `profile_update_failed`
  - `worklog_save_failed`, `worklog_delete_failed`
- Fix estimates delete modal (line 55): title in PT, message in EN — full EN translation

---

### 4. Chat / Attendant Module

**Files:**
- `apps/web/core/components/chat/attendant-app.tsx`
- `apps/web/core/components/chat/chat-dashboard.tsx`
- `apps/web/core/components/chat/chat-config-panel.tsx`
- `apps/web/core/components/chat/chat-readonly-view.tsx`

**User-facing strings:**

#### attendant-app.tsx:
- Line 249: `closed: "Encerrado"` — status label map
- Line 1030: `description_html: "<p><strong>Atendimento via chat</strong>..."` — issue description template
- Line 1219: `{ label: "Encerrados", ... }` — closed sessions tab label

#### chat-dashboard.tsx:
- Line 90: `<Stat label="Encerrados hoje" ... />`
- Line 129: `"Nenhum atendente ativo no momento."`
- Line 181: `"Nenhuma avaliação registrada ainda."`
- Line 223: `<Stat label="Atendimentos" ... />`

#### chat-config-panel.tsx:
- Line 376: `<button ...>+ Etapa</button>` — add flow step

#### chat-readonly-view.tsx:
- Line 47: `session.client_name || session.client_phone || "Atendimento"` — fallback heading
- Line 53: `documentTitle={`Atendimento #${session.protocol}`}` — print title

**Internal (safe, but could rename for consistency):**
- `attendant-app.tsx:611–615` — `soEncerrados` variable, `"closed"` string literal (backend contract)
- `attendant-app.tsx:703, 1082` — comments explaining logic
- `attendant-app.tsx:981` — function name `encerrarAtendimento`
- `attendant-app.tsx:1318` — prop `onConfirmar` (JSX handler binding)

**Action:**
- i18n keys under `chat.*`:
  - `status.closed`, `tabs.closed`, `stats.closed_today`, `stats.sessions`
  - `empty.no_active_attendants`, `empty.no_ratings`
  - `fallback.session`, `print.session_title`, `issue.description_template`
- Config panel: `chat_config.add_step` → "+ Step"
- Optional cleanup: rename `encerrarAtendimento` → `closeSession`, `onConfirmar` → `onConfirm`, `soEncerrados` → `onlyClosed`

---

### 5. Print Documents

**Files:**
- `apps/web/core/components/print/documents/chat-transcript-print-document.tsx:44` — `"Atendimento"` fallback
- `apps/web/core/components/print/documents/chat-transcript-print-document.tsx:48` — `title={`Atendimento #${protocol}`}`
- `apps/web/core/components/print/documents/chat-transcript-print-document.tsx:74` — `"Nenhuma mensagem registrada."`
- `apps/web/core/components/print/documents/technical-visits-print-document.tsx:68` — `"Nenhuma visita técnica encontrada."`
- `apps/web/core/components/print/documents/work-item-print-document.tsx:93` — `"Nenhum anexo."`
- `apps/web/core/components/print/documents/work-item-print-document.tsx:112` — `"Nenhum comentário."`

**Action:**
- i18n keys under `print.*`:
  - `print.chat.title`, `print.chat.fallback_client`, `print.chat.empty_messages`
  - `print.technical_visits.empty`
  - `print.work_item.empty_attachments`, `print.work_item.empty_comments`

---

### 6. Plugin / Widget Marketplace

**Files:**
- `apps/web/core/components/plugins/dynamic-plugin.tsx:119` — "Falha ao carregar o plugin" (covered in Phase 2)
- `apps/web/core/components/plugins/plugin-detail-panel.tsx:42, 58, 73` — `"Nenhum"` (permissions/pages/sidebar empty)
- `apps/web/core/components/plugins/plugin-list.tsx:42` — "Nenhum plugin encontrado. Envie seu primeiro plugin para começar."
- `apps/web/core/components/plugins/plugin-settings-form.tsx:79` — "Falha ao salvar" (Phase 2)
- `apps/web/core/components/widgets/dynamic-widget.tsx:93, 108` — Phase 2
- `apps/web/core/components/widgets/widget-detail-panel.tsx:38` — `"Nenhum"`
- `apps/web/core/components/widgets/widget-list.tsx:42` — "Nenhum widget encontrado. Envie seu primeiro widget para começar."

**Action:**
- i18n keys:
  - `plugins.empty_state`, `plugins.detail.none`
  - `widgets.empty_state`, `widgets.detail.none`

---

### 7. Inbox / Issue

**Files:**
- `apps/web/core/components/inbox/content/inbox-issue-header.tsx:417` — `<Button>Devolver para Em Teste</Button>`
- `apps/web/core/components/inbox/modals/intake-quick-create.tsx:9–10` — comment (D2 rule, internal)
- `apps/web/core/components/issues/issue-modal/form.tsx:303` — Phase 2 (move failed)
- `apps/web/core/components/issues/issue-detail/parent/siblings.tsx:56` — Phase 2
- `apps/web/core/components/workspace-notifications/sidebar/notification-card/options/snooze/modal.tsx:208` — "Nenhum horário disponível para esta data."

**Action:**
- i18n keys:
  - `inbox.return_to_testing` → "Return to In Testing"
  - `notifications.snooze.no_slots` → "No time slots available for this date."

---

### 8. Onboarding + Workspace/Sidebar/Misc

**Files:**
- `apps/web/core/components/onboarding/invitations.tsx:132` — "Nenhum convite encontrado"
- `apps/web/core/components/onboarding/steps/workspace/join-invites.tsx:133` — "Nenhum convite encontrado" (duplicate)
- `apps/web/core/components/workspace/sidebar/quick-actions.tsx:60, 62, 65, 115` — variable `isAtendimento` + `"New request"` label (already EN, but variable is PT)

**Action:**
- i18n key `onboarding.no_invitations` → "No invitations found"
- Optional rename: `isAtendimento` → `isIntakeOnly`

---

### 9. Comments in Code (Internal PT-BR)

Non-user-facing PT-BR left in comments and variable names. Ganggu untuk pembaca kode non-PT, tapi tidak muncul di UI.

**Files with PT comments:**
- `apps/web/core/components/chat/attendant-app.tsx` — multiple comment blocks
- `apps/web/core/components/issues/issue-layouts/issue-layout-HOC.tsx:57–58` — "Triagem, Em Análise, …"
- `apps/web/core/components/issues/issue-layouts/kanban/base-kanban-root.tsx:44–48` — "Em Teste"/"Qualidade"
- `apps/web/core/components/issues/issue-layouts/kanban/default.tsx:117–122` — "Triagem, Pendências, Em Análise"
- `apps/web/core/components/work-item-filters/pessoa-toggles.tsx:96–99` — "Qualidade e Atendimento"
- `apps/web/core/components/work-item-filters/filters-hoc/workspace-level.tsx:71–72` — "Triagem, Pendências"
- `apps/web/core/components/workspace-notifications/notification-app-sidebar-option.tsx:35–36` — "área de trabalho / espaço de trabalho"
- `apps/web/core/hooks/use-aviso-de-chamado.ts` — filename + comments
- `apps/web/core/hooks/use-project-role-permissions.ts:181–184` — `isAtendimento`, `isQualidade`, `isTI`, `isGestorProjeto` identifiers
- `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx:44, 57` — `useAvisoDeChamado` import

**Files with PT variable/function names:**
- `use-aviso-de-chamado.ts` — hook file, PT name
- `useAvisoDeChamado` — hook name
- `ultimaAvisada` — variable
- `isAtendimento`, `isQualidade`, `isTI`, `isGestorProjeto` — role identity flags
- `soEncerrados`, `encerrarAtendimento`, `onConfirmar`, `naoLidasAtivas` — in chat module

**Action (optional, low priority):**
- Translate comments to EN (non-blocking, but improves readability)
- Rename hooks/variables — LSP-safe with `lsp rename`, but touches many callsites
- Keep role name flags (`isAtendimento`) IF role names are official domain terms (like "Qualidade" being an actual role name)

---

### 10. Backend Error Messages (apps/api-ts) — DEFERRED

**Approx count:** 190+ `{ detail: "..." }` responses in PT-BR.

**Sample files (from initial grep):**
- `apps/api-ts/src/modules/ai/index.ts` — 3 occurrences
- `apps/api-ts/src/modules/auth/index.ts` — 2 occurrences
- `apps/api-ts/src/modules/integration/slack.ts` — 2 occurrences
- `apps/api-ts/src/modules/issue/index.ts` — 5+ occurrences ("Chamado não encontrado")
- `apps/api-ts/src/modules/plugin-sdk-gateway/index.ts` — 1
- `apps/api-ts/src/modules/widget-sdk-gateway/index.ts` — 1
- ... plus ~180 more across every module

**Decision needed BEFORE mass refactor:**
- **Option A** — Backend returns i18n keys (`{ detail_key: "errors.issue_not_found" }`), frontend translates
- **Option B** — Backend uses `Accept-Language` header, returns localized `detail`
- **Option C** — Backend stays EN, frontend translates known error strings via lookup table

**Recommendation:** Option A (safest). Requires:
1. Add `detail_key` field to error response schema
2. Update every handler with structured error codes
3. Add lookup on frontend error handlers (toast interceptor)

---

## Documentation / Scripts / Comments (Safe — No Action)

PT-BR content is intentional and NOT user-facing:

- `.claude/*.md` — audit reports (internal docs)
- `RELATORIOS_TODO.md`, `ToDo.md`, `WIDGET_MARKETPLACE_TODO.md` — planning docs
- `apps/api-ts/prisma/migrations/*/migration.sql` — inline migration explanation
- `apps/api-ts/scripts/*.ts` — seed/migration script comments (`seed.ts`, `migrate-sac-files.ts`, `create-user.ts`, `vincular-usuarios-sistemas.ts`)
- `apps/api-ts/src/modules/*/index.ts` — business logic explanation comments

---

## Progress Tracker

### Phase 1: "Nenhum resultado encontrado" (29 files)
- [x] Added `common.no_results_found`, `common.no_results_for`, `common.search_placeholder_hint` to en/id/pt-BR
- [x] Replaced in all 30 files (29 filters + 1 global-search-modal)
- [x] TypeScript typecheck passed
- **Files changed:** 30 TSX, 3 locale JSON
- **Verified:** Zero occurrences of `"Nenhum resultado encontrado"` remain in apps/web UI

### Phase 2: Error Messages (24 occurrences)
- [x] Added 17 `failed_to_*` + 7 `attachment_*` keys + 2 `hours_logged_*` to en/id/pt-BR
- [x] Replaced in all 24 sites (17 TSX/TS files)
- [x] Injected `useTranslation` hook into 9 files without it
- [x] Template literals converted to EN (non-React error throwing context)
- [x] TypeScript typecheck passed
- **Files changed:** 17 TSX/TS, 3 locale JSON
- **Verified:** Zero occurrences of `"Falha ao` remain in apps/web + apps/admin UI

### Phase 3: Chat Module (4 files) — COMPLETE
- [x] New namespace `chat` registered in packages/i18n/src/constants/namespaces.ts
- [x] chat.json (en/id/pt-BR) with root `chat` object: app.* (56 keys), config.* (44), dashboard.* (37), readonly.* (8)
- [x] attendant-app.tsx: 5 components hooked (AttendantChatApp, NewChatModal, TransferModal, ModalDeEncerramento, IndicadorDeConexao); statusLabel/CONEXAO refactored to i18n; tabs/status/actions/sidebar/messages/preview all migrated
- [x] chat-config-panel.tsx: 10 components hooked; STEP_LABELS/BASE_TABS/MSG_FIELDS converted to key refs; interpolation {{count}}/{{name}}/{{protocol}}
- [x] chat-dashboard.tsx + chat-readonly-view.tsx: fully migrated
- [x] Runtime smoke test: i18next init + key resolution PASSED (all 4 modules, 3 locales)
- **Verified:** PT word scan (diacritics + non-diacritic vocabulary) = CLEAN in all 4 files; tsc clean
- **Key architecture note:** t() keys = path INSIDE namespace file (nsSeparator:false + fallbackNS); chat.json root must nest under "chat" object; Phase 1/2 common.* keys moved from top-level into nested common object to match convention

### Phase 4: Print Documents (8 files) — COMPLETE
- [x] New namespace `print` registered + print.json (en/id/pt-BR) with root `print` object (~40 keys: labels, counts, chat, intake, visits, module, cycle, work_item)
- [x] Reused existing `common.*` keys where exact match (title, state, priority, assignee, labels, members, created_at, updated_at, created_by, project, properties) + added `common.common.start_date`
- [x] Migrated: print-issues-table, chat-transcript (SENDER map → key refs, messageBody takes t), work-item, intake (both), technical-visits (both, MOTIVATION map → key refs), module, cycle, work-items
- [x] Runtime smoke test PASSED (print + common keys, 3 locales)
- **Verified:** PT scan CLEAN (only audit metadata `titulo` field name remains — internal, not UI); tsc clean
- **Key convention confirmed:** nested common object keys = `t("common.<key>")` (NOT `common.common.<key>`)

### Phase 5: Plugin/Widget Marketplace (5 files) — COMPLETE
- [x] New namespace `plugins` registered + plugins.json (en/id/pt-BR) root `plugins` object (~20 keys)
- [x] STATUS_LABELS → STATUS_KEYS + STATUS_CLS split (plugin-list, widget-list); table headers, Remover, loading/empty states migrated
- [x] Detail panels: sections (Metadados, Arquivo de entrada, Itens da barra lateral, Manifesto (bruto), Datas), rows (Autor), "Nenhum" → `common.none`, dates → `common.created_at/updated_at`
- [x] plugin-settings-form: loading config + no-config-declared states
- [x] Runtime smoke test PASSED; PT scan CLEAN; tsc clean

### Phase 6: Group-By "None" Labels — COMPLETE
- [x] Added `common.none_fem` (Nenhuma), `common.cannot_move_to_completed_cycle` (fixes "The call" mistranslation artifact), `common.drop_here_to_delete`, `common.add_existing_issue`, `common.failed_to_update_issue_dates`, `common.restore_success_title/message`, `common.none_found`, `issue.relation.activity_*` (8 keys), `issue.relation.add_relates_to`
- [x] utils.tsx: `t` threaded through getGroupByColumns + 4 column getters (TTranslate local type; shared TGetColumns untouched); `id: "None"` backend contract preserved
- [x] Callers pass `t`: kanban/default, kanban/swimlanes (x2), list/default, sub-issues/root
- [x] ce/relations: ISSUE_RELATION_OPTIONS split into RELATION_ICONS + PLACEHOLDER_KEYS; useTimeLineRelationOptions now real hook with t; activity.ts getRelationActivityContent takes t (8 PT sentences → keys)
- [x] helper.tsx entityName "Chamado"/"Épica" → common.work_item/common.epic (also fixes PT gender bug "Épica atualizado")
- [x] Also migrated: spreadsheet-header heading, labels tooltip, peek estimate placeholder, base-kanban drop zone, 2 group-by-card menus, gantt dates error, quick-action helper toasts, entity-column loading/empty
- [x] PT scan CLEAN in issue-layouts + relations + peek-overview; tsc clean

### Phase 7: Inbox / Snooze / Sibling — COMPLETE
- [x] Added keys: `inbox_issue.actions.return_to_testing` (Devolver para Em Teste), `inbox_issue.actions.mark_fulfilled` (Marcar como atendido), `inbox_issue.errors.duplicate_permission`, `notification.snooze.pick_a_time/select_time/no_slots`, `issue.sibling.empty` (en/id/pt-BR)
- [x] Reused existing keys: `inbox_issue.errors.snooze_permission/accept_permission/decline_permission`, `inbox_issue.actions.snooze/unsnooze`, `common.loading`, `issue.sibling.label`
- [x] Migrated: inbox-issue-header (2 buttons + permission error), inbox-issue-mobile-header (hook injected; 3 permission errors + snooze/un-snooze), parent/siblings (hook injected; loading + empty state), notification snooze modal (hook injected; 3 strings)
- [x] PT scan CLEAN in inbox + parent + workspace-notifications; tsc clean

### Phase 8: Onboarding + Auth + Workspace Settings — COMPLETE
- [x] New namespace `onboarding` registered + onboarding.json (en/id/pt-BR): usecase header, password mismatch/confirm, invites (sent/empty/accept_hint/header/you_were_invited), auth (unauthorized/check_pending)
- [x] Reused: `workspace_settings.settings.members.invitations_sent_successfully` + added `invitation_removed_successfully`
- [x] Migrated 8 files: usecase/root, set-password (mismatch + confirm label+placeholder), team/root (toast + header), invitations, join-invites, invite-members, not-a-member, invitations-list-item
- [x] PT scan CLEAN in onboarding + auth-screens; tsc clean

## Final Sweep (2026-09-02, post-archive)

4 parallel agents + Main cleanup removed the ~114 remaining user-facing PT strings across ~70 files found by a comprehensive scan (earlier scans were diacritic-based and missed accent-free PT words like "convite", "chamado", "fila"):

- **Namespace ownership model** (collision-free): UIWorkItem→work-item.json, UIOnboarding→onboarding.json, UICommon→common.json (nested common), UIMisc→inbox.json. ~90 new keys (en/id/pt-BR).
- **Activity sentences migrated**: attachment, estimate, label, parent, link actions + notification content map (BASE_NOTIFICATION_CONTENT_MAP PT strings → misc.* keys resolved via t in getNotificationContentDetails).
- **Bug fix (dead code)**: delete-issue-modal + workspace-draft delete-modal compared `errors?.error` against a PT string that never existed in the backend — replaced with isAxiosError + check of the real message ("Your role does not allow this action." from permission-checks.ts).
- **Fixes to agent regressions**: dropped imports (Button, IUserLite, DOCS_URL/SUPPORT_EMAIL, EProductSubscriptionEnum types), dropped destructures (onClick, onClose), dropped state vars (collapsed, issues, isJoiningWorkspaces), duplicated declarations.
- **Exempt**: brand "Avião", enum identifiers (ATENDIMENTO), STATE_RENAME/NEW_STATES data values (legacy DB lookups), timezone proper nouns, PT test descriptions (internal dev tooling), remaining PT identifiers/comments in untouched modules.

**Final verification:** PT word scan over apps/web core+ce user-facing strings = CLEAN; apps/api-ts string-literal scan = only intentional leftovers; Docker backend test suite (unit+contract) exited 0; apps/web tsc back to pre-existing baseline (~9-11 errors, all unrelated: button variants, LucideProps, pre-existing type gaps).
