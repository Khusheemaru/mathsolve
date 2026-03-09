-- Run this in the Supabase SQL Editor to fix the miscategorized HF MATH problems
-- The seeder script used underscored type names but the actual data uses spaces,
-- so everything fell through to the default 'ALGEBRA' fallback.

UPDATE problems SET category = 'PROBABILITY'   WHERE source ILIKE '%Counting & Probability%';
UPDATE problems SET category = 'NUMBER THEORY'  WHERE source ILIKE '%Number Theory%';
UPDATE problems SET category = 'GEOMETRY'       WHERE source ILIKE '%Geometry%';
UPDATE problems SET category = 'ARITHMETIC'     WHERE source ILIKE '%Prealgebra%';
UPDATE problems SET category = 'CALCULUS'       WHERE source ILIKE '%Precalculus%';
-- 'Algebra' and 'Intermediate Algebra' are already correct as ALGEBRA.

-- Verify counts
SELECT category, COUNT(*) FROM problems GROUP BY category ORDER BY category;
