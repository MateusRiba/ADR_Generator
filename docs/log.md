# Project Log

Registro cronológico append-only de alimentações da base de documentação do **ADR Generator**: criação, atualização e migração de artefatos da metodologia [Sinfonia](https://github.com/assertlab/sinfonia).
Formato: `## [YYYY-MM-DD] tipo | descrição`

Tipos: `feature`, `refactor`, `fix`, `decision`, `migration`, `deprecation`, `ingest`

---

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
