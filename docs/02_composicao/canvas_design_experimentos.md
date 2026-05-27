# Canvas de Design de Experimentos
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Composição** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
> Objetivo: desenhar experimentos enxutos que **validem ou refutem hipóteses** centrais do produto com o mínimo de esforço, antes de avançar para a construção completa (fase de Ensaio).

---

## Experimento 1 — Robustez do prompt em transcrições longas e ruidosas

### 1. Ideia a Ser Validada

Pipeline central da Ideia A priorizada em [`canvas_ideacao_solucao.md`](./canvas_ideacao_solucao.md): **uma transcrição bruta de reunião do Google Meet, processada pelo prompt CoT + Few-Shot ([`prompt_design_record.md`](./prompt_design_record.md) v2.0) com `responseSchema` na Gemini, produz um ADR estruturado fiel à conversa.**

### 2. Hipótese Principal

> Acreditamos que **aplicar o prompt CoT + Few-Shot com `temperature: 0` e schema forçado** para **uma transcrição de reunião técnica longa (>30K caracteres) e ruidosa (gírias, interrupções, termos técnicos pouco comuns)** resultará em **um ADR estruturado que identifica corretamente a decisão final e lista as alternativas reais sem alucinação**. Saberemos que isso é verdade quando **a saída for um JSON válido, contiver a decisão final correta segundo avaliação humana e não incluir ferramentas/prazos não mencionados na transcrição**.

### 3. Desenho do Experimento (MVP)

- **Setup:** script Node.js (`backend/indexAllShot.js`) executando o prompt v2.0 contra a API Gemini.
- **Input:** transcrição real de **~35.000 caracteres** sobre escolha de tecnologia de cache para o projeto Engage Kiosk (Sebrae PE). Contém gírias informais, interrupções, sobreposições de fala e termos técnicos específicos pouco comuns (ex.: `Microsoft Garnet`, `RESP protocol`, `Azure Cache for Redis Premium`).
- **Variáveis controladas:** mesmo modelo (`gemini-3-flash-preview`), mesmo `temperature: 0`, mesmo schema, mesma `systemInstruction`.
- **Procedimento:**
  1. Carregar a transcrição do arquivo de teste.
  2. Executar uma chamada à API.
  3. Validar parse do JSON.
  4. Verificar presença dos 8 campos obrigatórios.
  5. Avaliar manualmente: decisão final correta? Alternativas correspondem ao que foi discutido? Há invenção de dados?

### 4. Métricas-Chave de Aprendizagem

| Métrica | Tipo | Como obter |
|---|---|---|
| **Saída em JSON válido** | Quantitativa binária | `JSON.parse()` sem erro |
| **Captura do arquivo de entrada (input cabe no contexto)** | Quantitativa binária | API retorna resposta sem erro de token limit |
| **Identificação correta da decisão final** | Qualitativa | Avaliação humana do campo `decisao` × decisão real da reunião |
| **Fidelidade das alternativas listadas** | Qualitativa | Comparação `alternativas[]` × menções na transcrição |
| **Presença de alucinação** | Qualitativa | Inspeção de `consequencias` e `incertezas` × conteúdo da transcrição |

### 5. Critérios de Sucesso ("Pivotar ou Perseverar")

**Perseverar** se, em uma única execução:
- ✅ JSON válido e completo (8 campos obrigatórios presentes).
- ✅ Decisão correta identificada: **migração para Microsoft Garnet em VM Linux** (Garnet vs Redis vs alternativas).
- ✅ Pelo menos 4 das 5 alternativas reais (Manter Redis Premium, Downgrade Basic/Standard, DragonflyDB, Memcached, Híbrida Redis+Blob, Garnet) presentes em `alternativas[]`.
- ✅ Zero invenção de ferramentas ou prazos não citados.

**Pivotar** caso:
- ❌ JSON inválido ou campo obrigatório ausente → reavaliar `responseSchema` ou trocar para outro provedor de LLM.
- ❌ Decisão errada → reavaliar a estratégia CoT (a etapa "Verifique se houve um consenso ou decisão final clara" não está funcionando).
- ❌ Alucinação evidente (ferramentas/prazos não citados) → reforçar regras de fidelidade no prompt ou reduzir cap de input.

### 6. Resultado Real Obtido

**Status:** ✅ **HIPÓTESE VALIDADA** em execução de 2026-05-27 com `backend/indexAllShot.js`.

Saída obtida (JSON válido, parseável):

