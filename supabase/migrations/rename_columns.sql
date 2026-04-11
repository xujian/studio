-- =============================================
-- Column rename migration
-- created_at   → created
-- user_id      → "user"   ⚠ reserved word — always quote in SQL: "user"
-- post_id      → post
-- moment_id    → moment
-- buyer_id     → buyer
-- asset_id     → asset
-- subscription_tier → tier   (profiles table only — subscriptions already has tier)
-- final_prompt → final
-- likes_count  → likes       (computed alias in get_posts, not a real column)
-- =============================================

-- =============================================
-- Step 1: Drop RLS policies that reference renamed columns
-- =============================================

DROP POLICY IF EXISTS "Can view profiles of post authors" ON profiles;

DROP POLICY IF EXISTS "Users can view own moments" ON moments;
DROP POLICY IF EXISTS "Users can insert own moments" ON moments;
DROP POLICY IF EXISTS "Users can update own moments" ON moments;
DROP POLICY IF EXISTS "Users can delete own moments" ON moments;
DROP POLICY IF EXISTS "Can view moments of public posts" ON moments;

DROP POLICY IF EXISTS "Users can view own assets" ON assets;
DROP POLICY IF EXISTS "Users can view public store assets" ON assets;
DROP POLICY IF EXISTS "Users can insert own assets" ON assets;
DROP POLICY IF EXISTS "Users can update own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON assets;
DROP POLICY IF EXISTS "Super can view all assets" ON assets;
DROP POLICY IF EXISTS "Super can update any asset" ON assets;
DROP POLICY IF EXISTS "Super can delete any asset" ON assets;

DROP POLICY IF EXISTS "Users can view photos of own moments" ON photos;
DROP POLICY IF EXISTS "Users can view photos of public posts" ON photos;
DROP POLICY IF EXISTS "Users can insert photos to own moments" ON photos;
DROP POLICY IF EXISTS "Users can delete photos of own moments" ON photos;

DROP POLICY IF EXISTS "Anyone can view posts" ON posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON posts;

DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;

DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;

DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;

DROP POLICY IF EXISTS "Public can read photos from posts" ON storage.objects;

-- =============================================
-- Step 2: Update REVOKE for renamed column
-- =============================================

REVOKE UPDATE (stripe_customer_id, subscription_tier) ON profiles FROM authenticated;

-- =============================================
-- Step 3: Rename columns
-- (PostgreSQL auto-updates indexes and FK constraints)
-- =============================================

-- profiles
ALTER TABLE profiles RENAME COLUMN subscription_tier TO tier;
ALTER TABLE profiles RENAME COLUMN created_at TO created;

-- moments
ALTER TABLE moments RENAME COLUMN user_id TO "user";
ALTER TABLE moments RENAME COLUMN final_prompt TO final;
ALTER TABLE moments RENAME COLUMN created_at TO created;

-- assets
ALTER TABLE assets RENAME COLUMN user_id TO "user";
ALTER TABLE assets RENAME COLUMN created_at TO created;

-- photos
ALTER TABLE photos RENAME COLUMN moment_id TO moment;
ALTER TABLE photos RENAME COLUMN created_at TO created;

-- posts
ALTER TABLE posts RENAME COLUMN user_id TO "user";
ALTER TABLE posts RENAME COLUMN moment_id TO moment;
ALTER TABLE posts RENAME COLUMN created_at TO created;

-- likes
ALTER TABLE likes RENAME COLUMN post_id TO post;
ALTER TABLE likes RENAME COLUMN user_id TO "user";
ALTER TABLE likes RENAME COLUMN created_at TO created;

-- purchases
ALTER TABLE purchases RENAME COLUMN buyer_id TO buyer;
ALTER TABLE purchases RENAME COLUMN asset_id TO asset;
ALTER TABLE purchases RENAME COLUMN created_at TO created;

-- transactions
ALTER TABLE transactions RENAME COLUMN user_id TO "user";
ALTER TABLE transactions RENAME COLUMN created_at TO created;

-- subscriptions
ALTER TABLE subscriptions RENAME COLUMN user_id TO "user";
ALTER TABLE subscriptions RENAME COLUMN created_at TO created;

-- =============================================
-- Step 4: Restore REVOKE with new column name
-- =============================================

REVOKE UPDATE (stripe_customer_id, tier) ON profiles FROM authenticated;

-- =============================================
-- Step 5: Recreate RLS policies
-- =============================================

-- profiles
CREATE POLICY "Can view profiles of post authors"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts."user" = profiles.id
    )
  );

-- moments
CREATE POLICY "Users can view own moments"
  ON moments FOR SELECT
  USING (auth.uid() = "user");

CREATE POLICY "Users can insert own moments"
  ON moments FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can update own moments"
  ON moments FOR UPDATE
  USING (auth.uid() = "user");

CREATE POLICY "Users can delete own moments"
  ON moments FOR DELETE
  USING (auth.uid() = "user");

CREATE POLICY "Can view moments of public posts"
  ON moments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.moment = moments.id
    )
  );

-- assets
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (auth.uid() = "user");

CREATE POLICY "Users can view public store assets"
  ON assets FOR SELECT
  USING ("user" IS NULL);

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (auth.uid() = "user");

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (auth.uid() = "user");

