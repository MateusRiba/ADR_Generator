import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../popup/App.css";
import "./page.css";
import { Page } from "./Page";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Elemento #root não encontrado no index.html da página");
}

createRoot(container).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
