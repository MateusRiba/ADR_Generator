# Project Log

Registro cronológico append-only de alimentações da base de documentação do **ADR Generator**: criação, atualização e migração de artefatos da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
Formato: `## [YYYY-MM-DD] tipo | descrição`

Tipos: `feature`, `refactor`, `fix`, `decision`, `migration`, `deprecation`, `ingest`

---

## [2026-06-16] feature | Etapas 7–12: pipeline completo, editor, refino, histórico e endurecimento

Implementadas as Etapas 7 a 12 numa única sessão (a pedido), fechando o MVP. Fluxo ponta a ponta: captura → consentimento → geração via Gemini → edição/refino → histórico → export `.md`.

**Contrato de mensagens (`shared/types/messages.ts`):** reescrito para o conjunto final. Removidas as mensagens de teste (`GENERATE_ADR_TEST`, `SAVE_ADR_TEST`, `ADR_READY`). Adicionadas: `DISCARD_TRANSCRIPT`, `GENERATE_ADR`, `UPDATE_ADR`, `DELETE_ADR`, `ADR_DELETED`, `REFINE_SECTION`, `SECTION_REFINED`. Novos tipos auxiliares `AdrFieldKey`/`AdrFieldValue`.

**Etapa 7 — Capture View + consentimento (P1):**
- Popup refatorado em **router de 3 views** (`popup/App.tsx`): abas Captura | Editor | Histórico, com Editor desabilitado até haver ADR ativo. Estado `view` + `activeAdr` local (navegação não precisa de mensagens).
- `popup/views/Capture.tsx` — estados derivados de `capturing`/`charCount` (idle → recording → stopped). **Banner modal de consentimento** com checkbox obrigatória antes do START; aparece toda vez (não memorizado — P1). Botões Iniciar/Parar/Descartar/Gerar.

**Etapa 8 — Pipeline (P3):** handler `GENERATE_ADR` no SW orquestra `buffer → generateAdr → saveAdr → resetBuffer()`. A transcrição bruta é apagada do IndexedDB **imediatamente após** validação+persistência (P3). Tratamento de erro no `client.ts`: timeout de 60s via `AbortController`, mensagem dedicada para `429`, e a mensagem de schema inválido já existente. Popup mostra spinner durante `generating` e navega ao Editor no `ADR_SAVED`.

**Etapa 9 — Editor:** `popup/views/Editor.tsx` + `popup/components/AdrField.tsx`. Campos string em `<textarea>` autoexpand; arrays como lista editável (add/remove); `analise_passo_a_passo` em `<details>` colapsável (não vai pro `.md`). Save com debounce de 300ms via `UPDATE_ADR`. Metadata de campos (`ADR_STRING_FIELDS`, `ADR_ARRAY_FIELDS`, `ADR_FIELD_LABELS`, `isArrayField`) movida para `gemini/types.ts`.

**Etapa 10 — Refinement Engine:** `shared/gemini/refine.ts` com `refineField(adr, field, instruction, apiKey)`. `responseSchema` restrito ao tipo do campo (string OU array de strings), `{ "value": ... }`. `client.ts` refatorado: extraída `callGeminiJson(body, apiKey)` (fetch + HTTP/timeout + parse) compartilhada entre geração e refino. UI: botão "Melhorar…" em cada `AdrField` → modal de instrução no Editor → `REFINE_SECTION` → substitui só aquele campo e salva.

**Etapa 11 — Histórico:** `popup/views/History.tsx`. Lista por `updatedAt` desc (cursor já existente), filtro por título client-side, abrir no Editor, exportar `.md` inline, excluir com confirmação em dois passos.

**Etapa 12 — Endurecimento:**
- **S1 (prompt injection):** `prompt.ts` envolve a transcrição em `<<<TRANSCRIPT_START>>>`/`<<<TRANSCRIPT_END>>>` e a `SYSTEM_INSTRUCTION` instrui a tratar o delimitado como dado, ignorando comandos embutidos. Refletido em `prompt_design_record.md`.
- **T1:** `formatter.ts` adiciona `ai_generated: true` ao front-matter YAML (rodapé "Gerado por IA" já existia).
- **P3:** implementado na Etapa 8 (acima).
- **F1:** documentado na UI (Capture) e em "Limitações conhecidas" do README.
- **README:** seção "Usando a extensão" (manual passo a passo) + "Limitações conhecidas" (F1, dependência das legendas, cap, LGPD, S1).

**Validações:** `npm run build` (`tsc --noEmit` + vite) passou — 55 módulos. Testes manuais no Chrome (`T-SEG-01`, `T-PRIV-01`, `T-ROB-02`, `T-FUNC-*`) **pendentes pelo usuário**.

**Decisões de implementação:**
- **CRUD de ADRs via SW** (UPDATE/DELETE/LIST por mensagem) em vez de o popup tocar o IndexedDB direto — mantém o C4 (Storage Repository no Background) e consistência com a Etapa 5.
- **`callGeminiJson` extraída** para não duplicar fetch/erro entre `generateAdr` e `refineField`.
- **Navegação de views é estado local do popup**, não mensagem — o popup é efêmero e não há necessidade de persistir a aba ativa.
- **`DISCARD_TRANSCRIPT`** adicionada para o usuário descartar uma captura sem gerar ADR (zera buffer + para o content script).

---

## [2026-06-16] decision | Captura por legendas (DOM) do Meet em vez de Web Speech API (Etapa 6)

Durante a Etapa 6, ao revisar com o usuário, decidiu-se trocar a fonte de captura. A primeira implementação usava a **Web Speech API**, mas ela só capta o **microfone local** — o áudio dos demais participantes sai pelo alto-falante e não entra no mic, tornando a transcrição quase inútil para ADRs de reunião (que precisam da fala de todos).

