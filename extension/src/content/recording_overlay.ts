// Overlay in-page injetado na reunião do Meet enquanto a captura está ativa.
// Dá feedback visível de que a extensão está gravando (o popup do Chrome fecha ao
// perder o foco, então sem isto o usuário não tem sinal nenhum durante a reunião).
//
// Mostra: indicador "gravando" pulsante, cronômetro de tempo decorrido, horário de
// início, as últimas linhas de legenda recebidas e um botão acessível para encerrar
// a gravação COM confirmação inline (não usamos window.confirm — ele bloqueia a
// página e a thread de mensagens da extensão).
//
// Usa Shadow DOM para isolar o CSS: o Meet tem CSS global agressivo e ofusca/rotaciona
// classes; o shadow root protege o overlay nos dois sentidos.

const HOST_ID = "adr-recording-overlay-host";
const MAX_LINES = 4;

interface OverlayHandle {
  host: HTMLElement;
  root: ShadowRoot;
  timer: HTMLElement;
  body: HTMLElement;
  footer: HTMLElement;
  notice: HTMLElement;
  intervalId: ReturnType<typeof setInterval>;
  startedAt: number;
  onStop: () => void;
  lines: string[];
  waiting: boolean;
}

let handle: OverlayHandle | null = null;

const STYLE = `
  :host { all: initial; }
  .card {
    position: fixed;
    right: 16px;
    bottom: 88px; /* acima da barra de controles do Meet (centro-inferior) */
    z-index: 2147483647;
    width: 320px;
    max-width: calc(100vw - 32px);
    box-sizing: border-box;
    font-family: "Google Sans", Roboto, system-ui, -apple-system, sans-serif;
    color: #1f1f1f;
    background: #ffffff;
    border: 1px solid #dadce0;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.28);
    overflow: hidden;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px 8px;
    cursor: grab;
    user-select: none;
    touch-action: none;
  }
  .header.dragging { cursor: grabbing; }
  .header-actions { display: flex; gap: 2px; flex: 0 0 auto; }
  .iconbtn {
    font-family: inherit;
    font-size: 15px;
    line-height: 1;
    font-weight: 700;
    padding: 2px 7px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    color: #5f6368;
    cursor: pointer;
  }
  .iconbtn:hover { background: rgba(0, 0, 0, 0.06); }
  .card.minimized { width: auto; }
  .card.minimized .started,
  .card.minimized .body,
  .card.minimized .notice,
  .card.minimized .footer { display: none; }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #c62828;
    flex: 0 0 auto;
    animation: adr-pulse 1.4s ease-in-out infinite;
  }
  @keyframes adr-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.35; transform: scale(0.78); }
  }
  .title { font-size: 14px; font-weight: 600; flex: 1 1 auto; }
  .timer {
    font-variant-numeric: tabular-nums;
    font-size: 14px;
    font-weight: 600;
    color: #c62828;
  }
  .started {
    padding: 0 14px 8px;
    font-size: 12px;
    color: #5f6368;
  }
  .body {
    padding: 0 14px;
    max-height: 96px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .line {
    font-size: 12px;
    line-height: 1.4;
    color: #3c4043;
  }
  .hint {
    font-size: 12px;
    line-height: 1.4;
    color: #b26a00;
  }
  .notice {
    display: none;
    margin: 8px 14px 0;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.4;
    color: #8a3b00;
    background: #fff3e0;
    border: 1px solid #f0c089;
    border-radius: 8px;
  }
  .notice.visible { display: block; }
  .footer { padding: 10px 14px 12px; }
  .actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .confirm-text {
    font-size: 12px;
    color: #3c4043;
    margin: 0 0 8px;
  }
  button {
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
  .btn-stop {
    width: 100%;
    background: #c62828;
    color: #ffffff;
    border-color: #c62828;
  }
  .btn-danger {
    flex: 1 1 auto;
    background: #c62828;
    color: #ffffff;
    border-color: #c62828;
  }
  .btn-ghost {
    flex: 1 1 auto;
    background: transparent;
    color: #1f1f1f;
    border-color: #dadce0;
  }
`;

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Permite arrastar o card pela barra de título. No primeiro arrasto troca o
 * posicionamento de `right/bottom` (padrão) para `left/top` absoluto e mantém o
 * card dentro da viewport. Cliques nos botões do header (`.iconbtn`) não arrastam.
 */
function enableDrag(card: HTMLElement, header: HTMLElement): void {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let origLeft = 0;
  let origTop = 0;

  header.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest(".iconbtn")) return; // botões não arrastam
    const rect = card.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    card.style.left = `${rect.left}px`;
    card.style.top = `${rect.top}px`;
    card.style.right = "auto";
    card.style.bottom = "auto";
    startX = e.clientX;
    startY = e.clientY;
    dragging = true;
    header.classList.add("dragging");
    header.setPointerCapture(e.pointerId);
  });

  header.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const maxX = Math.max(0, window.innerWidth - card.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - card.offsetHeight);
    const nx = origLeft + (e.clientX - startX);
    const ny = origTop + (e.clientY - startY);
    card.style.left = `${Math.min(Math.max(0, nx), maxX)}px`;
    card.style.top = `${Math.min(Math.max(0, ny), maxY)}px`;
  });

  const end = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    header.classList.remove("dragging");
    try {
      header.releasePointerCapture(e.pointerId);
    } catch {
      /* ponteiro já liberado */
    }
  };
  header.addEventListener("pointerup", end);
  header.addEventListener("pointercancel", end);
}

