---
title: "Migração do módulo de relatórios para PostgreSQL visando suporte a JSONB"
date: 2026-06-27
ai_generated: true
gerado_por: adr_generator_v0.0.1
revisado: true
---

# Migração do módulo de relatórios para PostgreSQL visando suporte a JSONB

## Contexto
O sistema atual utiliza SQL Server, que apresenta instabilidade e latência superior a oito segundos em consultas de auditoria. O problema ocorre devido ao uso de filtros em propriedades JSON armazenadas como texto, que não escalam com a variação frequente de campos exigida pelo time de compliance.

## Problema
Baixa performance e falta de flexibilidade do SQL Server para lidar com filtros dinâmicos em dados semiestruturados (JSON), causando travamentos em horários de pico.

## Alternativas
- Manutenção no SQL Server com colunas computadas e índices materializados
- Migração para motores analíticos como BigQuery ou ClickHouse
- Migração do módulo de relatórios para PostgreSQL com JSONB (Decisão escolhida)

## Decisão
Migrar o módulo de relatórios para PostgreSQL para aproveitar o suporte nativo ao tipo JSONB. A migração será gradual, utilizando estratégia de escrita dupla e validação de consistência antes da virada definitiva da leitura.

## Consequências
- Necessidade de gerenciar dois bancos de dados (SQL Server e PostgreSQL) para o mesmo domínio
- Implementação de lógica de escrita dupla e jobs de comparação de dados
- Criação de runbooks específicos para rollback e monitoramento de consistência
- Redução da latência de consulta de oito segundos para menos de um segundo conforme protótipo

## Incertezas
- Garantia de sincronia total do schema de permissões entre as duas tecnologias de banco de dados

---
*Gerado por IA — revisar antes de versionar.*
