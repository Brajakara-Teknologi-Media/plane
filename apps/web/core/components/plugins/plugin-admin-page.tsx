"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { usePlugins } from "@/hooks/use-plugins";
import { useCanManageExtensions } from "@/hooks/use-extensions-access";
import { PluginList } from "./plugin-list";
import { PluginUploadModal } from "./plugin-upload-modal";
import { PluginDetailPanel } from "./plugin-detail-panel";
import type { IPlugin } from "@/services/plugin.service";
import { SelectPesquisavel } from "@/components/common/select-pesquisavel";

export const PluginAdminPage: React.FC = observer(() => {
  const canManage = useCanManageExtensions();
  const {
    plugins,
    isLoading,
    isUploading,
    error,
    uploadPlugin,
    activatePlugin,
    deactivatePlugin,
    removePlugin,
    refetch,
  } = usePlugins();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<IPlugin | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = plugins.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!canManage) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 mx-auto max-w-6xl px-4 py-16 text-center">
        You do not have permission to manage plugins. Only instance administrators or users in the IT group can do so.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-neutral-900 font-bold dark:text-white">Plugins</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Plugins extend the application with sidebar items and full pages. Manage plugins that are dynamically loaded
            for this instance.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="bg-blue-600 text-sm hover:bg-blue-700 rounded-lg px-4 py-2 font-medium text-white"
        >
          + Upload Plugin
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 mb-4 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="mb-4 flex gap-3">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border-neutral-200 text-sm focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-800 rounded-lg border px-3 py-2 outline-none focus:ring-2 dark:text-white"
        />
        <SelectPesquisavel
          value={statusFilter}
          onChange={setStatusFilter}
          opcoes={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "PENDING_APPROVAL", label: "Pending" },
            { value: "ARCHIVED", label: "Archived" },
          ]}
          opcaoVazia={{ value: "", label: "All statuses" }}
          className="w-44"
        />
        <button
          onClick={refetch}
          className="border-neutral-200 text-sm text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-lg border px-3 py-2"
        >
          Refresh
        </button>
      </div>

      <div className="border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900 rounded-xl border bg-white p-4">
        <PluginList
          plugins={filtered}
          isLoading={isLoading}
          onActivate={activatePlugin}
          onDeactivate={deactivatePlugin}
          onRemove={removePlugin}
          onSelect={setSelectedPlugin}
        />
      </div>

      <PluginUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={uploadPlugin}
        isUploading={isUploading}
      />

      {selectedPlugin && <PluginDetailPanel plugin={selectedPlugin} onClose={() => setSelectedPlugin(null)} />}
    </div>
  );
});
