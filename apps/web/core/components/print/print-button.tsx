/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Printer } from "lucide-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { useAuditRecorder } from "@/hooks/use-audit-logs";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { usePrint, type TPrintMode } from "./use-print";

type Props = {
  /** Print strategy — see styles/print.css. */
  mode?: TPrintMode;
  /** Suggested name for the PDF file. */
  documentTitle?: string;
  /** `icon` for toolbars, `label` when there is room for text. */
  appearance?: "icon" | "label";
  size?: "sm" | "base" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
  onBeforePrint?: () => void;
  /**
   * Type and id of what is being printed. Printing is access to personal data and
   * must appear in the LGPD audit trail — registering it here, on the button,
   * guarantees no screen forgets to do it.
   */
  auditEntity?: string;
  auditEntityId?: string;
  auditMetadata?: Record<string, unknown>;
};

/** Reusable "Print" button — opens the browser's print dialog. */
export const PrintButton = function PrintButton(props: Props) {
  const {
    mode = "document",
    documentTitle,
    appearance = "icon",
    size = "lg",
    className,
    disabled = false,
    onBeforePrint,
    auditEntity,
    auditEntityId,
    auditMetadata,
  } = props;
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const { print } = usePrint();
  const { workspaceSlug } = useParams();
  const recordAudit = useAuditRecorder(workspaceSlug?.toString());

  const label = t("common.actions.print");

  const handleClick = () => {
    onBeforePrint?.();
    if (auditEntity && auditEntityId) {
      recordAudit("print", auditEntity, auditEntityId, { titulo: documentTitle, ...auditMetadata });
    }
    print({ mode, documentTitle });
  };

  if (appearance === "label") {
    return (
      <Button
        variant="secondary"
        size="lg"
        onClick={handleClick}
        disabled={disabled}
        className={className}
        prependIcon={<Printer />}
      >
        {label}
      </Button>
    );
  }

  return (
    <Tooltip tooltipContent={label} isMobile={isMobile}>
      <IconButton
        variant="secondary"
        size={size}
        icon={Printer}
        onClick={handleClick}
        disabled={disabled}
        className={className}
        aria-label={label}
      />
    </Tooltip>
  );
};