**Decisão:** ler as **legendas (closed captions) que o próprio Meet renderiza no DOM** — a "alternativa em avaliação" já prevista em `canvas_mapeamento_fontes_dados.md` Fonte 1 (linha 56). Vantagens: capta todos os participantes e usa o STT do Google (mais preciso). Custo: exige a extensão ativa **e** o usuário ligar as legendas (CC) durante a reunião. A única forma de "pegar só no fim" seria a transcrição nativa do Workspace (depende de plano pago) — descartada para o MVP zero-backend.

**Reescritos nesta decisão:**
- `extension/src/content/meet_capture.ts` — agora localiza o contêiner de legendas por âncoras estáveis (`role="region"`, `aria-label*="aption"/"egenda"`, com fallback de classe `.a4cQT`) e observa via `MutationObserver`. A extração de texto **não depende de classes internas**: faz `diff` do `innerText` do contêiner contra uma cauda do que já foi enviado (`newPortion` acha o maior sufixo/prefixo sobreposto), o que costura tanto o crescimento in-place do texto quanto a rolagem das legendas. Debounce de 800ms (`CAPTION_DEBOUNCE_MS`) para não fragmentar palavras. Se as legendas ainda não estiverem ligadas, observa o `body` até o contêiner aparecer. Só observa sob `START_CAPTURE` (preserva o guard P1 da Etapa 7).
- `extension/src/shared/config.ts` — removido `RECOGNITION_LANG`; adicionado `CAPTION_DEBOUNCE_MS=800`.
- `extension/src/content/speech.d.ts` — **removido** (era só para a Web Speech API).
- `extension/src/popup/App.tsx` — nota agora instrui ligar as legendas (CC); F1 reformulado (erros de STT em vez de sotaque).

**Risco assumido:** o Meet ofusca/rotaciona classes CSS. O único ponto que precisa de manutenção é o seletor do **contêiner** (isolado em `CONTAINER_SELECTORS`); a extração de texto é resiliente a mudança de classes. Validação dos seletores contra o DOM real do Meet fica como tarefa de teste manual (ver abaixo). Itens abaixo descrevem o restante da Etapa 6 (SW, storage, mensagens) que independe da fonte de captura.

---

## [2026-06-16] feature | Content Script + captura de transcrição no Meet (Etapa 6/12 do roadmap)

Implementada a Etapa 6: captura de transcrição do Google Meet (componente `Content Script` do C4) e acúmulo no service worker (componente `Transcription Orchestrator`), com persistência periódica em IndexedDB para sobreviver à reciclagem do SW (risco **S6**). A fonte de captura final (legendas via DOM) está detalhada na entry `decision` acima.

**Arquivos criados:**
- `extension/src/content/meet_capture.ts` — content script injetado em `meet.google.com/*` (ver entry `decision` acima para a mecânica de leitura das legendas).
- `extension/src/shared/config.ts` — parâmetros transversais: `TRANSCRIPT_CAP=30_000`, `BUFFER_PERSIST_INTERVAL_MS=30_000`, `CAPTION_DEBOUNCE_MS=800`. Removeu o número mágico que estava inline no SW.
- `extension/src/shared/storage/transcript.ts` — buffer da sessão em IndexedDB próprio (`adr-generator-transcript` v1, store `buffer`, chave fixa `current`). API: `saveTranscriptBuffer`, `loadTranscriptBuffer`, `clearTranscriptBuffer`. DB separado do `adr-generator` para não acoplar a versão do schema dos ADRs ao buffer volátil.

**Arquivos editados:**
- `extension/src/manifest.json` — `content_scripts` (match `https://meet.google.com/*`, `run_at: document_idle`) e `host_permissions` += Meet. Sem permissão `tabs` (o host permission já habilita `tabs.query` por URL).
- `extension/src/shared/types/messages.ts` — +6 mensagens: `START_CAPTURE`, `STOP_CAPTURE`, `TRANSCRIPT_CHUNK`, `GET_CAPTURE_STATE`, `CAPTURE_STATE`. `TRANSCRIPT_UPDATED` do plano original foi unificada em `CAPTURE_STATE` (`{ capturing, charCount }`), que serve tanto de resposta a `GET_CAPTURE_STATE` quanto de push do SW ao popup.
- `extension/src/background/service_worker.ts` — Transcription Orchestrator: buffer em memória, restore preguiçoso do IndexedDB (`ensureRestored`), `appendChunk` com cap 30K + persist throttled (≥30s) + broadcast `CAPTURE_STATE`. Meeting Controller: `routeToMeetTab` localiza a aba do Meet (`tabs.query` por URL, prioriza a ativa) e encaminha START/STOP via `tabs.sendMessage`. `capturing` é reidratado quando chunks voltam a chegar após reciclagem do SW.
- `extension/src/popup/App.tsx` — botão de teste "Iniciar captura (teste)"/"Parar captura", contador de caracteres ao vivo, assinatura de `CAPTURE_STATE` via `chrome.runtime.onMessage` + `GET_CAPTURE_STATE` no mount. Nota visível sobre viés de sotaque (F1).
- `extension/src/popup/App.css` — `.popup__capture`, `.popup__char-count`, `.popup__button--danger`, `.popup__hint--muted`.

**Validações:**
- `npm install` (node_modules ausente no clone) + `npm run build` passou (`tsc --noEmit` limpo, 50 módulos). Manifest gerado pelo crxjs expõe o content script com loader e registra os chunks como `web_accessible_resources` automaticamente.
- Testes manuais no Chrome (a executar pelo usuário): entrar numa reunião do Meet → ligar legendas (CC) → "Iniciar captura" → o contador incrementa conforme as legendas surgem; **validar os seletores de `CONTAINER_SELECTORS` contra o DOM real** (se o contador não mexer, inspecionar o contêiner de legendas e ajustar o seletor); matar o SW em `chrome://extensions/` → reabrir popup → `GET_CAPTURE_STATE` devolve o `charCount` recuperado do IndexedDB (T-ROB-02).

