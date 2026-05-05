# Persona Model Canvas
## ADR Generator — Extensão para Google Meet

---

## Persona 1: Rafael, o Tech Lead

### 1. Nome da Persona
Rafael, o Tech Lead

### 2. Descrição da Persona
Rafael tem 34 anos e lidera um time de 6 engenheiros em uma empresa de software B2B. É responsável por conduzir reuniões de refinamento, decisões de arquitetura e revisões técnicas — em média 3 a 5 reuniões por semana no Google Meet. Tem forte senso de qualidade técnica e sabe da importância de documentar decisões, mas raramente consegue fazer isso de forma consistente depois das reuniões por falta de tempo. Usa o GitHub diariamente e o time mantém os ADRs em uma pasta `/docs/adr` do repositório.

### 3. Objetivos e Ganhos Esperados
- **Objetivo:** Garantir que todas as decisões técnicas relevantes do time estejam documentadas e rastreáveis no repositório.
- **Objetivo:** Reduzir o tempo gasto após reuniões organizando anotações e escrevendo documentação.
- **Objetivo:** Ter evidências históricas das decisões para onboarding de novos membros e auditorias de arquitetura.
- **Ganho:** Encerrar uma reunião já com o rascunho do ADR pronto para revisar e commitar.
- **Ganho:** Eliminar a dependência de memória ou anotações pessoais para reconstruir o contexto de uma decisão semanas depois.
- **Ganho:** Aumentar a maturidade de engenharia do time sem adicionar carga burocrática.

### 4. Problemas/Dores Atuais
- Após reuniões intensas, falta energia e tempo para escrever ADRs — a intenção existe, mas a execução não acontece.
- As decisões ficam dispersas em mensagens do Slack, comentários de PR e memória das pessoas.
- Quando tenta escrever um ADR de memória, percebe que esqueceu alternativas discutidas ou o raciocínio completo da decisão.
- Novos membros do time não encontram contexto sobre por que certas escolhas arquiteturais foram feitas.
- Já tentou usar templates de ADR no Notion, mas o processo manual ainda é muito lento.

### 5. Cenários de Uso
- Rafael ativa a gravação da extensão no início de uma reunião de arquitetura sobre migração de banco de dados. Ao final, clica em "Gerar ADR" e recebe um rascunho estruturado com as alternativas discutidas (PostgreSQL vs. DynamoDB) e a decisão tomada. Revisa em 2 minutos, exporta como `.md` e abre um PR diretamente no repositório.
- Durante uma reunião longa com múltiplos tópicos, Rafael percebe que a IA identificou uma decisão implícita ("decidimos implicitamente não usar cache por ora") que ele não havia planejado documentar. Salva o ADR com a seção de consequências expandida via refinamento assistido.
- Semanas depois, um novo engenheiro questiona por que o time escolheu uma determinada abordagem. Rafael busca pelo termo "autenticação" no histórico da extensão e compartilha o ADR gerado na reunião original.

---

## Persona 2: Camila, a Engenheira de Software

### 1. Nome da Persona
Camila, a Engenheira de Software

### 2. Descrição da Persona
Camila tem 27 anos, é engenheira de software com 3 anos de experiência, integrante de um time ágil que usa Google Meet para cerimônias e reuniões técnicas. Participa ativamente das discussões de arquitetura, mas raramente é ela quem escreve a documentação formal — essa responsabilidade costuma cair no Tech Lead. É produtiva, curiosa e tem interesse crescente em boas práticas de engenharia. Usa Chrome como navegador principal e já utiliza algumas extensões de produtividade no dia a dia.

### 3. Objetivos e Ganhos Esperados
- **Objetivo:** Contribuir ativamente para a documentação técnica do time, sem depender exclusivamente do Tech Lead.
- **Objetivo:** Aprender a estruturar melhor o raciocínio arquitetural através dos ADRs gerados.
- **Ganho:** Sentir que suas contribuições em reuniões ficam registradas e valorizadas formalmente.
- **Ganho:** Ter uma ferramenta que reduza a barreira de entrada para escrever documentação técnica de qualidade.
- **Ganho:** Conseguir gerar um ADR mesmo em reuniões onde o Tech Lead não estava presente.

