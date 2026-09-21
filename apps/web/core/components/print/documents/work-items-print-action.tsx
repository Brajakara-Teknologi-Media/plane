/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { EIssuesStoreType } from "@plane/types";
// local imports
import { PrintButton } from "../print-button";
import type { TPrintMetaItem } from "../print-header";
import { usePrintableIssues } from "../use-printable-issues";
import { WorkItemsPrintDocument } from "./work-items-print-document";

type Props = {
  storeType: EIssuesStoreType;
  title: string;
  subtitle?: string | null;
  meta?: TPrintMetaItem[];
  showProject?: boolean;
};

/**
 * "Print" button + document for any work item list. The work items come from
 * the layout's own store, so they respect the screen's filters.
 */
export const WorkItemsPrintAction = observer(function WorkItemsPrintAction(props: Props) {
  const { storeType, title, subtitle, meta, showProject = true } = props;
  const issues = usePrintableIssues(storeType);
  const { workspaceSlug, projectId } = useParams();

  return (
    <>
      {/* LGPD: printing a list is access to the displayed data set. */}
      <PrintButton
        documentTitle={title}
        auditEntity="issue"
        auditEntityId={projectId?.toString() ?? workspaceSlug?.toString() ?? ""}
        auditMetadata={{ escopo: "listagem", store: storeType, total: issues.length }}
      />
      <WorkItemsPrintDocument
        title={title}
        subtitle={subtitle}
        meta={meta}
        issues={issues}
        showProject={showProject}
      />
    </>
  );
});
