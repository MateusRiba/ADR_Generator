# Canvas de Metricas de Escala e Impacto
## ADR Generator — Extensao para Google Meet (MVP academico)

> Artefato da fase **Ressonancia** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), adaptado ao contexto real do projeto: **trabalho simples de faculdade**, sem grupo piloto, sem operacao em producao e sem necessidade de provar adocao por equipes.
> **Versao v1 (validacao academica controlada).** Este canvas nao mede "produto em operacao"; ele define como avaliar o MVP por cenarios controlados, evidencias manuais e comparacao entre transcricao e ADR gerado.

**Legenda de estado:** ✅ definido/concluivel no escopo academico · 🔄 a medir nos cenarios controlados · ➖ fora de escopo para este projeto.

**Evidencias ja disponiveis:** [`extension/reports/2026-06-27_test_run.md`](../../extension/reports/2026-06-27_test_run.md) registrou 23/23 testes aprovados (FUNC, PRIV, SEG, IA, ROB, UX) e 6 exports de evidencia em [`extension/reports/evidence/2026-06-27/`](../../extension/reports/evidence/2026-06-27/). Complemento de validacao academica: escrita manual de um ADR apos reuniao leva ~15-30 min; geracao leva ~5-15 s + ~2-5 min de revisao. Refinamento por secao evidenciado em [`extension/reports/evidence/2026-06-28/ideal-refinado.md`](../../extension/reports/evidence/2026-06-28/ideal-refinado.md). Cap de 30K com corte final evidenciado em [`extension/reports/evidence/2026-06-28/ideal-cap-30k-cortado.md`](../../extension/reports/evidence/2026-06-28/ideal-cap-30k-cortado.md).

---

## 1. Objetivo do Monitoramento

Avaliar se o ADR Generator cumpre o objetivo do MVP academico: transformar uma transcricao de reuniao em um ADR estruturado, util e revisavel, preservando a proposta local-first e deixando claro que o conteudo gerado por IA exige revisao humana.

**Pergunta central:** o fluxo captura/revisao/geracao/export produz um ADR coerente com a transcricao de teste, em menos tempo e com menos esforco do que escrever manualmente a partir do zero?

**Criterio de conclusao academica:** o artefato pode ser considerado suficiente quando os cenarios controlados demonstrarem que:

| Criterio | Resultado esperado |
|---|---|
| ADR estruturado | Campos principais preenchidos: titulo, contexto, problema, alternativas, decisao e consequencias. |
| Fidelidade | A decisao e os trade-offs aparecem coerentes com a transcricao usada no teste. |
| Revisao humana | A interface deixa claro que o ADR e gerado por IA e exige revisao antes do export. |
| Privacidade | A transcricao bruta nao fica retida apos a geracao bem-sucedida. |
| Utilidade | O resultado serve como rascunho aproveitavel, mesmo que exija ajustes. |

**Fora de escopo:** decisao de negocio "pivotar ou perseverar", adocao por times, sponsor, CSAT real, telemetria continua e metricas longitudinais.

---

## 2. Metricas de Uso

Como nao ha grupo piloto, as metricas de uso foram reduzidas para sinais observaveis durante demonstracao/testes controlados.

| Metrica | Como medir | Estado |
|---|---|---|
| **Fluxo ponta-a-ponta concluido** | Capturar/revisar transcricao → gerar ADR → revisar → exportar `.md` | ✅ validado no relatorio 2026-06-27 |
| **Cenarios executados** | Rodar 2 ou 3 transcricoes com decisoes arquiteturais diferentes | ✅ 6 exports de evidencia |
| **Uso do modo redacao (P2)** | Verificar se a transcricao pode ser editada antes do envio ao Gemini | ✅ |
| **Uso do refinamento por secao** | Testar pelo menos 1 ajuste em uma secao do ADR | ✅ `ideal.md` refinado na secao Consequencias |
| **Sessao no cap de 30K** | Usar transcricao longa ou fixture para validar aviso de truncamento | ✅ corte final gerou ADR valido sobre OpenTelemetry |

