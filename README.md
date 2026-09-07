# App Status

A very simple internal dashboard for tracking the status of every mobile app
your team manages — built with Next.js 14 (App Router), TypeScript, Tailwind
CSS, and Supabase (Auth + Postgres).

- **Dashboard (`/`)** — see every app at a glance, click a card to change its
  status.
- **Admin (`/admin`)** — add or remove apps.
- **Login (`/login`)** — Supabase email/password auth. No public sign-up;
  accounts are created manually in the Supabase dashboard. Every route is
  protected by middleware.

Statuses are exactly: **Active** (green), **SDK Problem** (red), **Event
Problem** (red).

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project, and
   wait for it to finish provisioning.
2. Open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:
   - the `apps` table (`name`, `status`, `updated_at`, `updated_by`,
     `created_at`)
   - a trigger that automatically refreshes `updated_at` on every change
   - Row Level Security policies that restrict **all** reads and writes to
     authenticated users only (no public/anon access)
   - the table is added to the `supabase_realtime` publication (optional,
     used only if you extend the app later)
3. Open **Project Settings → API** and copy the **Project URL** and
   **anon public key** — you'll need them for the env vars below.

## 2. Accounts, sign-up, and display names

⚠️ **This project now uses open sign-up** — anyone with your Vercel link
can create an account at `/signup` and access the dashboard. There is no
invite gate. If you want to lock this back down, the simplest fix is
deleting `app/signup/page.tsx` and removing `"/signup"` from
`PUBLIC_PATHS` in `lib/supabase/middleware.ts`, then creating accounts
manually in Supabase (Authentication → Users → Add user) as before.

Each person sets a **display name** the first time they log in (or right
on the signup form) — this is what teammates see everywhere instead of
their email: on the dashboard's "updated by" line, in push notification
text, and in Telegram messages. They can change it anytime via the name
button in the header.

By default, Supabase requires email confirmation before a new sign-up can
log in. To let people use the app immediately after signing up (no email
step), go to **Authentication → Providers → Email** in Supabase and turn
off **"Confirm email."** If you leave it on, new users see a "check your
email" message and set their display name on first login instead.

### Admin roles (who can add/remove apps)

Anyone with an account can log in, view the dashboard, and change a
status. **Only admins can add or remove apps** — everyone else sees a
read-only list on the Admin page with a note explaining why.

There's no self-service way to become the first admin (on purpose — it'd
be a security hole otherwise). Bootstrap your first admin with one SQL
command, after you've signed up/logged in at least once:

1. Supabase → **SQL Editor** → New query.
2. Run this, with your real email:
   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Refresh the app — a **"Team"** tab now appears in the header (only
   admins see it), and the Admin page shows the "Add app" form, remove
   buttons, and a "Manage team" link.

From there, go to the **Team** page (`/admin/team`) to manage everyone:
promote/demote admins, and remove a teammate's account entirely (this
deletes their login — they'd need a new invite/signup to come back). You
can't remove your own admin access or your own account from the UI (to
avoid accidentally locking everyone out); if you ever need to, use the
same SQL pattern above with `is_admin = false`, or delete the user
directly in Supabase → Authentication → Users.

## 3. Environment variables

Copy the example file and fill in the values below.

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=see below
VAPID_PRIVATE_KEY=see below
VAPID_SUBJECT=mailto:admin@example.com
TELEGRAM_BOT_TOKEN=see below
TELEGRAM_CHAT_ID=see below
SUPABASE_SERVICE_ROLE_KEY=see below (only needed for bot commands)
TELEGRAM_WEBHOOK_SECRET=see below (only needed for bot commands)
TELEGRAM_ALLOWED_CHAT_IDS=optional, see below
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username_here
```

The two Supabase values are safe to expose to the browser — Row Level
Security in `schema.sql` is what actually restricts access to
authenticated users. The VAPID values are for push notifications, the
`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` pair is for Telegram alerts, and
the remaining three are for letting teammates message the bot for a live
status ("status", "problems", etc) — all covered next, and all optional
(the app runs fine with any of them left blank).

## 4. Push notifications & installing as an app

App Status is a **PWA (Progressive Web App)**. That means:

- Anyone can install it to their phone's home screen straight from the
  browser — no app store needed.
- Once installed (or even just opened in a supporting browser), it can
  send **real push notifications** whenever an app's status changes to
  **SDK Problem** or **Event Problem**, sent to every teammate who has
  notifications turned on.

### 4a. VAPID keys (what makes push notifications work)

Push notifications need a "VAPID key pair" — a public/private key that
proves the notifications are coming from your app. A ready-to-use pair
has already been generated for you:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BIBSXEVMvNeO2zsNsI9_Ss79nwd5lWVKP57M2Wr28jNN_bK-eep6hd1pRk289Cg2Z4KjuMY-KjL3nJ8oKs3YytU
VAPID_PRIVATE_KEY=a7hE0nTyx8ZayxSoXHQlB87Bvw130_5_GLY-YwXsmB8
```

