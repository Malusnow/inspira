import {
  createNoteMediaReference,
  extractNoteMediaAssetIds,
  MEDIA_IMAGE_MAX_BYTES,
  validateMediaUploadIntent
} from "@inspira/contracts"
import { describe, expect, it } from "vitest"

describe("media contract helpers", () => {
  it("round-trips note media references", () => {
    const reference = createNoteMediaReference("asset-1", "uploaded image")

    expect(reference).toBe("![uploaded image](inspira-media:asset-1)")
    expect(extractNoteMediaAssetIds(`${reference}\n\n${reference}`)).toEqual([
      "asset-1"
    ])
  })

  it("validates note image upload intents", () => {
    expect(() =>
      validateMediaUploadIntent({
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: "image/png",
        byteSize: 1024
      })
    ).not.toThrow()

    expect(() =>
      validateMediaUploadIntent({
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: "image/svg+xml",
        byteSize: 1024
      })
    ).toThrow(/Unsupported image type/)

    expect(() =>
      validateMediaUploadIntent({
        kind: "noteImage",
        usage: "noteEmbed",
        mimeType: "image/png",
        byteSize: MEDIA_IMAGE_MAX_BYTES + 1
      })
    ).toThrow(/too large/)
  })
})
