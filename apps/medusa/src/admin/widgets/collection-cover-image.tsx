import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState, type ChangeEvent } from "react"
import { sdk } from "../lib/sdk"

const COVER_IMAGE_URL_KEY = "cover_image_url"
const COVER_IMAGE_FILE_ID_KEY = "cover_image_file_id"

type CollectionMetadata = Record<string, unknown>

/**
 * Read cover URL from collection metadata (storefront maps the same key).
 */
function getCoverImageUrl(metadata: CollectionMetadata | null | undefined): string {
  const value = metadata?.[COVER_IMAGE_URL_KEY]
  return typeof value === "string" ? value : ""
}

/**
 * Medusa Admin widget: upload / replace / clear collection cover image.
 * purpose --- native collection forms have no media field; storefront reads metadata.cover_image_url ---
 */
const CollectionCoverImageWidget = ({
  data: collection,
}: DetailWidgetProps<HttpTypes.AdminCollection>) => {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState(
    getCoverImageUrl(collection.metadata as CollectionMetadata | null)
  )

  const invalidateCollection = async () => {
    await queryClient.invalidateQueries({ queryKey: ["collections"] })
    await queryClient.invalidateQueries({ queryKey: ["collection", collection.id] })
  }

  const saveCoverMutation = useMutation({
    mutationFn: async (next: {
      coverImageUrl: string | null
      coverImageFileId: string | null
    }) => {
      const currentMetadata = {
        ...((collection.metadata as CollectionMetadata | null) || {}),
      }

      if (next.coverImageUrl) {
        currentMetadata[COVER_IMAGE_URL_KEY] = next.coverImageUrl
      } else {
        delete currentMetadata[COVER_IMAGE_URL_KEY]
      }

      if (next.coverImageFileId) {
        currentMetadata[COVER_IMAGE_FILE_ID_KEY] = next.coverImageFileId
      } else {
        delete currentMetadata[COVER_IMAGE_FILE_ID_KEY]
      }

      return sdk.admin.productCollection.update(collection.id, {
        metadata: currentMetadata,
      })
    },
    onSuccess: async (_response, variables) => {
      setPreviewUrl(variables.coverImageUrl || "")
      await invalidateCollection()
      toast.success(
        variables.coverImageUrl ? "Cover image saved" : "Cover image removed"
      )
    },
    onError: (error) => {
      toast.error(error.message || "Could not update cover image")
    },
  })

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploadResponse = await sdk.admin.upload.create({ files: [file] })
      const uploaded = uploadResponse.files?.[0]
      if (!uploaded?.url) {
        throw new Error("Upload returned no file URL")
      }
      return uploaded
    },
    onSuccess: async (uploaded) => {
      await saveCoverMutation.mutateAsync({
        coverImageUrl: uploaded.url,
        coverImageFileId: uploaded.id || null,
      })
    },
    onError: (error) => {
      toast.error(error.message || "Upload failed")
    },
  })

  const isBusy = uploadMutation.isPending || saveCoverMutation.isPending

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }
    uploadMutation.mutate(file)
  }

  const handleRemove = () => {
    saveCoverMutation.mutate({
      coverImageUrl: null,
      coverImageFileId: null,
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Cover image</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Shown on the Mashhoodwear collections grid (`metadata.cover_image_url`).
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        {previewUrl ? (
          <div className="overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle">
            <img
              src={previewUrl}
              alt={`${collection.title} cover`}
              className="max-h-64 w-full object-cover"
            />
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            No cover image yet. Upload a JPEG, PNG, or WebP.
          </Text>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            size="small"
            variant="secondary"
            isLoading={isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? "Replace image" : "Upload image"}
          </Button>
          {previewUrl ? (
            <Button
              size="small"
              variant="secondary"
              disabled={isBusy}
              onClick={handleRemove}
            >
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_collection.details.after",
})

export default CollectionCoverImageWidget
