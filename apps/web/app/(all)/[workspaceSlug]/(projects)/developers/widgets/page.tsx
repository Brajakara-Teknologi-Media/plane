/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core/page-title";

// ── Small presentational helpers ──────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-3">
      <h2 className="text-custom-text-100 text-20 font-semibold">{title}</h2>
      <div className="text-custom-text-200 flex flex-col gap-3 text-14 leading-relaxed">{children}</div>
    </section>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="border-custom-border-200 bg-custom-background-90 text-custom-text-200 overflow-x-auto rounded-lg border p-3 text-12 leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <code className="bg-custom-background-80 text-custom-text-200 mr-1 inline-block rounded px-1.5 py-0.5 text-12">
      {children}
    </code>
  );
}

const PERMISSIONS = [
  ["worker-items.read", "List and read work items"],
  ["intakes.read", "List requests"],
  ["actions.read", "Read action/activity history"],
  ["stats.read", "Read aggregated statistics and reports"],
  ["users.read", "List workspace members"],
  ["entities.read", "List entities (clients)"],
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WidgetDocsPage() {
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() ?? "";

  return (
    <>
      <PageHead title="Widgets & Integrations — Documentation" />
      <div className="h-full w-full overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-10">
          {/* Header */}
          <header className="flex flex-col gap-2">
            <span className="tracking-wider text-custom-primary-100 text-12 font-medium uppercase">
              Developer documentation
            </span>
            <h1 className="text-custom-text-100 text-28 font-bold">Widgets &amp; Custom Integrations</h1>
            <p className="text-custom-text-200 text-14">
              Extend the platform with React widgets embedded in the home page and integrations that consume our
              TypeScript API. This page documents what we've added: the widget marketplace, the SDK, permissions, and
              custom webhooks/integrations.
            </p>
          </header>

          {/* TOC */}
          <nav className="border-custom-border-200 bg-custom-background-90 flex flex-wrap gap-2 rounded-xl border p-3 text-13">
            {[
              ["overview", "Overview"],
              ["sdk", "SDK"],
              ["create", "Create a widget"],
              ["manifest", "Manifest & permissions"],
              ["upload", "Upload & approval"],
              ["integrations", "Custom integrations"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="text-custom-primary-100 hover:underline">
                {label}
              </a>
            ))}
          </nav>

          <Section id="overview" title="Overview">
            <p>
              Widgets are isolated React components, compiled into a single bundle, that run on the workspace home page
              and consume data through the <strong>widget SDK</strong>. The flow is: you develop and package the widget,
              an administrator uploads and activates it, and it starts appearing to users.
            </p>
            <p>
              Unlike the original Plane, this feature is completely <strong>paywall-free</strong> and runs against the
              project's TypeScript API, with a dedicated gateway that enforces the permissions declared in the manifest.
            </p>
          </Section>

          <Section id="sdk" title="Widget SDK">
            <p>
              Install the SDK package to access React hooks and the global runtime <Pill>window.WidgetSDK</Pill>:
            </p>
            <Code>{`npm install @mateusseiboth/widgets-aviao`}</Code>
            <p>Available hooks (all respect manifest permissions):</p>
            <ul className="ml-5 list-disc">
              <li>
                <Pill>useWorkerItems(filters)</Pill> — work items / tickets
              </li>
              <li>
                <Pill>useIntakes(filters)</Pill> — intake items
              </li>
              <li>
                <Pill>useStats(params)</Pill> — statistics and reports
              </li>
              <li>
                <Pill>useUsers()</Pill> / <Pill>useEntities()</Pill> — members and entities
              </li>
            </ul>
          </Section>

          <Section id="create" title="Create a widget">
            <p>1. Create a Vite project in library mode:</p>
            <Code>{`npm create vite@latest my-widget -- --template react-ts`}</Code>
            <p>
              2. Configure <Pill>vite.config.ts</Pill> leaving React as an external dependency (the platform provides
              it):
            </p>
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
      external: ["react", "react-dom", "react/jsx-runtime"],
    },
  },
});`}</Code>
            <p>
              3. Export a React component as <strong>default export</strong>. It receives context props (e.g.{" "}
              <Pill>entityId</Pill>):
            </p>
            <Code>{`import { useWorkerItems } from "@mateusseiboth/widgets-aviao";

export default function MyWidget({ entityId }) {
  const { data, loading } = useWorkerItems({ entity_id: entityId });
  if (loading) return <p>Loading…</p>;
  return (
    <ul>
      {data?.data.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}`}</Code>
          </Section>

          <Section id="manifest" title="Manifest & permissions">
            <p>
              Every widget declares a <Pill>manifest.json</Pill> with metadata and the permissions it needs. The gateway
              only releases data for the declared permissions:
            </p>
            <Code>{`{
  "name": "My Widget",
  "version": "1.0.0",
  "author": "Your Name",
  "entry": "widget.js",
  "permissions": ["worker-items.read", "stats.read"]
}`}</Code>
            <div className="border-custom-border-200 overflow-hidden rounded-xl border">
              <table className="w-full text-13">
                <thead className="bg-custom-background-90 text-custom-text-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Permission</th>
                    <th className="px-3 py-2 text-left font-medium">What it grants</th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS.map(([perm, desc]) => (
                    <tr key={perm} className="border-custom-border-200 border-t">
                      <td className="px-3 py-2 align-top">
                        <Pill>{perm}</Pill>
                      </td>
                      <td className="text-custom-text-200 px-3 py-2">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="upload" title="Upload & approval">
            <p>Build and package the widget along with the manifest:</p>
            <Code>{`npm run build
zip widget.zip manifest.json -j dist/widget.js`}</Code>
            <p>
              Then, an administrator goes to{" "}
              <a href={`/${slug}/settings/widgets/`} className="text-custom-primary-100 hover:underline">
                Settings → Widgets
              </a>{" "}
              and uploads the <Pill>widget.zip</Pill>. After activation, the widget appears on the home page for all
              workspace users.
            </p>
          </Section>

          <Section id="integrations" title="Custom integrations">
            <p>
              Beyond widgets, the platform exposes a <strong>custom webhooks/integrations</strong> module to react to
              events (ticket creation/updates, visits, intakes) and integrate external systems. Configure them at{" "}
              <a href={`/${slug}/settings/webhooks/`} className="text-custom-primary-100 hover:underline">
                Settings → Webhooks
              </a>
              .
            </p>
            <p>
              Each integration receives a signed JSON payload and can be filtered by event type. For payload details,
              <Pill>X-Api-Key</Pill> authentication, and full examples, see{" "}
              <Pill>docs/custom-integration-guide.md</Pill> and <Pill>docs/widget-development-guide.md</Pill> in the
              repository.
            </p>
          </Section>

          <footer className="border-custom-border-200 text-custom-text-300 border-t pt-6 text-13">
            Documentation maintained by the team. Improvement suggestions welcome via pull request.
          </footer>
        </div>
      </div>
    </>
  );
}
