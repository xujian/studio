import type { User as SupabaseUser } from '@supabase/supabase-js'
import { CamelCasedProperties } from 'type-fest'

/**
 * seperate type for supabase user
 */
export type User = CamelCasedProperties<SupabaseUser>

export type Generation = {
  id: string
  user: string
  prompt: string
  url: string | null
  status: 'completed' | 'failed'
  error: string | null
  created_at: string
}

export type Profile = {
  id: string
  name: string | null
  avatar: string | null
  created_at: string
}
