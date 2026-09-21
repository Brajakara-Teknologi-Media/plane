/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { useTranslation } from "@plane/i18n";

type PageHeadTitleProps = {
  title?: string;
  description?: string;
};

export function PageHead(props: PageHeadTitleProps) {
  const { title } = props;
  const { t } = useTranslation();

  useEffect(() => {
    if (title) {
      document.title = title ?? t("work-item.page_title_default");
    }
  }, [title, t]);

  return null;
}
