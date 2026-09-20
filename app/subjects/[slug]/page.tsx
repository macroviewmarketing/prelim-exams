import { notFound } from "next/navigation";
import Link from "next/link";
import { getSubject } from "@/lib/subjects";
import Drill from "@/components/Drill";
import FormulaSheet from "@/components/FormulaSheet";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            ← Subjects
          </Link>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{subject.title}</h1>
          <span />
        </div>
      </header>
      <main className="flex-1">
        <Drill subjectId={subject.id} />
        {subject.formulaSheetHtml && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-8">
            <FormulaSheet html={subject.formulaSheetHtml} />
          </div>
        )}
      </main>
    </div>
  );
}
