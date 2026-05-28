import { onMessage } from "../shared/runtime/messaging";
import { generateAdr, GeminiError } from "../shared/gemini/client";
import { getApiKey } from "../shared/storage/apiKey";
import { saveAdr, listAdrs } from "../shared/storage/adrs";
import garnetTranscript from "../shared/gemini/fixtures/garnet_redis.txt?raw";

const TRANSCRIPT_CAP = 30_000;

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
    case "GENERATE_ADR_TEST": {
      console.log("[SW] GENERATE_ADR_TEST received");
      const apiKey = await getApiKey();
      if (!apiKey) {
        return { type: "ERROR", message: "API key não configurada. Abra Configurações." };
      }
      const transcript = garnetTranscript.slice(0, TRANSCRIPT_CAP);
      try {
        const adr = await generateAdr(transcript, apiKey);
        console.log("[SW] ADR gerado:", adr.titulo);
        return { type: "ADR_READY", adr };
      } catch (err) {
        const message =
          err instanceof GeminiError
            ? err.message
            : err instanceof Error
              ? err.message
              : String(err);
        console.error("[SW] generateAdr falhou", err);
        return { type: "ERROR", message };
      }
    }
    case "SAVE_ADR_TEST": {
      console.log("[SW] SAVE_ADR_TEST received");
      try {
        const record = await saveAdr(msg.adr);
        console.log("[SW] ADR salvo:", record.id, record.title);
        return { type: "ADR_SAVED", record };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[SW] saveAdr falhou", err);
        return { type: "ERROR", message };
      }
    }
    case "LIST_ADRS": {
      try {
        const records = await listAdrs();
        return { type: "ADRS_LIST", records };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[SW] listAdrs falhou", err);
        return { type: "ERROR", message };
      }
    }
    case "PONG":
    case "ADR_READY":
    case "ADR_SAVED":
    case "ADRS_LIST":
    case "ERROR":
      return;
  }
});

console.log("[SW] booted at", new Date().toISOString());
