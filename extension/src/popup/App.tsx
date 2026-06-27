import { useEffect, useState } from "react";
import "./App.css";
import { isApiKeySet } from "../shared/storage/apiKey";
import type { AdrRecord } from "../shared/storage/adrs";
import { Capture } from "./views/Capture";
import { History } from "./views/History";
import { Settings } from "./views/Settings";
import { openFullPage } from "./lib/openPage";

type View = "capture" | "history" | "settings";

export function App() {
  const { version } = chrome.runtime.getManifest();
  const [view, setView] = useState<View>("capture");
  const [apiKeyReady, setApiKeyReady] = useState<boolean | null>(null);

  useEffect(() => {
    isApiKeySet()
      .then(setApiKeyReady)
      .catch(() => setApiKeyReady(false));
  }, []);

  // Editor e revisão vivem numa aba inteira (página da extensão), não mais no
  // popup estreito. Abrir um ADR = abrir a página do Editor numa aba.
  function openEditor(record: AdrRecord) {
    openFullPage(`view=editor&id=${encodeURIComponent(record.id)}`);
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
      {view === "history" && <History onOpen={openEditor} />}
      {view === "settings" && <Settings onChanged={setApiKeyReady} />}
    </main>
  );
}
