/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// services
import type { ChatMessage, ChatSession } from "@/services/chat.service";
import { useTranslation } from "@plane/i18n";
// local imports
import { PrintDocument } from "../print-document";
import { PrintFields, PrintSection } from "../print-section";

type Props = {
  session: ChatSession;
  messages: ChatMessage[];
};

const SENDER_KEYS: Record<ChatMessage["sender"], string> = {
  client: "print.chat.sender_client",
  bot: "print.chat.sender_bot",
  attendant: "print.chat.sender_attendant",
  system: "print.chat.sender_system",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  web: "Chat",
};

const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString("en-US") : "—");

const messageBody = (message: ChatMessage, t: (key: string, params?: Record<string, unknown>) => string) => {
  if (message.deleted_at) return t("print.chat.deleted_message");
  if (message.text) return message.text;
  if (message.media_name) return t("print.chat.attachment_prefix", { name: message.media_name });
  if (message.media_key) return `[${message.type}]`;
  return "—";
};

/** Full transcript of a support conversation, ready for printing. */
export const ChatTranscriptPrintDocument = function ChatTranscriptPrintDocument(props: Props) {
  const { session, messages } = props;
  const { t } = useTranslation();

  const clientName = session.client_name || session.client_phone || t("chat.readonly.service_title");

  return (
    <PrintDocument
      title={t("chat.readonly.document_title", { protocol: session.protocol })}
      subtitle={clientName}
      meta={[
        { label: t("print.labels.channel"), value: CHANNEL_LABELS[session.channel] ?? session.channel },
        { label: t("print.labels.status"), value: session.status },
        { label: t("print.counts.messages", { count: messages.length }), value: String(messages.length) },
      ]}
    >
      <PrintSection title={t("print.chat.data_section")}>
        <PrintFields
          items={[
            { label: t("chat.readonly.protocol"), value: session.protocol },
            { label: t("print.chat.sender_client"), value: clientName },
            { label: t("print.labels.phone"), value: session.client_phone ?? "—" },
            { label: t("print.labels.channel"), value: CHANNEL_LABELS[session.channel] ?? session.channel },
            { label: t("print.labels.status"), value: session.status },
            { label: t("common.project"), value: session.project_name ?? "—" },
            { label: t("print.labels.opened_at"), value: formatDateTime(session.created_at) },
            { label: "Rating", value: session.rating_score != null ? String(session.rating_score) : "—" },
            { label: "Rating comment", value: session.rating_comment ?? "—" },
          ]}
        />
      </PrintSection>

      <PrintSection title="Transcript">
        {messages.length === 0 ? (
          <p>{t("print.chat.no_messages")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((message) => (
              <article key={message.id} className="print-avoid-break border-neutral-200 border-b pb-1 last:border-0">
                <p className="text-neutral-500 text-[9px] font-semibold tracking-wide uppercase">
                  {message.sender_name || t(SENDER_KEYS[message.sender]) || message.sender}
                  <span className="font-normal tracking-normal ml-2 normal-case">
                    {formatDateTime(message.created_at)}
                  </span>
                  {message.edited_at && (
                    <span className="font-normal ml-2 normal-case">{t("chat.readonly.edited")}</span>
                  )}
                </p>
                <p className="whitespace-pre-wrap">{messageBody(message, t)}</p>
              </article>
            ))}
          </div>
        )}
      </PrintSection>
    </PrintDocument>
  );
};