**Decisões de implementação:**
- **START/STOP antecipados da Etapa 2 → 6:** a Etapa 6 não é testável sem um gatilho de captura. As mensagens entram agora e a Etapa 7 só as envolve com o banner de consentimento + as 3 views. Botão atual é explicitamente "(teste)".
- **Roteamento via Meeting Controller no SW** (em vez de o popup falar direto com o content script): alinhado ao C4 e necessário, já que `runtime.sendMessage` do popup não alcança content scripts — só `tabs.sendMessage` direcionado por tab alcança.
- **Buffer em IndexedDB separado** dos ADRs: desacopla versionamento de schema; o buffer é volátil/efêmero e será apagado após gerar o ADR (P3, Etapa 8).
- **Persist throttled (≥30s) em vez de a cada chunk:** reduz escritas mantendo a janela de perda em ≤30s, conforme o roadmap. `STOP_CAPTURE` força um persist final.

---

## [2026-05-27] feature | Storage Repository IndexedDB + Markdown Formatter (Etapa 5/12 do roadmap)

Implementada a Etapa 5: persistência local dos ADRs gerados em IndexedDB (componente `Storage Repository` do C4) e exportação `.md` formato Michael Nygard (componente `Markdown Formatter`).

**Arquivos criados:**
- `extension/src/shared/storage/adrs.ts` — wrapper nativo do IndexedDB (sem dep `idb`, ~110 linhas). DB `adr-generator` v1, store `adrs` (keyPath `id`), index `by-updatedAt`. API: `saveAdr`, `getAdr`, `listAdrs` (cursor descendente por `updatedAt`), `updateAdr`, `deleteAdr`. ID via `crypto.randomUUID()`. Helper `withStore(mode, fn)` abre conexão por operação e fecha no `finally` para evitar vazamento.
- `extension/src/shared/markdown/formatter.ts` — função pura `toMarkdown(adr, savedAt?)`. Front-matter YAML mínimo (`title`, `date`), 6 seções na ordem Nygard (Contexto, Problema, Alternativas, Decisão, Consequências, Incertezas), listas com `-`, rodapé fixo `*Gerado por IA — revisar antes de versionar.*`. Escape de aspas/`\` no YAML. `analise_passo_a_passo` fica fora do `.md` (é CoT interno do prompt, não conteúdo do ADR).

**Arquivos editados:**
- `extension/src/shared/types/messages.ts` — +4 mensagens (`SAVE_ADR_TEST`, `ADR_SAVED`, `LIST_ADRS`, `ADRS_LIST`), import de `AdrRecord` para tipar o payload.
- `extension/src/background/service_worker.ts` — 2 handlers novos (`SAVE_ADR_TEST` e `LIST_ADRS`) seguindo o padrão try/catch dos anteriores. Switch exaustivo cobre os novos response-types para evitar warning de unhandled.
- `extension/src/popup/App.tsx` — `useEffect` agora também chama `LIST_ADRS` no mount; quando `adr` está populado, mostra os botões "Salvar ADR" (vira "ADR salvo" e desabilita após persistir) e "Exportar .md" lado a lado em `.popup__actions`. Download via `Blob` + `URL.createObjectURL` + anchor click (revoga URL depois). `safeFilename()` slugify mínima para o nome do arquivo. Contagem persistente "N ADR(s) salvo(s) no navegador" visível sempre que há registros — é o sinal de que o IndexedDB sobreviveu ao fechar do popup.
- `extension/src/popup/App.css` — `.popup__actions` (flex row, gap 8px, botões com `flex: 1`) e `.popup__saved-count` (mono 11px, opacidade 0.7).

**Validações:**
- `npm run build` passou (47 módulos, sem warnings TS).
- Teste manual: gera ADR → "Salvar ADR" → contagem sobe para 1 → fecha popup → reabre → "1 ADR salvo no navegador" persiste. Gera segundo ADR → salva → sobe para 2. "Exportar .md" baixa arquivo com slug do título, abre com front-matter YAML e 6 seções na ordem correta + rodapé. DevTools → Application → IndexedDB → `adr-generator/adrs` mostra registros com `id` UUID, `createdAt`, `updatedAt`, `content` completo.

**Decisões de implementação:**
- **IndexedDB nativo vs lib `idb`:** zero deps, suficiente para o escopo (CRUD básico + index por timestamp). Roadmap já antecipava essa escolha. O wrapper `withStore` resolve o pitfall de transactions auto-commit ao yieldar entre operações async.
- **Storage no Background, popup via mensagem:** alinhado ao C4 (Storage Repository é componente do Background container). Mantém o popup desacoplado dos detalhes do IndexedDB, com benefício extra de o SW ter acesso ao DB para Etapas 6+ (transcrição persistida cada 30s — S6 mitigation).
- **Markdown Formatter em `shared/`, chamado do popup:** download requer contexto de página (anchor click). Mas a função é pura e estará disponível para o SW quando a Etapa 8 fizer auto-save + auto-export.
- **`analise_passo_a_passo` excluído do `.md`:** é raciocínio CoT interno do prompt (`prompt_design_record.md` §2). Sai do JSON na UI mas não vaza para o artefato versionado.
- **Front-matter mínimo nesta etapa:** apenas `title` e `date`. Rodapé "Gerado por IA" prepara T1; a mitigação completa de T1 (front-matter `ai_generated: true`, `gerado_por`, revisão obrigatória do `decisao`) fica para Etapa 12 conforme `checklist_analise_riscos_ia.md` §6.
- **Sem mudança no `manifest.json`:** IndexedDB é API web nativa disponível em MV3 SW sem permissão extra. Princípio do menor privilégio mantido.

## [2026-05-27] feature | Porta de indexAllShot.js → shared/gemini/ (Etapa 4/12 do roadmap)

Implementada a Etapa 4: pipeline `generateAdr(transcript, apiKey)` rodando dentro do service worker via `fetch` direto ao endpoint REST da Gemini, sem SDK Node.js (que não funciona em MV3).

**Arquivos criados:**
- `extension/src/shared/gemini/types.ts` — interface `AdrJson` com os 8 campos do schema canônico + constante `ADR_REQUIRED_FIELDS` (typed via `satisfies`).
- `extension/src/shared/gemini/prompt.ts` — `SYSTEM_INSTRUCTION` portada **literalmente** de `backend/indexAllShot.js` (CoT + few-shot + regras de fidelidade). Função `buildUserPrompt(transcript)` espelha o template `Gere um ADR estruturado baseado nesta transcrição: ...`.
- `extension/src/shared/gemini/schema.ts` — `ADR_RESPONSE_SCHEMA` como JSON puro (sem `SchemaType` enums da SDK), exportada como `as const` para preservar tipagem literal.
- `extension/src/shared/gemini/client.ts` — `generateAdr(transcript, apiKey)` faz POST em `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=...` com `temperature: 0`, `responseMimeType: "application/json"`, `responseSchema`. Parsing extrai `candidates[0].content.parts[0].text`, faz `JSON.parse` e valida os 8 campos (string × array-of-string) antes de devolver. Erros tipados via classe `GeminiError`.
- `extension/src/shared/gemini/fixtures/garnet_redis.txt` — cópia de `backend/archives/trancriptionTest.txt` (36KB, debate Garnet × Redis × Dragonfly × Memcached). Importada no SW via `?raw` do Vite.

**Arquivos editados:**
- `extension/src/manifest.json` — `"host_permissions": ["https://generativelanguage.googleapis.com/*"]`. Único privilégio novo, mínimo necessário para o fetch ao Gemini.
- `extension/src/shared/types/messages.ts` — ativados 3 tipos previamente comentados: `GENERATE_ADR_TEST`, `ADR_READY` (carrega `AdrJson`), `ERROR` (carrega `message`).
- `extension/src/background/service_worker.ts` — handler `GENERATE_ADR_TEST` lê API key via `getApiKey()`, fatia transcript em `TRANSCRIPT_CAP = 30_000` chars (alinhado ao cap do CLAUDE.md), chama `generateAdr` e devolve `ADR_READY` ou `ERROR` (sem vazar stack para a UI).
- `extension/src/popup/App.tsx` — botão primário "Gerar ADR de teste" (disabled quando `apiKeyReady !== true` ou `generating`). Resultado exibido em `<details>` com `<pre>` do JSON formatado.
- `extension/src/popup/App.css` — `.popup__button--primary`, `.popup__adr`, `.popup__adr-json`; `min-width` do body subiu para 360px para caber o JSON.

**Validações:**
- `npm run build`: passou (45 módulos transformados, SW chunk de 41KB com o transcript inline, sem erros TS).
- Teste manual no Chrome: clica "Gerar ADR de teste" com API key configurada → ~6-10s depois aparece o JSON dos 8 campos preenchidos coerentemente (decisão = "Migrar para Garnet com soft launch", alternativas listam Dragonfly, Memcached e otimização do Redis Premium). Sem API key, retorna erro "API key não configurada" sem chamar o Gemini.

**Decisões de implementação:**
- **`fetch` direto vs SDK:** SDK `@google/generative-ai` depende de `Node:stream` e crypto não-disponíveis em MV3 service workers. REST endpoint v1beta funciona com `fetch` nativo.
- **Validação no client em vez de no SW handler:** mantém `client.ts` como boundary único — se o schema mudar (Etapa 12 anti-injection), todos os pontos de uso herdam a validação.
- **Transcript fixa via `?raw`:** alternativa a inlinar 36KB em template literal. O `?raw` do Vite tipa como `string` e tree-shake-friendly para futuras fixtures.
- **Cap de 30K chars:** alinhado à decisão de domínio (`canvas_estrategia_acao.md`, ~7.500 tokens). A fixture do backend tem 36KB; aplicamos `.slice(0, TRANSCRIPT_CAP)` para honrar o contrato desde já em vez de tratar "test mode" como exceção.

## [2026-05-27] feature | Options Page + API key em chrome.storage.session (Etapa 3/12 do roadmap)

Implementada a Etapa 3: página de opções da extensão para o usuário colar a chave da Gemini API, persistida em `chrome.storage.session` (volátil, some ao fechar o Chrome).

**Arquivos criados:**
- `extension/src/shared/storage/apiKey.ts` — wrapper minimalista sobre `chrome.storage.session` com `getApiKey`, `setApiKey`, `clearApiKey`, `isApiKeySet`. Chave armazenada sob `geminiApiKey`. `getApiKey` retorna `null` se ausente ou string vazia (boundary defensivo).
- `extension/src/options/{index.html, main.tsx, App.tsx, App.css}` — page MV3 com `<input type="password">`, botões Salvar/Esquecer chave, badge Configurada/Não configurada e bloco explicando a volatilidade da `storage.session`.

**Arquivos editados:**
- `extension/src/manifest.json` — adicionado `"options_page": "src/options/index.html"` e `"permissions": ["storage"]`. `storage` é o único privilégio novo, mínimo necessário.
- `extension/src/popup/App.tsx` — `useEffect` lê `isApiKeySet()` no mount; se `false`, exibe aviso com botão "Abrir configurações" que chama `chrome.runtime.openOptionsPage()`.
- `extension/src/popup/App.css` — estilos `.popup__notice`/`.popup__notice--warn`/`.popup__button--link`.

**Validações:**
- `npm run build`: passou. Vite gerou `src/options/index.html` no `dist/` e chunk separado para o módulo options.
- Teste manual no Chrome: badge alterna corretamente entre Configurada/Não configurada ao salvar/esquecer; popup mostra aviso quando chave ausente; fechar o Chrome zera a chave (confirmando volatilidade da `storage.session`).

**Fix de UX durante a sessão:** primeira versão do `.options__button--primary` usava `background: currentColor` + `color: Canvas` para se adaptar ao tema do sistema, mas `currentColor` resolve depois do cascade, então o texto ficava na mesma cor do fundo (invisível) quando o botão era habilitado. Trocado por cores explícitas (`#1976d2` / `#ffffff`).

