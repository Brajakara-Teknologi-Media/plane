import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ArrowRight, Plus, Trash2, X, Shield } from "lucide-react";
import { EProjectAction, PROJECT_ACTION_GROUPS, PROJECT_ACTION_LABELS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { CustomSelect, ToggleSwitch } from "@plane/ui";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { STATE_GROUP_LABELS, WORKFLOW_STATE_TEMPLATE } from "@/constants/workflow-roles";
import rolesService, { type TWorkflowRole, type TRoleTransition } from "@/services/roles.service";

const ACTION_KEYS = Object.values(EProjectAction) as string[];

function EtapaSelect(props: {
  valor: string;
  opcoes: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  const { valor, opcoes, onChange } = props;
  const atual = opcoes.find((o) => o.value === valor);
  return (
    <CustomSelect
      value={valor}
      onChange={onChange}
      label={
        <span className="truncate">
          {atual?.label ?? t("workspace_settings.settings.roles.step_select_placeholder")}
        </span>
      }
      buttonClassName="h-7 w-56 rounded-md border border-subtle bg-surface-2 px-2 text-12 text-primary"
      maxHeight="lg"
      input
    >
      {opcoes.map((o) => (
        <CustomSelect.Option key={o.value} value={o.value}>
          {o.label}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
}

function CreateRoleModal({
  slug,
  open,
  onClose,
  onSaved,
}: {
  slug: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [level, setLevel] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setLevel(10);
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles.name_required"),
      });
      return;
    }
    setSaving(true);
    try {
      await rolesService.create(slug, { name: name.trim(), level });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("created"),
        message: t("workspace_settings.settings.roles.create_success"),
      });
      onSaved();
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles.create_error"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <Dialog.Title>{t("workspace_settings.settings.roles.create_modal_title")}</Dialog.Title>
            <button onClick={onClose} className="text-secondary-text rounded p-1 hover:bg-surface-2">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-secondary-text mb-1 block font-medium">
                {t("workspace_settings.settings.roles.create_modal_name_label")}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-sm w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none focus:border-accent-strong"
              />
            </div>
            <div>
              <label className="text-xs text-secondary-text mb-1 block font-medium">
                {t("workspace_settings.settings.roles.create_modal_level_label")}
              </label>
              <input
                type="number"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="text-sm w-full rounded border border-subtle bg-surface-2 px-3 py-2 text-primary outline-none focus:border-accent-strong"
              />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t("workspace_settings.settings.roles.create_modal_cancel")}
            </Button>
            <Button variant="primary" loading={saving} onClick={submit}>
              {t("workspace_settings.settings.roles.create_modal_submit")}
            </Button>
          </div>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
}

const WorkspaceRolesPage = observer(() => {
  const { t } = useTranslation();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const slug = currentWorkspace?.slug ?? "";

  const [roles, setRoles] = useState<TWorkflowRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [perms, setPerms] = useState<Set<string>>(new Set());
  const [transitions, setTransitions] = useState<TRoleTransition[]>([]);
  const [savingPerms, setSavingPerms] = useState(false);
  const [savingTrans, setSavingTrans] = useState(false);

  const canManage = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    const data = await rolesService.list(slug);
    setRoles(data);
    setSelectedId((prev) => prev ?? data[0]?.id ?? null);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(() => roles.find((r) => r.id === selectedId) ?? null, [roles, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setPerms(new Set(selected.permissions));
    setTransitions(selected.transitions);
  }, [selected]);

  if (!canManage) return <NotAuthorizedView section="settings" />;

  const togglePerm = (key: string) =>
    setPerms((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const alternarGrupo = (acoes: string[], marcar: boolean) =>
    setPerms((prev) => {
      const next = new Set(prev);
      for (const acao of acoes) marcar ? next.add(acao) : next.delete(acao);
      return next;
    });

  const savePerms = async () => {
    if (!selected) return;
    setSavingPerms(true);
    try {
      await rolesService.update(slug, selected.id, { permissions: [...perms] });
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t("saved") });
      await load();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("error") });
    } finally {
      setSavingPerms(false);
    }
  };

  const saveTransitions = async () => {
    if (!selected) return;
    setSavingTrans(true);
    try {
      await rolesService.setTransitions(slug, selected.id, transitions);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("saved"), message: t("saved") });
      await load();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: t("error") });
    } finally {
      setSavingTrans(false);
    }
  };

  const addTransition = () =>
    setTransitions((prev) => [
      ...prev,
      {
        from_group: "unstarted",
        from_state_name: "A Fazer",
        to_group: "started",
        to_state_name: "Em Desenvolvimento",
        allowed: true,
      },
    ]);

  const updateTransition = (idx: number, patch: Partial<TRoleTransition>) =>
    setTransitions((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));

  const removeTransition = (idx: number) => setTransitions((prev) => prev.filter((_, i) => i !== idx));

  const deleteRole = async (role: TWorkflowRole) => {
    if (role.is_system) return;
    if (!confirm(t("workspace_settings.settings.roles.delete_confirm", { name: role.name }))) return;
    try {
      await rolesService.remove(slug, role.id);
      setSelectedId(null);
      await load();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("deleted"),
        message: t("workspace_settings.settings.roles.delete_success"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("workspace_settings.settings.roles.delete_error"),
      });
    }
  };

  const stateForSelect = WORKFLOW_STATE_TEMPLATE.map((s) => ({
    value: `${s.group}::${s.name}`,
    label: `${s.name} (${STATE_GROUP_LABELS[s.group] ?? s.group})`,
  }));
  const parseStateKey = (k: string) => {
    const [group, name] = k.split("::");
    return { group, name };
  };

  return (
    <SettingsContentWrapper>
      <PageHead title={t("workspace_settings.settings.roles.title")} />
      <CreateRoleModal slug={slug} open={createOpen} onClose={() => setCreateOpen(false)} onSaved={load} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div>
            <h3 className="text-lg flex items-center gap-2 font-medium text-primary">
              <Shield className="h-5 w-5" /> {t("workspace_settings.settings.roles.title")}
            </h3>
            <p className="text-xs text-secondary-text">{t("workspace_settings.settings.roles.manage_desc")}</p>
          </div>
          <Button variant="primary" prependIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
            {t("workspace_settings.settings.roles.new_role_btn")}
          </Button>
        </div>

        {loading ? (
          <div className="text-sm text-secondary-text py-8 text-center">
            {t("workspace_settings.settings.roles.loading")}
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="w-64 shrink-0 space-y-1">
              {[...roles]
                .sort((a, b) => a.level - b.level)
                .map((r) => {
                  const ativa = selectedId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      aria-pressed={ativa}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        ativa
                          ? "border-accent-subtle-1 bg-accent-subtle"
                          : "border-transparent hover:border-subtle hover:bg-surface-2"
                      }`}
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-md text-11 font-semibold ${
                          ativa ? "bg-accent-primary text-white" : "bg-surface-3 text-secondary-text"
                        }`}
                        title={t("workspace_settings.settings.roles.role_level_label") + ` ${r.level}`}
                      >
                        {r.level}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-13 ${ativa ? "font-medium text-primary" : "text-primary"}`}
                        >
                          {r.name}
                        </span>
                        <span className="block truncate text-11 text-tertiary">
                          {r.permissions.length} {t("workspace_settings.settings.roles.role_permissions_label")}
                          {r.is_system ? ` · ${t("workspace_settings.settings.roles.role_system_label")}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })}
            </div>

            {selected ? (
              <div className="flex-1 space-y-6">
                <div className="flex items-start justify-between gap-4 rounded-lg border border-subtle bg-surface-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-15 truncate font-medium text-primary">{selected.name}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="bg-surface-3 text-secondary-text rounded px-1.5 py-0.5 text-11">
                        {t("workspace_settings.settings.roles.role_level_label")} {selected.level}
                      </span>
                      <span className="bg-surface-3 font-mono text-secondary-text rounded px-1.5 py-0.5 text-11">
                        {selected.key}
                      </span>
                      {selected.is_system && (
                        <span className="bg-surface-3 text-secondary-text rounded px-1.5 py-0.5 text-11">
                          {t("workspace_settings.settings.roles.role_system_label")}
                        </span>
                      )}
                      <span className="text-11 text-tertiary">
                        {perms.size} de {ACTION_KEYS.length}{" "}
                        {t("workspace_settings.settings.roles.role_permissions_label")}
                      </span>
                    </div>
                  </div>
                  {!selected.is_system && (
                    <button
                      onClick={() => deleteRole(selected)}
                      className="text-secondary-text hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 shrink-0 rounded p-1.5"
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-13 font-semibold text-primary">
                      {t("workspace_settings.settings.roles.role_permissions_label")}
                    </h4>
                    <Button variant="primary" size="sm" loading={savingPerms} onClick={savePerms}>
                      {t("workspace_settings.settings.roles.save_perms")}
                    </Button>
                  </div>

                  {PROJECT_ACTION_GROUPS.map((grupo) => {
                    const marcadas = grupo.actions.filter((a) => perms.has(a)).length;
                    const todasMarcadas = marcadas === grupo.actions.length;
                    return (
                      <div key={grupo.label} className="overflow-hidden rounded-lg border border-subtle">
                        <div className="flex items-center justify-between gap-3 border-b border-subtle bg-surface-2 px-3 py-2">
                          <span className="text-12 font-medium text-primary">{grupo.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-11 text-tertiary">
                              {marcadas}/{grupo.actions.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => alternarGrupo(grupo.actions, !todasMarcadas)}
                              className="rounded px-1.5 py-0.5 text-11 text-accent-primary hover:bg-accent-subtle"
                            >
                              {todasMarcadas ? t("deselect_all") : t("select_all")}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                          {grupo.actions.map((key) => (
                            <label
                              key={key}
                              className="flex cursor-pointer items-center justify-between gap-3 border-b border-subtle px-3 py-2 last:border-b-0 hover:bg-surface-2 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                            >
                              <span className="text-12 text-primary">{PROJECT_ACTION_LABELS[key] ?? key}</span>
                              <ToggleSwitch value={perms.has(key)} onChange={() => togglePerm(key)} size="sm" />
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </section>

                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-13 font-semibold text-primary">{t("transitions")}</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        prependIcon={<Plus className="h-3.5 w-3.5" />}
                        onClick={addTransition}
                      >
                        {t("workspace_settings.settings.roles.add_trans")}
                      </Button>
                      <Button variant="primary" size="sm" loading={savingTrans} onClick={saveTransitions}>
                        {t("workspace_settings.settings.roles.save_trans")}
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-subtle">
                    <p className="text-secondary-text border-b border-subtle bg-surface-2 px-3 py-2 text-11">
                      {t("workspace_settings.settings.roles.trans_description")}
                    </p>
                    {transitions.length === 0 ? (
                      <p className="px-3 py-6 text-center text-12 text-tertiary">
                        {t("workspace_settings.settings.roles.no_trans")}
                      </p>
                    ) : (
                      transitions.map((tr, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center gap-2 border-b border-subtle px-3 py-2 last:border-b-0"
                        >
                          <EtapaSelect
                            valor={`${tr.from_group}::${tr.from_state_name ?? ""}`}
                            opcoes={stateForSelect}
                            onChange={(v) => {
                              const { group, name } = parseStateKey(v);
                              updateTransition(idx, { from_group: group, from_state_name: name });
                            }}
                          />
                          <ArrowRight className="size-3.5 shrink-0 text-tertiary" />
                          <EtapaSelect
                            valor={`${tr.to_group}::${tr.to_state_name ?? ""}`}
                            opcoes={stateForSelect}
                            onChange={(v) => {
                              const { group, name } = parseStateKey(v);
                              updateTransition(idx, { to_group: group, to_state_name: name });
                            }}
                          />
                          <button
                            onClick={() => removeTransition(idx)}
                            className="text-secondary-text hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 ml-auto rounded p-1"
                            title={t("remove")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            ) : (
              <div className="text-sm text-secondary-text flex-1 py-8 text-center">Select a role.</div>
            )}
          </div>
        )}
      </div>
    </SettingsContentWrapper>
  );
});

export default WorkspaceRolesPage;
