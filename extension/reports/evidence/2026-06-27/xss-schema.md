---
title: "Implementação de Rollout Progressivo via Feature Flags para o Novo Checkout"
date: 2026-06-27
ai_generated: true
gerado_por: adr_generator_v0.0.1
revisado: true
---

# Implementação de Rollout Progressivo via Feature Flags para o Novo Checkout

## Contexto
O novo checkout está funcionalmente pronto, mas envolve mudanças críticas em validação de endereço, métodos de pagamento e cupons. Uma liberação total apresenta alto risco para a receita caso ocorram falhas não detectadas em testes.

## Problema
Necessidade de mitigar riscos de falhas no processo de pagamento e garantir a consistência da experiência do usuário durante a transição para o novo checkout, evitando que recarregamentos de página alternem a versão visualizada.

## Alternativas
- Liberação imediata para 100% dos usuários
- Deploy Blue-Green com roteamento por porcentagem no gateway
- Manutenção por tempo indeterminado do checkout antigo
- Rollout progressivo via Feature Flags (Decisão escolhida)

## Decisão
Adotar o uso de Feature Flags para realizar um rollout progressivo por cohorts, iniciando com 5% de usuários logados (fora de campanhas pagas), evoluindo para 25% e finalmente 100%. A escolha permite rollback imediato sem novo deploy e garante consistência de sessão no frontend.

## Consequências
- Necessidade de manter compatibilidade dupla de payloads no backend por pelo menos duas semanas
- Aumento do custo operacional para manter duas experiências simultâneas
- Exigência de criação de dashboards específicos para monitorar erros de JavaScript, falhas de pagamento e taxas de conversão por cohort
- Possibilidade de manipulação local da flag pelo usuário, embora mitigada pela validação contínua no backend

## Incertezas
- Tempo exato de permanência em cada cohort antes da liberação total
- Impacto real na taxa de conversão comparativa entre as duas versões antes da coleta de dados em produção

---
*Gerado por IA — revisar antes de versionar.*
