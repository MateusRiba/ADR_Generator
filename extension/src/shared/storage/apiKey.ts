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

// Notifica quando a chave é salva/removida em chrome.storage.session. Permite
// que contextos já abertos (ex.: a página de revisão em tela cheia) reajam sem
// recarregar, mantendo paridade com o popup, que relê a chave a cada abertura.
// Retorna uma função para cancelar a inscrição.
export function onApiKeySet(callback: (present: boolean) => void): () => void {
  const listener = (
    changes: { [name: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== "session" || !(KEY in changes)) return;
    const value = changes[KEY].newValue;
    callback(typeof value === "string" && value.length > 0);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
