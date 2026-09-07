"use client";

import { useState, type FormEvent } from "react";
import { Plus, Trash2, Loader2, LayoutGrid, ShieldAlert } from "lucide-react";
import type { AppRow } from "@/lib/types";
import { getAppIcon } from "@/lib/app-icon";
import { useAppsRealtime } from "@/lib/use-apps-realtime";
import StatusPill from "@/components/StatusPill";
import { addApp, removeApp } from "@/app/actions";

export default function AdminClient({
  initialApps,
  isAdmin,
}: {
  initialApps: AppRow[];
  isAdmin: boolean;
}) {
  const [apps, setApps] = useState<AppRow[]>(initialApps);
  const [name, setName] = useState("");
  const [appId, setAppId] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useAppsRealtime(setApps);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setAdding(true);
    setError(null);

    const { data, error: err } = await addApp(name, appId);

    setAdding(false);

    if (err || !data) {
      setError(err ?? "Couldn't add the app. Please try again.");
      return;
    }

    setApps((prev) =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
    );
    setName("");
    setAppId("");
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);

    const { error: err } = await removeApp(id);

    setRemovingId(null);

    if (err) {
      setError(err);
      return;
    }

    setApps((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <>
      {!isAdmin && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-card backdrop-blur-xl">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
            <ShieldAlert size={17} strokeWidth={2.25} />
          </span>
          <p className="text-sm text-ink-soft">
            <span className="font-semibold text-ink">Admins only.</span>{" "}
            You can view the apps below, but adding or removing them
            requires admin access. Ask a team admin if you need this.
          </p>
        </div>
      )}

      {isAdmin && (
        <form
          onSubmit={handleAdd}
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-card backdrop-blur-xl sm:flex-row sm:items-start"
        >
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="New app name, e.g. Consumer iOS"
              className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 ease-spring focus:border-primary focus:bg-card focus:outline-none"
            />
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="App ID (optional), e.g. com.example.app"
              className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink-faint placeholder:font-sans transition-all duration-200 ease-spring focus:border-primary focus:bg-card focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-spring hover:bg-primary-dark active:scale-[0.97] disabled:opacity-60"
          >
            {adding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} strokeWidth={2.5} />
            )}
            Add app
          </button>
        </form>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {apps.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 backdrop-blur-xl text-center">
          <LayoutGrid size={28} className="text-ink-faint" />
          <p className="text-sm font-semibold text-ink">No apps yet</p>
          <p className="text-sm text-ink-soft">
            {isAdmin
              ? "Add your first app above."
              : "An admin hasn't added any apps yet."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((app, index) => {
            const { Icon, color } = getAppIcon(app.name || app.id);
            const isRemoving = removingId === app.id;

            return (
              <div
                key={app.id}
                className={`animate-item-in flex items-center justify-between gap-4 rounded-2xl border bg-card p-4 shadow-card backdrop-blur-xl transition-all duration-200 ease-spring hover:shadow-cardHover hover:brightness-125 ${
                  app.status !== "Active" ? "border-danger/40" : "border-border"
                }`}
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <span
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
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
                    <div className="mt-1">
                      <StatusPill status={app.status} />
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleRemove(app.id)}
                    disabled={isRemoving}
                    aria-label={`Remove ${app.name}`}
                    title={`Remove ${app.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint transition-all duration-150 ease-spring hover:bg-danger-light hover:text-danger active:scale-90 disabled:opacity-60"
                  >
                    {isRemoving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
