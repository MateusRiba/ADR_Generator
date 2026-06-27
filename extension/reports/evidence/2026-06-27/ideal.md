---
title: "Padronização de Instrumentação com OpenTelemetry e Coletor Centralizado"
date: 2026-06-27
ai_generated: true
gerado_por: adr_generator_v0.0.1
revisado: true
---

# Padronização de Instrumentação com OpenTelemetry e Coletor Centralizado

## Contexto
Atualmente, a instrumentação dos serviços é inconsistente, variando entre logs estruturados e métricas customizadas sem um padrão definido. A falta de tracing distribuído impede a correlação eficiente de chamadas entre serviços críticos como checkout, pagamento e notificação durante incidentes.

## Problema
Dificuldade na investigação de incidentes e falta de visibilidade fim-a-fim devido à ausência de rastreamento distribuído e heterogeneidade na coleta de telemetria.

## Alternativas
- Manutenção do modelo atual de logs manuais e estruturados
- Uso de instrumentação proprietária de fornecedores de observabilidade
- Adoção da especificação OpenTelemetry (Decisão escolhida)

## Decisão
Adotar o OpenTelemetry como padrão de instrumentação para todos os novos serviços e fluxos críticos em manutenção. A arquitetura contará com um coletor centralizado para governança, permitindo a aplicação de amostragem (sampling), mascaramento de dados sensíveis e exportação para a stack de observabilidade atual sem acoplamento com fornecedor.

## Consequências
- Necessidade de criação de um guia interno de convenções e atributos obrigatórios
- Curva de aprendizado para os times de desenvolvimento sobre conceitos de tracing
- Criação de templates de serviço para facilitar a adoção
- Redução do acoplamento com ferramentas específicas de observabilidade
- Melhoria na governança de dados através do coletor centralizado

## Incertezas
- Definição das taxas ideais de amostragem (sampling) por tipo de serviço
- Tempo necessário para treinamento das equipes para diferenciar spans de logs

---
*Gerado por IA — revisar antes de versionar.*
