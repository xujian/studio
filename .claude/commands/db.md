# Database Quick Reference

Print a quick reference of all 9 database tables, storage buckets, and RLS patterns.

## Tables

| Table | Key Fields | RLS | Related RPCs |
|-------|-----------|-----|--------------|
| `profiles` | `id`, `name`, `avatar`, `credits`, `stripe_customer_id`, `subscription_tier` | Own row only (view + update) | — |
| `moments` | `id`, `user_id`, `prompt`, `mixins` (JSONB), `final_prompt`, `status` | Own rows only | — |
| `photos` | `id`, `moment_id`, `url`, `storage_path`, `prompt` (delta), `mixins` (delta) | Own moments' photos | — |
| `assets` | `id`, `user_id`, `name`, `type`, `url`, `content`, `is_public`, `price` | Own + public read; purchased | `get_user_assets(user_uuid)` |
| `purchases` | `id`, `buyer_id`, `asset_id`, `created_at` | Own rows | — |
| `posts` | `id`, `user_id`, `moment_id` (UNIQUE) | Insert own; public read | — |
| `likes` | `id`, `post_id`, `user_id` (UNIQUE pair) | Insert/delete own; public read | — |
| `transactions` | `id`, `user_id`, `amount` (signed int), `type`, `reference_id` | Own rows only | — |
| `subscriptions` | `id`, `user_id`, `stripe_subscription_id`, `tier`, `status` | Own rows only | — |

**Transaction types:** `asset_purchase`, `generation_cost`, `credit_purchase`, `refund`
**Subscription tiers:** `free`, `basic`, `pro`, `max`
**Asset types:** `face`, `makeup`, `hair`, `outfit`, `scene`, `lighting`, `camera`

## Storage Buckets

| Bucket | Path Pattern | Access |
|--------|-------------|--------|
| `photos` | `{userId}/{momentId}/{photoId}.{jpg\|png}` | Private (user + service) |
| `assets` | `{userId}/{filename}` | Public read; user write to own folder |

## RLS Pattern

All policies use `auth.uid()`:
```sql
-- Example: own rows only
CREATE POLICY "Users can view own rows" ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

RPC functions use `SECURITY DEFINER` to bypass RLS when querying across ownership boundaries:
```sql
CREATE OR REPLACE FUNCTION get_user_assets(user_uuid uuid)
RETURNS SETOF assets
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT DISTINCT a.*
  FROM assets a
  LEFT JOIN purchases p ON p.asset_id = a.id AND p.buyer_id = user_uuid
  WHERE a.user_id = user_uuid OR p.id IS NOT NULL
  ORDER BY a.created_at DESC;
$$;
```

## Delta Merge Reminder

Photos store deltas — always merge before display:
```typescript
const prompt = photo.prompt || moment.prompt
const mixins = { ...moment.mixins, ...photo.mixins }
```
