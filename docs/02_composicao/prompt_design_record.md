# Prompt Design Record
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Composição** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
> Objetivo: documentar **decisões de engenharia de prompt** — estrutura, técnicas, parâmetros, critérios de qualidade — de forma reproduzível e versionável. Este registro consolida e supera o material em `catalogo_de_prompts.md` produzido em iterações anteriores.

---

## 1. Metadados

| Campo | Valor |
|---|---|
| **Nome do prompt** | `adr_extractor_cot_fewshot` |
| **Propósito de negócio** | Extrair, a partir de uma transcrição de reunião técnica do Google Meet, um Registro de Decisão Arquitetural (ADR) estruturado no padrão **Michael Nygard**. |
| **Modelo alvo** | `gemini-3-flash-preview` (Google Gemini via `@google/generative-ai` SDK v0.11.5) |
| **Versão atual** | `v2.0` — CoT + Few-Shot + Schema forçado (produção) |
| **Versão anterior** | `v1.0` — Zero-shot baseline (descartada, ver §6) |
| **Implementação de referência** | [`backend/indexAllShot.js`](../../backend/indexAllShot.js) |
| **Status** | ✅ Validado em PoC com transcrição real de 35K caracteres (ver [`canvas_design_experimentos.md`](./canvas_design_experimentos.md)) |

---

## 2. Estrutura do Prompt

O prompt é dividido em **três componentes** entregues à API Gemini:

### 2.1. `systemInstruction` (estática, definida em código)

Combina **Role Prompting**, **Chain-of-Thought (CoT) via campo dedicado no schema**, **Few-Shot Prompting** e **regras rígidas de fidelidade**:

```text
Você é um arquiteto de software sênior especializado em documentação técnica.
Sua missão é extrair um Registro de Decisão Arquitetural (ADR) no padrão Michael
Nygard a partir de discussões técnicas fornecidas.

ESTRATÉGIA DE PENSAMENTO (Chain-of-Thought):
Para cada transcrição recebida, você deve primeiro preencher o campo
'analise_passo_a_passo' seguindo estes passos:
  1. Identifique o tema central da discussão.
  2. Liste as opções técnicas mencionadas pelos participantes.
  3. Verifique se houve um consenso ou decisão final clara.
  4. Identifique o que ficou sem resposta (incertezas).

EXEMPLO DE REFERÊNCIA (Few-shot):
Input: "A gente tá com problema de gargalo no banco atual. O Rafael sugeriu ir
pro Postgres. A Camila achou legal, mas o Bruno prefere continuar no SQL Server
e só criar uns índices novos. No fim, decidimos migrar pro Postgres mesmo por
causa do suporte nativo a JSONB que vamos precisar no próximo mês."
Output: {
  "analise_passo_a_passo": "Tema: Gargalo no banco de dados. Opções: Migrar
   para Postgres ou otimizar SQL Server. Decisão: Migrar para Postgres.
   Justificativa: Suporte nativo a JSONB.",
  "titulo": "Migração para PostgreSQL visando suporte a JSONB",
  "contexto": "O sistema atual apresenta gargalos de performance no banco de
   dados, e há uma necessidade iminente de suporte a dados semiestruturados.",
  "problema": "Performance insatisfatória do banco atual e falta de suporte
   nativo ideal para JSON.",
  "alternativas": ["Otimizar índices no SQL Server atual",
                   "Migrar para PostgreSQL (Decisão escolhida)"],
  "decisao": "Migrar para o banco de dados PostgreSQL devido ao seu suporte
   robusto e nativo a dados no formato JSONB.",
  "consequencias": ["Curva de aprendizado para a equipe",
                    "Refatoração das consultas atuais"],
  "incertezas": ["Tempo exato de indisponibilidade durante a migração"]
}

REGRAS RÍGIDAS:
  1. Fidelidade: Baseie-se ESTRITAMENTE no texto fornecido. Não invente detalhes
     técnicos, nomes de ferramentas ou prazos que não foram citados.
  2. Decisões Ausentes: Se não houver uma decisão clara na conversa, escreva
     explicitamente 'AUSÊNCIA DE DECISÃO' no campo 'decisao'.
  3. Tom de Voz: Use linguagem técnica, impessoal e profissional. Remova todo o
     ruído (saudações, piadas, conversas sobre o clima).

FORMATO DE SAÍDA (JSON):
Responda APENAS com um objeto JSON puro, sem blocos de código markdown ou
explicações adicionais, seguindo rigorosamente as chaves do schema.
```

### 2.2. `userPrompt` (dinâmico, injetado em runtime)

Template simples que injeta a transcrição capturada da reunião:

```javascript
const userPrompt = `Gere um ADR estruturado baseado nesta transcrição: ${transcriptionFromMeet}`;
```

**Variáveis injetadas:**
- `{transcriptionFromMeet}` — string UTF-8 com a transcrição capturada via Web Speech API (cap de 30.000 caracteres, ver Fonte 1 em [`canvas_mapeamento_fontes_dados.md`](../01_exposicao/canvas_mapeamento_fontes_dados.md)).

