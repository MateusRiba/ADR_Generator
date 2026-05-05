# ADR Generator

Extensão para Google Chrome que captura transcrições de reuniões no Google Meet e gera **Architecture Decision Records (ADRs)** estruturados automaticamente usando a API do Google Gemini.

## Status

> **Em desenvolvimento** — atualmente apenas o proof-of-concept da integração com a API do Gemini está implementado.

## Como funciona

1. A extensão captura o áudio/transcrição da reunião no Google Meet
2. A transcrição é enviada à API do Gemini com um prompt estruturado
3. A IA extrai um ADR no padrão Michael Nygard (Título, Contexto, Problema, Alternativas, Decisão, Consequências)
4. O ADR pode ser editado e exportado como `.md`

## Rodando o PoC

```bash
cd backend
npm install
```

Crie um arquivo `backend/.env`:
```
GEMINI_API_KEY=sua_chave_aqui
```

Execute:
```bash
node --env-file=.env index.js
```

## Tecnologias

- **Chrome Extension** — Manifest V3
- **Google Gemini API** — geração e extração de ADRs
- **Web Speech API** — captura de transcrição em tempo real
- **Armazenamento local** — LocalStorage/IndexedDB (sem backend)
