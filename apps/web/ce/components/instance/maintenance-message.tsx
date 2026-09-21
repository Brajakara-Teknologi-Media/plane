/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { APP_NAME, SUPPORT_EMAIL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

export function MaintenanceMessage() {
  const { t } = useTranslation();
  const linkMap = [
    {
      key: "mail_to",
      label: "Contact support",
      value: `mailto:${SUPPORT_EMAIL}`,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <h1 className="text-left text-18 font-semibold text-primary">
          &#x1F6A7; {t("misc.maintenance.title", { app_name: APP_NAME })}
        </h1>
        <span className="text-left text-14 font-medium text-secondary">{t("misc.maintenance.description")}</span>
      </div>
      <div className="mt-1 flex items-center justify-start gap-6">
        {linkMap.map((link) => (
          <div key={link.key}>
            <a
              href={link.value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-13 text-accent-primary hover:underline"
            >
              {link.label}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
