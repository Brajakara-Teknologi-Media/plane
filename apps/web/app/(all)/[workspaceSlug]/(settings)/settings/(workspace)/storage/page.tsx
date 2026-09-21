/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input, ToggleSwitch } from "@plane/ui";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// services
import { WorkspaceService } from "@/services/workspace.service";
// local imports
import { StorageWorkspaceSettingsHeader } from "./header";

const workspaceService = new WorkspaceService();

type FormState = {
  useS3: boolean;
  endpoint: string;
  region: string;
  bucket: string;
  access_key: string;
  secret_key: string;
};

const EMPTY: FormState = { useS3: false, endpoint: "", region: "", bucket: "", access_key: "", secret_key: "" };

function StoragePage() {
  const { workspaceSlug } = useParams();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const E = "workspace_settings.settings.storage";

  const [form, setForm] = useState<FormState>(EMPTY);
  const [hasSecret, setHasSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const { data, isLoading, mutate } = useSWR(
    workspaceSlug && isAdmin ? `STORAGE_CONFIG_${workspaceSlug}` : null,
    workspaceSlug && isAdmin ? () => workspaceService.getStorageConfig(workspaceSlug.toString()) : null
  );

  useEffect(() => {
    if (!data) return;
    setForm({
      useS3: data.provider === "s3",
      endpoint: data.endpoint ?? "",
      region: data.region ?? "",
      bucket: data.bucket ?? "",
      access_key: data.access_key ?? "",
      secret_key: "",
    });
    setHasSecret(data.has_secret_key);
  }, [data]);

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t(`${E}.title`)}` : undefined;

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  const set = (key: keyof FormState, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!workspaceSlug) return;
    if (form.useS3) {
      if (!form.endpoint.trim() || !form.bucket.trim() || !form.access_key.trim()) {
        setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.error_fields`) });
        return;
      }
      if (!form.secret_key.trim() && !hasSecret) {
        setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.error_secret`) });
        return;
      }
    }
    setIsSaving(true);
    try {
      await workspaceService.updateStorageConfig(workspaceSlug.toString(), {
        provider: form.useS3 ? "s3" : "local",
        endpoint: form.endpoint.trim(),
        region: form.region.trim(),
        bucket: form.bucket.trim(),
        access_key: form.access_key.trim(),
        ...(form.secret_key.trim() ? { secret_key: form.secret_key.trim() } : {}),
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t(`${E}.toasts.success`) });
      setForm((f) => ({ ...f, secret_key: "" }));
      await mutate();
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.detail || t("error") });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SettingsContentWrapper header={<StorageWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SettingsHeading title={t(`${E}.title`)} description={t(`${E}.description`)} />

      {isLoading ? (
        <div className="text-sm py-6 text-secondary">{t(`${E}.loading`)}</div>
      ) : (
        <div className="flex max-w-2xl flex-col gap-5 py-2">
          <div className="flex items-center justify-between rounded-md border border-subtle p-3">
            <div>
              <p className="text-sm font-medium text-primary">{t(`${E}.use_s3`)}</p>
              <p className="text-13 text-secondary">{t(`${E}.use_s3_desc`)}</p>
            </div>
            <ToggleSwitch value={form.useS3} onChange={(v: boolean) => set("useS3", v)} />
          </div>

          {form.useS3 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.endpoint`)}</label>
                <Input
                  type="text"
                  value={form.endpoint}
                  onChange={(e) => set("endpoint", e.target.value)}
                  placeholder="https://br-se1.magaluobjects.com"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.region`)}</label>
                <Input
                  type="text"
                  value={form.region}
                  onChange={(e) => set("region", e.target.value)}
                  placeholder="br-se1"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.bucket`)}</label>
                <Input
                  type="text"
                  value={form.bucket}
                  onChange={(e) => set("bucket", e.target.value)}
                  placeholder="meu-bucket"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.access_key`)}</label>
                <Input
                  type="text"
                  value={form.access_key}
                  onChange={(e) => set("access_key", e.target.value)}
                  placeholder="Access key / API key"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.secret_key`)}</label>
                <Input
                  type="password"
                  value={form.secret_key}
                  onChange={(e) => set("secret_key", e.target.value)}
                  placeholder={hasSecret ? "•••••••• (keep current if empty)" : "Secret key"}
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div>
            <Button variant="primary" size="sm" onClick={handleSave} loading={isSaving}>
              {isSaving ? t(`${E}.saving`) : t(`${E}.save`)}
            </Button>
          </div>
        </div>
      )}
    </SettingsContentWrapper>
  );
}

export default observer(StoragePage);
