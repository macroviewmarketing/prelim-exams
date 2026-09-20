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
    <div className="flex min-h-screen items-center justify-center bg-mv-black px-4">
      <div className="w-full max-w-sm border border-mv-border bg-mv-surface p-7">
        <h1 className="mb-5 font-display text-3xl tracking-wide text-mv-white">Sign up</h1>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-mv-border bg-mv-black px-3 py-2.5 text-mv-white outline-none placeholder:text-mv-dim focus:border-mv-blue"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-mv-border bg-mv-black px-3 py-2.5 text-mv-white outline-none placeholder:text-mv-dim focus:border-mv-blue"
          />
          {error && <p className="text-sm text-mv-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 border border-mv-white bg-mv-white px-4 py-2.5 font-ui text-[11px] tracking-[0.16em] text-mv-black uppercase transition-colors hover:border-mv-blue hover:bg-mv-blue hover:text-mv-white disabled:opacity-50"
          >
            {loading ? "Signing up…" : "Sign up"}
          </button>
        </form>
        <p className="mt-4 text-sm text-mv-dim">
          Already have an account?{" "}
          <Link href="/login" className="text-mv-blue underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
