-- Progress photos: one private image per calendar day.
-- Bodyweight stays on workout_logs.bodyweight. This file does not touch the finance schema.
-- Run once in Supabase → SQL Editor (or supabase db push after linking).

CREATE TABLE IF NOT EXISTS public.progress_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_date date NOT NULL UNIQUE,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT progress_photos_path_chk CHECK (
    storage_path ~ '^days/[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]+\.jpg$'
    AND storage_path LIKE 'days/' || to_char(photo_date, 'YYYY-MM-DD') || '-%'
  )
);

COMMENT ON TABLE public.progress_photos IS
  'One progress photo per calendar day. Bytes live in the private progress-photos bucket.';
COMMENT ON COLUMN public.progress_photos.photo_date IS
  'Calendar date the photo belongs to.';
COMMENT ON COLUMN public.progress_photos.storage_path IS
  'Object path inside the private progress-photos bucket.';
COMMENT ON COLUMN public.progress_photos.created_at IS
  'When this day''s photo row was first saved.';

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "progress_photos_select_public" ON public.progress_photos;
DROP POLICY IF EXISTS "progress_photos_insert_public" ON public.progress_photos;
DROP POLICY IF EXISTS "progress_photos_update_public" ON public.progress_photos;
DROP POLICY IF EXISTS "progress_photos_delete_public" ON public.progress_photos;

CREATE POLICY "progress_photos_select_public" ON public.progress_photos FOR SELECT USING (true);
CREATE POLICY "progress_photos_insert_public" ON public.progress_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "progress_photos_update_public" ON public.progress_photos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "progress_photos_delete_public" ON public.progress_photos FOR DELETE USING (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.progress_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.progress_photos TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, type)
VALUES (
  'progress-photos',
  'progress-photos',
  false,
  8388608,
  ARRAY['image/jpeg']::text[],
  'STANDARD'
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Private bucket. SELECT allows signing and overwrite checks, not listing.
DROP POLICY IF EXISTS "progress_photos_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_storage_update" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_storage_delete" ON storage.objects;

CREATE POLICY "progress_photos_storage_select"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = 'days'
  AND storage.extension(name) = 'jpg'
  AND storage.allow_any_operation(ARRAY[
    'storage.object.sign',
    'storage.object.sign_many',
    'storage.object.get_signed',
    'storage.render.image_sign',
    'storage.object.upload',
    'storage.object.upload_update',
    'storage.object.info_authenticated',
    'object.get_authenticated_info'
  ])
);

CREATE POLICY "progress_photos_storage_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = 'days'
  AND storage.extension(name) = 'jpg'
);

CREATE POLICY "progress_photos_storage_update"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = 'days'
  AND storage.extension(name) = 'jpg'
)
WITH CHECK (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = 'days'
  AND storage.extension(name) = 'jpg'
);

CREATE POLICY "progress_photos_storage_delete"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (
  bucket_id = 'progress-photos'
  AND (storage.foldername(name))[1] = 'days'
  AND storage.extension(name) = 'jpg'
);
