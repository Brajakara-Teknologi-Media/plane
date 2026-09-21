/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import Link from "next/link";
import { GOD_MODE_URL } from "@plane/constants";
import AviaoLockup from "@/app/assets/logos/aviao-horizontal.svg?url";
// assets
import AviaoMark from "@/app/assets/logos/aviao-mark.svg?url";
import DefaultLayout from "@/layouts/default-layout";
import { Button } from "@plane/propel/button";

export function InstanceNotReady() {
  const { t } = useTranslation();
  return (
    <DefaultLayout>
      <div className="relative z-10 flex h-screen w-screen overflow-hidden">
        {/* Background decorations */}
        <img
          src={AviaoMark}
          className="pointer-events-none absolute -top-24 -left-32 h-56 w-96 object-contain opacity-15"
          alt=""
          aria-hidden="true"
        />
        <img
          src={AviaoMark}
          className="pointer-events-none absolute -right-20 -bottom-16 h-56 w-96 object-contain opacity-15"
          alt=""
          aria-hidden="true"
        />
        {/* Main content */}
        <div className="flex h-full w-full flex-col items-center px-8 pt-6 pb-10">
          <div className="sticky top-0 flex w-full shrink-0 items-center justify-between gap-6">
            <img src={AviaoLockup} alt="Avião" className="h-5 w-auto" />
          </div>
          <div className="flex h-full w-full flex-col items-center justify-center gap-7">
            <div className="flex flex-col items-center gap-11">
              <img src={AviaoMark} className="h-24 w-40 object-contain" alt={t("common.logo_alt")} />
              <div className="flex max-w-124 flex-col items-center gap-3">
                <h1 className="text-h2-semibold text-primary">Welcome to Avião</h1>
                <p className="text-center text-body-md-regular text-secondary">
                  Configure your instance and create your first workspace to start managing projects and tasks.
                </p>
              </div>
            </div>
            <a href={GOD_MODE_URL} className="w-72">
              <Button variant="primary" className="w-full" size="xl">
                {t("common.get_started")}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
