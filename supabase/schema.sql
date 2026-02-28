-- =============================================
-- Kanojo Studio Database Schema
-- =============================================

-- Profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text,
  avatar text,
  credits integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Add subscription tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free';
-- Values: 'free' | 'basic' | 'creator' | 'pro'

-- Moments table (user generations)
CREATE TABLE moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  title text, -- AI-generated evocative title for the moment
  mixins jsonb, -- baseline mixins for this moment
  final_prompt text,
  seed bigint,
  status text DEFAULT 'pending', -- pending, processing, completed, failed
  created_at timestamptz DEFAULT now()
);

-- Assets table (personal library + official store)
CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE, -- NULL = official Kanojo Studio asset
  name text NOT NULL,
  title text,
  description text,
  type text NOT NULL, -- face, reference, outfit, scene, etc.
  path text, -- if image-based asset (relative path in assets bucket)
  content text, -- if text-based asset
  is_public boolean DEFAULT false, -- true = visible in store
  price integer, -- credits cost (NULL = personal asset, not for sale)
  created_at timestamptz DEFAULT now()
);


-- Photos table (output images from generations)
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
  prompt text, -- only if different from moment's prompt
  mixins jsonb, -- only keys that differ from moment's mixins
  created_at timestamptz DEFAULT now()
);

-- Posts table (community posts)
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(moment_id) -- Each moment can only be posted once
);

-- Likes table (many-to-many)
CREATE TABLE likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id) -- User can only like a post once
);

-- Purchases table (asset purchases from store)
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE,
  price integer NOT NULL, -- credits spent at time of purchase
  created_at timestamptz DEFAULT now(),
  UNIQUE(buyer_id, asset_id) -- Can't buy same asset twice
);

-- Transactions table (credit history)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'asset_purchase', 'generation_cost', 'credit_purchase', 'refund'
  amount integer NOT NULL, -- negative = debit, positive = credit
  related_id uuid, -- purchase_id, moment_id, etc. (nullable)
  stripe_session_id text,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Subscriptions table (active subscription per user)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  tier text NOT NULL, -- 'basic' | 'creator' | 'pro'
  status text NOT NULL, -- 'active' | 'past_due' | 'canceled'
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX idx_moments_user_id ON moments(user_id);
CREATE INDEX idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX idx_moments_status ON moments(status);
CREATE INDEX IF NOT EXISTS idx_moments_mixins ON moments USING GIN (mixins);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_is_public ON assets(is_public) WHERE is_public = true;

CREATE INDEX idx_photos_moment_id ON photos(moment_id);
CREATE INDEX IF NOT EXISTS idx_photos_mixins ON photos USING GIN (mixins);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_asset_id ON purchases(asset_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE UNIQUE INDEX idx_transactions_stripe_session_id
  ON transactions(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

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

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Can view profiles of post authors"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.user_id = profiles.id
    )
  );

-- Moments
ALTER TABLE moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moments"
  ON moments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own moments"
  ON moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own moments"
  ON moments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own moments"
  ON moments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Can view moments of public posts"
  ON moments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts WHERE posts.moment_id = moments.id
    )
  );

-- Assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public store assets"
  ON assets FOR SELECT
  USING (is_public = true AND user_id IS NULL);

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (auth.uid() = user_id);

-- Photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view photos of own moments"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment_id
      AND moments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view photos of public posts"
  ON photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.moment_id = photos.moment_id
    )
  );

CREATE POLICY "Users can insert photos to own moments"
  ON photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment_id
      AND moments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete photos of own moments"
  ON photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = photos.moment_id
      AND moments.user_id = auth.uid()
    )
  );

-- Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- Purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases"
  ON purchases FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert own purchases"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

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

-- Function to deduct credits on generation
CREATE OR REPLACE FUNCTION deduct_generation_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  generation_cost integer := 1; -- TODO: Read from config
BEGIN
  -- Deduct credits from user profile
  UPDATE public.profiles
  SET credits = credits - generation_cost
  WHERE id = NEW.user_id;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount, related_id, description)
  VALUES (
    NEW.user_id,
    'generation_cost',
    -generation_cost,
    NEW.id,
    'Generation: ' || COALESCE(SUBSTRING(NEW.prompt, 1, 50), 'No prompt')
  );

  RETURN NEW;
END;
$$;

