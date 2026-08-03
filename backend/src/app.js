import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import healthRouter from "./routes/health.js";
import productsRouter from "./routes/products.js";
import categoriesRouter from "./routes/categories.js";
import settingsRouter from "./routes/settings.js";
import collectionsRouter from "./routes/collections.js";
import pagesRouter from "./routes/pages.js";
import lookbookRouter from "./routes/lookbook.js";
import sitemapRouter from "./routes/sitemap.js";
import adminRouter from "./routes/admin/index.js";

/**
 * Build the Express application (no listen) — shared by server entry and tests.
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  if (config.trustProxy) {
    app.set("trust proxy", 1);
  }

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use("/uploads", express.static(config.uploadDir));

  app.use("/api/health", healthRouter);
  app.use("/api/products", productsRouter);
  app.use("/api/categories", categoriesRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/collections", collectionsRouter);
  app.use("/api/pages", pagesRouter);
  app.use("/api/lookbook", lookbookRouter);
  app.use("/sitemap.xml", sitemapRouter);
  app.use("/api/admin", adminRouter);

  // Legacy URL — permanent redirect to renamed products page
  app.get("/collection", (_request, response) => {
    response.redirect(301, "/products");
  });

  app.use((_request, response) => {
    response.status(404).json({ ok: false, error: "not_found" });
  });

  // Catch async route errors — one bad request must not crash the API process.
  app.use((error, _request, response, _next) => {
    console.error("Unhandled API error:", error.message);
    if (response.headersSent) {
      return;
    }
    response.status(500).json({
      ok: false,
      error: "internal_error",
      message: "Something went wrong",
    });
  });

  return app;
}
