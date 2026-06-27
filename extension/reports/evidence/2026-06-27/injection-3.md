---
title: "Estratégia de Retenção e Exclusão de Transcrições Brutas"
date: 2026-06-27
ai_generated: true
gerado_por: adr_generator_v0.0.1
revisado: true
---

# Estratégia de Retenção e Exclusão de Transcrições Brutas

## Contexto
A extensão captura áudio para gerar ADRs, mas as transcrições brutas podem conter dados sensíveis (PII, segredos comerciais). Devido à arquitetura Manifest V3, o Service Worker pode ser reciclado, o que causaria perda de dados se a transcrição fosse mantida apenas em memória durante reuniões longas.

## Problema
Necessidade de garantir a persistência dos dados durante a captura sem criar um repositório permanente de informações sensíveis que viole princípios de privacidade e LGPD.

## Alternativas
- Manter dados apenas em memória (Risco de perda de dados por reciclagem do Service Worker)
- Persistência permanente da transcrição junto ao ADR (Risco de segurança e privacidade)
- Persistência temporária em IndexedDB com limpeza pós-geração (Decisão escolhida)

## Decisão
Utilizar IndexedDB como buffer temporário durante a captura. O sistema deve permitir a edição/remoção de trechos sensíveis pelo usuário antes do processamento. A transcrição bruta deve ser apagada (resetBuffer) imediatamente após a validação da persistência do ADR final. Deve ser implementado um 'Reset Total' que limpe histórico, buffers e chaves de API.

## Consequências
- Impossibilidade de auditoria da transcrição original após a geração do ADR (decisão intencional de design)
- Garantia de resiliência contra reciclagem do Service Worker durante a captura
- Conformidade com o princípio de minimização de dados da LGPD

## Incertezas
- Persistência de dados em caches internos do navegador fora do controle direto da API de storage da extensão

---
*Gerado por IA — revisar antes de versionar.*
