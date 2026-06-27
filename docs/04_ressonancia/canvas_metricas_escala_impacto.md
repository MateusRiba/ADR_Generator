# Canvas de Métricas de Escala e Impacto
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Ressonância** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), construído sobre o template `Scale_and_Impact_Metrics_Model_Canvas_Template.md` (seções: Objetivo do Monitoramento, Métricas de Uso, Desempenho, Impacto no Negócio, Satisfação do Usuário, Ferramentas, Benchmarks, Acompanhamento de Tendências, Ações Baseadas nas Métricas, Relatórios e Compartilhamento).
> **Versão v0 (hipóteses pré-piloto).** A fase é empírica — este canvas **define o que instrumentar** e propõe alvos derivados dos KPIs de [`canvas_estrategia_acao.md`](../01_exposicao/canvas_estrategia_acao.md) §3–4 e dos sinais local-first de [`canvas_testes_validacao.md`](../03_ensaio/canvas_testes_validacao.md) §9. Os **valores medidos** só existem depois do piloto interno (gate em [`checklist_lancamento.md`](../03_ensaio/checklist_lancamento.md) §5).

**Legenda de estado:** 🤖 consolidado pela IA (definição/método) · 🔄 híbrido (alvo-hipótese; valor pende do piloto) · 🧑 humano / pós-piloto.

---

## 1. Objetivo do Monitoramento

> 🤖 Monitorar — de forma **local-first, opt-in e sem PII** — o uso e a qualidade do ADR Generator durante o piloto interno, para **validar as hipóteses de valor** (reunião → ADR em < 2 min, ≥ 70% de aproveitamento direto) e alimentar o ciclo de melhoria do prompt e da UX.

**Alinhamento estratégico:** confirmar que o diferencial central (capturar decisão arquitetural antes que o contexto se perca) se sustenta em uso real, sem violar a restrição de privacidade (zero backend — [`canvas_estrategia_acao.md`](../01_exposicao/canvas_estrategia_acao.md) §5). Princípio inegociável: **toda telemetria é local**; nada vai a servidor próprio.

---

## 2. Métricas de Uso

> Definição e coleta: 🤖 · Alvo: 🔄 · Valor medido: 🧑 (pós-piloto).

| Métrica | Definição | Coleta (local) | Alvo-hipótese | Medido |
|---|---|---|---|---|
| **Taxa de conversão reunião → ADR** | % de capturas iniciadas que resultam em ADR salvo | Contador no SW | ≥ 60% (🔄) | 🧑 |
| **ADRs salvos por equipe** | nº acumulado de ADRs no histórico por usuário/equipe | IndexedDB | ≥ 3/equipe/mês (🔄) | 🧑 |
| **Reuniões abortadas mid-captura** | capturas iniciadas e descartadas sem gerar ADR | Contador no SW | Investigar se > 5% (testes §9) | 🧑 |
| **Taxa de uso do refinamento por seção** | % de ADRs que recebem ≥1 refinamento | Contador local | Proxy inverso de qualidade da 1ª geração (testes §9) | 🧑 |
| **Uso do modo redação (P2)** | % de gerações precedidas de edição da transcrição | Contador local | — (observacional) | 🧑 |
| **Sessões que atingem o cap de 30K** | % de capturas truncadas | Flag `truncated` | Se alto → priorizar sumarização > 30K | 🧑 |

---

## 3. Métricas de Desempenho

> 🤖 definição · 🔄 alvo (já fixado em `T-PERF-*`) · 🧑 valor.

| Métrica | Alvo (origem) | Coleta | Medido |
|---|---|---|---|
| **Latência Gemini p50 / p95** (30K chars) | p50 < 8 s, p95 < 20 s (`T-PERF-01`) | Medição no `Gemini API Client` | 🧑 |
| **Memória do SW** (reunião 1 h) | < 100 MB pico (`T-PERF-02`) | DevTools / amostra local | 🧑 |
| **Tokens por geração** | mediana < 15K (`T-PERF-03`) | Resposta da API | 🧑 |
| **Cold start do popup** | < 300 ms (`T-PERF-04`) | Marca local | 🧑 |
| **Taxa de sucesso de parse** | > 99% (testes §9) | `Data Parser/Validator` | 🧑 |
| **Erros JS não tratados** | ~0 / sessão (testes §9) | `chrome.runtime.onError` + log rotativo IndexedDB | 🧑 |
| **Taxa de retry/falha 429** | falha clara só após 3 tentativas (`T-ROB-04`) | Contador no client | 🧑 |

---

## 4. Métricas de Impacto no Negócio

> 🧑 predominante — exigem julgamento de valor + dados do piloto. Alvos vêm de [`canvas_estrategia_acao.md`](../01_exposicao/canvas_estrategia_acao.md) §3.

| Métrica | Alvo-hipótese | Como medir | Estado |
|---|---|---|---|
| **Tempo reunião → ADR** | de > 30 min (manual) para < 2 min | cronometragem no piloto | 🔄 (modelo) / 🧑 (valor) |
| **% ADRs aproveitados sem reescrita total** | ≥ 70% | avaliação humana dos exports | 🧑 |
| **Taxa de adoção** | ≥ 3 equipes usando ativamente | contagem no piloto | 🧑 |
| **Decisões que viram registro** (vs. perdidas) | qualitativo — redução de "conhecimento perdido" | entrevista com personas | 🧑 |

