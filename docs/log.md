# Project Log

Registro cronológico append-only de alimentações da base de documentação do **ADR Generator**: criação, atualização e migração de artefatos da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
Formato: `## [YYYY-MM-DD] tipo | descrição`

Tipos: `feature`, `refactor`, `fix`, `decision`, `migration`, `deprecation`, `ingest`

---

## [2026-05-27] ingest | Modelo C4 da arquitetura técnica (fase Ensaio, 1/5)

Criado o primeiro artefato da fase **Ensaio**: `docs/03_ensaio/canvas_c4_model.md`, seguindo o template oficial `C4_Model_Canvas_Template.md` do Sinfonia (3 níveis: Contexto, Contêiner, Componente, cada um com Título / Elementos / Legenda).

**Conteúdo:**
- **Nível 1 — Contexto:** 3 atores (Rafael, Camila, Bruno), sistema principal (extensão Chrome MV3) e 5 sistemas externos (Google Meet, Web Speech API, Google Gemini API, Armazenamento Local, GitHub). Destaca que a Gemini API é o **único ponto de tráfego externo** — fato crítico para os artefatos de Análise de Riscos e Intelligence Strategy Record.
- **Nível 2 — Contêineres:** 4 contêineres (Content Script, Popup/Sidebar UI, Background Service Worker MV3, Banco de Dados Local IndexedDB) com tecnologia, responsabilidade e interações via `chrome.runtime.sendMessage`.
- **Nível 3 — Componentes:** 11 componentes internos divididos entre Background Service Worker (8 — Meeting Controller, Transcription Orchestrator, Prompt Manager, Gemini API Client, Data Parser/Validator, Refinement Engine, Storage Repository, Markdown Formatter) e UI (3 — Capture View, ADR Editor View, History View), com fluxo ponta-a-ponta de geração de ADR descrito em 10 passos.
- Inclui **diagramas Mermaid** para cada nível e uma seção de **Decisões Arquiteturais Implícitas** que adianta material para o Intelligence Strategy Record.

**Substitui e amplia** `c4_model.md` (na raiz do projeto, material legado de outros integrantes): preserva a decomposição original em 3 níveis e o conjunto de componentes propostos, mas reformata para o template Sinfonia, adiciona `Refinement Engine` (suporte à Ideia G do canvas de ideação), separa `Markdown Formatter` como componente próprio, formaliza a `UI` em 3 views (Capture/Editor/History) e adiciona diagramas Mermaid, legendas e referências cruzadas para todos os artefatos das fases anteriores.

**Removido:**
- `c4_model.md` (raiz do projeto) — conteúdo integrado e expandido em `docs/03_ensaio/canvas_c4_model.md`.

**Justificativa:** com a fase de Composição concluída e o pipeline central validado, o C4 é o ponto natural de entrada da fase de Ensaio — ele estabelece o vocabulário arquitetural (contêineres, componentes) sobre o qual os próximos artefatos vão se apoiar: a Análise de Riscos de IA precisa enumerar pontos de tráfego e persistência (Nível 1/2); o Intelligence Strategy Record vai se aprofundar no `Gemini API Client` e no `Prompt Manager` (Nível 3); o Canvas de Testes e Validação vai mapear suítes por contêiner/componente. Materializar o C4 cedo evita inconsistências de nomenclatura nos artefatos seguintes.

## [2026-05-27] ingest | Documentação completa da fase de Composição (3 canvases)

Criados os três artefatos prescritos pela fase **Composição** do Sinfonia, completando-a (3/3 ✅). Templates oficiais consultados: `Solution_Ideation_Model_Canvas_Template.md`, `Prompt_Design_Record_Model_Canvas_Template.md`, `Experiment_Design_Model_Canvas_Template.md`.

**`docs/02_composicao/canvas_ideacao_solucao.md`** — partindo do problema definido na fase de Exposição, foram brainstormadas 7 ideias de solução (A–G), posicionadas em matriz de **impacto × esforço**, e a ideia vencedora foi formalizada: **Extensão Chrome Manifest V3 + Gemini API + zero backend + persistência local**, complementada por refinamento por seção. Inclui critérios de avaliação e justificativa do veredito.

