# Gym Tracker App

## Database setup

Apply SQL migrations for optional features:

| Topic | Migration |
|-------|-----------|
| Workout cardio minutes | [`supabase/migrations/20260520120000_workout_logs_add_cardio_minutes.sql`](supabase/migrations/20260520120000_workout_logs_add_cardio_minutes.sql) |
| Calories **custom foods** | [`supabase/migrations/20260520130100_custom_foods.sql`](supabase/migrations/20260520130100_custom_foods.sql) — details in [`docs/DATABASE_CUSTOM_FOODS.md`](docs/DATABASE_CUSTOM_FOODS.md) |

In **Supabase → SQL Editor**, paste and run each file’s contents once per project.

## Local dev

```bash
npm install
npm run dev
```
