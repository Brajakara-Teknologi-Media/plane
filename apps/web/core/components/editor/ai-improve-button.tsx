"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
import { AIService } from "@/services/ai.service";
import { useParams } from "next/navigation";

const aiService = new AIService();

export type AiContext = {
  /** Work item / issue title */
  issue_title?: string;
  /** Project / system name */
  project_name?: string;
  /** Current state / status label (e.g. "Em progresso") */
  status?: string;
  /** Priority label (e.g. "Alta") */
  priority?: string;
  /** Assignee display names */
  assignees?: string[];
  /**
   * Previous comments on the work item, stripped of HTML, most recent first.
   * The backend limits these to stay within the token budget.
   */
  previous_comments?: string[];
};

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug?: string;
  disabled?: boolean;
  className?: string;
  /** Optional context to send to the AI for better results */
  context?: AiContext;
};

/**
 * "Improve with AI" button — sends current editor content plus rich context
 * (issue title, project name, previous comments) to the AI provider.
 * The backend limits token usage to ~4 k.
 */
export function AiImproveButton({ editorRef, workspaceSlug: propSlug, disabled, className, context }: Props) {
  const [loading, setLoading] = useState(false);
  const { workspaceSlug: paramSlug } = useParams();
  const { t } = useTranslation();
  const slug = propSlug ?? paramSlug?.toString() ?? "";

  const handleImprove = async () => {
    if (!editorRef.current || loading || disabled) return;
    const html = editorRef.current.getDocument().html;
    if (!html || html === "<p></p>") {
      setToast({ type: TOAST_TYPE.INFO, title: t("editor_ai.no_text_title"), message: t("editor_ai.no_text_message") });
      return;
    }
    setLoading(true);
    try {
      const { response } = await aiService.improveText(slug, html, context);
      editorRef.current.setEditorValue(response, true);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("editor_ai.success_title"), message: t("editor_ai.success_message") });
    } catch (err: unknown) {
      const msg = (err && typeof err === "object" && "detail" in err && typeof err.detail === "string") ? err.detail : t("editor_ai.error_message");
      setToast({ type: TOAST_TYPE.ERROR, title: t("editor_ai.error_title"), message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleImprove}
      disabled={loading || disabled}
      title={t("editor_ai.improve_tooltip")}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-12 font-medium transition-colors",
        "hover:border-accent-primary border border-subtle text-secondary hover:text-accent-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <Sparkles className={cn("h-3.5 w-3.5", loading && "animate-pulse")} />
      {loading ? t("editor_ai.improving") : t("editor_ai.improve_with_ai")}
    </button>
  );
}