**Removido do escopo academico:** ADRs salvos por equipe, taxa de conversao reuniao→ADR em uso real, reunioes abortadas por pilotos e adocao por times.

---

## 3. Metricas de Desempenho

Para o projeto academico, basta medir desempenho perceptivel e registrar evidencias simples. Nao e necessario instrumentar p50/p95 com telemetria persistente.

| Metrica | Alvo academico | Como medir | Estado |
|---|---|---|---|
| **Tempo de geracao Gemini** | Resposta em tempo aceitavel para demonstracao | Cronometragem manual em 2 ou 3 geracoes | ✅ ~5-15 s |
| **Tempo manual vs. extensao** | Extensao deve reduzir claramente o esforco de rascunho | Comparar escrita manual aproximada com fluxo automatizado | ✅ manual ~15-30 min vs. extensao ~2-5 min + geracao |
| **Build da extensao** | `npm run build` verde | Relatorio/teste local | ✅ |
| **Erro visivel no fluxo feliz** | Nenhum erro bloqueante na demonstracao | Observacao manual no Chrome | ✅ 23/23 testes sem falha bloqueante |
| **Parse do JSON da IA** | ADR salvo quando a resposta respeita o schema | Validacao ja feita pelo parser | ✅ |

**Removido do escopo academico:** memoria p95 do service worker, serie historica de tokens, cold start formal, taxa sustentada de retries/429 e dashboards de erro.

---

## 4. Metricas de Impacto no Negocio

Aqui "impacto no negocio" foi adaptado para o escopo academico: em vez de receita, retencao ou adocao por equipes, mede-se valor demonstravel do MVP para o trabalho de faculdade.

| Metrica | Resultado esperado | Como medir | Estado |
|---|---|---|---|
| **Reducao de esforco** | Gerar um rascunho mais rapido do que escrever do zero | Cronometrar fluxo manual vs. extensao | ✅ reducao aproximada de 15-30 min para 2-5 min + 5-15 s |
| **Qualidade estrutural** | ADR contem as secoes do padrao Michael Nygard | Checklist manual sobre o `.md` exportado | ✅ exports contem campos principais |
| **Fidelidade da decisao** | Campo `decisao` nao contradiz a transcricao | Comparacao humana transcricao→ADR | ✅ aprovado em casos ideal, adversariais e ausencia de decisao |
| **Limites conhecidos documentados** | Dependencia de legendas, Gemini e revisao humana ficam explicitas | Conferir README/docs | ✅ |

**Metrica-mae academica:** ADR gerado e aproveitavel como rascunho estruturado sem reescrita total.

**Conclusao com base nos reports:** os exports demonstram que o MVP gera ADRs estruturados e coerentes para cenarios variados (OpenTelemetry, PostgreSQL/JSONB, Kafka, retencao de transcricoes, ausencia de decisao e feature flags). A ressalva conhecida e que `injection-3.md` descreveu "captura audio" no contexto, quando o produto captura legendas/transcricao.

**Conclusao sobre cap de 30K:** o cenario ideal inflado com lorem ipsum ate ~30.500 caracteres, cortando ~500 caracteres do final, ainda gerou ADR valido e coerente sobre OpenTelemetry. A decisao central foi preservada; houve apenas reducao de riqueza em consequencias/incertezas, aceitavel para MVP academico.

---

## 5. Metricas de Satisfacao do Usuario

Sem usuarios reais, a satisfacao do usuario vira avaliacao qualitativa do avaliador/professor e do proprio autor durante a demonstracao.

| Questao | Forma de avaliacao | Estado |
|---|---|---|
| O fluxo e compreensivel? | Observacao durante demo | ✅ UX 3/3 no relatorio |
| O ADR parece util para registrar a decisao? | Revisao humana do export | ✅ evidencias aproveitaveis como rascunho |
| A exigencia de revisao humana esta clara? | Conferir UI e front-matter | ✅ |
| O usuario entende o que sai do navegador? | Conferir consentimento e aviso LGPD | ✅ |

**Removido do escopo academico:** CSAT opt-in, entrevistas com personas, adocao por equipe e acompanhamento de satisfacao ao longo do tempo.

---

## 6. Ferramentas de Monitoramento