**`docs/02_composicao/prompt_design_record.md`** — registro de engenharia de prompt em 7 seções (metadados, estrutura, resposta, testes/qualidade, notas, histórico de versões, próximos passos). Documenta a versão **v2.0** em produção (Role Prompting + Chain-of-Thought via campo `analise_passo_a_passo` + Few-Shot + `responseSchema` forçado, `temperature: 0`, modelo `gemini-3-flash-preview`) e a **v1.0** descartada (zero-shot baseline com alucinação elevada). Inclui critérios de aceitação tabulados, parâmetros da API justificados e riscos conhecidos com mitigações. **Substitui e amplia** o `catalogo_de_prompts.md` antes na raiz do projeto.

**`docs/02_composicao/canvas_design_experimentos.md`** — formaliza o experimento já executado (transcrição real de ~35K caracteres sobre Microsoft Garnet vs Redis para o Engage Kiosk do Sebrae PE) seguindo o formato Sinfonia (hipótese, desenho, métricas, critérios pivotar/perseverar, resultado). Hipótese **validada** — todos os critérios atendidos. Inclui ainda 3 experimentos pendentes desenhados para a fase de Ensaio (ausência de decisão, captura via Web Speech API ponta-a-ponta, refinamento por seção). **Substitui e amplia** o `canvas_de_experimento.md` antes na raiz do projeto.

**Removidos da raiz do projeto:**
- `catalogo_de_prompts.md` — material legado de outros integrantes, conteúdo integrado e expandido no `prompt_design_record.md`.
- `canvas_de_experimento.md` — material legado de outros integrantes, conteúdo integrado e expandido no `canvas_design_experimentos.md`.

**Removido:**
- `docs/02_composicao/README.md` (placeholder) — substituído pelos próprios artefatos da fase, seguindo a mesma convenção de `01_exposicao/` (sem README intermediário).

**Justificativa:** com a fase de Exposição já completa e a PoC do backend validada, era hora de formalizar **o quê** estamos construindo (Ideação), **como** o componente de IA é montado (Prompt Design Record) e **como provamos** que funciona (Design de Experimentos). Sem esses artefatos, a transição para a fase de Ensaio seria feita sem fundamentação documentada, perdendo rastreabilidade do racional de design. Adicionalmente, materiais soltos na raiz (`catalogo_de_prompts.md`, `canvas_de_experimento.md`) feriam o princípio de organização por fase e duplicavam informação — foram incorporados aos canvases oficiais e excluídos.

## [2026-05-27] ingest | Canvas de Identificação do Domínio e Canvas de Mapeamento de Fontes de Dados (fase Exposição)

Criados os dois artefatos restantes da fase **Exposição** seguindo os templates oficiais do Sinfonia (`templates/Domain_Identification_Model_Canvas_Template.md` e `templates/Data_Source_Mapping_Model_Canvas_Template.md`).

**`docs/01_exposicao/canvas_identificacao_dominio.md`** — 7 seções do template preenchidas para o contexto do ADR Generator:
- Domínio: "Documentação de Decisões Arquiteturais em Engenharia de Software".
- Justificativa apoiada em três fatores: alto impacto / baixa adesão histórica de ADRs, adequação à extração estruturada via LLM, e viabilidade técnica imediata (Web Speech API + `responseSchema` do Gemini).
- Oportunidades de IA documentadas incluem CoT + few-shot (já validados em `backend/indexAllShot.js`), detecção de decisões implícitas e refinamento por seção.
- Riscos: LGPD (mitigado por processamento local), alucinação (mitigado por `temperature: 0` + schema forçado), custo de tokens (cap de 30K chars), dependência de fornecedor único e limitações do Manifest V3.

**`docs/01_exposicao/canvas_mapeamento_fontes_dados.md`** — 4 fontes de dados identificadas, cada uma com as 12 dimensões do template + tabela consolidada:
1. **Transcrição da reunião no Google Meet** — única fonte com conteúdo novo a cada uso; risco LGPD alto, mitigado por processamento local; cap de 30K caracteres.
2. **Exemplos de ADR para few-shot prompting** — embarcados no código, versionados, anonimizados.
3. **Schema JSON do ADR (padrão Michael Nygard)** — estável, parte do contrato com a Gemini.
4. **Histórico local de ADRs** — persistido em `chrome.storage.local` / IndexedDB, sob propriedade do usuário final.