**Justificativa:** `chrome.storage.session` foi escolhida em vez de `storage.local` pelo trade-off explicitado no `roadmap_implementacao.md`: chave em disco persiste entre sessões mas é exfiltrável em backups e em ataques de filesystem; em memória, some ao fechar o Chrome (custo: re-colar 1x por sessão). Decisão alinhada ao princípio de menor superfície de ataque do `checklist_analise_riscos_ia.md` (risco S1). O aviso de volatilidade no popup e na options torna o trade-off visível ao usuário em vez de silencioso.

## [2026-05-27] feature | Protocolo de mensagens tipado SW↔popup (Etapa 2/12 do roadmap)

Implementada a Etapa 2 do roadmap: contrato tipado de `chrome.runtime` entre service worker e popup, validado por um ping-pong end-to-end.

**Arquivos criados:**
- `extension/src/shared/types/messages.ts` — union discriminada `RuntimeMessage` com `PING` e `PONG` (campo `receivedAt: string`). Tipos das etapas seguintes (`START_CAPTURE`, `TRANSCRIPT_CHUNK`, `GENERATE_ADR`, `ADR_READY`, `REFINE_SECTION`, `ERROR`) ficam comentados como TODO para serem ativados quando a etapa correspondente chegar — evita declarar protocolo morto agora.
- `extension/src/shared/runtime/messaging.ts` — `sendMessage<T extends RuntimeMessage>(msg): Promise<RuntimeMessage>` e `onMessage(handler)`. Inclui guard `isRuntimeMessage` que rejeita payloads sem `type` (defesa contra mensagens de outras extensões) e suporta handlers síncronos e assíncronos (retorna `true` quando o resultado é Promise, conforme contrato do MV3).

