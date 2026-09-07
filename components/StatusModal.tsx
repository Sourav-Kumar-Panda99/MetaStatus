"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, CircleCheck, TriangleAlert, Loader2 } from "lucide-react";
import type { AppRow, AppStatus } from "@/lib/types";
import { APP_STATUSES } from "@/lib/types";
import { updateAppStatus } from "@/app/actions";

export default function StatusModal({
  app,
  onClose,
  onUpdated,
}: {
  app: AppRow;
  onClose: () => void;
  onUpdated: (updated: AppRow) => void;
}) {
  const [saving, setSaving] = useState<AppStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSelect(status: AppStatus) {
    if (status === app.status) {
      onClose();
      return;
    }
    setSaving(status);
    setError(null);

    const { data, error: err } = await updateAppStatus(app.id, status);

    setSaving(null);

    if (err || !data) {
      setError(err ?? "Something went wrong. Please try again.");
      return;
    }

    onUpdated(data);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8 backdrop-blur-sm animate-backdrop-in sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Change status for ${app.name}`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full max-w-sm animate-sheet-in overflow-y-auto rounded-[28px] bg-card p-5 pt-3 shadow-modal backdrop-blur-xl"
      >
        <div className="mb-3 flex justify-center">
          <span className="h-1 w-9 rounded-full bg-border" />
        </div>

        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Update status
            </p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-ink">{app.name}</h2>
            {app.app_id && (
              <p className="mt-1 inline-block max-w-full truncate rounded-md bg-primary-light px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
                {app.app_id}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-soft transition-all duration-150 ease-spring hover:bg-surface active:scale-90"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {APP_STATUSES.map((status) => {
            const isCurrent = status === app.status;
            const isActive = status === "Active";
            const isSaving = saving === status;

            return (
              <button
                key={status}
                type="button"
                disabled={saving !== null}
                onClick={() => handleSelect(status)}
                className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-all duration-150 ease-spring active:scale-[0.98] disabled:opacity-60 ${
                  isCurrent
                    ? isActive
                      ? "border-success bg-success-light text-success"
                      : "border-danger bg-danger-light text-danger"
                    : "border-border text-ink hover:bg-surface"
                }`}
              >
                <span className="flex items-center gap-2">
                  {isActive ? (
                    <CircleCheck size={16} strokeWidth={2.5} />
                  ) : (
                    <TriangleAlert size={16} strokeWidth={2.5} />
                  )}
                  {status}
                </span>
                {isSaving && <Loader2 size={16} className="animate-spin" />}
                {isCurrent && !isSaving && (
                  <span className="text-xs font-medium opacity-70">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}
