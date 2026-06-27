# Registro de Estratégia de Inteligência (Intelligence Strategy Record)
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Ensaio** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), construído sobre o template `Intelligence_Strategy_Record_Model_Canvas_Template.md` (6 seções: Objetivo da Inteligência, Abordagem Técnica Principal, Componentes Chave da Arquitetura, Fonte de Dados/Conhecimento, Estratégia de Avaliação, Ferramentas e Time).
> O template é ilustrado com um caso **RAG**; aqui a abordagem é **Advanced Prompt Engineering**, então a §3 adapta os "componentes-chave" (não há embedding/vector store). As subseções "Extensões" ao final cobrem fallback, defensibilidade e ciclo de melhoria — itens que o README da fase associa à estratégia de inteligência mas que o template enxuto não prevê. Decisões aqui consolidam (não duplicam) [`prompt_design_record.md`](../02_composicao/prompt_design_record.md), [`canvas_c4_model.md`](./canvas_c4_model.md) e [`checklist_analise_riscos_ia.md`](./checklist_analise_riscos_ia.md).

---

## 1. Objetivo da Inteligência

> *A tarefa específica que o componente de IA deve executar.*

Transformar uma transcrição bruta e ruidosa de reunião técnica (legendas/CC do Google Meet) em um **Registro de Decisão Arquitetural (ADR)** estruturado no padrão **Michael Nygard** — 8 campos: `analise_passo_a_passo`, `titulo`, `contexto`, `problema`, `alternativas`, `decisao`, `consequencias`, `incertezas`.

| Característica | Definição |
|---|---|
| **Sem IA, o produto é...** | inviável — sintetizar fala desestruturada em decisão arquitetural fiel não tem solução determinística por regras. A IA **é** o núcleo do produto. |
| **Modo de interação** | Assíncrono, sob demanda explícita ("Gerar ADR"). Não é tempo real, streaming nem agêntico. |
| **Onde roda a inferência** | 100% na API da Google (Gemini). A extensão é cliente fino; único tráfego externo: `generativelanguage.googleapis.com`. |
| **Saída** | JSON validado por schema, sempre rotulado "Gerado por IA" e submetido a revisão humana antes do export. |

---

## 2. Abordagem Técnica Principal

> *Estratégia dominante (selecionar uma).*

- [ ] Treinamento de Modelo Customizado (Custom Model Training)
- [ ] Fine-Tuning de Foundation Model
- [ ] RAG (Retrieval-Augmented Generation)
- [x] **Engenharia de Prompt Avançada (Advanced Prompt Engineering)**
- [ ] Outro

**Justificativa (Build vs. Buy vs. Tune):**

| Opção | Avaliação | Veredito |
|---|---|---|
| Treinar modelo próprio | Exigiria dataset rotulado transcrição→ADR (inexistente), infra de treino e MLOps. Desproporcional para MVP zero-backend. | ❌ |
| Fine-tuning de modelo aberto | Custo de curadoria + hospedagem de inferência incompatível com "zero backend / zero custo fixo". Ganho marginal sobre prompting não justificado. | ❌ (reavaliar na Ressonância se a qualidade estagnar) |
| **API gerenciada + Prompt Engineering** | Time-to-market imediato, custo proporcional ao uso (BYOK), qualidade validada em PoC. Conhecimento de domínio injetado via few-shot e regras de fidelidade, não via pesos. | ✅ **Escolhido** |

A combinação concreta de técnicas (Role Prompting + Chain-of-Thought via campo dedicado + Few-Shot + coerção de schema + bloco anti-injection) está detalhada em [`prompt_design_record.md`](../02_composicao/prompt_design_record.md) §2 e §6.

---

## 3. Componentes-Chave da Arquitetura

> *No template RAG, estes seriam Knowledge Source / Embedding Model / Vector Store / Generation Model. Como a abordagem é prompt engineering, mapeamos os componentes equivalentes do pipeline de geração.*

