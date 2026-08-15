import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  upsertVariantPricesWorkflow,
} from "@medusajs/medusa/core-flows";
import { convertIrrIrt } from "../utils/money";
import { IRAN_BANK_PROVIDER_ID } from "../modules/iran-bank-payment/config";
import { CARD_TO_CARD_PROVIDER_ID } from "../modules/card-to-card-payment";

/** Iran-only store currencies — keeps Admin price grid free of EUR/USD clutter. */
const IRAN_STORE_CURRENCIES = [
  { currency_code: "irr", is_default: false },
  { currency_code: "irt", is_default: true },
] as const;

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const europeCountries = ["gb", "de", "dk", "se", "fr", "es", "it"];
  const iranCountries = ["ir"];
  const allTaxCountries = [...europeCountries, ...iranCountries];
  const storeDefaultIrtAmount = 10;
  const storeDefaultIrrAmount = convertIrrIrt(
    storeDefaultIrtAmount,
    "irt",
    "irr"
  );

  // Ensure the IRR/IRT currencies exist in the DB.
  // (Medusa ships IRR but not IRT by default.)
  try {
    const currencyModuleService = container.resolve(ModuleRegistrationName.CURRENCY) as any;
    const { currencyService_ } = currencyModuleService;

    await currencyService_.upsert([
      {
        code: "irr",
        symbol: "IRR",
        name: "Iranian Rial",
        symbol_native: "﷼",
        decimal_digits: 0,
        rounding: 0,
      },
      {
        code: "irt",
        symbol: "IRT",
        name: "Iranian Toman",
        symbol_native: "ت",
        decimal_digits: 0,
        rounding: 0,
      },
    ]);

    logger.info("Loaded IRR/IRT currencies.");
  } catch (error: any) {
    logger.warn(
      `Failed to load IRR/IRT currencies. Original error: ${error?.message || error}`
    );
  }

  logger.info("Seeding store data...");
  const {
    result: [defaultSalesChannel],
  } = await createSalesChannelsWorkflow(container).run({
    input: {
      salesChannelsData: [
        {
          name: "Default Sales Channel",
          description: "Created by Medusa",
        },
      ],
    },
  });

  const {
    result: [publishableApiKey],
  } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [
        {
          title: "Default Publishable API Key",
          type: "publishable",
          created_by: "",
        },
      ],
    },
  });

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: ["id", "name"],
  });

  let store: { id: string; name?: string };

  if (existingStores?.length) {
    store = existingStores[0];
    logger.info(
      `Reusing existing store "${store.name ?? store.id}". Iran currencies will be applied after regions.`
    );
  } else {
    const {
      result: [createdStore],
    } = await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "Default Store",
            supported_currencies: [...IRAN_STORE_CURRENCIES],
            default_sales_channel_id: defaultSalesChannel.id,
          },
        ],
      },
    });

    store = createdStore;
  }

  logger.info("Seeding region data...");
  let europeRegion: {
    id: string
    name?: string
    currency_code?: string
  };
  let iranRegion: {
    id: string
    name?: string
    currency_code?: string
  };

  try {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Europe",
            currency_code: "eur",
            countries: europeCountries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    })

    europeRegion = regionResult[0];
  } catch (error: any) {
    const message = error?.message || "";

    // If the seed ran before, the region creation can fail because those
    // countries are already assigned to an existing region.
    if (message.includes("already assigned to a region")) {
      logger.info(
        'Countries are already assigned to a region. Reusing existing "Europe" region.'
      );

      const { data: existingRegions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code"],
      });

      const existingEuropeRegion = existingRegions.find(
        (r: any) => r?.name === "Europe"
      );

      if (!existingEuropeRegion) {
        throw error;
      }

      europeRegion = existingEuropeRegion;
    } else {
      throw error;
    }
  }

  try {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Iran",
            currency_code: "irt",
            countries: iranCountries,
            payment_providers: [
              "pp_system_default",
              IRAN_BANK_PROVIDER_ID,
              CARD_TO_CARD_PROVIDER_ID,
            ],
          },
        ],
      },
    })

    iranRegion = regionResult[0];
  } catch (error: any) {
    const message = error?.message || "";

    // If the seed ran before, the region creation can fail because those
    // countries are already assigned to an existing region.
    if (message.includes("already assigned to a region")) {
      logger.info(
        'Countries are already assigned to a region. Reusing existing "Iran" region.'
      );

      const { data: existingRegions } = await query.graph({
        entity: "region",
        fields: ["id", "name", "currency_code"],
      });

      const existingIranRegion = existingRegions.find(
        (r: any) => r?.name === "Iran"
      );

      if (!existingIranRegion) {
        throw error;
      }

      iranRegion = existingIranRegion;
    } else {
      throw error;
    }
  }
  logger.info("Finished seeding regions.");

  logger.info("Applying Iran currencies and default region to store...");
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [...IRAN_STORE_CURRENCIES],
        default_region_id: iranRegion.id,
        default_sales_channel_id: defaultSalesChannel.id,
      },
    },
  });
  logger.info(
    `Store ${store.id}: supported_currencies=irr+irt (default irt), default_region=Iran.`
  );

  logger.info("Seeding tax regions...");
  try {
    await createTaxRegionsWorkflow(container).run({
      input: allTaxCountries.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    });
  } catch (error: any) {
    const message = error?.message || "";

    // If the seed ran before, the tax regions for these countries can exist already.
    if (message.toLowerCase().includes("tax region") && message.toLowerCase().includes("already exists")) {
      logger.info("Tax regions already exist. Skipping tax region creation.");
    } else if (message.toLowerCase().includes("already exists")) {
      logger.info("Some tax region records already exist. Skipping tax region creation.");
    } else {
      throw error;
    }
  }
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "European Warehouse",
          address: {
            city: "Copenhagen",
            country_code: "DK",
            address_1: "",
          },
        },
        {
          name: "Iran Warehouse",
          address: {
            city: "Tehran",
            country_code: "IR",
            address_1: "",
          },
        },
      ],
    },
  });
  const europeStockLocation = stockLocationResult[0];
  const iranStockLocation = stockLocationResult[1];

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: europeStockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: iranStockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  // This is created by a migration script in core.
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  let europeFulfillmentSet: any;
  let iranFulfillmentSet: any;
  try {
    europeFulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "European Warehouse delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Europe",
          geo_zones: [
            {
              country_code: "gb",
              type: "country",
            },
            {
              country_code: "de",
              type: "country",
            },
            {
              country_code: "dk",
              type: "country",
            },
            {
              country_code: "se",
              type: "country",
            },
            {
              country_code: "fr",
              type: "country",
            },
            {
              country_code: "es",
              type: "country",
            },
            {
              country_code: "it",
              type: "country",
            },
          ],
        },
      ],
    });
  } catch (error: any) {
    const message = error?.message || "";

    if (
      message.toLowerCase().includes("fulfillment set") &&
      message.toLowerCase().includes("already exists")
    ) {
      logger.info(
        'Fulfillment set already exists. Reusing existing "European Warehouse delivery".'
      );

      const { data: fulfillmentSets } = await query.graph({
        entity: "fulfillment_set",
        fields: ["id", "name", "service_zones"],
      });

      europeFulfillmentSet = fulfillmentSets.find(
        (s: any) => s?.name === "European Warehouse delivery"
      );

      if (!europeFulfillmentSet) {
        throw error;
      }
    } else {
      throw error;
    }
  }

  try {
    iranFulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Iran Warehouse delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Iran",
          geo_zones: [
            {
              country_code: "ir",
              type: "country",
            },
          ],
        },
      ],
    });
  } catch (error: any) {
    const message = error?.message || "";

    if (
      message.toLowerCase().includes("fulfillment set") &&
      message.toLowerCase().includes("already exists")
    ) {
      logger.info(
        'Fulfillment set already exists. Reusing existing "Iran Warehouse delivery".'
      );

      const { data: fulfillmentSets } = await query.graph({
        entity: "fulfillment_set",
        fields: ["id", "name", "service_zones"],
      });

      iranFulfillmentSet = fulfillmentSets.find(
        (s: any) => s?.name === "Iran Warehouse delivery"
      );

      if (!iranFulfillmentSet) {
        throw error;
      }
    } else {
      throw error;
    }
  }

  try {
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: europeStockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: europeFulfillmentSet.id,
      },
    });
  } catch (error: any) {
    const message = error?.message || "";

    if (
      message.toLowerCase().includes("multiple links between") &&
      message.toLowerCase().includes("stock_location") &&
      message.toLowerCase().includes("fulfillment")
    ) {
      logger.info(
        "Stock location ↔ fulfillment links already exist. Skipping link creation."
      );
    } else {
      throw error;
    }
  }

  try {
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: iranStockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: iranFulfillmentSet.id,
      },
    });
  } catch (error: any) {
    const message = error?.message || "";

    if (
      message.toLowerCase().includes("multiple links between") &&
      message.toLowerCase().includes("stock_location") &&
      message.toLowerCase().includes("fulfillment")
    ) {
      logger.info(
        "Stock location ↔ fulfillment links already exist. Skipping link creation."
      );
    } else {
      throw error;
    }
  }

  let europeServiceZoneId = europeFulfillmentSet?.service_zones?.[0]?.id
  let iranServiceZoneId = iranFulfillmentSet?.service_zones?.[0]?.id

  if (!europeServiceZoneId || !iranServiceZoneId) {
    const { data: serviceZones } = await query.graph({
      entity: "service_zone",
      fields: ["id", "name"],
    })

    if (!europeServiceZoneId) {
      const europeServiceZone = serviceZones.find(
        (z: any) => z?.name === "Europe"
      )

      if (!europeServiceZone) {
        throw new Error(
          'Seeding: could not resolve "Europe" service_zone_id.'
        )
      }

      europeServiceZoneId = europeServiceZone.id
    }

    if (!iranServiceZoneId) {
      const iranServiceZone = serviceZones.find(
        (z: any) => z?.name === "Iran"
      )

      if (!iranServiceZone) {
        throw new Error(
          'Seeding: could not resolve "Iran" service_zone_id.'
        )
      }

      iranServiceZoneId = iranServiceZone.id
    }
  }

  const createShippingOptions = async (options: any[]) => {
    try {
      await createShippingOptionsWorkflow(container).run({ input: options })
    } catch (error: any) {
      const message = error?.message || ""

      if (message.toLowerCase().includes("already exists")) {
        logger.info("Shipping options already exist. Skipping creation.")
        return
      }

      throw error
    }
  }

  await createShippingOptions([
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: europeServiceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: europeRegion.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: europeServiceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: europeRegion.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ]);

  // Iran shipping options (different service zone, so they don't interfere with Europe).
  await createShippingOptions([
      {
        name: "ارسال عادی (ایران)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: iranServiceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard Iran",
          description: "تحویل ۲ تا ۳ روز کاری در سراسر ایران.",
          code: "iran-standard",
        },
        prices: [
          {
            currency_code: "irt",
            amount: storeDefaultIrtAmount,
          },
          {
            currency_code: "irr",
            amount: storeDefaultIrrAmount,
          },
          {
            region_id: iranRegion.id,
            amount: storeDefaultIrtAmount,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "ارسال سریع (ایران)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: iranServiceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express Iran",
          description: "تحویل ۲۴ ساعته در شهرهای تحت پوشش.",
          code: "iran-express",
        },
        prices: [
          {
            currency_code: "irt",
            amount: storeDefaultIrtAmount,
          },
          {
            currency_code: "irr",
            amount: storeDefaultIrrAmount,
          },
          {
            region_id: iranRegion.id,
            amount: storeDefaultIrtAmount,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "مرجوعی (ایران)",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: iranServiceZoneId,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Return Iran",
          description: "ارسال مرجوعی خریدار به انبار ایران.",
          code: "iran-return",
        },
        prices: [
          {
            currency_code: "irt",
            amount: 0,
          },
          {
            currency_code: "irr",
            amount: 0,
          },
          {
            region_id: iranRegion.id,
            amount: 0,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "true",
            operator: "eq",
          },
        ],
      },
    ]);
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: europeStockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: iranStockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product data...");
  try {

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Shirts",
          is_active: true,
        },
        {
          name: "Sweatshirts",
          is_active: true,
        },
        {
          name: "Pants",
          is_active: true,
        },
        {
          name: "Merch",
          is_active: true,
        },
      ],
    },
  });

  const { result: productOptionsResult } = await createProductOptionsWorkflow(
    container
  ).run({
    input: {
      product_options: [
        {
          title: "Size",
          values: ["S", "M", "L", "XL"],
        },
        {
          title: "Color",
          values: ["Black", "White"],
        },
      ],
    },
  });
  const sizeOption = productOptionsResult.find((o) => o.title === "Size")!;
  const colorOption = productOptionsResult.find((o) => o.title === "Color")!;

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Medusa T-Shirt",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Shirts")!.id,
          ],
          description:
            "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
          handle: "t-shirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png",
            },
          ],
          options: [
            { id: sizeOption.id },
            { id: colorOption.id },
          ],
          variants: [
            {
              title: "S / Black",
              sku: "SHIRT-S-BLACK",
              options: {
                Size: "S",
                Color: "Black",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "S / White",
              sku: "SHIRT-S-WHITE",
              options: {
                Size: "S",
                Color: "White",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "M / Black",
              sku: "SHIRT-M-BLACK",
              options: {
                Size: "M",
                Color: "Black",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "M / White",
              sku: "SHIRT-M-WHITE",
              options: {
                Size: "M",
                Color: "White",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "L / Black",
              sku: "SHIRT-L-BLACK",
              options: {
                Size: "L",
                Color: "Black",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "L / White",
              sku: "SHIRT-L-WHITE",
              options: {
                Size: "L",
                Color: "White",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "XL / Black",
              sku: "SHIRT-XL-BLACK",
              options: {
                Size: "XL",
                Color: "Black",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "XL / White",
              sku: "SHIRT-XL-WHITE",
              options: {
                Size: "XL",
                Color: "White",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Medusa Sweatshirt",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sweatshirts")!.id,
          ],
          description:
            "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
          handle: "sweatshirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png",
            },
          ],
          options: [{ id: sizeOption.id }],
          variants: [
            {
              title: "S",
              sku: "SWEATSHIRT-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATSHIRT-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "L",
              sku: "SWEATSHIRT-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "XL",
              sku: "SWEATSHIRT-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Medusa Sweatpants",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Pants")!.id,
          ],
          description:
            "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.",
          handle: "sweatpants",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png",
            },
          ],
          options: [{ id: sizeOption.id }],
          variants: [
            {
              title: "S",
              sku: "SWEATPANTS-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATPANTS-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "L",
              sku: "SWEATPANTS-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "XL",
              sku: "SWEATPANTS-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Medusa Shorts",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merch")!.id,
          ],
          description:
            "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.",
          handle: "shorts",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png",
            },
          ],
          options: [{ id: sizeOption.id }],
          variants: [
            {
              title: "S",
              sku: "SHORTS-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "M",
              sku: "SHORTS-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "L",
              sku: "SHORTS-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
            {
              title: "XL",
              sku: "SHORTS-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 15,
                  currency_code: "usd",
                },
                {
                  amount: storeDefaultIrtAmount,
                  currency_code: "irt",
                },
                {
                  amount: storeDefaultIrrAmount,
                  currency_code: "irr",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: [
        ...inventoryItems.map((item) => ({
          location_id: europeStockLocation.id,
          stocked_quantity: 1000000,
          inventory_item_id: item.id,
        })),
        ...inventoryItems.map((item) => ({
          location_id: iranStockLocation.id,
          stocked_quantity: 1000000,
          inventory_item_id: item.id,
        })),
      ],
    },
  });

  logger.info("Finished seeding inventory levels data.");
  } catch (error: any) {
    const message = error?.message || "";

    // If dev DB was already seeded, these workflows can fail with uniqueness errors.
    if (message.toLowerCase().includes("already exists")) {
      logger.info(
        "Product/inventory data already exists. Skipping product/inventory seeding."
      );
    } else {
      throw error;
    }
  }

  // Products are often already seeded in dev DBs.
  // Phase 1 requirements must still be applied, so we upsert IRR/IRT prices
  // for the known seed SKUs even when product creation was skipped.
  logger.info("Upserting IRR/IRT variant prices for Iran currency display...");

  const variantSkusForIran = [
    "SHIRT-S-BLACK",
    "SHIRT-S-WHITE",
    "SHIRT-M-BLACK",
    "SHIRT-M-WHITE",
    "SHIRT-L-BLACK",
    "SHIRT-L-WHITE",
    "SHIRT-XL-BLACK",
    "SHIRT-XL-WHITE",
    "SWEATSHIRT-S",
    "SWEATSHIRT-M",
    "SWEATSHIRT-L",
    "SWEATSHIRT-XL",
    "SWEATPANTS-S",
    "SWEATPANTS-M",
    "SWEATPANTS-L",
    "SWEATPANTS-XL",
    "SHORTS-S",
    "SHORTS-M",
    "SHORTS-L",
    "SHORTS-XL",
  ];

  const { data: productVariants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "product_id"],
  });

  const targetVariants = productVariants.filter(
    (v: any) =>
      v?.sku && variantSkusForIran.includes(v.sku) && !!v?.product_id
  );

  if (!targetVariants.length) {
    logger.info("No matching variants found for IRR/IRT price upsert.");
  } else {
    await upsertVariantPricesWorkflow(container).run({
      input: {
        variantPrices: targetVariants.map((v: any) => ({
          variant_id: v.id,
          product_id: v.product_id,
          prices: [
            {
              amount: storeDefaultIrtAmount,
              currency_code: "irt",
            },
            {
              amount: storeDefaultIrrAmount,
              currency_code: "irr",
            },
          ],
        })),
        // Mark these variants as "existing" so Medusa updates the existing
        // price sets instead of creating new ones (which would violate the
        // unique product↔pricing link constraint).
        previousVariantIds: targetVariants.map((v: any) => v.id),
      },
    });

    logger.info(
      `Upserted IRR/IRT prices for ${targetVariants.length} variants.`
    );
  }
}
