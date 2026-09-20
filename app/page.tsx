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
    <div className="flex min-h-screen flex-col bg-pf-bg">
      <header className="px-6 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="rounded-full bg-pf-primary-soft px-4 py-1.5 font-display text-lg text-pf-primary-dark">
            Prelim Exams
          </span>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <>
                <span className="text-pf-icon">{user.email}</span>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="text-pf-icon transition-colors hover:text-pf-primary">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-pf-primary px-5 py-2 font-medium text-white transition-colors hover:bg-pf-primary-dark"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
        <span className="text-sm font-medium text-pf-secondary">Spaced-repetition study drills</span>
        <h1 className="mt-2 font-display text-5xl leading-[1.05] text-pf-text sm:text-6xl">
          Pick a subject. Start drilling.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-pf-icon">
          Every problem is freshly generated, and your mastery of each topic is tracked as you go —
          the weaker a topic, the more often it comes back around.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="rounded-3xl border border-pf-border bg-pf-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h2 className="font-display text-xl text-pf-text">{subject.title}</h2>
              <p className="mt-2 text-sm text-pf-icon">{subject.description}</p>
              <p className="mt-4 inline-block rounded-full bg-pf-secondary-soft px-3 py-1 text-xs font-medium text-pf-secondary">
                {subject.topics.length} topics
              </p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
