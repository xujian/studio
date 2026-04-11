-- =============================================
-- Kanojo Studio Database Schema
-- =============================================

-- Profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text,
  avatar text,
  credits integer DEFAULT 10,
  created timestamptz DEFAULT now()
);

-- Add subscription tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tier text DEFAULT 'free';
-- Values: 'free' | 'basic' | 'pro' | 'max'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS super boolean NOT NULL DEFAULT false;

-- Moments table (user generations)
CREATE TABLE moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  title text, -- AI-generated evocative title for the moment
  mixins jsonb, -- baseline mixins for this moment
  final text,
  seed bigint,
  status text DEFAULT 'pending', -- pending, processing, completed, failed
  created timestamptz DEFAULT now()
);

-- Assets table (personal library + official store)
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = official Kanojo Studio asset
  name text NOT NULL,
  title text,
  description text,
  type text NOT NULL, -- face, reference, outfit, scene, etc.
  path text, -- if image-based asset (relative path in assets bucket)
  content text, -- if text-based asset
  price integer, -- credits cost (NULL = personal asset, not for sale)
  created timestamptz DEFAULT now()
);


-- Photos table (output images from generations)
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment uuid REFERENCES moments(id) ON DELETE CASCADE,
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text, -- only if different from moment's prompt
  mixins jsonb, -- only keys that differ from moment's mixins
  created timestamptz DEFAULT now()
);

-- Posts table (community posts)
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  moment uuid REFERENCES moments(id) ON DELETE CASCADE,
  created timestamptz DEFAULT now(),
  UNIQUE(moment) -- Each moment can only be posted once
);

-- Likes table (many-to-many)
CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post uuid REFERENCES posts(id) ON DELETE CASCADE,
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created timestamptz DEFAULT now(),
  UNIQUE(post, "user") -- User can only like a post once
);

-- Purchases table (asset purchases from store)
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer uuid REFERENCES profiles(id) ON DELETE CASCADE,
  asset uuid REFERENCES assets(id) ON DELETE CASCADE,
  price integer NOT NULL, -- credits spent at time of purchase
  created timestamptz DEFAULT now(),
  UNIQUE(buyer, asset) -- Can't buy same asset twice
);

-- Transactions table (credit history)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'asset_purchase', 'generation_cost', 'credit_purchase', 'refund'
  amount integer NOT NULL, -- negative = debit, positive = credit
  ref uuid, -- purchase_id, moment_id, etc. (nullable)
  stripe_session_id text,
  description text,
  created timestamptz DEFAULT now()
);

-- Subscriptions table (active subscription per user)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  subscription text UNIQUE NOT NULL,
  customer text NOT NULL,
  tier text NOT NULL, -- 'basic' | 'pro' | 'max'
  status text NOT NULL, -- 'active' | 'past_due' | 'canceled'
  "end" timestamptz NOT NULL,
  created timestamptz DEFAULT now(),
  updated timestamptz DEFAULT now()
);


-- =============================================
-- Indexes
-- =============================================

CREATE INDEX idx_moments_user ON moments("user");
CREATE INDEX idx_moments_created ON moments(created DESC);
CREATE INDEX idx_moments_status ON moments(status);
CREATE INDEX IF NOT EXISTS idx_moments_mixins ON moments USING GIN (mixins);

CREATE INDEX idx_assets_user ON assets("user");
CREATE INDEX idx_assets_type ON assets(type);

CREATE INDEX idx_photos_moment ON photos(moment);
CREATE INDEX IF NOT EXISTS idx_photos_mixins ON photos USING GIN (mixins);

CREATE INDEX idx_posts_user ON posts("user");
CREATE INDEX idx_posts_created ON posts(created DESC);

CREATE INDEX idx_likes_post ON likes(post);
CREATE INDEX idx_likes_user ON likes("user");

CREATE INDEX idx_purchases_buyer ON purchases(buyer);
CREATE INDEX idx_purchases_asset ON purchases(asset);

CREATE INDEX idx_transactions_user ON transactions("user");
CREATE INDEX idx_transactions_created ON transactions(created DESC);
CREATE UNIQUE INDEX idx_transactions_stripe_session_id
  ON transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- =============================================
-- Helper Functions (must exist before RLS policies that reference them)
-- =============================================

-- Check if current user is a superuser
CREATE OR REPLACE FUNCTION is_super() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(super, false) FROM public.profiles WHERE id = auth.uid()
$$;

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Prevent authenticated users from directly writing server-managed columns
REVOKE UPDATE (customer, tier) ON profiles FROM authenticated;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Can view profiles of post authors"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts."user" = profiles.id
    )
  );

