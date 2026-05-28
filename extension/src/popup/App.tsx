import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { sendMessage } from "../shared/runtime/messaging";
import { isApiKeySet } from "../shared/storage/apiKey";
import type { AdrJson } from "../shared/gemini/types";
import type { AdrRecord } from "../shared/storage/adrs";
import { toMarkdown } from "../shared/markdown/formatter";

export function App() {
  const { version } = chrome.runtime.getManifest();
  const [pongAt, setPongAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [adr, setAdr] = useState<AdrJson | null>(null);
  const [savedAdrs, setSavedAdrs] = useState<AdrRecord[]>([]);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refreshList = useCallback(async () => {
    try {
      const response = await sendMessage({ type: "LIST_ADRS" });
      if (response.type === "ADRS_LIST") {
        setSavedAdrs(response.records);
      }
    } catch {
      // silencioso: contagem fica em 0 se IndexedDB falhar
    }
  }, []);

  useEffect(() => {
    isApiKeySet()
      .then(setApiKeyReady)
      .catch(() => setApiKeyReady(false));
    void refreshList();
  }, [refreshList]);

  async function handlePing() {
    setError(null);
    setPinging(true);
    try {
      const response = await sendMessage({ type: "PING" });
      if (response.type === "PONG") {
        setPongAt(response.receivedAt);
      } else {
        setError(`Resposta inesperada: ${response.type}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPinging(false);
    }
  }

  async function handleGenerateAdr() {
    setError(null);
    setAdr(null);
    setSavedRecordId(null);
    setGenerating(true);
    try {
      const response = await sendMessage({ type: "GENERATE_ADR_TEST" });
      if (response.type === "ADR_READY") {
        setAdr(response.adr);
      } else if (response.type === "ERROR") {
        setError(response.message);
      } else {
        setError(`Resposta inesperada: ${response.type}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAdr() {
    if (!adr) return;
    setError(null);
    setSaving(true);
    try {
      const response = await sendMessage({ type: "SAVE_ADR_TEST", adr });
      if (response.type === "ADR_SAVED") {
        setSavedRecordId(response.record.id);
        await refreshList();
      } else if (response.type === "ERROR") {
        setError(response.message);
      } else {
        setError(`Resposta inesperada: ${response.type}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  function handleExportMd() {
    if (!adr) return;
    const md = toMarkdown(adr);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(adr.titulo)}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  return (
    <main className="popup">
      <header className="popup__header">
        <h1 className="popup__title">ADR Generator</h1>
        <span className="popup__version">v{version}</span>
      </header>
      {apiKeyReady === false && (
        <div className="popup__notice popup__notice--warn">
          <p>API key da Gemini não configurada nesta sessão.</p>
          <button
            type="button"
            className="popup__button popup__button--link"
            onClick={openOptions}
          >
            Abrir configurações
          </button>
        </div>
      )}
      <p className="popup__hint">
        Etapa 5: persistência IndexedDB + export Markdown. Gere um ADR de teste,
        salve no navegador e exporte como <code>.md</code>.
      </p>
      <button
        className="popup__button popup__button--primary"
        type="button"
        onClick={handleGenerateAdr}
        disabled={generating || apiKeyReady !== true}
      >
        {generating ? "Gerando ADR..." : "Gerar ADR de teste"}
      </button>
      {adr && (
        <>
          <details className="popup__adr" open>
            <summary>
              <strong>{adr.titulo}</strong>
            </summary>
            <pre className="popup__adr-json">
              {JSON.stringify(adr, null, 2)}
            </pre>
          </details>
          <div className="popup__actions">
            <button
              className="popup__button"
              type="button"
              onClick={handleSaveAdr}
              disabled={saving || savedRecordId !== null}
            >
              {saving
                ? "Salvando..."
                : savedRecordId
                  ? "ADR salvo"
                  : "Salvar ADR"}
            </button>
            <button
              className="popup__button"
              type="button"
              onClick={handleExportMd}
            >
              Exportar .md
            </button>
          </div>
        </>
      )}
      {savedAdrs.length > 0 && (
        <p className="popup__saved-count">
          {savedAdrs.length} ADR{savedAdrs.length === 1 ? "" : "s"} salvo
          {savedAdrs.length === 1 ? "" : "s"} no navegador
        </p>
      )}
      <button
        className="popup__button"
        type="button"
        onClick={handlePing}
        disabled={pinging}
      >
        {pinging ? "Enviando..." : "Ping SW"}
      </button>
      {pongAt && (
        <p className="popup__status popup__status--ok">
          Pong recebido em {pongAt}
        </p>
      )}
      {error && (
        <p className="popup__status popup__status--error">Erro: {error}</p>
      )}
    </main>
  );
}

function safeFilename(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[\/\\?%*:|"<>]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "adr"
  );
}
