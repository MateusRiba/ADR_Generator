import { buildUserPrompt, SYSTEM_INSTRUCTION } from "./prompt";
import { ADR_RESPONSE_SCHEMA } from "./schema";
import { ADR_REQUIRED_FIELDS, type AdrJson } from "./types";

const MODEL = "gemini-3-flash-preview";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 60_000;
// Retry com backoff exponencial em falhas transitórias (429/5xx/rede) — T-ROB-04.
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [1_000, 2_000, 4_000];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    /** Falha transitória (429/5xx/rede) elegível a retry com backoff. */
    readonly retryable = false,
  ) {
    super(message);
    this.name = "GeminiError";
  }
}

export interface GeminiCallBody {
  systemInstruction: { parts: { text: string }[] };
  contents: { role: string; parts: { text: string }[] }[];
  generationConfig: {
    temperature: number;
    responseMimeType: string;
    responseSchema: unknown;
  };
}

/**
 * Chamada base à Gemini: faz o POST, trata HTTP/timeout, extrai o texto do
 * candidato e devolve o JSON parseado (ainda não validado). Compartilhada por
 * `generateAdr` (geração completa) e `refineField` (refino por seção).
 */
export async function callGeminiJson(
  body: GeminiCallBody,
  apiKey: string,
): Promise<unknown> {
  if (!apiKey) {
    throw new GeminiError("API key da Gemini não configurada.");
  }

  let lastError: GeminiError = new GeminiError("Falha ao chamar a Gemini.");
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptGemini(body, apiKey);
    } catch (err) {
      if (!(err instanceof GeminiError) || !err.retryable) {
        throw err; // erro definitivo (timeout, 4xx≠429, JSON inválido)
      }
      lastError = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(BACKOFF_MS[attempt]);
      }
    }
  }
  throw lastError; // esgotou as tentativas em falha transitória
}

/** Uma única tentativa de chamada. Erros transitórios vêm com `retryable: true`. */
async function attemptGemini(
  body: GeminiCallBody,
  apiKey: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      // Timeout próprio: definitivo (não retentar — triplicaria a latência).
      throw new GeminiError(
        `A Gemini não respondeu em ${REQUEST_TIMEOUT_MS / 1000}s. Tente novamente.`,
        err,
      );
    }
    // Falha de rede transitória: retentável.
    throw new GeminiError("Falha de rede ao chamar a Gemini.", err, true);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new GeminiError(
        "Limite de uso da Gemini atingido (429). Aguarde alguns instantes e tente de novo.",
        undefined,
        true,
      );
    }
    if (response.status >= 500) {
      throw new GeminiError(
        `Gemini indisponível (HTTP ${response.status}). Tente novamente.`,
        undefined,
        true,
      );
    }
    throw new GeminiError(
      `Gemini retornou HTTP ${response.status}: ${text.slice(0, 300)}`,
    );
  }

  const payload = (await response.json()) as unknown;
  const text = extractCandidateText(payload);

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new GeminiError("Resposta da Gemini não é JSON válido.", err);
  }
}

export async function generateAdr(
  transcript: string,
  apiKey: string,
): Promise<AdrJson> {
  if (!transcript.trim()) {
    throw new GeminiError("Transcrição vazia.");
  }

  const parsed = await callGeminiJson(
    {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: "user", parts: [{ text: buildUserPrompt(transcript) }] }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseSchema: ADR_RESPONSE_SCHEMA,
      },
    },
    apiKey,
  );

  return validateAdr(parsed);
}

function extractCandidateText(payload: unknown): string {
  const candidates = (payload as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new GeminiError("Resposta da Gemini sem candidatos.");
  }
  const parts = (candidates[0] as { content?: { parts?: unknown } }).content
    ?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    throw new GeminiError("Candidato sem partes de conteúdo.");
  }
  const text = (parts[0] as { text?: unknown }).text;
  if (typeof text !== "string") {
    throw new GeminiError("Parte de conteúdo sem texto.");
  }
  return text;
}

function validateAdr(value: unknown): AdrJson {
  if (typeof value !== "object" || value === null) {
    throw new GeminiError("ADR retornado não é um objeto.");
  }
  const obj = value as Record<string, unknown>;

  for (const field of ADR_REQUIRED_FIELDS) {
    if (!(field in obj)) {
      throw new GeminiError(`Campo obrigatório ausente no ADR: ${field}.`);
    }
  }

  for (const field of [
    "analise_passo_a_passo",
    "titulo",
    "contexto",
    "problema",
    "decisao",
  ] as const) {
    if (typeof obj[field] !== "string") {
      throw new GeminiError(`Campo '${field}' deveria ser string.`);
    }
  }

  for (const field of ["alternativas", "consequencias", "incertezas"] as const) {
    const arr = obj[field];
    if (!Array.isArray(arr) || !arr.every((item) => typeof item === "string")) {
      throw new GeminiError(`Campo '${field}' deveria ser array de strings.`);
    }
  }

  return obj as unknown as AdrJson;
}