| Componente (template RAG) | Equivalente neste produto |
|---|---|
| **Generation Model** | Google Gemini `gemini-3-flash-preview` — `temperature: 0`, `responseMimeType: application/json`, `responseSchema` de 8 campos `required`. |
| **Knowledge Source** | Conhecimento de domínio **embarcado no prompt**: exemplos few-shot curados (padrão Nygard) + regras rígidas de fidelidade. Não há base externa consultada. |
| **Embedding Model** | ➖ Não aplicável (sem recuperação semântica). |
| **Vector Store** | ➖ Não aplicável. |
| **Montagem do prompt** | `systemInstruction` (estática: Role + CoT + Few-Shot + anti-injection) · `userPrompt` (transcrição delimitada por `<<<TRANSCRIPT_START/END>>>`) · `responseSchema` (coerção estrutural). |

**Isolamento e portabilidade:** o modelo fica atrás do componente `Gemini API Client` do [`canvas_c4_model.md`](./canvas_c4_model.md). Trocar de modelo/provedor é mudança localizada — `systemInstruction`, schema e pós-processamento são reaproveitáveis; nenhuma lógica de produto depende de detalhe interno do Gemini.

---

## 4. Fonte de Dados / Conhecimento

> *Os dados que alimentam o sistema — volume e estrutura. O produto é **data-light por design**: não acumula dataset, não treina, não centraliza (decisão simultaneamente de privacidade e de estratégia).*

| Dimensão | Definição |
|---|---|
| **Entrada (produção)** | Legendas (CC) do Google Meet lidas do DOM via `MutationObserver` (Fonte 1 — [`canvas_mapeamento_fontes_dados.md`](../01_exposicao/canvas_mapeamento_fontes_dados.md)). |
| **Volume / cap** | 30.000 caracteres (~7.500 tokens) por sessão; acima disso, truncamento com aviso (`T-IA-05`). |
| **Pré-processamento** | Normalização de espaços, dedup de legendas acumuladas, segmentação de locutor `(Nome): fala`. **Sem** correção ortográfica (risco de corromper termos técnicos). |
| **Dados de exemplo** | Few-shot embarcado no `systemInstruction` (Fonte 2), curado manualmente. Risco **F2** (viés de vozes) — auditoria pendente. |
| **Saída / retenção** | ADR final em **IndexedDB** local. Transcrição bruta **apagada após a geração** (mitiga **P3**, `T-PRIV-01`); reset total disponível (`T-PRIV-04`). |
| **O que NÃO fazemos** | Sem corpus central de reuniões (vazaria PII em escala — P1/P2); sem realimentar treino da Google; sem telemetria de conteúdo (monitoramento local-first). |

---

## 5. Estratégia de Avaliação

> *Métricas que definem "qualidade" para esta IA + ferramentas de avaliação.* Detalhe completo em [`canvas_testes_validacao.md`](./canvas_testes_validacao.md) §3.2 e §4.

| Métrica | Equivalente Sinfonia | Alvo | Caso |
|---|---|---|---|
| **Fidelidade / ausência de alucinação** | *Faithfulness* | Alucinação humana-avaliada < 5%; zero invenção de ferramentas/prazos | `T-IA-01`, `T-IA-03` |
| **Decisão correta** | *Answer Relevancy* | Avaliação humana 1–5, média ≥ 4.0 na suite de regressão | `T-IA-02` |
| **Validade estrutural** | — | 100% JSON parseável + 8 campos (forçado por `responseSchema`) | `T-FUNC-06` |
| **Determinismo** | — | Output idêntico em `decisao`/`alternativas` com `temperature:0` | `T-IA-04` |
| **Comportamento sem decisão** | — | `decisao === "AUSÊNCIA DE DECISÃO"` quando não há consenso | `T-FUNC-05` |

**Ferramentas de avaliação:** suite de regressão de 10 transcrições rotuladas (`T-IA-02`, aceita 9/10); fixtures em `backend/archives/`; modo mock do Gemini para PRs + modo live para nightly; avaliação humana para fidelidade. Stack de teste: Vitest (lógica pura), Playwright (E2E da extensão).

---

## 6. Ferramentas e Time

