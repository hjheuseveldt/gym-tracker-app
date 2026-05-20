-- Add optional cardio tracking (whole minutes per workout day).
-- Run in Supabase SQL Editor or via Supabase CLI: `supabase db push`
-- Existing rows remain valid; cardio_minutes is NULL until populated by the app.

ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS cardio_minutes integer NULL;

COMMENT ON COLUMN workout_logs.cardio_minutes IS 'Whole minutes of cardio on this log_date; 0 = none; NULL = legacy/not set';
