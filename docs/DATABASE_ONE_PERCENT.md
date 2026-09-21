# `habit_focus_history` and `habit_completions.focus_label`

The built-in **1%** habit keeps a stable `habits` row (same id forever). Changing the focus in Settings only updates that row’s name to `1%: {focus}` — it does **not** create a new habit or reset streak.

Historical calendar labels need extra storage. If you see **“Could not find the table `public.habit_focus_history`”** (or writes to `focus_label` fail), run the migration below once in **Supabase Dashboard → SQL Editor**.

Full migration (matches repo): [`supabase/migrations/20260921120000_habit_focus_history.sql`](../supabase/migrations/20260921120000_habit_focus_history.sql).

```sql
ALTER TABLE public.habit_completions
  ADD COLUMN IF NOT EXISTS focus_label text;

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
```

After running it, wait a few seconds and refresh the app so PostgREST reloads its schema cache.

Until this SQL runs, the 1% habit still seeds and completes like other habits; calendar past-day titles fall back to the **current** focus.
