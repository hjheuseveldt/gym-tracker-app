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

### PWA / Add to Home Screen

Icons and manifest use the navy–silver chrome palette (`#0B0E14`, silver mark). Specs & regeneration: [`docs/HOME_SCREEN_ICONS.md`](docs/HOME_SCREEN_ICONS.md).

**After a branding deploy, iPhone users should delete the old home screen shortcut and add the site again** (Safari caches home screen icons aggressively).

