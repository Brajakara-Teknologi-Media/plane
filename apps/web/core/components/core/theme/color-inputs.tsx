/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
// plane imports
import type { IUserTheme } from "@plane/types";
import { InputColorPicker } from "@plane/ui";
import { getHexContrastRatio, validateHexColor } from "@plane/utils";

type Props = {
  control: Control<IUserTheme>;
  onColorChange?: (values: { primary?: string; background?: string; darkPalette?: boolean }) => void;
};

// WCAG AA minimum for normal text; below this, body text becomes hard to read
// against the paired surface color.
const WCAG_AA_NORMAL_TEXT = 4.5;
// WCAG AA minimum for large text / UI components; below this we warn even
// more strongly (interactive elements become unreliable).
const WCAG_AA_LARGE_TEXT = 3.0;

export const CustomThemeColorInputs = observer(function CustomThemeColorInputs(props: Props) {
  const { control, onColorChange } = props;

  // Watch both colors so the contrast warning updates live as the user types
  // or picks a new hex. Undefined until react-hook-form finishes hydrating.
  const primary = useWatch({ control, name: "primary" });
  const background = useWatch({ control, name: "background" });

  const handleValueChange = (
    val: string | undefined,
    onChange: (...args: unknown[]) => void,
    field: "primary" | "background"
  ) => {
    let hex = val;
    // prepend a hashtag if it doesn't exist
    if (val && val[0] !== "#") hex = `#${val}`;
    onChange(hex);
    // Fire live-preview callback only when the value is a complete, valid hex.
    // Partial input (e.g. "#12") would crash palette generation.
    if (onColorChange && hex && validateHexColor(hex)) {
      onColorChange({ [field]: hex });
    }
  };

  // Compute contrast only when both colors are complete valid hex codes.
  // A partial value returns null and hides the warning until input stabilizes.
  const contrastRatio =
    primary && background && validateHexColor(primary) && validateHexColor(background)
      ? getHexContrastRatio(primary, background)
      : null;

  const contrastWarning = (() => {
    if (contrastRatio === null) return null;
    if (contrastRatio >= WCAG_AA_NORMAL_TEXT) return null;
    if (contrastRatio >= WCAG_AA_LARGE_TEXT) {
      return {
        level: "caution" as const,
        message: `Contrast ${contrastRatio.toFixed(2)}:1 passes WCAG AA for large text only (≥3:1). Body text may be hard to read.`,
      };
    }
    return {
      level: "danger" as const,
      message: `Contrast ${contrastRatio.toFixed(2)}:1 fails WCAG AA (needs ≥4.5:1). Text and UI elements will be hard to read.`,
    };
  })();

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Neutral Color */}
        <div className="flex flex-col gap-2">
          <h3 className="text-body-sm-medium">
            Neutral color<span className="text-danger-primary">*</span>
          </h3>
          <div className="w-full">
            <Controller
              control={control}
              name="background"
              rules={{
                required: "Neutral color is required",
                pattern: {
                  value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                  message: "Enter a valid hex code",
                },
              }}
              render={({ field: { value, onChange } }) => (
                <InputColorPicker
                  name="background"
                  value={value}
                  onChange={(val) => handleValueChange(val, onChange, "background")}
                  placeholder="#1a1a1a"
                  className="w-full placeholder:text-placeholder"
                  style={{
                    backgroundColor: value,
                    color: "#ffffff",
                  }}
                  hasError={false}
                />
              )}
            />
          </div>
        </div>
        {/* Brand Color */}
        <div className="flex flex-col gap-2">
          <h3 className="text-body-sm-medium">
            Brand color<span className="text-danger-primary">*</span>
          </h3>
          <div className="w-full">
            <Controller
              control={control}
              name="primary"
              rules={{
                required: "Brand color is required",
                pattern: {
                  value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                  message: "Enter a valid hex code",
                },
              }}
              render={({ field: { value, onChange } }) => (
                <InputColorPicker
                  name="primary"
                  value={value}
                  onChange={(val) => handleValueChange(val, onChange, "primary")}
                  placeholder="#3f76ff"
                  className="w-full placeholder:text-placeholder"
                  style={{
                    backgroundColor: value,
                    color: "#ffffff",
                  }}
                  hasError={false}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Accessibility warning shown only when the chosen pair fails WCAG.
          `caution` = between AA-large and AA-normal; `danger` = below AA-large. */}
      {contrastWarning && (
        <div
          className={
            contrastWarning.level === "danger"
              ? "rounded-md border border-danger-primary/40 bg-danger-primary/10 px-3 py-2 text-xs text-danger-primary"
              : "rounded-md border border-warning-primary/40 bg-warning-primary/10 px-3 py-2 text-xs text-warning-primary"
          }
          role="alert"
        >
          {contrastWarning.message}
        </div>
      )}
    </div>
  );
});
