import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const userId = session.user.id

  const { assetId } = await request.json()
  if (!assetId) {
    return NextResponse.json({ error: 'Missing assetId' }, { status: 400 })
  }

  // Verify ownership
  const { data: asset, error: fetchError } = await supabase
    .from('assets')
    .select('id, path, type')
    .eq('id', assetId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  // Move image file from user path to public path
  // User path:   {userId}/{type}/{filename}
  // Public path: {type}/{filename}
  let newPath = asset.path
  if (asset.path) {
    const filename = asset.path.split('/').pop()!
    newPath = `${asset.type}/${filename}`

    const admin = createAdminClient()

    const { error: copyError } = await admin.storage
      .from('assets')
      .copy(asset.path, newPath)

    if (copyError) {
      console.error('[assets/promote] copy failed', copyError)
      return NextResponse.json({ error: 'Storage copy failed' }, { status: 500 })
    }

    // Delete original from user folder
    await admin.storage.from('assets').remove([asset.path])
  }

  // Promote: clear owner, set price, update path
  const { error: updateError } = await supabase
    .from('assets')
    .update({ user_id: null, price: 10, path: newPath })
    .eq('id', assetId)

  if (updateError) {
    console.error('[assets/promote] db update failed', updateError)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, path: newPath })
}
