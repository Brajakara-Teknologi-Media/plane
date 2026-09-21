"use client";

import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { APIService } from "@/services/api.service";
import { API_BASE_URL } from "@plane/constants";

// ── Service ──────────────────────────────────────────────────────────────────

class CustomWebhookService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  list = (slug: string) =>
    this.get(`/api/workspaces/${slug}/custom-webhooks/`)
      .then((r) => r?.data?.results ?? [])
      .catch(() => []);
  create = (slug: string, d: any) =>
    this.post(`/api/workspaces/${slug}/custom-webhooks/`, d)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  update = (slug: string, id: string, d: any) =>
    this.patch(`/api/workspaces/${slug}/custom-webhooks/${id}/`, d)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  remove = (slug: string, id: string) => this.delete(`/api/workspaces/${slug}/custom-webhooks/${id}/`);
  getLogs = (slug: string, id: string) =>
    this.get(`/api/workspaces/${slug}/custom-webhooks/${id}/logs/`)
      .then((r) => r?.data?.results ?? [])
      .catch(() => []);
  getDetail = (slug: string, id: string) =>
    this.get(`/api/workspaces/${slug}/custom-webhooks/${id}/`)
      .then((r) => r?.data)
      .catch(() => null);
}

const svc = new CustomWebhookService();

// ── Default JS template ──────────────────────────────────────────────────────

const DEFAULT_JS = `/**
 * Custom integration — main function
 * Available variables: body, headers, sourceIp
 * Available functions:
 *   executePrismaAction({ table, operation, data?, options? })
 *   makeLog()  — records this webhook in the audit log (required at the end)
 *   importModule('node:crypto')  — imports built-in Node.js modules
 *
 * Operations: 'retrieve' | 'insert' | 'update' | 'delete'
 */
async function action() {
  // Example: extract ticket number from webhook body
  const ticketNumber = body?.ticket_number ?? body?.number;
  if (!ticketNumber) {
    await makeLog();
    return;
  }

  // Validate format (e.g. 1234-2026)
  const match = String(ticketNumber).match(/^(\\d+)-(\\d{4})$/);
  if (!match) {
    await makeLog();
    return;
  }

  // Find work item by legacy ticket number
  const issues = await executePrismaAction({
    table: 'issue',
    operation: 'retrieve',
    options: {
      where: { legacyTicketNumber: ticketNumber },
      take: 1,
    },
  });

  if (issues.length === 0) {
    await makeLog();
    return;
  }

  const issue = issues[0];

  // Update a field on the work item
  // await executePrismaAction({
  //   table: 'issue',
  //   operation: 'update',
  //   data: { /* fields to update */ },
  //   options: { id: issue.id },
  // });

  // Always call makeLog at the end
  await makeLog();
}
`;

// ── Form Modal ────────────────────────────────────────────────────────────────

function WebhookFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: any;
  onSave: (d: any) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", js_code: DEFAULT_JS, is_active: true, ...initial });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="shadow-2xl flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-surface-1">
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <h2 className="text-15 font-semibold">{initial ? "Edit Integration" : "New Custom Integration"}</h2>
          <button onClick={onClose} className="text-tertiary hover:text-primary">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex gap-4 border-b border-subtle px-5 py-3">
            <div className="flex-1">
              <label className="mb-1 block text-12 font-medium text-secondary">Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                className="focus:border-accent-primary w-full rounded-lg border border-subtle bg-surface-2 px-3 py-1.5 text-13 outline-none"
                placeholder="Ex: ERP Integration"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-12 font-medium text-secondary">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                className="focus:border-accent-primary w-full rounded-lg border border-subtle bg-surface-2 px-3 py-1.5 text-13 outline-none"
                placeholder="Describe the purpose of this integration"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2 text-13">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f: any) => ({ ...f, is_active: e.target.checked }))}
                />
                Active
              </label>
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden px-5 py-3">
            <div className="mb-1 flex items-center justify-between">
              <label className="text-12 font-medium text-secondary">JavaScript Code *</label>
              <a
                href="/settings/integrations-custom/docs"
                target="_blank"
                className="flex items-center gap-1 text-11 text-accent-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> View integration guide
              </a>
            </div>
            <textarea
              required
              value={form.js_code}
              onChange={(e) => setForm((f: any) => ({ ...f, js_code: e.target.value }))}
              className="font-mono focus:border-accent-primary flex-1 resize-none rounded-lg border border-subtle bg-surface-2 p-3 text-12 text-primary outline-none"
              spellCheck={false}
            />
            <p className="mt-1 text-11 text-tertiary">
              The function <code>async function action()</code> is required and must call <code>await makeLog()</code>{" "}
              at the end.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-subtle px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-1.5 text-13 text-secondary hover:text-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-accent-primary px-4 py-1.5 text-13 font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Logs Modal ────────────────────────────────────────────────────────────────

