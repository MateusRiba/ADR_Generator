import { useEffect, useState } from "react";
import { sendMessage } from "../../shared/runtime/messaging";
import { isApiKeySet } from "../../shared/storage/apiKey";

type Phase = "loading" | "ready" | "generating" | "discarded";

export function ReviewTranscript() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [transcript, setTranscript] = useState("");
  const [apiKeyReady, setApiKeyReady] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isApiKeySet()
      .then(setApiKeyReady)
      .catch(() => setApiKeyReady(false));
    (async () => {
      try {
        const r = await sendMessage({ type: "GET_TRANSCRIPT" });
        if (r.type === "TRANSCRIPT_TEXT") {
          setTranscript(r.text);
          setPhase("ready");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase("ready");
      }
    })();
  }, []);

  async function handleGenerate() {
    setError(null);
    setPhase("generating");
    try {
      // Modo redação (P2): envia o texto editado — trechos removidos não saem.
      const r = await sendMessage({ type: "GENERATE_ADR", transcript });
      if (r.type === "ADR_SAVED") {
        // Reaproveita a mesma aba: vira o Editor do ADR recém-gerado.
        location.search = `?view=editor&id=${encodeURIComponent(r.record.id)}`;
      } else if (r.type === "ERROR") {
        setError(r.message);
        setPhase("ready");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase("ready");
    }
  }

  async function handleDiscard() {
    setError(null);
    try {
      await sendMessage({ type: "DISCARD_TRANSCRIPT" });
      setPhase("discarded");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (phase === "loading") {
    return (
      <>
        <div className="spinner" />
        <p className="page__hint view__center">Carregando transcrição…</p>
      </>
    );
  }

  if (phase === "discarded") {
    return (
      <section className="review">
        <h1 className="page__title">Transcrição descartada</h1>
        <p className="page__hint">Pode fechar esta aba.</p>
        <button
          type="button"
          className="popup__button"
          onClick={() => window.close()}
        >
          Fechar aba
        </button>
      </section>
    );
  }

  if (phase === "generating") {
    return (
      <>
        <div className="spinner" />
        <p className="view__center">Gerando ADR a partir da transcrição…</p>
        <p className="page__hint view__center">Isso pode levar de 5 a 15 segundos.</p>
      </>
    );
  }

  return (
    <section className="review">
      <header className="page__header">
        <h1 className="page__title">Revisar transcrição</h1>
      </header>
      <p className="page__hint">
        Remova trechos sensíveis antes de gerar — o que você apagar aqui não é
        enviado ao Gemini.
      </p>

      <textarea
        className="review__textarea"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        spellCheck={false}
      />

      {apiKeyReady === false && (
        <p className="popup__hint popup__hint--muted">
          Configure a API key da Gemini (no popup → ⚙) para gerar o ADR.
        </p>
      )}
      {error && <p className="popup__status popup__status--error">Erro: {error}</p>}

      <div className="review__bar">
        <span className="review__count">
          {transcript.length.toLocaleString("pt-BR")} caracteres
        </span>
        <button
          type="button"
          className="popup__button"
          onClick={handleDiscard}
        >
          Descartar
        </button>
        <button
          type="button"
          className="popup__button popup__button--primary"
          onClick={handleGenerate}
          disabled={apiKeyReady !== true || transcript.trim().length === 0}
        >
          Gerar ADR
        </button>
      </div>
    </section>
  );
}
