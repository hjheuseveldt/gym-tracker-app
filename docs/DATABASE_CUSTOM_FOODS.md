# `custom_foods`

Run in Supabase SQL Editor if you manage schema manually:

```sql
CREATE TABLE IF NOT EXISTS custom_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id text NOT NULL UNIQUE,
  food_name text NOT NULL,
  calories numeric NOT NULL CHECK (calories > 0),
  protein numeric NOT NULL DEFAULT 0 CHECK (protein >= 0),
  carbs numeric NOT NULL DEFAULT 0 CHECK (carbs >= 0),
  fat numeric NOT NULL DEFAULT 0 CHECK (fat >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_foods_food_name_lower ON custom_foods (lower(food_name));
```

Migration file: `supabase/migrations/20260520130100_custom_foods.sql`.

The app assigns `food_id` as `custom:` + UUID so it cannot collide with FatSecret numeric IDs.
