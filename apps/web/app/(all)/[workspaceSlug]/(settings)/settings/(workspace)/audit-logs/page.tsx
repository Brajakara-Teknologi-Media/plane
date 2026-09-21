/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { CustomSelect, Input } from "@plane/ui";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// services
import { auditService, type TAuditFilters } from "@/services/audit.service";
// local imports
import { AuditLogWorkspaceSettingsHeader } from "./header";

function FilterSelect(props: {
  id: string;
  label: string;
  value: string;
  emptyLabel: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
}) {
  const {id, label, value, emptyLabel, options, onChange} = props;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-13 font-medium text-secondary" htmlFor={id}>
        {label}
      </label>
      <CustomSelect
        value={value}
        onChange={onChange}
        label={<span className="truncate">{options[value] ?? emptyLabel}</span>}
        buttonClassName="h-8 w-52 rounded-md border border-subtle bg-surface-1 px-2 text-13 text-primary"
        maxHeight="lg"
        input
      >
        <CustomSelect.Option value="">{emptyLabel}</CustomSelect.Option>
        {Object.entries(options).map(([optValue, optLabel]) => (
          <CustomSelect.Option key={optValue} value={optValue}>
            {optLabel}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleString("en-US");
}

function summarizeChanges(changes: Record<string, unknown>): string {
  const entries = Object.entries(changes ?? {});
  if (entries.length === 0) return "—";
  return entries
    .map(([field, value]) => {
      const change = value as { from?: unknown; to?: unknown };
      if (change && typeof change === "object" && "to" in change) {
        return `${field}: ${String(change.from ?? "—")} → ${String(change.to ?? "—")}`;
      }
      return `${field}: ${String(value)}`;
    })
    .join("; ");
}

function AuditLogSettingsPage() {
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const E = "workspace_settings.settings.auditoria";

  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [actorEmail, setActorEmail] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const filters: TAuditFilters = useMemo(
    () => ({
      action: action || undefined,
      entity: entity || undefined,
      date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      date_to: dateTo ? new Date(`${dateTo}T23:59:59`).toISOString() : undefined,
      cursor: `50:${page}:0`,
    }),
    [action, entity, dateFrom, dateTo, page]
  );

  const { logs, totalCount, hasNextPage, isLoading } = useAuditLogs(slug, filters, { enabled: isAdmin });

  const visibleLogs = useMemo(() => {
    const term = actorEmail.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((log) => (log.actor_email ?? "").toLowerCase().includes(term));
  }, [logs, actorEmail]);

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace.name} - ${t(`${E}.title`)}` : undefined;

  if (workspaceUserInfo && !isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const resetFilters = () => {
    setAction("");
    setEntity("");
    setActorEmail("");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  // Get labels from i18n
  const actionLabels = (t(`${E}.action_labels`, { returnObjects: true }) || {}) as Record<string, string>;
  const entityLabels = (t(`${E}.entity_labels`, { returnObjects: true }) || {}) as Record<string, string>;

  return (
    <SettingsContentWrapper header={<AuditLogWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t(`${E}.title`)}
        description={t(`${E}.description`)}
      />

      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            id="audit-action"
            label={t(`${E}.filter_action`)}
            value={action}
            emptyLabel={t(`${E}.filter_all`)}
            options={actionLabels}
            onChange={(v) => {
              setAction(v);
              setPage(0);
            }}
          />

          <FilterSelect
            id="audit-entity"
            label={t(`${E}.filter_entity`)}
            value={entity}
            emptyLabel={t(`${E}.filter_all_entities`)}
            options={entityLabels}
            onChange={(v) => {
              setEntity(v);
              setPage(0);
            }}
          />

          <div className="flex flex-col gap-1">
            <label className="text-13 font-medium text-secondary" htmlFor="audit-actor">
              {t(`${E}.filter_actor`)}
            </label>
            <Input
              id="audit-actor"
              type="text"
              value={actorEmail}
              onChange={(e) => setActorEmail(e.target.value)}
              placeholder="user@company.com"
              className="h-8 w-56"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-13 font-medium text-secondary" htmlFor="audit-from">
              {t(`${E}.filter_from`)}
            </label>
            <Input
              id="audit-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
              className="h-8 w-40"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-13 font-medium text-secondary" htmlFor="audit-to">
              {t(`${E}.filter_to`)}
            </label>
            <Input
              id="audit-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
              className="h-8 w-40"
            />
          </div>

          <Button variant="secondary" size="sm" onClick={resetFilters}>
            {t(`${E}.clear_filters`)}
          </Button>

          {slug && (
            <a href={auditService.exportUrl(slug, { ...filters, cursor: undefined })} download>
              <Button variant="primary" size="sm">
                {t(`${E}.export_csv`)}
              </Button>
            </a>
          )}
        </div>

        <p className="text-13 text-secondary">
          {isLoading ? t(`${E}.loading`) : t(`${E}.count_results`, { count: totalCount })}
        </p>

        <div className="overflow-x-auto rounded-md border border-subtle">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-2 text-13 text-secondary">
              <tr>
                <th className="px-3 py-2 font-medium">{t(`${E}.table.date`)}</th>
                <th className="px-3 py-2 font-medium">{t(`${E}.table.user`)}</th>
                <th className="px-3 py-2 font-medium">{t(`${E}.table.ip`)}</th>
                <th className="px-3 py-2 font-medium">{t(`${E}.table.action`)}</th>
                <th className="px-3 py-2 font-medium">{t(`${E}.table.record`)}</th>
                <th className="px-3 py-2 font-medium">{t(`${E}.table.changes`)}</th>
              </tr>
            </thead>
            <tbody>
              {visibleLogs.length === 0 && !isLoading && (
                <tr>
                  <td className="px-3 py-6 text-center text-secondary" colSpan={6}>
                    {t(`${E}.no_results`)}
                  </td>
                </tr>
              )}
              {visibleLogs.map((log) => (
                <tr key={log.id} className="border-t border-subtle align-top">
                  <td className="whitespace-nowrap px-3 py-2 text-secondary">{formatDateTime(log.created_at)}</td>
                  <td className="px-3 py-2 text-primary">{log.actor_email ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-secondary">{log.actor_ip ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-primary">{actionLabels[log.action] ?? log.action}</td>
                  <td className="px-3 py-2 text-secondary">
                    {entityLabels[log.entity] ?? log.entity}
                    <span className="ml-1 text-13 text-tertiary">{log.entity_id.slice(0, 8)}</span>
                  </td>
                  <td className="px-3 py-2 text-13 text-secondary">{summarizeChanges(log.changes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            {t(`${E}.pagination.prev`)}
          </Button>
          <span className="text-13 text-secondary">{t(`${E}.pagination.page`, { page: page + 1 })}</span>
          <Button variant="secondary" size="sm" disabled={!hasNextPage} onClick={() => setPage((p) => p + 1)}>
            {t(`${E}.pagination.next`)}
          </Button>
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(AuditLogSettingsPage);
