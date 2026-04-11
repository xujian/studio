import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { MomentWithPhotos } from '@/lib/types'

export async function fetchMoment(id: string) {
  const supabase = await createClient()

  const { data: moment, error } = await supabase
    .from('moments')
    .select('*, photos(*)')
    .order('created', { referencedTable: 'photos', ascending: false })
    .eq('id', id)
    .single()

  if (error || !moment) notFound()

  const typedMoment = moment as MomentWithPhotos

  const { data: { session } } = await supabase.auth.getSession()
  const readOnly = session?.user?.id !== typedMoment.user

  let author: { id: string; name: string | null; avatar: string | null } | undefined
  if (readOnly) {
    const { data: post } = await supabase
      .from('posts')
      .select('user, profiles:user(id, name, avatar)')
      .eq('moment', id)
      .maybeSingle()

    if (post?.profiles) {
      const p = post.profiles as unknown as { id: string; name: string | null; avatar: string | null }
      author = { id: p.id, name: p.name, avatar: p.avatar }
    }
  }

  return { moment: typedMoment, readOnly, author }
}
