# Progress photos

The Progress tab reads bodyweight from `workout_logs.bodyweight` (primary key `log_date`). It does not add a second weight entry.

Photos are one per calendar day. The file is uploaded from the in-app camera to a **private** Storage bucket. The browser only displays a short-lived signed URL. Metadata lives in `public.progress_photos`.

## Apply

In **Supabase → SQL Editor**, paste and run, in order:

1. [`supabase/migrations/20261027120000_progress_photos.sql`](../supabase/migrations/20261027120000_progress_photos.sql) once, on a new project. That file:
   - Creates `public.progress_photos` (`photo_date`, `storage_path`, `created_at`) with RLS policies for `anon` and `authenticated`, matching the rest of this single-user app.
   - Creates the private bucket `progress-photos` (`public = false`, jpeg only, **8 MB** / `8388608` bytes).
   - Adds storage policies so the app can upload, replace, and sign URLs. Object listing stays closed. There is no public object URL.
2. [`supabase/migrations/20261109194104_raise_progress_photos_bucket_limit.sql`](../supabase/migrations/20261109194104_raise_progress_photos_bucket_limit.sql). This raises only `storage.buckets.file_size_limit` for `progress-photos` from 8 MB to **15 MB** (`15728640` bytes), so a new JPEG with a 3840px long edge at quality 0.92 can upload. It does not read, rewrite, or delete existing objects or rows. **This migration is in the repo and has not been applied to the remote database.** Until it is applied, uploads larger than 8 MB are rejected. The bucket limit must also stay within the project's global Storage file size limit (50 MB on the Free plan).

Do not re-run the first file after the limit increase. Its `ON CONFLICT` update sets the bucket limit back to 8 MB.

Do not run anything against the `finance` schema.

Confirm in **Storage** that `progress-photos` exists, **Public bucket** is off, and the file size limit is 15 MB.
