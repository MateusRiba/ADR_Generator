import { buildUserPrompt, SYSTEM_INSTRUCTION } from "./prompt";
import { ADR_RESPONSE_SCHEMA } from "./schema";
import { ADR_REQUIRED_FIELDS, type AdrJson } from "./types";

const MODEL = "gemini-3-flash-preview";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class GeminiError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = "GeminiError";
  }
}

export async function generateAdr(
  transcript: string,
  apiKey: string
): Promise<AdrJson> {
  if (!apiKey) {
    throw new GeminiError("API key da Gemini não configurada.");
  }
  if (!transcript.trim()) {
    throw new GeminiError("Transcrição vazia.");
  }

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: [
      {
        role: "user",
        parts: [{ text: buildUserPrompt(transcript) }],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: ADR_RESPONSE_SCHEMA,
    },
  };

  let response: Response;
  try {
    response = await fetch(`${ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new GeminiError("Falha de rede ao chamar a Gemini.", err);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new GeminiError(
      `Gemini retornou HTTP ${response.status}: ${text.slice(0, 300)}`
    );
  }

  const payload = (await response.json()) as unknown;
  const text = extractCandidateText(payload);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new GeminiError("Resposta da Gemini não é JSON válido.", err);
  }

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
