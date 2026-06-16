// Contrato tipado das mensagens chrome.runtime entre popup, service worker
// e content scripts. Discriminated union pelo campo `type` — TS força
// exaustividade no switch e impede mensagens malformadas.

import type { AdrJson } from "../gemini/types";
import type { AdrRecord, AdrPatch } from "../storage/adrs";

/** Valor de um campo do ADR (string ou lista de strings). Usado no refino. */
export type AdrFieldKey = keyof AdrJson;
export type AdrFieldValue = string | string[];

export type RuntimeMessage =
  | { type: "PING" }
  | { type: "PONG"; receivedAt: string }
  // ── Captura de transcrição (Etapa 6) ──────────────────────────────────────
  // START/STOP: popup → SW → content script. Chunk: content script → SW.
  | { type: "START_CAPTURE" }
  | { type: "STOP_CAPTURE" }
  | { type: "DISCARD_TRANSCRIPT" }
  | { type: "TRANSCRIPT_CHUNK"; text: string }
  | { type: "GET_CAPTURE_STATE" }
  | { type: "CAPTURE_STATE"; capturing: boolean; charCount: number }
  // ── Pipeline de geração (Etapa 8) ─────────────────────────────────────────
  // GENERATE_ADR consome o buffer, chama a Gemini, salva e apaga a transcrição
  // bruta (P3). Responde ADR_SAVED com o registro persistido (→ Editor).
  | { type: "GENERATE_ADR" }
  | { type: "ADR_SAVED"; record: AdrRecord }
  // ── CRUD de ADRs (Etapas 9 e 11) ──────────────────────────────────────────
  | { type: "LIST_ADRS" }
  | { type: "ADRS_LIST"; records: AdrRecord[] }
  | { type: "UPDATE_ADR"; id: string; patch: AdrPatch }
  | { type: "DELETE_ADR"; id: string }
  | { type: "ADR_DELETED"; id: string }
  // ── Refinamento por seção (Etapa 10) ──────────────────────────────────────
  | {
      type: "REFINE_SECTION";
      adr: AdrJson;
      field: AdrFieldKey;
      instruction: string;
    }
  | { type: "SECTION_REFINED"; field: AdrFieldKey; value: AdrFieldValue }
  // ── Erro genérico ─────────────────────────────────────────────────────────
  | { type: "ERROR"; message: string };

export type RuntimeMessageType = RuntimeMessage["type"];
