/**
 * Agrupamento das permissões na tela de Funções.
 *
 * A grade corrida de 28 caixas de seleção era ilegível; agora elas saem por
 * assunto. O risco do agrupamento é silencioso: uma permissão nova que ninguém
 * colocar num grupo simplesmente **não aparece na tela**, e o administrador
 * nunca consegue concedê-la a ninguém.
 */
import { describe, expect, it } from "bun:test";
import { EProjectAction, PROJECT_ACTION_GROUPS, PROJECT_ACTION_LABELS } from "../src/project-permissions";

const TODAS = Object.values(EProjectAction);
const AGRUPADAS = PROJECT_ACTION_GROUPS.flatMap((grupo) => grupo.actions);

describe("PROJECT_ACTION_GROUPS", () => {
  it("covers all catalog actions", () => {
    expect([...AGRUPADAS].sort()).toEqual([...TODAS].sort());
  });

  it("does not repeat action in more than one group", () => {
    expect(AGRUPADAS).toHaveLength(new Set(AGRUPADAS).size);
  });

  it("every group has a label and at least one action", () => {
    for (const grupo of PROJECT_ACTION_GROUPS) {
      expect(grupo.label.trim().length).toBeGreaterThan(0);
      expect(grupo.actions.length).toBeGreaterThan(0);
    }
  });

  it("every action has a label in english", () => {
    for (const acao of TODAS) {
      const rotulo = PROJECT_ACTION_LABELS[acao];
      expect(rotulo).toBeTruthy();
      // Sobrou "work item" na primeira tradução; o vocabulário é "chamado".
      expect(rotulo.toLowerCase()).not.toContain("work item");
    }
  });
});
