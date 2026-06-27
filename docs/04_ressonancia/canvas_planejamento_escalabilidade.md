# Canvas de Planejamento de Escalabilidade
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Ressonância** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), construído sobre o template `Scalability_Planning_Model_Canvas_Template.md` (seções: Objetivo da Escalabilidade, Volume Esperado de Interações, Requisitos de Infraestrutura, Estratégias de Escalabilidade, Custo Estimado, Riscos e Mitigação, Monitoramento de Escalabilidade, Plano de Teste em Ambiente Escalado).
> **Versão v0 (hipóteses pré-piloto).** A análise de **limites arquiteturais** deriva do [`canvas_c4_model.md`](../03_ensaio/canvas_c4_model.md) (decisão de zero backend); **projeções de volume e orçamento** são decisão de negócio (🧑).

**Legenda:** 🤖 consolidado pela IA · 🔄 híbrido (modelo pronto; número pende de negócio/piloto) · 🧑 humano.

---

## 1. Objetivo da Escalabilidade

> 🤖 Definir como o produto cresce **além do piloto interno** — mais equipes, mais reuniões, e potencialmente além do Meet e além de usuário único — **preservando ao máximo o princípio de zero backend / privacidade local** e mantendo o custo da Gemini sob controle.

A pergunta central de escala: *até onde o modelo zero-backend leva o produto antes que uma necessidade (colaboração, telemetria agregada, fontes não-Meet) force uma decisão de arquitetura?*

---

## 2. Volume Esperado de Interações

> 🔄 modelo paramétrico (IA) · 🧑 números (negócio).

Volume é dirigido por: **nº de equipes × reuniões/semana × ADRs/reunião**.

| Cenário | Equipes | Reuniões/sem | ADRs/sem (aprox.) | Estado |
|---|---|---|---|---|
| **Piloto interno** | ≥ 3 (meta §3) | _(preencher)_ | _(preencher)_ | 🧑 |
| **Pós-piloto (interno amplo)** | 10–20? | — | — | 🧑 projeção |
| **Hipótese de escala** | 100+? | — | — | 🧑 projeção |

> Sem projeção de negócio, a escala fica indefinida. O dado-chave a capturar no piloto é **ADRs/equipe/semana**, que parametriza todo o resto (custo, carga).

---

## 3. Requisitos de Infraestrutura

> 🤖 — a propriedade central: **escalar nº de usuários NÃO muda a infraestrutura**, porque cada navegador é isolado e traz a própria API key (BYOK). O produto não tem servidor a dimensionar.

| Necessidade | Exige infra? | Observação |
|---|---|---|
| Mais usuários / mais equipes | **Não** | Escala horizontal "natural" e gratuita — cada cliente é autônomo |
| Mais reuniões por usuário | **Não** | Limitado só pela cota Gemini do próprio usuário |
| **Colaboração / ADRs compartilhados** | **Sim** | Sync entre membros exigiria backend + auth — quebra o zero-backend |
| **Telemetria agregada entre usuários** | Parcial | Hoje é local-first; agregação central exigiria backend mínimo opt-in |
| Novas fontes (Zoom/Teams/upload) | Não (backend) | Novos content scripts; mesmo core de geração |

**Limiar de ruptura do zero-backend:** colaboração e telemetria agregada são as duas únicas necessidades que forçam servidor. Ambas são decisão de negócio explícita, não consequência técnica do crescimento.

---

## 4. Estratégias de Escalabilidade

> 🤖 opções; 🧑 a escolha.

1. **Escala horizontal natural (manter zero backend)** — default. Distribuição por "Carregar sem compactação" → Chrome Web Store. Custo de inferência fica com o usuário (BYOK). Preserva o moat de privacidade. ✅ recomendado enquanto não houver demanda dura por colaboração.
2. **Novas fontes de captura** — abstrair o `content script` de captura para suportar Zoom/Teams/upload de `.txt`, reaproveitando todo o pipeline de prompt/geração. Esforço médio, não quebra arquitetura.
3. **Colaboração opt-in (rompe zero-backend)** — backend mínimo (sync + auth) **apenas** para quem ativar; default continua local. Decisão de negócio com custo de conformidade LGPD (passa a ser controlador de dados). 🧑
4. **Controle de custo** — cap de 30K + modelo `flash` + BYOK já contêm custo por geração; sumarização > 30K reduz tokens em reuniões longas.

