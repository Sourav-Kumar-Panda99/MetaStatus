import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import DashboardClient from "@/components/DashboardClient";
import type { AppRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Dashboard</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            The current status of every app your team manages.
          </p>
        </div>
        <DashboardClient initialApps={(apps as AppRow[]) ?? []} />
      </main>
    </div>
  );
}
