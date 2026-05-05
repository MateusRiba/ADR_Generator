# Canvas de Estratégia e Ação do Projeto
## ADR Generator — Extensão para Google Meet (MVP)

---

## 1. Objetivo Estratégico Geral

Desenvolver uma extensão para Google Meet que capture automaticamente as discussões técnicas de reuniões, gerando registros de decisões arquiteturais (ADRs) estruturados sem necessidade de copiar e colar texto manualmente.

O projeto visa eliminar a fricção na documentação de decisões técnicas, integrando-se ao fluxo natural de trabalho das equipes de desenvolvimento e aumentando a rastreabilidade arquitetural com mínimo esforço humano.

---

## 2. Objetivos Estratégicos Secundários

- Capturar automaticamente o áudio/transcrição de reuniões no Google Meet via extensão Chrome, substituindo a entrada manual de texto.
- Gerar ADRs estruturados (Título, Contexto, Problema, Alternativas, Decisão, Consequências) a partir da transcrição capturada.
- Permitir edição manual e refinamento assistido por IA das seções do ADR gerado.
- Manter um histórico de ADRs acessível diretamente na extensão, com busca por palavras-chave.
- Exportar ADRs em formato Markdown (.md) compatível com repositórios de código.

---

## 3. Resultados-Chave Esperados (Quantitativos)

| Resultado | Meta | Prazo |
|---|---|---|
| Tempo para gerar ADR após reunião | De >30 min (manual) para <2 min | 1 mês (MVP) |
| Taxa de adoção por equipes-piloto | ≥ 3 equipes de desenvolvimento utilizando ativamente | 1 mês |
| ADRs gerados com aproveitamento direto (sem reescrita total) | ≥ 70% dos ADRs gerados | 1 mês |
| Tempo de resposta da IA (streaming iniciado) | < 2 segundos após solicitação | No lançamento do MVP |
| Limite de transcrição suportado | Até 30.000 caracteres (~7.500 tokens) por sessão | No lançamento do MVP |

---

## 4. Indicadores-Chave de Sucesso (KPIs)

- **Taxa de conversão reunião → ADR:** percentual de reuniões gravadas que resultam em um ADR salvo.
- **Tempo médio de geração do ADR:** da captura da transcrição à exportação do documento final.
- **Taxa de edição pós-geração:** frequência e extensão das edições manuais realizadas (proxy de qualidade da IA).
- **Número de ADRs armazenados por equipe:** indicador de engajamento e valor percebido.
- **Taxa de erros de captura:** falhas na gravação/transcrição da reunião.

---

## 5. Requisitos Estratégicos e Restrições

- **Privacidade e LGPD:** o MVP utilizará armazenamento local (LocalStorage/IndexedDB no navegador), eliminando necessidade de backend, autenticação de usuários e envio de dados para servidores próprios. Transcrições são processadas localmente e enviadas apenas à API da IA.
- **Plataforma:** extensão para Google Chrome (Manifest V3), compatível com o ambiente do Google Meet.
- **Dependência de API de IA:** o sistema depende da API do Google Gemini para geração e refinamento dos ADRs; custos de consumo devem ser dimensionados.
- **Escopo do MVP:** gravação de reunião via extensão + geração de ADR + edição + exportação em Markdown. Funcionalidades como integração com repositórios Git ou autenticação estão fora do escopo inicial.
- **Limite de contexto do modelo:** entradas limitadas a 30.000 caracteres para evitar saturação do contexto e controlar custos.
- **Prazo:** desenvolvimento do MVP estimado em aproximadamente 1 mês.

---

## 6. Priorização de Objetivos

| Prioridade | Objetivo | Justificativa |
|---|---|---|
| 🔴 Alta | Captura de transcrição via extensão Google Meet | É o diferencial central do MVP em relação à versão com copiar/colar |
| 🔴 Alta | Geração automática de ADR estruturado a partir da transcrição | Entrega o valor principal do produto |
| 🟡 Média | Edição manual e refinamento assistido por IA por seção | Garante qualidade e confiança do usuário no output |
| 🟡 Média | Exportação em Markdown e cópia para área de transferência | Viabiliza integração com fluxo de trabalho existente (Git, Confluence) |
| 🟢 Baixa | Histórico de ADRs com busca por palavras-chave | Agrega valor de longo prazo, mas não é bloqueante para o MVP |

---

## 7. Ações e Recursos Necessários

### Ações Técnicas

- **Ação 1 — Extensão Chrome (Captura):** Desenvolver extensão com Manifest V3 que acesse o Google Meet, capture o áudio da reunião e utilize a Web Speech API ou serviço de transcrição para converter fala em texto em tempo real.
- **Ação 2 — Integração com API de IA:** Configurar chamadas à API do Gemini (Google AI Studio) com prompt estruturado para gerar ADRs a partir da transcrição capturada, utilizando streaming de resposta.
- **Ação 3 — Interface da Extensão (Popup/Sidebar):** Desenvolver UI da extensão com campos de visualização da transcrição, exibição do ADR gerado por seções editáveis, botões de ação (Gerar, Regenerar, Exportar, Salvar).
- **Ação 4 — Persistência Local:** Implementar armazenamento de ADRs via LocalStorage/IndexedDB, com listagem, busca simples e exclusão.
- **Ação 5 — Exportação Markdown:** Implementar geração de arquivo `.md` para download e cópia para área de transferência.
- **Ação 6 — Refinamento por Seção:** Implementar comandos de refinamento assistido por IA ("melhore o contexto", "expanda as alternativas", "explique os trade-offs") que atualizam apenas a seção selecionada.

### Recursos Necessários

- **Equipe:** 1–2 engenheiros de software front-end/full-stack com experiência em extensões Chrome.
- **API de IA:** Conta no Google AI Studio com acesso ao Gemini; orçamento estimado para consumo de tokens durante desenvolvimento e fase piloto.
- **Infraestrutura:** Nenhuma infraestrutura de servidor necessária no MVP (zero backend).
- **Ferramentas:** Chrome DevTools, ambiente de desenvolvimento JavaScript/TypeScript, conta Google para testes no Meet.
- **Validação:** Equipes de desenvolvimento internas ou parceiras dispostas a testar o MVP em reuniões reais.
