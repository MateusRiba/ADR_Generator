import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "../../shared/runtime/messaging";
import type { AdrRecord } from "../../shared/storage/adrs";
import { TRANSCRIPT_CAP, estimateTokens } from "../../shared/config";
import { openFullPage } from "../lib/openPage";

interface CaptureProps {
  apiKeyReady: boolean | null;
  onGenerated: (record: AdrRecord) => void;
}

export function Capture({ apiKeyReady, onGenerated }: CaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const r = await sendMessage({ type: "GET_CAPTURE_STATE" });
      if (r.type === "CAPTURE_STATE") {
        setCapturing(r.capturing);
        setCharCount(r.charCount);
        setTruncated(r.truncated);
      }
    } catch {
      /* SW ainda subindo: ignora */
    }
  }, []);

  useEffect(() => {
    void refreshState();
    const listener = (raw: unknown) => {
      if (
        typeof raw === "object" &&
        raw !== null &&
        (raw as { type?: unknown }).type === "CAPTURE_STATE"
      ) {
        const msg = raw as {
          capturing: boolean;
          charCount: number;
          truncated: boolean;
        };
        setCapturing(msg.capturing);
        setCharCount(msg.charCount);
        setTruncated(msg.truncated);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [refreshState]);

  async function confirmStart() {
    if (!consentChecked) return;
    setError(null);
    setBusy(true);
    try {
      const r = await sendMessage({ type: "START_CAPTURE" });
      if (r.type === "CAPTURE_STATE") setCapturing(r.capturing);
      else if (r.type === "ERROR") setError(r.message);
      setConsentOpen(false);
      setConsentChecked(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setBusy(true);
    try {
      const r = await sendMessage({ type: "STOP_CAPTURE" });
      if (r.type === "CAPTURE_STATE") {
        setCapturing(r.capturing);
        setCharCount(r.charCount);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleDiscard() {
    setBusy(true);
    try {
      const r = await sendMessage({ type: "DISCARD_TRANSCRIPT" });
      if (r.type === "CAPTURE_STATE") {
        setCapturing(r.capturing);
        setCharCount(r.charCount);
        setTruncated(r.truncated);
      }
    } finally {
      setBusy(false);
    }
  }

  // Caminho rápido: gera direto do buffer do SW. Para revisar/editar a transcrição
  // antes (modo redação P2), o usuário abre a aba de revisão em tela cheia.
  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const r = await sendMessage({ type: "GENERATE_ADR" });
      if (r.type === "ADR_SAVED") {
        setCharCount(0);
        onGenerated(r.record);
      } else if (r.type === "ERROR") {
        setError(r.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <section className="view">
        <div className="spinner" />
        <p className="view__center">Gerando ADR a partir da transcrição…</p>
        <p className="popup__hint popup__hint--muted view__center">
          Isso pode levar de 5 a 15 segundos.
        </p>
      </section>
    );
  }

  return (
    <section className="view">
      <div className="capture__status">
        <span
          className={`capture__dot ${capturing ? "capture__dot--rec" : ""}`}
        />
        <span>
          {capturing ? "Capturando…" : charCount > 0 ? "Captura parada" : "Pronto"}
        </span>
        <span className="popup__char-count">
          {charCount.toLocaleString("pt-BR")} caracteres
          <span
            className="popup__token-count"
            title="Estimativa aproximada (~4 caracteres por token) do que será enviado à Gemini. A contagem real depende do tokenizer do modelo."
          >
            {" "}· ~{estimateTokens(charCount).toLocaleString("pt-BR")} tokens
          </span>
        </span>
      </div>

      {capturing ? (
        <button
          className="popup__button popup__button--danger"
          type="button"
          onClick={handleStop}
          disabled={busy}
        >
          Parar captura
        </button>
      ) : charCount > 0 ? (
        <>
          <button
            className="popup__button"
            type="button"
            onClick={() => openFullPage("view=review")}
          >
            Revisar transcrição (tela cheia)
          </button>
          <button
            className="popup__button popup__button--primary"
            type="button"
            onClick={handleGenerate}
            disabled={apiKeyReady !== true}
          >
            Gerar ADR
          </button>
          <button
            className="popup__button"
            type="button"
            onClick={handleDiscard}
            disabled={busy}
          >
            Descartar transcrição
          </button>
          {apiKeyReady !== true && (
            <p className="popup__hint popup__hint--muted">
              Configure a API key da Gemini para gerar o ADR.
            </p>
          )}
        </>
      ) : (
        <>
          <button
            className="popup__button popup__button--primary"
            type="button"
            onClick={() => setConsentOpen(true)}
          >
            Iniciar captura
          </button>
          <button
            className="popup__button"
            type="button"
            onClick={() => openFullPage("view=review&source=paste")}
          >
            Colar transcrição existente
          </button>
        </>
      )}

      {truncated && (
        <div className="popup__notice popup__notice--warn">
          <p>
            Limite de {TRANSCRIPT_CAP.toLocaleString("pt-BR")} caracteres
            atingido — o trecho excedente foi descartado e não será enviado ao
            Gemini.
          </p>
        </div>
      )}

      <p className="popup__hint popup__hint--muted">
        Ative as <strong>legendas (CC)</strong> na reunião do Google Meet — a
        extensão lê a transcrição de todos os participantes. A transcrição
        automática pode conter erros (sotaques, termos técnicos); revise antes
        de gerar o ADR.
      </p>

      {error && <p className="popup__status popup__status--error">Erro: {error}</p>}

      {consentOpen && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__card">
            <h2 className="modal__title">Consentimento</h2>
            <p className="modal__text">
              Esta extensão captura a transcrição da reunião e envia o conteúdo
              final ao Google Gemini para gerar o ADR. Confirme que todos os
              participantes foram avisados.
            </p>
            <label className="modal__check">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
              />
              Avisei a todos os participantes desta reunião.
            </label>
            <div className="modal__actions">
              <button
                type="button"
                className="popup__button"
                onClick={() => {
                  setConsentOpen(false);
                  setConsentChecked(false);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="popup__button popup__button--primary"
                onClick={confirmStart}
                disabled={!consentChecked || busy}
              >
                Iniciar captura
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
