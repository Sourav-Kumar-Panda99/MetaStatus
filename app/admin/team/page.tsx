import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin } from "@/lib/profile";
import { listAllTeamMembers } from "@/app/actions";
import Header from "@/components/Header";
import TeamClient from "@/components/TeamClient";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isUserAdmin(supabase, user.id))) {
    redirect("/admin");
  }

  const { data: members } = await listAllTeamMembers();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">Team</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            Manage every teammate's access — promote admins or remove
            accounts entirely.
          </p>
        </div>
        <TeamClient initialMembers={members ?? []} currentUserId={user.id} />
      </main>
    </div>
  );
}
