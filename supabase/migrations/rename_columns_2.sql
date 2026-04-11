-- =============================================
-- Column rename migration (part 2)
-- stripe_customer_id  → customer    (profiles, subscriptions)
-- stripe_subscription_id → subscription (subscriptions)
-- current_period_end  → "end"       ⚠ reserved word — always quote: "end"
-- =============================================

-- Step 1: Drop policies that reference these columns
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;

-- Step 2: Update REVOKE for renamed column in profiles
REVOKE UPDATE (stripe_customer_id, tier) ON profiles FROM authenticated;

-- Step 3: Rename columns

-- profiles
ALTER TABLE profiles RENAME COLUMN stripe_customer_id TO customer;

-- subscriptions
ALTER TABLE subscriptions RENAME COLUMN stripe_subscription_id TO subscription;
ALTER TABLE subscriptions RENAME COLUMN stripe_customer_id TO customer;
ALTER TABLE subscriptions RENAME COLUMN current_period_end TO "end";

-- Step 4: Restore REVOKE with new column name
REVOKE UPDATE (customer, tier) ON profiles FROM authenticated;

-- Step 5: Recreate policies
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = "user");
