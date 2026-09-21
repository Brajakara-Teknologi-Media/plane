/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { copyUrlToClipboard } from "@plane/utils";
import type { TNavigationItem } from "@/components/navigation/tab-navigation-root";

type UseProjectActionsProps = {
  workspaceSlug: string;
  projectId: string;
  activeItem?: TNavigationItem;
};

export const useProjectActions = ({ workspaceSlug, projectId, activeItem }: UseProjectActionsProps) => {
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const { t } = useTranslation();
  const [leaveProjectModalOpen, setLeaveProjectModalOpen] = useState(false);

  const handleLeaveProject = useCallback(() => {
    setLeaveProjectModalOpen(true);
  }, []);

  const handleCopyText = useCallback(async () => {
    const pathToCopy = activeItem?.href ?? `/${workspaceSlug}/projects/${projectId}/issues`;

    try {
      await copyUrlToClipboard(pathToCopy);
      setToast({
        type: TOAST_TYPE.INFO,
        title: t("common.link_copied"),
        message: "Project link copied to clipboard.",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.failed_to_copy_link"),
        message: "Could not copy link. Please try again.",
      });
    }
  }, [activeItem, projectId, workspaceSlug, t]);

  const handlePublishModal = useCallback((open: boolean) => {
    setPublishModalOpen(open);
  }, []);

  const handleLeaveProjectModal = useCallback((open: boolean) => {
    setLeaveProjectModalOpen(open);
  }, []);

  return {
    publishModalOpen,
    leaveProjectModalOpen,
    handleLeaveProject,
    handleCopyText,
    handlePublishModal,
    handleLeaveProjectModal,
  };
};
