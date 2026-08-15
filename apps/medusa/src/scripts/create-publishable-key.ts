import { ExecArgs } from "@medusajs/framework/types"
import { ApiKeyDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function createPublishableKey({ container }: ExecArgs) {
  const apiKeyService = container.resolve("apiKeyModuleService")
  const generate = container.resolve(ContainerRegistrationKeys.ID_GENERATOR)

  const id = generate()
  const token = `pk_${generate()}${generate()}${generate()}${generate()}${generate()}`

  const result = await apiKeyService.createApiKeys([
    {
      id,
      token,
      title: "Storefront",
      type: "publishable",
      created_by: "admin",
    },
  ])

  console.log("Publishable API Key created:")
  console.log(`Token: ${token}`)
  console.log(`ID: ${id}`)
}
