import type { Metadata } from 'next'
import { AssetCard } from '@/components/asset-card'
import { assets as assetDefines } from '@/lib/assets-config'
import { createClient } from '@/lib/supabase/server'
import type { AssetWithPurchaseInfo } from '@/lib/types'

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
  const sections = assetDefines
    .map(t => ({
      type: t.id,
      name: t.id,
      assets: assets.filter(a => a.type === t.id)
    }))
  return (
    <section className="flex w-full flex-col px-4 pt-2 pb-16 md:px-8 lg:px-16">
      <h1 className="mb-8 text-2xl font-semibold">Store</h1>
      <div className="flex flex-col gap-10">
        {sections.map(section => (
          <div key={section.type}>
            <h2 className="mb-3 text-lg font-semibold leading-6">{section.name}</h2>
            <p className="caption mb-4">{section.assets.length} items total</p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {section.assets.map(asset => (
                <AssetCard
                  key={asset.id}
                  data={asset}
                  hasPrice
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
