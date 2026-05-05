# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ADR Generator is a Chrome extension (Manifest V3) that captures Google Meet transcriptions and generates structured Architecture Decision Records (ADRs) using the Google Gemini API. The MVP requires zero backend — all data is stored locally in the browser (LocalStorage/IndexedDB).

## Current State

The repo is in early development. Only the proof-of-concept backend integration exists (`backend/index.js`), which validates the Gemini API call and structured JSON output schema. The Chrome extension code has not been written yet.

## Running the PoC

```bash
cd backend
node --env-file=.env index.js
```

Requires a `.env` file at `backend/.env` with:
```
GEMINI_API_KEY=your_key_here
```

Install dependencies:
```bash
cd backend
npm install
```

## Architecture

### ADR Data Schema

The Gemini API is called with a forced JSON schema (`responseMimeType: "application/json"` + `responseSchema`) to guarantee structured output:

- `Titulo`, `contexto`, `problema` — strings
- `alternativas`, `consequencias`, `incertezas` — string arrays
- `decisao` — string; value `"AUSÊNCIA DE DECISÃO"` when none is found

Model: `gemini-2.0-flash` (or latest stable flash variant). Temperature is always `0` for deterministic extraction.

System instruction frames the model as a senior software architect following the Michael Nygard ADR pattern. The model must not invent data — only extract from the provided transcript.

### Planned Extension Architecture

- **Content script** — runs inside Google Meet tab, captures audio/transcript via Web Speech API
- **Popup/Sidebar UI** — displays transcript, ADR sections (editable), action buttons (Generate, Regenerate, Export, Save)
- **Background service worker** — manages Gemini API calls from extension context
- **Storage** — `chrome.storage.local` or IndexedDB; no server-side persistence in MVP

### Key Constraints

- Transcription input capped at **30,000 characters** (~7,500 tokens) per session to control cost
- No auth, no backend server, no Git integration in MVP scope
- All API calls go directly from the extension to the Gemini API (API key stored in extension config)