function renderBody(h: OverlayHandle): void {
  h.body.replaceChildren();
  if (h.lines.length === 0) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = h.waiting
      ? "Ative as legendas (CC) na reunião para capturar a transcrição."
      : "Aguardando a fala dos participantes…";
    h.body.appendChild(hint);
    return;
  }
  for (const text of h.lines) {
    const line = document.createElement("p");
    line.className = "line";
    line.textContent = text;
    h.body.appendChild(line);
  }
  // rola para a última linha (mais recente embaixo)
  h.body.scrollTop = h.body.scrollHeight;
}

function renderStopButton(h: OverlayHandle): void {
  h.footer.replaceChildren();
  const btn = document.createElement("button");
  btn.className = "btn-stop";
  btn.type = "button";
  btn.textContent = "Encerrar gravação";
  btn.setAttribute("aria-label", "Encerrar a gravação do ADR");
  btn.addEventListener("click", () => renderConfirm(h));
  h.footer.appendChild(btn);
}

function renderConfirm(h: OverlayHandle): void {
  h.footer.replaceChildren();

  const text = document.createElement("p");
  text.className = "confirm-text";
  text.textContent = "Encerrar a gravação?";

  const actions = document.createElement("div");
  actions.className = "actions";

  const cancel = document.createElement("button");
  cancel.className = "btn-ghost";
  cancel.type = "button";
  cancel.textContent = "Cancelar";
  cancel.addEventListener("click", () => renderStopButton(h));

  const confirm = document.createElement("button");
  confirm.className = "btn-danger";
  confirm.type = "button";
  confirm.textContent = "Encerrar";
  confirm.addEventListener("click", () => h.onStop());

  actions.append(cancel, confirm);
  h.footer.append(text, actions);
  confirm.focus();
}

export function showOverlay(opts: { startedAt: number; onStop: () => void }): void {
  hideOverlay(); // garante instância única

  const host = document.createElement("div");
  host.id = HOST_ID;
  const root = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = STYLE;

  const card = document.createElement("div");
  card.className = "card";
  card.setAttribute("role", "status");
  card.setAttribute("aria-label", "Gravação do ADR Generator");

  const header = document.createElement("div");
  header.className = "header";
  const dot = document.createElement("span");
  dot.className = "dot";
  const title = document.createElement("span");
  title.className = "title";
  title.textContent = "Gravando ADR";
  const timer = document.createElement("span");
  timer.className = "timer";
  timer.textContent = "00:00";

  const actions = document.createElement("div");
  actions.className = "header-actions";
  const minBtn = document.createElement("button");
  minBtn.className = "iconbtn";
  minBtn.type = "button";
  minBtn.textContent = "–";
  minBtn.setAttribute("aria-label", "Minimizar a caixa de gravação");
  minBtn.addEventListener("click", () => {
    const min = card.classList.toggle("minimized");
    minBtn.textContent = min ? "☐" : "–";
    minBtn.setAttribute(
      "aria-label",
      min ? "Expandir a caixa de gravação" : "Minimizar a caixa de gravação",
    );
  });
  actions.append(minBtn);
  header.append(dot, title, timer, actions);

  enableDrag(card, header);

  const started = document.createElement("div");
  started.className = "started";
  started.textContent = `Início: ${new Date(opts.startedAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;

  const body = document.createElement("div");
  body.className = "body";
  body.setAttribute("aria-live", "polite");
  body.setAttribute("aria-label", "Últimas linhas capturadas");

  const notice = document.createElement("div");
  notice.className = "notice";
  notice.setAttribute("role", "alert");

  const footer = document.createElement("div");
  footer.className = "footer";

  card.append(header, started, body, notice, footer);
  root.append(style, card);
  document.body.appendChild(host);

  const intervalId = setInterval(() => {
    if (!handle) return;
    handle.timer.textContent = formatElapsed(Date.now() - handle.startedAt);
  }, 1000);

  handle = {
    host,
    root,
    timer,
    body,
    footer,
    notice,
    intervalId,
    startedAt: opts.startedAt,
    onStop: opts.onStop,
    lines: [],
    waiting: false,
  };

  renderBody(handle);
  renderStopButton(handle);
}

export function setWaitingForCaptions(waiting: boolean): void {
  if (!handle || handle.waiting === waiting) return;
  handle.waiting = waiting;
  if (handle.lines.length === 0) renderBody(handle);
}

/** Mostra um aviso persistente de que o cap de 30K foi atingido (C2 / T-IA-05). */
export function setTruncated(truncated: boolean): void {
  if (!handle) return;
  handle.notice.textContent = truncated
    ? "Limite de captura atingido — novas falas não entram mais neste ADR."
    : "";
  handle.notice.classList.toggle("visible", truncated);
}

export function pushLine(text: string): void {
  if (!handle) return;
  const clean = text.trim();
  if (!clean) return;
  handle.waiting = false;
  handle.lines.push(clean);
  if (handle.lines.length > MAX_LINES) {
    handle.lines = handle.lines.slice(-MAX_LINES);
  }
  renderBody(handle);
}

export function hideOverlay(): void {
  if (!handle) {
    // fallback: remove host órfão (ex.: re-injeção do content script)
    document.getElementById(HOST_ID)?.remove();
    return;
  }
  clearInterval(handle.intervalId);
  handle.host.remove();
  handle = null;
}