---

## 5. Métricas de Satisfação do Usuário

> 🧑/🔄 — dependem de usuários reais; ver [`painel_feedback_insights.md`](./painel_feedback_insights.md).

| Métrica | Definição | Estado |
|---|---|---|
| **Taxa de edição pós-geração** | extensão das edições manuais (proxy de qualidade da IA — KPI §4) | 🔄 medível localmente; interpretar com humano |
| **Avaliação humana da decisão (1–5)** | nota de fidelidade do campo `decisao` | 🧑 (suite de regressão + piloto) |
| **CSAT leve (opt-in)** | micro-pergunta após export ("este ADR foi útil?") | 🧑 (a desenhar no painel de feedback) |
| **% exports com revisão marcada** | adesão ao gate F1/T1 | 🔄 medível; meta 100% |

---

## 6. Ferramentas de Monitoramento

> 🤖 — **local-first, zero analytics externo** (coerente com a decisão de zero backend).

- **Erros:** `chrome.runtime.onError` + log rotativo no IndexedDB (sem rede).
- **Contadores de uso/qualidade:** instrumentação local no SW, no `Gemini API Client` e no `Data Parser/Validator`.
- **Agregação:** exportação **manual e opt-in** dos contadores locais (JSON/CSV) para compor o relatório do piloto — nunca envio automático.
- **Proibido:** Google Analytics, pixels, telemetria de conteúdo, qualquer host além de `generativelanguage.googleapis.com` (`T-PRIV-03`).

---

## 7. Benchmarks

> 🔄 — referências fixadas; baseline medido 🧑.

| Referência | Valor | Origem |
|---|---|---|
| **Baseline manual** (estado atual sem o produto) | > 30 min/ADR; parte das decisões não vira registro | `canvas_estrategia_acao.md` §3 |
| **Alvo de performance** | p95 < 20 s; parse > 99%; cold start < 300 ms | `T-PERF-*`, testes §9 |
| **Alvo de qualidade** | ≥ 70% aproveitado sem reescrita; alucinação < 5% | §3 / `canvas_testes_validacao.md` §4 |

> Pré-piloto **não há baseline medido** — os números acima são metas. O baseline real (tempo manual observado, % aproveitamento) é coletado no piloto. 🧑

---

## 8. Acompanhamento de Tendências

> 🤖 método; dados 🧑.

- **Cadência:** snapshot semanal durante o piloto, consolidado por release.
- **Leitura de indicadores antecedentes:** alta na *taxa de refinamento* ou na *taxa de edição* sinaliza queda de qualidade da 1ª geração → gatilho para revisar prompt/few-shot **antes** de a satisfação cair.
- **Ferramenta:** agregação manual dos logs locais no relatório `reports/YYYY-MM-DD_*.md`.

---

## 9. Ações Baseadas nas Métricas

> 🤖 — playbook *se-então* ligando métrica → ação → artefato.

| Gatilho | Ação | Destino |
|---|---|---|
| Conversão reunião → ADR < alvo | Investigar fricção de captura (CC, consentimento, overlay) | UX / `canvas_testes_validacao.md` |
| Taxa de refinamento/edição alta | Revisar `systemInstruction`/few-shot; nova versão do prompt | [`prompt_design_record.md`](../02_composicao/prompt_design_record.md) §6 |
| Parse < 99% | Endurecer schema/parser; caso de regressão perpétuo | `T-ROB-05` |
| Reuniões abortadas > 5% | Investigar reciclo do SW (S6) e clareza do fluxo | `T-ROB-02` |
| Truncamento (30K) frequente | Priorizar sumarização prévia > 30K | `prompt_design_record.md` §7 |
| Alucinação reportada | Adicionar transcrição à suite de regressão | [`painel_feedback_insights.md`](./painel_feedback_insights.md) |

---

## 10. Relatórios e Compartilhamento

> 🤖 — formato e destino; conteúdo 🧑.

- **Formato:** relatório por release em `extension/reports/YYYY-MM-DD_test_run.md` (já em uso para o gate de lançamento), estendido com a seção de métricas do piloto.
- **Destino:** equipe (≤3 eng.) + sponsor (EM). Sem dados pessoais; só agregados.
- **Decisão associada:** os números alimentam o *pivotar ou perseverar* da Ressonância e o backlog do painel de feedback.

---

## Pendências do piloto (o que destrava este canvas)

1. 🧑 Rodar o piloto interno (gate `checklist_lancamento.md` §5 → GO).
2. 🔄 Ligar a instrumentação local-first (contadores das §2/§3) **antes** do piloto — senão não há dado a coletar.
3. 🧑 Medir baseline manual (§7) e preencher os valores das §2–§5.
4. 🔄 IA consolida tendências (§8) e propõe ações (§9) sobre os dados reais.

---

## Referências cruzadas

- KPIs e metas de produto: [`canvas_estrategia_acao.md`](../01_exposicao/canvas_estrategia_acao.md) §3–4
- Sinais local-first e alvos de performance: [`canvas_testes_validacao.md`](../03_ensaio/canvas_testes_validacao.md) §3.7 e §9
- Ciclo que consome estas métricas: [`painel_feedback_insights.md`](./painel_feedback_insights.md)
- Custo/volume que escalam com o uso: [`canvas_planejamento_escalabilidade.md`](./canvas_planejamento_escalabilidade.md)
