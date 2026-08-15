import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function checkIranStore({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: stores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "name",
      "default_region_id",
      "supported_currencies.currency_code",
      "supported_currencies.is_default",
    ],
  })

  const { data: currencies } = await query.graph({
    entity: "currency",
    fields: ["code", "name"],
    filters: { code: ["irr", "irt"] },
  })

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
    filters: { name: ["Iran"] },
  })

  console.log(
    JSON.stringify(
      {
        store: stores[0],
        iran_currencies: currencies,
        iran_region: regions[0],
      },
      null,
      2
    )
  )
}
