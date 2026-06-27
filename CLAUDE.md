# CLAUDE.md

Guia para Claude Code (claude.ai/code) trabalhar neste repositório.

## Projeto

**ADR Generator** — extensão Chrome (Manifest V3) que captura transcrição de reuniões no Google Meet e gera Architecture Decision Records (ADRs) estruturados via Google Gemini API. MVP zero-backend, armazenamento local no navegador, processamento aderente a LGPD.

Estado atual: **MVP completo — Etapas 1–12/12 concluídas** (captura por legendas do Meet → geração via Gemini → editor com refino por seção → histórico → export `.md`; endurecimento S1/T1/P3 aplicado). Testes manuais no Chrome pendentes. PoC backend (`backend/indexAllShot.js`) continua como referência canônica do prompt e schema do Gemini. Roadmap das 12 etapas em [`docs/roadmap_implementacao.md`](./docs/roadmap_implementacao.md).

## Estrutura do Diretório

```
ADR_Generator/
├── CLAUDE.md                  ← este arquivo
├── README.md
├── backend/                   ← PoCs Node.js validando integração Gemini
│   ├── index.js               ← extração direta com SchemaType enums
│   ├── indexAllShot.js        ← CoT + few-shot (estratégia preferida)
│   ├── archives/              ← transcrições de teste
│   └── package.json
├── extension/                 ← extensão Chrome MV3 (Vite + crxjs + React + TS)
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── manifest.json
│       ├── background/        ← service worker (TS puro, sem React)
│       ├── content/           ← content script + recording overlay no Meet (TS puro)
│       ├── popup/             ← UI React (Capture / History / Settings)
│       └── page/              ← UI React em aba full-screen (Editor / revisão da transcrição)
└── docs/                      ← base de documentação (metodologia Sinfonia)
    ├── README.md              ← índice das 4 fases
    ├── log.md                 ← registro temporal append-only
    ├── roadmap_implementacao.md  ← plano-mestre das 12 etapas
    ├── 01_exposicao/          ← canvases preenchidos
    ├── 02_composicao/         ← canvases preenchidos
    ├── 03_ensaio/             ← 3 de 5 artefatos preenchidos
    └── 04_ressonancia/
```

## Stack

- **Linguagem (PoC):** Node.js (ESM, `"type": "module"`)
- **LLM:** Google Gemini via `@google/generative-ai` (^0.11.5), modelo `gemini-3-flash-preview`, `temperature: 0`, `responseMimeType: "application/json"` + `responseSchema`
- **Env:** `dotenv` (^16.6.1), arquivo `backend/.env` com `GEMINI_API_KEY`
- **Extensão (em construção):** Manifest V3, Vite 5.4 + `@crxjs/vite-plugin` 2.0-beta, React 18.3 (popup + página full-screen em aba para Editor/revisão; configurações são uma aba do popup, não há mais options page standalone), TypeScript 5.6, captura via leitura das legendas (CC) do Meet no DOM com `MutationObserver` (Etapa 6), `chrome.storage.session` (API key — Etapa 3) + IndexedDB (ADRs — Etapa 5), Gemini via `fetch` direto no service worker (Etapa 4)
- **Padrão de ADR:** Michael Nygard (campos: `titulo`, `contexto`, `problema`, `alternativas`, `decisao`, `consequencias`, `incertezas`, `analise_passo_a_passo`)
- **Cap de contexto:** 30.000 caracteres por sessão (~7.500 tokens)

## Rodando o PoC backend

```bash
cd backend
npm install
node --env-file=.env index.js          # versão básica
node --env-file=.env indexAllShot.js   # CoT + few-shot (preferida)
```

## Rodando a extensão (dev)

```bash
cd extension
npm install
npm run dev                            # Vite + crxjs em watch, escreve em extension/dist/
```

Depois em `chrome://extensions/`: ativa Modo dev → **Carregar sem compactação** → seleciona `extension/dist/`. Recarregue o card (↻) após primeiro `npm run dev`. Veja `docs/roadmap_implementacao.md` para detalhes da config Vite e troubleshooting do binding IPv6 + CORS no Windows.

## Onde Buscar Conhecimento

A documentação segue a metodologia [Sinfonia](https://github.com/assertlab/sinfonia) (4 fases cíclicas, 14 artefatos). **Antes de implementar qualquer coisa, consulte os documentos da fase relevante:**

- **Visão geral e estado de cada fase:** [`docs/README.md`](./docs/README.md)
- **Roadmap das 12 etapas de implementação da extensão:** [`docs/roadmap_implementacao.md`](./docs/roadmap_implementacao.md) — leitura obrigatória antes de codar; cada etapa lista tarefas, critério de pronto e riscos mitigados
- **Domínio, personas, fontes de dados, estratégia:** [`docs/01_exposicao/`](./docs/01_exposicao/) — leitura obrigatória para qualquer tarefa de produto
- **Design de prompt e experimentos:** [`docs/02_composicao/`](./docs/02_composicao/) — `prompt_design_record.md` é a fonte canônica do system instruction e do schema dos 8 campos
- **Arquitetura técnica (C4), riscos de IA, testes:** [`docs/03_ensaio/`](./docs/03_ensaio/) — `canvas_c4_model.md` define os 4 contêineres e 14 componentes (inclui Recording Overlay no Content Script, e a página Full-page em aba que hospeda o Editor/revisão fora do popup); `checklist_analise_riscos_ia.md` enumera os 7 riscos críticos (P1, P2, S1, T1, P3, F1, S6) com IDs de teste rastreáveis
- **Métricas, escalabilidade, feedback:** [`docs/04_ressonancia/`](./docs/04_ressonancia/) _(a produzir)_
- **Histórico de mudanças na documentação e racional das decisões:** [`docs/log.md`](./docs/log.md) — consultar antes de grandes mudanças para evitar retrabalho

## Como Atualizar a Documentação

1. **Identifique a fase** do artefato (Exposição / Composição / Ensaio / Ressonância) e coloque o arquivo na pasta correspondente (`docs/0X_<fase>/`).
2. **Use os templates oficiais** do Sinfonia como ponto de partida: `https://github.com/assertlab/sinfonia/tree/main/templates`.
3. **Nomeie** o arquivo no padrão `canvas_<nome_curto>.md` (ex.: `canvas_ideacao_solucao.md`).
4. **Registre a mudança** em [`docs/log.md`](./docs/log.md) **na mesma alteração**, no topo do arquivo, no formato:
   ```
   ## [YYYY-MM-DD] tipo | descrição
   ```
   Tipos permitidos: `feature`, `refactor`, `fix`, `decision`, `migration`, `deprecation`, `ingest`. Inclua o que mudou **e a justificativa** (por que, não só o quê).
5. **Atualize o checklist de status** em [`docs/README.md`](./docs/README.md) marcando o artefato como concluído (✅).
6. **Cruze referências** quando o conteúdo se sobrepor a outro canvas — prefira link entre documentos a duplicar informação (ver `canvas_estrategia_acao.md` referenciando os canvases de domínio e fontes de dados).
