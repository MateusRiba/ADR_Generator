import { useCallback, useEffect, useState } from "react";
import { sendMessage } from "../../shared/runtime/messaging";
import type { AdrRecord } from "../../shared/storage/adrs";
import { downloadAdrMarkdown } from "../lib/exportAdr";

interface HistoryProps {
  onOpen: (record: AdrRecord) => void;
}

export function History({ onOpen }: HistoryProps) {
  const [records, setRecords] = useState<AdrRecord[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await sendMessage({ type: "LIST_ADRS" });
      if (r.type === "ADRS_LIST") setRecords(r.records);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleDelete(id: string) {
    try {
      const r = await sendMessage({ type: "DELETE_ADR", id });
      if (r.type === "ADR_DELETED") {
        setConfirmingId(null);
        await refresh();
      } else if (r.type === "ERROR") {
        setError(r.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const filtered = records.filter((r) =>
    r.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <section className="view">
      <input
        className="history__search"
        type="search"
        placeholder="Buscar por título…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {error && <p className="popup__status popup__status--error">Erro: {error}</p>}

      {filtered.length === 0 ? (
        <p className="popup__hint popup__hint--muted">
          {records.length === 0
            ? "Nenhum ADR salvo ainda."
            : "Nenhum ADR corresponde à busca."}
        </p>
      ) : (
        <ul className="history__list">
          {filtered.map((record) => (
            <li key={record.id} className="history__item">
              <button
                type="button"
                className="history__open"
                onClick={() => onOpen(record)}
                title="Abrir no editor"
              >
                <span className="history__title">{record.title}</span>
                <span className="history__date">
                  {new Date(record.updatedAt).toLocaleString("pt-BR")}
                </span>
              </button>
              <div className="history__actions">
                <button
                  type="button"
                  className="popup__button popup__button--sm"
                  onClick={() =>
                    downloadAdrMarkdown(record.content, new Date(record.updatedAt))
                  }
                >
                  .md
                </button>
                {confirmingId === record.id ? (
                  <>
                    <button
                      type="button"
                      className="popup__button popup__button--sm popup__button--danger"
                      onClick={() => handleDelete(record.id)}
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      className="popup__button popup__button--sm"
                      onClick={() => setConfirmingId(null)}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="popup__button popup__button--sm"
                    onClick={() => setConfirmingId(record.id)}
                  >
                    Excluir
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
