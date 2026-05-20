# `custom_foods`

If you see **“Could not find the table `public.custom_foods` in the schema cache”**, run the migration below once in **Supabase Dashboard → SQL Editor**.

Full migration (matches repo): [`supabase/migrations/20260520130100_custom_foods.sql`](../supabase/migrations/20260520130100_custom_foods.sql).

```sql
CREATE TABLE IF NOT EXISTS public.custom_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id text NOT NULL UNIQUE,
  food_name text NOT NULL,
  calories numeric NOT NULL CHECK (calories > 0),
  protein numeric NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs numeric NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat numeric NOT NULL DEFAULT 0 CHECK (fat >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_foods_food_name_lower ON public.custom_foods (lower(food_name));

COMMENT ON TABLE public.custom_foods IS 'Macros per one serving; app uses serving_description=serving only for logs.';

ALTER TABLE public.custom_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "custom_foods_select_public" ON public.custom_foods;
DROP POLICY IF EXISTS "custom_foods_insert_public" ON public.custom_foods;
DROP POLICY IF EXISTS "custom_foods_update_public" ON public.custom_foods;
DROP POLICY IF EXISTS "custom_foods_delete_public" ON public.custom_foods;

CREATE POLICY "custom_foods_select_public" ON public.custom_foods FOR SELECT USING (true);
CREATE POLICY "custom_foods_insert_public" ON public.custom_foods FOR INSERT WITH CHECK (true);
CREATE POLICY "custom_foods_update_public" ON public.custom_foods FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "custom_foods_delete_public" ON public.custom_foods FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custom_foods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.custom_foods TO authenticated;
```

After running it, wait a few seconds and refresh the app so PostgREST reloads its schema cache.

The app assigns `food_id` as `custom:` + UUID so it cannot collide with FatSecret numeric IDs.
