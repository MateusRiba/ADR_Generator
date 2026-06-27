import { onMessage } from "../shared/runtime/messaging";
import { generateAdr, GeminiError } from "../shared/gemini/client";
import { refineField } from "../shared/gemini/refine";
import { getApiKey } from "../shared/storage/apiKey";
import { saveAdr, listAdrs, updateAdr, deleteAdr } from "../shared/storage/adrs";
import {
  loadTranscriptBuffer,
  saveTranscriptBuffer,
  clearTranscriptBuffer,
} from "../shared/storage/transcript";
import { TRANSCRIPT_CAP, BUFFER_PERSIST_INTERVAL_MS } from "../shared/config";

function errorMessage(err: unknown): string {
  if (err instanceof GeminiError) return err.message;
  if (err instanceof Error) return err.message;
  return String(err);
}

// ── Transcription Orchestrator (estado da sessão de captura) ──────────────────
// O SW é efêmero em MV3: estas variáveis somem quando ele é reciclado. Por isso
// o buffer é persistido em IndexedDB (S6) e restaurado preguiçosamente ao
// reativar. `capturing` é reidratado a partir de chunks que continuam chegando
// do content script (que sobrevive à morte do SW).
let buffer = "";
let capturing = false;
let lastPersistAt = 0;
let restored = false;

async function ensureRestored(): Promise<void> {
  if (restored) return;
  restored = true;
  buffer = await loadTranscriptBuffer();
}

async function persistBuffer(): Promise<void> {
  lastPersistAt = Date.now();
  await saveTranscriptBuffer(buffer);
}

function broadcastState(): void {
  // Empurra o estado ao popup, se aberto. Rejeita quando não há receptor — ok.
  chrome.runtime
    .sendMessage({ type: "CAPTURE_STATE", capturing, charCount: buffer.length })
    .catch(() => {});
}

async function appendChunk(text: string): Promise<void> {
  await ensureRestored();
  if (buffer.length >= TRANSCRIPT_CAP) return; // cap atingido: ignora o resto
  const addition = buffer ? ` ${text}` : text;
  buffer = (buffer + addition).slice(0, TRANSCRIPT_CAP);
  if (Date.now() - lastPersistAt >= BUFFER_PERSIST_INTERVAL_MS) {
    await persistBuffer();
  }
  broadcastState();
}

/** Zera o buffer em memória e no IndexedDB (após gerar o ADR — P3 — ou descarte). */
async function resetBuffer(): Promise<void> {
  buffer = "";
  capturing = false;
  lastPersistAt = 0;
  await clearTranscriptBuffer();
}

// ── Meeting Controller (roteia comandos para a aba do Meet) ───────────────────
type RouteResult = "ok" | "no-tab" | "no-content-script";

/**
 * Injeta o content script sob demanda na aba do Meet. Necessário porque o Chrome
 * NÃO injeta `content_scripts` declarativos em abas que já estavam abertas quando
 * a extensão é (re)carregada — cenário comum em dev (`npm run dev` recarrega a
 * extensão a cada save). Lê os arquivos emitidos do próprio manifest, então
 * funciona tanto no build quanto no dev sem hardcode de nomes com hash.
 */
async function injectContentScript(tabId: number): Promise<boolean> {
  const files = (chrome.runtime.getManifest().content_scripts ?? []).flatMap(
    (cs) => cs.js ?? [],
  );
  if (files.length === 0) return false;
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files });
    return true;
  } catch (err) {
    console.error("[SW] falha ao injetar content script", err);
    return false;
  }
}

async function routeToMeetTab(
  message: { type: "START_CAPTURE" | "STOP_CAPTURE" },
): Promise<RouteResult> {
  const tabs = await chrome.tabs.query({ url: "https://meet.google.com/*" });
  const target = tabs.find((t) => t.active) ?? tabs[0];
  if (!target?.id) return "no-tab";
  try {
    await chrome.tabs.sendMessage(target.id, message);
    return "ok";
  } catch {
    // Content script ausente (aba aberta antes da extensão carregar). Injeta e
    // tenta uma vez mais.
    const injected = await injectContentScript(target.id);
    if (!injected) return "no-content-script";
    try {
      await chrome.tabs.sendMessage(target.id, message);
      return "ok";
    } catch {
      return "no-content-script";
    }
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  console.log("[SW] installed", { reason: details.reason, at: new Date().toISOString() });
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[SW] startup at", new Date().toISOString());
});

