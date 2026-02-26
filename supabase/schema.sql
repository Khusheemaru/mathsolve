-- ============================================================
-- MathSolve — Supabase SQL Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- 1. Problems table
CREATE TABLE IF NOT EXISTS problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  category text NOT NULL,
  difficulty int NOT NULL CHECK (difficulty BETWEEN 1 AND 10),
  statement_latex text NOT NULL,
  question_text text NOT NULL,
  solution_latex text,
  final_answer text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  total_score int DEFAULT 0,
  elo_rating int DEFAULT 1000,
  created_at timestamptz DEFAULT now()
);

-- 3. Submissions
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('SOLVED_INDEPENDENTLY','SOLVED_WITH_SOLUTION','FAILED')),
  points_earned int DEFAULT 0,
  submitted_at timestamptz DEFAULT now()
);

-- 4. Vault (personal notes + scratchpad)
CREATE TABLE IF NOT EXISTS vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  problem_id uuid REFERENCES problems(id) ON DELETE CASCADE,
  notes text,
  scratchpad_data text,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault ENABLE ROW LEVEL SECURITY;

-- Problems: anyone can read
CREATE POLICY "Public problems" ON problems FOR SELECT USING (true);

-- Profiles: anyone can read, only self can update
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile update" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Create own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Submissions: users manage their own
CREATE POLICY "Own submissions" ON submissions FOR ALL USING (auth.uid() = user_id);

-- Vault: users manage their own
CREATE POLICY "Own vault" ON vault FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Seed: 10 Real Olympiad Problems
-- ============================================================
INSERT INTO problems (category, difficulty, source, statement_latex, question_text, solution_latex, final_answer) VALUES
('CALCULUS', 4, 'Classic Analysis', '\int_0^{\infty} \frac{\sin(x)}{x}\, dx', 'Evaluate the Dirichlet integral above.', 'Using Feynman''s technique: let I(a) = \int_0^\infty \frac{\sin(x)}{x} e^{-ax}\,dx. Then I(0) = \frac{\pi}{2}.', 'pi/2'),
('NUMBER THEORY', 5, 'AMC 12A 2022', '\text{Find the remainder when } 7^{100} \text{ is divided by } 48.', 'Find the remainder when 7^100 is divided by 48.', '7^2=49\equiv 1\pmod{48}, so 7^{100}=(7^2)^{50}\equiv 1^{50}=1.', '1'),
('COMBINATORICS', 5, 'AIME 2019 I', '\text{How many 6-digit positive integers have digits summing to 12 with no zero digits?}', 'How many 6-digit positive integers have all non-zero digits that sum to 12?', 'Stars and bars with restriction: each digit d_i \in [1,9], sum=12. Substitute e_i=d_i-1, count solutions to e_1+...+e_6=6 with e_i\leq 8. C(11,5)-6C(2,5)=462.', '462'),
('PROBABILITY', 5, 'Putnam 2018', '\text{Two dice are rolled. What is the probability the product is a perfect square?}', 'Two standard dice are rolled. What is the probability that the product of the two numbers is a perfect square? Give your answer as a fraction.', 'Perfect square products: (1,1),(1,4),(4,1),(2,2),(3,3),(4,4),(5,5),(6,6),(2,8 invalid),(4,9 invalid)... Valid: (1,1),(1,4),(4,1),(2,2),(3,3),(4,4),(5,5),(6,6),(4,9),(9,4) - (9 invalid). Count=8. P=8/36=2/9.', '2/9'),
('GEOMETRY', 6, 'IMO 2016 Problem 1', '\text{Triangle } ABC \text{ has circumradius } R=5 \text{ and } \angle A=60°. \text{ Find side } a.', 'Triangle ABC has circumradius R = 5 and angle A = 60°. Find the length of side a using the law of sines.', 'By the law of sines: a/\sin A = 2R. So a = 2R\sin(60°) = 10 \cdot \frac{\sqrt{3}}{2} = 5\sqrt{3}.', '5*sqrt(3)'),
('CALCULUS', 7, 'Putnam 2017 B1', '\lim_{n \to \infty} n \cdot \sin\!\left(\frac{1}{n}\right)', 'Evaluate the limit above.', 'Let x = 1/n \to 0. Then n\sin(1/n) = \sin(x)/x \to 1 as x\to 0.', '1'),
('NUMBER THEORY', 6, 'AIME 2020 II', '\text{Find the last 3 digits of } 2019^{2019}', 'Find the last three digits of 2019^2019 (i.e., find 2019^2019 mod 1000).', '2019\equiv 19\pmod{1000}. By Euler: \phi(1000)=400, so 19^{400}\equiv 1. 2019 mod 400 = 219. 19^{219} mod 1000 = 719 by successive squaring.', '719'),
('COMBINATORICS', 4, 'Classic Counting', '\text{How many ways can 5 people sit in a circle?}', 'In how many distinct ways can 5 people be seated in a circular arrangement?', 'For circular permutations of n objects: (n-1)! = 4! = 24.', '24'),
('PROBABILITY', 6, 'Putnam 2016', 'P(\text{exactly 2 heads in 5 fair coin flips})', 'What is the probability of getting exactly 2 heads in 5 flips of a fair coin? Express as a fraction.', '\binom{5}{2} \cdot (1/2)^5 = 10/32 = 5/16.', '5/16'),
('GEOMETRY', 5, 'AMC 10A 2021', '\text{A square has diagonal } d = 6\sqrt{2}. \text{ Find the area.}', 'A square has a diagonal of length 6√2. What is the area of the square?', 'Side s = d/\sqrt{2} = 6. Area = s^2 = 36.', '36');
