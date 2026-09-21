"use client";

import { Code, ExternalLink } from "lucide-react";
import { PageHead } from "@/components/core/page-title";

const EXAMPLES = [
  {
    title: "Read a work item by legacy ticket number",
    code: `async function action() {
  const ticketNumber = body?.ticket_number;
  if (!ticketNumber) { await makeLog(); return; }

  const issues = await executePrismaAction({
    table: 'issue',
    operation: 'retrieve',
    options: { where: { legacyTicketNumber: ticketNumber }, take: 1 },
  });

  // process issues...
  await makeLog();
}`,
  },
  {
    title: "Update a work item field",
    code: `async function action() {
  const { issue_id, new_status } = body ?? {};
  if (!issue_id) { await makeLog(); return; }

  await executePrismaAction({
    table: 'issue',
    operation: 'update',
    data: { description: new_status },
    options: { id: issue_id },
  });

  await makeLog();
}`,
  },
  {
    title: "Create a comment on a work item",
    code: `async function action() {
  const { issue_id, comment } = body ?? {};
  if (!issue_id || !comment) { await makeLog(); return; }

  await executePrismaAction({
    table: 'issueComment',
    operation: 'insert',
    data: { issueId: issue_id, comment },
  });

  await makeLog();
}`,
  },
];

const TABLES = [
  "issue", "issueComment", "technicalVisit", "entity", "project",
  "state", "label", "cycle", "module", "intakeIssue", "issueActivity",
];

export default function CustomIntegrationsDocsPage() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <PageHead title="Custom Integrations — Guide" />
      <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-10">

        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold">Custom Integration Guide</h1>
          <p className="mt-1 text-13 text-secondary">
            Custom integrations let external systems call a webhook URL on this workspace.
            When triggered, your JavaScript code runs and can read/write the database.
          </p>
        </div>

        {/* How it works */}
        <section className="space-y-3">
          <h2 className="text-15 font-semibold">How it works</h2>
          <ol className="list-decimal pl-5 space-y-1 text-13 text-secondary">
            <li>Create an integration — give it a name and write an <code className="bg-surface-2 px-1 rounded text-11 font-mono">async function action()</code>.</li>
            <li>Copy the generated <strong>webhook URL</strong> and configure your external system to POST to it.</li>
            <li>When the external system calls the URL, your code runs in a sandboxed environment.</li>
            <li>Use <code className="bg-surface-2 px-1 rounded text-11 font-mono">executePrismaAction()</code> to read/write data.</li>
            <li>Always call <code className="bg-surface-2 px-1 rounded text-11 font-mono">await makeLog()</code> at the end — this records the execution.</li>
          </ol>
        </section>

        {/* Injected globals */}
        <section className="space-y-3">
          <h2 className="text-15 font-semibold">Available globals</h2>
          <div className="rounded-xl border border-subtle bg-surface-1 divide-y divide-subtle">
            {[
              { name: "body", type: "any", desc: "Parsed JSON body sent by the external system." },
              { name: "headers", type: "Record<string, string>", desc: "HTTP request headers." },
              { name: "sourceIp", type: "string", desc: "IP address of the caller." },
              { name: "executePrismaAction(opts)", type: "async function", desc: "Read/write the database. See below." },
              { name: "makeLog(extra?)", type: "async function", desc: "Records this execution in the audit log. Must be called." },
              { name: "importModule(specifier)", type: "async function", desc: "Import built-in Node.js modules (node:crypto, node:url, etc.)." },
            ].map((g) => (
              <div key={g.name} className="flex gap-3 px-4 py-3">
                <code className="shrink-0 rounded bg-surface-2 px-2 py-0.5 text-11 font-mono text-accent-primary">{g.name}</code>
                <div>
                  <span className="text-11 text-tertiary">{g.type}</span>
                  <p className="text-13 text-secondary">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* executePrismaAction */}
        <section className="space-y-3">
          <h2 className="text-15 font-semibold">executePrismaAction options</h2>
          <div className="rounded-xl border border-subtle bg-surface-1 overflow-hidden">
            <pre className="p-4 text-11 font-mono overflow-x-auto text-primary">{`await executePrismaAction({
  table: 'issue',          // required — see allowed tables below
  operation: 'retrieve',   // 'retrieve' | 'insert' | 'update' | 'delete'
  data: { ... },           // for insert / update
  options: {
    where: { ... },        // filter conditions
    id: 'uuid',            // shorthand for single-record update / delete
    take: 50,              // max rows for retrieve (max 500)
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true },
  },
});`}</pre>
          </div>

          <div>
            <p className="text-13 font-medium mb-2">Allowed tables</p>
            <div className="flex flex-wrap gap-2">
              {TABLES.map((t) => (
                <code key={t} className="rounded bg-surface-2 px-2 py-0.5 text-11 font-mono text-secondary">{t}</code>
              ))}
            </div>
          </div>
        </section>

        {/* Signature verification */}
        <section className="space-y-3">
          <h2 className="text-15 font-semibold">Signature verification (optional)</h2>
          <p className="text-13 text-secondary">
            Send an <code className="bg-surface-2 px-1 rounded text-11 font-mono">x-webhook-signature</code> header with
            value <code className="bg-surface-2 px-1 rounded text-11 font-mono">sha256=&lt;HMAC-SHA256 of body using the integration secret&gt;</code>.
            If the header is present and the signature does not match, the request is rejected with 401.
          </p>
        </section>

        {/* Examples */}
        <section className="space-y-4">
          <h2 className="text-15 font-semibold flex items-center gap-2"><Code className="h-4 w-4" /> Examples</h2>
          {EXAMPLES.map((ex) => (
            <div key={ex.title} className="space-y-1">
              <p className="text-13 font-medium">{ex.title}</p>
              <pre className="rounded-xl border border-subtle bg-surface-1 p-4 text-11 font-mono overflow-x-auto text-primary">{ex.code}</pre>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}
