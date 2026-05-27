# ADR Generator

Extensão para Google Chrome que captura transcrições de reuniões no Google Meet e gera **Architecture Decision Records (ADRs)** estruturados automaticamente usando a API do Google Gemini.

## Status

> **Em desenvolvimento — Etapa 1/12 concluída.** Scaffold MV3 (Vite + crxjs + React + TypeScript) carrega no Chrome. O PoC backend em `backend/` continua como referência canônica do prompt e schema do Gemini. Roadmap completo das 12 etapas em [`docs/roadmap_implementacao.md`](./docs/roadmap_implementacao.md).

## Como funciona

1. A extensão captura o áudio/transcrição da reunião no Google Meet (Web Speech API)
2. A transcrição é enviada à API do Gemini com um prompt estruturado (CoT + few-shot + `responseSchema`)
3. A IA extrai um ADR no padrão Michael Nygard (Título, Contexto, Problema, Alternativas, Decisão, Consequências, Incertezas, Análise passo a passo)
4. O ADR pode ser editado campo a campo, refinado pela IA e exportado como `.md`

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

### Troubleshooting

- **"Cannot connect to http://localhost:5173" no popup** — confirme que `npm run dev` está ativo em um terminal e recarregue a extensão em `chrome://extensions/` clicando no ícone circular ↻ do card.
- **Vite binda só em IPv6 (`[::1]:5173`) no Windows** — `vite.config.ts` já força `host: "127.0.0.1"` para evitar isso. Se mudar a config, mantenha esse host explícito.
- **Erro de CORS no popup** — `crxjs` injeta o `Access-Control-Allow-Origin` automaticamente; se aparecer, reinicie o `npm run dev` e recarregue a extensão.
- **Mudanças no service worker não refletem** — alterações em `src/background/` exigem recarregar o card no `chrome://extensions/` (HMR só funciona no popup React).

## Tecnologias

- **Extensão:** Chrome Manifest V3, Vite 5.4 + `@crxjs/vite-plugin` 2.0-beta, React 18.3, TypeScript 5.6
- **LLM:** Google Gemini API (`gemini-3-flash-preview`) via `fetch` direto no service worker
- **Captura:** Web Speech API (transcrição em tempo real)
- **Persistência:** `chrome.storage.session` (API key, em memória) + IndexedDB (ADRs)
- **PoC backend:** Node.js (ESM) + `@google/generative-ai` (^0.11.5) + `dotenv`

## Documentação

A documentação do projeto segue a metodologia [Sinfonia](https://github.com/assertlab/sinfonia) (4 fases: Exposição → Composição → Ensaio → Ressonância) em `docs/`. Veja [`docs/README.md`](./docs/README.md) para o índice e [`CLAUDE.md`](./CLAUDE.md) para o guia de trabalho no repositório.