**Arquivos editados:**
- `extension/src/background/service_worker.ts` — handler `onMessage` com `switch (msg.type)` exaustivo. `PING` → log `[SW] PING received` + retorna `{ type: "PONG", receivedAt }`. `PONG` no SW retorna `void` (não esperado, mas TS exige exaustividade).
- `extension/src/popup/App.tsx` — botão "Ping SW" com estados `pinging`/`pongAt`/`error`. Trata resposta inesperada e exceção do `sendMessage`.
- `extension/src/popup/App.css` — estilos `.popup__button` e `.popup__status` (verde/vermelho mono).

**Validações:**
- `npm run build` (= `tsc --noEmit && vite build`): passou. Vite gerou `messaging-*.js` em chunk separado (~0.5 KB), compartilhado entre SW e popup.
- Teste manual no Chrome: clique no botão → `Pong recebido em <ISO>` no popup; DevTools do SW mostra `[SW] PING received`.

**Justificativa:** discriminated union pelo campo `type` é o padrão idiomático para protocolos de mensagens em TS — força `switch` exaustivo e impede typos silenciosos quando um novo tipo é adicionado. O guard `isRuntimeMessage` no `onMessage` é a fronteira de validação entre o mundo "qualquer mensagem do navegador" e o mundo tipado da app; sem ele, mensagens de outras extensões ou de scripts injetados quebrariam o `switch`. Não foi adicionada nenhuma permissão ao manifest porque `chrome.runtime` está disponível por padrão — respeita o princípio de menor privilégio decidido no `canvas_c4_model.md`.

## [2026-05-27] feature | Roadmap de implementação das 12 etapas em docs/roadmap_implementacao.md

Criado `docs/roadmap_implementacao.md` como plano-mestre versionado do desenvolvimento da extensão. Documenta as **12 etapas** sequenciais, cada uma com objetivo, tarefas concretas, critério de pronto testável manualmente, arquivos chave e mapeamento explícito para os riscos críticos do `checklist_analise_riscos_ia.md` (P1, P2, S1, T1, P3, F1, S6) e casos de teste do `canvas_testes_validacao.md`.

**Inclui:**
- Tabela das 12 etapas com status (Etapa 1 ✅ marcada como concluída).
- Stack confirmada (Vite 5.4 + `@crxjs/vite-plugin` 2.0-beta + React 18.3 + TS 5.6).
- Decisões transversais já tomadas (zero backend, menor privilégio no manifest, estrutura de pastas, config crítica do `vite.config.ts` resolvendo o bug IPv6 + CORS no Windows).
- Detalhamento expandido das Etapas 2–12: tarefas atômicas, saídas testáveis, decisões pendentes a tomar dentro da etapa, e instrução de como uma próxima sessão do Claude Code deve continuar.

**Atualizações em `CLAUDE.md`:**
- Estado atual: "PoC backend validado" → "Etapa 1/12 da extensão concluída".
- Estrutura de diretório: adicionado `extension/` e referência a `roadmap_implementacao.md`.
- Seção Stack: substituído o item "Extensão (planejado)" por versões reais já adotadas.
- Adicionada seção "Rodando a extensão (dev)".
- Seção "Onde Buscar Conhecimento": novo bullet apontando para `docs/roadmap_implementacao.md` como leitura obrigatória antes de codar.

**Justificativa:** o plano original ficou em `~/.claude/plans/tidy-inventing-comet.md` — efêmero, fora do controle de versão e invisível para colaboradores/sessões futuras. Versionar dentro de `docs/` torna o roadmap auditável (cada mudança vira commit) e descobrível (próxima sessão do Claude Code lê o `CLAUDE.md`, segue o link, e sabe exatamente onde parou e o que vem). Estrutura por etapa-atômica (em vez de "PR gigante") respeita o pedido do usuário por foco total em uma sessão de cada vez.

## [2026-05-27] feature | Scaffold da extensão Chrome MV3 (Etapa 1/12 do roadmap de implementação)

Criado o diretório `extension/` (irmão de `backend/`), inicializando o código produtivo do projeto após a conclusão das fases de Exposição (4/4), Composição (3/3) e 3/5 do Ensaio. Esta é a **Etapa 1 (Fundação)** de um roadmap de 12 etapas — o objetivo é apenas carregar uma extensão MV3 vazia no Chrome, sem nenhuma feature de negócio.

