import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import categoriesRouter from "./categories.js";
import collectionsRouter from "./collections.js";
import pagesRouter from "./pages.js";
import lookbookImagesRouter from "./lookbook-images.js";
import settingsRouter from "./settings.js";

const router = Router();

router.use(authRouter);
router.use(requireAuth);
router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/collections", collectionsRouter);
router.use("/pages", pagesRouter);
router.use("/lookbook-images", lookbookImagesRouter);
router.use("/settings", settingsRouter);

export default router;
