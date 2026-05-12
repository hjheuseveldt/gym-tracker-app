import { createClient } from "@supabase/supabase-js";

function clean(s) {
  if (typeof s !== "string") return "";
  return s.trim().replace(/^["']|["']$/g, "");
}

const url = clean(import.meta.env.VITE_SUPABASE_URL);
const key = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

const looksLikeUrl = /^https?:\/\//i.test(url);

export const supabase =
  url && key && looksLikeUrl ? createClient(url, key, { auth: { persistSession: false } }) : null;

export function supaReady() {
  return !!supabase;
}
