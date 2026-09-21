-- 1% habit: stamp focus on completions + period history for calendar labels.
-- Run once in Supabase → SQL Editor (or supabase db push after linking).
-- Changing focus updates habits.name in place; this table keeps past labels.

ALTER TABLE public.habit_completions
  ADD COLUMN IF NOT EXISTS focus_label text;

COMMENT ON COLUMN public.habit_completions.focus_label IS
  'Focus text active when this completion was recorded (1% habit). NULL for other habits.';

CREATE TABLE IF NOT EXISTS public.habit_focus_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id bigint NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  focus text NOT NULL,
  started_on date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, started_on)
);

CREATE INDEX IF NOT EXISTS habit_focus_history_habit_started
  ON public.habit_focus_history (habit_id, started_on DESC);

COMMENT ON TABLE public.habit_focus_history IS
  '1% habit focus periods. Latest started_on <= calendar date is the label for that day.';

ALTER TABLE public.habit_focus_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habit_focus_history_select_public" ON public.habit_focus_history;
DROP POLICY IF EXISTS "habit_focus_history_insert_public" ON public.habit_focus_history;
DROP POLICY IF EXISTS "habit_focus_history_update_public" ON public.habit_focus_history;
DROP POLICY IF EXISTS "habit_focus_history_delete_public" ON public.habit_focus_history;

CREATE POLICY "habit_focus_history_select_public" ON public.habit_focus_history FOR SELECT USING (true);
CREATE POLICY "habit_focus_history_insert_public" ON public.habit_focus_history FOR INSERT WITH CHECK (true);
CREATE POLICY "habit_focus_history_update_public" ON public.habit_focus_history FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "habit_focus_history_delete_public" ON public.habit_focus_history FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habit_focus_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.habit_focus_history TO authenticated;
