-- App Status: schema, trigger, and RLS policies
-- Run this once in the Supabase SQL Editor (Project -> SQL Editor -> New query)

-- 1. Table -------------------------------------------------------------

create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  app_id text,
  status text not null default 'Active'
    check (status in ('Active', 'SDK Problem', 'Event Problem', 'OTP Problem', 'Payment Gateway Issue')),
  updated_at timestamptz not null default now(),
  updated_by text,
  created_at timestamptz not null default now()
);

comment on table public.apps is 'One row per mobile app tracked on the App Status dashboard.';

-- 2. Auto-update "updated_at" on every change ---------------------------
-- (updated_by is set explicitly by the app when the status changes,
--  since only the app knows who is making the change.)

create or replace function public.set_apps_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_apps_updated_at on public.apps;

create trigger trg_apps_updated_at
before update on public.apps
for each row
execute function public.set_apps_updated_at();

-- 3. Row Level Security ---------------------------------------------------
-- Restricts all read/write access to authenticated (logged-in) users.
-- Sign-up may be open or admin-only depending on how you've configured
-- the app (see README) — either way, only logged-in users can touch data.

alter table public.apps enable row level security;

drop policy if exists "Authenticated users can read apps" on public.apps;
create policy "Authenticated users can read apps"
  on public.apps
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert apps" on public.apps;
create policy "Authenticated users can insert apps"
  on public.apps
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can update apps" on public.apps;
create policy "Authenticated users can update apps"
  on public.apps
  for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete apps" on public.apps;
create policy "Authenticated users can delete apps"
  on public.apps
  for delete
  to authenticated
  using (true);

-- 4. Realtime (optional but nice-to-have) --------------------------------
-- Lets the dashboard reflect changes made in another tab/session instantly.
-- Wrapped so re-running this script is always safe, even if the table
-- was already added to the publication in an earlier run.
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.apps;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- 5. Push notification subscriptions ---------------------------------------
-- One row per browser/device that has enabled push notifications. When an
-- app's status changes to a problem status, the app looks up every row here
-- and sends each one a push notification.

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

comment on table public.push_subscriptions is 'Web Push subscriptions for team members who enabled mobile notifications.';

alter table public.push_subscriptions enable row level security;

-- Every authenticated team member can manage subscriptions. This matches
-- the rest of the app's model (any logged-in teammate is fully trusted),
-- and lets the server send notifications to everyone using the same
-- session-based Supabase client used elsewhere in the app.

drop policy if exists "Authenticated users can read subscriptions" on public.push_subscriptions;
create policy "Authenticated users can read subscriptions"
  on public.push_subscriptions
  for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert their subscription" on public.push_subscriptions;
create policy "Authenticated users can insert their subscription"
  on public.push_subscriptions
  for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated users can delete subscriptions" on public.push_subscriptions;
create policy "Authenticated users can delete subscriptions"
  on public.push_subscriptions
  for delete
  to authenticated
  using (true);

-- 6. Display names (usernames) ---------------------------------------------
-- Each team member can set a display name shown instead of their email
-- everywhere (dashboard "updated by", push notifications, Telegram
-- messages). Login still uses their real email — this is purely cosmetic.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Display name shown instead of email, one row per team member.';

alter table public.profiles enable row level security;

drop policy if exists "Authenticated users can read profiles" on public.profiles;
create policy "Authenticated users can read profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 7. Admin-only app management ---------------------------------------------
-- Only users with profiles.is_admin = true can add or remove apps.
-- Everyone logged in can still VIEW apps and CHANGE their status — this
-- only restricts who can grow/shrink the list of tracked apps.

-- If profiles already existed before this feature, add the column —
-- "create table if not exists" above won't add it to an existing table.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Prevents a non-admin from granting themselves admin by calling the
-- Supabase API directly (bypassing the app's own UI/checks). Only an
-- update made with the service role (used by the setUserAdmin server
-- action, after it verifies the caller is already an admin) is allowed
-- to actually change is_admin.
create or replace function public.prevent_self_admin_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if auth.role() <> 'service_role' then
      new.is_admin := old.is_admin;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_self_admin_escalation on public.profiles;
create trigger trg_prevent_self_admin_escalation
before update on public.profiles
for each row
execute function public.prevent_self_admin_escalation();

drop policy if exists "Authenticated users can insert apps" on public.apps;
create policy "Admins can insert apps"
  on public.apps
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

drop policy if exists "Authenticated users can delete apps" on public.apps;
create policy "Admins can delete apps"
  on public.apps
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- IMPORTANT — bootstrap your first admin manually (one-time, one-line):
-- run this once, replacing the email, after you've signed up/logged in:
--
--   update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'you@example.com');
--
-- After that, the newly-admin account can promote/demote teammates from
-- inside the app itself (Admin page → Manage admins).

-- 8. Telegram personal linking -----------------------------------------
-- Lets each teammate DM the bot 1-on-1 (not just the group) and get
-- personal alerts. Since Telegram has no concept of email, linking is
-- done via a short-lived code generated in the app and sent to the bot.

create table if not exists public.telegram_link_codes (
  code text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.telegram_link_codes enable row level security;

drop policy if exists "Users manage their own link codes" on public.telegram_link_codes;
create policy "Users manage their own link codes"
  on public.telegram_link_codes
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.telegram_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chat_id text not null unique,
  created_at timestamptz not null default now()
);

alter table public.telegram_links enable row level security;

drop policy if exists "Authenticated users can read telegram links" on public.telegram_links;
create policy "Authenticated users can read telegram links"
  on public.telegram_links
  for select
  to authenticated
  using (true);

drop policy if exists "Users manage their own telegram link" on public.telegram_links;
create policy "Users manage their own telegram link"
  on public.telegram_links
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9. Add new statuses to an already-existing database ----------------------
-- If you already ran this script before "OTP Problem" and "Payment Gateway
-- Issue" existed, your apps table still has the OLD check constraint. This
-- section updates it — safe to run even on a brand-new database (it just
-- re-applies the same constraint the table already has from section 1).

alter table public.apps drop constraint if exists apps_status_check;
alter table public.apps add constraint apps_status_check
  check (status in ('Active', 'SDK Problem', 'Event Problem', 'OTP Problem', 'Payment Gateway Issue'));

-- 10. Add App ID column to an already-existing database ----------------------
-- Safe to run on a brand-new database too (it's the same column already
-- created in section 1) — adds a text field for a package name / bundle
-- ID / any identifier your team wants to track per app.

alter table public.apps add column if not exists app_id text;

-- 11. Seed data (optional) -------------------------------------------------
-- Uncomment to start with a couple of example apps.
-- insert into public.apps (name, status, updated_by) values
--   ('Consumer iOS', 'Active', 'seed@example.com'),
--   ('Consumer Android', 'Active', 'seed@example.com');
