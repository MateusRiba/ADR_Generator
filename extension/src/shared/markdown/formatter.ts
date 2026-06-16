// Markdown Formatter (componente do C4 — pode rodar no Background ou na UI).
// Converte AdrJson em Markdown formato Michael Nygard, pronto para download.
// O campo `analise_passo_a_passo` é raciocínio CoT interno e não entra no .md.
// Mitigação T1 (confusão IA × decisão humana): front-matter `ai_generated: true`
// + rodapé "Gerado por IA — revisar antes de versionar".

import type { AdrJson } from "../gemini/types";

export function toMarkdown(adr: AdrJson, savedAt: Date = new Date()): string {
  const date = savedAt.toISOString().slice(0, 10);
  const title = escapeYamlString(adr.titulo);
  const alternativas = bulletList(adr.alternativas);
  const consequencias = bulletList(adr.consequencias);
  const incertezas = bulletList(adr.incertezas);

  return `---
title: "${title}"
date: ${date}
ai_generated: true
---

# ${adr.titulo}

## Contexto
${adr.contexto}

## Problema
${adr.problema}

## Alternativas
${alternativas}

## Decisão
${adr.decisao}

## Consequências
${consequencias}

## Incertezas
${incertezas}

---
*Gerado por IA — revisar antes de versionar.*
`;
}

function escapeYamlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function bulletList(items: string[]): string {
  if (items.length === 0) return "_Nenhum item registrado._";
  return items.map((item) => `- ${item}`).join("\n");
}
