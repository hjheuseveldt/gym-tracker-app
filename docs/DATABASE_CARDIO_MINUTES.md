# `workout_logs.cardio_minutes`

If you prefer to run SQL manually instead of applying the migration file:

```sql
ALTER TABLE workout_logs
  ADD COLUMN IF NOT EXISTS cardio_minutes integer NULL;
```

Migration file (same DDL): `supabase/migrations/20260520120000_workout_logs_add_cardio_minutes.sql`.

The client treats missing/`NULL` as **0** when summing cardio; saved logs use **`0`** when the user confirms no cardio.
