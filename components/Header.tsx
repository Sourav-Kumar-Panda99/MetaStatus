"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import SignOutButton from "@/components/SignOutButton";
import NotificationBell from "@/components/NotificationBell";
import AccountButton from "@/components/AccountButton";
import TelegramLinkButton from "@/components/TelegramLinkButton";

const BASE_TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
];

export default function Header() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      setIsAdmin(!!data?.is_admin);
    }
    check();
  }, []);

  const tabs = isAdmin
    ? [...BASE_TABS, { href: "/admin/team", label: "Team" }]
    : BASE_TABS;

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-primary/85 shadow-sm backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 transition-transform duration-200 ease-spring active:scale-95"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
              <LayoutGrid size={18} strokeWidth={2.25} />
            </span>
            <span className="hidden text-[17px] font-bold tracking-tight text-white sm:inline">
              App Status
            </span>
          </Link>

          <nav className="flex h-14 items-center gap-0.5 sm:gap-1">
            {tabs.map((tab) => {
              const isActive =
                tab.href === "/"
                  ? pathname === "/"
                  : pathname === tab.href ||
                    (tab.href === "/admin" && pathname.startsWith("/admin") && pathname !== "/admin/team");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative flex h-14 items-center whitespace-nowrap px-2 text-sm font-semibold transition-colors duration-200 sm:px-3 ${
                    isActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full bg-white transition-all duration-300 ease-spring ${
                      isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <AccountButton />
          <TelegramLinkButton />
          <NotificationBell />
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
