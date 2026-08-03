import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "legacy-collection-redirect",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (request.url === "/collection" || request.url === "/collection/") {
            response.writeHead(301, { Location: "/products" });
            response.end();
            return;
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    // CMS only — Medusa Store/Admin traffic uses VITE_MEDUSA_BACKEND_URL (:9000) directly.
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/sitemap.xml": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});
