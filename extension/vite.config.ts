import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.json" with { type: "json" };

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // Página full-screen (Editor/Revisão em aba inteira). O crxjs cuida do
      // popup/SW/content via manifest; entradas HTML extras vão aqui.
      input: { page: "src/page/index.html" },
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    cors: true,
    hmr: {
      host: "localhost",
      port: 5173,
    },
  },
});
