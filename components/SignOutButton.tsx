"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      aria-label="Sign out"
      title="Sign out"
      disabled={loading}
      className="flex h-8 w-8 items-center justify-center rounded-full sm:h-9 sm:w-9 text-white/85 transition-all duration-150 ease-spring hover:bg-white/15 hover:text-white active:scale-90 disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <LogOut size={18} strokeWidth={2.25} />
      )}
    </button>
  );
}
