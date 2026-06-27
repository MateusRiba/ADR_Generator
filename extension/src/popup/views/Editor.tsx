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
  // F1/T1: revisão persistida no registro. Libera o export (aqui e no Histórico)
  // e vira `revisado: true` no front-matter. Só o botão explícito marca.
  const [reviewed, setReviewed] = useState(record.reviewed ?? false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recarrega quando o registro ativo muda (ex.: abriu outro ADR do histórico).
  useEffect(() => {
    setAdr(record.content);
  }, [record.id, record.content]);

  // Sincroniza o flag de revisão ao trocar de ADR (não a cada autosave do mesmo).
  useEffect(() => {
    setReviewed(record.reviewed ?? false);
  }, [record.id]);

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

  // Marca/desmarca a revisão. Persiste junto o conteúdo atual (flush das edições
  // pendentes) para que o registro fique coerente em uma única gravação.
  async function markReviewed(value: boolean) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setError(null);
    setReviewed(value);
    try {
      const r = await sendMessage({
        type: "UPDATE_ADR",
        id: record.id,
        patch: { content: adr, title: adr.titulo, reviewed: value },
      });
      if (r.type === "ADR_SAVED") {
        setSavedTick("saved");
        onSaved(r.record);
      } else if (r.type === "ERROR") {
        setError(r.message);
        setReviewed(!value); // reverte o otimismo em caso de falha
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setReviewed(!value);
    }
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
      {reviewed ? (
        <div className="editor__banner editor__banner--ok">
          <span>✓ Revisado — gerado por IA.</span>
          <button
            type="button"
            className="popup__button popup__button--link"
            onClick={() => markReviewed(false)}
          >
            desfazer
          </button>
        </div>
      ) : (
        <div className="editor__banner editor__banner--warn">
          <span>⚠ Gerado por IA — revise a decisão antes de exportar.</span>
          <button
            type="button"
            className="popup__button popup__button--sm"
            onClick={() => markReviewed(true)}
          >
            Marcar como revisado
          </button>
        </div>
      )}

      <div className="editor__bar">
        <span className="editor__save">
          {savedTick === "saving" ? "Salvando…" : savedTick === "saved" ? "Salvo ✓" : ""}
        </span>
        <button
          type="button"
          className="popup__button"
          onClick={() => downloadAdrMarkdown(adr, new Date(record.updatedAt), reviewed)}
          disabled={!reviewed}
          title={
            reviewed
              ? "Exportar como Markdown"
              : "Marque como revisado antes de exportar"
          }
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
        <div className="editor__cot-body">
          {adr.analise_passo_a_passo || "Sem análise registrada."}
        </div>
        <p className="popup__hint popup__hint--muted">
          Raciocínio interno da IA — somente leitura; não entra no{" "}
          <code>.md</code> exportado.
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
