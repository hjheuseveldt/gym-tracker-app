# Progress photos

The Progress tab reads bodyweight from `workout_logs.bodyweight` (primary key `log_date`). It does not add a second weight entry.

Photos are one per calendar day. The file is uploaded from the in-app camera to a **private** Storage bucket. The browser only displays a short-lived signed URL. Metadata lives in `public.progress_photos`.

## Apply

In **Supabase → SQL Editor**, paste and run once:

[`supabase/migrations/20261027120000_progress_photos.sql`](../supabase/migrations/20261027120000_progress_photos.sql)

That file:

1. Creates `public.progress_photos` (`photo_date`, `storage_path`, `created_at`) with RLS policies for `anon` and `authenticated`, matching the rest of this single-user app.
2. Creates the private bucket `progress-photos` (`public = false`, jpeg only, 8 MB).
3. Adds storage policies so the app can upload, replace, and sign URLs. Object listing stays closed. There is no public object URL.

Do not run anything against the `finance` schema.

Confirm in **Storage** that `progress-photos` exists and **Public bucket** is off.
