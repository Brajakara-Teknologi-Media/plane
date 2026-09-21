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
import { ChatService } from "@/services/chat.service";
// local imports
import { ChatWorkspaceSettingsHeader } from "./header";

const chatService = new ChatService();

function ChatSettingsPage() {
  const { workspaceSlug } = useParams();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const E = "workspace_settings.settings.chat";

  const [enabled, setEnabled] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [wsUrl, setWsUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const { data, isLoading, mutate } = useSWR(
    workspaceSlug && isAdmin ? `CHAT_CONFIG_${workspaceSlug}` : null,
    workspaceSlug && isAdmin ? () => chatService.getConfig(workspaceSlug.toString()) : null
  );

  useEffect(() => {
    if (!data) return;
    setEnabled(data.enabled);
    setApiUrl(data.api_url);
    setWsUrl(data.ws_url);
  }, [data]);

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t(`${E}.title`)}` : undefined;

  if (workspaceUserInfo && !isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const handleSave = async () => {
    if (!workspaceSlug) return;
    if (enabled && (!apiUrl.trim() || !wsUrl.trim())) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.error_urls`) });
      return;
    }
    setSaving(true);
    try {
      await chatService.updateConfig(workspaceSlug.toString(), {
        enabled,
        api_url: apiUrl.trim(),
        ws_url: wsUrl.trim(),
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t(`${E}.toasts.success`) });
      await mutate();
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: error?.detail || t("error") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsContentWrapper header={<ChatWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SettingsHeading title={t(`${E}.title`)} description={t(`${E}.description`)} />
      {isLoading ? (
        <div className="text-sm py-6 text-secondary">{t("loading")}</div>
      ) : (
        <div className="flex max-w-2xl flex-col gap-5 py-2">
          <div className="flex items-center justify-between rounded-md border border-subtle p-3">
            <div>
              <p className="text-sm font-medium text-primary">{t(`${E}.enabled`)}</p>
              <p className="text-13 text-secondary">{t(`${E}.enabled_desc`)}</p>
            </div>
            <ToggleSwitch value={enabled} onChange={setEnabled} />
          </div>
          <div>
            <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.api_url`)}</label>
            <Input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost/chat-api"
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm mb-1 block font-medium text-secondary">{t(`${E}.ws_url`)}</label>
            <Input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              placeholder="ws://localhost/chat-ws"
              className="w-full"
            />
          </div>
          <div>
            <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
              {saving ? t(`${E}.saving`) : t(`${E}.save`)}
            </Button>
          </div>
        </div>
      )}
    </SettingsContentWrapper>
  );
}

export default observer(ChatSettingsPage);