Paste both into your `.env.local` (for local dev) and into Vercel's
Environment Variables (for the live deployment) — see step 6 below.

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is safe to expose to the browser (that's
  what "public" means here).
- `VAPID_PRIVATE_KEY` should stay secret — only ever put it in Vercel's
  environment variables or your local `.env.local`, **never** commit it
  to GitHub. (The provided `.gitignore` already keeps `.env.local` out of
  git for you.)
- Want your own unique pair instead of the shared one above? If you ever
  have access to a terminal with Node.js installed, run
  `npx web-push generate-vapid-keys` and use those values instead. Not
  required — the app works fine with the pair above.

### 4b. How notifications reach a phone

1. A teammate opens the app in a mobile browser (Chrome on Android, or
   Safari on iPhone) and taps the bell icon in the header, then allows
   notifications when the browser prompts them.
2. From then on, whenever anyone changes an app's status to **SDK
   Problem** or **Event Problem**, everyone who enabled notifications
   gets a push alert — even if the app isn't open.
3. Tapping the notification opens the dashboard.

**On iPhone**, Apple requires the app to be added to the home screen
first before push notifications work: open the app in Safari, tap the
Share icon, then "Add to Home Screen." Open it from that home screen
icon once, then the bell icon will work the same way as on Android.

**On Android**, Chrome will typically also offer an "Install app" /
"Add to Home Screen" prompt automatically — that's optional for
notifications to work there, but gives a nicer full-screen app feel.

## 5. Telegram notifications

Every status change (Active, SDK Problem, Event Problem) and every app
added or removed gets posted as a message to a Telegram chat of your
choice — a personal chat with the bot, or a group with your whole team.

### 5a. Create the bot (2 minutes, entirely inside Telegram)

1. Open Telegram (app or web.telegram.org) and search for **@BotFather**
   (the official bot for creating bots — verified blue checkmark).
2. Send it the message `/newbot`.
3. Give it a name (e.g. "App Status Alerts") and a username ending in
   `bot` (e.g. `app_status_alerts_bot`).
4. BotFather replies with a token that looks like
   `123456789:AAExampleTokenTextGoesHere`. Copy it — this is your
   `TELEGRAM_BOT_TOKEN`.

### 5b. Get your chat ID

Pick whichever fits how your team works:

**Option A — notify just yourself:**
1. Search for your new bot by its username and open a chat with it.
2. Send it any message, e.g. "hi".
3. In a browser, visit
   `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` (replace
   `<YOUR_TOKEN>` with your real token).
4. Look for `"chat":{"id":123456789` in the response — that number
   (it may be negative) is your `TELEGRAM_CHAT_ID`.

**Option B — notify a team group:**
1. Create a Telegram group with your team (or use an existing one).
2. Add your bot to the group like any other member.
3. Send any message in the group.
4. Visit the same `getUpdates` URL as above — the group's `"chat":{"id"`
   will be a negative number (e.g. `-1002345678901`). Use that as your
   `TELEGRAM_CHAT_ID`.

### 5c. Add the two values

Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to `.env.local` for local
development, and to Vercel's Environment Variables for the live
deployment (same place as the Supabase and VAPID values). If these two
are left blank, the app works completely normally — it just skips
sending Telegram messages.

## 6. Talk to the bot for live status (optional)

