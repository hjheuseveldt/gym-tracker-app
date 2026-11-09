-- Raise the private progress-photos bucket upload limit from 8 MiB (8388608)
-- to 15 MiB (15728640). Higher-resolution progress JPEGs (long edge 3840px,
-- quality 0.92) can exceed 8 MiB.
-- Existing objects are left as they are. This file has not been applied to the
-- remote database; run it in the Supabase SQL editor (or supabase db push).
-- Re-running the original bucket migration resets this limit back to 8 MiB.

UPDATE storage.buckets
SET file_size_limit = 15728640
WHERE id = 'progress-photos'
  AND (file_size_limit IS NULL OR file_size_limit < 15728640);