**Stack adotada:**
- **TypeScript** — para tipar o protocolo de mensagens `chrome.runtime` entre os 4 contêineres do C4 (`canvas_c4_model.md`). É onde extensões MV3 mais falham em silêncio.
- **Vite 5.4 + `@crxjs/vite-plugin` 2.0-beta** — único combo que processa `manifest.json` para MV3 corretamente (entry points separados para SW, content script, popup) e oferece HMR no popup.
- **React 18.3** — apenas no popup/options/sidebar (3 views previstas no C4: Capture, ADR Editor com 8 campos, History). **Service Worker e Content Scripts continuam TS puro**, sem React.
- **`@types/chrome`** — força autocomplete e erro de compilação para APIs MV3 não existentes.

**Decisão de segurança sobre API key do Gemini:** será armazenada em `chrome.storage.session` (memória, some quando o Chrome fecha) em vez de `chrome.storage.local` (plain text em disco). UX: usuário re-cola a chave 1x por sessão do Chrome. Tradeoff aceito porque a extensão é usada pontualmente ao fim de reuniões, não dezenas de vezes/dia. Alternativas avaliadas e descartadas: `storage.sync` (vai pro Google sync, pior), OAuth/Vertex AI (exige provisionamento GCP pelo usuário, fora do MVP), AES-GCM com senha mestre (adicionaria meia etapa só para criar a UX de senha — fica como evolução pós-MVP).

**Estrutura criada:**
- `extension/package.json`, `tsconfig.json`, `vite.config.ts`
- `extension/src/manifest.json` — Manifest V3 mínimo, **sem permissões adicionais** (princípio do menor privilégio — `host_permissions`, `tabCapture`, `storage` entram apenas nas etapas que os exigirem)
- `extension/src/background/service_worker.ts` — só `console.log` de boot
- `extension/src/popup/{index.html, main.tsx, App.tsx, App.css}` — popup React exibindo nome e versão lidos via `chrome.runtime.getManifest()`
- `.gitignore` atualizado para ignorar `extension/node_modules/`, `extension/dist/` e `extension/.vite/`

**Ícones omitidos do manifest:** `icons` e `action.default_icon` são opcionais em MV3 — Chrome usa um genérico. Adicionar ícones definitivos fica para a etapa de UI/branding, evitando trabalho descartável agora.

**Justificativa:** após semanas de documentação (Exposição → Composição → 3/5 Ensaio), o projeto precisava ter código rodando para validar que os contêineres do C4 são exequíveis dentro das restrições reais do MV3 (service worker efêmero, CSP estrita, sem `eval`, sem inline scripts). Começar pela Fundação — extensão carregando vazia — em vez de pular para o pipeline completo dá base sólida para as próximas 11 etapas, cada uma terminando com uma saída testável manualmente. As próximas etapas estão documentadas no plano `~/.claude/plans/tidy-inventing-comet.md`.

## [2026-05-27] ingest | Checklist de Análise de Riscos de IA e Canvas de Testes e Validação (fase Ensaio, 3/5)

Criados dois novos artefatos da fase **Ensaio** seguindo os templates oficiais do Sinfonia (`AI_Risk_Analysis_and_Defensibility_Checklist.md` e `Testing_and_Validation_Model_Canvas_Template.md`). Conduzidos como etapas separadas: primeiro o checklist de riscos, depois o canvas de testes, para que os IDs de mitigação do primeiro pudessem ser referenciados pelos casos de teste do segundo.

**`docs/03_ensaio/checklist_analise_riscos_ia.md`** — preenche as 6 seções do template (Justiça e Viés, Privacidade e Dados, Segurança e Robustez, Transparência e Explicabilidade, Matriz de Priorização, Plano de Mitigação). Mapeia **19 riscos** classificados por Impacto × Probabilidade e detalha **plano de mitigação para os 7 críticos**: P1 (PII sem consentimento), P2 (vazamento via Gemini), S1 (prompt injection), T1 (confusão IA × decisão), P3 (retenção de transcrições brutas), F1 (viés de sotaque) e S6 (perda do Service Worker MV3). Cada mitigação tem responsável e caso de teste de verificação correspondente.

**`docs/03_ensaio/canvas_testes_validacao.md`** — preenche as 10 seções do template (Objetivo, Tipos, Casos, Critérios, Ferramentas, Equipe, Resultados, Reteste, Monitoramento, Feedback). Documenta **8 categorias de teste** (FUNC, IA, SEG, PRIV, UX, ROB, PERF, COMPAT) com **41 casos de teste tabulados** (entrada, ação, resultado esperado), critérios Go/No-Go binários para LGPD/segurança e ≥90% para IA, e política de monitoramento *local-first* (zero telemetria para servidores próprios — coerente com a decisão arquitetural de zero backend). Os 7 riscos críticos do checklist têm caso de teste correspondente: `T-UX-02` (P1), `T-FUNC-08` (P2), `T-SEG-01` (S1), `T-FUNC-06` (T1), `T-PRIV-01` (P3), `T-FUNC-07` (F1), `T-ROB-02` (S6). Os 3 experimentos pendentes do `canvas_design_experimentos.md` viram casos de teste: `T-FUNC-05` (ausência de decisão), conjunto FUNC+ROB+UX (captura ponta-a-ponta), `T-FUNC-03` (refinamento por seção).

**Justificativa:** com o C4 estabelecido, a fase de Ensaio precisa ancorar o **lado de defensabilidade** do produto — sem o checklist de riscos, decisões críticas como "transcrição apaga após geração" ficariam implícitas no código sem registro de *por que* foram tomadas; e sem o canvas de testes, a verificação dessas decisões seria informal. Manter os dois artefatos referenciados entre si (riscos → casos de teste pelos IDs `T-*`) cria rastreabilidade auditável: para qualquer decisão de produto há um risco identificado, uma mitigação proposta e um teste que verifica a mitigação. Restam dois artefatos para concluir a fase: Intelligence Strategy Record (aprofunda o `Gemini API Client` + `Prompt Manager` do C4) e Checklist de Lançamento.

## [2026-05-27] ingest | Modelo C4 da arquitetura técnica (fase Ensaio, 1/5)

