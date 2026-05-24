-- Run this once in Supabase Dashboard → SQL Editor
-- https://supabase.com/dashboard/project/hoqbttccxzugjjymuldy/sql

CREATE TABLE IF NOT EXISTS public.leaderboard (
  name TEXT PRIMARY KEY,
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0),
  played_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON public.leaderboard (score DESC);

ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard"
  ON public.leaderboard
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert scores"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update scores"
  ON public.leaderboard
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
