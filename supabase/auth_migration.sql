-- ============================================================
-- MathSolve — Auth Migration
-- Run this in your Supabase SQL Editor to switch to custom auth
-- ============================================================

-- Step 1: Add custom auth columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salt text;

-- Step 2: Drop old Supabase-auth-based RLS policies
DROP POLICY IF EXISTS "Own profile update" ON profiles;
DROP POLICY IF EXISTS "Create own profile" ON profiles;
DROP POLICY IF EXISTS "Own submissions" ON submissions;
DROP POLICY IF EXISTS "Own vault" ON vault;

-- Step 3: Create open policies (custom auth handles identity via user_id)
CREATE POLICY "Allow profile insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow profile update" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Allow all submissions" ON submissions FOR ALL USING (true);
CREATE POLICY "Allow all vault" ON vault FOR ALL USING (true);
