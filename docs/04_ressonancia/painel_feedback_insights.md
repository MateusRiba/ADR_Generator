# Painel de Feedback e Insights
## ADR Generator — Extensao para Google Meet (MVP academico)

> Artefato da fase **Ressonancia** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), baseado no template oficial `Feedback_and_Insights_Panel_Model_Canvas_Template.md`.
> **Adaptacao de escopo:** como este e um projeto simples de faculdade, o painel consolida evidencias de demo, autoavaliacao e revisao dos exports `.md`, nao feedback estatistico de usuarios reais.

**Legenda:** ✅ definido/concluivel no escopo academico · 🔄 a preencher apos demo/testes · ➖ fora de escopo.

**Evidencias ja analisadas:** [`extension/reports/2026-06-27_test_run.md`](../../extension/reports/2026-06-27_test_run.md) e exports em [`extension/reports/evidence/2026-06-27/`](../../extension/reports/evidence/2026-06-27/).

---

## 1. Objetivo do Ciclo de Feedback

**Pergunta principal:** o ADR Generator demonstra de modo convincente que uma transcricao de reuniao pode virar um ADR estruturado, revisavel e exportavel, com cuidados minimos de privacidade e transparencia sobre IA?

O ciclo de feedback academico deve responder:

- O avaliador entende rapidamente o problema resolvido?
- O ADR exportado e coerente com a transcricao usada no teste?
- O fluxo deixa claro que a IA ajuda, mas nao substitui revisao humana?
- As limitacoes tecnicas estao documentadas sem exagerar a maturidade do produto?

---

## 2. Fontes e Metodos de Coleta

| Fonte | Metodo | Tipo | Estado |
|---|---|---|---|
| **Demo academica** | Observacoes do professor/banca durante apresentacao | qualitativo | 🔄 |
| **Autoavaliacao do autor** | Checklist apos executar os cenarios controlados | qualitativo | ✅ 23/23 testes |
| **Exports `.md` gerados** | Comparacao entre transcricao e ADR final | evidencia objetiva | ✅ 6 exports |
| **Relatorio de teste** | Registro de tempo, falhas, prints/evidencias e conclusao | evidencia documental | ✅ 2026-06-27 |
| **Issues GitHub** | Opcional, caso colegas/professor reportem pontos | qualitativo | 🔄 |

**Fora de escopo:** entrevistas com personas, micro-survey opt-in, telemetria agregada, CSAT e ciclo continuo de feedback com usuarios reais.

---

## 3. Principais Feedbacks Recebidos (Dados Brutos)

> Feedback aqui significa evidencias e observacoes dos testes ja executados, nao opiniao estatistica de usuarios reais.

| Tema | Feedback / evidencia registrada | Fonte | Estado |
|---|---|---|---|
| **Fidelidade da decisao** | Casos ideal e adversariais preservaram as decisoes reais; `sem-decisao.md` retornou `AUSÊNCIA DE DECISÃO`. | relatorio §3 + exports | ✅ |
| **Qualidade estrutural** | Exports contem titulo, contexto, problema, alternativas, decisao, consequencias e incertezas. | 6 arquivos `.md` | ✅ |
| **Seguranca contra prompt injection** | Instrucoes adversarias foram tratadas como conteudo da transcricao, nao como comando. | `injection-1/2/3.md` | ✅ |
| **Transparencia sobre IA** | Front-matter inclui `ai_generated`, `gerado_por` e `revisado`; rodape pede revisao. | exports `.md` | ✅ |
| **Privacidade** | PRIV 4/4; sem transcricao bruta no IndexedDB pos-geracao; wipe limpa dados. | relatorio §1–2 | ✅ |
| **Robustez** | ROB 5/5; buffer recuperado apos reciclo do Service Worker. | relatorio §1–2 | ✅ |
| **Ressalva de terminologia** | `injection-3.md` citou "captura audio", mas o produto captura legendas/transcricao. | relatorio §4 | ⚠️ |
| **Lacuna de mensuracao** | Tempo manual vs. extensao e cap 30K ainda nao foram medidos nesta rodada. | relatorio §5 / canvas metricas | 🔄 |

---

## 4. Insights Gerados (Sintese)

| Insight | Base | Consequencia |
|---|---|---|
| O zero-backend combina bem com o escopo academico | Arquitetura MV3 + IndexedDB + BYOK | Reduz complexidade e facilita explicar LGPD |
| A revisao humana e parte do produto, nao detalhe | Risco F1/T1 e gate de export | O MVP deve ser apresentado como assistente, nao decisor |
| A captura por legendas e util, mas fragil | Dependencia do DOM do Meet e das legendas ativas | Ter fixture/transcricao como fallback de demo |
| O cap de 30K e aceitavel para MVP | Controla custo/latencia | Sumarizacao fica como trabalho futuro |
| Feedback real de usuarios nao e necessario para fechar faculdade | Projeto nao tem grupo piloto | Validacao controlada substitui piloto interno |
| O prompt ja resiste a ataques basicos de instrucao embutida | Suite adversaria `T-SEG-01` aprovada | Manter esses casos como evidencia e futura regressao |
| A qualidade minima do ADR foi demonstrada | 6 exports com estrutura Nygard e decisoes coerentes | A apresentacao pode mostrar exports reais em vez de prometer piloto futuro |
| A terminologia "audio" precisa ser evitada | Ressalva em `injection-3.md` | Ajustar narrativa/documentacao para "legendas/transcricao" |

---

## 5. Acoes Recomendadas (Para o Backlog)

| Acao sugerida | Motivo | Prioridade academica |
|---|---|---|
| Preparar 2 ou 3 transcricoes de teste | Evita depender exclusivamente de Meet ao vivo | ✅ feito, ha 6 evidencias |
| Gerar e versionar exports `.md` como evidencia | Facilita avaliacao da qualidade | ✅ feito |
| Cronometrar manual vs. extensao | Sustenta a tese de reducao de esforco | Media |
| Documentar limites na apresentacao/README | Evita prometer maturidade de produto real | Alta |
| Manter suite adversarial de prompt injection como evidencia | Mostra cuidado com IA e seguranca | ✅ feito |
| Corrigir narrativa "audio" → "legendas/transcricao" | Evita imprecisao sobre funcionamento do produto | Alta |
| Registrar conclusao academica final no relatorio | Fecha o ciclo de feedback sem depender de usuarios reais | Alta |
| Sumarizacao > 30K | Evolucao futura, nao requisito atual | Baixa |
| Backend colaborativo | Trabalho futuro somente se virar produto real | Baixa / fora de escopo |

**Referencias cruzadas:** [`canvas_metricas_escala_impacto.md`](./canvas_metricas_escala_impacto.md), [`canvas_testes_validacao.md`](../03_ensaio/canvas_testes_validacao.md), [`prompt_design_record.md`](../02_composicao/prompt_design_record.md), [`checklist_analise_riscos_ia.md`](../03_ensaio/checklist_analise_riscos_ia.md).
