"use client";

import { useWidgets } from "@/hooks/use-widgets";
import { useCanManageExtensions } from "@/hooks/use-extensions-access";
import type { IWidget } from "@/services/widget.service";
import { observer } from "mobx-react";
import React, { useState } from "react";
import { WidgetDetailPanel } from "./widget-detail-panel";
import { WidgetList } from "./widget-list";
import { WidgetUploadModal } from "./widget-upload-modal";
import { SelectPesquisavel } from "@/components/common/select-pesquisavel";

export const WidgetAdminPage: React.FC = observer(() => {
  const canManage = useCanManageExtensions();
  const {
    widgets,
    isLoading,
    isUploading,
    error,
    uploadWidget,
    activateWidget,
    deactivateWidget,
    removeWidget,
    refetch,
  } = useWidgets();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<IWidget | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filtered = widgets.filter((w) => {
    const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (!canManage) {
    return (
      <div className="text-sm text-neutral-500 dark:text-neutral-400 mx-auto max-w-6xl px-4 py-16 text-center">
        You do not have permission to manage widgets. Only instance administrators or users in the IT group can.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-neutral-900 font-bold dark:text-white">Widget Marketplace</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Manage dynamically loaded widgets for this platform instance.
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="bg-blue-600 text-sm hover:bg-blue-700 rounded-lg px-4 py-2 font-medium text-white"
        >
          + Upload Widget
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
        <WidgetList
          widgets={filtered}
          isLoading={isLoading}
          onActivate={activateWidget}
          onDeactivate={deactivateWidget}
          onRemove={removeWidget}
          onSelect={setSelectedWidget}
        />
      </div>

      <WidgetUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={async (file) => {
          await uploadWidget(file);
        }}
        isUploading={isUploading}
      />

      {selectedWidget && <WidgetDetailPanel widget={selectedWidget} onClose={() => setSelectedWidget(null)} />}
    </div>
  );
});