-- Trigger to deduct credits when moment is created
DROP TRIGGER IF EXISTS on_moment_created ON moments;
CREATE TRIGGER on_moment_created
  AFTER INSERT ON moments
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
  WHERE id = NEW.buyer_id;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount, related_id, description)
  VALUES (
    NEW.buyer_id,
    'asset_purchase',
    -NEW.price,
    NEW.id,
    'Purchased asset: ' || (
      SELECT name FROM public.assets WHERE id = NEW.asset_id
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

-- Function to get user's accessible assets (own + purchased)
CREATE OR REPLACE FUNCTION get_user_assets(user_uuid uuid)
RETURNS SETOF assets
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT a.*
  FROM public.assets a
  LEFT JOIN public.purchases p ON p.asset_id = a.id AND p.buyer_id = user_uuid
  WHERE a.user_id = user_uuid
     OR p.id IS NOT NULL
     OR (a.is_public = true AND a.price IS NULL)  -- official free assets
  ORDER BY a.created_at DESC;
$$;

-- Function to get all public store assets with purchase status for a user
CREATE OR REPLACE FUNCTION get_store_assets(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  name text,
  title text,
  description text,
  type text,
  path text,
  content text,
  is_public boolean,
  price integer,
  created_at timestamptz,
  is_purchased boolean
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    a.id, a.user_id, a.name, a.title, a.description,
    a.type, a.path, a.content, a.is_public, a.price, a.created_at,
    EXISTS (
      SELECT 1 FROM public.purchases p
      WHERE p.asset_id = a.id AND p.buyer_id = user_uuid
    ) AS is_purchased
  FROM public.assets a
  WHERE a.price IS NOT NULL
  ORDER BY a.type, a.created_at DESC;
$$;

-- Function to get community posts with like counts and user like status
CREATE OR REPLACE FUNCTION get_posts(user_uuid uuid, page_limit int DEFAULT 20, page_offset int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  moment_id uuid,
  created_at timestamptz,
  moment jsonb,
  author jsonb,
  likes_count bigint,
  liked boolean
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    p.id,
    p.user_id,
    p.moment_id,
    p.created_at,
    jsonb_build_object(
      'id', m.id,
      'user_id', m.user_id,
      'prompt', m.prompt,
      'title', m.title,
      'mixins', m.mixins,
      'status', m.status,
      'created_at', m.created_at,
      'photos', COALESCE(
        (SELECT jsonb_agg(
          jsonb_build_object(
            'id', ph.id,
            'moment_id', ph.moment_id,
            'prompt', ph.prompt,
            'mixins', ph.mixins,
            'created_at', ph.created_at
          ) ORDER BY ph.created_at DESC
        ) FROM public.photos ph WHERE ph.moment_id = m.id),
        '[]'::jsonb
      )
    ) AS moment,
    jsonb_build_object(
      'id', pr.id,
      'name', pr.name,
      'avatar', pr.avatar
    ) AS author,
    (SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id) AS likes_count,
    EXISTS (
      SELECT 1 FROM public.likes l WHERE l.post_id = p.id AND l.user_id = user_uuid
    ) AS liked
  FROM public.posts p
  JOIN public.moments m ON m.id = p.moment_id
  JOIN public.profiles pr ON pr.id = p.user_id
  ORDER BY p.created_at DESC
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
  IF v_asset.is_public IS NOT TRUE OR v_asset.price IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Asset is not for sale');
  END IF;

  -- Check if already purchased
  IF EXISTS (SELECT 1 FROM public.purchases WHERE buyer_id = v_user_id AND asset_id = asset_uuid) THEN
    RETURN json_build_object('success', false, 'error', 'Already purchased');
  END IF;

  -- Check credits
  SELECT credits INTO v_credits FROM public.profiles WHERE id = v_user_id;
  IF v_credits < v_asset.price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Insert purchase (existing trigger handles credit deduction + transaction logging)
  INSERT INTO public.purchases (buyer_id, asset_id, price)
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
    JOIN moments m ON m.id = p.moment_id
    JOIN posts ON posts.moment_id = p.moment_id
    WHERE name = m.user_id || '/' || m.id || '/' || p.id || '.jpg'
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
    WHEN 'basic'   THEN 100
    WHEN 'creator' THEN 300
    WHEN 'pro'     THEN 800
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

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (
    user_uuid,
    'credit_purchase',
    credit_amount,
    'Monthly subscription reset: ' || tier || ' plan (' || credit_amount || ' credits)'
  );
END;
$$;