```json
{
  "analise_passo_a_passo": "Tema: Redução de custos de infraestrutura de cache para o projeto Engage Kiosk (Sebrae PE). Opções: Downgrade do Redis, DragonflyDB, Memcached, abordagem híbrida (Redis + Blob Storage) e Microsoft Garnet. Decisão: Migração para Microsoft Garnet em VM Linux. Justificativa: Compatibilidade com protocolo RESP, alta performance multi-threaded e redução drástica de custos em comparação ao serviço gerenciado Azure Cache for Redis Premium.",
  "titulo": "Migração do Azure Cache for Redis para Microsoft Garnet visando otimização de custos",
  "contexto": "O projeto Engage Kiosk apresenta um aumento de 40% no faturamento da Azure devido ao uso de instâncias Premium do Redis para suportar o volume de sessões e metadados...",
  "problema": "Inviabilidade financeira do serviço gerenciado Azure Cache for Redis Premium frente à necessidade de alta disponibilidade, sharding e baixa latência para o sistema Engage Kiosk.",
  "alternativas": [
    "Manter Azure Cache for Redis Premium (Custo proibitivo)",
    "Downgrade para instâncias Basic/Standard (Perda de sharding e performance)",
    "Migração para DragonflyDB (Risco de compatibilidade e persistência)",
    "Migração para Memcached (Limitação de estruturas de dados e necessidade de refatoração)",
    "Abordagem Híbrida: Redis + Azure Blob Storage (Complexidade de consistência e latência)",
    "Migração para Microsoft Garnet em VM Linux (Decisão escolhida)"
  ],
  "decisao": "Migrar a camada de cache para o Microsoft Garnet rodando em máquinas virtuais Linux na Azure. A migração será faseada, iniciando pelo cache de notícias (extraídas via webscraping) para validação, seguida pelos dados de permissões e sessões...",
  "consequencias": [
    "Redução estimada de 50% nos custos de faturamento mensal da Azure",
    "Aumento do overhead operacional da equipe de infraestrutura (gerenciamento de VMs, patches e backups)",
    "Necessidade de implementação manual de monitoramento (Prometheus/Azure Monitor) e segurança (TLS/Key Vault)",
    "Risco de Vendor Lock-in com tecnologia Microsoft .NET",
    "Necessidade de validação rigorosa de scripts Lua e latência de cauda (P99)"
  ],
  "incertezas": [
    "Estabilidade do Garnet em produção a longo prazo (early adopter)",
    "Suporte nativo para clustering e geo-replicação em versões futuras",
    "Impacto real do Garbage Collector do .NET na latência sob carga extrema"
  ]
}
```

**Avaliação dos critérios:**

| Critério | Resultado |
|---|---|
| JSON válido | ✅ |
| Decisão correta (Garnet vs Redis) | ✅ |
| Alternativas reais presentes | ✅ 6/6 — superou o mínimo de 4/5 |
| Zero invenção | ✅ Verificação humana confirmou que ferramentas/consequências citadas estão na transcrição |

**Conclusão:** o pipeline CoT + Few-Shot + Schema é robusto o suficiente para o MVP. Avançamos para a fase de **Ensaio** com confiança no design do prompt.

---

## Experimentos Pendentes (a executar na fase de Ensaio)

Os experimentos abaixo estão **desenhados** mas a execução é prevista para a fase de **Ensaio** (Build & Test), onde a estratégia de testes completa será consolidada no `canvas_testes_validacao.md`.

### Experimento 2 — Comportamento em ausência de decisão

**Hipótese:** o modelo escreve explicitamente `"AUSÊNCIA DE DECISÃO"` no campo `decisao` quando a reunião termina sem consenso, em vez de inventar uma decisão.
**Input:** transcrição curada de reunião em que alternativas são discutidas mas o grupo decide "vamos pensar mais e voltar semana que vem".
**Sucesso:** `decisao === "AUSÊNCIA DE DECISÃO"` e `alternativas` corretamente populadas.

### Experimento 3 — Captura via Web Speech API ponta-a-ponta

**Hipótese:** uma extensão Manifest V3 consegue acumular transcrição via Web Speech API durante uma reunião do Meet com qualidade comparável à transcrição de referência usada no Experimento 1.
**Input:** reunião real de 15–30 minutos.
**Sucesso:** transcrição capturada gera ADR com critérios equivalentes aos do Experimento 1.

### Experimento 4 — Refinamento por seção (Ideia G)

**Hipótese:** comandos como `"expanda alternativas"` regeneram apenas o campo selecionado sem degradar os demais.
**Input:** ADR gerado no Experimento 1 + comando de refinamento.
**Sucesso:** apenas o campo alvo muda; demais campos preservados; output ainda válido contra o schema.

---

**Referências cruzadas:**
- Ideia validada: [`canvas_ideacao_solucao.md`](./canvas_ideacao_solucao.md) §4
- Prompt utilizado: [`prompt_design_record.md`](./prompt_design_record.md) v2.0
- Fonte de dados do experimento: [`canvas_mapeamento_fontes_dados.md`](../01_exposicao/canvas_mapeamento_fontes_dados.md) Fonte 1
