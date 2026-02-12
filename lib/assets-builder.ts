import { Part } from "@google/genai"
import { Asset, Assets, AssetType } from "./types"
import { assetUrl } from "./utils"

const AssetsBuilder = {

  /**
   * build prompt from assets that mixin to the prompt
   */
  build: async function (assets?: Assets) {
    const parts: (string | Part)[] = [],
      sections: {
        key: string
        content: string
      }[] = []
    if (!assets) {
      return { parts, sections }
    }
    // default mixin content
    for (const [type, asset] of Object.entries(assets)) {
      const method = assetMethods.get(type as AssetType)
      if (method) {
        const result = await method(asset)
        sections.push({
          key: type as string,
          content: result.text
        })
        if (result.image) {
          // asset is an image
          parts.push(`reference ${type}:`)
          parts.push(result.image!)
        }
      }
    }
    return { parts, sections }
  }
}

async function buildFace(asset: Asset) {
  const inlineData = await fetchImage(asset.path!)
  return {
    image: {
      inlineData
    },
    text: `facial features are 100% identical to the "reference face"`
  }
}

async function buildMakeup(asset: Asset) {
  if (asset.path) {
    const inlineData = await fetchImage(asset.path)
    return {
      image: {
        inlineData
      },
      text: `use "reference makeup"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildOutfit(asset: Asset) {
  if (asset.path) {
    const inlineData = await fetchImage(asset.path)
    return {
      image: {
        inlineData
      },
      text: `use the "reference outfit"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildScene(asset: Asset) {
  if (asset.path) {
    const inlineData = await fetchImage(asset.path)
    return {
      image: {
        inlineData
      },
      text: `use "reference scene"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildLighting(asset: Asset) {
  if (asset.path) {
    const inlineData = await fetchImage(asset.path)
    return {
      image: {
        inlineData
      },
      text: `use the "reference lighting"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildMood(asset: Asset) {
  if (asset.path) {
    const inlineData = await fetchImage(asset.path)
    return {
      image: {
        inlineData
      },
      text: `use the "reference mood"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildCamera(asset: Asset) {
  if (asset.path) {
    const inlineData = await fetchImage(asset.path)
    return {
      image: {
        inlineData
      },
      text: `use the "reference camera"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

const assetMethods = new Map<
  AssetType,
  (asset: Asset) => Promise<{
    image?: Part
    text: string
  }>
>()
assetMethods.set('face', buildFace)
assetMethods.set('makeup', buildMakeup)
assetMethods.set('outfit', buildOutfit)
assetMethods.set('scene', buildScene)
assetMethods.set('lighting', buildLighting)
assetMethods.set('camera', buildCamera)
assetMethods.set('mood', buildMood)

async function fetchImage(url: string): Promise<{
  mimeType: string
  data: string
}> {
  const image = await fetch(assetUrl(url))
  if (!image.ok) {
    throw new Error(`Failed to fetch face image: ${image.statusText}`)
  }
  const buffer = await image.arrayBuffer()
  const data = Buffer.from(buffer).toString('base64')
  return {
    mimeType: image.headers.get('content-type') || 'image/jpeg',
    data
  }
}

export default AssetsBuilder