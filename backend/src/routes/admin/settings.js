import { Router } from "express";
import { getAdminSettings, updateAdminSettings } from "../../services/settingsService.js";
import { createImageUpload, uploadPublicPath } from "../../middleware/upload.js";
import { parseBooleanField } from "../../utils/parseForm.js";

const router = Router();
const upload = createImageUpload("settings");

const settingsUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "hero_image_1", maxCount: 1 },
  { name: "hero_image_2", maxCount: 1 },
]);

router.get("/", async (_request, response) => {
  const settings = await getAdminSettings();
  response.json(settings);
});

router.put("/", (request, response) => {
  settingsUpload(request, response, async (error) => {
    if (error) {
      const status = error.message === "invalid_file_type" ? 400 : 500;
      response.status(status).json({ ok: false, message: error.message });
      return;
    }

    const body = request.body ?? {};
    const files = /** @type {Record<string, Express.Multer.File[]>} */ (request.files || {});
    const uploads = {};

    if (files.logo?.[0]) {
      uploads.logoUrl = uploadPublicPath("settings", files.logo[0].filename);
    }
    if (files.hero_image_1?.[0]) {
      uploads.heroImage1Url = uploadPublicPath("settings", files.hero_image_1[0].filename);
    }
    if (files.hero_image_2?.[0]) {
      uploads.heroImage2Url = uploadPublicPath("settings", files.hero_image_2[0].filename);
    }

    const settings = await updateAdminSettings(
      {
        instagramDirectUrl: body.instagramDirectUrl,
        telegramUsername: body.telegramUsername,
        bankCardNumber: body.bankCardNumber,
        bankCardHolder: body.bankCardHolder,
        bankName: body.bankName,
        heroEyebrow: body.heroEyebrow,
        heroHeadline: body.heroHeadline,
        heroSubtitle: body.heroSubtitle,
        brandStoryTeaser: body.brandStoryTeaser,
        brandStoryBody: body.brandStoryBody,
        heroVideoEnabled:
          body.heroVideoEnabled !== undefined
            ? parseBooleanField(body.heroVideoEnabled)
            : undefined,
        heroVideoUrl: body.heroVideoUrl,
      },
      uploads
    );

    response.json(settings);
  });
});

export default router;
