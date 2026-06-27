// Export do ADR como arquivo .md via blob URL (ação manual do usuário → GitHub).

import type { AdrJson } from "../../shared/gemini/types";
import { toMarkdown } from "../../shared/markdown/formatter";

export function downloadAdrMarkdown(adr: AdrJson, savedAt?: Date): void {
  const { version } = chrome.runtime.getManifest();
  const md = toMarkdown(adr, savedAt, version);
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFilename(adr.titulo)}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function safeFilename(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[\/\\?%*:|"<>]/g, "_")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "") || "adr"
  );
}
