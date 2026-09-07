"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { saveUsername } from "@/app/actions";

export default function UsernameModal({
  currentUsername,
  required,
  onClose,
  onSaved,
}: {
  currentUsername: string | null;
  required: boolean;
  onClose: () => void;
  onSaved: (username: string) => void;
}) {
  const [value, setValue] = useState(currentUsername ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Portal target must wait for the client — document isn't available
  // during server rendering.
  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Please enter a name.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: err } = await saveUsername(trimmed);

    setSaving(false);

    if (err) {
      setError(err);
      return;
    }

    onSaved(trimmed);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm animate-backdrop-in sm:items-center"
      onClick={required ? undefined : onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-sm animate-sheet-in overflow-y-auto rounded-[28px] bg-card p-5 pt-3 shadow-modal backdrop-blur-xl"
      >
        {!required && (
          <div className="mb-3 flex justify-center">
            <span className="h-1 w-9 rounded-full bg-border" />
          </div>
        )}

        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {required ? "Welcome" : "Your name"}
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-ink">
              {required ? "Pick a display name" : "Edit your display name"}
            </h2>
          </div>
          {!required && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-all duration-150 ease-spring hover:bg-surface active:scale-90"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {required && (
          <p className="mb-4 text-sm text-ink-soft">
            This is what teammates see instead of your email — e.g. Telegram
            messages will say &ldquo;by {value.trim() || "yourname"}&rdquo;
            instead of your email address.
          </p>
        )}

        <form onSubmit={handleSave}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. Alex"
            maxLength={30}
            autoFocus
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 ease-spring focus:border-primary focus:bg-card focus:outline-none"
          />

          {error && (
            <p className="mt-2 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-spring hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Save
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