Criado o primeiro artefato da fase **Ensaio**: `docs/03_ensaio/canvas_c4_model.md`, seguindo o template oficial `C4_Model_Canvas_Template.md` do Sinfonia (3 níveis: Contexto, Contêiner, Componente, cada um com Título / Elementos / Legenda).

**Conteúdo:**
- **Nível 1 — Contexto:** 3 atores (Rafael, Camila, Bruno), sistema principal (extensão Chrome MV3) e 5 sistemas externos (Google Meet, Web Speech API, Google Gemini API, Armazenamento Local, GitHub). Destaca que a Gemini API é o **único ponto de tráfego externo** — fato crítico para os artefatos de Análise de Riscos e Intelligence Strategy Record.
- **Nível 2 — Contêineres:** 4 contêineres (Content Script, Popup/Sidebar UI, Background Service Worker MV3, Banco de Dados Local IndexedDB) com tecnologia, responsabilidade e interações via `chrome.runtime.sendMessage`.
- **Nível 3 — Componentes:** 11 componentes internos divididos entre Background Service Worker (8 — Meeting Controller, Transcription Orchestrator, Prompt Manager, Gemini API Client, Data Parser/Validator, Refinement Engine, Storage Repository, Markdown Formatter) e UI (3 — Capture View, ADR Editor View, History View), com fluxo ponta-a-ponta de geração de ADR descrito em 10 passos.
- Inclui **diagramas Mermaid** para cada nível e uma seção de **Decisões Arquiteturais Implícitas** que adianta material para o Intelligence Strategy Record.

**Substitui e amplia** `c4_model.md` (na raiz do projeto, material legado de outros integrantes): preserva a decomposição original em 3 níveis e o conjunto de componentes propostos, mas reformata para o template Sinfonia, adiciona `Refinement Engine` (suporte à Ideia G do canvas de ideação), separa `Markdown Formatter` como componente próprio, formaliza a `UI` em 3 views (Capture/Editor/History) e adiciona diagramas Mermaid, legendas e referências cruzadas para todos os artefatos das fases anteriores.

**Removido:**
- `c4_model.md` (raiz do projeto) — conteúdo integrado e expandido em `docs/03_ensaio/canvas_c4_model.md`.

**Justificativa:** com a fase de Composição concluída e o pipeline central validado, o C4 é o ponto natural de entrada da fase de Ensaio — ele estabelece o vocabulário arquitetural (contêineres, componentes) sobre o qual os próximos artefatos vão se apoiar: a Análise de Riscos de IA precisa enumerar pontos de tráfego e persistência (Nível 1/2); o Intelligence Strategy Record vai se aprofundar no `Gemini API Client` e no `Prompt Manager` (Nível 3); o Canvas de Testes e Validação vai mapear suítes por contêiner/componente. Materializar o C4 cedo evita inconsistências de nomenclatura nos artefatos seguintes.

## [2026-05-27] ingest | Documentação completa da fase de Composição (3 canvases)

Criados os três artefatos prescritos pela fase **Composição** do Sinfonia, completando-a (3/3 ✅). Templates oficiais consultados: `Solution_Ideation_Model_Canvas_Template.md`, `Prompt_Design_Record_Model_Canvas_Template.md`, `Experiment_Design_Model_Canvas_Template.md`.

**`docs/02_composicao/canvas_ideacao_solucao.md`** — partindo do problema definido na fase de Exposição, foram brainstormadas 7 ideias de solução (A–G), posicionadas em matriz de **impacto × esforço**, e a ideia vencedora foi formalizada: **Extensão Chrome Manifest V3 + Gemini API + zero backend + persistência local**, complementada por refinamento por seção. Inclui critérios de avaliação e justificativa do veredito.

**`docs/02_composicao/prompt_design_record.md`** — registro de engenharia de prompt em 7 seções (metadados, estrutura, resposta, testes/qualidade, notas, histórico de versões, próximos passos). Documenta a versão **v2.0** em produção (Role Prompting + Chain-of-Thought via campo `analise_passo_a_passo` + Few-Shot + `responseSchema` forçado, `temperature: 0`, modelo `gemini-3-flash-preview`) e a **v1.0** descartada (zero-shot baseline com alucinação elevada). Inclui critérios de aceitação tabulados, parâmetros da API justificados e riscos conhecidos com mitigações. **Substitui e amplia** o `catalogo_de_prompts.md` antes na raiz do projeto.

**`docs/02_composicao/canvas_design_experimentos.md`** — formaliza o experimento já executado (transcrição real de ~35K caracteres sobre Microsoft Garnet vs Redis para o Engage Kiosk do Sebrae PE) seguindo o formato Sinfonia (hipótese, desenho, métricas, critérios pivotar/perseverar, resultado). Hipótese **validada** — todos os critérios atendidos. Inclui ainda 3 experimentos pendentes desenhados para a fase de Ensaio (ausência de decisão, captura via Web Speech API ponta-a-ponta, refinamento por seção). **Substitui e amplia** o `canvas_de_experimento.md` antes na raiz do projeto.

**Removidos da raiz do projeto:**
- `catalogo_de_prompts.md` — material legado de outros integrantes, conteúdo integrado e expandido no `prompt_design_record.md`.
- `canvas_de_experimento.md` — material legado de outros integrantes, conteúdo integrado e expandido no `canvas_design_experimentos.md`.

**Removido:**
- `docs/02_composicao/README.md` (placeholder) — substituído pelos próprios artefatos da fase, seguindo a mesma convenção de `01_exposicao/` (sem README intermediário).

**Justificativa:** com a fase de Exposição já completa e a PoC do backend validada, era hora de formalizar **o quê** estamos construindo (Ideação), **como** o componente de IA é montado (Prompt Design Record) e **como provamos** que funciona (Design de Experimentos). Sem esses artefatos, a transição para a fase de Ensaio seria feita sem fundamentação documentada, perdendo rastreabilidade do racional de design. Adicionalmente, materiais soltos na raiz (`catalogo_de_prompts.md`, `canvas_de_experimento.md`) feriam o princípio de organização por fase e duplicavam informação — foram incorporados aos canvases oficiais e excluídos.

