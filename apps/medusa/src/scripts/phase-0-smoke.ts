import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  OrderStatus,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  convertDraftOrderWorkflow,
  createOrderWorkflow,
  createProductsWorkflow,
} from "@medusajs/core-flows"

export default async function phase0Smoke({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const regionModuleService = container.resolve(Modules.REGION)
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  const salesChannels = await salesChannelModuleService.listSalesChannels({}, {
    take: 1,
  })
  const regions = await regionModuleService.listRegions({}, { take: 1 })
  const shippingOptions = await fulfillmentModuleService.listShippingOptions(
    {},
    { take: 10 }
  )

  if (!salesChannels.length) {
    throw new Error("Phase 0 smoke: no sales channel found.")
  }

  if (!regions.length) {
    throw new Error("Phase 0 smoke: no region found.")
  }

  const standardShipping = shippingOptions.find(
    (option: any) => option.name === "Standard Shipping"
  )

  if (!standardShipping) {
    throw new Error('Phase 0 smoke: shipping option "Standard Shipping" not found.')
  }

  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })

  const shippingProfile = shippingProfiles[0]

  if (!shippingProfile?.id) {
    throw new Error("Phase 0 smoke: no shipping profile found.")
  }

  const salesChannel = salesChannels[0]
  const region = regions[0]
  const suffix = Date.now()
  const handle = `phase-0-admin-product-${suffix}`
  const sku = `PHASE0-${suffix}`

  logger.info(`Phase 0 smoke: creating product ${handle}`)

  const { result: createdProducts } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: `Phase 0 Admin Product ${suffix}`,
          handle,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          description: "Smoke-test product created to finish phase 0.",
          options: [
            {
              title: "Size",
              values: ["Default"],
            },
          ],
          variants: [
            {
              title: "Default",
              sku,
              options: {
                Size: "Default",
              },
              prices: [
                {
                  amount: 1999,
                  currency_code: region.currency_code,
                },
              ],
            },
          ],
          sales_channels: [{ id: salesChannel.id }],
        },
      ],
    },
  })

  const createdProduct = createdProducts[0] as any
  const variantId = createdProduct?.variants?.[0]?.id

  if (!variantId) {
    throw new Error("Phase 0 smoke: created product variant ID was not returned.")
  }

  logger.info(`Phase 0 smoke: creating draft order with manual line item`)

  const { result: draftOrder } = await createOrderWorkflow(container).run({
    input: {
      region_id: region.id,
      sales_channel_id: salesChannel.id,
      email: "phase0@example.local",
      status: OrderStatus.DRAFT,
      is_draft_order: true,
      shipping_address: {
        first_name: "Phase",
        last_name: "Zero",
        address_1: "1 Admin Test Street",
        city: "Copenhagen",
        country_code: "dk",
        postal_code: "2100",
        phone: "0000000000",
      },
      billing_address: {
        first_name: "Phase",
        last_name: "Zero",
        address_1: "1 Admin Test Street",
        city: "Copenhagen",
        country_code: "dk",
        postal_code: "2100",
        phone: "0000000000",
      },
      items: [
        {
          title: createdProduct.title,
          unit_price: 1999,
          quantity: 1,
        },
      ],
      shipping_methods: [
        {
          name: standardShipping.name,
          shipping_option_id: standardShipping.id,
          amount: 10,
        },
      ],
      no_notification: true,
    },
  })

  logger.info(`Phase 0 smoke: converting draft order ${draftOrder.id} to order`)

  const { result: order } = await convertDraftOrderWorkflow(container).run({
    input: {
      id: draftOrder.id,
    },
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        product: {
          id: createdProduct.id,
          title: createdProduct.title,
          handle: createdProduct.handle,
          variant_id: variantId,
          sku,
        },
        order: {
          id: order.id,
          status: order.status,
          email: order.email,
          sales_channel_id: order.sales_channel_id,
        },
        region: {
          id: region.id,
          name: region.name,
          currency_code: region.currency_code,
        },
        shipping_option: {
          id: standardShipping.id,
          name: standardShipping.name,
        },
      },
      null,
      2
    )
  )
}
