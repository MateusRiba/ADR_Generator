---
title: "Migração para processamento assíncrono de antifraude via Kafka"
date: 2026-06-27
ai_generated: true
gerado_por: adr_generator_v0.0.1
revisado: true
---

# Migração para processamento assíncrono de antifraude via Kafka

## Contexto
O sistema de checkout apresenta falhas de conversão devido à dependência síncrona de um provedor externo de antifraude, que causa erros no pedido quando apresenta lentidão ou indisponibilidade.

## Problema
Acoplamento síncrono com provedor de antifraude gerando indisponibilidade no checkout e perda de vendas.

## Alternativas
- Manter fluxo síncrono com retries HTTP
- Implementar RabbitMQ para processamento assíncrono
- Implementar Kafka para processamento assíncrono (Decisão escolhida)

## Decisão
Implementar processamento assíncrono de antifraude utilizando Apache Kafka. O checkout publicará eventos no tópico 'payment-events' e o pedido ficará em status 'pendente_antifraude' até o retorno do processamento. A idempotência será garantida via 'payment_id'. O rollout inicial será limitado a pagamentos via cartão de crédito.

## Consequências
- Desacoplamento do checkout em relação ao provedor de antifraude
- Necessidade de criação de interface operacional para monitoramento de pedidos pendentes
- Garantia de rastreabilidade para auditoria e dados
- Existência de um intervalo de tempo entre o pagamento e a liberação do pedido

## Incertezas
- Definição do tempo de timeout para transição para revisão manual
- Design final da coluna de status no painel administrativo

---
*Gerado por IA — revisar antes de versionar.*
