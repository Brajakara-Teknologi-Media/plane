/**
 * Atalhos de pessoa — "Meus chamados" (`assignee_id`) e "Abertos por mim"
 * (`created_by_id`). Os dois compartilham a mesma decisão: ligar/desligar o
 * usuário atual numa condição sem apagar o resto do filtro.
 *
 * O caso que quebra em silêncio é desligar quando o usuário é o único da lista:
 * deixar a condição vazia faz a listagem devolver ZERO chamados, e a pessoa lê
 * this as "I have nothing", not "the filter broke".
 */
import { describe, expect, it } from "bun:test";
import {
  PESSOA_FILTER_PROPERTY,
  isCurrentUserSelected,
  resolvePessoaFilterAction,
  toPessoaList,
} from "../src/work-item-filters/pessoa-filters";

const EU = "user-1";
const OUTRO = "user-2";

describe("PESSOA_FILTER_PROPERTY", () => {
  it("aponta para as propriedades que o backend entende", () => {
    expect(PESSOA_FILTER_PROPERTY.ASSIGNEE).toBe("assignee_id");
    expect(PESSOA_FILTER_PROPERTY.CREATED_BY).toBe("created_by_id");
  });
});

describe("toPessoaList", () => {
  it("normalizes the formats that the condition can store", () => {
    expect(toPessoaList([EU, OUTRO])).toEqual([EU, OUTRO]);
    expect(toPessoaList(EU)).toEqual([EU]);
    expect(toPessoaList(undefined)).toEqual([]);
    expect(toPessoaList(null)).toEqual([]);
    expect(toPessoaList("")).toEqual([]);
  });

  it("discards holes left by a newly-created condition", () => {
    expect(toPessoaList([EU, "", undefined])).toEqual([EU]);
  });
});

describe("isCurrentUserSelected", () => {
  it("is only true when there is a user and they are in the list", () => {
    expect(isCurrentUserSelected([EU, OUTRO], EU)).toBe(true);
    expect(isCurrentUserSelected([OUTRO], EU)).toBe(false);
    expect(isCurrentUserSelected([EU], undefined)).toBe(false);
  });
});

describe("resolvePessoaFilterAction", () => {
  it("without loaded user does nothing", () => {
    expect(resolvePessoaFilterAction([], undefined, false)).toEqual({ type: "noop" });
  });

  it("enabling without condition creates with current user", () => {
    expect(resolvePessoaFilterAction([], EU, false)).toEqual({ type: "add", values: [EU] });
  });

  it("enabling over another person's choice appends, does not replace", () => {
    // Preservar a escolha é o ponto do atalho: ele compõe, o modelo substitui.
    expect(resolvePessoaFilterAction([OUTRO], EU, true)).toEqual({ type: "update", values: [OUTRO, EU] });
  });

  it("disabling when I am the only one REMOVES the condition", () => {
    expect(resolvePessoaFilterAction([EU], EU, true)).toEqual({ type: "remove" });
  });

  it("disabling with others in the list removes only me", () => {
    expect(resolvePessoaFilterAction([EU, OUTRO], EU, true)).toEqual({ type: "update", values: [OUTRO] });
  });

  it("ligar e desligar em seguida devolve o filtro ao estado original", () => {
    const original = [OUTRO];
    const ligado = resolvePessoaFilterAction(original, EU, true);
    expect(ligado).toEqual({ type: "update", values: [OUTRO, EU] });
    const desligado = resolvePessoaFilterAction((ligado as { values: string[] }).values, EU, true);
    expect(desligado).toEqual({ type: "update", values: original });
  });

  it("existing but still empty condition treats as enabling from scratch", () => {
    expect(resolvePessoaFilterAction([], EU, true)).toEqual({ type: "update", values: [EU] });
  });

  it("the two shortcuts are independent: the decision only looks at its own list", () => {
    // "Meus chamados" ligado não pode influenciar "Abertos por mim".
    const responsaveis = [EU];
    const criadores: string[] = [];
    expect(resolvePessoaFilterAction(responsaveis, EU, true)).toEqual({ type: "remove" });
    expect(resolvePessoaFilterAction(criadores, EU, false)).toEqual({ type: "add", values: [EU] });
  });
});
