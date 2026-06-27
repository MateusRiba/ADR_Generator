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
import {
  showOverlay,
  hideOverlay,
  pushLine,
  setWaitingForCaptions,
  setTruncated,
} from "./recording_overlay";

// Âncoras do contêiner de legendas. aria-label varia com o idioma da UI do Meet.
// Estritos primeiro (region), depois fallbacks soltos — todos filtrados de
// controles em findContainer (o botão "Legendas"/engrenagem também casa o
// aria-label, mas seu texto é o ligature do ícone, ex.: "settings").
const CONTAINER_SELECTORS = [
  '[role="region"][aria-label*="aption" i]', // EN: "Captions"
  '[role="region"][aria-label*="egenda" i]', // PT: "Legendas"
  '[aria-label*="aption" i]', // fallback solto (EN)
  '[aria-label*="egenda" i]', // fallback solto (PT)
  "div.a4cQT", // classe conhecida (frágil) — último recurso
];

// Um match só é aceito se NÃO for (nem estiver dentro de) um controle: botões e
// itens de menu carregam aria-label de legendas mas contêm só ícones.
const CONTROL_SELECTOR =
  'button, [role="button"], [role="menuitem"], [role="menu"], [role="dialog"]';

// Subárvores ignoradas ao extrair o texto das legendas: ícones (Material/Symbols
// renderizam o nome do ícone como ligature de texto), botões e nós aria-hidden.
const NON_TEXT_SELECTOR =
  'button, [role="button"], svg, i, [class*="icon" i], [class*="material-symbols" i], [aria-hidden="true"]';

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
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      if (!el.closest(CONTROL_SELECTOR)) return el; // pula botões/menus/diálogos
    }
  }
  return null;
}

/**
 * Texto das legendas sem ícones/controles. Não usa `innerText` direto porque a
 * região pode conter ícones (Material/Symbols viram texto via ligature, ex.:
 * "settings") e botões. Percorre os nós de texto pulando subárvores não-texto.
 */
function extractCaptionText(container: HTMLElement): string {
  let out = "";
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.nodeValue ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    if (el.matches(NON_TEXT_SELECTOR)) return;
    for (const child of el.childNodes) walk(child);
    out += " "; // separa elementos (ex.: nome do falante × fala); normalize colapsa
  };
  walk(container);
  return out;
}

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Parte nova de `current` ainda não emitida. Acha o maior sufixo de `tail` que
 * aparece em `current` (última ocorrência) e devolve o que vem DEPOIS dele.
 *
 * Busca a âncora em qualquer posição de `current` (não só no início): a região de
 * legendas do Meet **acumula** o texto em vez de ser uma janela deslizante, então
 * o ponto onde paramos cai no meio/fim de `current`. Casar só no início reemitia
 * o texto inteiro a cada flush (transcrição redundante). O laço de k grande→pequeno
 * tolera o refino do STT na cauda (as últimas palavras mudam enquanto o falante fala).
 */
function newPortion(tail: string, current: string): string {
  const max = Math.min(tail.length, current.length);
  for (let k = max; k > 0; k--) {
    const piece = tail.slice(tail.length - k);
    const idx = current.lastIndexOf(piece);
    if (idx !== -1) return current.slice(idx + k);
  }
  return current; // sem sobreposição: legenda totalmente nova
}

function flushCaptions(): void {
  const container = findContainer();
  if (!container) return;
  const current = normalize(extractCaptionText(container));
  if (!current) return;
  const delta = newPortion(emittedTail, current).trim();
  if (!delta) return;
  emittedTail = (emittedTail + " " + delta).slice(-400); // janela de costura
  setWaitingForCaptions(false);
  pushLine(delta);
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

  // Box de preview visível na página: sinaliza que está gravando mesmo com o popup
  // fechado. O botão "Encerrar" do box passa por confirmação e dispara STOP_CAPTURE
  // ao SW (fonte única da verdade), que ecoa de volta e roda stopCapture() → hideOverlay().
  showOverlay({
    startedAt: Date.now(),
    onStop: () => send({ type: "STOP_CAPTURE" }),
  });

  const container = findContainer();
  if (container) {
    attachObserver(container);
    return;
  }

  // Legendas ainda não ligadas: espera o contêiner aparecer no DOM.
  console.log("[content] legendas não encontradas — aguardando o usuário ativar (CC)");
  setWaitingForCaptions(true);
  bodyObserver = new MutationObserver(() => {
    const found = findContainer();
    if (found) {
      bodyObserver?.disconnect();
      bodyObserver = null;
      setWaitingForCaptions(false);
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
  hideOverlay();
  console.log("[content] captura parada");
}

chrome.runtime.onMessage.addListener((raw: unknown) => {
  if (typeof raw !== "object" || raw === null || !("type" in raw)) return;
  const msg = raw as RuntimeMessage;
  if (msg.type === "START_CAPTURE") startCapture();
  else if (msg.type === "STOP_CAPTURE") stopCapture();
  else if (msg.type === "CAPTURE_TRUNCATED") setTruncated(true);
});

console.log("[content] meet_capture pronto em", location.href);
