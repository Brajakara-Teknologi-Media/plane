/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { observer } from "mobx-react";
import { useCallback, useEffect, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useMember } from "@/hooks/store/use-member";
// services
import { chatApi } from "@/services/chat.service";
import { SelectPesquisavel } from "@/components/common/select-pesquisavel";
import { Search } from "lucide-react";

type Tab = "messages" | "menu" | "queues" | "flows" | "schedules" | "attendants" | "provider";
const BASE_TABS: { key: Tab; labelKey: string }[] = [
  { key: "messages", labelKey: "chat.config.tabs.messages" },
  { key: "menu", labelKey: "chat.config.tabs.menu" },
  { key: "queues", labelKey: "chat.config.tabs.queues" },
  { key: "flows", labelKey: "chat.config.tabs.flows" },
  { key: "schedules", labelKey: "chat.config.tabs.schedules" },
  { key: "provider", labelKey: "chat.config.tabs.provider" },
];

const ok = (m: string) => setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved", message: m });
const err = (e: any) => setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: e?.detail || "Failed." });

const inputCls = "w-full rounded-md border border-subtle bg-surface-1 text-primary px-2 py-1.5 text-sm outline-none";
const btn = "rounded-md bg-primary px-3 py-1.5 text-13 text-on-color";
const btnGhost = "rounded-md border border-subtle px-3 py-1.5 text-13";

export const ChatConfigPanel = observer(function ChatConfigPanel({
  slug,
  apiUrl,
  isAdmin = false,
}: {
  slug: string;
  apiUrl: string;
  isAdmin?: boolean;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("messages");
  const api = chatApi(apiUrl);
  const TABS = isAdmin
    ? [...BASE_TABS.slice(0, 5), { key: "attendants" as Tab, labelKey: "chat.config.tabs.attendants" }, BASE_TABS[5]]
    : BASE_TABS;

  // workspace members for queue/schedule assignment
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const members = (workspaceMemberIds ?? [])
    .map((id) => getWorkspaceMemberDetails(id))
    .filter(Boolean)
    .map((m: any) => ({ id: m.member.id, name: m.member.display_name || m.member.email, email: m.member.email ?? "" }));

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex gap-1 border-b border-subtle px-3 pt-2">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            onClick={() => setTab(tabDef.key)}
            className={`rounded-t-md px-3 py-2 text-13 ${tab === tabDef.key ? "border-primary border-b-2 font-medium text-primary" : "text-secondary"}`}
          >
            {t(tabDef.labelKey)}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {tab === "messages" && <MessagesTab slug={slug} api={api} />}
        {tab === "menu" && <MenuTab slug={slug} api={api} />}
        {tab === "queues" && <QueuesTab slug={slug} api={api} members={members} />}
        {tab === "flows" && <FlowsTab slug={slug} api={api} />}
        {tab === "schedules" && <SchedulesTab slug={slug} api={api} />}
        {tab === "attendants" && <AttendantsTab slug={slug} api={api} members={members} />}
        {tab === "provider" && <ProviderTab slug={slug} api={api} />}
      </div>
    </div>
  );
});

