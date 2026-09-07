"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { urlBase64ToUint8Array } from "@/lib/push-client";
import { savePushSubscription, removePushSubscription } from "@/app/actions";

type SupportState = "checking" | "unsupported" | "denied" | "off" | "on";

export default function NotificationBell() {
  const [state, setState] = useState<SupportState>("checking");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function check() {
      if (
        typeof window === "undefined" ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setState("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        setState(existing ? "on" : "off");
      } catch {
        setState("off");
      }
    }
    check();
  }, []);

  async function handleEnable() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setState("unsupported");
      return;
    }

    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        setBusy(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });

      const json = subscription.toJSON();
      await savePushSubscription({
        endpoint: json.endpoint!,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });

      setState("on");
    } catch {
      setState("off");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      // leave state as-is
    } finally {
      setBusy(false);
    }
  }

  if (state === "checking" || state === "unsupported") {
    return null;
  }

  if (state === "denied") {
    return (
      <span
        title="Notifications are blocked in your browser settings"
        className="flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9 text-white/50"
      >
        <BellOff size={18} strokeWidth={2.25} />
      </span>
    );
  }

  const isOn = state === "on";

  return (
    <button
      type="button"
      onClick={isOn ? handleDisable : handleEnable}
      disabled={busy}
      aria-label={isOn ? "Disable notifications" : "Enable notifications"}
      title={
        isOn
          ? "Notifications on for this device"
          : "Enable notifications for this device"
      }
      className="flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9 text-white/85 transition-all duration-150 ease-spring hover:bg-white/15 hover:text-white active:scale-90 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 size={18} className="animate-spin" />
      ) : isOn ? (
        <BellRing size={18} strokeWidth={2.25} className="animate-bell-ring" />
      ) : (
        <Bell size={18} strokeWidth={2.25} />
      )}
    </button>
  );
}