-- Moments
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

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

-- Assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

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

-- Photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

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
      SELECT 1 FROM posts
      WHERE posts.moment = photos.moment
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

-- Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = "user");

-- Likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = "user");

-- Purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = buyer);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = "user");

-- Subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = "user");

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url',
    10 -- Default credits for new users
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile();

-- Function to deduct credits on generation (fires on photo insert, covers both create and retry)
CREATE OR REPLACE FUNCTION deduct_generation_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  generation_cost integer := 1; -- TODO: Read from config
  v_user_id uuid;
  v_prompt text;
BEGIN
  -- Get user and prompt from parent moment
  SELECT m."user", m.prompt INTO v_user_id, v_prompt
  FROM public.moments m WHERE m.id = NEW.moment;

  -- Deduct credits from user profile
  UPDATE public.profiles
  SET credits = credits - generation_cost
  WHERE id = v_user_id;

  -- Log transaction
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

-- Trigger to deduct credits when a photo is created (covers both new moments and retries)
DROP TRIGGER IF EXISTS on_moment_created ON moments;
DROP TRIGGER IF EXISTS on_photo_created ON photos;
CREATE TRIGGER on_photo_created
  AFTER INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION deduct_generation_credits();

-- Function to handle asset purchases
CREATE OR REPLACE FUNCTION process_asset_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Deduct credits from buyer
  UPDATE public.profiles
  SET credits = credits - NEW.price
  WHERE id = NEW.buyer;

  -- Log transaction
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

-- Trigger to process asset purchases
DROP TRIGGER IF EXISTS on_asset_purchased ON purchases;
CREATE TRIGGER on_asset_purchased
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION process_asset_purchase();

-- Function to get user's accessible assets (own + purchased) with purchased flag
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

-- Function to get all public store assets with purchase status for a user
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

-- Function to get community posts with like counts and user like status
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

-- Function to purchase an asset atomically
-- Validates credits, inserts purchase (triggers credit deduction via existing trigger)
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
  -- Get the asset
  SELECT * INTO v_asset FROM public.assets WHERE id = asset_uuid;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Asset not found');
  END IF;

  -- Must be a public asset with a price
  IF v_asset."user" IS NOT NULL OR v_asset.price IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Asset is not for sale');
  END IF;

  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM public.purchases WHERE buyer = v_user_id AND asset = asset_uuid) THEN
    RETURN json_build_object('success', false, 'error', 'Already purchased');
  END IF;

  -- Check credits
  SELECT credits INTO v_credits FROM public.profiles WHERE id = v_user_id;
  IF v_credits < v_asset.price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Insert purchase (existing trigger handles credit deduction + transaction logging)
  INSERT INTO public.purchases (buyer, asset, price)
  VALUES (v_user_id, asset_uuid, v_asset.price);

  RETURN json_build_object('success', true, 'remaining_credits', v_credits - v_asset.price);
END;
$$;

-- =============================================
-- Storage Policies
-- =============================================

-- Allow users to upload photos to their own folders
DROP POLICY IF EXISTS "Users can upload own photos" ON storage.objects;
CREATE POLICY "Users can upload own photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own photos
DROP POLICY IF EXISTS "Users can read own photos" ON storage.objects;
CREATE POLICY "Users can read own photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own photos
DROP POLICY IF EXISTS "Users can delete own photos" ON storage.objects;
CREATE POLICY "Users can delete own photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to photos from published posts
DROP POLICY IF EXISTS "Public can read photos from posts" ON storage.objects;
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
-- Uploads Storage Policies
-- =============================================

-- Allow users to upload reference images to their own folder
DROP POLICY IF EXISTS "Users can upload own references" ON storage.objects;
CREATE POLICY "Users can upload own references"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to uploads (needed for reference URL passed to engine)
DROP POLICY IF EXISTS "Public can read uploads" ON storage.objects;
CREATE POLICY "Public can read uploads"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'uploads'
);

-- Allow users to delete their own uploads
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to safely add credits to a user's profile (used by Stripe webhook)
CREATE OR REPLACE FUNCTION add_credits(user_uuid uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = credits + amount
  WHERE id = user_uuid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_uuid: %', user_uuid;
  END IF;
END;
$$;

-- Function to reset credits at the start of a new billing period
CREATE OR REPLACE FUNCTION reset_subscription_credits(user_uuid uuid, tier text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  credit_amount integer;
BEGIN
  -- Map tier to credit amount
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
