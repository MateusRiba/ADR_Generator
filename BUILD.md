# BUILD — ADR Generator

Instruções de build, execução e empacotamento dos dois componentes do projeto:

- **`extension/`** — a aplicação (extensão Chrome Manifest V3) — *o entregável principal*.
- **`backend/`** — PoC Node.js que valida a integração com a Gemini API (referência canônica do prompt/schema).

> Documentação completa em [`docs/`](./docs/) (metodologia Sinfonia). Guia de uso da extensão e *troubleshooting* no [`README.md`](./README.md).

---

## 1. Pré-requisitos

| Ferramenta | Versão | Observação |
|---|---|---|
| **Node.js** | 18+ (testado em 20.x) | inclui `npm` |
| **Google Chrome** | atualizado | Manifest V3 estável |
| **API key do Gemini** | — | obtenha em <https://aistudio.google.com/apikey> |
| **Git** | qualquer recente | clonar o repositório |

Verifique o ambiente:

```bash
node -v   # deve imprimir v18+ (ideal v20.x)
npm -v
```

Clone o repositório:

```bash
git clone https://github.com/MateusRiba/ADR_Generator.git
cd ADR_Generator
```

---

## 2. Extensão Chrome (aplicação principal)

Stack: TypeScript 5.6 · Vite 5.4 · `@crxjs/vite-plugin` 2.0-beta · React 18.3.

### 2.1 Instalar dependências

```bash
cd extension
npm install
```

### 2.2 Modo desenvolvimento (watch + HMR)

```bash
npm run dev
```

- Sobe o Vite + crxjs em *watch mode*, escrevendo o bundle em `extension/dist/` continuamente.
- **Mantenha esse terminal aberto** — o popup React depende do dev server para HMR.
- O dev server é fixado em `localhost:5173` (`vite.config.ts`) para evitar o bug de *binding* IPv6 + CORS no Windows. Não altere o host sem manter `localhost` explícito.

### 2.3 Build de produção

```bash
npm run build      # = tsc --noEmit && vite build
```

- Roda o *type-check* (`tsc --noEmit`) e gera `extension/dist/` estático, **sem** dev server.
- É o comando de verificação usado a cada etapa do projeto ("build verde").

A saída em `dist/` contém o `manifest.json` processado, o service worker, o content script, o popup e a página em aba (`src/page/index.html`, declarada em `rollupOptions.input.page`).

### 2.4 Carregar no Chrome (extensão *unpacked*)

1. Abra `chrome://extensions/`.
2. Ative o **Modo de desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta **`extension/dist/`**.
5. Clique no ícone da extensão na toolbar — o popup deve abrir mostrando "ADR Generator v0.0.1".

> Após o **primeiro** `npm run dev`, recarregue o card da extensão (botão ↻) em `chrome://extensions/`.
> Para inspecionar o service worker, clique no link **service worker** no card — o DevTools abre com `[SW] booted at <timestamp>`.

### 2.5 Permissões declaradas (princípio do menor privilégio)

O `manifest.json` declara apenas o necessário:

- `permissions`: `storage` (API key em `chrome.storage.session`), `scripting` (injeção sob demanda do content script).
- `host_permissions`: `https://generativelanguage.googleapis.com/*` (único tráfego externo — Gemini) e `https://meet.google.com/*` (leitura das legendas).

### 2.6 Empacotar para distribuição (opcional)

A extensão é distribuída *unpacked* (validação acadêmica) — não há publicação na Chrome Web Store. Para gerar um `.zip` da pasta buildada:

```bash
cd extension
npm run build
cd dist && zip -r ../adr-generator-v0.0.1.zip . && cd ..
```

---

## 3. PoC Backend (validação da Gemini API)

Útil para iterar no prompt sem recarregar o Chrome. Não faz parte do runtime da extensão.

### 3.1 Instalar dependências

```bash
cd backend
npm install
```

### 3.2 Configurar a chave da API

Crie o arquivo `backend/.env`:

```
GEMINI_API_KEY=sua_chave_aqui
```

> `.env` está no `.gitignore` — **nunca** comite a chave.

### 3.3 Executar

```bash
node --env-file=.env index.js          # extração direta com SchemaType enums
node --env-file=.env indexAllShot.js   # CoT + few-shot (estratégia preferida — referência do prompt v2.0)
```

A transcrição de teste fica em `backend/archives/` (`trancriptionTest.txt`, ~36 KB — caso Garnet × Redis). O ADR resultante é impresso em JSON no stdout.

> **Nota:** `indexAllShot.js` contém um caminho de arquivo absoluto Windows na linha de leitura da transcrição — ajuste para o seu ambiente (ex.: `await fs.readFile('./archives/trancriptionTest.txt', 'utf8')`) antes de executar.

---

## 4. Testes e validação

Não há suíte automatizada nem CI no escopo atual (débito conhecido — ver [`docs/03_ensaio/canvas_testes_validacao.md`](./docs/03_ensaio/canvas_testes_validacao.md)). A validação é **manual assistida**, registrada em relatórios datados:

- Plano de testes (41 casos, 8 categorias): [`docs/03_ensaio/canvas_testes_validacao.md`](./docs/03_ensaio/canvas_testes_validacao.md)
- Relatório de execução (23/23 aprovados): [`extension/reports/2026-06-27_test_run.md`](./extension/reports/2026-06-27_test_run.md)
- Evidências (`.md` gerados): `extension/reports/evidence/`

Verificação mínima de sanidade do build:

```bash
cd extension && npm run build   # type-check + bundle devem passar sem erro
```

---

## 5. Troubleshooting

| Sintoma | Causa / Solução |
|---|---|
| `Cannot connect to http://localhost:5173` no popup | `npm run dev` não está ativo, ou o card precisa ser recarregado (↻) em `chrome://extensions/`. |
| Vite binda só em IPv6 (`[::1]:5173`) no Windows | `vite.config.ts` já força `host: "localhost"`; mantenha-o explícito se editar a config. |
| Erro de CORS no popup | reinicie `npm run dev` e recarregue a extensão (o crxjs injeta o `Access-Control-Allow-Origin`). |
| Mudanças no service worker não refletem | alterações em `src/background/` exigem recarregar o card (HMR só vale para o popup React). |
| "Nenhuma aba do Google Meet ativa" / contador não sobe | entre numa reunião do Meet e **ligue as legendas (CC)**; se persistir, valide os seletores em `src/content/meet_capture.ts` (`CONTAINER_SELECTORS`) contra o DOM real. |
| "Recarregue a extensão (SW desatualizado)" | em MV3 o service worker não recarrega sozinho após rebuild — recarregue o card. |

---

*Para o guia de uso da extensão (passo a passo no Meet), limitações conhecidas e tecnologias, ver [`README.md`](./README.md).*
