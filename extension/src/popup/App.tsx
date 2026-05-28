import { useEffect, useState } from "react";
import "./App.css";
import { sendMessage } from "../shared/runtime/messaging";
import { isApiKeySet } from "../shared/storage/apiKey";
import type { AdrJson } from "../shared/gemini/types";

export function App() {
  const { version } = chrome.runtime.getManifest();
  const [pongAt, setPongAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);
  const [apiKeyReady, setApiKeyReady] = useState<boolean | null>(null);
  const [generating, setGenerating] = useState(false);
  const [adr, setAdr] = useState<AdrJson | null>(null);

  useEffect(() => {
    isApiKeySet()
      .then(setApiKeyReady)
      .catch(() => setApiKeyReady(false));
  }, []);

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
        Etapa 4: porta de <code>indexAllShot.js</code>. Gere um ADR de teste a
        partir da transcrição Garnet/Redis.
      </p>
      <button
        className="popup__button popup__button--primary"
        type="button"
        onClick={handleGenerateAdr}
        disabled={generating || apiKeyReady !== true}
      >
        {generating ? "Gerando ADR..." : "Gerar ADR de teste"}
      </button>
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
      {adr && (
        <details className="popup__adr" open>
          <summary>
            <strong>{adr.titulo}</strong>
          </summary>
          <pre className="popup__adr-json">
            {JSON.stringify(adr, null, 2)}
          </pre>
        </details>
      )}
      {error && (
        <p className="popup__status popup__status--error">Erro: {error}</p>
      )}
    </main>
  );
}
