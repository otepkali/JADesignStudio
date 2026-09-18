import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Bypasses RLS — only for server-side routes with no user session (Telegram
// webhook, cron), never exposed to the browser.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
