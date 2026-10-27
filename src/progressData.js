import { supabase, supaReady } from "./supabase.js";
import { isDateKey, storagePathForDate } from "./progressModel.js";

export var PROGRESS_BUCKET = "progress-photos";
export var SIGNED_URL_SECONDS = 120;

function fail(error, fallback) {
  var message = error && error.message ? error.message : fallback;
  throw new Error(message || fallback);
}

export async function loadProgressPhotos() {
  if (!supaReady()) return [];
  var res = await supabase
    .from("progress_photos")
    .select("id,photo_date,storage_path,created_at")
    .order("photo_date", { ascending: true });
  if (res.error) fail(res.error, "Could not load progress photos.");
  return res.data || [];
}

export async function signProgressPhoto(path) {
  if (!supaReady()) throw new Error("Supabase isn't configured.");
  if (!path || path.indexOf("..") !== -1) throw new Error("Invalid photo path.");
  var res = await supabase.storage.from(PROGRESS_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (res.error || !res.data || !res.data.signedUrl) fail(res.error, "Could not open the photo.");
  return res.data.signedUrl;
}

/**
 * Upload a jpeg blob straight to the private bucket, then store date + path.
 * A previous object for that day is removed after the new row is saved.
 * Nothing is written to the device camera roll.
 */
export async function saveProgressPhoto(date, blob, previousPath) {
  if (!supaReady()) throw new Error("Supabase isn't configured.");
  if (!isDateKey(date)) throw new Error("Invalid photo date.");
  if (!blob) throw new Error("Missing photo.");
  var path = storagePathForDate(date, Date.now());
  var upload = await supabase.storage.from(PROGRESS_BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    cacheControl: "0",
    upsert: false,
  });
  if (upload.error) fail(upload.error, "Could not save the photo.");
  var res = await supabase
    .from("progress_photos")
    .upsert({ photo_date: date, storage_path: path }, { onConflict: "photo_date" })
    .select("id,photo_date,storage_path,created_at")
    .single();
  if (res.error) {
    await supabase.storage.from(PROGRESS_BUCKET).remove([path]);
    fail(res.error, "Could not save the photo.");
  }
  if (previousPath && previousPath !== path) {
    var removed = await supabase.storage.from(PROGRESS_BUCKET).remove([previousPath]);
    if (removed.error) console.error("[progress] old photo remove failed:", removed.error.message || removed.error);
  }
  return res.data;
}
