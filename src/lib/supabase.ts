import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = Boolean(url && key);
export const supabase = createClient(
  url || "https://example.supabase.co",
  key || "missing-publishable-key",
  { auth: { persistSession: true, detectSessionInUrl: true } },
);
