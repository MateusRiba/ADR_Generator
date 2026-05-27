import "./App.css";

export function App() {
  const { version } = chrome.runtime.getManifest();

  return (
    <main className="popup">
      <header className="popup__header">
        <h1 className="popup__title">ADR Generator</h1>
        <span className="popup__version">v{version}</span>
      </header>
      <p className="popup__hint">
        Fundação carregada. Próxima etapa: protocolo de mensagens entre popup e
        service worker.
      </p>
    </main>
  );
}
