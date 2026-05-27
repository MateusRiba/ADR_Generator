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
| Templates do Modelo C4 | ⬜ |
| Intelligence Strategy Record | ⬜ |
| Checklist de Análise de Riscos de IA e Defensibilidade | ⬜ |
| Canvas de Testes e Validação | ⬜ |
| Checklist de Lançamento | ⬜ |

### [04 — Ressonância](./04_ressonancia/) (Measure & Learn)
Métricas de impacto, planejamento de escalabilidade e painel de feedback.

| Artefato | Status |
|---|---|
| Canvas de Métricas de Escala e Impacto | ⬜ |
| Canvas de Planejamento de Escalabilidade | ⬜ |
| Painel de Feedback e Insights | ⬜ |

---

## Estado Atual

O projeto concluiu as fases de **Exposição** (01) e **Composição** (02), com todos os artefatos prescritos pelo Sinfonia para essas fases preenchidos. Próximo passo: fase de **Ensaio** (03 — Build & Test).

## Log de Alimentação da Documentação

Toda atualização desta base (criação, refactor, migração ou nova ingestão de artefato) é registrada cronologicamente em [`log.md`](./log.md). Consulte antes de iniciar grandes mudanças para evitar trabalho duplicado e entender o racional de decisões anteriores.