Para este escopo, monitoramento significa evidencias simples de validacao, nao telemetria de produto.

- **Relatorio manual:** registrar data, cenario, tempo aproximado, resultado e observacoes.
- **Export `.md`:** evidencia principal da qualidade do ADR gerado.
- **Console/Chrome manual:** observar erros bloqueantes durante o fluxo.
- **Sem analytics externo:** mantem a decisao zero-backend; nenhum Google Analytics, pixel ou telemetria central.

Instrumentacao local persistente de contadores pode ficar como melhoria futura, mas nao e obrigatoria para fechar a fase academica.

---

## 7. Benchmarks

| Referencia | Valor / criterio | Estado |
|---|---|---|
| **Baseline manual** | tempo aproximado para transformar uma transcricao em ADR manualmente | ✅ ~15-30 min |
| **Fluxo com extensao** | tempo aproximado para gerar, revisar e exportar o ADR | ✅ geracao ~5-15 s + revisao ~2-5 min |
| **Qualidade minima** | campos principais preenchidos e decisao coerente | ✅ 6 evidencias revisadas |
| **Privacidade minima** | transcricao bruta apagada apos sucesso e API key fora do disco local | ✅ |

O baseline nao precisa ser estatistico. Para a faculdade, uma comparacao honesta entre 1 ou 2 execucoes manuais e 2 ou 3 execucoes com a extensao ja sustenta a conclusao do artefato.

---

## 8. Acompanhamento de Tendencias

**Fora de escopo para o MVP academico.** Tendencia exige repeticao ao longo do tempo e usuarios reais. No lugar disso, o projeto usa uma leitura final dos cenarios:

| Padrao observado | Acao |
|---|---|
| ADR omite decisao importante | Ajustar prompt/few-shot |
| ADR inventa fato nao presente | Adicionar caso adversarial a suite de regressao |
| Transcricao longa trunca informacao critica | Priorizar sumarizacao > 30K como evolucao |
| Cap de 30K excedido | Confirmar corte automatico no final ou permitir corte manual; sumarizacao fica como evolucao |
| Usuario se confunde sobre IA | Melhorar aviso de revisao/consentimento |

---

## 9. Acoes Baseadas nas Metricas

| Gatilho no teste academico | Acao recomendada | Destino |
|---|---|---|
| Campo obrigatorio vazio ou incoerente | Revisar `responseSchema` e prompt | [`prompt_design_record.md`](../02_composicao/prompt_design_record.md) |
| Decisao contradiz a transcricao | Adicionar fixture de regressao e reforcar instrucao anti-alucinacao | [`canvas_testes_validacao.md`](../03_ensaio/canvas_testes_validacao.md) |
| Fluxo demora ou trava na demo | Corrigir UX/robustez antes da apresentacao | Extensao |
| Cap 30K afeta resultado | Documentar limite e propor sumarizacao como trabalho futuro | README / prompt |
| Cap 30K excedido | Confirmar com usuario antes de cortar; manter protecao no SW | UX / Gemini client |
| Falha de privacidade | Bloqueia conclusao do MVP ate corrigir | Checklist de lancamento |

---

## 10. Relatorios e Compartilhamento

**Relatorio ja existente:** [`extension/reports/2026-06-27_test_run.md`](../../extension/reports/2026-06-27_test_run.md).

**Complemento academico registrado:** o relatorio de validacao consolidou tempo manual vs. extensao, comportamento acima de 30K, refinamento por secao e conclusao academica final.

**Publico:** professor, banca ou avaliadores do trabalho. Nao ha sponsor, equipe piloto ou decisao de produto.

**Pendencias para fechar este canvas:**

1. ✅ Conclusao academica final registrada no relatorio existente.

**Referencias cruzadas:** [`canvas_estrategia_acao.md`](../01_exposicao/canvas_estrategia_acao.md), [`canvas_testes_validacao.md`](../03_ensaio/canvas_testes_validacao.md), [`painel_feedback_insights.md`](./painel_feedback_insights.md), [`canvas_planejamento_escalabilidade.md`](./canvas_planejamento_escalabilidade.md).
