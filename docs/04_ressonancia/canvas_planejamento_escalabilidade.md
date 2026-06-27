# Canvas de Planejamento de Escalabilidade
## ADR Generator — Extensao para Google Meet (MVP academico)

> Artefato da fase **Ressonancia** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), adaptado ao contexto real do projeto: **trabalho simples de faculdade**, sem operacao multi-equipe, sem publico externo e sem necessidade de dimensionar infraestrutura produtiva.
> **Versao v1 (limites arquiteturais e trabalhos futuros).** Este canvas nao projeta crescimento comercial; ele explica ate onde a arquitetura atual escala, quais limites existem e quais evolucoes fariam sentido se o projeto deixasse de ser academico.

**Legenda:** ✅ definido no escopo academico · 🔄 testavel por cenario controlado · ➖ fora de escopo.

**Evidencias ja disponiveis:** [`extension/reports/2026-06-27_test_run.md`](../../extension/reports/2026-06-27_test_run.md) validou build, fluxo funcional, privacidade, robustez do Service Worker, retry/backoff documentado e ausencia de falhas bloqueantes em 23/23 testes.

---

## 1. Objetivo da Escalabilidade

Avaliar os limites do MVP sem transformar o projeto em um plano de produto. A pergunta adequada para a faculdade nao e "como escalar para dezenas de equipes?", mas:

> A arquitetura local-first, sem backend, e suficiente para demonstrar a geracao de ADRs a partir de transcricoes do Meet? Quais limites aparecem se o uso crescer?

**Conclusao arquitetural imediata:** para o escopo academico, a arquitetura atual e suficiente. A extensao roda no navegador, usa armazenamento local e chama diretamente a Gemini API com chave do usuario. Nao ha servidor proprio para dimensionar.

---

## 2. Volume Esperado de Interacoes

O volume real do projeto e de demonstracao/teste, nao de operacao.

| Cenario | Volume esperado | Objetivo |
|---|---|---|
| **Demo academica** | 1 execucao ponta-a-ponta | ✅ fluxo validado no relatorio |
| **Validacao controlada** | 2 ou 3 transcricoes diferentes | ✅ 6 cenarios com exports |
| **Transcricao longa** | 1 caso perto/acima do cap de 30K chars | Verificar limite e mensagem de truncamento |
| **Historico local** | algumas dezenas de ADRs, se necessario | Mostrar busca/lista/export no IndexedDB |

**Fora de escopo:** projecao por equipes, ADRs/equipe/semana, crescimento mensal, retencao de usuarios e carga multiusuario.

---

## 3. Requisitos de Infraestrutura

| Necessidade | Exige infraestrutura adicional? | Observacao |
|---|---|---|
| Rodar a demo | **Nao** | Basta Chrome, extensao carregada e API key Gemini |
| Salvar historico local | **Nao** | IndexedDB no navegador |
| Gerar ADRs | **Nao no projeto** | A inferencia acontece na API Gemini do Google |
| Compartilhar ADRs entre usuarios | **Sim** | Exigiria backend, autenticacao e politica LGPD mais forte |
| Coletar metricas agregadas | **Sim/parcial** | Exigiria backend ou export manual de arquivos |
| Publicar para usuarios externos | Parcial | Chrome Web Store, documentacao e revisao de privacidade |

**Conclusao:** para a faculdade, nao ha requisito de infraestrutura adicional. Backend so faria sentido se a proposta mudasse para colaboracao, telemetria agregada ou produto publico.

---

## 4. Estrategias de Escalabilidade

| Estrategia | Aplicacao no escopo academico | Status |
|---|---|---|
| **Manter zero backend** | Caminho recomendado; reduz complexidade e reforca privacidade | ✅ |
| **BYOK (usuario informa API key)** | Mantem custo da Gemini fora do projeto e simplifica operacao | ✅ |
| **Cap de 30K caracteres** | Controla custo/latencia; precisa ser documentado como limite | ✅ |
| **Sumarizacao para transcricoes longas** | Boa evolucao futura se o cap prejudicar qualidade | 🔄 futuro |
| **Novas fontes alem do Meet** | Possivel evolucao, mas nao necessaria para demonstracao | ➖ |
| **Backend colaborativo** | Rompe a premissa local-first; nao justificado para faculdade | ➖ |

