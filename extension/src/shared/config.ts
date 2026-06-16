// Parâmetros transversais da extensão. Centralizados aqui para que SW,
// content script e popup compartilhem os mesmos limites sem números mágicos.

/** Cap de contexto por sessão (~7.500 tokens). Ver canvas_mapeamento_fontes_dados.md Fonte 1. */
export const TRANSCRIPT_CAP = 30_000;

/**
 * Intervalo mínimo entre escritas do buffer no IndexedDB. Evita gravar a cada
 * chunk; persiste no máximo a cada 30s para sobreviver à reciclagem do SW (S6).
 */
export const BUFFER_PERSIST_INTERVAL_MS = 30_000;

/**
 * Janela de estabilização da leitura das legendas do Meet. As legendas mudam em
 * tempo real (o texto do falante cresce in-place); só lemos o DOM após este
 * silêncio de mutações para não fragmentar palavras.
 */
export const CAPTION_DEBOUNCE_MS = 800;
