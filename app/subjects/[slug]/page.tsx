import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubject } from "@/lib/subjects";
import SubjectView from "@/components/SubjectView";
import FormulaSheet from "@/components/FormulaSheet";
import ThemeToggle from "@/components/ThemeToggle";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-pf-bg">
      <header className="px-6 py-5">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-pf-icon transition-colors hover:text-pf-primary"
          >
            ← Subjects
          </Link>
          <h1 className="font-display text-lg text-pf-text">{subject.title}</h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        <SubjectView
          subjectId={subject.id}
          hasTerms={!!subject.terms?.length}
          hasDrillTopics={subject.topics.some((t) => t.mode !== "reveal")}
        />
        {subject.formulaSheetHtml && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-8">
            <FormulaSheet html={subject.formulaSheetHtml} />
          </div>
        )}
      </main>
    </div>
  );
}
