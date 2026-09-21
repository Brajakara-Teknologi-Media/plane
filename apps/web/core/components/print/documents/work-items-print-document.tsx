/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
// local imports
import { PrintDocument } from "../print-document";
import type { TPrintMetaItem } from "../print-header";
import { PrintIssuesTable } from "../print-issues-table";

type Props = {
  title: string;
  subtitle?: string | null;
  meta?: TPrintMetaItem[];
  issues: TIssue[];
  showProject?: boolean;
};

/**
 * Print document for any work item list (list, table, cycle, module, view).
 * Receives only the work items already filtered by the screen.
 */
export const WorkItemsPrintDocument = observer(function WorkItemsPrintDocument(props: Props) {
  const { title, subtitle, meta, issues, showProject = true } = props;
  const { t } = useTranslation();

  return (
    <PrintDocument
      title={title}
      subtitle={subtitle}
      meta={[
        ...(meta ?? []),
        { label: t("print.labels.total"), value: t("print.counts.tickets", { count: issues.length }) },
      ]}
    >
      <PrintIssuesTable issues={issues} showProject={showProject} />
    </PrintDocument>
  );
});
