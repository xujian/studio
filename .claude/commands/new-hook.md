Scaffold a new TanStack Query hook at `hooks/$ARGUMENTS.ts`.

Parse `$ARGUMENTS` to extract:
- Hook name (e.g., `use-posts` → `usePosts`)
- Whether it's a query or mutation (default: query)
- The table or RPC function to call

Generate a fully typed hook following this exact pattern:

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'  // or useMutation
import { createClient } from '@/lib/supabase/client'
import type { /* relevant type */ } from '@/lib/types'

export const use{Name} = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['{query-key}'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return []

      const { data, error } = await supabase
        // .from('table') or .rpc('function_name', { user_uuid: session.user.id })

      if (error) throw error
      return (data || []) as {Type}[]
    },
    staleTime: 5 * 60 * 1000
  })
}
```

For **mutations**, use `useMutation` pattern with `onSuccess: () => queryClient.invalidateQueries(...)`.

After generating:
- If using RPC: remind to add the corresponding Postgres function to `supabase/schema.sql`
- Remind to add `'use client'` to any component that imports this hook
