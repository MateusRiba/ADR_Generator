---
title: "Padronização de Instrumentação com OpenTelemetry e Coletor Centralizado"
date: 2026-06-28
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
- Estabelecimento de um roadmap de adoção obrigatória para novos microsserviços e priorização de fluxos críticos, como checkout e pagamentos, em ciclos de manutenção.
- Definição de métricas de sucesso baseadas na redução do MTTR (Mean Time To Repair) e no aumento da cobertura de rastreamento distribuído em transações core.
- Implementação de políticas de governança de dados no coletor centralizado para mascaramento automático de PII (Personally Identifiable Information) e conformidade com LGPD.
- Monitoramento contínuo do overhead de performance introduzido pelos SDKs e ajuste fino das estratégias de sampling para equilibrar visibilidade e custos de infraestrutura.
- Divisão clara de responsabilidades: o time de Plataforma provê a infraestrutura e padrões, enquanto os times de Desenvolvimento realizam a instrumentação semântica e definição de atributos de negócio.
- Necessidade de capacitação técnica das squads para garantir a qualidade dos dados de telemetria e o uso correto de convenções semânticas do OpenTelemetry.

## Incertezas
- Definição das taxas ideais de amostragem (sampling) por tipo de serviço
- Tempo necessário para treinamento das equipes para diferenciar spans de logs

---
*Gerado por IA — revisar antes de versionar.*
