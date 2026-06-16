import { useEffect, useRef, useState } from "react";
import { sendMessage } from "../../shared/runtime/messaging";
import type { AdrRecord } from "../../shared/storage/adrs";
import type { AdrJson } from "../../shared/gemini/types";
import { ADR_FIELD_LABELS } from "../../shared/gemini/types";
import type { AdrFieldKey, AdrFieldValue } from "../../shared/types/messages";
import { AdrField } from "../components/AdrField";
import { downloadAdrMarkdown } from "../lib/exportAdr";

interface EditorProps {
  record: AdrRecord;
  onSaved: (record: AdrRecord) => void;
}

// Ordem de exibição (analise_passo_a_passo vai por último, colapsável).
const VISIBLE_FIELDS: AdrFieldKey[] = [
  "titulo",
  "contexto",
  "problema",
  "alternativas",
  "decisao",
  "consequencias",
  "incertezas",
];

const SAVE_DEBOUNCE_MS = 300;

export function Editor({ record, onSaved }: EditorProps) {
  const [adr, setAdr] = useState<AdrJson>(record.content);
  const [savedTick, setSavedTick] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [refineField, setRefineField] = useState<AdrFieldKey | null>(null);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [refiningField, setRefiningField] = useState<AdrFieldKey | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recarrega quando o registro ativo muda (ex.: abriu outro ADR do histórico).
  useEffect(() => {
    setAdr(record.content);
  }, [record.id, record.content]);

  function persist(next: AdrJson) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSavedTick("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const r = await sendMessage({
          type: "UPDATE_ADR",
          id: record.id,
          patch: { content: next, title: next.titulo },
        });
        if (r.type === "ADR_SAVED") {
          setSavedTick("saved");
          onSaved(r.record);
        } else if (r.type === "ERROR") {
          setError(r.message);
          setSavedTick("idle");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setSavedTick("idle");
      }
    }, SAVE_DEBOUNCE_MS);
  }

  function updateField(field: AdrFieldKey, value: AdrFieldValue) {
    const next = { ...adr, [field]: value } as AdrJson;
    setAdr(next);
    persist(next);
  }

  async function runRefine() {
    if (!refineField || !refineInstruction.trim()) return;
    const field = refineField;
    setRefiningField(field);
    setError(null);
    try {
      const r = await sendMessage({
        type: "REFINE_SECTION",
        adr,
        field,
        instruction: refineInstruction,
      });
      if (r.type === "SECTION_REFINED") {
        updateField(r.field, r.value);
        setRefineField(null);
        setRefineInstruction("");
      } else if (r.type === "ERROR") {
        setError(r.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefiningField(null);
    }
  }

  return (
    <section className="view">
      <div className="editor__bar">
        <span className="editor__save">
          {savedTick === "saving" ? "Salvando…" : savedTick === "saved" ? "Salvo ✓" : ""}
        </span>
        <button
          type="button"
          className="popup__button"
          onClick={() => downloadAdrMarkdown(adr, new Date(record.updatedAt))}
        >
          Exportar .md
        </button>
      </div>

      {VISIBLE_FIELDS.map((field) => (
        <AdrField
          key={field}
          label={ADR_FIELD_LABELS[field]}
          value={adr[field]}
          onChange={(v) => updateField(field, v)}
          onRefine={() => {
            setRefineField(field);
            setRefineInstruction("");
          }}
          refining={refiningField === field}
        />
      ))}

      <details className="editor__cot">
        <summary>{ADR_FIELD_LABELS.analise_passo_a_passo}</summary>
        <AdrField
          label={ADR_FIELD_LABELS.analise_passo_a_passo}
          value={adr.analise_passo_a_passo}
          onChange={(v) => updateField("analise_passo_a_passo", v)}
          onRefine={() => {
            setRefineField("analise_passo_a_passo");
            setRefineInstruction("");
          }}
          refining={refiningField === "analise_passo_a_passo"}
        />
        <p className="popup__hint popup__hint--muted">
          Raciocínio interno da IA — não entra no <code>.md</code> exportado.
        </p>
      </details>

      {error && <p className="popup__status popup__status--error">Erro: {error}</p>}

      {refineField && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__card">
            <h2 className="modal__title">
              Melhorar: {ADR_FIELD_LABELS[refineField]}
            </h2>
            <p className="modal__text">
              Descreva como quer refinar este campo (ex.: "expanda com mais
              detalhes do problema", "torne mais conciso").
            </p>
            <textarea
              className="field__textarea"
              rows={3}
              autoFocus
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
            />
            <div className="modal__actions">
              <button
                type="button"
                className="popup__button"
                onClick={() => setRefineField(null)}
                disabled={refiningField !== null}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="popup__button popup__button--primary"
                onClick={runRefine}
                disabled={!refineInstruction.trim() || refiningField !== null}
              >
                {refiningField !== null ? "Refinando…" : "Refinar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
