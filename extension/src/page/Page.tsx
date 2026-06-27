import { useEffect, useState } from "react";
import { sendMessage } from "../shared/runtime/messaging";
import type { AdrRecord } from "../shared/storage/adrs";
import { Editor } from "../popup/views/Editor";
import { ReviewTranscript } from "./components/ReviewTranscript";

type Mode = "editor" | "review";

export function Page() {
  const params = new URLSearchParams(location.search);
  const view = params.get("view") as Mode | null;
  const id = params.get("id");

  if (view === "review") {
    return (
      <main className="page">
        <ReviewTranscript />
      </main>
    );
  }

  if (view === "editor" && id) {
    return <EditorPage id={id} />;
  }

  return (
    <main className="page">
      <p className="page__hint">
        Página inválida. Abra o Editor pelo histórico ou a revisão pela captura.
      </p>
    </main>
  );
}

function EditorPage({ id }: { id: string }) {
  const [record, setRecord] = useState<AdrRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await sendMessage({ type: "GET_ADR", id });
        if (!alive) return;
        if (r.type === "ADR_RECORD") setRecord(r.record);
        else if (r.type === "ERROR") setError(r.message);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    document.title = record ? `ADR — ${record.title}` : "ADR Generator";
  }, [record]);

  if (error) {
    return (
      <main className="page">
        <p className="popup__status popup__status--error">Erro: {error}</p>
      </main>
    );
  }

  if (!record) {
    return (
      <main className="page">
        <div className="spinner" />
        <p className="page__hint view__center">Carregando ADR…</p>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page__header">
        <h1 className="page__title">{record.title}</h1>
      </header>
      <Editor record={record} onSaved={setRecord} />
    </main>
  );
}
