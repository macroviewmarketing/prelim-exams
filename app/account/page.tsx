"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function AccountPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setEmail(data.user.email ?? null);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", data.user.id)
        .single();
      setUsername(profile?.username ?? "");
      setLoading(false);
    })();
  }, [supabase, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);

    if (!USERNAME_RE.test(username)) {
      setError("Username must be 3-20 characters: letters, numbers, underscore only.");
      return;
    }

    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      setSaving(false);
      router.push("/login");
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", data.user.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.code === "23505" ? "That username is taken — try another." : updateError.message);
      return;
    }
    setSaved(true);
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-pf-bg text-pf-icon">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pf-bg px-4">
      <div className="w-full max-w-sm rounded-3xl border border-pf-border bg-pf-surface p-8 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="font-display text-3xl text-pf-text">Account</h1>
          <ThemeToggle />
        </div>
        {email && <p className="mb-5 text-sm text-pf-icon">{email}</p>}
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="text-xs font-medium text-pf-icon" htmlFor="username">
            Display name (shown on the leaderboard)
          </label>
          <input
            id="username"
            type="text"
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded-full border border-pf-border bg-pf-input px-4 py-2.5 text-pf-text outline-none placeholder:text-pf-icon focus:border-pf-primary"
          />
          {error && <p className="text-sm text-pf-danger">{error}</p>}
          {saved && <p className="text-sm text-pf-success">Saved!</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-full bg-pf-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-pf-primary-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
        <p className="mt-4 text-sm text-pf-icon">
          <Link href="/" className="font-medium text-pf-primary underline">
            ← Back home
          </Link>
        </p>
      </div>
    </div>
  );
}
