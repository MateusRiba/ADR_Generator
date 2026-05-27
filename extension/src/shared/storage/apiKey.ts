// API key da Gemini em chrome.storage.session — volátil (some ao fechar o
// Chrome). Decisão registrada no roadmap: mais seguro que storage.local; o
// usuário re-cola 1x por sessão.

const KEY = "geminiApiKey";

export async function getApiKey(): Promise<string | null> {
  const result = await chrome.storage.session.get(KEY);
  const value = result[KEY];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export async function setApiKey(key: string): Promise<void> {
  await chrome.storage.session.set({ [KEY]: key });
}

export async function clearApiKey(): Promise<void> {
  await chrome.storage.session.remove(KEY);
}

export async function isApiKeySet(): Promise<boolean> {
  return (await getApiKey()) !== null;
}
