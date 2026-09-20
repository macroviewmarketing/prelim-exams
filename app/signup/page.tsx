"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-pf-bg px-4">
      <div className="w-full max-w-sm rounded-3xl border border-pf-border bg-pf-surface p-8 shadow-sm">
        <h1 className="mb-5 font-display text-3xl text-pf-text">Sign up</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-full border border-pf-border bg-white px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-full border border-pf-border bg-white px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary"
          />
          {error && <p className="text-sm text-pf-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-pf-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-pf-primary-dark disabled:opacity-50"
          >
            {loading ? "Signing up…" : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-sm text-pf-icon">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-pf-primary underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
