/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useForm, useWatch } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IUserTheme } from "@plane/types";
import { applyCustomTheme, validateHexColor } from "@plane/utils";
// components
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
// hooks
import { useUserProfile } from "@/hooks/store/user";
// local imports
import { CustomThemeColorInputs } from "./color-inputs";
import { CustomThemeDownloadConfigButton } from "./download-config-button";
import { CustomThemeImportConfigButton } from "./import-config-button";
import { CustomThemeModeSelector } from "./theme-mode-selector";

// Debounce for live preview: long enough to avoid thrashing OKLCH palette
// generation on every keystroke, short enough to feel responsive.
const LIVE_PREVIEW_DEBOUNCE_MS = 250;

export const CustomThemeSelector = observer(function CustomThemeSelector() {
  // store hooks
  const { data: userProfile, updateUserTheme } = useUserProfile();
  // translation
  const { t } = useTranslation();

  // Loading state for async palette generation
  const [isLoadingPalette, setIsLoadingPalette] = useState(false);
  // Marks whether the user actually saved during this session. If they leave
  // without saving, we restore the saved theme so live-preview never persists.
  const savedDuringSessionRef = useRef(false);

  // Load saved theme from userProfile (fallback to defaults)
  const savedTheme = useMemo((): IUserTheme => {
    const theme = userProfile?.theme;
    if (theme && theme.primary && theme.background) {
      return {
        theme: "custom",
        primary: theme.primary,
        background: theme.background,
        darkPalette: !!theme.darkPalette,
      };
    }

    // Fallback to defaults
    return {
      theme: "custom",
      primary: "#3f76ff",
      background: "#1a1a1a",
      darkPalette: false,
    };
  }, [userProfile?.theme]);

  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    getValues,
    setValue,
  } = useForm<IUserTheme>({
    defaultValues: savedTheme,
  });

  // Watched form values drive the live preview. useWatch re-renders this
  // component (and its debounce effect) whenever any of the three change.
  const watchedPrimary = useWatch({ control, name: "primary" });
  const watchedBackground = useWatch({ control, name: "background" });
  const watchedDarkPalette = useWatch({ control, name: "darkPalette" });

  // Live preview: debounce-apply the palette on every valid change so the user
  // sees the new theme immediately without hitting "Set theme". If the user
  // leaves the page without saving, the cleanup below reverts to `savedTheme`.
  useEffect(() => {
    if (!watchedPrimary || !watchedBackground) return;
    if (!validateHexColor(watchedPrimary) || !validateHexColor(watchedBackground)) return;
    // Skip preview when the current form state already matches the saved
    // theme: avoids a redundant CSS write on mount and after successful save.
    if (
      watchedPrimary === savedTheme.primary &&
      watchedBackground === savedTheme.background &&
      !!watchedDarkPalette === !!savedTheme.darkPalette
    ) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      applyCustomTheme(watchedPrimary, watchedBackground, watchedDarkPalette ? "dark" : "light");
    }, LIVE_PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [watchedPrimary, watchedBackground, watchedDarkPalette, savedTheme]);

  // On unmount, if the user previewed but never saved, restore the persisted
  // theme so the preview does not bleed into the rest of the app.
  useEffect(
    () => () => {
      if (savedDuringSessionRef.current) return;
      if (!savedTheme.primary || !savedTheme.background) return;
      applyCustomTheme(savedTheme.primary, savedTheme.background, savedTheme.darkPalette ? "dark" : "light");
    },
    [savedTheme]
  );

  const handleUpdateTheme = async (formData: IUserTheme) => {
    if (!formData.primary || !formData.background) return;

    try {
      setIsLoadingPalette(true);
      applyCustomTheme(formData.primary, formData.background, formData.darkPalette ? "dark" : "light");
      // Save to profile endpoint
      await updateUserTheme({
        theme: "custom",
        primary: formData.primary,
        background: formData.background,
        darkPalette: formData.darkPalette,
      });
      // Mark saved so the unmount cleanup skips restoring the previous theme.
      savedDuringSessionRef.current = true;

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("success"),
        message: "Reloading to apply changes...",
      });
      // reload the page after showing the toast
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Failed to apply theme:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("failed_to_update_the_theme"),
      });
    } finally {
      setIsLoadingPalette(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(handleUpdateTheme)(e);
      }}
      className="rounded-lg border border-subtle bg-layer-1 px-4 py-3"
    >
      <div className="space-y-5">
        <ProfileSettingsHeading
          title={t("customize_your_theme")}
          control={<CustomThemeImportConfigButton handleUpdateTheme={handleUpdateTheme} setValue={setValue} />}
        />
        <CustomThemeModeSelector control={control} />
        {/* Color Inputs */}
        <CustomThemeColorInputs control={control} />
      </div>
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Save Theme Button */}
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting || isLoadingPalette}>
          {isSubmitting ? t("common.saving") : isLoadingPalette ? "Generating" : t("set_theme")}
        </Button>
        {/* Import/Export Section */}
        <CustomThemeDownloadConfigButton getValues={getValues} />
      </div>
    </form>
  );
});
