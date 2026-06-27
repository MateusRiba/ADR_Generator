# Checklist de Lançamento (Launch Checklist)
## ADR Generator — Extensão para Google Meet (MVP v0.1)

> Artefato da fase **Ensaio** da metodologia [Sinfonia](https://github.com/assertlab/sinfonia), construído sobre o template `Launch_Checklist_Model_Canvas_Template.md` (5 seções: Objetivo e Escopo do Lançamento, Estratégia de Lançamento, Plano de Comunicação, Plano de Contingência e Rollback, Critérios de "Go/No-Go").
> Funciona como o **documento autoritativo de Go/No-Go** da v0.1. A §5 consolida os critérios de aceitação de [`canvas_testes_validacao.md`](./canvas_testes_validacao.md) §4 e a cobertura dos 7 riscos críticos de [`checklist_analise_riscos_ia.md`](./checklist_analise_riscos_ia.md) §5–6 — não cria requisito novo, verifica o que já foi prometido.

**Legenda:** ✅ verificado · 🟦 código pronto, validação manual no Chrome pendente · ⬜ não verificado · ➖ não aplicável à v0.1.

---

## 1. Objetivo e Escopo do Lançamento

> *O que está sendo liberado e qual o objetivo primário.*

Liberar a **v0.1 do ADR Generator** — extensão Chrome MV3 que captura legendas do Google Meet e gera ADRs via Gemini — para um **piloto interno controlado** (equipe de engenharia / personas técnicas). 

**Objetivo primário:** validar em uso real o pipeline ponta-a-ponta (captura → transcrição → Gemini → ADR → revisão → export) e a aderência a LGPD, coletando feedback que alimenta a fase de Ressonância.

**Fora de escopo na v0.1:** publicação na Chrome Web Store, multiusuário/colaboração, fontes além do Meet, suite de regressão IA automatizada em CI.

---

## 2. Estratégia de Lançamento

> *A abordagem de lançamento e sua justificativa.*

| Aspecto | Decisão | Justificativa |
|---|---|---|
| **Tipo** | Piloto interno fechado, distribuição "Carregar sem compactação" (`dist/`) | Zero backend e dados sensíveis (LGPD) pedem validação controlada antes de qualquer exposição pública. |
| **Audiência** | Equipe ≤3 engenheiros + 1–2 pilotos das personas (Tech Lead, Eng. Software, EM) | Quem entende ADR e consegue avaliar fidelidade do output. |
| **Faseamento** | v0.1 interno → correção de débitos → reavaliar release público em fase posterior | Release público exige bloqueios adicionais (revisão jurídica, disclaimer LGPD, BYOK documentado) — ver §5. |
| **Reversibilidade** | Alta — recarregar versão anterior do `dist/`; sem loja, sem auto-update | Rollback trivial; nenhum usuário externo afetado. |

---

## 3. Plano de Comunicação

> *Quem precisa ser avisado, quando e como.*

| Audiência | O que comunicar | Quando | Como |
|---|---|---|---|
| **Pilotos (engenheiros)** | Como instalar (`dist/`), o que sai do navegador e vai à Google, limitações conhecidas (viés de sotaque, IA falível), canal de bug | Antes do primeiro uso | README/manual + mensagem direta |
| **Participantes das reuniões dos pilotos** | Que a reunião será transcrita e enviada à Gemini (consentimento LGPD) | Antes de cada captura | Banner de consentimento na extensão (`T-UX-02`) + mensagem padrão a colar no chat do Meet |
| **Sponsor (EM)** | Veredito de Go/No-Go, riscos residuais, plano de débitos | No gate de lançamento | Este documento §5 + relatório de teste |
| **Revisor jurídico/compliance** | Textos de consentimento e retenção para aprovação | Antes de release público (não bloqueia piloto interno) | Revisão dos itens §4.6 do plano anterior |

---

## 4. Plano de Contingência e Rollback

> *Procedimentos de emergência, gatilhos de rollback e ações corretivas.*

| Situação | Gatilho de rollback | Ação |
|---|---|---|
| **Falha funcional crítica** (pipeline quebra, ADR não gera) | Qualquer piloto reproduz em uso normal | Recarregar `dist/` da versão anterior; abrir issue `critical` (bloqueia merge) |
| **Vazamento/PII inesperado** (dado sai sem consentimento) | Qualquer ocorrência | Suspender piloto imediatamente; auditar `T-PRIV-03` (network); só retomar após correção |
| **Custo abusivo na Gemini** | Estouro de cota no projeto Google Cloud do usuário | Cap de 30K já limita; orientar revogar/rotacionar a API key (BYOK) |
| **Prompt injection bem-sucedida** | `decisao` adulterada por fala adversária | Patch obrigatório no `systemInstruction` antes do próximo merge; caso entra perpétuo na suite |

**Preservação de dados no rollback:** sem bump de `DB_VERSION`, o IndexedDB do usuário (histórico de ADRs) sobrevive à troca de versão. Reset total ("Apagar todos os dados", `T-PRIV-04`) disponível ao usuário a qualquer momento.

**Suporte:** bugs reportados via issues no GitHub; política por severidade — FUNC/PRIV/SEG = `critical` (bloqueia), IA/ROB = `high`, UX/PERF/COMPAT = `medium` (débito). Ver [`canvas_testes_validacao.md`](./canvas_testes_validacao.md) §7.

---

## 5. Critérios de "Go/No-Go"

> *Condições que precisam ser satisfeitas antes de prosseguir, com verificação por checkbox e decisão final.*

### 5.1 Cobertura dos 7 riscos críticos (bloqueante)

> Cada risco crítico de [`checklist_analise_riscos_ia.md`](./checklist_analise_riscos_ia.md) §5 exige mitigação **implementada** + caso de teste **aprovado**.

- [ ] **P1** — PII sem consentimento → banner bloqueante antes de `START_CAPTURE` (`T-UX-02`) — *código 🟦, manual ⬜*
- [ ] **P2** — Vazamento via Gemini → modo redação pré-envio + aviso persistente (`T-FUNC-08`) — *🟦 / ⬜*
- [ ] **S1** — Prompt injection via fala → delimitadores + bloco anti-injection (`T-SEG-01`) — *código ✅, suite ⬜*
- [ ] **T1** — Confusão IA × decisão → banner "Gerado por IA" + front-matter `revisado` real (`T-FUNC-06`) — *🟦 / ⬜*
- [ ] **P3** — Retenção de transcrição bruta → apaga IndexedDB pós-geração + reset total (`T-PRIV-01/04`) — *🟦 / ⬜*
- [ ] **F1** — Viés de sotaque → revisão humana obrigatória, gate persistido Editor+Histórico (`T-FUNC-07`) — *🟦 / ⬜*
- [ ] **S6** — Perda do Service Worker → checkpoint + rehidratação (`T-ROB-02`) — *🟦 / ⬜*

### 5.2 Critérios de aceitação por categoria (de `canvas_testes_validacao.md` §4)

- [ ] **FUNC** 100% passam — 🟦
- [ ] **PRIV** 100% passam (LGPD é binário, sem ressalva) — 🟦
- [ ] **SEG** 100% passam, `T-SEG-01` destacado — 🟦
- [ ] **IA** ≥ 90% da suite (`T-IA-02` aceita 9/10) — ⬜ suite a montar
- [ ] **PERF/COMPAT/UX** ressalva documentável aceitável — 🟦 parcial / ➖

### 5.3 Build, privacidade e permissões

- [x] `npm run build` verde (`tsc --noEmit` + vite) — ✅ 2026-06-27
- [ ] SW registra sem erro; sem warnings no fluxo feliz — 🟦
- [x] API key só em `chrome.storage.session` (não `local`/IndexedDB) — ✅ `T-SEG-04`
- [ ] Único tráfego externo = `generativelanguage.googleapis.com` (zero telemetria) — 🟦 `T-PRIV-03`
- [ ] `permissions`/`host_permissions` mínimos auditados — 🟦
- [ ] Conteúdo do ADR renderizado como texto (sem exec de `<script>`) — 🟦 `T-SEG-03`

### 5.4 Débitos NÃO bloqueantes para o piloto interno

➖ Onboarding `T-UX-01` · suite de regressão IA em CI · PERF/COMPAT formais · disclaimer LGPD polido. Viram débito rastreado, não impedem o piloto.

### 5.5 Bloqueantes adicionais para release PÚBLICO (fora do piloto)

⬜ Revisão jurídica dos textos LGPD · disclaimer de primeira instalação · BYOK documentado no manual · suite de regressão IA em CI.

---

### Decisão Final de Go/No-Go

> **Seleção:** ⬜ GO · ☑ **NO-GO condicional**

**Estado atual: NO-GO condicional.** O MVP está código-completo (Etapas 1–12) e o build está verde, mas **nenhuma validação manual no Chrome** dos 7 riscos críticos (§5.1) e das categorias FUNC/PRIV/SEG (§5.2) foi executada e registrada. Esse é o único bloqueio estrutural para o piloto interno.

**Para virar GO (piloto interno):**
1. Executar a passada manual no Chrome dos casos §5.1 e §5.2 (FUNC/PRIV/SEG a 100%).
2. Registrar em `reports/YYYY-MM-DD_test_run.md` (estrutura em `canvas_testes_validacao.md` §7).
3. Marcar os 7 checkboxes da §5.1.

### Aprovações

| Papel | Responsável (persona) | Aprovação |
|---|---|---|
| Qualidade técnica + IA/SEG | Tech Lead (Rafael) | ⬜ |
| FUNC/UX/ROB | Eng. Software | ⬜ |
| PRIV/LGPD | Tech Lead + revisor jurídico | ⬜ |
| Decisão final de Go | Engineering Manager (sponsor) | ⬜ |

> Personas: [`canvas_personas.md`](../01_exposicao/canvas_personas.md). Equipe ≤3; papéis se sobrepõem, mas o registro das aprovações é exigido por rastreabilidade.

---

## Referências cruzadas

- Casos de teste e critérios de aceitação: [`canvas_testes_validacao.md`](./canvas_testes_validacao.md)
- Riscos críticos e plano de mitigação: [`checklist_analise_riscos_ia.md`](./checklist_analise_riscos_ia.md)
- Estratégia de inteligência e fallback: [`intelligence_strategy_record.md`](./intelligence_strategy_record.md)
- Arquitetura e único tráfego externo: [`canvas_c4_model.md`](./canvas_c4_model.md)
