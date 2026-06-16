// Content Script injetado em meet.google.com. Componente "Content Script" do C4.
// Lê as LEGENDAS (closed captions) que o próprio Google Meet renderiza no DOM —
// captura todos os participantes e usa o STT do Google (mais preciso que a Web
// Speech API local, que só ouviria o microfone deste usuário). Ver
// canvas_mapeamento_fontes_dados.md Fonte 1 (alternativa "leitura do widget de
// legendas") e a Nota de implementação da Etapa 6 no roadmap.
//
// O ciclo de vida (start/stop) é comandado pelo SW (Meeting Controller) via
// chrome.tabs.sendMessage. O content script só observa o DOM sob START_CAPTURE,
// preservando o guard de consentimento que a Capture View aplica (Etapa 7, P1).
//
// ⚠️ FRAGILIDADE: o Meet ofusca e rotaciona classes CSS. Os seletores abaixo
// estão isolados e priorizam âncoras estáveis (aria-label, role) sobre classes.
// A extração de texto NÃO depende de classes internas: fazemos diff do innerText
// do contêiner contra o que já foi enviado, então só o seletor do contêiner
// precisa de manutenção se o Meet mudar a marcação.

import type { RuntimeMessage } from "../shared/types/messages";
import { CAPTION_DEBOUNCE_MS } from "../shared/config";

// Âncoras do contêiner de legendas. aria-label varia com o idioma da UI do Meet.
const CONTAINER_SELECTORS = [
  '[role="region"][aria-label*="aption" i]', // EN: "Captions"
  '[aria-label*="egenda" i]', // PT: "Legendas"
  "div.a4cQT", // classe conhecida (frágil) — fallback
];

let capturing = false;
let observer: MutationObserver | null = null;
let bodyObserver: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
// Cauda do texto já emitido — usada para "costurar" o diff quando as legendas
// rolam (linhas antigas saem do topo) e para descartar o que já foi enviado.
let emittedTail = "";

function send(msg: RuntimeMessage): void {
  // Pode falhar se o SW estiver reiniciando; o próximo chunk reabre o canal.
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function findContainer(): HTMLElement | null {
  for (const sel of CONTAINER_SELECTORS) {
    const el = document.querySelector<HTMLElement>(sel);
    if (el) return el;
  }
  return null;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Parte nova de `current` ainda não presente em `tail`. Acha o maior sufixo de
 * `tail` que é prefixo de `current` e devolve o resto — trata tanto o
 * crescimento in-place do texto do falante quanto a rolagem das legendas.
 */
function newPortion(tail: string, current: string): string {
  const max = Math.min(tail.length, current.length);
  for (let k = max; k > 0; k--) {
    if (tail.slice(tail.length - k) === current.slice(0, k)) {
      return current.slice(k);
    }
  }
  return current; // sem sobreposição: legenda totalmente nova
}

function flushCaptions(): void {
  const container = findContainer();
  if (!container) return;
  const current = normalize(container.innerText);
  if (!current) return;
  const delta = newPortion(emittedTail, current).trim();
  if (!delta) return;
  emittedTail = (emittedTail + " " + delta).slice(-400); // janela de costura
  send({ type: "TRANSCRIPT_CHUNK", text: delta });
}

function scheduleFlush(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(flushCaptions, CAPTION_DEBOUNCE_MS);
}

function attachObserver(container: HTMLElement): void {
  observer = new MutationObserver(scheduleFlush);
  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  console.log("[content] observando legendas do Meet");
}

function startCapture(): void {
  if (capturing) return;
  capturing = true;
  emittedTail = "";

  const container = findContainer();
  if (container) {
    attachObserver(container);
    return;
  }

  // Legendas ainda não ligadas: espera o contêiner aparecer no DOM.
  console.log("[content] legendas não encontradas — aguardando o usuário ativar (CC)");
  bodyObserver = new MutationObserver(() => {
    const found = findContainer();
    if (found) {
      bodyObserver?.disconnect();
      bodyObserver = null;
      if (capturing) attachObserver(found);
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
}

function stopCapture(): void {
  capturing = false;
  flushCaptions(); // captura o que estiver pendente antes de soltar
  observer?.disconnect();
  observer = null;
  bodyObserver?.disconnect();
  bodyObserver = null;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  console.log("[content] captura parada");
}

chrome.runtime.onMessage.addListener((raw: unknown) => {
  if (typeof raw !== "object" || raw === null || !("type" in raw)) return;
  const msg = raw as RuntimeMessage;
  if (msg.type === "START_CAPTURE") startCapture();
  else if (msg.type === "STOP_CAPTURE") stopCapture();
});

console.log("[content] meet_capture pronto em", location.href);
