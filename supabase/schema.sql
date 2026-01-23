-- Profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  name text,
  avatar text,
  created_at timestamptz DEFAULT now()
);

-- Generations table
CREATE TABLE generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" uuid REFERENCES profiles(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  url text,
  status text DEFAULT 'completed',
  error text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_generations_user ON generations("user");
CREATE INDEX idx_generations_created ON generations(created_at DESC);

-- RLS Policies for profiles
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

-- RLS Policies for generations
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = "user");

CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = "user");

CREATE POLICY "Users can delete own generations"
  ON generations FOR DELETE
  USING (auth.uid() = "user");

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION create_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile();
