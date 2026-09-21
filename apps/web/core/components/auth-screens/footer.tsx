/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Authentication screens footer.
 *
 * The original version featured social proof from Plane (Zerodha, Sony, Dolby,
 * Accenture) and "over 10,000 teams" — clients and numbers that are not ours.
 * Only the product signature remains.
 */
export function AuthFooter() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-13 text-tertiary">Avião · Ticket management and support</span>
    </div>
  );
}