## [2026-05-27] ingest | Canvas de Identificação do Domínio e Canvas de Mapeamento de Fontes de Dados (fase Exposição)

Criados os dois artefatos restantes da fase **Exposição** seguindo os templates oficiais do Sinfonia (`templates/Domain_Identification_Model_Canvas_Template.md` e `templates/Data_Source_Mapping_Model_Canvas_Template.md`).

**`docs/01_exposicao/canvas_identificacao_dominio.md`** — 7 seções do template preenchidas para o contexto do ADR Generator:
- Domínio: "Documentação de Decisões Arquiteturais em Engenharia de Software".
- Justificativa apoiada em três fatores: alto impacto / baixa adesão histórica de ADRs, adequação à extração estruturada via LLM, e viabilidade técnica imediata (Web Speech API + `responseSchema` do Gemini).
- Oportunidades de IA documentadas incluem CoT + few-shot (já validados em `backend/indexAllShot.js`), detecção de decisões implícitas e refinamento por seção.
- Riscos: LGPD (mitigado por processamento local), alucinação (mitigado por `temperature: 0` + schema forçado), custo de tokens (cap de 30K chars), dependência de fornecedor único e limitações do Manifest V3.

**`docs/01_exposicao/canvas_mapeamento_fontes_dados.md`** — 4 fontes de dados identificadas, cada uma com as 12 dimensões do template + tabela consolidada:
1. **Transcrição da reunião no Google Meet** — única fonte com conteúdo novo a cada uso; risco LGPD alto, mitigado por processamento local; cap de 30K caracteres.
2. **Exemplos de ADR para few-shot prompting** — embarcados no código, versionados, anonimizados.
3. **Schema JSON do ADR (padrão Michael Nygard)** — estável, parte do contrato com a Gemini.
4. **Histórico local de ADRs** — persistido em `chrome.storage.local` / IndexedDB, sob propriedade do usuário final.

**Justificativa:** sem esses dois artefatos, a fase de Exposição estava incompleta (faltavam 2 dos 4 canvases prescritos pelo Sinfonia) e as fases subsequentes (Composição, Ensaio) não teriam base sólida para serem produzidas — o canvas de Mapeamento de Fontes de Dados em particular alimenta diretamente o Intelligence Strategy Record (Ensaio) e o Prompt Design Record (Composição).

## [2026-05-27] migration | Reestruturação de docs/ em pastas por fase Sinfonia

Reorganização do diretório `docs/` para refletir as 4 fases cíclicas da metodologia Sinfonia (Exposição, Composição, Ensaio, Ressonância).

**Movimentações via `git mv` (histórico preservado):**
- `docs/personas_adr_generator.md` → `docs/01_exposicao/canvas_personas.md`
- `docs/canvas_estrategia_adr_generator.md` → `docs/01_exposicao/canvas_estrategia_acao.md`

**Estrutura nova:**
```
docs/
├── README.md                ← índice das 4 fases com status por artefato
├── log.md                   ← este arquivo
├── 01_exposicao/            ← 4 canvases (todos preenchidos)
├── 02_composicao/README.md  ← placeholder com artefatos previstos
├── 03_ensaio/README.md      ← placeholder
└── 04_ressonancia/README.md ← placeholder
```

**Edição em `canvas_estrategia_acao.md`:** removidas as subseções inline **8.1 (Canvas de Identificação do Domínio)** e **8.2 (Mapeamento de Fontes de Dados)** — eram resumos breves que agora viraram documentos dedicados na mesma pasta. Substituídas por links cruzados para `canvas_identificacao_dominio.md` e `canvas_mapeamento_fontes_dados.md`, evitando duplicação de informação.

**Justificativa:** os arquivos originais usavam nomes não padronizados (`personas_adr_generator`, `canvas_estrategia_adr_generator`) e estavam soltos na raiz de `docs/`. Sem uma estrutura por fase, novos artefatos do Sinfonia não tinham lugar natural para serem inseridos e a navegação ficaria caótica conforme o projeto avançasse pelas 14 entregas previstas pela metodologia. Os placeholders nas pastas das fases futuras servem de checklist visível de "o que ainda falta" no projeto.

## [2026-05-27] decision | Adoção da metodologia Sinfonia (AssertLab) como espinha dorsal da documentação

A documentação do projeto passa a seguir a metodologia [**Sinfonia**](https://github.com/assertlab/sinfonia) (AssertLab), que organiza o desenvolvimento de produtos de IA generativa em 4 fases cíclicas com 14 artefatos prescritos:

- **Exposição** (Alignment) — 4 canvases: Identificação do Domínio, Personas, Mapeamento de Fontes de Dados, Estratégia e Ação.
- **Composição** (Design) — 3 artefatos: Ideação da Solução, Prompt Design Record, Design de Experimentos.
- **Ensaio** (Build & Test) — 5 artefatos: C4 Model, Intelligence Strategy Record, Análise de Riscos de IA, Testes e Validação, Checklist de Lançamento.
- **Ressonância** (Measure & Learn) — 3 artefatos: Métricas de Impacto, Planejamento de Escalabilidade, Painel de Feedback.

**Justificativa:** o projeto já tinha 2 canvases produzidos de maneira ad-hoc (personas e estratégia), mas sem framework de referência para guiar o que produzir a seguir, nem garantia de que estavam cobrindo as dimensões necessárias para um produto de IA generativa. Sinfonia oferece templates curados especificamente para esse tipo de produto (IA gen), com forte ênfase em mapeamento de riscos, design de prompts e validação — tópicos críticos para um produto como o ADR Generator que depende centralmente de um LLM. Adoção também facilita comunicação com stakeholders acadêmicos/AssertLab que conhecem a metodologia.

**Estado de adesão pós-decisão:** fase Exposição completa (4/4 canvases). Demais fases pendentes, com placeholders documentando os artefatos previstos.
