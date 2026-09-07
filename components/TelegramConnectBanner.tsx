"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import TelegramLinkButton from "@/components/TelegramLinkButton";

const DISMISS_KEY = "telegram-banner-dismissed";
const AUTO_PROMPTED_KEY = "telegram-auto-prompted";

export default function TelegramConnectBanner() {
  const [status, setStatus] = useState<"checking" | "show" | "hide">(
    "checking"
  );
  const [autoOpen, setAutoOpen] = useState(false);

  useEffect(() => {
    async function check() {
      // Only relevant if the bot is actually configured for this deploy.
      if (!process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME) {
        setStatus("hide");
        return;
      }

      if (localStorage.getItem(DISMISS_KEY) === "1") {
        setStatus("hide");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setStatus("hide");
        return;
      }

      const { data } = await supabase
        .from("telegram_links")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setStatus("hide");
        return;
      }

      setStatus("show");

      // Pop the modal automatically the very first time this browser
      // sees an unlinked account — after that, the banner alone is
      // enough, so it doesn't re-interrupt on every visit.
      if (localStorage.getItem(AUTO_PROMPTED_KEY) !== "1") {
        localStorage.setItem(AUTO_PROMPTED_KEY, "1");
        setAutoOpen(true);
      }
    }
    check();
  }, []);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setStatus("hide");
  }

  if (status !== "show") return null;

  return (
    <div className="relative mb-5">
      <TelegramLinkButton variant="banner" autoOpen={autoOpen} />
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        title="Dismiss"
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-faint transition-all duration-150 ease-spring hover:bg-black/20 hover:text-ink active:scale-90"
      >
        <X size={14} />
      </button>
    </div>
  );
}
