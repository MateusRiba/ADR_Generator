# CLAUDE.md

Guia para Claude Code (claude.ai/code) trabalhar neste repositório.

## Projeto

**ADR Generator** — extensão Chrome (Manifest V3) que captura transcrição de reuniões no Google Meet e gera Architecture Decision Records (ADRs) estruturados via Google Gemini API. MVP zero-backend, armazenamento local no navegador, processamento aderente a LGPD.

Estado atual: **PoC backend validado** (chamadas Gemini com schema forçado). Código da extensão Chrome ainda não foi escrito.

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
└── docs/                      ← base de documentação (metodologia Sinfonia)
    ├── README.md              ← índice das 4 fases
    ├── log.md                 ← registro temporal append-only
    ├── 01_exposicao/          ← canvases da fase atual
    ├── 02_composicao/
    ├── 03_ensaio/
    └── 04_ressonancia/
```

## Stack

- **Linguagem (PoC):** Node.js (ESM, `"type": "module"`)
- **LLM:** Google Gemini via `@google/generative-ai` (^0.11.5), modelo `gemini-3-flash-preview`, `temperature: 0`, `responseMimeType: "application/json"` + `responseSchema`
- **Env:** `dotenv` (^16.6.1), arquivo `backend/.env` com `GEMINI_API_KEY`
- **Extensão (planejado):** Manifest V3, Web Speech API (captura), `chrome.storage.local` / IndexedDB (persistência), service worker (chamadas API)
- **Padrão de ADR:** Michael Nygard (campos: `titulo`, `contexto`, `problema`, `alternativas`, `decisao`, `consequencias`, `incertezas`, `analise_passo_a_passo`)
- **Cap de contexto:** 30.000 caracteres por sessão (~7.500 tokens)

## Rodando o PoC

```bash
cd backend
npm install
node --env-file=.env index.js          # versão básica
node --env-file=.env indexAllShot.js   # CoT + few-shot (preferida)
```

## Onde Buscar Conhecimento

A documentação segue a metodologia [Sinfonia](https://github.com/assertlab/sinfonia) (4 fases cíclicas, 14 artefatos). **Antes de implementar qualquer coisa, consulte os documentos da fase relevante:**

- **Visão geral e estado de cada fase:** [`docs/README.md`](./docs/README.md)
- **Domínio, personas, fontes de dados, estratégia:** [`docs/01_exposicao/`](./docs/01_exposicao/) — leitura obrigatória para qualquer tarefa de produto
- **Design de prompt e experimentos:** [`docs/02_composicao/`](./docs/02_composicao/) _(a produzir)_
- **Arquitetura técnica (C4), riscos de IA, testes, lançamento:** [`docs/03_ensaio/`](./docs/03_ensaio/) _(a produzir)_
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
