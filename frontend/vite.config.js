import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "legacy-storefront-redirect",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = request.url?.split("?")[0];
          if (
            path === "/collection" ||
            path === "/collection/" ||
            path === "/lookbook" ||
            path === "/lookbook/"
          ) {
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
    // purpose --- Vite blocks unknown Host headers; the public domain must be listed ---
    allowedHosts: ["mashoodwear.ir", "www.mashoodwear.ir"],
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
