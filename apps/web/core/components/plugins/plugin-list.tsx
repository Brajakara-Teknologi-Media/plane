"use client";

import React from "react";
import { useTranslation } from "@plane/i18n";
import type { IPlugin } from "@/services/plugin.service";

const STATUS_KEYS: Record<IPlugin["status"], string> = {
  ACTIVE: "plugins.status.active",
  INACTIVE: "plugins.status.inactive",
  PENDING_APPROVAL: "plugins.status.pending",
  ARCHIVED: "plugins.status.archived",
};

const STATUS_CLS: Record<IPlugin["status"], string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  INACTIVE: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  ARCHIVED: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

interface PluginListProps {
  plugins: IPlugin[];
  isLoading: boolean;
  onActivate: (id: string) => void;
  onDeactivate: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (plugin: IPlugin) => void;
}

export const PluginList: React.FC<PluginListProps> = ({
  plugins,
  isLoading,
  onActivate,
  onDeactivate,
  onRemove,
  onSelect,
}) => {
  const { t } = useTranslation();
  if (isLoading) {
    return <div className="text-neutral-400 flex items-center justify-center py-16">{t("plugins.plugin.loading")}</div>;
  }

  if (plugins.length === 0) {
    return (
      <div className="text-neutral-400 flex flex-col items-center justify-center py-16">
        <div className="text-4xl">🔌</div>
        <p className="text-sm mt-3">{t("plugins.plugin.empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="text-sm w-full text-left">
        <thead>
          <tr className="border-neutral-200 text-xs text-neutral-500 dark:border-neutral-700 border-b font-medium uppercase">
            <th className="py-3 pr-4">Name</th>
            <th className="py-3 pr-4">{t("plugins.table.version")}</th>
            <th className="py-3 pr-4">{t("plugins.author")}</th>
            <th className="py-3 pr-4">{t("plugins.table.surfaces")}</th>
            <th className="py-3 pr-4">{t("plugins.table.status")}</th>
            <th className="py-3">{t("plugins.table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {plugins.map((p) => {
            const statusMeta = { label: t(STATUS_KEYS[p.status]), className: STATUS_CLS[p.status] };
            const pages = p.contributions?.pages?.length ?? 0;
            const sidebar = p.contributions?.sidebar?.length ?? 0;
            return (
              <tr
                key={p.id}
                className="border-neutral-100 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-800/50 border-b"
              >
                <td className="py-3 pr-4">
                  <button
                    className="text-neutral-900 hover:text-blue-600 dark:hover:text-blue-400 font-medium dark:text-white"
                    onClick={() => onSelect(p)}
                  >
                    {p.name}
                  </button>
                  {p.description && <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{p.description}</p>}
                </td>
                <td className="font-mono text-xs text-neutral-600 dark:text-neutral-400 py-3 pr-4">{p.version}</td>
                <td className="text-neutral-600 dark:text-neutral-400 py-3 pr-4">{p.author}</td>
                <td className="py-3 pr-4">
                  <div className="flex flex-wrap gap-1">
                    <span className="bg-neutral-100 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded px-1.5 py-0.5">
                      {pages} page{pages === 1 ? "" : "s"}
                    </span>
                    <span className="bg-neutral-100 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded px-1.5 py-0.5">
                      {sidebar} sidebar
                    </span>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusMeta.className}`}>
                    {statusMeta.label}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex gap-2">
                    {p.status !== "ACTIVE" && p.status !== "ARCHIVED" && (
                      <button
                        onClick={() => onActivate(p.id)}
                        className="text-xs text-green-600 dark:text-green-400 hover:underline"
                      >
                        Activate
                      </button>
                    )}
                    {p.status === "ACTIVE" && (
                      <button
                        onClick={() => onDeactivate(p.id)}
                        className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                    {p.status !== "ARCHIVED" && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remove plugin "${p.name}"?`)) onRemove(p.id);
                        }}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline"
                      >
                        {t("plugins.actions.remove")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
