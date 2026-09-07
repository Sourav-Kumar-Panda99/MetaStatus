"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import type { AppRow } from "@/lib/types";
import { useAppsRealtime } from "@/lib/use-apps-realtime";
import StatsStrip from "@/components/StatsStrip";
import AppCard from "@/components/AppCard";
import StatusModal from "@/components/StatusModal";
import TelegramConnectBanner from "@/components/TelegramConnectBanner";

export default function DashboardClient({
  initialApps,
}: {
  initialApps: AppRow[];
}) {
  const [apps, setApps] = useState<AppRow[]>(initialApps);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  useAppsRealtime(setApps);

  const selectedApp = apps.find((a) => a.id === selectedAppId) ?? null;

  function handleUpdated(updated: AppRow) {
    setApps((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedAppId(null);
  }

  return (
    <>
      <TelegramConnectBanner />
      <StatsStrip apps={apps} />

      {apps.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card py-16 backdrop-blur-xl text-center">
          <LayoutGrid size={28} className="text-ink-faint" />
          <p className="text-sm font-semibold text-ink">No apps yet</p>
          <p className="text-sm text-ink-soft">
            Add your first app from the Admin tab.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {apps.map((app, index) => (
            <div
              key={app.id}
              className="animate-item-in"
              style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
            >
              <AppCard app={app} onClick={() => setSelectedAppId(app.id)} />
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <StatusModal
          app={selectedApp}
          onClose={() => setSelectedAppId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
}
