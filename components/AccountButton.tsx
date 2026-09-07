"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import UsernameModal from "@/components/UsernameModal";

export default function AccountButton() {
  const [username, setUsername] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [required, setRequired] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoaded(true);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      if (data?.username) {
        setUsername(data.username);
      } else {
        // First time this teammate is here — ask them to pick a name
        // before they can do anything else.
        setRequired(true);
        setModalOpen(true);
      }
      setLoaded(true);
    }
    load();
  }, []);

  if (!loaded) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setRequired(false);
          setModalOpen(true);
        }}
        title="Edit your display name"
        className="flex h-8 items-center gap-1.5 rounded-full px-2 sm:h-9 sm:px-2.5 text-sm font-medium text-white/85 transition-all duration-150 ease-spring hover:bg-white/15 hover:text-white active:scale-90"
      >
        <UserRound size={16} strokeWidth={2.25} />
        <span className="hidden max-w-[100px] truncate sm:inline">
          {username ?? "Set name"}
        </span>
      </button>

      {modalOpen && (
        <UsernameModal
          currentUsername={username}
          required={required}
          onClose={() => setModalOpen(false)}
          onSaved={(name) => {
            setUsername(name);
            setRequired(false);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}
