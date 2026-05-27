# Canvas de Mapeamento de Fontes de Dados
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Exposição** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
> Objetivo: mapear e organizar as fontes de dados necessárias para a construção e operação da solução de IA generativa.

---

## Visão Geral do Fluxo de Dados

```
[Google Meet (legendas/áudio)] → [Web Speech API (transcrição local)] → [Buffer de texto na extensão]
        → [Prompt + few-shot examples] → [Gemini API (JSON estruturado)] → [Edição do usuário]
                → [Markdown final] → [chrome.storage.local / IndexedDB]
```

Quatro fontes de dados foram identificadas. Apenas a **Fonte 1** alimenta o modelo de IA com conteúdo novo a cada uso; as Fontes 2 e 3 são estáticas (parte do prompt); a Fonte 4 é o resultado persistido localmente.

---

## Fonte 1 — Transcrição da Reunião no Google Meet

### 1. Nome da Fonte de Dados
Transcrição em tempo real de reunião no Google Meet

### 2. Descrição da Fonte de Dados
Conteúdo textual transcrito automaticamente a partir do áudio da reunião enquanto ela ocorre. Contém o diálogo dos participantes, incluindo discussão do problema técnico, alternativas consideradas, trade-offs, e a decisão (explícita ou implícita) tomada pelo time. É a fonte primária de contexto para a geração do ADR.

### 3. Origem dos Dados
- Áudio dos participantes da reunião do Google Meet, capturado pelo navegador Chrome.
- Convertido em texto pela **Web Speech API** (motor de reconhecimento de voz nativo do navegador) ou pelas legendas exibidas pelo próprio Google Meet.

### 4. Tipo de Dados
- **Textual não estruturado** (corpus em linguagem natural, predominantemente português, com inserções pontuais de termos técnicos em inglês).
- **Temporal** opcional (timestamps de cada segmento de fala, se a API utilizada disponibilizar).
- **Categórico** opcional (identificação do falante, quando disponível).

### 5. Formato dos Dados
- String contínua em memória durante a reunião (acumulada em buffer).
- Para a chamada à Gemini API: string única em texto plano (UTF-8), eventualmente prefixada por marcadores de fala (ex.: `Rafael: ...`, `Camila: ...`) quando a identificação do interlocutor estiver disponível.

### 6. Frequência de Atualização
- **Tempo real (streaming)** durante a reunião — a transcrição cresce a cada fala captada pela Web Speech API.
- Snapshot final consolidado é capturado **uma única vez** no momento em que o usuário aciona "Gerar ADR".

### 7. Qualidade dos Dados
- **Variável.** Sensível a:
  - Qualidade do microfone e ruído ambiente dos participantes.
  - Sotaque, velocidade e clareza de fala.
  - Mistura português/inglês em termos técnicos (ex.: "redis cluster", "trade-off") — pode gerar transcrições com grafia incorreta.
  - Falas sobrepostas, que a Web Speech API tende a descartar ou misturar.
- **Mitigação:** a UI da extensão exibe a transcrição capturada e permite edição manual antes do envio à Gemini.

### 8. Métodos de Coleta
- **Captura passiva via Web Speech API** acionada pelo usuário através de um botão "Iniciar captura" no popup/sidebar da extensão.
- Alternativa em avaliação: leitura programática do widget de legendas (closed captions) do próprio Google Meet quando o usuário tiver legendas ativadas.
- Em ambos os casos, o usuário **controla explicitamente** o início e o fim da captura — nada é gravado sem ação manual.

### 9. Acesso aos Dados
- **Acesso 100% local ao navegador.** Os dados transcritos vivem em memória do `content script` da extensão durante a sessão.
- O envio para a Gemini API ocorre **somente** quando o usuário aciona "Gerar ADR".
- Para o MVP, não há API REST nem banco de dados intermediário — o pipeline é direto: buffer da extensão → chamada HTTPS à Gemini.

### 10. Proprietário dos Dados
- **Usuário final da extensão** (Tech Lead, engenheiro, manager). O conteúdo da reunião é propriedade da pessoa/organização que conduz a reunião.
- O **ADR Generator não retém posse** sobre os dados; apenas oferece o pipeline de processamento sob controle do usuário.

