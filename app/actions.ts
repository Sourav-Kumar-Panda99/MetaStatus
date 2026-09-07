"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendPushToAll } from "@/lib/push";
import { getDisplayName, isUserAdmin } from "@/lib/profile";
import { createServiceClient } from "@/lib/supabase/service";
import {
  notifyStatusChange,
  notifyAppAdded,
  notifyAppRemoved,
} from "@/lib/telegram";
import type { AppRow, AppStatus } from "@/lib/types";

export async function updateAppStatus(
  id: string,
  status: AppStatus
): Promise<{ data: AppRow | null; error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in to do that." };
  }

  const changedBy = await getDisplayName(supabase, user.id, user.email);

  const { data, error } = await supabase
    .from("apps")
    .update({ status, updated_by: changedBy })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/");

  // Notify Telegram for every status change, and push notifications for
  // problem statuses specifically. Awaited (not fire-and-forget) so the
  // request doesn't get killed by the serverless runtime before either
  // send completes — but wrapped so a notification failure never breaks
  // the status update itself.
  await Promise.allSettled([
    notifyStatusChange(data.name, status, changedBy, data.app_id),
    status !== "Active"
      ? sendPushToAll({
          title: `${status}: ${data.name}`,
          body: `Marked by ${changedBy}`,
          url: "/",
        })
      : Promise.resolve(),
  ]);

  return { data: data as AppRow, error: null };
}

export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}): Promise<{ error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to do that." };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function removePushSubscription(
  endpoint: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function addApp(
  name: string,
  appId?: string
): Promise<{ data: AppRow | null; error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) {
    return { data: null, error: "App name can't be empty." };
  }
  const trimmedAppId = appId?.trim() || null;

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in to do that." };
  }

  if (!(await isUserAdmin(supabase, user.id))) {
    return { data: null, error: "Only admins can add apps." };
  }

  const addedBy = await getDisplayName(supabase, user.id, user.email);

  const { data, error } = await supabase
    .from("apps")
    .insert({
      name: trimmed,
      app_id: trimmedAppId,
      status: "Active",
      updated_by: addedBy,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");

  await notifyAppAdded(data.name, addedBy, data.app_id).catch(() => {});

  return { data: data as AppRow, error: null };
}

export async function removeApp(
  id: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to do that." };
  }

  if (!(await isUserAdmin(supabase, user.id))) {
    return { error: "Only admins can remove apps." };
  }

  const removedBy = await getDisplayName(supabase, user.id, user.email);

  const { data, error } = await supabase
    .from("apps")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin");

  if (data?.name) {
    await notifyAppRemoved(data.name, removedBy).catch(() => {});
  }

  return { error: null };
}

export async function saveUsername(
  username: string
): Promise<{ error: string | null }> {
  const trimmed = username.trim();

  if (!trimmed) {
    return { error: "Please enter a name." };
  }
  if (trimmed.length > 30) {
    return { error: "Name is too long (max 30 characters)." };
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to do that." };
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username: trimmed }, { onConflict: "id" });

  if (error) {
    if (error.code === "23505") {
      return { error: "That name is already taken — try another." };
    }
    return { error: error.message };
  }

  return { error: null };
}

export async function generateTelegramLinkCode(): Promise<{
  code: string | null;
  error: string | null;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { code: null, error: "You must be signed in to do that." };
  }

  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error } = await supabase.from("telegram_link_codes").insert({
    code,
    user_id: user.id,
    expires_at: expiresAt,
  });

  if (error) {
    return { code: null, error: error.message };
  }

  return { code, error: null };
}

export interface TeamMember {
  id: string;
  username: string;
  is_admin: boolean;
}

export async function listTeamMembers(): Promise<{
  data: TeamMember[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in to do that." };
  }

  if (!(await isUserAdmin(supabase, user.id))) {
    return { data: null, error: "Only admins can view this." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, is_admin")
    .order("username", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as TeamMember[], error: null };
}

export async function setUserAdmin(
  userId: string,
  makeAdmin: boolean
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to do that." };
  }

  if (!(await isUserAdmin(supabase, user.id))) {
    return { error: "Only admins can manage other admins." };
  }

  if (userId === user.id && !makeAdmin) {
    return { error: "You can't remove your own admin access." };
  }

  // Uses the service role deliberately: the profiles table has a
  // database-level guard (a trigger) that blocks is_admin from being
  // changed by anything except the service role, specifically to stop a
  // non-admin from granting themselves access directly via the API. The
  // admin check above is what actually authorizes this action.
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ is_admin: makeAdmin })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  return { error: null };
}

export interface FullTeamMember {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export async function listAllTeamMembers(): Promise<{
  data: FullTeamMember[] | null;
  error: string | null;
}> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "You must be signed in to do that." };
  }

  if (!(await isUserAdmin(supabase, user.id))) {
    return { data: null, error: "Only admins can view this." };
  }

  const service = createServiceClient();

  const { data: profiles, error: profilesError } = await service
    .from("profiles")
    .select("id, username, is_admin, created_at")
    .order("username", { ascending: true });

  if (profilesError) {
    return { data: null, error: profilesError.message };
  }

  // Email lives on auth.users, not a normal table — only the admin API
  // (service role) can list it.
  const { data: authData, error: authError } =
    await service.auth.admin.listUsers({ perPage: 1000 });

  if (authError) {
    return { data: null, error: authError.message };
  }

  const emailById = new Map(
    authData.users.map((u) => [u.id, u.email ?? ""])
  );

  const merged: FullTeamMember[] = (profiles ?? []).map((p) => ({
    id: p.id,
    username: p.username,
    is_admin: p.is_admin,
    created_at: p.created_at,
    email: emailById.get(p.id) ?? "",
  }));

  return { data: merged, error: null };
}

export async function removeTeamMember(
  userId: string
): Promise<{ error: string | null }> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to do that." };
  }

  if (!(await isUserAdmin(supabase, user.id))) {
    return { error: "Only admins can remove team members." };
  }

  if (userId === user.id) {
    return { error: "You can't remove your own account from here." };
  }

  // Deletes the Supabase Auth user entirely — their profile, push
  // subscriptions, and Telegram link all cascade-delete automatically
  // (foreign keys are set up with ON DELETE CASCADE).
  const service = createServiceClient();
  const { error } = await service.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/team");
  return { error: null };
}
