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

-- Moments table (user generations)
CREATE TABLE moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
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
  description text,
  type text NOT NULL, -- face, reference, attire, scene, etc.
  url text, -- if image-based asset
  content text, -- if text-based asset
  is_public boolean DEFAULT false, -- true = visible in store
  price integer, -- credits cost (NULL = personal asset, not for sale)
  created_at timestamptz DEFAULT now()
);

-- Mixins table (inputs used in a specific generation)
CREATE TABLE mixins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
  asset_id uuid REFERENCES assets(id) ON DELETE SET NULL, -- nullable: references asset if from library
  type text NOT NULL, -- face, reference, attire, scene, etc.
  url text, -- if ad-hoc upload (not from assets)
  content text, -- if text input or prompt fragment
  created_at timestamptz DEFAULT now()
);

-- Photos table (output images from generations)
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id uuid REFERENCES moments(id) ON DELETE CASCADE,
  url text NOT NULL,
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
  description text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- Indexes
-- =============================================

CREATE INDEX idx_moments_user_id ON moments(user_id);
CREATE INDEX idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX idx_moments_status ON moments(status);

CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_is_public ON assets(is_public) WHERE is_public = true;

CREATE INDEX idx_mixins_moment_id ON mixins(moment_id);
CREATE INDEX idx_mixins_asset_id ON mixins(asset_id);

CREATE INDEX idx_photos_moment_id ON photos(moment_id);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

CREATE INDEX idx_purchases_buyer_id ON purchases(buyer_id);
CREATE INDEX idx_purchases_asset_id ON purchases(asset_id);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

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

-- Mixins
ALTER TABLE mixins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view mixins of own moments"
  ON mixins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = mixins.moment_id
      AND moments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert mixins to own moments"
  ON mixins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM moments
      WHERE moments.id = mixins.moment_id
      AND moments.user_id = auth.uid()
    )
  );

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
