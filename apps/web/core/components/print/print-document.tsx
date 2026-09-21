/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { PrintFooter } from "./print-footer";
import { PrintHeader, type TPrintMetaItem } from "./print-header";

type Props = {
  title: string;
  subtitle?: string | null;
  meta?: TPrintMetaItem[];
  children: React.ReactNode;
  className?: string;
};

/**
 * Print-ready document. It is mounted in a portal that is a direct child of
 * <body> (hidden on screen) so that, when printing, the browser paginates the
 * content normally without inheriting `overflow`/fixed heights from the app layout.
 *
 * Use together with `usePrint().print()` in the default mode (`document`).
 */
export const PrintDocument = function PrintDocument(props: Props) {
  const { title, subtitle, meta, children, className } = props;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={cn("print-document-root bg-white p-0 font-sans text-xs text-neutral-900", className)}>
      <PrintHeader title={title} subtitle={subtitle} meta={meta} />
      <main>{children}</main>
      <PrintFooter />
    </div>,
    document.body
  );
};
