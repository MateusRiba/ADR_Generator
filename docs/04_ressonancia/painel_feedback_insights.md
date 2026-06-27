# Painel de Feedback e Insights
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Ressonância** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), construído sobre o template `Feedback_and_Insights_Panel_Model_Canvas_Template.md` (5 seções: Objetivo do Ciclo de Feedback, Fontes e Métodos de Coleta, Principais Feedbacks Recebidos, Insights Gerados, Ações Recomendadas).
> **Versão v0 (pré-piloto).** O **design do ciclo** (§1–§2) é consolidável agora; os **dados brutos** (§3) exigem rodar o piloto e conversar com usuários reais; **insights** (§4) e **ações** (§5) se preenchem a partir daí.

**Legenda:** 🤖 consolidado pela IA · 🔄 híbrido (IA sintetiza quando houver dado) · 🧑 humano / pós-piloto.

---

## 1. Objetivo do Ciclo de Feedback

> 🤖 Pergunta primária que o ciclo busca responder:
>
> **"O ADR gerado é fiel e útil o suficiente para ser adotado sem reescrita total, e o fluxo de captura → revisão → export é confiável e aderente a LGPD na prática real de reuniões?"**

Sub-perguntas por persona ([`canvas_personas.md`](../01_exposicao/canvas_personas.md)):
- **Rafael (Tech Lead):** o ADR captura a decisão e os trade-offs com fidelidade técnica?
- **Camila (Eng. de Software):** o fluxo é rápido e não atrapalha a reunião?
- **Bruno (Eng. Manager):** o registro reduz "decisão perdida" e gera confiança institucional?

---

## 2. Fontes e Métodos de Coleta

> 🤖 — desenhado para o constrangimento **zero backend** (coleta sem servidor central).

| Fonte | Método | Tipo | Estado |
|---|---|---|---|
| **Issues no GitHub** | canal primário de bug/feature reportado pelos pilotos | qualitativo | 🤖 definido |
| **Entrevistas com as 3 personas** | roteiro estruturado pós-piloto (15–20 min) | qualitativo | 🤖 roteiro / 🧑 execução |
| **Micro-survey opt-in local** | 1 pergunta após export ("este ADR foi útil? 1–5") armazenada localmente | quantitativo leve | 🤖 design / 🧑 respostas |
| **Telemetria local-first agregada (opt-in)** | contadores de [`canvas_metricas_escala_impacto.md`](./canvas_metricas_escala_impacto.md) exportados manualmente | quantitativo | 🔄 |
| **Suite de regressão alimentada por falhas reais** | transcrição anonimizada que gerou ADR ruim vira fixture (ciclo virtuoso — testes §10) | qualitativo→teste | 🤖 mecanismo |

**Princípio:** nada de coleta automática de conteúdo; survey e telemetria são **opt-in** e **locais**, exportados pelo próprio usuário.

---

## 3. Principais Feedbacks Recebidos (Dados Brutos)

> 🧑 **PENDENTE: PILOTO.** Tabela pronta para preencher. As linhas pré-semeadas são **hipóteses a investigar** (riscos conhecidos), não feedback recebido.

| Tópico | Feedback recorrente | Fonte | Frequência / impacto |
|---|---|---|---|
| Fidelidade da decisão | _(a investigar — risco F1 viés de sotaque)_ | — | 🧑 |
| Captura de legendas | _(a investigar — robustez do DOM do Meet)_ | — | 🧑 |
| Fluxo de consentimento | _(a investigar — fricção do banner P1)_ | — | 🧑 |
| Revisão obrigatória / export | _(a investigar — gate F1/T1 atrapalha ou ajuda?)_ | — | 🧑 |
| Refinamento por seção | _(a investigar — usado? útil?)_ | — | 🧑 |
| Pedido de colaboração/compartilhar | _(a investigar — pressão sobre zero backend)_ | — | 🧑 |

---

## 4. Insights Gerados (Síntese)

> 🔄 **PENDENTE: dados da §3.** Método de síntese definido; IA executa quando o bruto existir.

**Método (🤖):** agrupar feedback por tópico → identificar *root cause* (não o sintoma) → formular conclusão acionável. Cada insight referencia as linhas brutas que o sustentam.

| Insight | Causa-raiz | Evidência (§3) | Estado |
|---|---|---|---|
| _(a gerar)_ | — | — | 🧑/🔄 |

---

## 5. Ações Recomendadas (Para o Backlog)

> 🧑 priorização é decisão de produto. As linhas abaixo são **candidatos pré-piloto** já conhecidos (de [`prompt_design_record.md`](../02_composicao/prompt_design_record.md) §7 e do [`checklist_analise_riscos_ia.md`](../03_ensaio/checklist_analise_riscos_ia.md)), prontos para entrar/sair conforme o feedback real.

| Épico / Ação | Insight de origem | Prioridade | Esforço |
|---|---|---|---|
| Expandir few-shot (≥3 casos contrastantes) | risco de viés do exemplo único (F2) | 🧑 | M |
| Auditoria de diversidade dos exemplos few-shot | F2 | 🧑 | S |
| Estratégia de sumarização > 30K | cap trunca reuniões longas (`T-IA-05`) | 🧑 | M |
| Onboarding em 3 passos | `T-UX-01` (não bloqueante do piloto) | 🧑 | M |
| Suite de regressão IA em CI | qualidade contínua do prompt | 🧑 | M |
| Avaliar backend opt-in (colaboração) | se §3 mostrar demanda dura | 🧑 | L |

> Itens só entram no backlog real **após** validação pelo feedback do piloto. Esta é a ponte para um novo ciclo Sinfonia (volta à Exposição/Composição com aprendizado).

---

## Pendências do piloto (o que destrava este painel)

1. 🧑 Rodar o piloto e abrir os canais da §2 (issues, survey opt-in, entrevistas).
2. 🧑 Preencher os dados brutos (§3) com feedback real.
3. 🔄 IA sintetiza insights (§4) e propõe priorização (§5) para decisão humana.

---

## Referências cruzadas

- Personas entrevistadas: [`canvas_personas.md`](../01_exposicao/canvas_personas.md)
- Métricas quantitativas que cruzam com o feedback: [`canvas_metricas_escala_impacto.md`](./canvas_metricas_escala_impacto.md)
- Ciclo virtuoso de regressão e feedback: [`canvas_testes_validacao.md`](../03_ensaio/canvas_testes_validacao.md) §10
- Backlog de prompt herdado: [`prompt_design_record.md`](../02_composicao/prompt_design_record.md) §7
- Riscos abertos que viram hipóteses de feedback: [`checklist_analise_riscos_ia.md`](../03_ensaio/checklist_analise_riscos_ia.md)
