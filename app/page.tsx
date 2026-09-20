import Link from "next/link";
import { SUBJECTS } from "@/lib/subjects";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-mv-black">
      <header className="border-b border-mv-border bg-mv-black/95 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="font-display text-2xl tracking-wide text-mv-white">PRELIM EXAMS</span>
          <nav className="flex items-center gap-5 font-ui text-[11px] tracking-[0.12em] uppercase">
            {user ? (
              <>
                <span className="text-mv-dim">{user.email}</span>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="text-mv-dim transition-colors hover:text-mv-blue">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="border border-mv-white bg-mv-white px-4 py-2 text-mv-black transition-colors hover:border-mv-blue hover:bg-mv-blue hover:text-mv-white"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <span className="font-ui text-[11px] tracking-[0.25em] text-mv-dim uppercase">
          Spaced-repetition study drills
        </span>
        <h1 className="mt-2 font-display text-5xl leading-[0.92] tracking-wide text-mv-white sm:text-6xl">
          Pick a subject. Start drilling.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mv-text">
          Every problem is freshly generated, and your mastery of each topic is tracked as you go —
          the weaker a topic, the more often it comes back around.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="group relative overflow-hidden border border-mv-border bg-mv-surface p-6 transition-colors hover:border-mv-border-glow"
            >
              <h2 className="font-display text-xl tracking-wide text-mv-white">{subject.title}</h2>
              <p className="mt-2 text-sm text-mv-dim">{subject.description}</p>
              <p className="mt-4 font-ui text-[10px] tracking-[0.2em] text-mv-blue uppercase">
                {subject.topics.length} topics
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