### 4. Problemas/Dores Atuais
- Sente insegurança ao escrever ADRs do zero — não sabe se está capturando as seções certas ou com o nível de detalhe adequado.
- Muitas vezes sai de reuniões com a sensação de que decisões importantes foram tomadas, mas ninguém as documentou.
- Perde tempo tentando lembrar detalhes de discussões para preencher o campo "Alternativas consideradas" de um ADR retroativamente.
- Não tem um fluxo claro de onde salvar e versionar os ADRs após criá-los.
- Já tentou usar templates em Markdown, mas a escrita do zero inibe a adoção contínua.

### 5. Cenários de Uso
- Camila conduz uma reunião de alinhamento técnico com um colega sobre a escolha de uma biblioteca de testes. Ativa a extensão, e ao final usa o ADR gerado como base — ajusta apenas o campo "Consequências" com informações que a IA não tinha contexto para inferir, e exporta o arquivo `.md`.
- Ao revisar o ADR gerado, Camila usa o comando "expanda as alternativas" na seção correspondente para detalhar melhor as opções que foram mencionadas de passagem na reunião, enriquecendo o documento antes de compartilhá-lo com o time.
- Camila usa o histórico de ADRs da extensão como referência pessoal de aprendizado, revisitando decisões passadas para entender padrões arquiteturais adotados pelo time.

---

## Persona 3: Bruno, o Engineering Manager

### 1. Nome da Persona
Bruno, o Engineering Manager

### 2. Descrição da Persona
Bruno tem 40 anos e gerencia dois times de desenvolvimento em uma empresa de médio porte. Participa de reuniões técnicas mais como observador e facilitador do que como executor — seu foco é garantir que os times tomem boas decisões e que o conhecimento não fique centralizado em pessoas. Tem pouco tempo disponível, muitas reuniões no calendário e usa métricas para acompanhar a saúde dos times. Não escreve código no dia a dia, mas entende de arquitetura e valoriza rastreabilidade e governança técnica.

### 3. Objetivos e Ganhos Esperados
- **Objetivo:** Garantir que os dois times documentem decisões arquiteturais de forma consistente e sem depender de cobrança manual.
- **Objetivo:** Ter visibilidade sobre quais decisões técnicas relevantes foram tomadas recentemente, sem precisar participar de todas as reuniões.
- **Ganho:** Reduzir o risco de perda de conhecimento quando engenheiros saem do time.
- **Ganho:** Facilitar auditorias técnicas e revisões de arquitetura com histórico documentado e acessível.
- **Ganho:** Promover uma cultura de documentação sem adicionar reuniões ou processos burocráticos.

### 4. Problemas/Dores Atuais
- Os times têm boa intenção de documentar, mas a execução é inconsistente — alguns sprints há ADRs, outros não há nenhum.
- Quando precisa entender o racional de uma decisão técnica antiga, frequentemente precisa perguntar para a pessoa que tomou a decisão — se ela ainda estiver no time.
- Processos manuais de documentação são vistos pelos engenheiros como burocracia, gerando resistência.
- Não tem uma forma simples de verificar se as reuniões técnicas estão gerando documentação sem microgerenciar o time.
- Onboarding de novos engenheiros é lento porque o contexto arquitetural está disperso ou inexistente.

### 5. Cenários de Uso
- Bruno incentiva os Tech Leads dos dois times a adotarem a extensão. Após 2 semanas, percebe que o número de ADRs commitados no repositório aumentou sem que ele precisasse cobrar — a ferramenta removeu a fricção de documentar.
- Antes de uma reunião de revisão de arquitetura trimestral, Bruno pede a um Tech Lead que exporte os ADRs gerados no último mês. Com o histórico em mãos, a reunião foca em análise e direcionamento estratégico, não em reconstrução do passado.
- Durante o onboarding de um novo engenheiro sênior, Bruno indica o histórico de ADRs da extensão como primeira leitura para entender as principais decisões técnicas do produto — reduzindo em dias o tempo para o novo membro atingir produtividade.
