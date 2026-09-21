/**
 * Notifies in the workspace when one of your work items changes.
 *
 * It must stay mounted AT ALL TIMES. The first version lived inside the
 * "Notifications" sidebar item: with the menu collapsed the component was not
 * even rendered, the code never ran and the notification simply never appeared
 * — it was saved to the database and nobody saw it.
 *
 * The content does NOT travel in the event. The real-time bus belongs to the
 * whole workspace, so the work item's title would reach the browser of someone
 * who does not even participate in the project. When notified, the browser
 * fetches its own notification — the server already filters by recipient.
 */
import { useTranslation } from "@plane/i18n";
import { useEffect, useRef } from "react";
import { useRealtimeRefetch } from "@/hooks/use-realtime";
import { useUser } from "@/hooks/store/user";
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { WorkspaceNotificationService } from "@/services/workspace-notification.service";

const servico = new WorkspaceNotificationService();

export function useAvisoDeChamado(workspaceSlug: string | undefined) {
  const { data: currentUser } = useUser();
  const { t } = useTranslation();
  const { getUnreadNotificationsCount } = useWorkspaceNotifications();
  const ultimaAvisada = useRef<string | null>(null);

  // Requests permission once. Outside HTTPS the browser refuses outright —
  // there is nothing to do in code, just serve over HTTPS.
  useEffect(() => {
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    } catch {
      /* ignore */
    }
  }, []);

  useRealtimeRefetch(
    (evento) => evento.entity === "notification" && !!currentUser?.id && evento.receiver === currentUser.id,
    () => {
      if (!workspaceSlug) return;
      void getUnreadNotificationsCount(workspaceSlug);
      void (async () => {
        if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
        try {
          const dados = await servico.fetchNotifications(workspaceSlug, {
            type: "all",
            read: false,
            per_page: 1,
          } as never);
          const nova = (dados?.results ?? [])[0] as { id: string; title?: string; message?: string } | undefined;
          if (!nova || nova.id === ultimaAvisada.current) return;
          ultimaAvisada.current = nova.id;
          const aviso = new Notification(nova.title || t("common.work_item_update_notification"), {
            body: nova.message || "",
            icon: "/favicon.ico",
            tag: `plane-chamado-${nova.id}`,
          });
          aviso.onclick = () => {
            window.focus();
            aviso.close();
          };
        } catch {
          // the notification is a convenience: failing here must not break the UI
        }
      })();
    }
  );
}
