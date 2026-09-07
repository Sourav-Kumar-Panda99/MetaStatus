import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/profile";
import Header from "@/components/Header";
import AdminClient from "@/components/AdminClient";
import type { AppRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: apps }, isAdmin] = await Promise.all([
    supabase.from("apps").select("*").order("name", { ascending: true }),
    user ? isUserAdmin(supabase, user.id) : Promise.resolve(false),
  ]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Admin</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {isAdmin
              ? "Add new apps or remove ones your team no longer tracks."
              : "Only admins can add or remove apps — you can still view what's tracked below."}
          </p>
        </div>
        <AdminClient initialApps={(apps as AppRow[]) ?? []} isAdmin={isAdmin} />
      </main>
    </div>
  );
}
