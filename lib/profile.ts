import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns what should be shown for a user instead of their raw email:
 * their chosen display name if they've set one, otherwise the part of
 * their email before the @ as a reasonable fallback.
 */
export async function getDisplayName(
  supabase: SupabaseClient,
  userId: string,
  fallbackEmail: string | null | undefined
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (data?.username) return data.username;
  if (fallbackEmail) return fallbackEmail.split("@")[0];
  return "a teammate";
}

/**
 * Whether this user is allowed to add/remove apps. Defaults to false
 * (deny) if the profile doesn't exist yet or the is_admin column isn't
 * there (e.g. schema.sql hasn't been re-run yet) — fails safe.
 */
export async function isUserAdmin(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle();
    return !!data?.is_admin;
  } catch {
    return false;
  }
}
