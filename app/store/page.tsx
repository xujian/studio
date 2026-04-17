import type { Metadata } from 'next'
import { assets as assetDefines } from '@/lib/assets-config'
import { useBus } from '@/lib/bus'
import { createClient } from '@/lib/supabase/server'
import type { AssetWithPurchaseInfo, Asset } from '@/lib/types'
import { AssetGrid } from './asset-grid'

export const metadata: Metadata = {
  title: 'Asset Store — Styles, Scenes & Looks',
  description:
    'Browse portrait styles, lighting presets, scenes, and outfits for your AI portrait studio. Expand your creative toolkit.',
  alternates: {
    canonical: 'https://kanojostudio.com/store'
  }
}

export default async function StorePage() {
  const supabase = await createClient()
  const {
    data: { session }
  } = await supabase.auth.getSession()
  const userId = session?.user?.id ?? '00000000-0000-0000-0000-000000000000'
  const { data } = await supabase.rpc('get_store_assets', {
    user_uuid: userId
  })
  const assets = (data || []) as AssetWithPurchaseInfo[]
  const sections = assetDefines.map(t => ({
    type: t.id,
    name: t.id,
    assets: assets.filter(a => a.type === t.id)
  }))
  return (
    <section className="flex w-full flex-col px-4 pt-2 pb-16 md:px-8 lg:px-16">
      <h1>Store</h1>
      <AssetGrid data={sections} />
    </section>
  )
}
