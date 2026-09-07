import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error(
      "Push notifications are not configured: missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY."
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Sends a push notification to every subscribed device (i.e. every
 * teammate who has enabled notifications), and prunes subscriptions that
 * are no longer valid (the browser unsubscribed, cleared data, etc).
 */
export async function sendPushToAll(payload: PushPayload): Promise<void> {
  // If VAPID keys aren't set, silently skip instead of breaking the
  // status update itself.
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return;

  ensureVapidConfigured();

  const supabase = createClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (!subscriptions || subscriptions.length === 0) return;

  const body = JSON.stringify(payload);

  const staleIds: string[] = [];

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
      } catch (err: any) {
        // 404/410 = the subscription is gone (browser data cleared,
        // permission revoked, etc) — clean it up so we stop retrying it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleIds.push(sub.id);
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }
}
