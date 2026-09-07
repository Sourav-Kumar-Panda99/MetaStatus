import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const STATUS_EMOJI: Record<string, string> = {
  Active: "✅",
  "SDK Problem": "🔴",
  "Event Problem": "🔴",
  "OTP Problem": "🔐",
  "Payment Gateway Issue": "💳",
};

const HELP_TEXT =
  "👋 <b>App Status bot</b>\n\n" +
  "<b>What you can type</b>\n" +
  "• <b>status</b> or <b>apps</b> → Every app and its current status\n" +
  "• <b>available</b> → Only the apps that are currently Active\n" +
  "• <b>problems</b> → Only the apps that need attention right now\n" +
  "• <b>help</b> → Shows this same list of commands";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function replyTo(chatId: number | string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  }).catch(() => {});
}

/**
 * The shared team chat(s) — always allowed, configured via env vars.
 */
function isConfiguredChat(chatId: number | string): boolean {
  const raw =
    process.env.TELEGRAM_ALLOWED_CHAT_IDS || process.env.TELEGRAM_CHAT_ID || "";
  const allowed = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allowed.includes(String(chatId));
}

function formatAppLines(
  apps: { name: string; status: string; app_id: string | null }[]
): string {
  return apps
    .map((a) => {
      const idPart = a.app_id ? ` <code>${escapeHtml(a.app_id)}</code>` : "";
      return `${STATUS_EMOJI[a.status] ?? "ℹ️"} <b>${escapeHtml(
        a.name
      )}</b>${idPart} — ${escapeHtml(a.status)}`;
    })
    .join("\n");
}

export async function POST(req: NextRequest) {
  // Verify this request genuinely came from Telegram, using the secret
  // token set when the webhook was registered.
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const providedSecret = req.headers.get(
      "x-telegram-bot-api-secret-token"
    );
    if (providedSecret !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  const chatId = message?.chat?.id;
  const text: string | undefined = message?.text;

  if (!chatId || !text) {
    return NextResponse.json({ ok: true });
  }

  const normalized = text.trim().toLowerCase().replace(/^\//, "");
  const supabase = createServiceClient();

  // Handle "link CODE" first — this is how a personal DM chat becomes
  // authorized in the first place, so it must work even before the chat
  // is otherwise allowed.
  const linkMatch = normalized.match(/^link\s+([a-z0-9]+)$/i);
  if (linkMatch) {
    const code = linkMatch[1].toUpperCase();

    try {
      const { data: linkRow } = await supabase
        .from("telegram_link_codes")
        .select("user_id, expires_at")
        .eq("code", code)
        .maybeSingle();

      if (!linkRow || new Date(linkRow.expires_at) < new Date()) {
        await replyTo(
          chatId,
          "❌ That code is invalid or expired. Generate a new one in the app and try again."
        );
      } else {
        await supabase.from("telegram_links").upsert(
          { user_id: linkRow.user_id, chat_id: String(chatId) },
          { onConflict: "chat_id" }
        );
        await supabase.from("telegram_link_codes").delete().eq("code", code);
        await replyTo(
          chatId,
          "✅ <b>Linked!</b> You'll get personal alerts here from now on.\n\n" +
            HELP_TEXT.replace("👋 <b>App Status bot</b>\n\n", "")
        );
      }
    } catch {
      await replyTo(chatId, "Something went wrong linking your account. Try again in a moment.");
    }

    return NextResponse.json({ ok: true });
  }

  // Everything else requires an authorized chat: either the shared team
  // chat(s), or a personal chat that's been linked via the code above.
  let allowed = isConfiguredChat(chatId);
  if (!allowed) {
    const { data: linked } = await supabase
      .from("telegram_links")
      .select("id")
      .eq("chat_id", String(chatId))
      .maybeSingle();
    allowed = !!linked;
  }

  if (!allowed) {
    return NextResponse.json({ ok: true });
  }

  try {
    if (normalized.includes("problem")) {
      const { data: allApps } = await supabase
        .from("apps")
        .select("name, status, app_id");
      const total = allApps?.length ?? 0;
      const problems = (allApps ?? [])
        .filter((a) => a.status !== "Active")
        .sort((a, b) => a.name.localeCompare(b.name));

      if (problems.length === 0) {
        await replyTo(
          chatId,
          `✅ No problems right now — all ${total} app${total === 1 ? "" : "s"} Active.`
        );
      } else {
        await replyTo(
          chatId,
          `<b>Needs attention</b> — ${problems.length} of ${total}\n\n${formatAppLines(problems)}`
        );
      }
    } else if (normalized.includes("available")) {
      const { data: allApps } = await supabase
        .from("apps")
        .select("name, status, app_id");
      const total = allApps?.length ?? 0;
      const available = (allApps ?? [])
        .filter((a) => a.status === "Active")
        .sort((a, b) => a.name.localeCompare(b.name));

      if (total === 0) {
        await replyTo(chatId, "No apps are being tracked yet.");
      } else if (available.length === 0) {
        await replyTo(
          chatId,
          `⚠️ None of the ${total} app${total === 1 ? "" : "s"} are Active right now.`
        );
      } else {
        await replyTo(
          chatId,
          `<b>Available</b> — ${available.length} of ${total}\n\n${formatAppLines(available)}`
        );
      }
    } else if (normalized.includes("status") || normalized.includes("app")) {
      const { data: apps } = await supabase
        .from("apps")
        .select("name, status, app_id")
        .order("name", { ascending: true });

      const total = apps?.length ?? 0;

      if (!apps || total === 0) {
        await replyTo(chatId, "No apps are being tracked yet.");
      } else {
        const needsAttention = apps.filter((a) => a.status !== "Active").length;
        const summary =
          needsAttention === 0
            ? `${total} total, all Active`
            : `${total} total, ${needsAttention} need${needsAttention === 1 ? "s" : ""} attention`;
        await replyTo(
          chatId,
          `<b>All apps</b> — ${summary}\n\n${formatAppLines(apps)}`
        );
      }
    } else if (
      normalized.includes("help") ||
      normalized.includes("start") ||
      normalized.includes("command")
    ) {
      await replyTo(chatId, HELP_TEXT);
    }
    // Anything else: stay silent so the bot doesn't add noise.
  } catch {
    // Never let a Supabase/formatting error surface as a 500 to Telegram.
  }

  return NextResponse.json({ ok: true });
}
