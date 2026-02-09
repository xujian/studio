import { Part } from "@google/genai"
import { Asset, Assets, AssetType } from "./types"
import * as prompts from '@/lib/prompts'

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
  const inlineData = await fetchImage(asset.url!)
  return {
    image: {
      inlineData
    },
    text: `${prompts.FACE} the "reference face"`
  }
}

async function buildMakeup(asset: Asset) {
  if (asset.url) {
    const inlineData = await fetchImage(asset.url)
    return {
      image: {
        inlineData
      },
      text: `${prompts.MAKEUP} the "reference makeup"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildAttire(asset: Asset) {
  if (asset.url) {
    const inlineData = await fetchImage(asset.url)
    return {
      image: {
        inlineData
      },
      text: `${prompts.ATTIRE} the "reference attire"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildScene(asset: Asset) {
  if (asset.url) {
    const inlineData = await fetchImage(asset.url)
    return {
      image: {
        inlineData
      },
      text: `${prompts.SCENE} the "reference scene"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildLighting(asset: Asset) {
  if (asset.url) {
    const inlineData = await fetchImage(asset.url)
    return {
      image: {
        inlineData
      },
      text: `${prompts.LIGHTING} the "reference lighting"`
    }
  } else {
    return Promise.resolve({
      text: asset.content!
    })
  }
}

async function buildCamera(asset: Asset) {
  if (asset.url) {
    const inlineData = await fetchImage(asset.url)
    return {
      image: {
        inlineData
      },
      text: `${prompts.CAMERA} the "reference camera"`
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
assetMethods.set('attire', buildAttire)
assetMethods.set('scene', buildScene)
assetMethods.set('lighting', buildLighting)
assetMethods.set('camera', buildCamera)

async function fetchImage(url: string): Promise<{
  mimeType: string
  data: string
}> {
  const image = await fetch(url)
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