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
    <div className="flex min-h-screen flex-col bg-mv-black">
      <header className="border-b border-mv-border bg-mv-black/95 px-6 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link
            href="/"
            className="font-ui text-[11px] tracking-[0.12em] text-mv-dim uppercase transition-colors hover:text-mv-blue"
          >
            ← Subjects
          </Link>
          <h1 className="font-display text-lg tracking-wide text-mv-white">{subject.title}</h1>
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
