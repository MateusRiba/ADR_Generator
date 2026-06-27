# Documentação do ADR Generator

A documentação deste projeto segue a metodologia [**Sinfonia**](https://github.com/assertlab/sinfonia) (AssertLab), que organiza o desenvolvimento de produtos de IA generativa em quatro fases cíclicas. Cada fase é representada por uma pasta neste diretório, contendo os artefatos (canvas, checklists, records) prescritos pela metodologia.

## Fases

### [01 — Exposição](./01_exposicao/) (Alignment)
Imersão no domínio, identificação de personas, mapeamento de fontes de dados e definição de estratégia.

| Artefato | Status |
|---|---|
| [Canvas de Identificação do Domínio](./01_exposicao/canvas_identificacao_dominio.md) | ✅ |
| [Canvas de Personas](./01_exposicao/canvas_personas.md) | ✅ |
| [Canvas de Mapeamento de Fontes de Dados](./01_exposicao/canvas_mapeamento_fontes_dados.md) | ✅ |
| [Canvas de Estratégia e Ação do Projeto](./01_exposicao/canvas_estrategia_acao.md) | ✅ |

### [02 — Composição](./02_composicao/) (Design)
Ideação da solução, design de prompts e desenho de experimentos.

| Artefato | Status |
|---|---|
| [Canvas de Ideação da Solução](./02_composicao/canvas_ideacao_solucao.md) | ✅ |
| [Prompt Design Record](./02_composicao/prompt_design_record.md) | ✅ |
| [Canvas de Design de Experimentos](./02_composicao/canvas_design_experimentos.md) | ✅ |

### [03 — Ensaio](./03_ensaio/) (Build & Test)
Arquitetura técnica (C4), estratégia de inteligência, análise de riscos, validação e checklist de lançamento.

| Artefato | Status |
|---|---|
| [Modelo C4 (Contexto, Contêineres, Componentes)](./03_ensaio/canvas_c4_model.md) | ✅ |
| [Intelligence Strategy Record](./03_ensaio/intelligence_strategy_record.md) | ✅ |
| [Checklist de Análise de Riscos de IA e Defensibilidade](./03_ensaio/checklist_analise_riscos_ia.md) | ✅ |
| [Canvas de Testes e Validação](./03_ensaio/canvas_testes_validacao.md) | ✅ |
| [Checklist de Lançamento](./03_ensaio/checklist_lancamento.md) | ✅ |

### [04 — Ressonância](./04_ressonancia/) (Measure & Learn)
Métricas de impacto, planejamento de escalabilidade e painel de feedback.

| Artefato | Status |
|---|---|
| [Canvas de Métricas de Escala e Impacto](./04_ressonancia/canvas_metricas_escala_impacto.md) | ✅ v1 (validação acadêmica) |
| [Canvas de Planejamento de Escalabilidade](./04_ressonancia/canvas_planejamento_escalabilidade.md) | ✅ v1 (limites arquiteturais) |
| [Painel de Feedback e Insights](./04_ressonancia/painel_feedback_insights.md) | ✅ v1 (feedback acadêmico) |

---

## Estado Atual

O projeto concluiu as fases de **Exposição** (01), **Composição** (02), **Ensaio** (03 — Build & Test) e readequou a fase de **Ressonância** (04 — Measure & Learn) ao contexto real de um projeto simples de faculdade. Em vez de depender de piloto interno, sponsor, adoção por equipes ou métricas longitudinais, os 3 artefatos da Ressonância agora estão em **v1 (validação acadêmica controlada)**: a avaliação se apoia em cenários controlados, exports `.md`, comparação manual entre transcrição e ADR, relatório de teste e declaração explícita dos limites/trabalhos futuros.

## Log de Alimentação da Documentação

Toda atualização desta base (criação, refactor, migração ou nova ingestão de artefato) é registrada cronologicamente em [`log.md`](./log.md). Consulte antes de iniciar grandes mudanças para evitar trabalho duplicado e entender o racional de decisões anteriores.
