---
title: "Adoção do OpenTelemetry como padrão de instrumentação e observabilidade"
date: 2026-06-28
ai_generated: true
gerado_por: adr_generator_v0.0.1
revisado: true
---

# Adoção do OpenTelemetry como padrão de instrumentação e observabilidade

## Contexto
Atualmente, a instrumentação dos serviços é heterogênea, variando entre logs estruturados e métricas customizadas sem um padrão definido. A ausência de rastreamento distribuído (distributed tracing) impede a correlação de chamadas entre serviços distintos, como checkout, pagamento e notificação, dificultando a investigação de incidentes.

## Problema
Dificuldade na investigação de incidentes em sistemas distribuídos devido à falta de padronização na instrumentação e ausência de rastreamento de ponta a ponta.

## Alternativas
- Manutenção do modelo atual com melhoria de logs manuais
- Uso de instrumentação proprietária de fornecedores de observabilidade
- Adoção do OpenTelemetry (Decisão escolhida)

## Decisão
Adotar o OpenTelemetry como padrão de instrumentação para todos os novos serviços e para fluxos críticos existentes quando houver manutenção. A arquitetura contará com um coletor centralizado, gerenciado pelo time de plataforma, para realizar amostragem (sampling), mascaramento de dados sensíveis e exportação para o stack de observabilidade vigente.

## Consequências
- Necessidade de criação de um guia interno de convenções (nomes de spans, atributos obrigatórios)
- Curva de aprendizado para os times de desenvolvimento
- Necessidade de treinamentos para nivelamento de conceitos (ex: diferença entre spans e logs)
- Garantia de flexibilidade para troca de fornecedores de observabilidade no futuro (evita vendor lock-in)

## Incertezas
- Definição das ferramentas específicas do stack atual que receberão os dados do coletor

---
*Gerado por IA — revisar antes de versionar.*
