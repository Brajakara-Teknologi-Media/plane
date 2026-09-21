import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import {
  Puzzle,
  Search,
  Download,
  Trash2,
  ExternalLink,
  Star,
  Package,
  Globe,
  Tag,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { DOCS_URL } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { PageHead } from "@/components/core/page-title";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";
import { SelectPesquisavel } from "@/components/common/select-pesquisavel";

// ── Plugin types ──────────────────────────────────────────────────────────────

export type TPlugin = {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  category: TPluginCategory;
  tags: string[];
  entryUrl?: string; // for iframe-loaded UI plugins
  apiUrl?: string; // for webhook/API plugins
  docsUrl?: string;
  iconUrl?: string;
  stars?: number;
  isOfficial?: boolean;
  isInstalled?: boolean;
  installedVersion?: string;
};

type TPluginCategory = "integration" | "automation" | "reporting" | "ui" | "utility" | "ai";

const CATEGORY_LABELS: Record<TPluginCategory, string> = {
  integration: "Integration",
  automation: "Automation",
  reporting: "Reporting",
  ui: "Interface",
  utility: "Utility",
  ai: "Artificial Intelligence",
};

const CATEGORY_COLORS: Record<TPluginCategory, string> = {
  integration: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  automation: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  reporting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  ui: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  utility: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  ai: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

// ── Built-in plugin registry (community-extensible) ───────────────────────────
// Add new plugins here or fetch from an external registry URL.

const BUILTIN_REGISTRY: TPlugin[] = [
  {
    id: "github-integration",
    name: "GitHub Integration",
    description: "Link GitHub commits, PRs, and issues to Aviao tickets. View repository status directly in the panel.",
    version: "1.0.0",
    author: "Avião Team",
    category: "integration",
    tags: ["github", "vcs", "devops"],
    docsUrl: DOCS_URL,
    stars: 342,
    isOfficial: true,
  },
  {
    id: "slack-notifications",
    name: "Slack Notifications",
    description: "Receive notifications for tickets, comments, and status updates directly in Slack.",
    version: "1.2.0",
    author: "Avião Team",
    category: "integration",
    tags: ["slack", "notifications", "communication"],
    stars: 218,
    isOfficial: true,
  },
  {
    id: "time-report",
    name: "Time Report",
    description: "Generate detailed reports of logged hours by user, project, and period. Exports to Excel and PDF.",
    version: "0.9.0",
    author: "Community",
    category: "reporting",
    tags: ["time", "report", "hours"],
    stars: 89,
  },
  {
    id: "recurring-issues",
    name: "Recurring Tasks",
    description: "Create tickets that repeat automatically based on configurable intervals (daily, weekly, monthly).",
    version: "1.1.0",
    author: "Community",
    category: "automation",
    tags: ["recurring", "automation", "schedule"],
    stars: 156,
  },
  {
    id: "ai-assistant",
    name: "AI Assistant",
    description:
      "Integrate AI models (OpenAI and Llama compatible) for smart priority suggestions, automatic categorization, and issue summaries.",
    version: "2.0.0",
    author: "Avião Team",
    category: "ai",
    tags: ["ai", "openai", "llama", "automation"],
    stars: 412,
    isOfficial: true,
  },
  {
    id: "entity-dashboard",
    name: "Entity Dashboard",
    description:
      "View metrics grouped by entity (municipality, city hall, chamber). See SLAs, response times, and per-client history.",
    version: "1.0.0",
    author: "Community",
    category: "reporting",
    tags: ["entity", "dashboard", "client"],
    stars: 67,
  },
  {
    id: "bulk-import",
    name: "Bulk Import",
    description: "Import tickets from CSV, Excel, or JSON. Supports field mapping and incremental import.",
    version: "1.3.0",
    author: "Community",
    category: "utility",
    tags: ["import", "csv", "excel"],
    stars: 134,
  },
  {
    id: "kanban-themes",
    name: "Kanban Themes",
    description: "Customize colors, fonts, and Kanban board layout. Includes dark, light, and high-contrast themes.",
    version: "0.5.0",
    author: "Community",
    category: "ui",
    tags: ["kanban", "theme", "visual"],
    stars: 45,
  },
];

// ── Plugin detail modal ───────────────────────────────────────────────────────

function PluginDetailModal({
  plugin,
  open,
  onClose,
  onInstall,
  onUninstall,
  installing,
}: {
  plugin: TPlugin | null;
  open: boolean;
  onClose: () => void;
  onInstall: (plugin: TPlugin) => void;
  onUninstall: (plugin: TPlugin) => void;
  installing: string | null;
}) {
  if (!plugin) return null;
  const isInstalling = installing === plugin.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Panel width={EDialogWidth.LG}>
        <div className="p-6">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-subtle bg-surface-2">
              {plugin.iconUrl ? (
                <img src={plugin.iconUrl} alt={plugin.name} className="h-10 w-10 rounded" />
              ) : (
                <Puzzle className="text-secondary-text h-7 w-7" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{plugin.name}</h2>
                {plugin.isOfficial && (
                  <span className="text-xs inline-flex items-center gap-1 rounded-full bg-accent-primary/10 px-2 py-0.5 font-medium text-accent-primary">
                    <CheckCircle className="h-3 w-3" /> Official
                  </span>
                )}
                <span
                  className={`text-xs inline-flex rounded-full px-2 py-0.5 font-medium ${CATEGORY_COLORS[plugin.category]}`}
                >
                  {CATEGORY_LABELS[plugin.category]}
                </span>
              </div>
              <p className="text-sm text-secondary-text mt-0.5">
                by {plugin.author} · v{plugin.version}
              </p>
            </div>
          </div>

          <p className="text-sm mb-4 text-primary">{plugin.description}</p>

          <div className="mb-5 flex flex-wrap gap-1.5">
            {plugin.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-secondary-text inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-2 px-2 py-0.5"
              >
                <Tag className="h-2.5 w-2.5" /> {tag}
              </span>
            ))}
          </div>

          {plugin.docsUrl && (
            <a
              href={plugin.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs mb-5 inline-flex items-center gap-1.5 text-accent-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View documentation
            </a>
          )}

          <div className="flex items-center justify-between border-t border-subtle pt-4">
            {plugin.stars !== undefined && (
              <div className="text-xs text-secondary-text flex items-center gap-1">
                <Star className="h-3.5 w-3.5" />
                {plugin.stars} stars
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Close
              </Button>
              {plugin.isInstalled ? (
                <Button
                  variant="error-fill"
                  size="sm"
                  onClick={() => {
                    onUninstall(plugin);
                    onClose();
                  }}
                  loading={isInstalling}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> Uninstall
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onInstall(plugin);
                    onClose();
                  }}
                  loading={isInstalling}
                >
                  <Download className="mr-1 h-3.5 w-3.5" /> Install
                </Button>
              )}
            </div>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

// ── Plugin card ───────────────────────────────────────────────────────────────

function PluginCard({
  plugin,
  onInstall,
  onUninstall,
  onDetails,
  installing,
}: {
  plugin: TPlugin;
  onInstall: (p: TPlugin) => void;
  onUninstall: (p: TPlugin) => void;
  onDetails: (p: TPlugin) => void;
  installing: string | null;
}) {
  const isInstalling = installing === plugin.id;

  return (
    <div
      className="group hover:border-accent-primary/40 hover:shadow-sm relative flex cursor-pointer flex-col rounded-lg border border-subtle bg-surface-1 p-4 transition-all"
      onClick={() => onDetails(plugin)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-subtle bg-surface-2">
            {plugin.iconUrl ? (
              <img src={plugin.iconUrl} alt={plugin.name} className="h-7 w-7 rounded" />
            ) : (
              <Puzzle className="text-secondary-text h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-medium text-primary">{plugin.name}</p>
              {plugin.isOfficial && (
                <span title="Official plugin">
                  <CheckCircle className="h-3.5 w-3.5 text-accent-primary" />
                </span>
              )}
            </div>
            <p className="text-xs text-secondary-text">v{plugin.version}</p>
          </div>
        </div>
        {plugin.isInstalled && (
          <span className="bg-green-100 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-medium">
            <CheckCircle className="h-3 w-3" /> Installed
          </span>
        )}
      </div>

      <p className="text-xs text-secondary-text mb-3 line-clamp-2 grow">{plugin.description}</p>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-xs inline-flex rounded-full px-2 py-0.5 font-medium ${CATEGORY_COLORS[plugin.category]}`}
        >
          {CATEGORY_LABELS[plugin.category]}
        </span>

        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {plugin.stars !== undefined && (
            <span className="text-xs text-secondary-text flex items-center gap-0.5">
              <Star className="h-3 w-3" /> {plugin.stars}
            </span>
          )}
          {plugin.isInstalled ? (
            <Button variant="secondary" size="sm" onClick={() => onUninstall(plugin)} loading={isInstalling}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onInstall(plugin)} loading={isInstalling}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PluginsPage = observer(function PluginsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { currentWorkspace } = useWorkspace();

  const [plugins, setPlugins] = useState<TPlugin[]>([]);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<TPluginCategory | "">("");
  const [filterInstalled, setFilterInstalled] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [detailPlugin, setDetailPlugin] = useState<TPlugin | null>(null);

  const load = useCallback(async () => {
    try {
      // Load installed plugins from backend
      const res = await fetch(`/api/workspaces/${workspaceSlug}/plugins/`, { credentials: "include" });
      const installed: string[] = res.ok ? await res.json().then((d: any) => d.installed ?? []) : [];

      // Merge registry with installed state
      setPlugins(
        BUILTIN_REGISTRY.map((p) => ({
          ...p,
          isInstalled: installed.includes(p.id),
        }))
      );
    } catch {
      setPlugins(BUILTIN_REGISTRY);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleInstall = async (plugin: TPlugin) => {
    setInstalling(plugin.id);
    try {
      await fetch(`/api/workspaces/${workspaceSlug}/plugins/${plugin.id}/install/`, {
        method: "POST",
        credentials: "include",
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Installed", message: `${plugin.name} successfully installed.` });
      load();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "Failed to install plugin." });
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (plugin: TPlugin) => {
    if (!confirm(`Uninstall ${plugin.name}?`)) return;
    setInstalling(plugin.id);
    try {
      await fetch(`/api/workspaces/${workspaceSlug}/plugins/${plugin.id}/uninstall/`, {
        method: "DELETE",
        credentials: "include",
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Uninstalled", message: `${plugin.name} removed.` });
      load();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: "Failed to uninstall plugin." });
    } finally {
      setInstalling(null);
    }
  };

  const filtered = plugins.filter((p) => {
    if (filterInstalled && !p.isInstalled) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(s) || p.description.toLowerCase().includes(s) || p.tags.some((t) => t.includes(s))
      );
    }
    return true;
  });

  const installedCount = plugins.filter((p) => p.isInstalled).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHead title={`${currentWorkspace?.name ?? ""} - Plugin Store`} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle px-6 py-4">
        <div className="flex items-center gap-3">
          <Puzzle className="h-6 w-6 text-accent-primary" />
          <div>
            <h1 className="text-lg font-semibold">Plugin Store</h1>
            <p className="text-xs text-secondary-text">
              {installedCount > 0
                ? `${installedCount} plugin(s) installed · ${plugins.length} available`
                : `${plugins.length} available plugins`}
            </p>
          </div>
        </div>
        <a
          href="https://github.com/seu-repo/plane-plugins"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-secondary-text inline-flex items-center gap-1.5 hover:text-primary"
        >
          <Globe className="h-3.5 w-3.5" />
          Publish a plugin
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-subtle px-6 py-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5">
          <Search className="text-secondary-text h-3.5 w-3.5 shrink-0" />
          <input
            className="text-xs placeholder:text-secondary-text w-full border-none bg-transparent outline-none"
            placeholder="Search plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <SelectPesquisavel
          value={filterCategory}
          onChange={(valor) => setFilterCategory(valor as TPluginCategory | "")}
          opcoes={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v as string }))}
          opcaoVazia={{ value: "", label: "All categories" }}
          className="w-48"
          buttonClassName="h-8 text-xs"
        />

        <button
          onClick={() => setFilterInstalled((v) => !v)}
          className={`text-xs inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 transition-colors ${
            filterInstalled
              ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
              : "text-secondary-text border-subtle bg-surface-2 hover:text-primary"
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          Installed
        </button>
      </div>

      {/* Plugin grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="text-secondary-text mb-3 h-10 w-10" />
            <p className="text-sm font-medium text-primary">No plugins found</p>
            <p className="text-xs text-secondary-text mt-1">
              Try removing the filters or searching for a different term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onInstall={handleInstall}
                onUninstall={handleUninstall}
                onDetails={setDetailPlugin}
                installing={installing}
              />
            ))}
          </div>
        )}
      </div>

      {/* Plugin detail modal */}
      <PluginDetailModal
        plugin={detailPlugin}
        open={!!detailPlugin}
        onClose={() => setDetailPlugin(null)}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        installing={installing}
      />
    </div>
  );
});

export default PluginsPage;
