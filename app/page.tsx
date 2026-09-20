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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Prelim Exams</span>
          <nav className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-zinc-500">{user.email}</span>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Prelim Exams</h1>
        <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
          Spaced-repetition drills for prelim exam prep. Pick a subject and start practicing —
          every problem is freshly generated, and your mastery of each topic is tracked as you go.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {SUBJECTS.map((subject) => (
            <Link
              key={subject.id}
              href={`/subjects/${subject.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
            >
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{subject.title}</h2>
              <p className="mt-1 text-sm text-zinc-500">{subject.description}</p>
              <p className="mt-3 text-xs text-zinc-400">{subject.topics.length} topics</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
