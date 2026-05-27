# Canvas de Identificação do Domínio
## ADR Generator — Extensão para Google Meet (MVP)

> Artefato da fase **Exposição** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
> Objetivo: orientar e sistematizar a imersão no domínio onde a IA generativa pode agregar valor significativo.

---

### 1. Nome do Domínio

**Documentação de Decisões Arquiteturais em Engenharia de Software** — captura e estruturação automatizada de ADRs (Architecture Decision Records) a partir de reuniões técnicas síncronas realizadas no Google Meet.

---

### 2. Descrição do Domínio

O domínio cobre o ciclo completo de **registro de decisões arquiteturais** em times de desenvolvimento de software. Atualmente, decisões técnicas relevantes são tomadas durante reuniões síncronas (refinamentos, RFCs, revisões de arquitetura, war rooms) e, na maioria das vezes, **não são documentadas formalmente** — ficam dispersas em mensagens de Slack, comentários de PR, anotações pessoais ou somente na memória dos participantes.

O processo atual envolve:

- Reunião técnica no Google Meet com discussão de problema, alternativas e decisão;
- Intenção (geralmente do Tech Lead) de escrever um ADR no padrão Michael Nygard após a reunião;
- Escrita manual em editor Markdown, frequentemente dias depois, com perda de fidelidade;
- Commit do `.md` em pasta `/docs/adr` do repositório Git — quando ocorre.

O ADR Generator atua sobre esse fluxo capturando a transcrição da reunião e gerando um rascunho estruturado de ADR em poucos minutos, no padrão Michael Nygard (Título, Contexto, Problema, Alternativas, Decisão, Consequências, Incertezas).

---

### 3. Justificativa da Escolha

A escolha deste domínio se justifica por três fatores convergentes:

- **Alto impacto e baixa adesão:** ADRs são reconhecidamente uma das práticas mais valiosas de governança técnica, mas têm taxa de adoção historicamente baixa devido à fricção manual. Reduzir essa fricção tem efeito direto na maturidade de engenharia dos times.
- **Adequação à IA generativa:** A tarefa é essencialmente de **extração estruturada a partir de texto não estruturado** (transcrição) — exatamente onde LLMs com schema forçado entregam resultado superior. Não exige raciocínio aberto nem invenção de conteúdo: a IA apenas organiza o que foi dito.
- **Viabilidade técnica imediata:** Google Meet expõe legendas via Web Speech API; o Gemini suporta `responseSchema` para output JSON garantido; o MVP pode rodar 100% no navegador (zero backend), aderindo a LGPD por construção.

A solução se posiciona entre **produtividade individual** (Tech Lead, engenheiros) e **governança organizacional** (Engineering Manager), oferecendo valor em ambas as camadas com um único produto.

---

### 4. Problemas/Desafios Atuais

- **Fricção manual elevada:** escrever um ADR completo a partir de anotações leva de 30 minutos a 2 horas, prazo incompatível com a rotina pós-reunião de Tech Leads e engenheiros.
- **Perda de fidelidade temporal:** quando o ADR é escrito dias depois, alternativas discutidas e nuances de trade-off são esquecidas.
- **Bloqueio da página em branco:** engenheiros menos experientes têm insegurança sobre o que documentar e em que nível de detalhe, e acabam não escrevendo.
- **Centralização no Tech Lead:** a responsabilidade pela documentação recai sobre poucos, criando gargalo e desigualdade na contribuição.
- **Dispersão da informação:** decisões ficam espalhadas em Slack, PR, e-mails, gerando "perda de contexto" e onboarding lento.
- **Falta de rastreabilidade para a gestão:** Engineering Managers não conseguem auditar facilmente quais decisões foram tomadas em um período sem participar de todas as reuniões.
- **Decisões implícitas não registradas:** times frequentemente decidem "não fazer X" sem perceber que essa também é uma decisão arquitetural digna de ADR.

---

### 5. Oportunidades de IA Generativa

- **Extração estruturada de ADR a partir de transcrição** com schema JSON forçado (`responseSchema`), garantindo que todas as seções do padrão Michael Nygard sejam preenchidas ou explicitamente marcadas como ausentes.
- **Detecção de decisões implícitas** que os participantes não planejaram registrar (ex.: "decidimos por ora não usar cache"), expandindo a cobertura documental.
- **Chain-of-Thought + few-shot prompting** (já validado em `backend/indexAllShot.js`) para elevar a qualidade da extração, especialmente em transcrições longas e ruidosas.
- **Refinamento assistido por seção** ("melhore o contexto", "expanda as alternativas", "explique os trade-offs") para edição iterativa sem reescrever o ADR inteiro.
- **Sinalização de incertezas:** o modelo registra explicitamente lacunas (`incertezas`) quando o texto da reunião é ambíguo, evitando alucinação.
- **Sumarização de histórico** para Engineering Managers visualizarem decisões tomadas em um período, sem precisar ler cada ADR individual.

---

### 6. Benefícios Esperados (Qualitativos)

- **Cultura de documentação sem burocracia:** transformar ADRs de obrigação esquecida em subproduto natural das reuniões, mudando a relação dos times com governança técnica.
- **Democratização da documentação:** habilitar engenheiros juniores e mid-level a contribuírem com ADRs de qualidade, descentralizando a função historicamente concentrada em Tech Leads.
- **Preservação do conhecimento institucional:** reduzir drasticamente o risco de perda de contexto quando engenheiros saem do time ou trocam de projeto.
- **Onboarding mais rápido:** novos membros conseguem reconstruir o racional técnico do produto consultando o histórico de ADRs gerados.
- **Visibilidade gerencial sem microgestão:** managers acompanham a saúde decisória dos times através do histórico, sem precisar participar de toda reunião.
- **Reforço da privacidade como valor:** processamento local consolida a postura de respeito a LGPD e à confidencialidade de discussões internas, ampliando a confiança organizacional na ferramenta.

---

### 7. Riscos e Considerações Iniciais

- **Conformidade com LGPD:** transcrições de reuniões podem conter dados pessoais, nomes de clientes, informações estratégicas. Mitigação adotada: processamento 100% local no navegador (sem backend), e único envio externo é o trecho de transcrição → API Gemini, sob controle explícito do usuário.
- **Risco de alucinação do LLM:** modelo poderia inventar decisões ou alternativas. Mitigação: `temperature: 0`, schema forçado, instrução de sistema explícita ("não invente — extraia"), valor `"AUSÊNCIA DE DECISÃO"` para casos vazios.
- **Custo de tokens da API Gemini:** consumo escala com a duração das reuniões. Mitigação: cap de **30.000 caracteres (~7.500 tokens)** por sessão.
- **Qualidade variável da transcrição:** Web Speech API tem precisão sensível a sotaque, ruído e termos técnicos em inglês misturados ao português. Mitigação: permitir edição manual da transcrição antes de gerar o ADR.
- **Dependência de fornecedor único (Google):** Gemini API é o backbone de inferência. Mitigação prevista para pós-MVP: abstração da camada de LLM para permitir troca de provedor.
- **Resistência cultural:** times podem encarar a ferramenta como vigilância em vez de produtividade. Mitigação: controle 100% do usuário sobre ativação, armazenamento local e exportação manual — nada é compartilhado automaticamente.
- **Limitações do Manifest V3:** restrições do Chrome ao funcionamento de service workers e captura de áudio podem exigir workarounds técnicos durante a implementação da extensão.
