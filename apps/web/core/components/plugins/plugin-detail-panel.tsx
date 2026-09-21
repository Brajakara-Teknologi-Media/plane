"use client";

import React from "react";
import { useTranslation } from "@plane/i18n";
import { PluginSettingsForm } from "@/components/plugins/plugin-settings-form";
import type { IPlugin } from "@/services/plugin.service";

interface PluginDetailPanelProps {
  plugin: IPlugin;
  onClose: () => void;
}

export const PluginDetailPanel: React.FC<PluginDetailPanelProps> = ({ plugin, onClose }) => {
  const { t } = useTranslation();
  const manifest = plugin.manifest as Record<string, unknown>;
  const pages = plugin.contributions?.pages ?? [];
  const sidebar = plugin.contributions?.sidebar ?? [];

  return (
    <div className="shadow-xl dark:bg-neutral-900 fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col bg-white">
      <div className="border-neutral-200 dark:border-neutral-700 flex items-center justify-between border-b px-6 py-4">
        <h2 className="text-lg text-neutral-900 font-semibold dark:text-white">{plugin.name}</h2>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
        <Section title={t("plugins.sections.metadata")}>
          <Row label="Slug" value={plugin.slug} mono />
          <Row label={t("plugins.table.version")} value={plugin.version} />
          <Row label={t("plugins.author")} value={plugin.author} />
          <Row label={t("plugins.table.status")} value={plugin.status} />
          <Row label={t("plugins.sections.entry_file")} value={plugin.entry_file} mono />
          {plugin.description && <Row label="Description" value={plugin.description} />}
        </Section>

        <Section title={t("common.permissions")}>
          <div className="flex flex-wrap gap-2">
            {plugin.permissions.length === 0 ? (
              <span className="text-sm text-neutral-500">{t("common.none")}</span>
            ) : (
              plugin.permissions.map((p) => (
                <span
                  key={p}
                  className="bg-blue-100 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded px-2 py-0.5 font-medium"
                >
                  {p}
                </span>
              ))
            )}
          </div>
        </Section>

        <Section title="Pages">
          {pages.length === 0 ? (
            <span className="text-sm text-neutral-500">{t("common.none")}</span>
          ) : (
            <ul className="text-sm space-y-1">
              {pages.map((pg) => (
                <li key={pg.path} className="flex justify-between">
                  <span className="text-neutral-900 dark:text-white">{pg.title}</span>
                  <span className="font-mono text-xs text-neutral-500">/{pg.path}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title={t("plugins.sections.sidebar_items")}>
          {sidebar.length === 0 ? (
            <span className="text-sm text-neutral-500">{t("common.none")}</span>
          ) : (
            <ul className="text-sm space-y-1">
              {sidebar.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span className="text-neutral-900 dark:text-white">{s.label}</span>
                  <span className="font-mono text-xs text-neutral-500">→ /{s.page}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Settings">
          <PluginSettingsForm pluginId={plugin.id} />
        </Section>

        <Section title={t("plugins.sections.manifest_raw")}>
          <pre className="bg-neutral-100 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 overflow-x-auto rounded p-3">
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </Section>

        <Section title={t("plugins.sections.dates")}>
          <Row label={t("common.created_at")} value={new Date(plugin.created_at).toLocaleString()} />
          <Row label={t("common.updated_at")} value={new Date(plugin.updated_at).toLocaleString()} />
        </Section>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h3 className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 font-semibold tracking-wide uppercase">
      {title}
    </h3>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({ label, value, mono }) => (
  <div className="text-sm flex justify-between py-1">
    <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className={`text-neutral-900 dark:text-white ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
  </div>
);
