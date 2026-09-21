"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Trash2, Star, Check } from "lucide-react";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { PageHead } from "@/components/core/page-title";
import { APIService } from "@/services/api.service";
import { API_BASE_URL } from "@plane/constants";
import { SelectPesquisavel } from "@/components/common/select-pesquisavel";

// ── Service ──────────────────────────────────────────────────────────────────

class AiProviderService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }
  list(slug: string) {
    return this.get(`/api/workspaces/${slug}/ai-providers/`)
      .then((r) => r?.data?.results ?? [])
      .catch(() => []);
  }
  create(slug: string, data: any) {
    return this.post(`/api/workspaces/${slug}/ai-providers/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }
  update(slug: string, id: string, data: any) {
    return this.patch(`/api/workspaces/${slug}/ai-providers/${id}/`, data)
      .then((r) => r?.data)
      .catch((e) => {
        throw e?.response?.data;
      });
  }
  remove(slug: string, id: string) {
    return this.delete(`/api/workspaces/${slug}/ai-providers/${id}/`).catch((e) => {
      throw e?.response?.data;
    });
  }
}

const aiService = new AiProviderService();

const PROVIDER_TYPES = [
  {
    value: "ollama",
    label: "Ollama (local)",
    defaultUrl: "http://localhost:11434",
    defaultModel: "llama3",
    needsKey: false,
  },
  {
    value: "openai",
    label: "OpenAI",
    defaultUrl: "https://api.openai.com",
    defaultModel: "gpt-4o-mini",
    needsKey: true,
  },
  {
    value: "anthropic",
    label: "Anthropic / Claude",
    defaultUrl: "https://api.anthropic.com",
    defaultModel: "claude-haiku-4-5-20251001",
    needsKey: true,
  },
  {
    value: "openrouter",
    label: "OpenRouter",
    defaultUrl: "https://openrouter.ai/api",
    defaultModel: "openai/gpt-4o-mini",
    needsKey: true,
  },
  { value: "custom", label: "Custom (OpenAI compatible)", defaultUrl: "", defaultModel: "", needsKey: false },
];

const RESPONSE_FORMATS = [
  { value: "openai", label: "OpenAI — choices[].message.content" },
  { value: "ollama", label: "Ollama — message.content / response" },
  { value: "anthropic", label: "Anthropic — content[].text" },
  { value: "text", label: "Plain text / other" },
];

const EMPTY_FORM = {
  name: "",
  provider_type: "ollama",
  base_url: "",
  api_key: "",
  default_model: "",
  timeout_secs: 30,
  is_active: true,
  is_default: false,
  response_format: "openai",
};

// ── Provider Form Modal ───────────────────────────────────────────────────────

function ProviderModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  // On edit, merge over EMPTY_FORM so every field is present, and start the API key
  // blank (the backend never returns the secret; a blank key keeps the existing one).
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial, api_key: "" } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const providerMeta = PROVIDER_TYPES.find((p) => p.value === form.provider_type);

  const handleTypeChange = (type: string) => {
    const meta = PROVIDER_TYPES.find((p) => p.value === type)!;
    setForm((f: any) => ({
      ...f,
      provider_type: type,
      base_url: f.base_url || meta.defaultUrl,
      default_model: f.default_model || meta.defaultModel,
    }));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="shadow-2xl w-full max-w-lg rounded-xl bg-surface-1 p-6">
        <h2 className="text-15 mb-5 font-semibold">{initial ? "Edit AI Provider" : "New AI Provider"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-12 font-medium text-secondary">Name *</label>
            <input
              required
              className="focus:border-accent-primary w-full rounded-lg border border-subtle bg-surface-2 px-3 py-2 text-13 outline-none"
              value={form.name}
              onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Ollama Local"
            />
          </div>

          <div>
            <label className="mb-1 block text-12 font-medium text-secondary">Provider Type *</label>
            <SelectPesquisavel
              value={form.provider_type}
              onChange={handleTypeChange}
              opcoes={PROVIDER_TYPES.map((p) => ({ value: p.value, label: p.label }))}
            />
          </div>

          <div>
            <label className="mb-1 block text-12 font-medium text-secondary">Base URL</label>
            <input
              className="font-mono focus:border-accent-primary w-full rounded-lg border border-subtle bg-surface-2 px-3 py-2 text-13 outline-none"
              value={form.base_url}
              onChange={(e) => setForm((f: any) => ({ ...f, base_url: e.target.value }))}
              placeholder={
                form.provider_type === "custom"
                  ? "https://ai.example.com/api/ai/proxy"
                  : (providerMeta?.defaultUrl ?? "http://localhost:11434")
              }
            />
            {form.provider_type === "custom" ? (
              <p className="mt-1 text-11 text-tertiary">
                Exact endpoint URL — used as typed (without adding <code>/v1/chat/completions</code>). Expects OpenAI
                body format: <code>{`{ model, messages, temperature, max_tokens }`}</code>.
              </p>
            ) : (
              <p className="mt-1 text-11 text-tertiary">
                API address. For local Ollama: <code>http://localhost:11434</code>
              </p>
            )}
          </div>

          {form.provider_type === "custom" && (
            <div>
              <label className="mb-1 block text-12 font-medium text-secondary">Response Format</label>
              <SelectPesquisavel
                value={form.response_format}
                onChange={(valor) => setForm((f: any) => ({ ...f, response_format: valor }))}
                opcoes={RESPONSE_FORMATS.map((r) => ({ value: r.value, label: r.label }))}
              />
              <p className="mt-1 text-11 text-tertiary">How to read the response from your proxy/model.</p>
            </div>
          )}

          {providerMeta?.needsKey !== false && (
            <div>
              <label className="mb-1 block text-12 font-medium text-secondary">
                API Key {providerMeta?.needsKey ? "*" : "(optional)"}
              </label>
              <input
                type="password"
                className="focus:border-accent-primary font-mono w-full rounded-lg border border-subtle bg-surface-2 px-3 py-2 text-13 outline-none"
                value={form.api_key}
                onChange={(e) => setForm((f: any) => ({ ...f, api_key: e.target.value }))}
                placeholder="sk-..."
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-12 font-medium text-secondary">Default Model</label>
            <input
              className="focus:border-accent-primary font-mono w-full rounded-lg border border-subtle bg-surface-2 px-3 py-2 text-13 outline-none"
              value={form.default_model}
              onChange={(e) => setForm((f: any) => ({ ...f, default_model: e.target.value }))}
              placeholder={providerMeta?.defaultModel ?? "llama3"}
            />
            <p className="mt-1 text-11 text-tertiary">
              For Ollama, use the exact model name (e.g., llama3, mistral, phi4).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-12 font-medium text-secondary">Timeout (s)</label>
              <input
                type="number"
                min={5}
                max={300}
                className="focus:border-accent-primary w-full rounded-lg border border-subtle bg-surface-2 px-3 py-2 text-13 outline-none"
                value={form.timeout_secs}
                onChange={(e) => setForm((f: any) => ({ ...f, timeout_secs: Number(e.target.value) }))}
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-13">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f: any) => ({ ...f, is_active: e.target.checked }))}
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-13">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f: any) => ({ ...f, is_default: e.target.checked }))}
                />
                Default provider
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              className="rounded bg-accent-primary px-4 py-1.5 text-13 font-medium text-white hover:bg-accent-primary/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function AiSettingsPage() {
  const { workspaceSlug } = useParams();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; provider?: any }>({ open: false });

  const slug = workspaceSlug?.toString() ?? "";

  const load = () =>
    aiService
      .list(slug)
      .then(setProviders)
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, [slug]);

  const handleSave = async (data: any) => {
    try {
      // Don't send an empty api_key on edit — it would otherwise wipe the stored one.
      const payload = { ...data };
      if (modal.provider && !payload.api_key) delete payload.api_key;
      if (modal.provider) {
        const updated = await aiService.update(slug, modal.provider.id, payload);
        setProviders((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      } else {
        const created = await aiService.create(slug, data);
        setProviders((p) => [...p, created]);
      }
      setModal({ open: false });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Saved", message: "AI provider updated." });
    } catch (e: any) {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: e?.detail ?? "Could not save." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this provider?")) return;
    await aiService.remove(slug, id);
    setProviders((p) => p.filter((x) => x.id !== id));
    setToast({ type: TOAST_TYPE.SUCCESS, title: "Removed", message: "Provider removed successfully." });
  };

  const handleSetDefault = async (id: string) => {
    const updated = await aiService.update(slug, id, { is_default: true });
    setProviders((p) => p.map((x) => ({ ...x, is_default: x.id === updated.id })));
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <PageHead title="AI Providers" />
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold">AI Providers</h1>
            <p className="mt-1 text-13 text-secondary">
              Configure AI providers for the "Improve with AI" feature. Supports Ollama (local), OpenAI, Anthropic and
              others compatible with the OpenAI API.
            </p>
          </div>
          <button
            onClick={() => setModal({ open: true })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent-primary px-3 py-2 text-13 font-medium text-white hover:bg-accent-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Provider
          </button>
        </div>

        {/* Provider Cards */}
        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border border-subtle bg-surface-2" />
            ))}
          </div>
        )}
        {!loading && providers.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-subtle py-16 text-center">
            <p className="text-13 text-secondary">No AI providers configured.</p>
            <button
              onClick={() => setModal({ open: true })}
              className="mt-3 text-13 text-accent-primary hover:underline"
            >
              Add first provider
            </button>
          </div>
        )}
        <div className="space-y-3">
          {providers.map((p) => {
            const meta = PROVIDER_TYPES.find((t) => t.value === p.provider_type);
            return (
              <div
                key={p.id}
                className={cn(
                  "rounded-xl border p-4 transition-all",
                  p.is_default ? "border-accent-primary/50 bg-accent-primary/5" : "border-subtle bg-surface-1"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-14 font-semibold">{p.name}</span>
                      {p.is_default && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent-primary/15 px-2 py-0.5 text-11 font-medium text-accent-primary">
                          <Check className="h-2.5 w-2.5" /> Default
                        </span>
                      )}
                      {!p.is_active && (
                        <span className="rounded-full bg-surface-2 px-2 py-0.5 text-11 text-tertiary">Inactive</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-12 text-secondary">
                      <span className="font-medium">{meta?.label ?? p.provider_type}</span>
                      {p.base_url && <span className="font-mono">{p.base_url}</span>}
                      {p.default_model && (
                        <span>
                          Model: <span className="font-mono">{p.default_model}</span>
                        </span>
                      )}
                      {p.has_api_key && <span className="text-green-600">API Key configured</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!p.is_default && (
                      <button
                        onClick={() => handleSetDefault(p.id)}
                        title="Set as default"
                        className="rounded p-1.5 text-tertiary hover:bg-surface-2 hover:text-primary"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setModal({ open: true, provider: p })}
                      className="rounded p-1.5 text-tertiary hover:bg-surface-2 hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="hover:text-red-600 rounded p-1.5 text-tertiary hover:bg-surface-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help */}
        <div className="mt-8 rounded-xl border border-subtle bg-surface-2 p-4">
          <h3 className="mb-2 text-13 font-semibold">Quick Setup for Ollama</h3>
          <p className="text-12 text-secondary">To use local AI with Ollama:</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-12 text-secondary">
            <li>
              Install Ollama:{" "}
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:underline"
              >
                ollama.ai
              </a>
            </li>
            <li>
              Download a model: <code className="rounded bg-surface-1 px-1">ollama pull llama3</code>
            </li>
            <li>
              Add a provider above with URL <code className="rounded bg-surface-1 px-1">http://localhost:11434</code>
            </li>
            <li>Set as default and activate the "Improve with AI" button in editors</li>
          </ol>
        </div>
      </div>

      {modal.open && (
        <ProviderModal initial={modal.provider} onSave={handleSave} onClose={() => setModal({ open: false })} />
      )}
    </div>
  );
}

export default observer(AiSettingsPage);
