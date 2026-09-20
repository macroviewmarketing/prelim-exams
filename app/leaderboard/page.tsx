import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SUBJECTS } from "@/lib/subjects";
import Leaderboard, { type LeaderboardRow, type SubjectSummary } from "@/components/Leaderboard";
import ThemeToggle from "@/components/ThemeToggle";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leaderboard")
    .select("user_id, display_name, has_username, subject_id, mastered, topics_seen, attempts, correct");

  const subjectSummaries: SubjectSummary[] = SUBJECTS.map((s) => ({
    id: s.id,
    title: s.title,
    topicCount: s.topics.length,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-pf-bg">
      <header className="px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="text-sm font-medium text-pf-icon transition-colors hover:text-pf-primary">
            ← Subjects
          </Link>
          <span className="font-display text-lg text-pf-text">Leaderboard</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        <Leaderboard rows={(data as LeaderboardRow[]) ?? []} subjects={subjectSummaries} />
      </main>
    </div>
  );
}