Beyond receiving alerts, anyone in your configured chat can also message
the bot directly and get an instant reply pulled straight from the
database — no need to open the app:

- Type **`status`** or **`apps`** → lists every app and its current status
- Type **`problems`** → lists only the apps that need attention
- Type **`help`** → shows what it understands

Works with or without a leading slash (`status` and `/status` both work),
and it ignores anything it doesn't recognize so it won't spam a busy
group chat.

### 6a. Get your Supabase service role key

The bot replies to messages with no logged-in user behind them, so it
needs a key that can read the database directly, bypassing the normal
login-required security rules.

1. In Supabase: **Settings → API**.
2. Under **Project API keys**, find the one labeled **`service_role`**
   (it's marked "secret").
3. Copy it — this is `SUPABASE_SERVICE_ROLE_KEY`.

⚠️ **Keep this one truly secret.** Unlike the anon key, this key bypasses
all security rules. Only ever put it in Vercel's Environment Variables or
your local `.env.local` — never in a `NEXT_PUBLIC_` variable, never
committed to GitHub.

### 6b. Set a webhook secret

Make up any random string (e.g. mash your keyboard for 20+ characters, or
use a password generator) and set it as `TELEGRAM_WEBHOOK_SECRET`. This
just proves incoming requests to your bot's webhook really came from
Telegram.

### 6c. Add the env vars and deploy

Add both `SUPABASE_SERVICE_ROLE_KEY` and `TELEGRAM_WEBHOOK_SECRET` to
Vercel's Environment Variables (alongside everything else), then deploy
or redeploy so they take effect.

### 6d. Register the webhook with Telegram (one-time, one URL visit)

Once your app has a live Vercel URL, open this in any browser — filling
in your real token, your app's URL, and the webhook secret you made up:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook&secret_token=<YOUR_WEBHOOK_SECRET>
```

You should see `{"ok":true,"result":true,"description":"Webhook was set"}`
in the browser. That's it — go to your Telegram chat and type `status` to
try it.

If you ever want to disable this, visit
`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook`.

## 7. Personal Telegram DMs (optional)

Beyond the shared team chat, each teammate can link *their own* Telegram
account to the bot, so they get personal DMs for status changes and can
message the bot 1-on-1 (Telegram has no concept of email, so this uses a
short-lived code to connect the two):

1. In the app header, click the paper-plane icon ("Connect Telegram").
2. The app shows a message like `link AB12CD`.
3. Open a direct (1-on-1) chat with your bot on Telegram — search its
   username and tap through, don't use the group.
4. Send it that exact message: `link AB12CD`.
5. The bot replies "✅ Linked!" — from then on, that person gets a
   personal DM every time a status changes, in addition to the group
   message, and can message the bot directly for `status`/`problems`.

The code expires after 10 minutes; if it expires, just click "Connect
Telegram" again for a fresh one. No extra environment variables needed —
this reuses the same bot token and service role key already configured.

## 8. Finding the bot (QR code)

People shouldn't have to guess which Telegram bot is yours. Set
`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` (just the username, no `@` and no
`https://t.me/`) and the "Connect Telegram" panel (paper-plane icon in
the header) shows a real, scannable QR code that opens a direct chat with
your bot — plus the `@username` as a tappable link for anyone who'd
rather search for it manually. If this env var is left blank, the panel
just skips the QR code and shows the link-code instructions on their own.

## 9. Dark theme

The app ships dark by default — near-black background, dark elevated
cards, and the same blue/green/red accent colors adapted for contrast on
dark surfaces. This isn't a toggle; it's the only theme. If you'd ever
want a light mode back, the entire palette lives in one place —
`tailwind.config.ts`'s `colors` block — so it's a matter of swapping
those hex values back rather than hunting through components.

## 10. Run locally

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) — you'll be redirected
to `/login`. Sign in with an account you created in step 2.

## 11. Deploy to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. In Vercel, click **Add New → Project** and import the repo.
3. Vercel will auto-detect Next.js — no build config needed.
4. Under **Environment Variables**, add the seven core variables from
   step 3 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`,
   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`), plus `SUPABASE_SERVICE_ROLE_KEY`
   and `TELEGRAM_WEBHOOK_SECRET` if you want bot commands (step 6), and
   `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` for the QR code (step 8).
