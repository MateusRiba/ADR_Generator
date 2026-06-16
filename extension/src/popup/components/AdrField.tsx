import { useEffect, useRef } from "react";
import type { AdrFieldValue } from "../../shared/types/messages";

interface AdrFieldProps {
  label: string;
  value: AdrFieldValue;
  onChange: (value: AdrFieldValue) => void;
  onRefine: () => void;
  refining: boolean;
}

/** Textarea que cresce com o conteúdo (sem barra de rolagem interna). */
function AutoTextarea(props: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return (
    <textarea
      ref={ref}
      className="field__textarea"
      value={props.value}
      placeholder={props.placeholder}
      rows={1}
      onChange={(e) => props.onChange(e.target.value)}
    />
  );
}

export function AdrField({
  label,
  value,
  onChange,
  onRefine,
  refining,
}: AdrFieldProps) {
  const isArray = Array.isArray(value);

  return (
    <div className="field">
      <div className="field__header">
        <label className="field__label">{label}</label>
        <button
          type="button"
          className="field__refine"
          onClick={onRefine}
          disabled={refining}
          title="Regenerar este campo com a IA"
        >
          {refining ? "Refinando..." : "Melhorar…"}
        </button>
      </div>

      {isArray ? (
        <ul className="field__list">
          {(value as string[]).map((item, i) => (
            <li key={i} className="field__list-item">
              <AutoTextarea
                value={item}
                onChange={(v) => {
                  const next = [...(value as string[])];
                  next[i] = v;
                  onChange(next);
                }}
              />
              <button
                type="button"
                className="field__list-remove"
                aria-label="Remover item"
                onClick={() =>
                  onChange((value as string[]).filter((_, j) => j !== i))
                }
              >
                ×
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="field__list-add"
              onClick={() => onChange([...(value as string[]), ""])}
            >
              + Adicionar item
            </button>
          </li>
        </ul>
      ) : (
        <AutoTextarea
          value={value as string}
          onChange={(v) => onChange(v)}
          placeholder={`Sem ${label.toLowerCase()}`}
        />
      )}
    </div>
  );
}
