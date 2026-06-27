import { useEffect, useState } from "react";
import { clearApiKey, isApiKeySet, setApiKey } from "../../shared/storage/apiKey";
import { sendMessage } from "../../shared/runtime/messaging";

type Status = "loading" | "configured" | "absent";

export function Settings({
  onChanged,
}: {
  onChanged?: (configured: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [confirmingWipe, setConfirmingWipe] = useState(false);
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const present = await isApiKeySet();
      setStatus(present ? "configured" : "absent");
      onChanged?.(present);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("absent");
      onChanged?.(false);
    }
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Cole uma chave antes de salvar.");
      return;
    }
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      await setApiKey(trimmed);
      setDraft("");
      setFeedback("Chave salva nesta sessão.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleForget() {
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      await clearApiKey();
      setFeedback("Chave removida.");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleWipe() {
    setError(null);
    setFeedback(null);
    setWiping(true);
    try {
      const r = await sendMessage({ type: "WIPE_ALL_DATA" });
      if (r.type === "DATA_WIPED") {
        setConfirmingWipe(false);
        setFeedback("Todos os dados foram apagados (ADRs, transcrição e chave).");
        await refresh();
      } else if (r.type === "ERROR") {
        setError(r.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWiping(false);
    }
  }

  return (
    <section className="view">
      <div className="capture__status">
        <span
          className={
            status === "configured"
              ? "options__badge options__badge--ok"
              : "options__badge options__badge--warn"
          }
        >
          {status === "loading"
            ? "Verificando..."
            : status === "configured"
              ? "Chave configurada"
              : "Não configurada"}
        </span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="api-key">
          Chave da Gemini API
        </label>
        <input
          id="api-key"
          className="history__search"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={
            status === "configured"
              ? "Chave já salva (oculta) — cole uma nova para substituir"
              : "Cole sua chave"
          }
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={saving}
        />
        <div className="popup__actions">
          <button
            className="popup__button popup__button--primary"
            type="button"
            onClick={handleSave}
            disabled={saving || draft.length === 0}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            className="popup__button"
            type="button"
            onClick={handleForget}
            disabled={saving || status !== "configured"}
          >
            Esquecer chave
          </button>
        </div>
        {feedback && (
          <p className="popup__status popup__status--ok">{feedback}</p>
        )}
        {error && (
          <p className="popup__status popup__status--error">{error}</p>
        )}
      </div>

      <div className="field">
        <label className="field__label">Dados locais</label>
        {confirmingWipe ? (
          <div className="popup__actions">
            <button
              type="button"
              className="popup__button popup__button--danger"
              onClick={handleWipe}
              disabled={wiping}
            >
              {wiping ? "Apagando…" : "Confirmar exclusão"}
            </button>
            <button
              type="button"
              className="popup__button"
              onClick={() => setConfirmingWipe(false)}
              disabled={wiping}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="popup__button popup__button--danger"
            onClick={() => setConfirmingWipe(true)}
          >
            Apagar todos os dados
          </button>
        )}
        <p className="popup__hint popup__hint--muted">
          Remove permanentemente todos os ADRs salvos, a transcrição em buffer e
          a chave da API. Não há como desfazer.
        </p>
      </div>

      <div className="popup__notice">
        <strong>Por que a chave some?</strong>
        <p>
          Ela fica em <code>chrome.storage.session</code>, que é volátil: a
          chave é apagada quando você fecha o Chrome. É mais seguro do que
          gravar em disco, mas você precisa re-colá-la a cada sessão do
          navegador.
        </p>
      </div>
    </section>
  );
}