5. Click **Deploy**.

That's the whole setup — no extra configuration required.

---

## Project structure

```
app/
  actions.ts        Server actions: updateAppStatus, addApp, removeApp,
                      savePushSubscription, removePushSubscription
                      (also triggers push + Telegram notifications)
  api/telegram/webhook/route.ts  Receives incoming Telegram messages,
                                    replies to status/problems/help
  page.tsx           Dashboard (/) — server component, fetches apps
  admin/page.tsx      Admin (/admin) — server component, fetches apps
  login/page.tsx      Login page (client component)
  layout.tsx          Root layout + PWA metadata
  globals.css         Tailwind base styles
components/
  Header.tsx           Blue header bar with nav tabs + bell + sign-out
  NotificationBell.tsx  Enable/disable push notifications on this device
  StatsStrip.tsx        "Total apps" / "Needs attention" stats
  AppCard.tsx           Single app row on the dashboard
  StatusModal.tsx        Modal for changing an app's status
  StatusPill.tsx          Colored status pill (shared)
  DashboardClient.tsx      Client-side state for the dashboard
  AdminClient.tsx           Add/remove apps UI
  SignOutButton.tsx          Icon button in the header
  ServiceWorkerRegister.tsx   Registers /sw.js on every page
lib/
  types.ts             Shared TypeScript types + the 3 allowed statuses
  app-icon.ts            Deterministic icon + tile color per app name
  format-time.ts           "2 hours ago" style timestamp formatting
  push.ts                    Server-only: sends push notifications (web-push)
  push-client.ts               Browser helper for subscribing to push
  telegram.ts                    Server-only: sends Telegram bot messages
  supabase/client.ts        Browser Supabase client
  supabase/server.ts         Server Supabase client (Server Components/Actions)
  supabase/middleware.ts       Session refresh + auth redirect logic
  supabase/service.ts            Service-role client (webhook only, bypasses RLS)
public/
  manifest.json         PWA manifest (name, icons, colors)
  sw.js                  Service worker: push notifications + install support
  icons/                  App icons used by the manifest and notifications
middleware.ts           Protects every route, redirects to /login
supabase/schema.sql       Tables, trigger, and RLS policies
```

## Notes

- Status changes, the "last updated" timestamp, and "updated by" all update
  immediately in the UI after a change (no page reload needed) and are
  persisted via Supabase.
- **Five statuses** are enforced both in the UI (`lib/types.ts`) and in the
  database (a `check` constraint in `schema.sql`): Active, SDK Problem,
  Event Problem, OTP Problem, and Payment Gateway Issue. If you already ran
  `schema.sql` before these last two existed, re-run it — section 8
  specifically updates the database constraint on an existing table.
- **Live sync across everyone's screen**: the dashboard and admin page use
  Supabase Realtime (`lib/use-apps-realtime.ts`) to subscribe directly to
  database changes. If one teammate changes a status, adds an app, or
  removes one, every other open tab/device updates within a second or two
  — no manual refresh, no polling. This relies on the `apps` table being in
  the `supabase_realtime` publication, which `schema.sql` already sets up.
- Push notifications only fire when a status changes to **SDK Problem** or
  **Event Problem** — going back to Active does not send a push notification.
- Telegram messages are sent for **every** status change (including back to
  Active) and for every app added or removed, since Telegram is a lower-
  noise channel than a phone push alert.
- If `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` are left blank, the
  app still works completely normally — it just skips sending push
  notifications instead of erroring. Same for `TELEGRAM_BOT_TOKEN` /
  `TELEGRAM_CHAT_ID` and Telegram messages.
- No analytics, charts, or monitoring beyond the notifications described
  above — just the dashboard, admin page, and login, as requested.
- The bot only replies inside the chat(s) listed in `TELEGRAM_CHAT_ID` /
  `TELEGRAM_ALLOWED_CHAT_IDS` — anyone outside those chats who finds and
  messages the bot gets silently ignored, so status data doesn't leak to
  strangers who happen to find the bot's username.
