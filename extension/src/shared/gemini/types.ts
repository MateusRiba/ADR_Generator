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
