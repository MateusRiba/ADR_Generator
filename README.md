# ADR Generator

Extensão para Google Chrome que captura transcrições de reuniões no Google Meet e gera **Architecture Decision Records (ADRs)** estruturados automaticamente usando a API do Google Gemini.

## Status

> **MVP completo — Etapas 1–12/12 concluídas.** Fluxo ponta a ponta funcional: captura no Meet → geração via Gemini → edição/refino → histórico → export `.md`. O PoC backend em `backend/` continua como referência canônica do prompt e schema do Gemini. Roadmap das 12 etapas em [`docs/roadmap_implementacao.md`](./docs/roadmap_implementacao.md).

## Como funciona

1. A extensão lê as **legendas (closed captions) do Google Meet** direto do DOM — captura a fala de todos os participantes usando o STT do próprio Google
2. Ao final, a transcrição acumulada é enviada à API do Gemini com um prompt estruturado (CoT + few-shot + `responseSchema`)
3. A IA extrai um ADR no padrão Michael Nygard (Título, Contexto, Problema, Alternativas, Decisão, Consequências, Incertezas, Análise passo a passo)
4. O ADR pode ser editado campo a campo, refinado pela IA e exportado como `.md`
5. A transcrição bruta é apagada imediatamente após a geração; só o ADR estruturado fica salvo localmente

## Pré-requisitos

- **Node.js** 18+ (testado com 20.x)
- **Google Chrome** atualizado (Manifest V3 estável)
- **API key do Gemini** — obtenha em [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

## Rodando o PoC backend

Valida a integração com a Gemini API fora do contexto da extensão. Útil para iterar no prompt sem recarregar o Chrome.

```bash
cd backend
npm install
```

Crie um arquivo `backend/.env`:

```
GEMINI_API_KEY=sua_chave_aqui
```

Execute uma das versões:

```bash
node --env-file=.env index.js          # extração direta com SchemaType enums
node --env-file=.env indexAllShot.js   # CoT + few-shot (estratégia preferida)
```

A transcrição de teste fica em `backend/archives/`. O resultado é impresso em JSON no stdout.

## Rodando a extensão (dev)

```bash
cd extension
npm install
npm run dev
```

O `npm run dev` sobe o Vite + crxjs em watch mode, escrevendo o bundle em `extension/dist/` continuamente. **Mantenha esse terminal aberto** — o popup precisa do dev server rodando para HMR.

Depois, carregue a extensão no Chrome:

1. Abra `chrome://extensions/`
2. Ative **Modo de desenvolvedor** (toggle no canto superior direito)
3. Clique em **Carregar sem compactação**
4. Selecione a pasta `extension/dist/`
5. Clique no ícone da extensão na toolbar — o popup deve abrir mostrando "ADR Generator v0.0.1"

Para verificar o service worker, clique no link **service worker** dentro do card da extensão em `chrome://extensions/`. O DevTools abre com `[SW] booted at <timestamp>` no console.

### Build de produção

```bash
cd extension
npm run build      # roda tsc --noEmit e gera dist/ estático sem dev server
```

Útil para validar o type-check e empacotar a extensão sem HMR.

## Usando a extensão

1. **Configure a API key** — clique no ícone da extensão → "Abrir configurações" → cole a chave da Gemini → "Salvar". A chave fica em memória (`chrome.storage.session`) e **some quando você fecha o Chrome** — re-cole a cada sessão.
2. **Entre na reunião do Meet e ligue as legendas (CC)** — a extensão lê as legendas do DOM; sem elas, não há o que capturar.
3. **Abra o popup → aba Captura → "Iniciar captura"** — confirme o consentimento (avisar os participantes é obrigatório) e a captura começa. O contador de caracteres sobe conforme as legendas aparecem.
4. **"Parar captura" → "Gerar ADR"** — em ~5–15s o ADR aparece na aba Editor. A transcrição bruta é apagada nesse momento.
5. **Edite os campos** inline; use **"Melhorar…"** em qualquer campo para regenerá-lo com uma instrução (ex.: "expanda o contexto"). As mudanças salvam sozinhas.
6. **"Exportar .md"** baixa o ADR em Markdown (padrão Nygard) para commit manual no seu repositório.
7. **Aba Histórico** lista os ADRs salvos, com busca por título, reabertura, export e exclusão.

## Limitações conhecidas

- **Depende das legendas do Meet.** Se o Google mudar a marcação (classes/`aria-label`) do contêiner de legendas, a captura para de funcionar até o seletor em `extension/src/content/meet_capture.ts` (`CONTAINER_SELECTORS`) ser atualizado.
- **Viés de transcrição (F1).** O STT automático erra com sotaques regionais e termos técnicos misturando português/inglês ("redis cluster", "trade-off"). **Sempre revise o ADR antes de versionar.**
- **Conteúdo gerado por IA (T1).** Todo `.md` exportado leva `ai_generated: true` no front-matter e o rodapé "Gerado por IA — revisar antes de versionar". O ADR reflete o que a IA extraiu, não uma decisão humana validada.
- **Cap de contexto.** A transcrição é limitada a 30.000 caracteres por sessão (~7.500 tokens); reuniões muito longas são truncadas.
- **Privacidade (LGPD).** O único envio externo é o trecho de transcrição → Gemini (HTTPS). Nada é enviado a servidores próprios (zero backend). O consentimento dos participantes é responsabilidade do usuário — a extensão exige a confirmação a cada captura.
- **Prompt injection (S1).** A transcrição é tratada como dado entre delimitadores; comandos embutidos na fala ("ignore as instruções…") são instruídos a serem ignorados, mas nenhuma mitigação de LLM é 100%.

### Troubleshooting

- **"Cannot connect to http://localhost:5173" no popup** — confirme que `npm run dev` está ativo em um terminal e recarregue a extensão em `chrome://extensions/` clicando no ícone circular ↻ do card.
- **Vite binda só em IPv6 (`[::1]:5173`) no Windows** — `vite.config.ts` já força `host: "127.0.0.1"` para evitar isso. Se mudar a config, mantenha esse host explícito.
- **Erro de CORS no popup** — `crxjs` injeta o `Access-Control-Allow-Origin` automaticamente; se aparecer, reinicie o `npm run dev` e recarregue a extensão.
- **Mudanças no service worker não refletem** — alterações em `src/background/` exigem recarregar o card no `chrome://extensions/` (HMR só funciona no popup React).

## Tecnologias

- **Extensão:** Chrome Manifest V3, Vite 5.4 + `@crxjs/vite-plugin` 2.0-beta, React 18.3, TypeScript 5.6
- **LLM:** Google Gemini API (`gemini-3-flash-preview`) via `fetch` direto no service worker
- **Captura:** leitura das legendas (CC) do Google Meet via `MutationObserver` no DOM
- **Persistência:** `chrome.storage.session` (API key, em memória) + IndexedDB (ADRs + buffer da transcrição)
- **PoC backend:** Node.js (ESM) + `@google/generative-ai` (^0.11.5) + `dotenv`

## Documentação

A documentação do projeto segue a metodologia [Sinfonia](https://github.com/assertlab/sinfonia) (4 fases: Exposição → Composição → Ensaio → Ressonância) em `docs/`. Veja [`docs/README.md`](./docs/README.md) para o índice e [`CLAUDE.md`](./CLAUDE.md) para o guia de trabalho no repositório.