---

## 5. Custo Estimado

> 🔄 — fórmula pronta (IA); preço e volume reais 🧑.

```
Custo_mensal ≈ ADRs_mês × (tokens_in + tokens_out) × preço_por_token(gemini-3-flash)
             + (refinamentos × tokens_refino × preço)
```

- **tokens_in:** até ~7.500 (cap de 30K chars); **tokens_out:** ~1–4K por ADR.
- **Quem paga:** no modelo **BYOK**, o custo recai no **projeto Google Cloud do usuário** — o **custo de infra do produto é ≈ 0** (só dev/teste/regressão).
- 🧑 a preencher: preço por token vigente do `gemini-3-flash-preview` × volume projetado (§2).

> Implicação estratégica: o BYOK não é só privacidade — é o que mantém o custo marginal do produto perto de zero ao escalar.

---

## 6. Riscos e Mitigação (de escala)

> 🤖

| Risco de escala | Mitigação |
|---|---|
| Custo Gemini cresce com volume | Cap 30K + `flash` + BYOK (custo no usuário) + sumarização > 30K |
| **Rate limit / 429** sob uso intenso | Backoff exponencial (`T-ROB-04`) + fila local; orientar cota no projeto do usuário |
| Google embute geração de ADR nativa no Meet | Defensibilidade por **conformidade LGPD** e portabilidade de modelo (ver [`intelligence_strategy_record.md`](../03_ensaio/intelligence_strategy_record.md) E.2) |
| Pressão por colaboração quebra o zero-backend | Backend **opt-in**, local-first por default; decisão de negócio consciente |
| Mudança no DOM do Meet quebra a captura em escala | Camada de seletores resiliente + monitorar `taxa de erros de captura` (KPI §4) |

---

## 7. Monitoramento de Escalabilidade

> 🤖 — reusa o [`canvas_metricas_escala_impacto.md`](./canvas_metricas_escala_impacto.md); aqui os **limiares que disparam decisão de arquitetura**.

| Sinal | Limiar de alerta | Decisão disparada |
|---|---|---|
| Tokens/geração (mediana) | > 15K sustentado | Revisar cap / sumarização |
| Latência p95 | > 20 s sustentado | Revisar modelo / tamanho de payload |
| Taxa de 429 | crescente | Orientar cota; avaliar fila/throttle |
| Nº de equipes ativas | > capacidade de suporte manual | Avaliar Web Store + docs self-service |
| Pedidos de "compartilhar ADR" | recorrente no feedback | Reabrir decisão de backend (Estratégia 3) |

---

## 8. Plano de Teste em Ambiente Escalado

> 🔄 parte testável já; 🧑 parte que exige escala real.

| Teste | Estado |
|---|---|
| Reunião de 2 h sem crash; cap aplicado (`T-ROB-06`) | 🔄 testável agora |
| Memória do SW em 1 h < 100 MB (`T-PERF-02`) | 🔄 testável agora |
| Busca no histórico com muitos ADRs (centenas) no IndexedDB | 🔄 testável com seed sintético |
| Concorrência de chamadas Gemini / comportamento sob 429 | 🔄 simulável (mock) |
| Carga real multi-equipe | 🧑 só no pós-piloto |

---

## Pendências do piloto (o que destrava este canvas)

1. 🧑 Capturar **ADRs/equipe/semana** no piloto → parametriza volume (§2) e custo (§5).
2. 🧑 Definir se/quando colaboração entra em escopo (única decisão que rompe o zero-backend).
3. 🔄 Rodar os testes de escala já possíveis (§8) e registrar no relatório.

---

## Referências cruzadas

- Decisão de zero backend e contêineres: [`canvas_c4_model.md`](../03_ensaio/canvas_c4_model.md)
- Defensibilidade e portabilidade de modelo: [`intelligence_strategy_record.md`](../03_ensaio/intelligence_strategy_record.md)
- Volume/custo que alimentam este plano: [`canvas_metricas_escala_impacto.md`](./canvas_metricas_escala_impacto.md)
- Restrições estratégicas (LGPD, dependência de API): [`canvas_estrategia_acao.md`](../01_exposicao/canvas_estrategia_acao.md) §5