### 11. Restrições de Privacidade e Segurança
- **LGPD (Lei 13.709/2018):** transcrições podem conter dados pessoais (nomes, decisões sobre clientes, contratos). Princípios aplicados:
  - **Minimização:** processamento somente do trecho efetivamente necessário para gerar o ADR.
  - **Localidade:** todo o pipeline interno (captura, buffer, persistência) ocorre no navegador do usuário; **nenhum dado trafega por servidor próprio do produto** (zero backend no MVP).
  - **Consentimento explícito:** a extensão só inicia captura mediante ação manual; deve exibir aviso visível aos participantes da reunião (responsabilidade do usuário, recomendada pela UI).
  - **Transparência:** o único envio externo é o trecho de transcrição enviado à **Google Gemini API** via HTTPS, sujeito aos [termos de uso do Google AI Studio](https://ai.google.dev/terms).
- **Chave de API:** armazenada localmente em `chrome.storage.local`, fornecida pelo próprio usuário; o produto não detém nem proxia chaves de terceiros.
- **Sem telemetria:** o MVP não envia logs nem métricas para servidor próprio.

### 12. Requisitos de Integração
- **Cap de 30.000 caracteres** (~7.500 tokens) por sessão para controlar custo da API Gemini e respeitar limites de contexto eficientes.
- **Truncamento ou sumarização prévia** caso a transcrição exceda o cap (a definir na fase de Composição).
- **Sanitização leve** antes do envio: remoção de marcadores duplicados, normalização de espaços em branco.
- **Compatibilidade com Manifest V3:** captura precisa funcionar dentro das restrições do service worker (sem APIs deprecadas).

---

## Fonte 2 — Exemplos de ADR para Few-Shot Prompting

### 1. Nome da Fonte de Dados
Conjunto de exemplos de ADR (few-shot examples) embarcados no prompt

### 2. Descrição da Fonte de Dados
Pares de exemplo `(transcrição → ADR JSON estruturado)` codificados diretamente no prompt enviado à Gemini. Servem como **demonstração da tarefa** (few-shot learning) para que o modelo aprenda o estilo, granularidade e formato esperado de saída.

### 3. Origem dos Dados
- Curadoria manual realizada pela equipe do projeto.
- Versão atual reside em `backend/indexAllShot.js` (PoC) e no arquivo `backend/archives/trancriptionTest.txt` (transcrição real de discussão sobre infraestrutura de cache).

### 4. Tipo de Dados
- **Textual** (transcrição) + **JSON estruturado** (ADR esperado) por par de exemplo.

### 5. Formato dos Dados
- Strings literais (template literals JavaScript) embutidas no código do prompt.
- Esquema do JSON segue o `responseSchema` definido para a Gemini.

### 6. Frequência de Atualização
- **Versionada com o código.** Atualizações ocorrem quando a equipe de desenvolvimento decide refinar a qualidade do prompt (não há atualização automática nem por usuário final).

### 7. Qualidade dos Dados
- Alta — exemplos curados manualmente para cobrir casos representativos (decisão clara, ausência de decisão, alternativas múltiplas).
- Risco: poucos exemplos podem enviesar o modelo. Plano: expandir a base conforme a fase de Composição definir.

### 8. Métodos de Coleta
- Construção manual a partir de transcrições reais de reuniões técnicas (com anonimização quando necessário).

### 9. Acesso aos Dados
- Embarcados diretamente no código da extensão; lidos em tempo de execução pelo background service worker que monta o prompt.

### 10. Proprietário dos Dados
- **Equipe de desenvolvimento do ADR Generator.**

### 11. Restrições de Privacidade e Segurança
- Exemplos devem ser **anonimizados** (sem nomes reais, dados de clientes ou informações confidenciais) antes de serem versionados no código aberto.

### 12. Requisitos de Integração
- Exemplos contam contra o budget de 30K caracteres da janela de contexto — manter cada exemplo enxuto.

---

## Fonte 3 — Schema JSON do ADR (Padrão Michael Nygard)

### 1. Nome da Fonte de Dados
Schema de resposta estruturada do ADR

### 2. Descrição da Fonte de Dados
Definição do contrato de saída esperado da Gemini API: lista de campos obrigatórios, tipos e descrições. Funciona como **estrutura coercitiva** garantindo que o modelo sempre devolva JSON parseável e completo.

### 3. Origem dos Dados
- Especificação interna do produto, derivada do padrão **Michael Nygard** de ADR.
- Implementação no PoC: `backend/index.js` (`SchemaType` enums) e `backend/indexAllShot.js` (string-based, mais compatível com SDK).

### 4. Tipo de Dados
- **Estrutural/metadado:** definição de schema (object com campos tipados).
- Campos atuais: `titulo` (string), `contexto` (string), `problema` (string), `alternativas` (string[]), `decisao` (string), `consequencias` (string[]), `incertezas` (string[]), `analise_passo_a_passo` (string, apenas no fluxo CoT).

### 5. Formato dos Dados
- Objeto JavaScript passado como parâmetro `responseSchema` na configuração da chamada à Gemini.
- Acompanhado de `responseMimeType: "application/json"` para forçar saída em JSON.

### 6. Frequência de Atualização
- **Estável.** Alterações ocorrem apenas quando o produto adicionar/remover seções do ADR. Cada mudança é uma decisão de produto deliberada.

### 7. Qualidade dos Dados
- Não aplicável (é um schema, não dados de entrada).

### 8. Métodos de Coleta
- Definido manualmente pela equipe do produto.

### 9. Acesso aos Dados
- Embarcado no código da extensão (background service worker).

### 10. Proprietário dos Dados
- **Equipe de desenvolvimento do ADR Generator.**

### 11. Restrições de Privacidade e Segurança
- Sem dados sensíveis; pode ser versionado abertamente.

### 12. Requisitos de Integração
- Schema precisa ser compatível com a versão da SDK Gemini em uso (`@google/generative-ai`).

---

## Fonte 4 — Histórico Local de ADRs Gerados

### 1. Nome da Fonte de Dados
Histórico de ADRs persistido localmente

### 2. Descrição da Fonte de Dados
Conjunto de ADRs gerados pelo usuário ao longo do tempo, armazenado para consulta, busca e referência futura. Forma a "base de conhecimento" pessoal/do time dentro da extensão.

### 3. Origem dos Dados
- Output da Gemini API + edições manuais aplicadas pelo usuário antes de salvar.

### 4. Tipo de Dados
- **Textual estruturado** (objeto JSON do ADR) + metadados (timestamp, título da reunião, tags opcionais).

### 5. Formato dos Dados
- Objetos JSON serializados em `chrome.storage.local` (registros pequenos) ou em **IndexedDB** (recomendado para histórico de centenas/milhares de ADRs com busca textual).

### 6. Frequência de Atualização
- Sob demanda: a cada ADR finalizado e salvo pelo usuário.

### 7. Qualidade dos Dados
- Pós-edição humana — alta. Reflete revisão e ajuste manual do rascunho da IA.

### 8. Métodos de Coleta
- Persistência manual acionada pelo botão "Salvar" da UI da extensão.

### 9. Acesso aos Dados
- API do Chrome (`chrome.storage.local`) ou IndexedDB.
- UI da extensão expõe listagem, busca por palavras-chave e exportação como `.md`.

### 10. Proprietário dos Dados
- **Usuário final.** O conteúdo nunca sai do navegador exceto por exportação manual (.md) ou cópia para área de transferência.

### 11. Restrições de Privacidade e Segurança
- LGPD: como persistência é local ao perfil do navegador do usuário, não há tratamento por servidor próprio — alinhado ao princípio de minimização e localidade.
- Recomendação: **não compartilhar perfil de navegador** entre múltiplos usuários (limitação inerente ao Chrome).

### 12. Requisitos de Integração
- Estrutura de armazenamento precisa permitir busca textual eficiente (índice invertido em IndexedDB ou full-scan razoável para o volume esperado de ADRs).
- Esquema de versionamento dos registros previsto para evolução do schema do ADR (Fonte 3) sem quebrar histórico antigo.

---

## Resumo Consolidado das Fontes

| # | Fonte | Tipo | Origem | Persistência | Risco LGPD |
|---|---|---|---|---|---|
| 1 | Transcrição da reunião | Textual não estruturado | Web Speech API / Google Meet | Buffer em memória | **Alto** — mitigado por processamento local |
| 2 | Exemplos few-shot | Textual + JSON | Curadoria interna | Embarcado no código | Baixo — anonimizados |
| 3 | Schema do ADR | Estrutural | Padrão Michael Nygard | Embarcado no código | Nenhum |
| 4 | Histórico de ADRs | JSON estruturado | Output IA + edição humana | `chrome.storage.local` / IndexedDB | Médio — dado fica local ao navegador |
