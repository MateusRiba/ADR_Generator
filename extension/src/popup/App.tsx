import { useState } from "react";
import "./App.css";
import { sendMessage } from "../shared/runtime/messaging";

export function App() {
  const { version } = chrome.runtime.getManifest();
  const [pongAt, setPongAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinging, setPinging] = useState(false);

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

  return (
    <main className="popup">
      <header className="popup__header">
        <h1 className="popup__title">ADR Generator</h1>
        <span className="popup__version">v{version}</span>
      </header>
      <p className="popup__hint">
        Etapa 2: canal SW↔popup tipado. Clique para validar o ping-pong.
      </p>
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