CREATE POLICY "Super can view all assets"
  ON assets FOR SELECT
  USING (is_super());

CREATE POLICY "Super can update any asset"
  ON assets FOR UPDATE
  USING (is_super());

CREATE POLICY "Super can delete any asset"
  ON assets FOR DELETE
  USING (is_super());

-- photos
CREATE POLICY "Users can view photos of own moments"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment
        AND moments."user" = auth.uid()
    )
  );

CREATE POLICY "Users can view photos of public posts"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.moment = photos.moment
    )
  );

CREATE POLICY "Users can insert photos to own moments"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment
        AND moments."user" = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own moments"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment
        AND moments."user" = auth.uid()
    )
  );

-- posts
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = "user");

-- likes
CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = "user");

-- purchases
CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = buyer);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer);

-- transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = "user");

-- subscriptions
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = "user");

-- storage: public photo access via published posts
CREATE POLICY "Public can read photos from posts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'photos' AND
    EXISTS (
      SELECT 1 FROM photos p
      JOIN moments m ON m.id = p.moment
      JOIN posts ON posts.moment = p.moment
      WHERE name = m."user"::text || '/' || m.id || '/' || p.id || '.jpg'
    )
  );

-- =============================================
-- Step 6: Update functions
-- =============================================

-- deduct_generation_credits trigger
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

  INSERT INTO public.transactions ("user", type, amount, related_id, description)
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

-- process_asset_purchase trigger
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

  INSERT INTO public.transactions ("user", type, amount, related_id, description)
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
  is_purchased boolean
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id, a."user", a.name, a.title, a.description,
    a.type, a.path, a.content, a.price, a.created,
    (p.id IS NOT NULL) AS is_purchased
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
  is_purchased boolean
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
    ) AS is_purchased
  FROM public.assets a
  WHERE a.price IS NOT NULL
  ORDER BY a.type, a.created DESC;
$$;

-- get_posts
-- Note: moment_id dropped from return — use moment.id instead (avoids name collision with moment jsonb)
CREATE OR REPLACE FUNCTION get_posts(user_uuid uuid, page_limit int DEFAULT 20, page_offset int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  "user" uuid,
  created timestamptz,
  moment jsonb,
  author jsonb,
  likes bigint,
  liked boolean
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p."user",
    p.created,
    jsonb_build_object(
      'id', m.id,
      'user', m."user",
      'prompt', m.prompt,
      'title', m.title,
      'mixins', m.mixins,
      'status', m.status,
      'created', m.created,
      'photos', COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', ph.id,
            'moment', ph.moment,
            'prompt', ph.prompt,
            'mixins', ph.mixins,
            'created', ph.created
          ) ORDER BY ph.created DESC
        ) FROM public.photos ph WHERE ph.moment = m.id),
        '[]'::jsonb
      )
    ) AS moment,
    jsonb_build_object(
      'id', pr.id,
      'name', pr.name,
      'avatar', pr.avatar
    ) AS author,
    (SELECT COUNT(*) FROM public.likes l WHERE l.post = p.id) AS likes,
    EXISTS (
      SELECT 1 FROM public.likes l WHERE l.post = p.id AND l."user" = user_uuid
    ) AS liked
  FROM public.posts p
  JOIN public.moments m ON m.id = p.moment
  JOIN public.profiles pr ON pr.id = p."user"
  ORDER BY p.created DESC
  LIMIT page_limit
  OFFSET page_offset;
$$;

-- purchase_asset
CREATE OR REPLACE FUNCTION purchase_asset(asset_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_asset public.assets;
  v_credits integer;
BEGIN
  SELECT * INTO v_asset FROM public.assets WHERE id = asset_uuid;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Asset not found');
  END IF;

  IF v_asset."user" IS NOT NULL OR v_asset.price IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Asset is not for sale');
  END IF;

  IF EXISTS (SELECT 1 FROM public.purchases WHERE buyer = v_user_id AND asset = asset_uuid) THEN
    RETURN json_build_object('success', false, 'error', 'Already purchased');
  END IF;

  SELECT credits INTO v_credits FROM public.profiles WHERE id = v_user_id;
  IF v_credits < v_asset.price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  INSERT INTO public.purchases (buyer, asset, price)
  VALUES (v_user_id, asset_uuid, v_asset.price);

  RETURN json_build_object('success', true, 'remaining_credits', v_credits - v_asset.price);
END;
$$;

-- reset_subscription_credits
CREATE OR REPLACE FUNCTION reset_subscription_credits(user_uuid uuid, tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  credit_amount integer;
BEGIN
  credit_amount := CASE tier
    WHEN 'basic' THEN 100
    WHEN 'pro'   THEN 250
    WHEN 'max'   THEN 600
    ELSE NULL
  END;

  IF credit_amount IS NULL THEN
    RAISE EXCEPTION 'Unknown subscription tier: %', tier;
  END IF;

  UPDATE public.profiles
  SET credits = credit_amount
  WHERE id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_uuid: %', user_uuid;
  END IF;

  INSERT INTO public.transactions ("user", type, amount, description)
  VALUES (
    user_uuid,
    'subscription_reset',
    credit_amount,
    'Monthly subscription reset: ' || tier || ' plan (' || credit_amount || ' credits)'
  );
END;
$$;
