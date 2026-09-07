"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Loader2, CircleCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const needsConfirm = searchParams.get("confirm") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Incorrect email or password. Please try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="animate-logo-pop flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-card">
          <LayoutGrid size={24} strokeWidth={2.25} />
        </div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink">App Status</h1>
        <p className="text-sm text-ink-soft">Sign in with your team account</p>
      </div>

      {justCreated && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl border border-success/30 bg-success-light px-4 py-3 text-sm text-success animate-item-in">
          <CircleCheck size={18} strokeWidth={2.5} className="mt-0.5 shrink-0" />
          <p>
            {needsConfirm
              ? "Account created! Check your email to confirm it, then log in below."
              : "Account created successfully! Log in below to get started."}
          </p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="animate-sheet-in rounded-[28px] border border-border bg-card p-6 shadow-card backdrop-blur-xl"
      >
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 ease-spring focus:border-primary focus:bg-card focus:outline-none"
          />
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-spring hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Log in
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-ink-faint">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
