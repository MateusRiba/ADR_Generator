import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Elemento #root não encontrado no index.html das options");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
