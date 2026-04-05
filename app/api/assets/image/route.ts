import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const UUID_PREFIX_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const bucket = formData.get('bucket') as string | null
  const storagePath = formData.get('storagePath') as string | null

  if (!file || !bucket || !storagePath) {
    return NextResponse.json({ error: 'Missing file, bucket, or storagePath' }, { status: 400 })
  }

  // Validate ownership: user-prefixed paths must belong to the session user
  if (UUID_PREFIX_RE.test(storagePath) && !storagePath.startsWith(session.user.id + '/')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await createAdminClient().storage
    .from(bucket)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ storagePath })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { path } = await request.json()
  if (!path || typeof path !== 'string') {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  if (UUID_PREFIX_RE.test(path)) {
    // User-owned path — verify ownership
    if (!path.startsWith(session.user.id + '/')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await supabase.storage.from('assets').remove([path])
  } else {
    // System path — bypass RLS with admin client
    await createAdminClient().storage.from('assets').remove([path])
  }

  return NextResponse.json({ ok: true })
}
