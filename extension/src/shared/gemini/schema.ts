// Schema do responseSchema do Gemini — JSON puro (sem enums da SDK Node),
// para que funcione no fetch direto do service worker. Espelha o
// `adrSchema` de `backend/indexAllShot.js`.

export const ADR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    analise_passo_a_passo: {
      type: "string",
      description:
        "Raciocínio interno identificando o tema, opções e decisões da transcrição antes de formatar o ADR final.",
    },
    titulo: { type: "string" },
    contexto: { type: "string" },
    problema: { type: "string" },
    alternativas: { type: "array", items: { type: "string" } },
    decisao: { type: "string" },
    consequencias: { type: "array", items: { type: "string" } },
    incertezas: { type: "array", items: { type: "string" } },
  },
  required: [
    "analise_passo_a_passo",
    "titulo",
    "contexto",
    "problema",
    "alternativas",
    "decisao",
    "consequencias",
    "incertezas",
  ],
} as const;
