"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Send,
  X,
  Loader2,
  Copy,
  Check,
  CircleCheck,
  QrCode,
  ListChecks,
  TriangleAlert,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateTelegramLinkCode } from "@/app/actions";

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
const BOT_URL = BOT_USERNAME ? `https://t.me/${BOT_USERNAME}` : null;

const COMMANDS = [
  {
    icon: ListChecks,
    command: "status",
    alt: "apps",
    result: "Every app and its current status",
  },
  {
    icon: CircleCheck,
    command: "available",
    result: "Only the apps that are currently Active",
  },
  {
    icon: TriangleAlert,
    command: "problems",
    result: "Only the apps that need attention right now",
  },
  {
    icon: HelpCircle,
    command: "help",
    result: "Shows this same list of commands",
  },
];

export default function TelegramLinkButton({
  variant = "icon",
  autoOpen = false,
}: {
  variant?: "icon" | "banner";
  autoOpen?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal target must wait for the client — document isn't available
  // during server rendering.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-pop the modal once for first-time users who haven't connected
  // yet (controlled by the parent, which checks link status). Doesn't
  // re-trigger on its own — the parent only renders with autoOpen once.
  useEffect(() => {
    if (autoOpen && mounted) {
      handleOpen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, mounted]);

  async function handleOpen() {
    setOpen(true);
    setError(null);
    setCode(null);
    setLoading(true);

    const { code: newCode, error: err } = await generateTelegramLinkCode();

    setLoading(false);

    if (err || !newCode) {
      setError(err ?? "Couldn't generate a code. Please try again.");
      return;
    }
    setCode(newCode);
  }

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(`link ${code}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const modal = (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 backdrop-blur-sm animate-backdrop-in sm:items-center"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-sm animate-sheet-in overflow-y-auto rounded-[28px] bg-card p-5 pt-3 shadow-modal backdrop-blur-xl sm:max-w-3xl"
      >
        <div className="mb-3 flex justify-center sm:hidden">
          <span className="h-1 w-9 rounded-full bg-border" />
        </div>

        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Telegram
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-ink">
              Connect for personal alerts
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-all duration-150 ease-spring hover:bg-surface active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        {/* Side by side once there's room (tablet/desktop/landscape);
            stacks on a narrow portrait phone where two columns won't fit. */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* What the bot can actually do — shown up front so it's
              obvious before anyone even scans the code. */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              What you can type
            </p>
            <div className="flex flex-col gap-3">
              {COMMANDS.map(({ icon: Icon, command, alt, result }) => (
                <div key={command} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Icon size={13} strokeWidth={2.5} />
                  </span>
                  <p className="text-sm text-ink-soft">
                    Type{" "}
                    <span className="font-mono font-semibold text-ink">
                      {command}
                    </span>
                    {alt && (
                      <>
                        {" "}
                        or{" "}
                        <span className="font-mono font-semibold text-ink">
                          {alt}
                        </span>
                      </>
                    )}{" "}
                    → {result}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {BOT_URL ? (
            <div className="flex flex-col items-center rounded-2xl border border-border bg-surface p-5">
              <div className="rounded-2xl bg-white p-3 shadow-card">
                <QRCodeSVG
                  value={BOT_URL}
                  size={148}
                  fgColor="#1877F2"
                  bgColor="#FFFFFF"
                  level="M"
                />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink">
                <QrCode size={14} className="text-ink-faint" />
                Scan to open the bot
              </p>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 text-sm font-medium text-primary transition-colors hover:text-primary-dark"
              >
                @{BOT_USERNAME}
              </a>
            </div>
          ) : (
            <p className="rounded-lg bg-surface px-3 py-2 text-xs text-ink-faint">
              Set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME to show a scannable QR
              code here too.
            </p>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-ink-faint" />
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {code && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-ink">
              {BOT_URL
                ? "After opening the chat above, send this exact message:"
                : "Open a direct message with the team bot on Telegram and send it this exact message:"}
            </p>
            <button
              type="button"
              onClick={handleCopy}
              className="mb-3 flex w-full animate-item-in items-center justify-between rounded-xl border-2 border-primary bg-primary-light px-3 py-3 font-mono text-sm font-semibold text-ink shadow-[0_0_0_4px_rgba(24,119,242,0.15)] transition-all duration-150 ease-spring hover:brightness-110 active:scale-[0.98]"
            >
              <span>link {code}</span>
              {copied ? (
                <Check size={16} className="animate-logo-pop text-success" />
              ) : (
                <Copy size={16} className="text-primary" />
              )}
            </button>
            <p className="text-xs text-ink-faint">
              This code expires in 10 minutes. Once linked, you&apos;ll
              get personal DMs for status changes, and can message the
              bot anytime using the commands above.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const portalModal = open && mounted && createPortal(modal, document.body);

  if (variant === "banner") {
    return (
      <>
        <button
          type="button"
          onClick={handleOpen}
          className="flex w-full animate-item-in items-center gap-3.5 rounded-2xl border border-primary/30 bg-primary/10 p-4 pr-10 text-left backdrop-blur-xl transition-all duration-200 ease-spring hover:bg-primary/15 hover:shadow-cardHover active:scale-[0.99]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Send size={20} strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">
              Connect Telegram for personal alerts
            </p>
            <p className="mt-0.5 text-sm text-ink-soft">
              Get a DM the instant a status changes, and check status anytime
              by messaging the bot.
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0 text-ink-faint" />
        </button>
        {portalModal}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        title="Connect Telegram for personal alerts"
        className="flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9 text-white/85 transition-all duration-150 ease-spring hover:bg-white/15 hover:text-white active:scale-90"
      >
        <Send size={17} strokeWidth={2.25} />
      </button>
      {portalModal}
    </>
  );
}
