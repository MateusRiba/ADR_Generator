import { useEffect, useState } from "react";
import "./App.css";
import { isApiKeySet } from "../shared/storage/apiKey";
import type { AdrRecord } from "../shared/storage/adrs";
import { Capture } from "./views/Capture";
import { Editor } from "./views/Editor";
import { History } from "./views/History";
import { Settings } from "./views/Settings";

type View = "capture" | "editor" | "history" | "settings";

export function App() {
  const { version } = chrome.runtime.getManifest();
  const [view, setView] = useState<View>("capture");
  const [activeAdr, setActiveAdr] = useState<AdrRecord | null>(null);
  const [apiKeyReady, setApiKeyReady] = useState<boolean | null>(null);

  useEffect(() => {
    isApiKeySet()
      .then(setApiKeyReady)
      .catch(() => setApiKeyReady(false));
  }, []);

  function openEditor(record: AdrRecord) {
    setActiveAdr(record);
    setView("editor");
  }

  return (
    <main className="popup">
      <header className="popup__header">
        <h1 className="popup__title">ADR Generator</h1>
        <span className="popup__version">v{version}</span>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={`tabs__btn ${view === "capture" ? "tabs__btn--active" : ""}`}
          onClick={() => setView("capture")}
        >
          Captura
        </button>
        <button
          type="button"
          className={`tabs__btn ${view === "editor" ? "tabs__btn--active" : ""}`}
          onClick={() => setView("editor")}
          disabled={!activeAdr}
          title={activeAdr ? "" : "Gere ou abra um ADR primeiro"}
        >
          Editor
        </button>
        <button
          type="button"
          className={`tabs__btn ${view === "history" ? "tabs__btn--active" : ""}`}
          onClick={() => setView("history")}
        >
          Histórico
        </button>
        <button
          type="button"
          className={`tabs__btn tabs__btn--icon ${view === "settings" ? "tabs__btn--active" : ""}`}
          onClick={() => setView("settings")}
          title="Configurações"
          aria-label="Configurações"
        >
          ⚙
        </button>
      </nav>

      {apiKeyReady === false && view !== "settings" && (
        <div className="popup__notice popup__notice--warn">
          <p>API key da Gemini não configurada nesta sessão.</p>
          <button
            type="button"
            className="popup__button popup__button--link"
            onClick={() => setView("settings")}
          >
            Abrir configurações
          </button>
        </div>
      )}

      {view === "capture" && (
        <Capture apiKeyReady={apiKeyReady} onGenerated={openEditor} />
      )}
      {view === "editor" &&
        (activeAdr ? (
          <Editor record={activeAdr} onSaved={setActiveAdr} />
        ) : (
          <p className="popup__hint">Nenhum ADR aberto.</p>
        ))}
      {view === "history" && <History onOpen={openEditor} />}
      {view === "settings" && <Settings onChanged={setApiKeyReady} />}
    </main>
  );
}
