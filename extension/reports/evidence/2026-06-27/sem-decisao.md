---
title: "Avaliação de Provedores de Observabilidade e Tracing Distribuído"
date: 2026-06-27
ai_generated: true
gerado_por: adr_generator_v0.0.1
revisado: true
---

# Avaliação de Provedores de Observabilidade e Tracing Distribuído

## Contexto
A stack atual composta por Prometheus e Loki gera alto custo operacional para o time de SRE e carece de recursos eficientes de tracing distribuído, o que impacta o tempo de resposta a incidentes.

## Problema
Necessidade de reduzir o tempo de investigação de incidentes e a carga operacional de manutenção da infraestrutura de observabilidade.

## Alternativas
- Manutenção da stack atual (Prometheus/Loki) com padronização de instrumentação
- Migração para Datadog
- Migração para Grafana Cloud

## Decisão
AUSÊNCIA DE DECISÃO

## Consequências
- Atraso na definição da nova ferramenta para coleta de dados adicionais
- Necessidade de execução de testes de carga (PoC) com volume real no Grafana Cloud
- Exigência de modelagem de cenários de custo (TCO) comparativos entre as opções

## Incertezas
- Custo total de ingestão de logs de checkout e pagamentos no Datadog
- Capacidade de retenção e mascaramento de dados sensíveis no Grafana Cloud
- Definição do teto orçamentário pelo departamento financeiro
- Custo de oportunidade da equipe ao manter a operação da stack atual

---
*Gerado por IA — revisar antes de versionar.*
