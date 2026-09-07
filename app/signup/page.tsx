"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    const trimmedName = username.trim();
    if (!trimmedName) {
      setError("Please choose a display name.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // If email confirmation is off, Supabase returns an active session
    // immediately. Either way, send them to /login with a clear success
    // message instead of silently dropping them into the dashboard —
    // logging in explicitly afterward feels intentional, not stuck.
    if (data.session && data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({ id: data.user.id, username: trimmedName });

      if (profileError) {
        setLoading(false);
        setError(
          profileError.code === "23505"
            ? "That display name is already taken — try another."
            : profileError.message
        );
        return;
      }

      // Sign back out so they land on the login screen and log in with
      // their new credentials, rather than skipping straight to the
      // dashboard.
      await supabase.auth.signOut();
      router.push("/login?created=1");
      return;
    }

    setLoading(false);
    router.push("/login?created=1&confirm=1");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="animate-logo-pop flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
            <LayoutGrid size={24} strokeWidth={2.25} />
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-ink">App Status</h1>
          <p className="text-sm text-ink-soft">Create your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="animate-sheet-in rounded-[28px] border border-border bg-card p-6 shadow-card backdrop-blur-xl"
        >
          <div className="mb-4">
            <label
              htmlFor="username"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Display name
            </label>
            <input
              id="username"
              type="text"
              required
              maxLength={30}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 ease-spring focus:border-primary focus:bg-card focus:outline-none"
            />
            <p className="mt-1 text-xs text-ink-faint">
              Shown to teammates instead of your email.
            </p>
          </div>

          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 ease-spring focus:border-primary focus:bg-card focus:outline-none"
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 ease-spring focus:border-primary focus:bg-card focus:outline-none"
            />
          </div>

          {error && (
            <p className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
          {info && (
            <p className="mb-4 rounded-lg bg-success-light px-3 py-2 text-sm text-success">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-spring hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-faint">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