**Justificativa:** sem esses dois artefatos, a fase de Exposição estava incompleta (faltavam 2 dos 4 canvases prescritos pelo Sinfonia) e as fases subsequentes (Composição, Ensaio) não teriam base sólida para serem produzidas — o canvas de Mapeamento de Fontes de Dados em particular alimenta diretamente o Intelligence Strategy Record (Ensaio) e o Prompt Design Record (Composição).

## [2026-05-27] migration | Reestruturação de docs/ em pastas por fase Sinfonia

Reorganização do diretório `docs/` para refletir as 4 fases cíclicas da metodologia Sinfonia (Exposição, Composição, Ensaio, Ressonância).

**Movimentações via `git mv` (histórico preservado):**
- `docs/personas_adr_generator.md` → `docs/01_exposicao/canvas_personas.md`
- `docs/canvas_estrategia_adr_generator.md` → `docs/01_exposicao/canvas_estrategia_acao.md`

**Estrutura nova:**
```
docs/
├── README.md                ← índice das 4 fases com status por artefato
├── log.md                   ← este arquivo
├── 01_exposicao/            ← 4 canvases (todos preenchidos)
├── 02_composicao/README.md  ← placeholder com artefatos previstos
├── 03_ensaio/README.md      ← placeholder
└── 04_ressonancia/README.md ← placeholder
```

**Edição em `canvas_estrategia_acao.md`:** removidas as subseções inline **8.1 (Canvas de Identificação do Domínio)** e **8.2 (Mapeamento de Fontes de Dados)** — eram resumos breves que agora viraram documentos dedicados na mesma pasta. Substituídas por links cruzados para `canvas_identificacao_dominio.md` e `canvas_mapeamento_fontes_dados.md`, evitando duplicação de informação.

**Justificativa:** os arquivos originais usavam nomes não padronizados (`personas_adr_generator`, `canvas_estrategia_adr_generator`) e estavam soltos na raiz de `docs/`. Sem uma estrutura por fase, novos artefatos do Sinfonia não tinham lugar natural para serem inseridos e a navegação ficaria caótica conforme o projeto avançasse pelas 14 entregas previstas pela metodologia. Os placeholders nas pastas das fases futuras servem de checklist visível de "o que ainda falta" no projeto.

## [2026-05-27] decision | Adoção da metodologia Sinfonia (AssertLab) como espinha dorsal da documentação

A documentação do projeto passa a seguir a metodologia [**Sinfonia**](https://github.com/assertlab/sinfonia) (AssertLab), que organiza o desenvolvimento de produtos de IA generativa em 4 fases cíclicas com 14 artefatos prescritos:

- **Exposição** (Alignment) — 4 canvases: Identificação do Domínio, Personas, Mapeamento de Fontes de Dados, Estratégia e Ação.
- **Composição** (Design) — 3 artefatos: Ideação da Solução, Prompt Design Record, Design de Experimentos.
- **Ensaio** (Build & Test) — 5 artefatos: C4 Model, Intelligence Strategy Record, Análise de Riscos de IA, Testes e Validação, Checklist de Lançamento.
- **Ressonância** (Measure & Learn) — 3 artefatos: Métricas de Impacto, Planejamento de Escalabilidade, Painel de Feedback.

**Justificativa:** o projeto já tinha 2 canvases produzidos de maneira ad-hoc (personas e estratégia), mas sem framework de referência para guiar o que produzir a seguir, nem garantia de que estavam cobrindo as dimensões necessárias para um produto de IA generativa. Sinfonia oferece templates curados especificamente para esse tipo de produto (IA gen), com forte ênfase em mapeamento de riscos, design de prompts e validação — tópicos críticos para um produto como o ADR Generator que depende centralmente de um LLM. Adoção também facilita comunicação com stakeholders acadêmicos/AssertLab que conhecem a metodologia.

**Estado de adesão pós-decisão:** fase Exposição completa (4/4 canvases). Demais fases pendentes, com placeholders documentando os artefatos previstos.
