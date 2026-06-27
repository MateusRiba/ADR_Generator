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
  | {
      type: "CAPTURE_STATE";
      capturing: boolean;
      charCount: number;
      truncated: boolean;
    }
  // Modo redação (P2): popup busca o buffer para o usuário revisar/editar antes
  // de enviar à Gemini. Trechos removidos não chegam à API.
  | { type: "GET_TRANSCRIPT" }
  | { type: "TRANSCRIPT_TEXT"; text: string }
  // ── Pipeline de geração (Etapa 8) ─────────────────────────────────────────
  // GENERATE_ADR consome o buffer (ou o `transcript` editado, se vier), chama a
  // Gemini, salva e apaga a transcrição bruta (P3). Responde ADR_SAVED.
  | { type: "GENERATE_ADR"; transcript?: string }
  | { type: "ADR_SAVED"; record: AdrRecord }
  // ── Reset total de dados (T-PRIV-04) ──────────────────────────────────────
  | { type: "WIPE_ALL_DATA" }
  | { type: "DATA_WIPED" }
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
