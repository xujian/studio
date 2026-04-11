# Database Quick Reference

Print a quick reference of all 9 database tables, storage buckets, and RLS patterns.

## Tables

| Table | Key Fields | RLS | Related RPCs |
|-------|-----------|-----|--------------|
| `profiles` | `id`, `name`, `avatar`, `credits`, `customer`, `tier` | Own row only (view + update) | — |
| `moments` | `id`, `user`, `prompt`, `mixins` (JSONB), `final`, `status` | Own rows only | — |
| `photos` | `id`, `moment`, `user`, `prompt` (delta), `mixins` (delta) | Own moments' photos | — |
| `assets` | `id`, `user`, `name`, `type`, `path`, `content`, `price` | Own + public read (`user` IS NULL); purchased | `get_user_assets(user_uuid)` |
| `purchases` | `id`, `buyer`, `asset`, `created` | Own rows | — |
| `posts` | `id`, `user`, `moment` (UNIQUE) | Insert own; public read | — |
| `likes` | `id`, `post`, `user` (UNIQUE pair) | Insert/delete own; public read | — |
| `transactions` | `id`, `user`, `amount` (signed int), `type`, `ref` | Own rows only | — |
| `subscriptions` | `id`, `user`, `subscription`, `customer`, `tier`, `status`, `end` | Own rows only | — |

**Transaction types:** `asset_purchase`, `generation_cost`, `credit_purchase`, `refund`
**Subscription tiers:** `free`, `basic`, `pro`, `max`
**Asset types:** `face`, `makeup`, `hair`, `outfit`, `scene`, `lighting`, `camera`

## Storage Buckets

| Bucket | Path Pattern | Access |
|--------|-------------|--------|
| `photos` | `{user}/{moment}/{photo}.{jpg\|png}` | Private (user + service) |
| `assets` | `{user}/{filename}` | Public read; user write to own folder |

## RLS Pattern

All policies use `auth.uid()`:
```sql
-- Example: own rows only
CREATE POLICY "Users can view own rows" ON table_name
  FOR SELECT USING ("user" = auth.uid());
```

RPC functions use `SECURITY DEFINER` to bypass RLS when querying across ownership boundaries:
```sql
CREATE OR REPLACE FUNCTION get_user_assets(user_uuid uuid)
RETURNS SETOF assets
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT DISTINCT a.*
  FROM assets a
  LEFT JOIN purchases p ON p.asset = a.id AND p.buyer = user_uuid
  WHERE a."user" = user_uuid OR p.id IS NOT NULL
  ORDER BY a.created DESC;
$$;
```

## Delta Merge Reminder

Photos store deltas — always merge before display:
```typescript
const prompt = photo.prompt || moment.prompt
const mixins = { ...moment.mixins, ...photo.mixins }
```
