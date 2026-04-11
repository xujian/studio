-- =============================================
-- Column rename migration (part 3)
-- related_id   → ref         (transactions)
-- updated_at   → updated     (subscriptions)
-- is_purchased → purchased   (computed alias in get_user_assets / get_store_assets — not a real column)
-- =============================================

-- Step 1: Rename real columns
ALTER TABLE transactions RENAME COLUMN related_id TO ref;
ALTER TABLE subscriptions RENAME COLUMN updated_at TO updated;

-- Step 2: Update functions that return is_purchased as a computed alias

-- get_user_assets
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
  purchased boolean
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id, a."user", a.name, a.title, a.description,
    a.type, a.path, a.content, a.price, a.created,
    (p.id IS NOT NULL) AS purchased
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

-- get_store_assets
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
  purchased boolean
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
    ) AS purchased
  FROM public.assets a
  WHERE a.price IS NOT NULL
  ORDER BY a.type, a.created DESC;
$$;

-- Also update deduct_generation_credits and reset_subscription_credits
-- which insert into transactions using the old related_id column name
CREATE OR REPLACE FUNCTION deduct_generation_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  generation_cost integer := 1;
  v_user_id uuid;
  v_prompt text;
BEGIN
  SELECT m."user", m.prompt INTO v_user_id, v_prompt
  FROM public.moments m WHERE m.id = NEW.moment;

  UPDATE public.profiles
  SET credits = credits - generation_cost
  WHERE id = v_user_id;

  INSERT INTO public.transactions ("user", type, amount, ref, description)
  VALUES (
    v_user_id,
    'generation_cost',
    -generation_cost,
    NEW.id,
    'Generation: ' || COALESCE(SUBSTRING(v_prompt, 1, 50), 'No prompt')
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION process_asset_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits - NEW.price
  WHERE id = NEW.buyer;

  INSERT INTO public.transactions ("user", type, amount, ref, description)
  VALUES (
    NEW.buyer,
    'asset_purchase',
    -NEW.price,
    NEW.id,
    'Purchased asset: ' || (
      SELECT name FROM public.assets WHERE id = NEW.asset
    )
  );

  RETURN NEW;
END;
$$;
