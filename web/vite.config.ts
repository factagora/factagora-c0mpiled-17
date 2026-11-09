import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The React app lives in web/ (game art in web/public/assets). In dev, Vite serves it and passes /api to the Node server on :3000.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react()],
  build: { outDir: "dist", emptyOutDir: true, assetsDir: "app" }, // /assets is the game art served by Node
  server: {
    port: 5173,
    proxy: { "/api": "http://localhost:3000" },
  },
});