function LogsModal({ logs, onClose }: { logs: any[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="shadow-2xl flex h-[70vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-surface-1">
        <div className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <h2 className="text-15 font-semibold">Execution Log</h2>
          <button onClick={onClose} className="text-tertiary hover:text-primary">
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          {logs.length === 0 && <p className="py-8 text-center text-13 text-secondary">No executions recorded.</p>}
          {logs.map((l) => (
            <div
              key={l.id}
              className={cn(
                "rounded-lg border p-3",
                l.status === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn("text-12 font-semibold", l.status === "success" ? "text-green-700" : "text-red-700")}
                >
                  {l.status}
                </span>
                <div className="flex items-center gap-3 text-11 text-tertiary">
                  {l.execution_ms != null && <span>{l.execution_ms}ms</span>}
                  <span>{l.source_ip}</span>
                  <span>{new Date(l.created_at).toLocaleString("en-US")}</span>
                </div>
              </div>
              {l.error && <p className="text-red-700 mt-1 text-12">{l.error}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function CustomIntegrationsPage() {
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";
  const [hooks, setHooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: "form" | "logs"; hook?: any; logs?: any[] } | null>(null);

  const load = useCallback(() => {
    svc
      .list(slug)
      .then(setHooks)
      .finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (data: any) => {
    try {
      if (modal?.hook) {
        await svc.update(slug, modal.hook.id, data);
      } else {
        const created = await svc.create(slug, data);
        setHooks((h) => [...h, created]);
      }
      load();
      setModal(null);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved", message: "Integration saved successfully." });
    } catch (e: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: e?.detail ?? "Could not save integration." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this integration?")) return;
    await svc.remove(slug, id);
    setHooks((h) => h.filter((x) => x.id !== id));
  };

  const handleViewLogs = async (hook: any) => {
    const logs = await svc.getLogs(slug, hook.id);
    setModal({ type: "logs", logs });
  };

  const copyReceiveUrl = (hook: any) => {
    const url = `${window.location.origin}/api/v1/webhooks/receive/${slug}/${hook.id}/`;
    navigator.clipboard.writeText(url);
    setToast({ type: TOAST_TYPE.INFO, title: "Copied", message: "URL copied to clipboard." });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <PageHead title="Custom Integrations" />
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">Custom Integrations</h1>
            <p className="mt-1 text-13 text-secondary">
              Create webhooks with custom JavaScript logic. When an external system calls the integration URL, your JS
              code will be executed, allowing you to read/write to the database.
            </p>
          </div>
          <button
            onClick={() => setModal({ type: "form" })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-primary px-3 py-2 text-13 font-medium text-white hover:bg-accent-primary/90"
          >
            <Plus className="h-4 w-4" /> New Integration
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-subtle bg-surface-2" />
            ))}
          </div>
        )}
        {!loading && hooks.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-subtle py-16 text-center">
            <p className="text-13 text-secondary">No custom integrations created.</p>
            <button
              onClick={() => setModal({ type: "form" })}
              className="mt-3 text-13 text-accent-primary hover:underline"
            >
              Create first integration
            </button>
          </div>
        )}
        <div className="space-y-3">
          {hooks.map((hook) => (
            <div key={hook.id} className="rounded-xl border border-subtle bg-surface-1 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-14 font-semibold">{hook.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-11 font-medium",
                        hook.is_active ? "bg-green-100 text-green-700" : "bg-surface-2 text-tertiary"
                      )}
                    >
                      {hook.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {hook.description && <p className="mt-0.5 text-13 text-secondary">{hook.description}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <code className="font-mono max-w-[420px] truncate rounded bg-surface-2 px-2 py-0.5 text-11 text-tertiary">
                      POST /api/v1/webhooks/receive/{slug}/{hook.id}/
                    </code>
                    <button onClick={() => copyReceiveUrl(hook)} className="shrink-0 text-tertiary hover:text-primary">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleViewLogs(hook)}
                    className="rounded px-2 py-1 text-12 text-secondary hover:bg-surface-2"
                  >
                    Logs
                  </button>
                  <button
                    onClick={() => setModal({ type: "form", hook })}
                    className="rounded p-1.5 text-tertiary hover:bg-surface-2"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(hook.id)}
                    className="hover:text-red-600 rounded p-1.5 text-tertiary hover:bg-surface-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal?.type === "form" && (
        <WebhookFormModal initial={modal.hook} onSave={handleSave} onClose={() => setModal(null)} />
      )}
      {modal?.type === "logs" && <LogsModal logs={modal.logs ?? []} onClose={() => setModal(null)} />}
    </div>
  );
}

export default observer(CustomIntegrationsPage);