// ── Messages (BotConfig) ──────────────────────────────────────────────────────
const MSG_FIELDS: { key: string; labelKey: string }[] = [
  { key: "welcomeMessage", labelKey: "chat.config.fields.welcome_message" },
  { key: "menuHeader", labelKey: "chat.config.fields.menu_header" },
  { key: "askNameMessage", labelKey: "chat.config.fields.ask_name" },
  { key: "confirmContactMessage", labelKey: "chat.config.fields.confirm_contact" },
  { key: "noAttendantsMessage", labelKey: "chat.config.fields.no_attendants" },
  { key: "idlePromptMessage", labelKey: "chat.config.fields.idle_prompt" },
  { key: "idleCloseMessage", labelKey: "chat.config.fields.idle_close" },
  { key: "closedMessage", labelKey: "chat.config.fields.closed" },
];
function MessagesTab({ slug, api }: { slug: string; api: ReturnType<typeof chatApi> }) {
  const { t } = useTranslation();
  const [cfg, setCfg] = useState<any>(null);
  useEffect(() => {
    api.getBot(slug).then(setCfg).catch(err);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  if (!cfg) return <div className="text-sm text-secondary">{t("chat.config.loading")}</div>;
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      {MSG_FIELDS.map((f) => (
        <label key={f.key} className="text-sm">
          <span className="mb-1 block text-13 text-secondary">{t(f.labelKey)}</span>
          <textarea
            className={inputCls}
            rows={2}
            value={cfg[f.key] ?? ""}
            onChange={(e) => setCfg({ ...cfg, [f.key]: e.target.value })}
          />
        </label>
      ))}
      <div className="flex gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-13 text-secondary">{t("chat.config.fields.routing_alpha")}</span>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={cfg.routingAlpha ?? 1}
            onChange={(e) => setCfg({ ...cfg, routingAlpha: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-13 text-secondary">{t("chat.config.fields.routing_beta")}</span>
          <input
            type="number"
            step="0.1"
            className={inputCls}
            value={cfg.routingBeta ?? 0.5}
            onChange={(e) => setCfg({ ...cfg, routingBeta: Number(e.target.value) })}
          />
        </label>
      </div>
      <button
        className={btn + " self-start"}
        onClick={() =>
          api
            .saveBot(slug, cfg)
            .then(() => ok(t("chat.config.messages.messages_updated")))
            .catch(err)
        }
      >
        Save
      </button>
    </div>
  );
}

// ── Menu options ──────────────────────────────────────────────────────────────
function MenuTab({ slug, api }: { slug: string; api: ReturnType<typeof chatApi> }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const load = useCallback(() => {
    api.listMenu(slug).then(setItems).catch(err);
    api
      .listQueues(slug)
      .then(setQueues)
      .catch(() => {});
    api
      .listFlows(slug)
      .then(setFlows)
      .catch(() => {});
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);
  const save = (it: any) =>
    api
      .updateMenu(slug, it.id, {
        key: it.key,
        label: it.label,
        action: it.action,
        queue_id: it.queueId,
        flow_id: it.flowId,
        message: it.message,
        order: it.order,
      })
      .then(() => ok("Option saved."))
      .catch(err);
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      {items.map((it, idx) => (
        <div key={it.id} className="flex flex-wrap items-end gap-2 rounded-md border border-subtle p-2">
          <Field label={t("chat.config.fields.key")} w="w-16">
            <input className={inputCls} value={it.key} onChange={(e) => upd(setItems, idx, { key: e.target.value })} />
          </Field>
          <Field label="Label" w="flex-1">
            <input
              className={inputCls}
              value={it.label}
              onChange={(e) => upd(setItems, idx, { label: e.target.value })}
            />
          </Field>
          <Field label="Action" w="w-32">
            <SelectPesquisavel
              value={it.action}
              onChange={(valor) => upd(setItems, idx, { action: valor })}
              opcoes={[
                { value: "queue", label: t("chat.config.options.queue") },
                { value: "flow", label: t("chat.config.options.flow") },
                { value: "message", label: t("chat.config.options.message") },
              ]}
            />
          </Field>
          {it.action === "queue" && (
            <Field label={t("chat.config.fields.queue")} w="w-40">
              <SelectPesquisavel
                value={it.queueId ?? ""}
                onChange={(valor) => upd(setItems, idx, { queueId: valor })}
                opcoes={queues.map((q: any) => ({ value: q.id, label: q.name }))}
                opcaoVazia={{ value: "", label: "—" }}
                searchPlaceholder="Search queue"
              />
            </Field>
          )}
          {it.action === "flow" && (
            <Field label={t("chat.config.fields.flow")} w="w-40">
              <SelectPesquisavel
                value={it.flowId ?? ""}
                onChange={(valor) => upd(setItems, idx, { flowId: valor })}
                opcoes={flows.map((f: any) => ({ value: f.id, label: f.name }))}
                opcaoVazia={{ value: "", label: "—" }}
                searchPlaceholder="Search flow"
              />
            </Field>
          )}
          {it.action === "message" && (
            <Field label={t("chat.config.fields.message")} w="flex-1">
              <input
                className={inputCls}
                value={it.message ?? ""}
                onChange={(e) => upd(setItems, idx, { message: e.target.value })}
              />
            </Field>
          )}
          <button className={btnGhost} onClick={() => save(it)}>
            Save
          </button>
          <button className={btnGhost} onClick={() => api.deleteMenu(slug, it.id).then(load).catch(err)}>
            {t("chat.config.actions.delete")}
          </button>
        </div>
      ))}
      <button
        className={btn + " self-start"}
        onClick={() =>
          api
            .createMenu(slug, {
              key: String(items.length + 1),
              label: "New option",
              action: "queue",
              order: items.length,
            })
            .then(load)
            .catch(err)
        }
      >
        {t("chat.config.actions.add_option")}
      </button>
    </div>
  );
}

type Membro = { id: string; name: string; email: string };

/**
 * Picking attendants from a list of hundreds of people.
 *
 * Before, both tabs dumped ALL the members as little round buttons — a wall of
 * names several screens tall, with no search and no separation of who was
 * already picked. Worse: the legacy system has duplicate accounts, so five
 * rows of "Amanda Cristina da Silva Carvalho" appeared identical and there was
 * no way to tell which one to check. Hence the email under the name.
 */
function SeletorDeAtendentes({
  membros,
  selecionados,
  onAlternar,
}: {
  membros: Membro[];
  selecionados: Set<string>;
  onAlternar: (id: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();
  const casa = (m: Membro) => !termo || `${m.name} ${m.email}`.toLowerCase().includes(termo);
  // Picked ones first: there are few of them and they are the first thing to
  // check when opening the screen.
  const escolhidos = membros.filter((m) => selecionados.has(m.id));
  const restantes = membros.filter((m) => !selecionados.has(m.id) && casa(m));

  return (
    <div className="rounded-md border border-subtle">
      <div className="flex items-center gap-2 border-b border-subtle px-3 py-2">
        <Search className="size-3.5 shrink-0 text-secondary" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Search by name or email"
          className="w-full bg-transparent text-13 outline-none placeholder:text-secondary"
        />
        <span className="shrink-0 text-11 text-secondary">
          {escolhidos.length} de {membros.length}
        </span>
      </div>

      {escolhidos.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-subtle px-3 py-2">
          {escolhidos.map((m) => (
            <button
              key={m.id}
              onClick={() => onAlternar(m.id)}
              title={`Remover ${m.name}`}
              className="border-accent-subtle-1 flex items-center gap-1 rounded-full border bg-accent-subtle px-2 py-0.5 text-11 text-accent-primary"
            >
              {m.name}
              <span aria-hidden>×</span>
            </button>
          ))}
        </div>
      )}

      <div className="max-h-64 overflow-y-auto">
        {restantes.length === 0 ? (
          <p className="px-3 py-4 text-center text-12 text-secondary">
            {termo ? `Nobody with "${busca}".` : "Everyone is already in this queue."}
          </p>
        ) : (
          restantes.map((m) => (
            <button
              key={m.id}
              onClick={() => onAlternar(m.id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-layer-1"
            >
              <span className="min-w-0">
                <span className="block truncate text-13">{m.name}</span>
                <span className="block truncate text-11 text-secondary">{m.email}</span>
              </span>
              <span className="shrink-0 text-11 text-accent-primary">adicionar</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Queues + members ──────────────────────────────────────────────────────────
function QueuesTab({ slug, api, members }: { slug: string; api: ReturnType<typeof chatApi>; members: Membro[] }) {
  const { t } = useTranslation();
  const [queues, setQueues] = useState<any[]>([]);
  const [name, setName] = useState("");
  const load = useCallback(() => {
    api.listQueues(slug).then(setQueues).catch(err);
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);
  const toggleMember = (q: any, userId: string) => {
    const current = new Set((q.members ?? []).map((m: any) => m.userId));
    if (current.has(userId)) current.delete(userId);
    else current.add(userId);
    api
      .setQueueMembers(slug, q.id, Array.from(current) as string[])
      .then(load)
      .then(() => ok("Atendentes atualizados."))
      .catch(err);
  };
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder={t("chat.config.placeholders.new_queue")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className={btn}
          onClick={() =>
            name.trim() &&
            api
              .createQueue(slug, name.trim())
              .then(() => {
                setName("");
                load();
              })
              .catch(err)
          }
        >
          Create
        </button>
      </div>
      {queues.map((q) => (
        <div key={q.id} className="rounded-md border border-subtle p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium">{q.name}</span>
            <button className={btnGhost} onClick={() => api.deleteQueue(slug, q.id).then(load).catch(err)}>
              {t("chat.config.actions.delete")}
            </button>
          </div>
          <SeletorDeAtendentes
            membros={members}
            selecionados={new Set((q.members ?? []).map((x: any) => x.userId as string))}
            onAlternar={(id) => toggleMember(q, id)}
          />
        </div>
      ))}
    </div>
  );
}

// ── Flows (visual step builder, no JSON) ──────────────────────────────────────
const STEP_LABELS: Record<string, string> = {
  message: "chat.config.steps.message",
  ask: "chat.config.steps.ask",
  queue: "chat.config.steps.queue",
  close: "chat.config.steps.close",
};
function FlowsTab({ slug, api }: { slug: string; api: ReturnType<typeof chatApi> }) {
  const { t } = useTranslation();
  const [flows, setFlows] = useState<any[]>([]);
  const [queues, setQueues] = useState<any[]>([]);
  const load = useCallback(() => {
    api
      .listFlows(slug)
      .then((fs: any[]) => setFlows(fs.map((f) => ({ ...f, steps: Array.isArray(f.steps) ? f.steps : [] }))))
      .catch(err);
    api
      .listQueues(slug)
      .then(setQueues)
      .catch(() => {});
  }, [slug]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(load, [load]);

  const setSteps = (fi: number, steps: any[]) => upd(setFlows, fi, { steps });

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="text-12 text-secondary">{t("chat.config.flows_hint")}</p>
      {flows.map((f, fi) => (
        <div key={f.id} className="rounded-lg border border-subtle p-3">
          <div className="mb-2 flex items-center gap-2">
            <input
              className={inputCls}
              value={f.name}
              onChange={(e) => upd(setFlows, fi, { name: e.target.value })}
              placeholder="Flow name"
            />
            <button className={btnGhost} onClick={() => api.deleteFlow(slug, f.id).then(load).catch(err)}>
              {t("chat.config.actions.delete")}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {(f.steps ?? []).map((step: any, si: number) => (
              <div key={si} className="flex flex-wrap items-center gap-2 rounded-md bg-layer-1 p-2">
                <span className="text-12 text-tertiary">{si + 1}.</span>
                <SelectPesquisavel
                  value={step.type}
                  onChange={(valor) =>
                    setSteps(
                      fi,
                      f.steps.map((s: any, i: number) => (i === si ? { type: valor } : s))
                    )
                  }
                  opcoes={Object.entries(STEP_LABELS).map(([v, k]) => ({ value: v, label: t(k) }))}
                  className="w-56"
                />
                {(step.type === "message" || step.type === "ask" || step.type === "close") && (
                  <input
                    className={inputCls + " min-w-[12rem] flex-1"}
                    placeholder={
                      step.type === "close"
                        ? t("chat.config.placeholders.close_message")
                        : t("chat.config.placeholders.step_text")
                    }
                    value={step.text ?? ""}
                    onChange={(e) =>
                      setSteps(
                        fi,
                        f.steps.map((s: any, i: number) => (i === si ? { ...s, text: e.target.value } : s))
                      )
                    }
                  />
                )}
                {step.type === "ask" && (
                  <input
                    className={inputCls + " w-36"}
                    placeholder={t("chat.config.placeholders.save_as")}
                    value={step.saveAs ?? ""}
                    onChange={(e) =>
                      setSteps(
                        fi,
                        f.steps.map((s: any, i: number) => (i === si ? { ...s, saveAs: e.target.value } : s))
                      )
                    }
                  />
                )}
                {step.type === "queue" && (
                  <SelectPesquisavel
                    value={step.queueId ?? ""}
                    onChange={(valor) =>
                      setSteps(
                        fi,
                        f.steps.map((s: any, i: number) => (i === si ? { ...s, queueId: valor } : s))
                      )
                    }
                    opcoes={queues.map((q: any) => ({ value: q.id, label: q.name }))}
                    opcaoVazia={{ value: "", label: t("chat.config.placeholders.select_queue") }}
                    searchPlaceholder="Search queue"
                    className="w-44"
                  />
                )}
                <button
                  className={btnGhost}
                  title={t("chat.config.actions.remove_step")}
                  onClick={() =>
                    setSteps(
                      fi,
                      f.steps.filter((_: any, i: number) => i !== si)
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              className={btnGhost}
              onClick={() => setSteps(fi, [...(f.steps ?? []), { type: "message", text: "" }])}
            >
              {t("chat.config.actions.add_step")}
            </button>
            <button
              className={btn}
              onClick={() =>
                api
                  .updateFlow(slug, f.id, { name: f.name, steps: f.steps })
                  .then(() => ok("Flow saved."))
                  .catch(err)
              }
            >
              {t("chat.config.actions.save_flow")}
            </button>
          </div>
        </div>
      ))}
      <button
        className={btn + " self-start"}
        onClick={() => api.createFlow(slug, { name: "New flow", steps: [] }).then(load).catch(err)}
      >
        + New flow
      </button>
    </div>
  );
}

// ── Company-wide business hours (not per attendant) ───────────────────────────
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function SchedulesTab({ slug, api }: { slug: string; api: ReturnType<typeof chatApi> }) {
  const { t } = useTranslation();
  const [hours, setHours] = useState<any[]>([]);
  const [breaks, setBreaks] = useState<any[]>([]);
  const [outsideMsg, setOutsideMsg] = useState("");
  useEffect(() => {
    api
      .getBot(slug)
      .then((cfg: any) => {
        setHours(Array.isArray(cfg.businessHours) ? cfg.businessHours : []);
        setBreaks(Array.isArray(cfg.businessBreaks) ? cfg.businessBreaks : []);
        setOutsideMsg(cfg.outsideHoursMessage ?? "");
      })
      .catch(err);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  const addRow = (list: any[], set: any) => set([...list, { weekday: 1, start_time: "08:00", end_time: "18:00" }]);
  const norm = (l: any[]) =>
    l.map((x) => ({ weekday: Number(x.weekday), start_time: x.start_time, end_time: x.end_time }));
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className="text-12 text-secondary">
        Company business hours (applies to all representatives). Blank = always open..
      </p>
      <Rows title="Support hours" list={hours} set={setHours} addRow={addRow} />
      <Rows title="Breaks (lunch, etc.)" list={breaks} set={setBreaks} addRow={addRow} />
      <label className="text-sm">
        <span className="mb-1 block text-13 text-secondary">{t("chat.config.fields.outside_hours_message")}</span>
        <textarea className={inputCls} rows={2} value={outsideMsg} onChange={(e) => setOutsideMsg(e.target.value)} />
      </label>
      <button
        className={btn + " self-start"}
        onClick={() =>
          api
            .saveBot(slug, {
              businessHours: norm(hours),
              businessBreaks: norm(breaks),
              outsideHoursMessage: outsideMsg,
            })
            .then(() => ok("Schedule saved."))
            .catch(err)
        }
      >
        Save
      </button>
    </div>
  );
}
function Rows({ title, list, set, addRow }: any) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-13 font-medium">{title}</span>
        <button className={btnGhost} onClick={() => addRow(list, set)}>
          {t("chat.config.actions.add_row")}
        </button>
      </div>
      {list.map((row: any, idx: number) => (
        <div key={idx} className="mb-1 flex items-center gap-2">
          <SelectPesquisavel
            value={String(row.weekday)}
            onChange={(valor) => upd(set, idx, { weekday: valor })}
            opcoes={WD.map((w: string, i: number) => ({ value: String(i), label: w }))}
            className="w-24"
            searchable={false}
          />
          <input
            type="time"
            className={inputCls + " w-28"}
            value={row.start_time}
            onChange={(e) => upd(set, idx, { start_time: e.target.value })}
          />
          <input
            type="time"
            className={inputCls + " w-28"}
            value={row.end_time}
            onChange={(e) => upd(set, idx, { end_time: e.target.value })}
          />
          <button className={btnGhost} onClick={() => set(list.filter((_: any, i: number) => i !== idx))}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Attendant visibility (admin only) ─────────────────────────────────────────
function AttendantsTab({ slug, api, members }: { slug: string; api: ReturnType<typeof chatApi>; members: Membro[] }) {
  const { t } = useTranslation();
  const [invisible, setInvisible] = useState<Set<string>>(new Set());
  useEffect(() => {
    api
      .listAttendantStatus(slug)
      .then((rows) => setInvisible(new Set(rows.filter((r) => r.is_invisible).map((r) => r.user_id))))
      .catch(err);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  const toggle = (userId: string) => {
    const next = !invisible.has(userId);
    api
      .setAttendantVisibility(slug, userId, next)
      .then(() => {
        setInvisible((prev) => {
          const s = new Set(prev);
          if (next) s.add(userId);
          else s.delete(userId);
          return s;
        });
        ok(next ? t("chat.config.messages.attendant_invisible") : t("chat.config.messages.attendant_visible"));
      })
      .catch(err);
  };
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLowerCase();
  // Only who is already invisible + whatever the search asks for: listing all
  // 282 people at once, all "Visible", is a wall that says nothing.
  const visiveis = members.filter(
    (m) => invisible.has(m.id) || (termo && `${m.name} ${m.email}`.toLowerCase().includes(termo))
  );

  return (
    <div className="flex max-w-xl flex-col gap-2">
      <p className="text-12 text-secondary">{t("chat.config.attendant_invisible_hint")}</p>
      <div className="flex items-center gap-2 rounded-md border border-subtle px-3 py-2">
        <Search className="size-3.5 shrink-0 text-secondary" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Search by name or email"
          className="w-full bg-transparent text-13 outline-none placeholder:text-secondary"
        />
        <span className="shrink-0 text-11 text-secondary">
          {t("chat.config.invisible_count", { count: invisible.size })}
        </span>
      </div>
      {visiveis.length === 0 && (
        <p className="rounded-md border border-dashed border-subtle px-3 py-6 text-center text-12 text-secondary">
          {termo ? `Nobody with "${busca}".` : "Nobody is invisible. Search for someone to make invisible."}
        </p>
      )}
      {visiveis.map((m) => (
        <div key={m.id} className="flex items-center justify-between gap-3 rounded-md border border-subtle p-2">
          <span className="min-w-0">
            <span className="block truncate text-13">{m.name}</span>
            <span className="block truncate text-11 text-secondary">{m.email}</span>
          </span>
          <button
            onClick={() => toggle(m.id)}
            className={`shrink-0 rounded-full border px-3 py-1 text-12 ${invisible.has(m.id) ? "border-danger-strong text-danger-primary" : "border-subtle text-secondary"}`}
          >
            {invisible.has(m.id) ? "Invisible" : "Visible"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Provider (Z-API) ──────────────────────────────────────────────────────────
function ProviderTab({ slug, api }: { slug: string; api: ReturnType<typeof chatApi> }) {
  const [cfg, setCfg] = useState<any>({ provider: "zapi", is_active: false });
  useEffect(() => {
    api
      .getProvider(slug)
      .then((r: any) => setCfg({ ...r, token: "", client_token: "" }))
      .catch(err);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  return (
    <div className="flex max-w-md flex-col gap-3">
      <Field label="Base URL">
        <input
          className={inputCls}
          value={cfg.base_url ?? ""}
          onChange={(e) => setCfg({ ...cfg, base_url: e.target.value })}
          placeholder="https://api.z-api.io"
        />
      </Field>
      <Field label="Instance ID">
        <input
          className={inputCls}
          value={cfg.instance_id ?? ""}
          onChange={(e) => setCfg({ ...cfg, instance_id: e.target.value })}
        />
      </Field>
      <Field label="Token">
        <input
          className={inputCls}
          value={cfg.token ?? ""}
          onChange={(e) => setCfg({ ...cfg, token: e.target.value })}
          placeholder={cfg.has_token ? "•••• (keeps if empty)" : ""}
        />
      </Field>
      <Field label="Client-Token">
        <input
          className={inputCls}
          value={cfg.client_token ?? ""}
          onChange={(e) => setCfg({ ...cfg, client_token: e.target.value })}
          placeholder={cfg.client_token === true ? "•••• (keeps if empty)" : ""}
        />
      </Field>
      <label className="text-sm flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!cfg.is_active}
          onChange={(e) => setCfg({ ...cfg, is_active: e.target.checked })}
        />{" "}
        Active
      </label>
      <p className="text-12 text-secondary">
        Webhook Z-API → <code>/chat-api/providers/zapi/webhook/{slug}</code>
      </p>
      <button
        className={btn + " self-start"}
        onClick={() =>
          api
            .saveProvider(slug, {
              provider: "zapi",
              base_url: cfg.base_url,
              instance_id: cfg.instance_id,
              ...(cfg.token ? { token: cfg.token } : {}),
              ...(cfg.client_token ? { client_token: cfg.client_token } : {}),
              is_active: cfg.is_active,
            })
            .then(() => ok("Provider saved."))
            .catch(err)
        }
      >
        Save
      </button>
    </div>
  );
}

// ── small helpers ─────────────────────────────────────────────────────────────
function Field({ label, w, children }: { label: string; w?: string; children: React.ReactNode }) {
  return (
    <label className={`text-sm ${w ?? ""}`}>
      <span className="mb-1 block text-12 text-secondary">{label}</span>
      {children}
    </label>
  );
}
function upd(set: any, idx: number, patch: any) {
  set((prev: any[]) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
}
