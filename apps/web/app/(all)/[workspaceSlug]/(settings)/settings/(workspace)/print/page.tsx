/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, MAX_FILE_SIZE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EFileAssetType, type TWorkspacePrintSettings } from "@plane/types";
import { Input, ToggleSwitch } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { PRINT_SETTINGS_DEFAULTS, usePrintSettings } from "@/components/print";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// services
import { FileService } from "@/services/file.service";
import { WorkspaceService } from "@/services/workspace.service";
// local imports
import { PrintWorkspaceSettingsHeader } from "./header";

const workspaceService = new WorkspaceService();
const fileService = new FileService();

function PrintSettingsPage() {
  const { workspaceSlug } = useParams();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const { printSettings, isLoading, mutate } = usePrintSettings(workspaceSlug?.toString());

  const E = "workspace_settings.settings.print";

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<TWorkspacePrintSettings>(PRINT_SETTINGS_DEFAULTS);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  useEffect(() => setForm(printSettings), [printSettings]);

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t(`${E}.title`)}` : undefined;

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const set = <K extends keyof TWorkspacePrintSettings>(key: K, value: TWorkspacePrintSettings[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const persist = async (payload: Partial<TWorkspacePrintSettings>) => {
    if (!workspaceSlug) return;
    const updated = await workspaceService.updatePrintSettings(workspaceSlug.toString(), payload);
    await mutate(updated, { revalidate: false });
    return updated;
  };

  const handleLogoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !workspaceSlug || !currentWorkspace) return;
    if (file.size > MAX_FILE_SIZE) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.too_big`) });
      return;
    }

    setIsUploading(true);
    try {
      const { asset_id } = await fileService.uploadWorkspaceAsset(
        workspaceSlug.toString(),
        { entity_identifier: currentWorkspace.id, entity_type: EFileAssetType.WORKSPACE_LOGO },
        file
      );
      await persist({ logo_asset: asset_id });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t(`${E}.toasts.upload_success`) });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.upload_error`) });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await persist({ logo_asset: null, logo_url: null });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t(`${E}.toasts.remove_success`) });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.remove_error`) });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await persist({
        header_text: form.header_text,
        footer_text: form.footer_text,
        show_generated_at: form.show_generated_at,
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t(`${E}.toasts.success`) });
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.detail || t("error") });
    } finally {
      setIsSaving(false);
    }
  };

  const logoUrl = printSettings.logo_url ? getFileURL(printSettings.logo_url) : undefined;
  const headerPreview = form.header_text || currentWorkspace?.name || "";

  return (
    <SettingsContentWrapper header={<PrintWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SettingsHeading title={t(`${E}.title`)} description={t(`${E}.description`)} />

      {isLoading ? (
        <div className="text-sm py-6 text-secondary">{t("loading")}</div>
      ) : (
        <div className="flex max-w-2xl flex-col gap-6 py-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-secondary">{t(`${E}.logo_label`)}</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-40 items-center justify-center rounded-md border border-subtle bg-surface-2 p-2">
                {logoUrl ? (
                  <img src={logoUrl} alt={t(`${E}.logo_label`)} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-13 text-tertiary">{t(`${E}.logo_empty`)}</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoSelected}
                />
                <Button
                  variant="secondary"
                  size="lg"
                  loading={isUploading}
                  prependIcon={<Upload />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoUrl ? t(`${E}.logo_change`) : t(`${E}.logo_upload`)}
                </Button>
                {logoUrl && (
                  <Button variant="error-outline" size="lg" prependIcon={<Trash2 />} onClick={handleRemoveLogo}>
                    {t(`${E}.logo_remove`)}
                  </Button>
                )}
              </div>
            </div>
            <p className="text-13 text-secondary">{t(`${E}.logo_hint`)}</p>
          </div>

          <div>
            <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.header_label`)}</label>
            <Input
              type="text"
              value={form.header_text ?? ""}
              onChange={(e) => set("header_text", e.target.value)}
              placeholder={currentWorkspace?.name ?? t(`${E}.header_placeholder`)}
              className="w-full"
            />
            <p className="mt-1 text-13 text-secondary">{t(`${E}.header_hint`)}</p>
          </div>

          <div>
            <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.footer_label`)}</label>
            <Input
              type="text"
              value={form.footer_text ?? ""}
              onChange={(e) => set("footer_text", e.target.value)}
              placeholder={t(`${E}.footer_placeholder`)}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-subtle p-3">
            <div>
              <p className="text-sm font-medium text-primary">{t(`${E}.show_date_label`)}</p>
              <p className="text-13 text-secondary">{t(`${E}.show_date_desc`)}</p>
            </div>
            <ToggleSwitch
              value={form.show_generated_at}
              onChange={(value: boolean) => set("show_generated_at", value)}
            />
          </div>

          <div className="rounded-md border border-subtle bg-surface-2 p-4">
            <p className="mb-3 text-13 font-medium text-secondary">{t(`${E}.preview_label`)}</p>
            <div className="text-neutral-900 rounded-sm bg-white p-4">
              <div className="border-neutral-300 flex items-start justify-between gap-4 border-b pb-3">
                <div className="flex items-start gap-3">
                  {logoUrl && <img src={logoUrl} alt="" className="h-12 max-w-[180px] object-contain" />}
                  <div className="flex flex-col gap-0.5">
                    {headerPreview && <p className="text-sm font-semibold">{headerPreview}</p>}
                    <p className="text-lg leading-tight font-bold">Chamado ABC-123</p>
                    <p className="text-xs">Exemplo de documento impresso</p>
                  </div>
                </div>
                {form.show_generated_at && (
                  <p className="shrink-0 text-right text-[10px]">Generated at {new Date().toLocaleString("pt-BR")}</p>
                )}
              </div>
              {form.footer_text && (
                <p className="border-neutral-300 mt-6 border-t pt-2 text-[10px]">{form.footer_text}</p>
              )}
            </div>
          </div>

          <div>
            <Button variant="primary" size="lg" onClick={handleSave} loading={isSaving}>
              {isSaving ? t(`${E}.saving`) : t(`${E}.save`)}
            </Button>
          </div>
        </div>
      )}
    </SettingsContentWrapper>
  );
}

export default observer(PrintSettingsPage);
