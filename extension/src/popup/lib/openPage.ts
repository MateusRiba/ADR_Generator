// Abre a página full-screen da extensão (Editor / Revisão) numa aba do navegador.
// Tira o Editor e a revisão do popup estreito. `chrome.tabs.create` não exige a
// permissão "tabs" para abrir uma URL própria da extensão.

export function openFullPage(query: string): void {
  const url = chrome.runtime.getURL(`src/page/index.html?${query}`);
  if (chrome.tabs?.create) {
    chrome.tabs.create({ url }).catch(() => window.open(url, "_blank"));
  } else {
    window.open(url, "_blank");
  }
}
