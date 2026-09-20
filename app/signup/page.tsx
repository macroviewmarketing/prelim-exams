"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!USERNAME_RE.test(username)) {
      setError("Username must be 3-20 characters: letters, numbers, underscore only.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    if (data.user) {
      const { error: usernameError } = await supabase
        .from("profiles")
        .update({ username })
        .eq("id", data.user.id);
      if (usernameError) {
        setLoading(false);
        setError(
          usernameError.code === "23505"
            ? "That username is taken — try another."
            : usernameError.message,
        );
        return;
      }
    }

    setLoading(false);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-pf-bg px-4">
      <div className="w-full max-w-sm rounded-3xl border border-pf-border bg-pf-surface p-8 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-display text-3xl text-pf-text">Sign up</h1>
          <ThemeToggle />
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-full border border-pf-border bg-pf-input px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-full border border-pf-border bg-pf-input px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-full border border-pf-border bg-pf-input px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary"
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
