// Contrato tipado das mensagens chrome.runtime entre popup, service worker
// e content scripts. Discriminated union pelo campo `type` — TS força
// exaustividade no switch e impede mensagens malformadas.

import type { AdrJson } from "../gemini/types";
import type { AdrRecord } from "../storage/adrs";

export type RuntimeMessage =
  | { type: "PING" }
  | { type: "PONG"; receivedAt: string }
  | { type: "GENERATE_ADR_TEST" }
  | { type: "ADR_READY"; adr: AdrJson }
  | { type: "SAVE_ADR_TEST"; adr: AdrJson }
  | { type: "ADR_SAVED"; record: AdrRecord }
  | { type: "LIST_ADRS" }
  | { type: "ADRS_LIST"; records: AdrRecord[] }
  | { type: "ERROR"; message: string };

// TODO (etapas seguintes do roadmap):
// | { type: "START_CAPTURE" }
// | { type: "STOP_CAPTURE" }
// | { type: "TRANSCRIPT_CHUNK"; text: string }
// | { type: "GENERATE_ADR" }
// | { type: "REFINE_SECTION"; field: string; instruction: string };

export type RuntimeMessageType = RuntimeMessage["type"];