### 2.3. `responseSchema` (coerção estrutural)

Schema JSON passado como `responseSchema` na configuração do modelo, forçando saída parseável:

```javascript
const adrSchema = {
  type: "object",
  properties: {
    analise_passo_a_passo: { type: "string", description: "Raciocínio interno..." },
    titulo:                { type: "string" },
    contexto:              { type: "string" },
    problema:              { type: "string" },
    alternativas:          { type: "array", items: { type: "string" } },
    decisao:               { type: "string" },
    consequencias:         { type: "array", items: { type: "string" } },
    incertezas:            { type: "array", items: { type: "string" } }
  },
  required: ["analise_passo_a_passo", "titulo", "contexto", "problema",
             "alternativas", "decisao", "consequencias", "incertezas"]
};
```

---

## 3. Estrutura da Resposta

### 3.1. Formato pretendido

Objeto JSON puro (sem blocos markdown, sem texto adicional) seguindo o schema acima. Os 8 campos são **obrigatórios** — o modelo não pode omitir nenhum.

### 3.2. Exemplo de resposta de alta qualidade

Resposta real obtida no experimento de validação (transcrição de 35K caracteres sobre escolha entre Garnet e Redis para o projeto Engage Kiosk do Sebrae PE):

```json
{
  "analise_passo_a_passo": "Tema: Redução de custos de infraestrutura de cache para o projeto Engage Kiosk (Sebrae PE). Opções: Downgrade do Redis, DragonflyDB, Memcached, abordagem híbrida (Redis + Blob Storage) e Microsoft Garnet. Decisão: Migração para Microsoft Garnet em VM Linux. Justificativa: Compatibilidade com protocolo RESP, alta performance multi-threaded e redução drástica de custos em comparação ao serviço gerenciado Azure Cache for Redis Premium.",
  "titulo": "Migração do Azure Cache for Redis para Microsoft Garnet visando otimização de custos",
  "contexto": "O projeto Engage Kiosk apresenta um aumento de 40% no faturamento da Azure devido ao uso de instâncias Premium do Redis...",
  "problema": "Inviabilidade financeira do serviço gerenciado Azure Cache for Redis Premium frente à necessidade de alta disponibilidade, sharding e baixa latência...",
  "alternativas": [
    "Manter Azure Cache for Redis Premium (Custo proibitivo)",
    "Downgrade para instâncias Basic/Standard (Perda de sharding e performance)",
    "Migração para DragonflyDB (Risco de compatibilidade e persistência)",
    "Migração para Memcached (Limitação de estruturas de dados e necessidade de refatoração)",
    "Abordagem Híbrida: Redis + Azure Blob Storage (Complexidade de consistência e latência)",
    "Migração para Microsoft Garnet em VM Linux (Decisão escolhida)"
  ],
  "decisao": "Migrar a camada de cache para o Microsoft Garnet rodando em máquinas virtuais Linux na Azure...",
  "consequencias": [
    "Redução estimada de 50% nos custos de faturamento mensal da Azure",
    "Aumento do overhead operacional da equipe de infraestrutura",
    "Necessidade de implementação manual de monitoramento e segurança",
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

---

## 4. Testes e Qualidade

### 4.1. Critérios de aceitação

| Critério | Como medir | Status na v2.0 |
|---|---|---|
| Saída sempre em JSON válido (parseável) | `JSON.parse()` sem erro em N execuções | ✅ Garantido por `responseSchema` + `responseMimeType` |
| Todos os 8 campos obrigatórios presentes | Verificação de chaves no objeto retornado | ✅ Forçado por `required` no schema |
| Identificação correta da decisão final em conversas com decisão clara | Avaliação humana sobre o campo `decisao` | ✅ Validado em transcrição de 35K caracteres (caso Garnet) |
| Marcação explícita de `"AUSÊNCIA DE DECISÃO"` quando não há consenso | Inspeção do campo `decisao` em transcrições sem desfecho | ⚠️ A validar em experimentos da fase Ensaio |
| Zero invenção de ferramentas/prazos não citados | Comparação alternativas/consequências × transcrição original | ✅ Validado no caso Garnet — todas as alternativas mencionadas estavam na transcrição |
| Remoção de ruído conversacional (saudações, piadas) | Inspeção qualitativa | ✅ Validado |

### 4.2. Parâmetros da API

| Parâmetro | Valor | Justificativa |
|---|---|---|
| `model` | `gemini-3-flash-preview` | Latência baixa para experiência interativa na extensão; custo por token reduzido. |
| `temperature` | `0` | Determinismo máximo. ADRs são documentos técnicos — variação criativa não é desejável e amplifica risco de alucinação. |
| `responseMimeType` | `"application/json"` | Força o modelo a produzir JSON, evitando blocos de código markdown na resposta. |
| `responseSchema` | (objeto em §2.3) | Coerção estrutural — Gemini garante presença dos campos `required`. |

### 4.3. Limites de contexto

- **Cap de input:** 30.000 caracteres (~7.500 tokens) por transcrição. Truncamento (estratégia ainda a definir: head, tail ou sumarização prévia) caso exceda.
- **Output:** sem limite explícito, mas tipicamente entre 1K e 4K caracteres para ADRs bem formados.

---

## 5. Notas Adicionais

### 5.1. Pré-processamento da transcrição

Antes do envio à Gemini, a extensão aplicará (a especificar na fase de Ensaio):
- Normalização de espaços em branco.
- Remoção de marcadores de timestamp redundantes.
- Truncamento a 30.000 caracteres se necessário.
- **Não** aplicar correção ortográfica automática nesta fase (risco de alterar termos técnicos transcritos com grafia incorreta — ver §7 abaixo).

### 5.2. Casos de borda observados

- **Termos técnicos em inglês** (ex.: "Garnet", "RESP protocol", "sharding") são preservados pela Web Speech API com qualidade variável. O modelo demonstrou robustez em interpretar variações de grafia no experimento de validação.
- **Múltiplas decisões em uma reunião:** o prompt atual extrai **uma decisão por chamada**. Reuniões com várias decisões independentes exigirão fluxo de segmentação prévia — pendente para fases futuras.
- **Ausência de decisão clara:** comportamento esperado é o modelo escrever `"AUSÊNCIA DE DECISÃO"` em `decisao`. Caso pendente de validação experimental.

### 5.3. LGPD e fidelidade

- O prompt **não solicita** dados pessoais. A regra de fidelidade impede que o modelo "invente" informações fora da transcrição.
- O conteúdo da transcrição em si pode incluir nomes de clientes, contratos, dados sensíveis — esse risco é tratado na camada de produto (consentimento explícito do usuário antes da captura, ver Fonte 1 §11).

### 5.4. Riscos conhecidos do design atual

| Risco | Mitigação atual | Pendência |
|---|---|---|
| Few-shot único pode enviesar o estilo de saída | Exemplo escolhido representativo (PostgreSQL / JSONB) | Expandir base de exemplos com casos contrastantes (ausência de decisão, múltiplas alternativas) — fase de Ensaio |
| `temperature: 0` torna o modelo determinístico mas não imune a alucinação | Regra de fidelidade + schema forçado | Estabelecer regressão automatizada (suite de transcrições padrão × saídas esperadas) na fase de Ensaio |
| Cap de 30K caracteres pode truncar reuniões longas | Cap simples (a definir estratégia) | Sumarização prévia para reuniões >30K — fase de Ensaio |

---

## 6. Histórico de Versões

### v2.0 — CoT + Few-Shot + Schema (atual, produção)

**Técnicas combinadas:** Role Prompting, Chain-of-Thought (via campo dedicado `analise_passo_a_passo` no schema), Few-Shot Prompting, Coerção estrutural por `responseSchema`.

**Resultados:** elimina os problemas da v1.0. Validado experimentalmente em transcrição de 35K caracteres com identificação correta da decisão e todas as alternativas mencionadas (ver [`canvas_design_experimentos.md`](./canvas_design_experimentos.md)).

### v1.0 — Zero-shot baseline (descartada)

```text
Gere um ADR no formato Michael Nygard baseado na seguinte transcrição de reunião:
[Transcrição (30.000 Caracteres)]
```

**Problema identificado:** **alucinação elevada.** O modelo tentava preencher seções obrigatórias da estrutura (como `consequencias` ou `incertezas`) mesmo quando o time não as mencionava na reunião, inventando dados técnicos e prazos fictícios. Sem coerção estrutural, a saída também variava entre markdown e JSON, dificultando parsing.

**Motivo do descarte:** falha no critério de **fidelidade** (§4.1) — invenção de detalhes não citados.

---

## 7. Próximos Passos (entrega da fase de Ensaio)

- [ ] Expandir biblioteca de few-shot examples (mínimo 3 casos: decisão clara, ausência de decisão, múltiplas alternativas concorrentes).
- [ ] Implementar suíte de regressão (input fixo → JSON esperado) executável em CI.
- [ ] Definir estratégia de truncamento/sumarização para transcrições > 30K caracteres.
- [ ] Definir prompts derivados para o **refinamento por seção** (Ideia G do canvas de ideação): comandos como `"expanda alternativas"`, `"melhore o contexto"` que regeneram apenas o campo selecionado preservando o restante.

---

**Referências cruzadas:**
- Fontes de dados consumidas: [`canvas_mapeamento_fontes_dados.md`](../01_exposicao/canvas_mapeamento_fontes_dados.md) (Fontes 1, 2 e 3)
- Validação experimental: [`canvas_design_experimentos.md`](./canvas_design_experimentos.md)
- Ideia validada: [`canvas_ideacao_solucao.md`](./canvas_ideacao_solucao.md) §4
