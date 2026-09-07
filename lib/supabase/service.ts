import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely, so
 * it must NEVER be imported into client-side code and the key must never
 * be exposed via a NEXT_PUBLIC_ variable.
 *
 * Only used by the Telegram webhook (app/api/telegram/webhook/route.ts),
 * which has no logged-in user/session to read apps with the normal
 * (RLS-restricted) server client.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
