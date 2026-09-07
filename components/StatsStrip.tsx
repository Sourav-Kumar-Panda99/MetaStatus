import { Grid3x3, TriangleAlert } from "lucide-react";
import type { AppRow } from "@/lib/types";

export default function StatsStrip({ apps }: { apps: AppRow[] }) {
  const total = apps.length;
  const needsAttention = apps.filter((a) => a.status !== "Active").length;

  return (
    <div className="mb-5 grid grid-cols-2 gap-4">
      <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-card backdrop-blur-xl transition-all duration-200 ease-spring hover:shadow-cardHover hover:brightness-125">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <Grid3x3 size={19} strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-3xl font-extrabold leading-none text-ink">{total}</p>
          <p className="mt-1 text-xs font-medium text-ink-soft">Total apps</p>
        </div>
      </div>

      <div
        className={`flex items-center gap-3.5 rounded-2xl border p-4 shadow-card backdrop-blur-xl transition-all duration-200 ease-spring hover:shadow-cardHover hover:brightness-125 ${
          needsAttention > 0
            ? "border-danger/50 animate-pulse-glow"
            : "border-border"
        }`}
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            needsAttention > 0
              ? "bg-danger-light text-danger"
              : "bg-success-light text-success"
          }`}
        >
          <TriangleAlert size={19} strokeWidth={2.25} />
        </span>
        <div>
          <p
            className={`text-3xl font-extrabold leading-none ${
              needsAttention > 0 ? "text-danger" : "text-success"
            }`}
          >
            {needsAttention}
          </p>
          <p className="mt-1 text-xs font-medium text-ink-soft">
            Needs attention
          </p>
        </div>
      </div>
    </div>
  );
}