---

## 5. Custo Estimado

No MVP academico, o custo relevante e o consumo pontual da Gemini durante desenvolvimento/demo.

```
Custo aproximado = numero_de_geracoes × tokens_por_geracao × preco_do_modelo
```

Como o projeto usa BYOK, a cobranca fica no projeto Google Cloud da chave informada pelo usuario. Para uma demonstracao com poucas transcricoes, o custo tende a ser baixo e nao exige planejamento financeiro formal.

**O que documentar na apresentacao:** existe custo por chamada a API; o cap de 30K limita payload; em uso real seria necessario acompanhar cotas e precos vigentes da Gemini.

---

## 6. Riscos e Mitigacao

| Risco | Impacto no projeto academico | Mitigacao |
|---|---|---|
| Cota/erro 429 da Gemini | Pode quebrar a demo | Retry/backoff ja implementado; ter transcricao/resultado de evidencia salvo |
| Mudanca no DOM do Meet | Pode impedir captura ao vivo | Captura validada na rodada manual; manter fixture/transcricao revisada como fallback |
| Transcricao muito longa | Pode truncar decisao relevante | Cap visivel + documentar sumarizacao como trabalho futuro |
| Dependencia de API externa | Demo depende de internet/chave valida | Explicar dependencia e manter evidencias em `extension/reports/` |
| Compartilhamento de ADRs | Nao atendido | Declarar fora de escopo; backend seria evolucao |
| Dados sensiveis | Risco se usado em reuniao real | ✅ PRIV 4/4, consentimento, revisao previa e zero backend proprio |

---

## 7. Monitoramento de Escalabilidade

Para o escopo academico, monitoramento de escala vira uma checagem de limites, nao acompanhamento continuo.

| Sinal | Como avaliar | Decisao |
|---|---|---|
| Tempo de geracao alto | Cronometrar 2 ou 3 chamadas | Documentar limite ou trocar modelo futuramente |
| Truncamento no cap de 30K | Testar transcricao longa | Propor sumarizacao como evolucao |
| Falha de captura no Meet | Testar demo real ou fixture | Ajustar seletor ou usar modo revisao/transcricao |
| Historico local pesado | Seed manual/sintetico, se necessario | Otimizar IndexedDB somente se houver problema |

**Fora de escopo:** limiares para numero de equipes, suporte self-service, Web Store, dashboard de uso e monitoramento central.

---

## 8. Plano de Teste em Ambiente Escalado

Ambiente "escalado" aqui significa testar limites tecnicos do MVP, nao simular uma empresa inteira.

| Teste | Necessario para fechar faculdade? | Estado |
|---|---|---|
| Transcricao longa perto do cap de 30K | Sim, se houver tempo | 🔄 |
| Reuniao/demo ponta-a-ponta no Meet | Sim | ✅ validado na rodada manual |
| Historico com dezenas de ADRs | Opcional | ➖ nao necessario; historico/export foram validados no escopo funcional |
| Centenas de ADRs no IndexedDB | Nao | ➖ |
| Multi-equipe / carga real | Nao | ➖ |
| Concorrencia de chamadas Gemini | Nao | ➖ |

**Pendencias para fechar este canvas:**

1. 🔄 Executar pelo menos um caso com transcricao longa ou justificar o cap como limite conhecido.
2. ✅ Documentar que backend, colaboracao e metricas agregadas ficam como trabalhos futuros.
3. ✅ Manter evidencias salvas para fallback de demonstracao caso Meet/Gemini falhem ao vivo.

**Referencias cruzadas:** [`canvas_c4_model.md`](../03_ensaio/canvas_c4_model.md), [`intelligence_strategy_record.md`](../03_ensaio/intelligence_strategy_record.md), [`canvas_metricas_escala_impacto.md`](./canvas_metricas_escala_impacto.md), [`canvas_estrategia_acao.md`](../01_exposicao/canvas_estrategia_acao.md).
