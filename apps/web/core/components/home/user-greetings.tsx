/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane types
import { useTranslation } from "@plane/i18n";
import type { IUser } from "@plane/types";
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

export interface IUserGreetingsView {
  user: IUser;
  /** Short phrase with the state of the day, next to the date. */
  resumo?: string;
}

/**
 * Top banner greeting for the home page.
 *
 * Left-aligned, along with the rest of the content: centering it in the middle of a
 * wide screen would push the content down and make the page look empty.
 */
export function UserGreetingsView(props: IUserGreetingsView) {
  const { user, resumo } = props;
  const { currentTime } = useCurrentTime();
  const { t } = useTranslation();

  const hora = currentTime.getHours();
  const periodo = hora < 12 ? "morning" : hora < 18 ? "afternoon" : "evening";
  const emoji = periodo === "morning" ? "🌤️" : periodo === "afternoon" ? "🌥️" : "🌙";

  const dataLonga = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(currentTime);

  const horaTexto = new Intl.DateTimeFormat("en-US", {
    timeZone: user?.user_timezone || undefined,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const nome = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.display_name;

  return (
    <div className="flex flex-col gap-0.5">
      {/* The greeting comes entirely from i18n: concatenating "Good" + "afternoon"
          would work in English, but fails in gendered languages like Portuguese. */}
      <h1 className="text-24 font-semibold text-primary">
        {t(`greeting_${periodo}`)}, {nome}
      </h1>
      <p className="flex flex-wrap items-center gap-x-2 text-13 text-secondary">
        <span aria-hidden>{emoji}</span>
        <span className="first-letter:uppercase">{dataLonga}</span>
        <span className="text-tertiary">·</span>
        <span>{horaTexto}</span>
        {resumo && (
          <>
            <span className="text-tertiary">·</span>
            <span className="text-primary">{resumo}</span>
          </>
        )}
      </p>
    </div>
  );
}
