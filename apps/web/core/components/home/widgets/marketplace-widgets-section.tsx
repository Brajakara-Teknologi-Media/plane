"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { EModalWidth, ModalCore } from "@plane/ui";
import { widgetService, type IWidget } from "@/services/widget.service";
import { DynamicWidget } from "@/components/widgets/dynamic-widget";

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchActiveWidgets() {
  const res = await widgetService.list({ status: "ACTIVE" });
  return res.results ?? [];
}

// ── Section component ─────────────────────────────────────────────────────────

export const MarketplaceWidgetsSection = observer(function MarketplaceWidgetsSection() {
  const [guideOpen, setGuideOpen] = useState(false);

  const { data: widgets, isLoading } = useSWR<IWidget[]>("HOME_MARKETPLACE_WIDGETS", fetchActiveWidgets, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
  });

  // Nothing to show while loading or when there are no active widgets
  if (isLoading || !widgets || widgets.length === 0) return null;

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-custom-text-100 font-semibold">Widgets</span>
            <span className="bg-custom-primary-100/10 text-xs text-custom-primary-100 rounded-full px-2 py-0.5 font-medium">
              {widgets.length}
            </span>
          </div>
          <button
            onClick={() => setGuideOpen(true)}
            className="text-xs text-custom-primary-100 hover:underline focus:outline-none"
          >
            How to create my widget?
          </button>
        </div>

        {/* Widget grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="border-custom-border-200 bg-custom-background-100 overflow-hidden rounded-xl border p-4"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs text-custom-text-200 font-medium">{widget.name}</span>
                <span className="font-mono text-xs text-custom-text-400">v{widget.version}</span>
              </div>
              <DynamicWidget widgetId={widget.id} />
            </div>
          ))}
        </div>
      </div>

      {/* "Como criar meu widget?" guide modal */}
      <ModalCore isOpen={guideOpen} handleClose={() => setGuideOpen(false)} width={EModalWidth.LG}>
        <WidgetDevGuideModal onClose={() => setGuideOpen(false)} />
      </ModalCore>
    </>
  );
});

// ── Quick-start guide modal content ──────────────────────────────────────────

function WidgetDevGuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex max-h-[80vh] flex-col">
      {/* Modal header */}
      <div className="border-custom-border-200 flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-base text-custom-text-100 font-semibold">How to create my widget?</h2>
        <button onClick={onClose} className="text-custom-text-300 hover:text-custom-text-100 transition-colors">
          ✕
        </button>
      </div>

      {/* Modal body */}
      <div className="text-sm text-custom-text-200 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <Step number={1} title="Create the widget project">
          <p>Use Vite in Library Mode to compile your React component into a single bundle:</p>
          <Code>{`npm create vite@latest meu-widget -- --template react-ts`}</Code>
        </Step>

        <Step number={2} title="Configure vite.config.ts">
          <Code>{`export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.tsx",
      name: "Widget",
      fileName: () => "widget.js",
      formats: ["es"],
    },
    rollupOptions: {
      // React is provided by the platform — don't include in bundle
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});`}</Code>
        </Step>

        <Step number={3} title="Implement the component">
          <p>
            O arquivo <code className="bg-custom-background-80 rounded px-1">src/index.tsx</code> deve exportar um
            componente React como <strong>default export</strong>:
          </p>
          <Code>{`import { useWorkerItems } from "@mateusseiboth/widgets-aviao";

export default function MyWidget({ entityId }) {
  const { data, loading } = useWorkerItems({ entity_id: entityId });

  if (loading) return <p>Loading…</p>;
  return (
    <ul>
      {data?.data.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  );
}`}</Code>
        </Step>

        <Step number={4} title="Create manifest.json">
          <Code>{`{
  "name": "My Widget",
  "version": "1.0.0",
  "author": "Your Name",
  "entry": "widget.js",
  "permissions": ["worker-items.read", "stats.read"]
}`}</Code>
          <p className="mt-2">
            Available permissions:{" "}
            {["worker-items.read", "intakes.read", "actions.read", "stats.read", "users.read", "entities.read"].map(
              (p) => (
                <code key={p} className="bg-custom-background-80 text-xs mr-1 rounded px-1">
                  {p}
                </code>
              )
            )}
          </p>
        </Step>

        <Step number={5} title="Build and package">
          <Code>{`npm run build
zip widget.zip manifest.json -j dist/widget.js`}</Code>
        </Step>

        <Step number={6} title="Upload">
          <p>
            Go to{" "}
            <a href="/settings/widgets/" className="text-custom-primary-100 hover:underline" onClick={onClose}>
              Administration → Settings → Widgets
            </a>{" "}
            and upload the <code className="bg-custom-background-80 rounded px-1">widget.zip</code> file. After upload,
            an administrator can activate the widget and it will appear here on the home page.
          </p>
        </Step>

        <div className="border-custom-primary-100/30 bg-custom-primary-100/5 rounded-lg border p-4">
          <p className="text-custom-primary-100 font-medium">SDK available</p>
          <p className="mt-1">
            Install <code className="bg-custom-background-80 rounded px-1">@mateusseiboth/widgets-aviao</code> to access
            React hooks (<code className="bg-custom-background-80 rounded px-1">useWorkerItems</code>,{" "}
            <code className="bg-custom-background-80 rounded px-1">useStats</code>, etc.) and{" "}
            <code className="bg-custom-background-80 rounded px-1">window.WidgetSDK</code> at runtime.
          </p>
          <p className="text-xs text-custom-text-300 mt-2">
            Full documentation in{" "}
            <code className="bg-custom-background-80 rounded px-1">docs/widget-development.md</code> in the repository.
          </p>
        </div>
      </div>

      {/* Modal footer */}
      <div className="border-custom-border-200 flex justify-end border-t px-6 py-4">
        <a href="/settings/widgets/" onClick={onClose} className="text-sm text-custom-primary-100 mr-3 hover:underline">
          Manage widgets →
        </a>
        <button
          onClick={onClose}
          className="border-custom-border-200 text-sm text-custom-text-200 hover:bg-custom-background-80 rounded-lg border px-4 py-1.5"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="bg-custom-primary-100/15 text-xs text-custom-primary-100 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-bold">
        {number}
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-custom-text-100 font-medium">{title}</p>
        {children}
      </div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-custom-background-80 text-xs text-custom-text-200 overflow-x-auto rounded-lg p-3 leading-relaxed">
      {children}
    </pre>
  );
}
