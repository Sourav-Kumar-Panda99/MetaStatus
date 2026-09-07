// Sends messages to Telegram via the Bot API. Uses plain fetch — no
// extra SDK/dependency needed.

import { createServiceClient } from "@/lib/supabase/service";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendTelegramMessage(
  text: string,
  chatId?: string
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;

  // If Telegram isn't configured, skip silently instead of breaking
  // whatever action triggered this.
  if (!token || !targetChatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // Non-fatal: a failed Telegram notification should never break the
    // status update / add / remove action that triggered it.
  }
}

/**
 * Every teammate who has personally linked their account to the bot
 * (via a /link code, separate from the shared team chat). Used to send
 * each of them a personal DM alongside the group message.
 */
async function getLinkedChatIds(): Promise<string[]> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("telegram_links").select("chat_id");
    return (data ?? []).map((row) => row.chat_id as string);
  } catch {
    return [];
  }
}

async function broadcast(text: string): Promise<void> {
  const groupSend = sendTelegramMessage(text);
  const linkedIds = await getLinkedChatIds();
  const personalSends = linkedIds.map((chatId) =>
    sendTelegramMessage(text, chatId)
  );
  await Promise.allSettled([groupSend, ...personalSends]);
}

const STATUS_EMOJI: Record<string, string> = {
  Active: "✅",
  "SDK Problem": "🔴",
  "Event Problem": "🔴",
  "OTP Problem": "🔐",
  "Payment Gateway Issue": "💳",
};

export async function notifyStatusChange(
  appName: string,
  status: string,
  changedBy: string,
  appId?: string | null
): Promise<void> {
  const emoji = STATUS_EMOJI[status] ?? "ℹ️";
  const idPart = appId ? ` <code>${escapeHtml(appId)}</code>` : "";
  await broadcast(
    `${emoji} <b>${escapeHtml(appName)}</b>${idPart} status changed to <b>${escapeHtml(
      status
    )}</b>\nby ${escapeHtml(changedBy)}`
  );
}

export async function notifyAppAdded(
  appName: string,
  addedBy: string,
  appId?: string | null
): Promise<void> {
  const idPart = appId ? ` <code>${escapeHtml(appId)}</code>` : "";
  await broadcast(
    `➕ New app added: <b>${escapeHtml(appName)}</b>${idPart}\nby ${escapeHtml(
      addedBy
    )}`
  );
}

export async function notifyAppRemoved(
  appName: string,
  removedBy: string
): Promise<void> {
  await broadcast(
    `🗑 App removed: <b>${escapeHtml(appName)}</b>\nby ${escapeHtml(
      removedBy
    )}`
  );
}