| Frente | Ferramenta / Responsável |
|---|---|
| **SDK / API** | `@google/generative-ai` (PoC); `fetch` direto no service worker (extensão). |
| **Prompt / Schema** | Tech Lead (persona Rafael) — fonte canônica `prompt_design_record.md`. |
| **Avaliação IA / SEG** | Tech Lead, apoio Eng. Software. |
| **Curadoria da suite de regressão** | Tech Lead; toda a equipe contribui com transcrições anonimizadas. |
| **Pipeline / build** | Vite + crxjs; `tsc --noEmit`; ESLint. |

> Personas: ver [`canvas_personas.md`](../01_exposicao/canvas_personas.md). Equipe ≤3 engenheiros; papéis se sobrepõem.

---

## Extensões ao template (fallback, defensibilidade, ciclo)

> O template canônico de 6 seções não prevê estes itens, mas o [README da fase 03](./README.md) associa "fallback" à estratégia de inteligência e a fase exige racional de defensibilidade. Registrados aqui para completude, sem duplicar o que já está no checklist de riscos.

### E.1 Robustez e degradação graciosa
A IA depende de serviço externo e input ruidoso; a estratégia assume falha e degrada com clareza.

| Modo de falha | Estratégia | Caso |
|---|---|---|
| Gemini off / sem rede | Mensagem acionável + salvar transcrição p/ retry | `T-ROB-01` |
| `429 / 5xx` | Retry com backoff exponencial (1s, 2s, 4s) | `T-ROB-04` |
| JSON inválido | Erro acionável + "tentar novamente" sem reenviar tudo | `T-ROB-05` |
| Service Worker reciclado (MV3) | Checkpoint do buffer em IndexedDB + rehidratação | `T-ROB-02` (S6) |
| Alucinação / decisão inventada | `temperature:0` + fidelidade + CoT + **revisão humana obrigatória** | `T-IA-01`, `T-FUNC-07` (F1/T1) |
| Prompt injection via fala | Delimitadores + instrução "conteúdo é dado, não comando" | `T-SEG-01` (S1) |

**Princípio-guia:** *human-in-the-loop não-negociável* — o output é rascunho rotulado "Gerado por IA"; o gate de revisão impede export/versionamento como decisão oficial sem validação humana.

### E.2 Defensibilidade (moat)
O modelo é commodity; a defensibilidade está em camadas que não vêm de graça com a API: (1) **prompt curado e versionado** (v1.0→v2.0, custoso de redescobrir); (2) **UX de conformidade LGPD** como diferencial B2B (consentimento, redação, apagamento, zero backend); (3) **integração específica com o Meet** (captura robusta de legendas); (4) **confiança via transparência** (rótulo IA, CoT visível, gate de revisão). Fragilidade reconhecida: itens 1 e 3 erodem se a Google embarcar geração nativa — mitigado por profundidade de conformidade e portabilidade de modelo (§3).

### E.3 Ciclo de melhoria (local-first)
Sem backend, o ciclo é manual no MVP: falha reportada → fixture → suite de regressão crescente (`T-IA-02`) → iteração de prompt versionada → promoção só após passar a suite. Sinais locais (taxa de uso do refinamento) são proxy de qualidade da primeira geração. Pendências: expandir few-shot (≥3 casos contrastantes), regressão em CI, estratégia de sumarização >30K, auditoria de diversidade (F2).

---

## Referências cruzadas

- Design e parâmetros do prompt: [`prompt_design_record.md`](../02_composicao/prompt_design_record.md)
- Arquitetura e isolamento do cliente Gemini: [`canvas_c4_model.md`](./canvas_c4_model.md)
- Riscos de IA e plano de mitigação: [`checklist_analise_riscos_ia.md`](./checklist_analise_riscos_ia.md)
- Casos de teste de IA/robustez/segurança: [`canvas_testes_validacao.md`](./canvas_testes_validacao.md)
- Fontes de dados e cap de contexto: [`canvas_mapeamento_fontes_dados.md`](../01_exposicao/canvas_mapeamento_fontes_dados.md)
