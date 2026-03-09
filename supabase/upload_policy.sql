-- Run this in the Supabase SQL Editor to allow the bulk upload script to insert the 12,500 problems
CREATE POLICY "Allow anonymous inserts" ON problems FOR INSERT WITH CHECK (true);
