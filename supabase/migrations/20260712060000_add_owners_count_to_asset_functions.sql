-- =============================================
-- Add owners count to asset RPCs
-- get_user_assets, get_store_assets now return `owners`:
-- count of purchases rows for the asset (computed alias,
-- same pattern as `likes` in get_posts — not a real column)
-- =============================================

CREATE OR REPLACE FUNCTION get_user_assets(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  "user" uuid,
  name text,
  title text,
  description text,
  type text,
  path text,
  content text,
  price integer,
  created timestamptz,
  purchased boolean,
  owners bigint
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id, a."user", a.name, a.title, a.description,
    a.type, a.path, a.content, a.price, a.created,
    (p.id IS NOT NULL) AS purchased,
    (SELECT COUNT(*) FROM public.purchases op WHERE op.asset = a.id) AS owners
  FROM public.assets a
  LEFT JOIN public.purchases p ON p.asset = a.id AND p.buyer = user_uuid
  WHERE a.name != ''
    AND (
      a."user" = user_uuid
      OR p.id IS NOT NULL
      OR (a."user" IS NULL AND a.price IS NULL)
      OR (a."user" IS NULL AND (SELECT super FROM public.profiles WHERE id = user_uuid))
    )
  ORDER BY a.created DESC;
$$;

CREATE OR REPLACE FUNCTION get_store_assets(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  "user" uuid,
  name text,
  title text,
  description text,
  type text,
  path text,
  content text,
  price integer,
  created timestamptz,
  purchased boolean,
  owners bigint
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id, a."user", a.name, a.title, a.description,
    a.type, a.path, a.content, a.price, a.created,
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.asset = a.id AND p.buyer = user_uuid
    ) AS purchased,
    (SELECT COUNT(*) FROM public.purchases op WHERE op.asset = a.id) AS owners
  FROM public.assets a
  WHERE a.price IS NOT NULL
  ORDER BY a.type, a.created DESC;
$$;
