"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AppRow } from "@/lib/types";

/**
 * Subscribes to live changes on the `apps` table and keeps the given
 * state setter in sync — insert, update, and delete, from any user, any
 * tab, any device. No polling, no manual refresh needed.
 */
export function useAppsRealtime(
  setApps: React.Dispatch<React.SetStateAction<AppRow[]>>
) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("apps-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "apps" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const inserted = payload.new as AppRow;
            setApps((prev) =>
              prev.some((a) => a.id === inserted.id)
                ? prev
                : [...prev, inserted].sort((a, b) =>
                    a.name.localeCompare(b.name)
                  )
            );
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as AppRow;
            setApps((prev) =>
              prev.map((a) => (a.id === updated.id ? updated : a))
            );
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id: string }).id;
            setApps((prev) => prev.filter((a) => a.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setApps]);
}
