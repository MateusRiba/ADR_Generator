// Contrato do ADR retornado pelo Gemini — espelha os 8 campos do schema
// definido em `backend/indexAllShot.js` e no `prompt_design_record.md`.

export interface AdrJson {
  analise_passo_a_passo: string;
  titulo: string;
  contexto: string;
  problema: string;
  alternativas: string[];
  decisao: string;
  consequencias: string[];
  incertezas: string[];
}

export const ADR_REQUIRED_FIELDS = [
  "analise_passo_a_passo",
  "titulo",
  "contexto",
  "problema",
  "alternativas",
  "decisao",
  "consequencias",
  "incertezas",
] as const satisfies ReadonlyArray<keyof AdrJson>;

/** Campos do ADR cujo valor é uma string única. */
export const ADR_STRING_FIELDS = [
  "titulo",
  "contexto",
  "problema",
  "decisao",
  "analise_passo_a_passo",
] as const satisfies ReadonlyArray<keyof AdrJson>;

/** Campos do ADR cujo valor é uma lista de strings. */
export const ADR_ARRAY_FIELDS = [
  "alternativas",
  "consequencias",
  "incertezas",
] as const satisfies ReadonlyArray<keyof AdrJson>;

export function isArrayField(field: keyof AdrJson): boolean {
  return (ADR_ARRAY_FIELDS as readonly string[]).includes(field);
}

/** Rótulos legíveis dos campos para a UI. */
export const ADR_FIELD_LABELS: Record<keyof AdrJson, string> = {
  titulo: "Título",
  contexto: "Contexto",
  problema: "Problema",
  alternativas: "Alternativas",
  decisao: "Decisão",
  consequencias: "Consequências",
  incertezas: "Incertezas",
  analise_passo_a_passo: "Análise passo a passo (raciocínio interno)",
};
