# Canvas de Ideação da Solução
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Composição** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
> Objetivo: a partir do problema definido na fase de Exposição, gerar ideias de solução, priorizá-las por **impacto × esforço** e registrar a opção escolhida para prototipagem.

---

## 1. Problema a Ser Resolvido

Equipes de engenharia identificam, em reuniões síncronas no Google Meet, decisões arquiteturais relevantes — porém, na maioria das vezes, essas decisões **não são registradas como ADRs** após o encontro. O custo cognitivo de retomar a transcrição, lembrar do contexto e escrever o documento estruturado supera o tempo disponível dos engenheiros após reuniões intensas.

Resultado observado nas personas (Rafael — Tech Lead; Camila — Engenheira; Bruno — EM):
- Decisões dispersas em Slack/PR/memória individual.
- Onboarding de novos membros é lento por ausência de rationale histórico.
- Quando o ADR é escrito de memória, alternativas e trade-offs discutidos são perdidos.

> Para contexto completo, ver [`canvas_identificacao_dominio.md`](../01_exposicao/canvas_identificacao_dominio.md) e [`canvas_personas.md`](../01_exposicao/canvas_personas.md).

---

## 2. Ideias de Solução (Brainstorming)

Ideias geradas a partir do problema acima, mantidas como "cards" para posicionamento na matriz:

- **Ideia A — Extensão Chrome que captura transcrição do Meet + geração de ADR por LLM (zero backend).** Captura via Web Speech API ou legendas do Meet, envio direto a uma API de IA generativa (Gemini), persistência local. _É a forma da PoC já validada em `backend/indexAllShot.js`._
- **Ideia B — App web standalone (fora do Meet) com upload manual de transcrição.** Usuário cola/sobe um arquivo `.txt` e recebe o ADR. Sem integração com o Meet.
- **Ideia C — Bot do Google Meet (via Workspace add-on oficial) com backend próprio.** Atua como participante da reunião, salva transcrição em servidor, gera ADR. Requer infra, autenticação e revisão Workspace.
- **Ideia D — Plugin para IDE (VS Code) que gera ADR a partir de notas/comentários no código.** Não usa reunião; gera o ADR a partir de prosa escrita pelo dev.
- **Ideia E — Integração com transcrição oficial do Google Meet (Gemini for Workspace) + Apps Script.** Depende de licença Workspace Enterprise e do Gemini for Workspace estar habilitado.
- **Ideia F — Ferramenta CLI que consome arquivos `.vtt` exportados pelo Meet.** Baixa o `.vtt` após a reunião, processa via LLM e cria o `.md` na pasta `/docs/adr` local. Requer ação pós-reunião.
- **Ideia G — Refinamento por seção dentro do ADR gerado.** Funcionalidade complementar a A: comandos como "expanda alternativas", "melhore o contexto" que regeneram apenas uma seção.

---

## 3. Matriz de Priorização (Impacto × Esforço)

| Impacto / Esforço | Baixo Esforço | Alto Esforço |
| :--- | :--- | :--- |
| **Alto Impacto** | **(Foco Principal / Vitórias Rápidas)**<br>• **Ideia A** — Extensão Chrome + Gemini, zero backend, persistência local.<br>• **Ideia G** — Refinamento por seção (complemento natural de A). | **(Projetos Maiores / Estratégicos)**<br>• **Ideia C** — Bot Workspace add-on com backend (alta governança, mas custo de infra/aprovação Google).<br>• **Ideia E** — Integração com Gemini for Workspace (depende de licença Enterprise dos clientes). |
| **Baixo Impacto** | **(Tarefas de Preenchimento / Opcionais)**<br>• **Ideia B** — Web app com upload manual (resolve, mas mantém a fricção de copiar/colar). | **(Armadilhas / Descartar)**<br>• **Ideia D** — Plugin para IDE: não captura a reunião, muda o problema.<br>• **Ideia F** — CLI sobre `.vtt`: requer ação pós-reunião, perpetua a fricção. |

**Critérios de avaliação aplicados:**
- **Impacto:** quanto a ideia reduz a fricção entre "reunião acabou" e "ADR commitado" (KPI central, ver `canvas_estrategia_acao.md` §3).
- **Esforço:** complexidade técnica + dependências externas (licenças, aprovações) + prazo de 1 mês para MVP.

---

## 4. Solução Priorizada para Prototipagem

**Ideia A — Extensão Chrome (Manifest V3) que captura transcrição do Google Meet e gera ADR estruturado via Google Gemini API, com persistência local (zero backend).**

Complementada por **Ideia G** (refinamento por seção) como funcionalidade derivada dentro do mesmo MVP.

### Por que essa combinação venceu

1. **Encaixe direto no fluxo das personas:** Rafael e Camila já estão no Chrome, no Google Meet, no momento da decisão. A solução intercepta o problema **no instante em que ele é mais barato resolver** (contexto fresco, transcrição disponível).
2. **Aderência LGPD pelo design:** captura e persistência locais, sem servidor próprio. Único tráfego externo é o trecho enviado à Gemini (Fonte 1, ver canvas de fontes de dados §11).
3. **Viabilidade técnica imediata:** PoC backend (`backend/indexAllShot.js`) já validou Gemini com `responseSchema` + CoT + few-shot retornando ADRs estruturados consistentes — falta apenas portar para extensão.
4. **Custo controlado:** cap de 30K caracteres por sessão limita gasto de tokens previsivelmente; sem custo de infra.
5. **Janela de 1 mês:** sem backend, sem autenticação, sem revisão de marketplace Workspace, o MVP cabe no prazo estipulado em `canvas_estrategia_acao.md` §5.

### Escopo levado para o próximo passo (Prompt Design Record + Design de Experimentos)

- Captura de transcrição via Web Speech API (alternativa: leitura das legendas do Meet).
- Pipeline: buffer da extensão → prompt CoT + few-shot → Gemini → JSON estruturado → UI editável → IndexedDB local → export `.md`.
- Refinamento por seção (Ideia G) entra como comando isolado que regenera apenas o campo selecionado, reusando o mesmo schema da Fonte 3.

> Esta solução é validada experimentalmente no [`canvas_design_experimentos.md`](./canvas_design_experimentos.md) e tem o prompt detalhado em [`prompt_design_record.md`](./prompt_design_record.md).
