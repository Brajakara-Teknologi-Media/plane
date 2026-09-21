"use client";

import React, { useRef, useState } from "react";
import { useTranslation } from "@plane/i18n";

interface WidgetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export const WidgetUploadModal: React.FC<WidgetUploadModalProps> = ({ isOpen, onClose, onUpload, isUploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".zip")) {
      setError("Only .zip files are accepted.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile);
      setSelectedFile(null);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Upload failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="shadow-xl dark:bg-neutral-900 w-full max-w-md rounded-xl bg-white p-6">
        <h2 className="text-lg text-neutral-900 mb-4 font-semibold dark:text-white">Upload Widget</h2>

        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            dragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-neutral-300 hover:border-blue-400 dark:border-neutral-600"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="text-3xl text-neutral-400">📦</div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            {selectedFile ? selectedFile.name : "Drag and drop widget.zip or click to browse"}
          </p>
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              setSelectedFile(null);
              setError(null);
              onClose();
            }}
            className="text-sm text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 rounded-lg px-4 py-2"
            disabled={isUploading}
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="bg-blue-600 text-sm hover:bg-blue-700 rounded-lg px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {isUploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};
