import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import entityService, { type TEntity, entityTypeLabel } from "@/services/entity.service";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Building2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { observer } from "mobx-react";
import { useCallback, useEffect, useState } from "react";
import type { Route } from "./+types/page";
import { SelectPesquisavel } from "@/components/common/select-pesquisavel";

const ENTITY_TYPES: { value: number; label: string }[] = [
  { value: 0, label: "City Hall" },
  { value: 1, label: "Council" },
  { value: 2, label: "Others" },
  { value: 3, label: "School" },
  { value: 4, label: "Agency" },
  { value: 5, label: "Pension Fund" },
  { value: 6, label: "Water/Sewage Authority" },
  { value: 7, label: "Consortium" },
];

type TEntityForm = {
  name: string;
  entity_type: number | null;
  city: string;
  state: string;
  email: string;
  phone: string;
  cnpj: string;
  is_active: boolean;
};

const EMPTY_FORM: TEntityForm = {
  name: "",
  entity_type: null,
  city: "",
  state: "",
  email: "",
  phone: "",
  cnpj: "",
  is_active: true,
};

function EntityModal({
  entity,
  workspaceSlug,
  open,
  onClose,
  onSaved,
}: {
  entity?: TEntity | null;
  workspaceSlug: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<TEntityForm>(
    entity
      ? {
          name: entity.name ?? "",
          entity_type: entity.entity_type ?? null,
          city: entity.city ?? "",
          state: entity.state ?? "",
          email: entity.email ?? "",
          phone: entity.phone ?? "",
          cnpj: entity.cnpj ?? "",
          is_active: entity.is_active ?? true,
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(
      entity
        ? {
            name: entity.name ?? "",
            entity_type: entity.entity_type ?? null,
            city: entity.city ?? "",
            state: entity.state ?? "",
            email: entity.email ?? "",
            phone: entity.phone ?? "",
            cnpj: entity.cnpj ?? "",
            is_active: entity.is_active ?? true,
          }
        : { ...EMPTY_FORM }
    );
  }, [entity, open]);

  const handle = (field: keyof TEntityForm, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const E = "workspace_settings.settings.entities";

  const submit = async () => {
    if (!form.name.trim()) {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.name_required`) });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        entity_type: form.entity_type,
        city: form.city || null,
        state: form.state || null,
        email: form.email || null,
        phone: form.phone || null,
        cnpj: form.cnpj || null,
        is_active: form.is_active,
      };
      if (entity) {
        await entityService.update(workspaceSlug, entity.id, payload);
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t(`${E}.toasts.updated`) });
      } else {
        await fetch(`/api/workspaces/${workspaceSlug}/entities/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        setToast({ type: TOAST_TYPE.SUCCESS, title: t("created"), message: t(`${E}.toasts.created`) });
      }
      onSaved();
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.error`) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Panel width={EDialogWidth.LG}>
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title>{entity ? t(`${E}.modal_edit`) : t(`${E}.modal_new`)}</Dialog.Title>
            <button onClick={onClose} className="text-secondary-text rounded p-1 transition-colors hover:bg-surface-2">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-secondary-text mb-1 block font-medium">{t(`${E}.modal_name_label`)}</label>
              <input
                value={form.name}
                onChange={(e) => handle("name", e.target.value)}
                className="text-sm focus:border-accent-primary w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none"
                placeholder={t(`${E}.modal_name_placeholder`)}
              />
            </div>

            <div>
              <label className="text-xs text-secondary-text mb-1 block font-medium">{t(`${E}.modal_type_label`)}</label>
              <SelectPesquisavel
                value={form.entity_type ?? ""}
                onChange={(valor) => handle("entity_type", valor !== "" ? Number(valor) : null)}
                opcoes={ENTITY_TYPES.map((tp) => ({ value: tp.value, label: tp.label }))}
                opcaoVazia={{ value: "", label: t(`${E}.modal_type_placeholder`) }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-secondary-text mb-1 block font-medium">
                  {t(`${E}.modal_city_label`)}
                </label>
                <input
                  value={form.city}
                  onChange={(e) => handle("city", e.target.value)}
                  className="text-sm focus:border-accent-primary w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none"
                  placeholder={t(`${E}.modal_city_placeholder`)}
                />
              </div>
              <div>
                <label className="text-xs text-secondary-text mb-1 block font-medium">
                  {t(`${E}.modal_state_label`)}
                </label>
                <input
                  value={form.state}
                  onChange={(e) => handle("state", e.target.value)}
                  maxLength={2}
                  className="text-sm focus:border-accent-primary w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none"
                  placeholder={t(`${E}.modal_state_placeholder`)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-secondary-text mb-1 block font-medium">
                  {t(`${E}.modal_email_label`)}
                </label>
                <input
                  value={form.email}
                  onChange={(e) => handle("email", e.target.value)}
                  type="email"
                  className="text-sm focus:border-accent-primary w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none"
                  placeholder={t(`${E}.modal_email_placeholder`)}
                />
              </div>
              <div>
                <label className="text-xs text-secondary-text mb-1 block font-medium">
                  {t(`${E}.modal_phone_label`)}
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => handle("phone", e.target.value)}
                  className="text-sm focus:border-accent-primary w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none"
                  placeholder={t(`${E}.modal_phone_placeholder`)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-secondary-text mb-1 block font-medium">{t(`${E}.modal_cnpj_label`)}</label>
              <input
                value={form.cnpj}
                onChange={(e) => handle("cnpj", e.target.value)}
                className="text-sm focus:border-accent-primary w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none"
                placeholder={t(`${E}.modal_cnpj_placeholder`)}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => handle("is_active", e.target.checked)}
                className="accent-accent-primary h-4 w-4 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-primary">
                {t(`${E}.modal_active_label`)}
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" size="lg" onClick={onClose}>
              {t(`${E}.modal_cancel`)}
            </Button>
            <Button variant="primary" size="lg" onClick={submit} loading={saving}>
              {saving ? t(`${E}.modal_saving`) : t(`${E}.modal_save`)}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

const WorkspaceEntitiesPage = observer(function WorkspaceEntitiesPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const E = "workspace_settings.settings.entities";

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const [entities, setEntities] = useState<TEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<number | null>(null);
  const [modal, setModal] = useState<{ open: boolean; entity?: TEntity | null }>({ open: false });
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/entities/?cursor=5000:0:0`, { credentials: "include" });
      const data = await res.json();
      setEntities(Array.isArray(data) ? data : (data.results ?? []));
    } catch {
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (entityId: string) => {
    if (!confirm(t(`${E}.toasts.delete_confirm`))) return;
    try {
      await fetch(`/api/workspaces/${workspaceSlug}/entities/${entityId}/`, {
        method: "DELETE",
        credentials: "include",
      });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("deleted"), message: t(`${E}.toasts.deleted`) });
      load();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.toasts.error`) });
    }
  };

  const handleSyncMembers = async () => {
    if (!confirm(t(`${E}.sync_members_confirm`))) return;
    setSyncing(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceSlug}/projects/sync-members/`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("done"),
        message: t(`${E}.sync_members_success`, { projects: data.synced_projects, members: data.synced_members }),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t(`${E}.sync_members_error`) });
    } finally {
      setSyncing(false);
    }
  };

  if (!isAdmin) return <NotAuthorizedView section="settings" className="h-auto" />;

  const filtered = entities.filter((e) => {
    if (filterType !== null && e.entity_type !== filterType) return false;
    if (search) {
      const s = search.toLowerCase();
      return e.name.toLowerCase().includes(s) || (e.city ?? "").toLowerCase().includes(s) || (e.cnpj ?? "").includes(s);
    }
    return true;
  });

  return (
    <SettingsContentWrapper
      header={
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="text-secondary-text h-5 w-5" />
            <h3 className="text-lg font-semibold">{t(`${E}.heading`)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="lg" onClick={handleSyncMembers} loading={syncing}>
              {t(`${E}.sync_members_btn`)}
            </Button>
            <Button variant="primary" size="lg" onClick={() => setModal({ open: true, entity: null })}>
              <Plus className="mr-1 h-4 w-4" /> {t(`${E}.new_entity_btn`)}
            </Button>
          </div>
        </div>
      }
    >
      <PageHead title={`${currentWorkspace?.name ?? ""} - ${t(`${E}.title`)}`} />

      <EntityModal
        entity={modal.entity}
        workspaceSlug={workspaceSlug}
        open={modal.open}
        onClose={() => setModal({ open: false })}
        onSaved={load}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[200px] flex-1 items-center gap-1.5 rounded-md border border-subtle bg-surface-2 px-2.5 py-1.5">
            <Search className="text-secondary-text h-3.5 w-3.5" />
            <input
              className="text-xs placeholder:text-secondary-text w-full border-none bg-transparent text-primary outline-none"
              placeholder={t(`${E}.search_placeholder`)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SelectPesquisavel
            value={filterType ?? ""}
            onChange={(valor) => setFilterType(valor !== "" ? Number(valor) : null)}
            opcoes={ENTITY_TYPES.map((tp) => ({ value: tp.value, label: tp.label }))}
            opcaoVazia={{ value: "", label: t(`${E}.filter_all_types`) }}
            className="w-44"
            buttonClassName="h-8 text-xs"
          />
        </div>

        <p className="text-xs text-secondary-text">{t(`${E}.entity_count`, { count: filtered.length })}</p>

        {loading ? (
          <div className="text-sm text-secondary-text py-8 text-center">{t(`${E}.loading`)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-secondary-text py-8 text-center">
            {entities.length === 0 ? t(`${E}.no_entities_empty`) : t(`${E}.no_entities_filtered`)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-subtle">
            <table className="text-xs w-full">
              <thead className="text-secondary-text bg-surface-2">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">{t(`${E}.table.name`)}</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t(`${E}.table.type`)}</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t(`${E}.table.city_state`)}</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t(`${E}.table.contact`)}</th>
                  <th className="px-4 py-2.5 text-left font-medium">{t(`${E}.table.status`)}</th>
                  <th className="px-4 py-2.5 text-right font-medium">{t(`${E}.table.actions`)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filtered.map((entity) => (
                  <tr key={entity.id} className="transition-colors hover:bg-surface-2">
                    <td className="px-4 py-2.5 font-medium text-primary">{entity.name}</td>
                    <td className="text-secondary-text px-4 py-2.5">{entityTypeLabel(entity.entity_type) || "—"}</td>
                    <td className="text-secondary-text px-4 py-2.5">
                      {[entity.city, entity.state].filter(Boolean).join("/") || "—"}
                    </td>
                    <td className="text-secondary-text px-4 py-2.5">{entity.email || entity.phone || "—"}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`text-xs inline-flex rounded-full px-2 py-0.5 font-medium ${
                          entity.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {entity.is_active ? t(`${E}.table.active`) : t(`${E}.table.inactive`)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModal({ open: true, entity })}
                          className="text-secondary-text hover:bg-surface-3 rounded p-1 transition-colors hover:text-primary"
                          title={t("edit")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entity.id)}
                          className="text-secondary-text hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 rounded p-1 transition-colors"
                          title={t("delete")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkspaceEntitiesPage;