onMessage(async (msg) => {
  switch (msg.type) {
    case "PING": {
      console.log("[SW] PING received");
      return { type: "PONG", receivedAt: new Date().toISOString() };
    }

    // ── Captura ───────────────────────────────────────────────────────────
    case "START_CAPTURE": {
      await ensureRestored();
      const routed = await routeToMeetTab({ type: "START_CAPTURE" });
      if (routed !== "ok") {
        return {
          type: "ERROR",
          message:
            routed === "no-tab"
              ? "Nenhuma aba do Google Meet aberta. Entre em uma reunião e tente de novo."
              : "Não consegui conectar à aba do Meet. Recarregue a página da reunião (F5) e tente novamente.",
        };
      }
      capturing = true;
      console.log("[SW] captura iniciada");
      return { type: "CAPTURE_STATE", capturing, charCount: buffer.length };
    }
    case "STOP_CAPTURE": {
      await ensureRestored();
      capturing = false;
      await routeToMeetTab({ type: "STOP_CAPTURE" });
      await persistBuffer();
      console.log("[SW] captura parada, buffer persistido:", buffer.length);
      return { type: "CAPTURE_STATE", capturing, charCount: buffer.length };
    }
    case "DISCARD_TRANSCRIPT": {
      await routeToMeetTab({ type: "STOP_CAPTURE" });
      await resetBuffer();
      console.log("[SW] transcrição descartada");
      return { type: "CAPTURE_STATE", capturing, charCount: buffer.length };
    }
    case "TRANSCRIPT_CHUNK": {
      // Chunk chegando reidrata `capturing` mesmo após reciclagem do SW.
      capturing = true;
      await appendChunk(msg.text);
      return;
    }
    case "GET_CAPTURE_STATE": {
      await ensureRestored();
      return { type: "CAPTURE_STATE", capturing, charCount: buffer.length };
    }

    // ── Pipeline de geração (Etapa 8) ───────────────────────────────────────
    case "GENERATE_ADR": {
      await ensureRestored();
      if (!buffer.trim()) {
        return { type: "ERROR", message: "Nenhuma transcrição capturada ainda." };
      }
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { type: "ERROR", message: "API key não configurada. Abra Configurações." };
      }
      try {
        const adr = await generateAdr(buffer, apiKey);
        const record = await saveAdr(adr);
        // P3: transcrição bruta apagada IMEDIATAMENTE após validação+persistência.
        await resetBuffer();
        broadcastState();
        console.log("[SW] ADR gerado e salvo:", record.id, record.title);
        return { type: "ADR_SAVED", record };
      } catch (err) {
        console.error("[SW] GENERATE_ADR falhou", err);
        return { type: "ERROR", message: errorMessage(err) };
      }
    }

    // ── CRUD de ADRs (Etapas 9 e 11) ────────────────────────────────────────
    case "LIST_ADRS": {
      try {
        return { type: "ADRS_LIST", records: await listAdrs() };
      } catch (err) {
        return { type: "ERROR", message: errorMessage(err) };
      }
    }
    case "UPDATE_ADR": {
      try {
        const record = await updateAdr(msg.id, msg.patch);
        return { type: "ADR_SAVED", record };
      } catch (err) {
        return { type: "ERROR", message: errorMessage(err) };
      }
    }
    case "DELETE_ADR": {
      try {
        await deleteAdr(msg.id);
        return { type: "ADR_DELETED", id: msg.id };
      } catch (err) {
        return { type: "ERROR", message: errorMessage(err) };
      }
    }

    // ── Refinamento por seção (Etapa 10) ────────────────────────────────────
    case "REFINE_SECTION": {
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { type: "ERROR", message: "API key não configurada. Abra Configurações." };
      }
      try {
        const value = await refineField(msg.adr, msg.field, msg.instruction, apiKey);
        return { type: "SECTION_REFINED", field: msg.field, value };
      } catch (err) {
        console.error("[SW] REFINE_SECTION falhou", err);
        return { type: "ERROR", message: errorMessage(err) };
      }
    }

    // ── Mensagens de resposta (não tratadas no SW) ──────────────────────────
    case "PONG":
    case "CAPTURE_STATE":
    case "ADR_SAVED":
    case "ADRS_LIST":
    case "ADR_DELETED":
    case "SECTION_REFINED":
    case "ERROR":
      return;
  }
});

console.log("[SW] booted at", new Date().toISOString());
