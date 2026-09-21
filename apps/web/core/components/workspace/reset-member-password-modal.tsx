/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { KeyRound } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

export type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  userDetails: {
    id: string;
    display_name: string;
  };
};

const DEFAULT_PASSWORD = "teste";

export const ResetMemberPasswordModal = observer(function ResetMemberPasswordModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, userDetails } = props;
  // states
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // plane hooks
  const { t } = useTranslation();

  const handleClose = () => {
    onClose();
    setPassword(DEFAULT_PASSWORD);
    setIsSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!workspaceSlug || !userDetails.id) return;
    if (password.trim().length < 4) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.toast.error"), message: "Password must be at least 4 characters." });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await workspaceService.resetWorkspaceMemberPassword(workspaceSlug, userDetails.id, password.trim());
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.password_reset"),
        message: t("common.new_password_for", { user: userDetails.display_name, password: res.password }),
      });
      handleClose();
    } catch (err: unknown) {
      const error = err as { detail?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("common.toast.error"),
        message: error?.detail || "Could not reset password. Please try again.",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-layer-2">
            <KeyRound className="size-5 text-secondary" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-h5-medium text-primary">{t("common.reset_password")}</h3>
            <p className="text-sm mt-1 text-secondary">
              Set a new password for <span className="font-medium">{userDetails.display_name}</span>. Inform the user;
              they can change it later in their account settings.
            </p>
            <div className="mt-4">
              <label className="text-sm mb-1 block font-medium text-secondary" htmlFor="reset-password-input">
                {t("common.new_password")}
              </label>
              <Input
                id="reset-password-input"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("common.new_password")}
                className="w-full"
                autoFocus
              />
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={isSubmitting}>
            {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
