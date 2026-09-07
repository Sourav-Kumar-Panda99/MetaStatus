"use client";

import { Clock } from "lucide-react";
import type { AppRow } from "@/lib/types";
import { getAppIcon } from "@/lib/app-icon";
import { formatRelativeTime } from "@/lib/format-time";
import StatusPill from "@/components/StatusPill";

export default function AppCard({
  app,
  onClick,
}: {
  app: AppRow;
  onClick: () => void;
}) {
  const { Icon, color } = getAppIcon(app.name || app.id);
  const isProblem = app.status !== "Active";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-4 rounded-2xl border bg-card p-4 backdrop-blur-xl text-left shadow-card transition-all duration-200 ease-spring hover:shadow-cardHover hover:-translate-y-0.5 hover:brightness-125 active:scale-[0.985] active:shadow-card ${
        isProblem ? "border-danger/40" : "border-border"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-200 ease-spring group-hover:scale-105"
          style={{ backgroundColor: color }}
        >
          <Icon size={20} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">
            {app.name}
          </p>
          {app.app_id && (
            <p className="mt-1 inline-block max-w-full truncate rounded-md bg-primary-light px-1.5 py-0.5 font-mono text-xs font-semibold text-primary">
              {app.app_id}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
            <Clock size={12} strokeWidth={2.25} />
            Updated {formatRelativeTime(app.updated_at)}
            {app.updated_by ? ` by ${app.updated_by}` : ""}
          </p>
        </div>
      </div>

      <div className="shrink-0">
        <StatusPill status={app.status} />
      </div>
    </button>
  );
}
